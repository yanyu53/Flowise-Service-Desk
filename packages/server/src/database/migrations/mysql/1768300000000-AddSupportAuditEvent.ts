import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSupportAuditEvent1768300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`support_audit_event\` (
                \`id\` varchar(36) NOT NULL,
                \`action\` varchar(100) NOT NULL,
                \`workspaceId\` varchar(255) NOT NULL,
                \`actorUserId\` varchar(255) DEFAULT NULL,
                \`chatflowid\` varchar(255) DEFAULT NULL,
                \`channel\` varchar(50) NOT NULL DEFAULT 'web',
                \`customerId\` varchar(36) DEFAULT NULL,
                \`conversationId\` varchar(36) DEFAULT NULL,
                \`ticketId\` varchar(36) DEFAULT NULL,
                \`message\` text,
                \`payload\` text,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                KEY \`IDX_support_audit_event_action\` (\`action\`),
                KEY \`IDX_support_audit_event_workspaceId\` (\`workspaceId\`),
                KEY \`IDX_support_audit_event_ticketId\` (\`ticketId\`),
                KEY \`IDX_support_audit_event_customerId\` (\`customerId\`),
                KEY \`IDX_support_audit_event_conversationId\` (\`conversationId\`),
                KEY \`IDX_support_audit_event_channel\` (\`channel\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE support_audit_event`)
    }
}

