import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import supportTicketsService from '../../services/support-tickets'
import supportAuditService from '../../services/support-audit'

const createTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: supportTicketsController.createTicket - body not provided!`)
        }
        const ticket = await supportTicketsService.createTicket({ ...req.body, workspaceId: req.user?.activeWorkspaceId })
        return res.status(StatusCodes.OK).json(ticket)
    } catch (error) {
        next(error)
    }
}

const getTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id
        if (!id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: supportTicketsController.getTicket - id not provided!`)
        }
        const ticket = await supportTicketsService.getTicketById(id)
        if (!ticket) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Ticket not found' })
        return res.status(StatusCodes.OK).json(ticket)
    } catch (error) {
        next(error)
    }
}

const listTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { chatflowid, status, channel, limit, offset } = req.query as any
        const result = await supportTicketsService.listTickets({
            workspaceId: req.user?.activeWorkspaceId,
            chatflowid,
            status,
            channel,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined
        })
        return res.status(StatusCodes.OK).json(result)
    } catch (error) {
        next(error)
    }
}

const updateTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id
        if (!id) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: supportTicketsController.updateTicket - id not provided!`)
        }
        if (!req.body) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, `Error: supportTicketsController.updateTicket - body not provided!`)
        }
        const updated = await supportTicketsService.updateTicket(id, req.body)
        if (!updated) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Ticket not found' })

        // 审计：工单更新
        try {
            await supportAuditService.record({
                action: 'ticket.updated',
                workspaceId: req.user?.activeWorkspaceId || 'unknown',
                actorUserId: (req.user as any)?.id,
                chatflowid: updated.chatflowid,
                channel: updated.channel,
                ticketId: updated.id,
                message: 'ticket updated',
                payload: req.body
            })
        } catch {
            // ignore audit failure
        }
        return res.status(StatusCodes.OK).json(updated)
    } catch (error) {
        next(error)
    }
}

export default {
    createTicket,
    getTicket,
    listTickets,
    updateTicket
}

