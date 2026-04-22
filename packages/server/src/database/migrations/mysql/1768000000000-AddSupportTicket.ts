import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSupportTicket1768000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`support_ticket\` (
                \`id\` varchar(36) NOT NULL,
                \`chatflowid\` varchar(255) NOT NULL,
                \`chatId\` varchar(255) NOT NULL,
                \`channel\` varchar(50) NOT NULL DEFAULT 'web',
                \`status\` varchar(20) NOT NULL DEFAULT 'new',
                \`priority\` int NOT NULL DEFAULT 3,
                \`issue\` text,
                \`name\` text,
                \`email\` text,
                \`phone\` text,
                \`assignedTo\` varchar(255) DEFAULT NULL,
                \`tags\` text,
                \`metadata\` text,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                KEY \`IDX_support_ticket_chatflowid\` (\`chatflowid\`),
                KEY \`IDX_support_ticket_chatId\` (\`chatId\`),
                KEY \`IDX_support_ticket_status\` (\`status\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE support_ticket`)
    }
}

