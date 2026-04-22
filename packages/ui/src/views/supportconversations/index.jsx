import { useEffect, useMemo, useState } from 'react'

// material-ui
import {
    Box,
    Button,
    Chip,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Paper
} from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'
import TablePagination, { DEFAULT_ITEMS_PER_PAGE } from '@/ui-component/pagination/TablePagination'

// API + hooks
import useApi from '@/hooks/useApi'
import supportCustomersApi from '@/api/supportCustomers'

const channelLabel = {
    web: '网页',
    feishu: '飞书',
    wecom: '企微',
    dingtalk: '钉钉',
    mp: '公众号',
    unknown: '未知'
}

const statusLabel = {
    open: '进行中',
    closed: '已结束'
}

const SupportConversations = () => {
    const listConversationsApi = useApi(supportCustomersApi.listConversations)

    const [error, setError] = useState(null)
    const [isLoading, setLoading] = useState(true)

    const [items, setItems] = useState([])
    const [total, setTotal] = useState(0)

    const [filters, setFilters] = useState({
        channel: '',
        status: '',
        customerId: '',
        ticketId: '',
        chatflowid: ''
    })

    /* Pagination */
    const [currentPage, setCurrentPage] = useState(1)
    const [pageLimit, setPageLimit] = useState(() => Number(localStorage.getItem('supportConversationsPageSize') || DEFAULT_ITEMS_PER_PAGE))

    const queryParams = useMemo(() => {
        const limit = pageLimit
        const offset = (currentPage - 1) * pageLimit
        const params = { limit, offset }
        if (filters.channel) params.channel = filters.channel
        if (filters.status) params.status = filters.status
        if (filters.customerId) params.customerId = filters.customerId
        if (filters.ticketId) params.ticketId = filters.ticketId
        if (filters.chatflowid) params.chatflowid = filters.chatflowid
        return params
    }, [currentPage, pageLimit, filters])

    const refresh = () => listConversationsApi.request(queryParams)

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams])

    useEffect(() => setLoading(listConversationsApi.loading), [listConversationsApi.loading])
    useEffect(() => {
        if (listConversationsApi.error) setError(listConversationsApi.error)
    }, [listConversationsApi.error])
    useEffect(() => {
        if (listConversationsApi.data) {
            const { items, total } = listConversationsApi.data
            setItems(Array.isArray(items) ? items : [])
            setTotal(typeof total === 'number' ? total : 0)
        }
    }, [listConversationsApi.data])

    const onChange = (page, nextLimit) => {
        setCurrentPage(page)
        setPageLimit(nextLimit)
        localStorage.setItem('supportConversationsPageSize', nextLimit)
    }

    return (
        <MainCard>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <ViewHeader title='会话' description='按 chatId 聚合的会话列表（可关联客户与工单）' />

                    <Box sx={{ width: '100%' }}>
                        <Grid container spacing={2} alignItems='center'>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='conv-status'>状态</InputLabel>
                                    <Select
                                        labelId='conv-status'
                                        label='状态'
                                        value={filters.status}
                                        onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                                        size='small'
                                    >
                                        <MenuItem value=''>全部</MenuItem>
                                        <MenuItem value='open'>进行中</MenuItem>
                                        <MenuItem value='closed'>已结束</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='conv-channel'>渠道</InputLabel>
                                    <Select
                                        labelId='conv-channel'
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
                            <Grid item xs={12} md={2}>
                                <TextField
                                    size='small'
                                    fullWidth
                                    label='工单ID'
                                    value={filters.ticketId}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, ticketId: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    size='small'
                                    fullWidth
                                    label='客户ID'
                                    value={filters.customerId}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, customerId: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    size='small'
                                    fullWidth
                                    label='chatflowId'
                                    value={filters.chatflowid}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, chatflowid: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Stack direction='row' spacing={1} justifyContent='flex-end'>
                                    <Button
                                        size='small'
                                        variant='outlined'
                                        onClick={() => setFilters({ channel: '', status: '', customerId: '', ticketId: '', chatflowid: '' })}
                                    >
                                        重置
                                    </Button>
                                    <Button size='small' variant='contained' onClick={refresh} disabled={isLoading}>
                                        刷新
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Box>

                    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                        <Table size='small'>
                            <TableHead>
                                <TableRow>
                                    <TableCell>最后消息</TableCell>
                                    <TableCell>渠道</TableCell>
                                    <TableCell>chatflowId / chatId</TableCell>
                                    <TableCell>关联</TableCell>
                                    <TableCell>状态</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {!isLoading &&
                                    items.map((t) => (
                                        <TableRow key={t.id} hover>
                                            <TableCell sx={{ maxWidth: 420 }}>
                                                <Typography variant='body2'>
                                                    {t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleString() : t.updatedDate ? new Date(t.updatedDate).toLocaleString() : '-'}
                                                </Typography>
                                                <Typography
                                                    variant='caption'
                                                    color='text.secondary'
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {t.lastUserMessage || ''}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size='small' variant='outlined' label={channelLabel[t.channel] ?? t.channel} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant='caption' color='text.secondary'>
                                                    chatflowid
                                                </Typography>
                                                <Typography variant='body2'>{t.chatflowid}</Typography>
                                                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                                                    chatId
                                                </Typography>
                                                <Typography variant='body2'>{t.chatId}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant='body2'>客户: {t.customerId || '-'}</Typography>
                                                <Typography variant='body2'>工单: {t.ticketId || '-'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size='small' label={statusLabel[t.status] ?? t.status} color={t.status === 'open' ? 'primary' : 'default'} />
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                {!isLoading && items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                                <Typography color='text.secondary'>暂无会话数据（先产生一些对话再来看）</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {!isLoading && total > 0 && (
                        <TablePagination currentPage={currentPage} limit={pageLimit} total={total} onChange={onChange} />
                    )}
                </Stack>
            )}
        </MainCard>
    )
}

export default SupportConversations

