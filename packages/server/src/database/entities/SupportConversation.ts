/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { SupportChannel } from '../../Interface'

export type SupportConversationStatus = 'open' | 'closed'

@Entity({ name: 'support_conversation' })
export class SupportConversation {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ type: 'varchar', nullable: true })
    workspaceId?: string

    @Index()
    @Column({ type: 'varchar' })
    chatflowid: string

    /**
     * Flowise chatId（同一用户/会话在渠道内的会话键）
     */
    @Index()
    @Column({ type: 'varchar' })
    chatId: string

    @Index()
    @Column({ type: 'varchar', default: 'web' })
    channel: SupportChannel

    @Index()
    @Column({ type: 'varchar', nullable: true })
    externalUserId?: string

    @Index()
    @Column({ type: 'varchar', nullable: true })
    customerId?: string

    @Index()
    @Column({ type: 'varchar', nullable: true })
    ticketId?: string

    @Index()
    @Column({ type: 'varchar', default: 'open' })
    status: SupportConversationStatus

    @Column({ type: 'text', nullable: true })
    lastUserMessage?: string

    @Column({ type: 'datetime', nullable: true })
    lastMessageAt?: Date

    /**
     * 任意扩展（JSON string）
     */
    @Column({ type: 'text', nullable: true })
    metadata?: string

    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date
}

