/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm'
import { SupportChannel } from '../../Interface'

export type SupportAuditAction = 'handoff.created' | 'ticket.updated' | 'compliance.blocked'

@Entity({ name: 'support_audit_event' })
export class SupportAuditEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ type: 'varchar' })
    action: SupportAuditAction

    @Index()
    @Column({ type: 'varchar' })
    workspaceId: string

    @Index()
    @Column({ type: 'varchar', nullable: true })
    actorUserId?: string

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

    @Column({ type: 'text', nullable: true })
    message?: string

    @Column({ type: 'text', nullable: true })
    payload?: string

    @CreateDateColumn()
    createdDate: Date
}

