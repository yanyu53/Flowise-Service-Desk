import { MigrationInterface, QueryRunner } from 'typeorm'

export class LinkSupportDataToWorkspace1768400000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`support_ticket\` ADD COLUMN \`workspaceId\` varchar(255) DEFAULT NULL;`)
        await queryRunner.query(`CREATE INDEX \`IDX_support_ticket_workspaceId\` ON \`support_ticket\` (\`workspaceId\`);`)

        await queryRunner.query(`ALTER TABLE \`support_customer\` ADD COLUMN \`workspaceId\` varchar(255) DEFAULT NULL;`)
        await queryRunner.query(`CREATE INDEX \`IDX_support_customer_workspaceId\` ON \`support_customer\` (\`workspaceId\`);`)

        await queryRunner.query(`ALTER TABLE \`support_conversation\` ADD COLUMN \`workspaceId\` varchar(255) DEFAULT NULL;`)
        await queryRunner.query(`CREATE INDEX \`IDX_support_conversation_workspaceId\` ON \`support_conversation\` (\`workspaceId\`);`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`support_conversation\` DROP COLUMN \`workspaceId\`;`)
        await queryRunner.query(`ALTER TABLE \`support_customer\` DROP COLUMN \`workspaceId\`;`)
        await queryRunner.query(`ALTER TABLE \`support_ticket\` DROP COLUMN \`workspaceId\`;`)
    }
}

