/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { ISupportTicket, SupportChannel, SupportTicketStatus } from '../../Interface'

@Entity({ name: 'support_ticket' })
export class SupportTicket implements ISupportTicket {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ type: 'varchar', nullable: true })
    workspaceId?: string

    @Index()
    @Column()
    chatflowid: string

    @Index()
    @Column()
    chatId: string

    @Column({ type: 'varchar', default: 'web' })
    channel: SupportChannel

    @Index()
    @Column({ type: 'varchar', default: 'new' })
    status: SupportTicketStatus

    @Column({ type: 'int', default: 3 })
    priority: number

    @Column({ type: 'text', nullable: true })
    issue?: string

    @Column({ nullable: true })
    name?: string

    @Column({ nullable: true })
    email?: string

    @Column({ nullable: true })
    phone?: string

    @Column({ type: 'varchar', nullable: true })
    assignedTo?: string | null

    /**
     * Store as JSON string (comma list also ok).
     * We keep it as text for cross-db portability.
     */
    @Column({ type: 'text', nullable: true })
    tags?: string

    /**
     * Any channel-specific payload (JSON string).
     */
    @Column({ type: 'text', nullable: true })
    metadata?: string

    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date
}

