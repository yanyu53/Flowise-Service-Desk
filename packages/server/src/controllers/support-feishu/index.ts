import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { getServerEnv } from '../../config'
import { createMockRequest } from '../../utils/mockRequest'
import { utilBuildChatflow } from '../../utils/buildChatflow'
import { verifyFeishuSignature } from '../../support/feishu/signature'
import { replyTextMessage } from '../../support/feishu/messages'
import { maskSensitiveText } from '../../support/compliance'

/**
 * 飞书事件订阅回调（MVP）
 *
 * - 支持 url_verification: 返回 challenge
 * - 支持 message.receive_v1: 读取文本消息 -> 调 Flowise chatflow -> reply 回飞书
 *
 * 说明：
 * - 这里优先使用“明文 + verification token”校验
 * - 如果你在飞书后台配置了 Encrypt Key，会启用签名校验（sha256）
 */
export async function feishuWebhook(req: Request, res: Response) {
    const env = getServerEnv()

    // 飞书签名校验需要 raw body（启用 Encrypt Key 时必需）
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
    if (!verifyFeishuSignature(rawBody, req.headers as any)) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ ok: false, error: 'invalid feishu signature' })
    }

    const body: any = req.body || {}

    // URL 校验
    if (body.type === 'url_verification' && body.challenge) {
        if (env.FEISHU_VERIFICATION_TOKEN && body.token && body.token !== env.FEISHU_VERIFICATION_TOKEN) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ ok: false, error: 'invalid verification token' })
        }
        return res.status(StatusCodes.OK).json({ challenge: body.challenge })
    }

    // 事件回调（明文）
    if (env.FEISHU_VERIFICATION_TOKEN && body.token && body.token !== env.FEISHU_VERIFICATION_TOKEN) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ ok: false, error: 'invalid verification token' })
    }

    const eventType = body?.header?.event_type
    if (eventType === 'im.message.receive_v1') {
        const message = body?.event?.message
        const senderId =
            body?.event?.sender?.sender_id?.open_id ||
            body?.event?.sender?.sender_id?.user_id ||
            body?.event?.sender?.sender_id?.union_id ||
            'unknown'

        const msgType = message?.message_type
        const messageId = message?.message_id

        if (msgType !== 'text' || !messageId) {
            return res.status(StatusCodes.OK).json({ ok: true })
        }

        let text = ''
        try {
            // content is a JSON string like: {"text":"..."}
            const contentObj = typeof message?.content === 'string' ? JSON.parse(message.content) : message?.content
            text = contentObj?.text ?? ''
        } catch {
            text = ''
        }

        const chatflowid = env.FEISHU_DEFAULT_CHATFLOW_ID
        if (!chatflowid) {
            await replyTextMessage({ replyToMessageId: messageId, text: '服务端未配置 FEISHU_DEFAULT_CHATFLOW_ID' })
            return res.status(StatusCodes.OK).json({ ok: true })
        }

        const chatId = `feishu:${senderId}`
        const mockReq = createMockRequest({
            chatflowId: chatflowid,
            sourceRequest: req,
            body: {
                question: text,
                chatId,
                streaming: false,
                overrideConfig: {
                    channel: 'feishu',
                    externalUserId: senderId,
                    feishu: {
                        messageId,
                        chatId: message?.chat_id
                    }
                }
            }
        })

        const result = await utilBuildChatflow(mockReq, true)
        const replyText = result?.text ? String(result.text) : '(empty)'

        await replyTextMessage({ replyToMessageId: messageId, text: String(maskSensitiveText(replyText) ?? replyText) })
        return res.status(StatusCodes.OK).json({ ok: true })
    }

    // 其他事件先直接 ack
    return res.status(StatusCodes.OK).json({ ok: true })
}

