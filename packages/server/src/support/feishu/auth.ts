import axios from 'axios'
import { getServerEnv } from '../../config'

type CachedToken = { token: string; expiresAtMs: number }
let cached: CachedToken | undefined

/**
 * 获取 tenant_access_token（用于调用飞书开放平台 API）
 */
export async function getTenantAccessToken(): Promise<string> {
    const env = getServerEnv()
    if (!env.FEISHU_APP_ID || !env.FEISHU_APP_SECRET) {
        throw new Error('缺少 FEISHU_APP_ID/FEISHU_APP_SECRET')
    }

    const now = Date.now()
    if (cached && cached.expiresAtMs > now + 30_000) return cached.token

    const resp = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        app_id: env.FEISHU_APP_ID,
        app_secret: env.FEISHU_APP_SECRET
    })

    const data = resp.data
    if (!data || data.code !== 0 || !data.tenant_access_token) {
        throw new Error(`获取飞书 tenant_access_token 失败: ${JSON.stringify(data)}`)
    }

    const expireSeconds = typeof data.expire === 'number' ? data.expire : 3600
    cached = { token: data.tenant_access_token, expiresAtMs: now + expireSeconds * 1000 }
    return cached.token
}

