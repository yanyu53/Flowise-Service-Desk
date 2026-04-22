import { MigrationInterface, QueryRunner } from 'typeorm'

export class LinkSupportDataToWorkspace1768400000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "support_ticket" ADD COLUMN IF NOT EXISTS "workspaceId" varchar;`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_workspaceId" ON "support_ticket" ("workspaceId");`)

        await queryRunner.query(`ALTER TABLE "support_customer" ADD COLUMN IF NOT EXISTS "workspaceId" varchar;`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_customer_workspaceId" ON "support_customer" ("workspaceId");`)

        await queryRunner.query(`ALTER TABLE "support_conversation" ADD COLUMN IF NOT EXISTS "workspaceId" varchar;`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_conversation_workspaceId" ON "support_conversation" ("workspaceId");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "support_conversation" DROP COLUMN IF EXISTS "workspaceId";`)
        await queryRunner.query(`ALTER TABLE "support_customer" DROP COLUMN IF EXISTS "workspaceId";`)
        await queryRunner.query(`ALTER TABLE "support_ticket" DROP COLUMN IF EXISTS "workspaceId";`)
    }
}

