import { useEffect, useMemo, useState } from 'react'

// material-ui
import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Typography, Paper } from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'

// API + hooks
import useApi from '@/hooks/useApi'
import supportUsageApi from '@/api/supportUsage'

const SupportUsage = () => {
    const summaryApi = useApi(supportUsageApi.getSummary)

    const [error, setError] = useState(null)
    const [isLoading, setLoading] = useState(true)

    const [filters, setFilters] = useState({
        channel: '',
        range: '7d'
    })

    const queryParams = useMemo(() => {
        const params = {}
        if (filters.channel) params.channel = filters.channel

        const now = new Date()
        const start = new Date(now)
        if (filters.range === '24h') start.setHours(now.getHours() - 24)
        else if (filters.range === '7d') start.setDate(now.getDate() - 7)
        else if (filters.range === '30d') start.setDate(now.getDate() - 30)

        params.startAt = start.toISOString()
        params.endAt = now.toISOString()
        return params
    }, [filters])

    const refresh = () => summaryApi.request(queryParams)

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams])

    useEffect(() => setLoading(summaryApi.loading), [summaryApi.loading])
    useEffect(() => {
        if (summaryApi.error) setError(summaryApi.error)
    }, [summaryApi.error])

    const data = summaryApi.data || {}

    return (
        <MainCard>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <ViewHeader title='用量与成本（MVP）' description='按渠道/时间范围查看预测与转人工事件的汇总' />

                    <Box sx={{ width: '100%' }}>
                        <Grid container spacing={2} alignItems='center'>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='usage-range'>时间范围</InputLabel>
                                    <Select
                                        labelId='usage-range'
                                        label='时间范围'
                                        value={filters.range}
                                        onChange={(e) => setFilters((prev) => ({ ...prev, range: e.target.value }))}
                                        size='small'
                                    >
                                        <MenuItem value='24h'>近 24 小时</MenuItem>
                                        <MenuItem value='7d'>近 7 天</MenuItem>
                                        <MenuItem value='30d'>近 30 天</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='usage-channel'>渠道</InputLabel>
                                    <Select
                                        labelId='usage-channel'
                                        label='渠道'
                                        value={filters.channel}
                                        onChange={(e) => setFilters((prev) => ({ ...prev, channel: e.target.value }))}
                                        size='small'
                                    >
                                        <MenuItem value=''>全部</MenuItem>
                                        <MenuItem value='feishu'>飞书</MenuItem>
                                        <MenuItem value='web'>网页</MenuItem>
                                        <MenuItem value='wecom'>企微</MenuItem>
                                        <MenuItem value='dingtalk'>钉钉</MenuItem>
                                        <MenuItem value='mp'>公众号</MenuItem>
                                        <MenuItem value='unknown'>未知</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Stack direction='row' spacing={1} justifyContent='flex-end'>
                                    <Button size='small' variant='outlined' onClick={() => setFilters({ channel: '', range: '7d' })}>
                                        重置
                                    </Button>
                                    <Button size='small' variant='contained' onClick={refresh} disabled={isLoading}>
                                        刷新
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Box>

                    <Paper variant='outlined' sx={{ borderRadius: 2, p: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <Typography variant='body2' color='text.secondary'>
                                    事件总数
                                </Typography>
                                <Typography variant='h4'>{isLoading ? '—' : data.totalEvents ?? 0}</Typography>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Typography variant='body2' color='text.secondary'>
                                    预测次数
                                </Typography>
                                <Typography variant='h4'>{isLoading ? '—' : data.predictions ?? 0}</Typography>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Typography variant='body2' color='text.secondary'>
                                    转人工次数
                                </Typography>
                                <Typography variant='h4'>{isLoading ? '—' : data.handoffs ?? 0}</Typography>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Typography variant='body2' color='text.secondary'>
                                    会话（全量）
                                </Typography>
                                <Typography variant='h4'>{isLoading ? '—' : data.conversations ?? 0}</Typography>
                            </Grid>
                        </Grid>
                        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 2 }}>
                            说明：当前为 MVP 汇总，token/费用会在后续版本补齐到节点级统计与预算/告警。
                        </Typography>
                    </Paper>
                </Stack>
            )}
        </MainCard>
    )
}

export default SupportUsage

