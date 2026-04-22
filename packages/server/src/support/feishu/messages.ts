import axios from 'axios'
import { getTenantAccessToken } from './auth'

export async function replyTextMessage(params: { replyToMessageId: string; text: string }): Promise<void> {
    const token = await getTenantAccessToken()
    await axios.post(
        'https://open.feishu.cn/open-apis/im/v1/messages/' + encodeURIComponent(params.replyToMessageId) + '/reply',
        {
            msg_type: 'text',
            content: JSON.stringify({ text: params.text })
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json; charset=utf-8'
            }
        }
    )
}

