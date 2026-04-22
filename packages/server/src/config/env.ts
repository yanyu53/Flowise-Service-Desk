import path from 'path'
import { z } from 'zod'
import { loadEnvOnce } from './loadEnv'

const boolFromString = z.preprocess((val) => {
    if (typeof val !== 'string') return val
    const v = val.trim().toLowerCase()
    if (v === 'true') return true
    if (v === 'false') return false
    return val
}, z.boolean())

const intFromString = z.preprocess((val) => {
    if (typeof val !== 'string') return val
    const trimmed = val.trim()
    if (!trimmed) return undefined
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : val
}, z.number().int())

const envSchema = z
    .object({
        HOST: z.string().optional(),
        PORT: intFromString.optional().default(3000),

        DEBUG: boolFromString.optional().default(false),

        FLOWISE_FILE_SIZE_LIMIT: z.string().optional().default('50mb'),
        TRUST_PROXY: z.string().optional(),

        LOG_PATH: z.string().optional().default(path.join(__dirname, '..', '..', 'logs')),
        LOG_LEVEL: z.enum(['error', 'warn', 'info', 'verbose', 'debug']).optional().default('info'),

        ENABLE_METRICS: boolFromString.optional().default(false),
        METRICS_PROVIDER: z.enum(['prometheus', 'open_telemetry']).optional().default('prometheus'),

        /**
         * Customer-support (客服机器人) hardening
         * - CS_FORBIDDEN_TERMS: comma-separated terms. If matched, block the request.
         * - CS_BLOCK_RESPONSE: response text when blocked.
         */
        CS_FORBIDDEN_TERMS: z.string().optional().default(''),
        CS_BLOCK_RESPONSE: z.string().optional().default('当前内容触发合规限制，请换一种表述或联系客服。'),

        /**
         * Feishu / Lark (飞书) bot integration (event subscription)
         */
        FEISHU_APP_ID: z.string().optional().default(''),
        FEISHU_APP_SECRET: z.string().optional().default(''),
        FEISHU_VERIFICATION_TOKEN: z.string().optional().default(''),
        FEISHU_ENCRYPT_KEY: z.string().optional().default(''),
        /**
         * Default chatflow for Feishu channel if not provided by event metadata.
         * You can override per-group/per-bot via your own mapping later.
         */
        FEISHU_DEFAULT_CHATFLOW_ID: z.string().optional().default('')
    })
    .passthrough()

export type ServerEnv = z.infer<typeof envSchema>

let cachedEnv: ServerEnv | undefined

export function getServerEnv(): ServerEnv {
    loadEnvOnce()
    if (cachedEnv) return cachedEnv

    const parsed = envSchema.safeParse(process.env)
    if (!parsed.success) {
        const message = parsed.error.issues
            .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
            .join('\n')
        // Keep this very explicit: env problems should be obvious early.
        throw new Error(`环境变量校验失败，请检查 packages/server/.env\n${message}`)
    }

    cachedEnv = parsed.data
    return cachedEnv
}

