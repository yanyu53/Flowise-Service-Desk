/* eslint-disable */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { SupportChannel } from '../../Interface'

@Entity({ name: 'support_customer' })
export class SupportCustomer {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ type: 'varchar', nullable: true })
    workspaceId?: string

    /**
     * 渠道（web/feishu/...）
     */
    @Index()
    @Column({ type: 'varchar', default: 'web' })
    channel: SupportChannel

    /**
     * 渠道侧用户标识（如飞书 open_id）
     */
    @Index()
    @Column({ type: 'varchar', nullable: true })
    externalUserId?: string

    /**
     * Flowise chatId（用于 web embed / 内部聊天等）
     */
    @Index()
    @Column({ type: 'varchar', nullable: true })
    chatId?: string

    @Column({ type: 'text', nullable: true })
    name?: string

    @Column({ type: 'text', nullable: true })
    email?: string

    @Column({ type: 'text', nullable: true })
    phone?: string

    /**
     * 任意扩展（JSON string）
     */
    @Column({ type: 'text', nullable: true })
    metadata?: string

    @Column({ type: 'datetime', nullable: true })
    lastSeenAt?: Date

    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date
}

