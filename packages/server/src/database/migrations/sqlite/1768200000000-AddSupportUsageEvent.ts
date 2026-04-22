import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSupportUsageEvent1768200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "support_usage_event" (
                "id" varchar PRIMARY KEY NOT NULL,
                "type" varchar NOT NULL,
                "workspaceId" varchar NOT NULL,
                "chatflowid" varchar,
                "channel" varchar NOT NULL DEFAULT ('web'),
                "customerId" varchar,
                "conversationId" varchar,
                "ticketId" varchar,
                "model" varchar,
                "promptTokens" integer,
                "completionTokens" integer,
                "totalTokens" integer,
                "costUsd" varchar,
                "latencyMs" integer,
                "metadata" text,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now'))
            );`
        )
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_usage_event_type" ON "support_usage_event" ("type");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_usage_event_workspaceId" ON "support_usage_event" ("workspaceId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_usage_event_chatflowid" ON "support_usage_event" ("chatflowid");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_usage_event_channel" ON "support_usage_event" ("channel");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_usage_event_customerId" ON "support_usage_event" ("customerId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_usage_event_conversationId" ON "support_usage_event" ("conversationId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_usage_event_ticketId" ON "support_usage_event" ("ticketId");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "support_usage_event";`)
    }
}

