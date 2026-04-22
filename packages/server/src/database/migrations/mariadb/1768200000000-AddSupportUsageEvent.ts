import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSupportUsageEvent1768200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`support_usage_event\` (
                \`id\` varchar(36) NOT NULL,
                \`type\` varchar(50) NOT NULL,
                \`workspaceId\` varchar(255) NOT NULL,
                \`chatflowid\` varchar(255) DEFAULT NULL,
                \`channel\` varchar(50) NOT NULL DEFAULT 'web',
                \`customerId\` varchar(36) DEFAULT NULL,
                \`conversationId\` varchar(36) DEFAULT NULL,
                \`ticketId\` varchar(36) DEFAULT NULL,
                \`model\` varchar(255) DEFAULT NULL,
                \`promptTokens\` int DEFAULT NULL,
                \`completionTokens\` int DEFAULT NULL,
                \`totalTokens\` int DEFAULT NULL,
                \`costUsd\` varchar(50) DEFAULT NULL,
                \`latencyMs\` int DEFAULT NULL,
                \`metadata\` text,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                KEY \`IDX_support_usage_event_type\` (\`type\`),
                KEY \`IDX_support_usage_event_workspaceId\` (\`workspaceId\`),
                KEY \`IDX_support_usage_event_chatflowid\` (\`chatflowid\`),
                KEY \`IDX_support_usage_event_channel\` (\`channel\`),
                KEY \`IDX_support_usage_event_customerId\` (\`customerId\`),
                KEY \`IDX_support_usage_event_conversationId\` (\`conversationId\`),
                KEY \`IDX_support_usage_event_ticketId\` (\`ticketId\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE support_usage_event`)
    }
}

