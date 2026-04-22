import { StatusCodes } from 'http-status-codes'
import { v4 as uuidv4 } from 'uuid'
import { SupportChannel } from '../../Interface'
import { SupportAuditAction, SupportAuditEvent } from '../../database/entities/SupportAuditEvent'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

const normalizeChannel = (channel?: string): SupportChannel => {
    const c = (channel || '').toLowerCase()
    if (c === 'feishu' || c === 'lark') return 'feishu'
    if (c === 'wecom') return 'wecom'
    if (c === 'dingtalk') return 'dingtalk'
    if (c === 'mp') return 'mp'
    if (c === 'web') return 'web'
    return 'unknown'
}

const stringifyIfNeeded = (v: any): string | undefined => {
    if (v === null || typeof v === 'undefined') return undefined
    if (typeof v === 'string') return v
    return JSON.stringify(v)
}

export async function record(params: {
    action: SupportAuditAction
    workspaceId: string
    actorUserId?: string
    chatflowid?: string
    channel?: string
    customerId?: string
    conversationId?: string
    ticketId?: string
    message?: string
    payload?: any
}) {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(SupportAuditEvent)

        const e = new SupportAuditEvent()
        e.id = uuidv4()
        e.action = params.action
        e.workspaceId = params.workspaceId
        e.actorUserId = params.actorUserId
        e.chatflowid = params.chatflowid
        e.channel = normalizeChannel(params.channel)
        e.customerId = params.customerId
        e.conversationId = params.conversationId
        e.ticketId = params.ticketId
        e.message = params.message
        e.payload = stringifyIfNeeded(params.payload)

        await repo.save(repo.create(e))
        return e
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: supportAuditService.record - ${getErrorMessage(error)}`)
    }
}

export async function list(params: { workspaceId: string; action?: string; ticketId?: string; limit?: number; offset?: number }) {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(SupportAuditEvent)
        const qb = repo.createQueryBuilder('e').where('e.workspaceId = :workspaceId', { workspaceId: params.workspaceId }).orderBy('e.createdDate', 'DESC')

        if (params.action) qb.andWhere('e.action = :action', { action: String(params.action) })
        if (params.ticketId) qb.andWhere('e.ticketId = :ticketId', { ticketId: String(params.ticketId) })

        const limit = Math.min(Math.max(params.limit ?? 50, 1), 200)
        const offset = Math.max(params.offset ?? 0, 0)
        qb.take(limit).skip(offset)

        const [items, total] = await qb.getManyAndCount()
        return { items, total, limit, offset }
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: supportAuditService.list - ${getErrorMessage(error)}`)
    }
}

export async function getSummary(params: { workspaceId: string; startAt: string; endAt: string }) {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(SupportAuditEvent)
        const qb = repo
            .createQueryBuilder('e')
            .where('e.workspaceId = :workspaceId', { workspaceId: params.workspaceId })
            .andWhere('e.createdDate >= :startAt', { startAt: new Date(String(params.startAt)).toISOString() })
            .andWhere('e.createdDate <= :endAt', { endAt: new Date(String(params.endAt)).toISOString() })

        const [handoffCreated, ticketUpdated, complianceBlocked] = await Promise.all([
            qb.clone().andWhere('e.action = :action', { action: 'handoff.created' }).getCount(),
            qb.clone().andWhere('e.action = :action', { action: 'ticket.updated' }).getCount(),
            qb.clone().andWhere('e.action = :action', { action: 'compliance.blocked' }).getCount()
        ])

        return {
            window: { startAt: params.startAt, endAt: params.endAt },
            counts: {
                'handoff.created': handoffCreated,
                'ticket.updated': ticketUpdated,
                'compliance.blocked': complianceBlocked
            }
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: supportAuditService.getSummary - ${getErrorMessage(error)}`
        )
    }
}

export default {
    record,
    list,
    getSummary
}

