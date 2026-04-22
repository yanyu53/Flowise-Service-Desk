import { StatusCodes } from 'http-status-codes'
import { v4 as uuidv4 } from 'uuid'
import { SupportTicketStatus, SupportChannel } from '../../Interface'
import { SupportTicket } from '../../database/entities/SupportTicket'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

export type CreateSupportTicketInput = {
    workspaceId?: string
    chatflowid: string
    chatId?: string
    channel?: SupportChannel | string
    issue?: string
    name?: string
    email?: string
    phone?: string
    priority?: number
    tags?: string | string[]
    metadata?: any
}

export type UpdateSupportTicketInput = {
    status?: SupportTicketStatus
    priority?: number
    assignedTo?: string | null
    tags?: string | string[] | null
    metadata?: any
}

const normalizeChannel = (channel?: string): SupportChannel => {
    const c = (channel || '').toLowerCase()
    if (c === 'feishu' || c === 'lark') return 'feishu'
    if (c === 'wecom') return 'wecom'
    if (c === 'dingtalk') return 'dingtalk'
    if (c === 'mp') return 'mp'
    if (c === 'web') return 'web'
    return 'unknown'
}

const normalizeTags = (tags?: string | string[] | null): string | undefined => {
    if (tags === null) return undefined
    if (Array.isArray(tags)) return JSON.stringify(tags)
    if (typeof tags === 'string') return tags
    return undefined
}

const normalizeMetadata = (metadata?: any): string | undefined => {
    if (metadata === null || typeof metadata === 'undefined') return undefined
    if (typeof metadata === 'string') return metadata
    return JSON.stringify(metadata)
}

const createTicket = async (input: CreateSupportTicketInput) => {
    try {
        if (!input?.chatflowid) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'chatflowid is required')
        }

        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(SupportTicket)

        const ticket = new SupportTicket()
        ticket.id = uuidv4()
        ticket.workspaceId = input.workspaceId
        ticket.chatflowid = input.chatflowid
        ticket.chatId = input.chatId ?? uuidv4()
        ticket.channel = normalizeChannel(input.channel)
        ticket.status = 'new'
        ticket.priority = typeof input.priority === 'number' ? input.priority : 3
        ticket.issue = input.issue
        ticket.name = input.name
        ticket.email = input.email
        ticket.phone = input.phone
        ticket.tags = normalizeTags(input.tags)
        ticket.metadata = normalizeMetadata(input.metadata)

        return await repo.save(repo.create(ticket))
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: supportTicketsService.createTicket - ${getErrorMessage(error)}`)
    }
}

const getTicketById = async (id: string) => {
    try {
        const appServer = getRunningExpressApp()
        return await appServer.AppDataSource.getRepository(SupportTicket).findOne({ where: { id } })
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: supportTicketsService.getTicketById - ${getErrorMessage(error)}`)
    }
}

const listTickets = async (query: {
    workspaceId?: string
    chatflowid?: string
    status?: SupportTicketStatus
    channel?: SupportChannel
    limit?: number
    offset?: number
}) => {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(SupportTicket)

        const qb = repo.createQueryBuilder('t').orderBy('t.createdDate', 'DESC')
        if (query.workspaceId) qb.andWhere('t.workspaceId = :workspaceId', { workspaceId: query.workspaceId })
        if (query.chatflowid) qb.andWhere('t.chatflowid = :chatflowid', { chatflowid: query.chatflowid })
        if (query.status) qb.andWhere('t.status = :status', { status: query.status })
        if (query.channel) qb.andWhere('t.channel = :channel', { channel: query.channel })

        const limit = Math.min(Math.max(query.limit ?? 50, 1), 200)
        const offset = Math.max(query.offset ?? 0, 0)
        qb.take(limit).skip(offset)

        const [items, total] = await qb.getManyAndCount()
        return { items, total, limit, offset }
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: supportTicketsService.listTickets - ${getErrorMessage(error)}`)
    }
}

const updateTicket = async (id: string, patch: UpdateSupportTicketInput) => {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(SupportTicket)
        const ticket = await repo.findOne({ where: { id } })
        if (!ticket) return undefined

        if (patch.status) ticket.status = patch.status
        if (typeof patch.priority === 'number') ticket.priority = patch.priority
        if (typeof patch.assignedTo !== 'undefined') ticket.assignedTo = patch.assignedTo ?? null
        if (typeof patch.tags !== 'undefined') ticket.tags = normalizeTags(patch.tags ?? undefined)
        if (typeof patch.metadata !== 'undefined') ticket.metadata = normalizeMetadata(patch.metadata)

        return await repo.save(ticket)
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: supportTicketsService.updateTicket - ${getErrorMessage(error)}`)
    }
}

export default {
    createTicket,
    getTicketById,
    listTickets,
    updateTicket
}

