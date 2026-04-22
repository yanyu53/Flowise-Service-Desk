import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// material-ui
import { Box, Button, Card, CardContent, Grid, Stack, Typography, Divider } from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ViewHeader from '@/layout/MainLayout/ViewHeader'

// API + hooks
import useApi from '@/hooks/useApi'
import supportCustomersApi from '@/api/supportCustomers'
import supportUsageApi from '@/api/supportUsage'
import supportAuditApi from '@/api/supportAudit'

const MetricCard = ({ title, value, hint }) => {
    return (
        <Card variant='outlined' sx={{ borderRadius: 2 }}>
            <CardContent>
                <Typography variant='body2' color='text.secondary'>
                    {title}
                </Typography>
                <Typography variant='h4' sx={{ mt: 1 }}>
                    {value}
                </Typography>
                {hint ? (
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                        {hint}
                    </Typography>
                ) : null}
            </CardContent>
        </Card>
    )
}

const SupportWorkbench = () => {
    const navigate = useNavigate()
    const dashboardApi = useApi(supportCustomersApi.getDashboard)
    const usageKpisApi = useApi(supportUsageApi.getKpis)
    const auditSummaryApi = useApi(supportAuditApi.getSummary)

    useEffect(() => {
        dashboardApi.request()
        const now = new Date()
        const startAt = new Date(now)
        startAt.setDate(now.getDate() - 7)
        usageKpisApi.request({ startAt: startAt.toISOString(), endAt: now.toISOString() })
        auditSummaryApi.request({ startAt: startAt.toISOString(), endAt: now.toISOString() })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // 第2周会把这些指标接上后端聚合接口（dashboard）
    const metrics = useMemo(
        () => {
            const data = dashboardApi.data
            const byStatus = data?.tickets?.byStatus || {}
            return [
                { title: '今日新增工单', value: data?.tickets?.today ?? '—', hint: data?.generatedAt ? `更新时间：${new Date(data.generatedAt).toLocaleString()}` : '' },
                { title: '处理中工单', value: byStatus?.open ?? '—', hint: '' },
                { title: '待回复工单', value: byStatus?.pending ?? '—', hint: '' },
                { title: '已关闭工单', value: byStatus?.closed ?? '—', hint: '' }
            ]
        },
        [dashboardApi.data]
    )

    const opsMetrics = useMemo(() => {
        const u = usageKpisApi.data
        const a = auditSummaryApi.data
        const counts = a?.counts || {}

        const handoffRatePct = typeof u?.handoffRate === 'number' ? `${(u.handoffRate * 100).toFixed(2)}%` : '—'
        const avgLatency = typeof u?.avgLatencyMs === 'number' ? `${u.avgLatencyMs} ms` : '—'

        return [
            { title: '近 7 天预测', value: u?.predictions ?? '—', hint: '' },
            { title: '近 7 天转人工', value: u?.handoffs ?? '—', hint: `转人工率：${handoffRatePct}` },
            { title: '平均响应延迟', value: avgLatency, hint: '（MVP：按接口耗时）' },
            { title: '合规拦截', value: counts['compliance.blocked'] ?? '—', hint: '' }
        ]
    }, [usageKpisApi.data, auditSummaryApi.data])

    return (
        <MainCard>
            <Stack flexDirection='column' sx={{ gap: 3 }}>
                <ViewHeader title='客服工作台' description='工单处理、模板复用、渠道接入与嵌入发布的统一入口' />

                <Grid container spacing={2}>
                    {metrics.map((m) => (
                        <Grid key={m.title} item xs={12} sm={6} md={3}>
                            <MetricCard title={m.title} value={m.value} hint={m.hint} />
                        </Grid>
                    ))}
                </Grid>

                <Grid container spacing={2}>
                    {opsMetrics.map((m) => (
                        <Grid key={m.title} item xs={12} sm={6} md={3}>
                            <MetricCard title={m.title} value={m.value} hint={m.hint} />
                        </Grid>
                    ))}
                </Grid>

                <Card variant='outlined' sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant='h5'>快捷入口</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <Card variant='outlined' sx={{ borderRadius: 2, height: '100%' }}>
                                    <CardContent>
                                        <Typography variant='h6'>工单处理</Typography>
                                        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                            查看转人工工单并更新状态
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            <Button variant='contained' size='small' onClick={() => navigate('/support/tickets')}>
                                                进入工单列表
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card variant='outlined' sx={{ borderRadius: 2, height: '100%' }}>
                                    <CardContent>
                                        <Typography variant='h6'>客户/会话中心</Typography>
                                        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                            查看客户与会话沉淀，后续关联工单与执行记录
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            <Stack direction='row' spacing={1}>
                                                <Button variant='contained' size='small' onClick={() => navigate('/support/customers')}>
                                                    客户
                                                </Button>
                                                <Button variant='outlined' size='small' onClick={() => navigate('/support/conversations')}>
                                                    会话
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card variant='outlined' sx={{ borderRadius: 2, height: '100%' }}>
                                    <CardContent>
                                        <Typography variant='h6'>成本与审计</Typography>
                                        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                            查看用量/成本汇总与关键操作日志（MVP）
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            <Stack direction='row' spacing={1}>
                                                <Button variant='contained' size='small' onClick={() => navigate('/support/usage')}>
                                                    用量/成本
                                                </Button>
                                                <Button variant='outlined' size='small' onClick={() => navigate('/support/audit')}>
                                                    审计日志
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card variant='outlined' sx={{ borderRadius: 2, height: '100%' }}>
                                    <CardContent>
                                        <Typography variant='h6'>客服模板库</Typography>
                                        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                            从市场一键复用“客服机器人（基础）”等模板
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            <Button variant='contained' size='small' onClick={() => navigate('/marketplaces')}>
                                                打开市场
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card variant='outlined' sx={{ borderRadius: 2, height: '100%' }}>
                                    <CardContent>
                                        <Typography variant='h6'>对话流管理</Typography>
                                        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                            管理客服对话流、发布与配置
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            <Button variant='contained' size='small' onClick={() => navigate('/chatflows')}>
                                                进入聊天流
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Card variant='outlined' sx={{ borderRadius: 2, height: '100%' }}>
                                    <CardContent>
                                        <Typography variant='h6'>嵌入发布</Typography>
                                        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                                            使用 Embed/Chatbot 链接把机器人挂到官网
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            <Stack direction='row' spacing={1}>
                                                <Button variant='outlined' size='small' onClick={() => navigate('/chatflows')}>
                                                    去生成嵌入代码
                                                </Button>
                                                <Button variant='text' size='small' onClick={() => navigate('/chatbot')}>
                                                    访问 Chatbot
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

            </Stack>
        </MainCard>
    )
}

export default SupportWorkbench

