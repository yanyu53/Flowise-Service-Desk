import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import supportAuditService from '../../services/support-audit'

const list = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' })
        const { action, ticketId, limit, offset } = req.query as any
        const result = await supportAuditService.list({
            workspaceId,
            action,
            ticketId,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined
        })
        return res.status(StatusCodes.OK).json(result)
    } catch (error) {
        next(error)
    }
}

const getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' })
        const { startAt, endAt } = req.query as any
        if (!startAt || !endAt) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'startAt/endAt required' })
        const result = await supportAuditService.getSummary({ workspaceId, startAt, endAt })
        return res.status(StatusCodes.OK).json(result)
    } catch (error) {
        next(error)
    }
}

export default {
    list,
    getSummary
}

