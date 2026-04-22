import { StatusCodes } from 'http-status-codes'
import { v4 as uuidv4 } from 'uuid'
import { SupportChannel } from '../../Interface'
import { SupportCustomer } from '../../database/entities/SupportCustomer'
import { SupportConversation } from '../../database/entities/SupportConversation'
import { SupportTicket } from '../../database/entities/SupportTicket'
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

const isWorkspaceColumnMissingError = (error: unknown) => {
    const message = getErrorMessage(error).toLowerCase()
    return (
        (message.includes('workspaceid') && message.includes('no such column')) ||
        (message.includes('workspaceid') && message.includes('unknown column')) ||
        (message.includes('workspaceid') && message.includes('does not exist'))
    )
}

export async function upsertCustomerAndConversation(input: {
    workspaceId?: string
    chatflowid: string
    chatId: string
    channel?: string
    externalUserId?: string
    name?: string
    email?: string
    phone?: string
    ticketId?: string
    lastUserMessage?: string
    metadata?: any
}) {
    try {
        const appServer = getRunningExpressApp()
        const customerRepo = appServer.AppDataSource.getRepository(SupportCustomer)
        const convRepo = appServer.AppDataSource.getRepository(SupportConversation)

        const channel = normalizeChannel(input.channel)
        const externalUserId = input.externalUserId ? String(input.externalUserId) : undefined
        const chatId = String(input.chatId)

        // 1) Upsert customer
        let customer: SupportCustomer | null = null
        if (externalUserId) {
            customer = await customerRepo.findOne({ where: { channel, externalUserId, workspaceId: input.workspaceId } as any })
        }
        if (!customer) {
            // fallback to chatId (web embed)
            customer = await customerRepo.findOne({ where: { channel, chatId, workspaceId: input.workspaceId } as any })
        }

        if (!customer) {
            customer = new SupportCustomer()
            customer.id = uuidv4()
            customer.workspaceId = input.workspaceId
            customer.channel = channel
            customer.externalUserId = externalUserId
            customer.chatId = chatId
        } else {
            // keep ids fresh
            if (!customer.externalUserId && externalUserId) customer.externalUserId = externalUserId
            if (!customer.chatId && chatId) customer.chatId = chatId
        }

        if (typeof input.name === 'string' && input.name.trim()) customer.name = input.name.trim()
        if (typeof input.email === 'string' && input.email.trim()) customer.email = input.email.trim()
        if (typeof input.phone === 'string' && input.phone.trim()) customer.phone = input.phone.trim()
        customer.lastSeenAt = new Date()
        customer.metadata = stringifyIfNeeded(input.metadata)

        customer = await customerRepo.save(customerRepo.create(customer))

        // 2) Upsert conversation by (chatflowid + chatId)
        let conv = await convRepo.findOne({ where: { chatflowid: input.chatflowid, chatId, workspaceId: input.workspaceId } as any })
        if (!conv) {
            conv = new SupportConversation()
            conv.id = uuidv4()
            conv.workspaceId = input.workspaceId
            conv.chatflowid = input.chatflowid
            conv.chatId = chatId
            conv.channel = channel
            conv.externalUserId = externalUserId
            conv.customerId = customer.id
            conv.status = 'open'
        }
        conv.customerId = customer.id
        conv.channel = channel
        if (externalUserId) conv.externalUserId = externalUserId
        if (input.ticketId) conv.ticketId = String(input.ticketId)
        if (typeof input.lastUserMessage === 'string' && input.lastUserMessage.trim()) conv.lastUserMessage = input.lastUserMessage
        conv.lastMessageAt = new Date()
        conv.metadata = stringifyIfNeeded(input.metadata)

        conv = await convRepo.save(convRepo.create(conv))

        return { customer, conversation: conv }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: supportCustomersService.upsertCustomerAndConversation - ${getErrorMessage(error)}`
        )
    }
}

export async function listCustomers(query: { workspaceId?: string; channel?: string; externalUserId?: string; limit?: number; offset?: number }) {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(SupportCustomer)
        const buildQuery = (withWorkspaceFilter: boolean) => {
            const qb = repo.createQueryBuilder('c').orderBy('c.updatedDate', 'DESC')
            if (withWorkspaceFilter && query.workspaceId) qb.andWhere('c.workspaceId = :workspaceId', { workspaceId: query.workspaceId })
            if (query.channel) qb.andWhere('c.channel = :channel', { channel: normalizeChannel(query.channel) })
            if (query.externalUserId) qb.andWhere('c.externalUserId = :externalUserId', { externalUserId: String(query.externalUserId) })

            const limit = Math.min(Math.max(query.limit ?? 50, 1), 200)
            const offset = Math.max(query.offset ?? 0, 0)
            qb.take(limit).skip(offset)
            return { qb, limit, offset }
        }

        const { qb, limit, offset } = buildQuery(true)
        const [items, total] = await qb.getManyAndCount()
        return { items, total, limit, offset }
    } catch (error) {
        // Backward compatibility: old DB schema may not have workspaceId column yet.
        if (isWorkspaceColumnMissingError(error)) {
            const appServer = getRunningExpressApp()
            const repo = appServer.AppDataSource.getRepository(SupportCustomer)
            const qb = repo.createQueryBuilder('c').orderBy('c.updatedDate', 'DESC')
            if (query.channel) qb.andWhere('c.channel = :channel', { channel: normalizeChannel(query.channel) })
            if (query.externalUserId) qb.andWhere('c.externalUserId = :externalUserId', { externalUserId: String(query.externalUserId) })
            const limit = Math.min(Math.max(query.limit ?? 50, 1), 200)
            const offset = Math.max(query.offset ?? 0, 0)
            qb.take(limit).skip(offset)
            const [items, total] = await qb.getManyAndCount()
            return { items, total, limit, offset }
        }
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: supportCustomersService.listCustomers - ${getErrorMessage(error)}`)
    }
}

export async function listConversations(query: {
    chatflowid?: string
    channel?: string
    customerId?: string
    ticketId?: string
    status?: 'open' | 'closed'
    startAt?: string
    endAt?: string
    limit?: number
    offset?: number
    workspaceId?: string
}) {
    try {
        const appServer = getRunningExpressApp()
        const repo = appServer.AppDataSource.getRepository(SupportConversation)
        const qb = repo.createQueryBuilder('t').orderBy('t.updatedDate', 'DESC')
        if (query.workspaceId) qb.andWhere('t.workspaceId = :workspaceId', { workspaceId: query.workspaceId })

        if (query.chatflowid) qb.andWhere('t.chatflowid = :chatflowid', { chatflowid: String(query.chatflowid) })
        if (query.channel) qb.andWhere('t.channel = :channel', { channel: normalizeChannel(query.channel) })
        if (query.customerId) qb.andWhere('t.customerId = :customerId', { customerId: String(query.customerId) })
        if (query.ticketId) qb.andWhere('t.ticketId = :ticketId', { ticketId: String(query.ticketId) })
        if (query.status) qb.andWhere('t.status = :status', { status: query.status })
        if (query.startAt) qb.andWhere('t.lastMessageAt >= :startAt', { startAt: new Date(String(query.startAt)).toISOString() })
        if (query.endAt) qb.andWhere('t.lastMessageAt <= :endAt', { endAt: new Date(String(query.endAt)).toISOString() })

        const limit = Math.min(Math.max(query.limit ?? 50, 1), 200)
        const offset = Math.max(query.offset ?? 0, 0)
        qb.take(limit).skip(offset)

        const [items, total] = await qb.getManyAndCount()
        return { items, total, limit, offset }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: supportCustomersService.listConversations - ${getErrorMessage(error)}`
        )
    }
}

export async function getSupportDashboardMetrics(query?: { workspaceId?: string }) {
    try {
        const appServer = getRunningExpressApp()
        const ticketRepo = appServer.AppDataSource.getRepository(SupportTicket)
        const customerRepo = appServer.AppDataSource.getRepository(SupportCustomer)
        const convRepo = appServer.AppDataSource.getRepository(SupportConversation)

        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        const workspaceId = query?.workspaceId

        const ticketsBase = ticketRepo.createQueryBuilder('t')
        if (workspaceId) ticketsBase.andWhere('t.workspaceId = :workspaceId', { workspaceId })

        const [ticketsTotal, ticketsNew, ticketsOpen, ticketsPending, ticketsClosed, ticketsToday] = await Promise.all([
            ticketsBase.clone().getCount(),
            ticketsBase.clone().andWhere('t.status = :status', { status: 'new' }).getCount(),
            ticketsBase.clone().andWhere('t.status = :status', { status: 'open' }).getCount(),
            ticketsBase.clone().andWhere('t.status = :status', { status: 'pending' }).getCount(),
            ticketsBase.clone().andWhere('t.status = :status', { status: 'closed' }).getCount(),
            ticketsBase.clone().andWhere('t.createdDate >= :startOfDay', { startOfDay: startOfDay.toISOString() }).getCount()
        ])

        const customersBase = customerRepo.createQueryBuilder('c')
        if (workspaceId) customersBase.andWhere('c.workspaceId = :workspaceId', { workspaceId })

        const convBase = convRepo.createQueryBuilder('c')
        if (workspaceId) convBase.andWhere('c.workspaceId = :workspaceId', { workspaceId })

        const [customersTotal, conversationsTotal, conversationsOpen, conversationsClosed] = await Promise.all([
            customersBase.clone().getCount(),
            convBase.clone().getCount(),
            convBase.clone().andWhere('c.status = :status', { status: 'open' }).getCount(),
            convBase.clone().andWhere('c.status = :status', { status: 'closed' }).getCount()
        ])

        return {
            generatedAt: now.toISOString(),
            tickets: {
                today: ticketsToday,
                total: ticketsTotal,
                byStatus: {
                    new: ticketsNew,
                    open: ticketsOpen,
                    pending: ticketsPending,
                    closed: ticketsClosed
                }
            },
            customers: {
                total: customersTotal
            },
            conversations: {
                total: conversationsTotal,
                byStatus: {
                    open: conversationsOpen,
                    closed: conversationsClosed
                }
            }
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: supportCustomersService.getSupportDashboardMetrics - ${getErrorMessage(error)}`
        )
    }
}

export default {
    upsertCustomerAndConversation,
    listCustomers,
    listConversations,
    getSupportDashboardMetrics
}

