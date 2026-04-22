import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import supportUsageService from '../../services/support-usage'

const getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' })
        const { startAt, endAt, channel, chatflowid } = req.query as any
        const result = await supportUsageService.getSummary({ workspaceId, startAt, endAt, channel, chatflowid })
        return res.status(StatusCodes.OK).json(result)
    } catch (error) {
        next(error)
    }
}

const getKpis = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' })
        const { startAt, endAt, channel, chatflowid } = req.query as any
        if (!startAt || !endAt) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'startAt/endAt required' })
        const result = await supportUsageService.getKpis({ workspaceId, startAt, endAt, channel, chatflowid })
        return res.status(StatusCodes.OK).json(result)
    } catch (error) {
        next(error)
    }
}

export default {
    getSummary,
    getKpis
}

