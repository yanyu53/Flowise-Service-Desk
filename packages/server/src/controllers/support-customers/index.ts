import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import supportCustomersService from '../../services/support-customers'

const listCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { channel, externalUserId, limit, offset } = req.query as any
        const result = await supportCustomersService.listCustomers({
            workspaceId: req.user?.activeWorkspaceId,
            channel,
            externalUserId,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined
        })
        return res.status(StatusCodes.OK).json(result)
    } catch (error) {
        next(error)
    }
}

const listConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { chatflowid, channel, customerId, ticketId, status, startAt, endAt, limit, offset } = req.query as any
        const result = await supportCustomersService.listConversations({
            chatflowid,
            channel,
            customerId,
            ticketId,
            status,
            startAt,
            endAt,
            workspaceId: req.user?.activeWorkspaceId,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined
        })
        return res.status(StatusCodes.OK).json(result)
    } catch (error) {
        next(error)
    }
}

const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await supportCustomersService.getSupportDashboardMetrics({ workspaceId: req.user?.activeWorkspaceId })
        return res.status(StatusCodes.OK).json(result)
    } catch (error) {
        next(error)
    }
}

export default {
    listCustomers,
    listConversations,
    getDashboard
}

