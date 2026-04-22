import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSupportCustomerConversation1768100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`support_customer\` (
                \`id\` varchar(36) NOT NULL,
                \`channel\` varchar(50) NOT NULL DEFAULT 'web',
                \`externalUserId\` varchar(255) DEFAULT NULL,
                \`chatId\` varchar(255) DEFAULT NULL,
                \`name\` text,
                \`email\` text,
                \`phone\` text,
                \`metadata\` text,
                \`lastSeenAt\` datetime(6) DEFAULT NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                KEY \`IDX_support_customer_channel\` (\`channel\`),
                KEY \`IDX_support_customer_externalUserId\` (\`externalUserId\`),
                KEY \`IDX_support_customer_chatId\` (\`chatId\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
        )

        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`support_conversation\` (
                \`id\` varchar(36) NOT NULL,
                \`chatflowid\` varchar(255) NOT NULL,
                \`chatId\` varchar(255) NOT NULL,
                \`channel\` varchar(50) NOT NULL DEFAULT 'web',
                \`externalUserId\` varchar(255) DEFAULT NULL,
                \`customerId\` varchar(36) DEFAULT NULL,
                \`ticketId\` varchar(36) DEFAULT NULL,
                \`status\` varchar(20) NOT NULL DEFAULT 'open',
                \`lastUserMessage\` text,
                \`lastMessageAt\` datetime(6) DEFAULT NULL,
                \`metadata\` text,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                KEY \`IDX_support_conversation_chatflowid\` (\`chatflowid\`),
                KEY \`IDX_support_conversation_chatId\` (\`chatId\`),
                KEY \`IDX_support_conversation_channel\` (\`channel\`),
                KEY \`IDX_support_conversation_externalUserId\` (\`externalUserId\`),
                KEY \`IDX_support_conversation_customerId\` (\`customerId\`),
                KEY \`IDX_support_conversation_ticketId\` (\`ticketId\`),
                KEY \`IDX_support_conversation_status\` (\`status\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE support_conversation`)
        await queryRunner.query(`DROP TABLE support_customer`)
    }
}

