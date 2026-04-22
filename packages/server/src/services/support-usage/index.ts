import { StatusCodes } from 'http-status-codes'
import { v4 as uuidv4 } from 'uuid'
import { SupportChannel } from '../../Interface'
import { SupportUsageEvent, SupportUsageEventType } from '../../database/entities/SupportUsageEvent'
import { SupportConversation } from '../../database/entities/SupportConversation'
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

export async function recordEvent(input: {
    type: SupportUsageEventType
    workspaceId: string
    chatflowid?: string
    channel?: string
    customerId?: string
    conversationId?: string
    ticketId?: string
    model?: string
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
    costUsd?: string
    latencyMs?: number
    metadata?: any
}) {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(SupportUsageEvent)

        const e = new SupportUsageEvent()
        e.id = uuidv4()
        e.type = input.type
        e.workspaceId = input.workspaceId
        e.chatflowid = input.chatflowid
        e.channel = normalizeChannel(input.channel)
        e.customerId = input.customerId
        e.conversationId = input.conversationId
        e.ticketId = input.ticketId
        e.model = input.model
        e.promptTokens = input.promptTokens
        e.completionTokens = input.completionTokens
        e.totalTokens = input.totalTokens
        e.costUsd = input.costUsd
        e.latencyMs = typeof input.latencyMs === 'number' ? Math.max(0, Math.floor(input.latencyMs)) : undefined
        e.metadata = stringifyIfNeeded(input.metadata)

        await repo.save(repo.create(e))
        return e
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: supportUsageService.recordEvent - ${getErrorMessage(error)}`)
    }
}

export async function getSummary(query: { workspaceId: string; startAt?: string; endAt?: string; channel?: string; chatflowid?: string }) {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(SupportUsageEvent)
        const qb = repo.createQueryBuilder('e').where('e.workspaceId = :workspaceId', { workspaceId: query.workspaceId })

        if (query.channel) qb.andWhere('e.channel = :channel', { channel: normalizeChannel(query.channel) })
        if (query.chatflowid) qb.andWhere('e.chatflowid = :chatflowid', { chatflowid: String(query.chatflowid) })
        if (query.startAt) qb.andWhere('e.createdDate >= :startAt', { startAt: new Date(String(query.startAt)).toISOString() })
        if (query.endAt) qb.andWhere('e.createdDate <= :endAt', { endAt: new Date(String(query.endAt)).toISOString() })

        const [total, predictions, handoffs] = await Promise.all([
            qb.getCount(),
            qb.clone().andWhere('e.type = :type', { type: 'prediction' }).getCount(),
            qb.clone().andWhere('e.type = :type', { type: 'handoff' }).getCount()
        ])

        // derive linked conversations count (scoped to workspace + filters)
        const convRepo = appServer.AppDataSource.getRepository(SupportConversation)
        const convQb = convRepo.createQueryBuilder('c').where('c.workspaceId = :workspaceId', { workspaceId: query.workspaceId })
        if (query.channel) convQb.andWhere('c.channel = :channel', { channel: normalizeChannel(query.channel) })
        if (query.chatflowid) convQb.andWhere('c.chatflowid = :chatflowid', { chatflowid: String(query.chatflowid) })
        if (query.startAt) convQb.andWhere('c.updatedDate >= :startAt', { startAt: new Date(String(query.startAt)).toISOString() })
        if (query.endAt) convQb.andWhere('c.updatedDate <= :endAt', { endAt: new Date(String(query.endAt)).toISOString() })
        const conversations = await convQb.getCount()

        return {
            totalEvents: total,
            predictions,
            handoffs,
            conversations
        }
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: supportUsageService.getSummary - ${getErrorMessage(error)}`)
    }
}

export async function getKpis(query: { workspaceId: string; startAt: string; endAt: string; channel?: string; chatflowid?: string }) {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(SupportUsageEvent)

        const qb = repo.createQueryBuilder('e').where('e.workspaceId = :workspaceId', { workspaceId: query.workspaceId })
        if (query.channel) qb.andWhere('e.channel = :channel', { channel: normalizeChannel(query.channel) })
        if (query.chatflowid) qb.andWhere('e.chatflowid = :chatflowid', { chatflowid: String(query.chatflowid) })
        qb.andWhere('e.createdDate >= :startAt', { startAt: new Date(String(query.startAt)).toISOString() })
        qb.andWhere('e.createdDate <= :endAt', { endAt: new Date(String(query.endAt)).toISOString() })

        const [predictions, handoffs, avgLatencyRow] = await Promise.all([
            qb.clone().andWhere('e.type = :type', { type: 'prediction' }).getCount(),
            qb.clone().andWhere('e.type = :type', { type: 'handoff' }).getCount(),
            qb.clone()
                .select('AVG(e.latencyMs)', 'avgLatencyMs')
                .andWhere('e.type = :type', { type: 'prediction' })
                .getRawOne<{ avgLatencyMs?: string | number | null }>()
        ])

        const avgLatencyMs = avgLatencyRow?.avgLatencyMs ? Math.round(Number(avgLatencyRow.avgLatencyMs)) : 0
        const handoffRate = predictions > 0 ? Number((handoffs / predictions).toFixed(4)) : 0

        // Simple daily trend (DB-agnostic fallback: fetch minimal columns then bucket in JS)
        const rows = await qb
            .clone()
            .select(['e.type AS type', 'e.createdDate AS createdDate'])
            .getRawMany<{ type: string; createdDate: string | Date }>()

        const byDay: Record<string, { predictions: number; handoffs: number }> = {}
        for (const r of rows) {
            const d = new Date(r.createdDate)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            if (!byDay[key]) byDay[key] = { predictions: 0, handoffs: 0 }
            if (r.type === 'prediction') byDay[key].predictions += 1
            if (r.type === 'handoff') byDay[key].handoffs += 1
        }

        const trend = Object.keys(byDay)
            .sort()
            .map((day) => ({ day, ...byDay[day] }))

        return {
            window: { startAt: query.startAt, endAt: query.endAt },
            predictions,
            handoffs,
            handoffRate,
            avgLatencyMs,
            trend
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: supportUsageService.getKpis - ${getErrorMessage(error)}`
        )
    }
}

export default {
    recordEvent,
    getSummary,
    getKpis
}

