import crypto from 'crypto'
import { getServerEnv } from '../../config'

/**
 * 飞书签名校验（当配置 Encrypt Key 时推荐启用）
 *
 * signature = sha256(timestamp + nonce + encrypt_key + rawBody)
 * compare with header: X-Lark-Signature
 */
export function verifyFeishuSignature(rawBody: string, headers: Record<string, any>): boolean {
    const env = getServerEnv()
    const encryptKey = env.FEISHU_ENCRYPT_KEY
    if (!encryptKey) return true

    const timestamp = String(headers['x-lark-request-timestamp'] ?? '')
    const nonce = String(headers['x-lark-request-nonce'] ?? '')
    const signature = String(headers['x-lark-signature'] ?? '')
    if (!timestamp || !nonce || !signature) return false

    const content = timestamp + nonce + encryptKey + rawBody
    const hash = crypto.createHash('sha256').update(content, 'utf8').digest('hex')
    return hash === signature
}

