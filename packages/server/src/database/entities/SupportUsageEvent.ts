/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm'
import { SupportChannel } from '../../Interface'

export type SupportUsageEventType = 'prediction' | 'handoff'

@Entity({ name: 'support_usage_event' })
export class SupportUsageEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ type: 'varchar' })
    type: SupportUsageEventType

    @Index()
    @Column({ type: 'varchar' })
    workspaceId: string

    @Index()
    @Column({ type: 'varchar', nullable: true })
    chatflowid?: string

    @Index()
    @Column({ type: 'varchar', default: 'web' })
    channel: SupportChannel

    @Index()
    @Column({ type: 'varchar', nullable: true })
    customerId?: string

    @Index()
    @Column({ type: 'varchar', nullable: true })
    conversationId?: string

    @Index()
    @Column({ type: 'varchar', nullable: true })
    ticketId?: string

    @Column({ type: 'varchar', nullable: true })
    model?: string

    @Column({ type: 'int', nullable: true })
    promptTokens?: number

    @Column({ type: 'int', nullable: true })
    completionTokens?: number

    @Column({ type: 'int', nullable: true })
    totalTokens?: number

    /**
     * 成本（美元），保留 6 位小数（用字符串避免不同 DB 的浮点误差）
     */
    @Column({ type: 'varchar', nullable: true })
    costUsd?: string

    @Column({ type: 'int', nullable: true })
    latencyMs?: number

    /**
     * 额外信息（JSON string），例如渠道 payload、追踪 id 等
     */
    @Column({ type: 'text', nullable: true })
    metadata?: string

    @CreateDateColumn()
    createdDate: Date
}

