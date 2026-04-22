import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSupportTicket1768000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "support_ticket" (
                "id" varchar PRIMARY KEY NOT NULL,
                "chatflowid" varchar NOT NULL,
                "chatId" varchar NOT NULL,
                "channel" varchar NOT NULL DEFAULT ('web'),
                "status" varchar NOT NULL DEFAULT ('new'),
                "priority" integer NOT NULL DEFAULT (3),
                "issue" text,
                "name" text,
                "email" text,
                "phone" text,
                "assignedTo" varchar,
                "tags" text,
                "metadata" text,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now'))
            );`
        )
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_chatflowid" ON "support_ticket" ("chatflowid");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_chatId" ON "support_ticket" ("chatId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_status" ON "support_ticket" ("status");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "support_ticket";`)
    }
}

