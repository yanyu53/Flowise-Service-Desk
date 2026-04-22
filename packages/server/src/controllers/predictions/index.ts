import { Request, Response, NextFunction } from 'express'
import { RateLimiterManager } from '../../utils/rateLimit'
import chatflowsService from '../../services/chatflows'
import logger from '../../utils/logger'
import predictionsServices from '../../services/predictions'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { v4 as uuidv4 } from 'uuid'
import { getErrorMessage } from '../../errors/utils'
import { MODE } from '../../Interface'
import { assertCustomerSupportCompliance, ComplianceBlockedError, maskSensitiveText } from '../../support/compliance'
import supportCustomersService from '../../services/support-customers'
import supportUsageService from '../../services/support-usage'
import supportAuditService from '../../services/support-audit'

// Send input message and get prediction result (External)
const createPrediction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const startedAt = Date.now()
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: predictionsController.createPrediction - id not provided!`
            )
        }
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: predictionsController.createPrediction - body not provided!`
            )
        }
        const workspaceId = req.user?.activeWorkspaceId

        // Customer-support compliance guardrail (MVP)
        try {
            assertCustomerSupportCompliance(req.body?.question)
        } catch (e) {
            if (e instanceof ComplianceBlockedError) {
                // 审计：合规拦截
                try {
                    await supportAuditService.record({
                        action: 'compliance.blocked',
                        workspaceId: req.user?.activeWorkspaceId || 'unknown',
                        actorUserId: (req.user as any)?.id,
                        chatflowid: req.params.id,
                        channel: req.body?.overrideConfig?.channel,
                        message: 'compliance blocked',
                        payload: {
                            hit: true,
                            channel: req.body?.overrideConfig?.channel
                        }
                    })
                } catch {
                    // ignore audit failure
                }
                const isStreamingRequested = req.body?.streaming === 'true' || req.body?.streaming === true
                if (isStreamingRequested) {
                    return res.status(StatusCodes.BAD_REQUEST).send(e.blockMessage)
                }
                throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, e.blockMessage)
            }
            throw e
        }

        const chatflow = await chatflowsService.getChatflowById(req.params.id, workspaceId)
        if (!chatflow) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${req.params.id} not found`)
        }
        let isDomainAllowed = true
        let unauthorizedOriginError = 'This site is not allowed to access this chatbot'
        logger.info(`[server]: Request originated from ${req.headers.origin || 'UNKNOWN ORIGIN'}`)
        if (chatflow.chatbotConfig) {
            const parsedConfig = JSON.parse(chatflow.chatbotConfig)
            // check whether the first one is not empty. if it is empty that means the user set a value and then removed it.
            const isValidAllowedOrigins = parsedConfig.allowedOrigins?.length && parsedConfig.allowedOrigins[0] !== ''
            unauthorizedOriginError = parsedConfig.allowedOriginsError || 'This site is not allowed to access this chatbot'
            if (isValidAllowedOrigins && req.headers.origin) {
                const originHeader = req.headers.origin
                const origin = new URL(originHeader).host
                isDomainAllowed =
                    parsedConfig.allowedOrigins.filter((domain: string) => {
                        try {
                            const allowedOrigin = new URL(domain).host
                            return origin === allowedOrigin
                        } catch (e) {
                            return false
                        }
                    }).length > 0
            }
        }
        if (isDomainAllowed) {
            const streamable = await chatflowsService.checkIfChatflowIsValidForStreaming(req.params.id)
            const isStreamingRequested = req.body.streaming === 'true' || req.body.streaming === true
            if (streamable?.isStreaming && isStreamingRequested) {
                const sseStreamer = getRunningExpressApp().sseStreamer

                let chatId = req.body.chatId
                if (!req.body.chatId) {
                    chatId = req.body.chatId ?? req.body.overrideConfig?.sessionId ?? uuidv4()
                    req.body.chatId = chatId
                }
                const isQueueMode = process.env.MODE === MODE.QUEUE
                try {
                    sseStreamer.addExternalClient(chatId, res)
                    res.setHeader('Content-Type', 'text/event-stream')
                    res.setHeader('Cache-Control', 'no-cache')
                    res.setHeader('Connection', 'keep-alive')
                    res.setHeader('X-Accel-Buffering', 'no') //nginx config: https://serverfault.com/a/801629
                    res.flushHeaders()

                    if (isQueueMode) {
                        await getRunningExpressApp().redisSubscriber.subscribe(chatId)
                    }

                    const apiResponse = await predictionsServices.buildChatflow(req)
                    sseStreamer.streamMetadataEvent(apiResponse.chatId, apiResponse)
                } catch (error) {
                    if (chatId) {
                        sseStreamer.streamErrorEvent(chatId, getErrorMessage(error))
                    }
                    next(error)
                } finally {
                    if (isQueueMode && chatId) {
                        await getRunningExpressApp().redisSubscriber.unsubscribe(chatId)
                    }
                    sseStreamer.removeClient(chatId)
                }
            } else {
                const apiResponse = await predictionsServices.buildChatflow(req)

                // 第2周：客户/会话中心（自动落库关联）
                try {
                    const chatId = (apiResponse as any)?.chatId || req.body?.chatId
                    if (chatId) {
                        const { customer, conversation } = await supportCustomersService.upsertCustomerAndConversation({
                            workspaceId: req.user?.activeWorkspaceId,
                            chatflowid: req.params.id,
                            chatId: String(chatId),
                            channel: req.body?.overrideConfig?.channel,
                            externalUserId: req.body?.overrideConfig?.externalUserId,
                            ticketId: req.body?.overrideConfig?.ticketId,
                            lastUserMessage: req.body?.question,
                            metadata: req.body?.overrideConfig
                        })

                        // 成本治理（MVP）：记录一次 usage event（token/cost 暂缺时可为 undefined）
                        await supportUsageService.recordEvent({
                            type: 'prediction',
                            workspaceId: req.user?.activeWorkspaceId || (req as any).user?.activeWorkspaceId || 'unknown',
                            chatflowid: req.params.id,
                            channel: req.body?.overrideConfig?.channel,
                            customerId: customer?.id,
                            conversationId: conversation?.id,
                            ticketId: conversation?.ticketId,
                            latencyMs: Date.now() - startedAt,
                            metadata: {
                                channel: req.body?.overrideConfig?.channel,
                                externalUserId: req.body?.overrideConfig?.externalUserId
                            }
                        })
                    }
                } catch (e) {
                    // 不阻断主流程，仅记录
                    logger.warn(`[support]: failed to upsert customer/conversation: ${getErrorMessage(e)}`)
                }

                // 基础合规：输出脱敏（仅对 text 做处理，其他结构保持不变）
                if (apiResponse && typeof apiResponse === 'object' && typeof (apiResponse as any).text === 'string') {
                    ;(apiResponse as any).text = maskSensitiveText((apiResponse as any).text) as any
                }
                return res.json(apiResponse)
            }
        } else {
            const isStreamingRequested = req.body.streaming === 'true' || req.body.streaming === true
            if (isStreamingRequested) {
                return res.status(StatusCodes.FORBIDDEN).send(unauthorizedOriginError)
            }
            throw new InternalFlowiseError(StatusCodes.FORBIDDEN, unauthorizedOriginError)
        }
    } catch (error) {
        next(error)
    }
}

const getRateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        return RateLimiterManager.getInstance().getRateLimiter()(req, res, next)
    } catch (error) {
        next(error)
    }
}

export default {
    createPrediction,
    getRateLimiterMiddleware
}
