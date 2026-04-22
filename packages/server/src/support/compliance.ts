import { getServerEnv } from '../config'

export class ComplianceBlockedError extends Error {
    public readonly blockMessage: string
    constructor(blockMessage: string) {
        super(blockMessage)
        this.blockMessage = blockMessage
    }
}

function parseForbiddenTerms(raw: string): string[] {
    return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
}

export function assertCustomerSupportCompliance(question: unknown): void {
    if (typeof question !== 'string') return

    const env = getServerEnv()
    const terms = parseForbiddenTerms(env.CS_FORBIDDEN_TERMS || '')
    if (!terms.length) return

    const q = question.toLowerCase()
    const hit = terms.find((t) => t && q.includes(t.toLowerCase()))
    if (hit) {
        throw new ComplianceBlockedError(env.CS_BLOCK_RESPONSE)
    }
}

/**
 * 脱敏（MVP）
 * - 手机号：138****8000
 * - 邮箱：ab***@xx.com
 * - 身份证：1101**********1234（简单规则）
 */
export function maskSensitiveText(input: unknown): unknown {
    if (typeof input !== 'string') return input
    let text = input

    // CN mobile: 11 digits starting with 1
    text = text.replace(/\b(1\d{2})\d{4}(\d{4})\b/g, '$1****$2')

    // Email
    text = text.replace(/\b([A-Za-z0-9._%+-]{2})[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g, '$1***@$2')

    // CN ID card (15 or 18, rough)
    text = text.replace(/\b(\d{4})\d{7,10}(\d{3}[\dXx])\b/g, '$1**********$2')

    return text
}

