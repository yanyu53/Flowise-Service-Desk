import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSupportAuditEvent1768300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "support_audit_event" (
                "id" varchar PRIMARY KEY NOT NULL,
                "action" varchar NOT NULL,
                "workspaceId" varchar NOT NULL,
                "actorUserId" varchar,
                "chatflowid" varchar,
                "channel" varchar NOT NULL DEFAULT ('web'),
                "customerId" varchar,
                "conversationId" varchar,
                "ticketId" varchar,
                "message" text,
                "payload" text,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now'))
            );`
        )
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_audit_event_action" ON "support_audit_event" ("action");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_audit_event_workspaceId" ON "support_audit_event" ("workspaceId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_audit_event_ticketId" ON "support_audit_event" ("ticketId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_audit_event_customerId" ON "support_audit_event" ("customerId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_audit_event_conversationId" ON "support_audit_event" ("conversationId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_audit_event_channel" ON "support_audit_event" ("channel");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "support_audit_event";`)
    }
}

