import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { ChatType } from '../../Interface'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { createMockRequest } from '../../utils/mockRequest'
import { utilBuildChatflow } from '../../utils/buildChatflow'

type InboundChannelMessage = {
    chatflowid: string
    text: string
    externalUserId: string
    metadata?: any
}

const runChannelMessage = async (req: Request, body: InboundChannelMessage) => {
    const chatId = `${req.params.channel}:${body.externalUserId}`
    const mockReq = createMockRequest({
        chatflowId: body.chatflowid,
        sourceRequest: req,
        body: {
            question: body.text,
            chatId,
            streaming: false,
            overrideConfig: {
                channel: req.params.channel,
                externalUserId: body.externalUserId,
                ...(body.metadata ? { metadata: body.metadata } : {})
            }
        }
    })

    return await utilBuildChatflow(mockReq, true, ChatType.EXTERNAL)
}

/**
 * Unified webhook endpoint for multiple channels (MVP).
 *
 * POST /api/v1/support/channels/:channel/webhook
 */
const webhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const channel = req.params.channel
        if (!channel) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'channel not provided')
        }
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'body not provided')
        }

        const { chatflowid, text, externalUserId, metadata } = req.body as InboundChannelMessage
        if (!chatflowid || !text || !externalUserId) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'chatflowid/text/externalUserId are required for channel webhook'
            )
        }

        const result = await runChannelMessage(req, { chatflowid, text, externalUserId, metadata })
        return res.status(StatusCodes.OK).json({
            ok: true,
            channel,
            chatId: result?.chatId,
            text: result?.text ?? '',
            raw: result
        })
    } catch (error) {
        // Keep webhook response predictable for channel adapters
        const message = error instanceof Error ? error.message : getErrorMessage(error)
        return res.status(StatusCodes.BAD_REQUEST).json({ ok: false, error: message })
    }
}

export default {
    webhook
}

