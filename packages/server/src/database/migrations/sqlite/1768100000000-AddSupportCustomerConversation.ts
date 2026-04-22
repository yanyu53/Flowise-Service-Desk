import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSupportCustomerConversation1768100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "support_customer" (
                "id" varchar PRIMARY KEY NOT NULL,
                "channel" varchar NOT NULL DEFAULT ('web'),
                "externalUserId" varchar,
                "chatId" varchar,
                "name" text,
                "email" text,
                "phone" text,
                "metadata" text,
                "lastSeenAt" datetime,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now'))
            );`
        )
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_customer_channel" ON "support_customer" ("channel");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_customer_externalUserId" ON "support_customer" ("externalUserId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_customer_chatId" ON "support_customer" ("chatId");`)

        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "support_conversation" (
                "id" varchar PRIMARY KEY NOT NULL,
                "chatflowid" varchar NOT NULL,
                "chatId" varchar NOT NULL,
                "channel" varchar NOT NULL DEFAULT ('web'),
                "externalUserId" varchar,
                "customerId" varchar,
                "ticketId" varchar,
                "status" varchar NOT NULL DEFAULT ('open'),
                "lastUserMessage" text,
                "lastMessageAt" datetime,
                "metadata" text,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now'))
            );`
        )
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_conversation_chatflowid" ON "support_conversation" ("chatflowid");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_conversation_chatId" ON "support_conversation" ("chatId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_conversation_channel" ON "support_conversation" ("channel");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_conversation_externalUserId" ON "support_conversation" ("externalUserId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_conversation_customerId" ON "support_conversation" ("customerId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_conversation_ticketId" ON "support_conversation" ("ticketId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_conversation_status" ON "support_conversation" ("status");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "support_conversation";`)
        await queryRunner.query(`DROP TABLE IF EXISTS "support_customer";`)
    }
}

