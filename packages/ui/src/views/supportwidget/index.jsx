import { useMemo, useState } from 'react'

// material-ui
import { Box, Button, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material'
import { CopyBlock, atomOneDark } from 'react-code-blocks'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ViewHeader from '@/layout/MainLayout/ViewHeader'

// Const
import { baseURL } from '@/store/constant'

const buildEmbedCode = ({ chatflowid }) => {
    const safeId = String(chatflowid || '').trim()
    return `<script type="module">
  import Chatbot from "https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js"

  // 你可以把这个 userId 换成自己的登录用户 ID
  const userId = localStorage.getItem("CS_USER_ID") || ""

  Chatbot.init({
    chatflowid: "${safeId}",
    apiHost: "${baseURL}",
    chatflowConfig: {
      // 这些字段会通过 overrideConfig 透传到服务端，用于客户/会话中心落库
      channel: "web",
      externalUserId: userId
    }
  })
</script>`
}

const SupportWidgetPublisher = () => {
    const [chatflowid, setChatflowid] = useState('')

    const code = useMemo(() => buildEmbedCode({ chatflowid }), [chatflowid])

    return (
        <MainCard>
            <Stack flexDirection='column' sx={{ gap: 3 }}>
                <ViewHeader title='网页小组件发布' description='生成可嵌入官网的客服机器人小组件代码（MVP）' />

                <Card variant='outlined' sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant='h6'>1）填写 chatflowId</Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                            你可以在“聊天流”里创建/复制客服模板后，拿到对应的 chatflowId。
                        </Typography>
                        <Box sx={{ mt: 2, maxWidth: 520 }}>
                            <TextField
                                size='small'
                                fullWidth
                                label='chatflowId'
                                placeholder='例如：0b1c...'
                                value={chatflowid}
                                onChange={(e) => setChatflowid(e.target.value)}
                            />
                        </Box>
                    </CardContent>
                </Card>

                <Card variant='outlined' sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant='h6'>2）复制嵌入代码</Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                            把下面代码粘到你官网页面的 <code>{'<body>'}</code> 里即可。
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <CopyBlock theme={atomOneDark} text={code} language='javascript' showLineNumbers={false} wrapLines />
                        <Stack direction='row' spacing={1} sx={{ mt: 2 }}>
                            <Button
                                size='small'
                                variant='contained'
                                onClick={() => {
                                    navigator.clipboard.writeText(code)
                                }}
                                disabled={!chatflowid.trim()}
                            >
                                复制代码
                            </Button>
                            <Button
                                size='small'
                                variant='outlined'
                                onClick={() => {
                                    navigator.clipboard.writeText('localStorage.setItem("CS_USER_ID", "your-user-id")')
                                }}
                            >
                                复制设置用户ID示例
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                <Card variant='outlined' sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant='h6'>3）验证沉淀</Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                            用户在官网对话后，你可以到“客户 / 会话 / 工单”页面查看沉淀数据。
                        </Typography>
                    </CardContent>
                </Card>
            </Stack>
        </MainCard>
    )
}

export default SupportWidgetPublisher

