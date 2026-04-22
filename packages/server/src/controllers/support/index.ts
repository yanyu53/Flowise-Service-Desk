import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import leadsService from '../../services/leads'
import supportTicketsService from '../../services/support-tickets'
import supportCustomersService from '../../services/support-customers'
import supportUsageService from '../../services/support-usage'
import supportAuditService from '../../services/support-audit'
import logger from '../../utils/logger'

/**
 * MVP: 转人工/留资/工单入口
 *
 * 先复用 Lead 表快速闭环（chatflowid + 联系方式 + chatId）。
 * 后续可以升级为独立 SupportTicket 实体，加入 issue/渠道/标签/状态/负责人等字段。
 */
const handoffToHuman = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: supportController.handoffToHuman - body not provided!`)
        }

        const { chatflowid, name, email, phone, chatId, issue, channel } = req.body ?? {}
        if (!chatflowid) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: supportController.handoffToHuman - chatflowid not provided!`)
        }
        if (!email && !phone) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: supportController.handoffToHuman - email or phone must be provided!`
            )
        }

        // Create a ticket (primary source of truth)
        const ticket = await supportTicketsService.createTicket({
            workspaceId: req.user?.activeWorkspaceId,
            chatflowid,
            chatId,
            name,
            email,
            phone,
            issue,
            channel
        })

        // Keep Lead for backward-compat / lightweight list view
        const lead = await leadsService.createLead({ chatflowid, name, email, phone, chatId: ticket.chatId })

        // Link ticket back to conversation (for traceability)
        try {
            if (ticket?.chatId) {
                const { customer, conversation } = await supportCustomersService.upsertCustomerAndConversation({
                    workspaceId: req.user?.activeWorkspaceId,
                    chatflowid,
                    chatId: ticket.chatId,
                    channel,
                    name,
                    email,
                    phone,
                    ticketId: ticket.id,
                    lastUserMessage: issue,
                    metadata: { channel, ticketId: ticket.id }
                })

                await supportUsageService.recordEvent({
                    type: 'handoff',
                    workspaceId: req.user?.activeWorkspaceId || 'unknown',
                    chatflowid,
                    channel,
                    customerId: customer?.id,
                    conversationId: conversation?.id,
                    ticketId: ticket.id,
                    metadata: { channel, ticketId: ticket.id }
                })

                await supportAuditService.record({
                    action: 'handoff.created',
                    workspaceId: req.user?.activeWorkspaceId || 'unknown',
                    actorUserId: (req.user as any)?.id,
                    chatflowid,
                    channel,
                    customerId: customer?.id,
                    conversationId: conversation?.id,
                    ticketId: ticket.id,
                    message: 'handoff created',
                    payload: { channel, issue }
                })
            }
        } catch (e) {
            logger.warn(`[support]: failed to link ticket to conversation: ${String(e)}`)
        }

        // In MVP we don't persist issue/channel; log it for operators.
        logger.info(
            `[support]: handoff requested chatflowid=${chatflowid} chatId=${lead.chatId} leadId=${lead.id} channel=${channel || 'unknown'}`
        )
        if (issue) {
            logger.info(`[support]: handoff issue leadId=${lead.id}: ${String(issue).slice(0, 5000)}`)
        }

        return res.status(StatusCodes.OK).json({
            ok: true,
            ticketId: ticket.id,
            leadId: lead.id,
            chatId: ticket.chatId,
            message: '已提交人工协助请求，我们会尽快联系你。'
        })
    } catch (error) {
        next(error)
    }
}

export default {
    handoffToHuman
}

