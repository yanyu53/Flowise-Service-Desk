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
import supportTicketsApi from '@/api/supportTickets'

const statusLabel = {
    new: '新建',
    open: '处理中',
    pending: '待回复',
    closed: '已关闭'
}

const statusColor = {
    new: 'default',
    open: 'primary',
    pending: 'warning',
    closed: 'success'
}

const channelLabel = {
    web: '网页',
    feishu: '飞书',
    wecom: '企微',
    dingtalk: '钉钉',
    mp: '公众号',
    unknown: '未知'
}

const SupportTickets = () => {
    const listTicketsApi = useApi(supportTicketsApi.listTickets)
    const updateTicketApi = useApi(supportTicketsApi.updateTicket)

    const [error, setError] = useState(null)
    const [isLoading, setLoading] = useState(true)

    const [items, setItems] = useState([])
    const [total, setTotal] = useState(0)

    const [filters, setFilters] = useState({
        status: '',
        channel: ''
    })

    /* Pagination */
    const [currentPage, setCurrentPage] = useState(1)
    const [pageLimit, setPageLimit] = useState(() => Number(localStorage.getItem('supportTicketsPageSize') || DEFAULT_ITEMS_PER_PAGE))

    const queryParams = useMemo(() => {
        const limit = pageLimit
        const offset = (currentPage - 1) * pageLimit
        const params = { limit, offset }
        if (filters.status) params.status = filters.status
        if (filters.channel) params.channel = filters.channel
        return params
    }, [currentPage, pageLimit, filters])

    const refresh = () => listTicketsApi.request(queryParams)

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams])

    useEffect(() => {
        setLoading(listTicketsApi.loading)
    }, [listTicketsApi.loading])

    useEffect(() => {
        if (listTicketsApi.error) setError(listTicketsApi.error)
    }, [listTicketsApi.error])

    useEffect(() => {
        if (listTicketsApi.data) {
            const { items, total } = listTicketsApi.data
            setItems(Array.isArray(items) ? items : [])
            setTotal(typeof total === 'number' ? total : 0)
        }
    }, [listTicketsApi.data])

    useEffect(() => {
        if (updateTicketApi.error) setError(updateTicketApi.error)
    }, [updateTicketApi.error])

    const onChange = (page, nextLimit) => {
        setCurrentPage(page)
        setPageLimit(nextLimit)
        localStorage.setItem('supportTicketsPageSize', nextLimit)
    }

    const updateStatus = async (ticketId, nextStatus) => {
        await updateTicketApi.request(ticketId, { status: nextStatus })
        refresh()
    }

    return (
        <MainCard>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <ViewHeader title='工单' description='查看与处理转人工工单' />

                    <Box sx={{ width: '100%' }}>
                        <Grid container spacing={2} alignItems='center'>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='ticket-status'>状态</InputLabel>
                                    <Select
                                        labelId='ticket-status'
                                        label='状态'
                                        value={filters.status}
                                        onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                                        size='small'
                                    >
                                        <MenuItem value=''>全部</MenuItem>
                                        <MenuItem value='new'>新建</MenuItem>
                                        <MenuItem value='open'>处理中</MenuItem>
                                        <MenuItem value='pending'>待回复</MenuItem>
                                        <MenuItem value='closed'>已关闭</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='ticket-channel'>渠道</InputLabel>
                                    <Select
                                        labelId='ticket-channel'
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
                                    <Button size='small' variant='outlined' onClick={() => setFilters({ status: '', channel: '' })}>
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
                                    <TableCell>创建时间</TableCell>
                                    <TableCell>渠道</TableCell>
                                    <TableCell>联系人</TableCell>
                                    <TableCell>问题</TableCell>
                                    <TableCell>状态</TableCell>
                                    <TableCell align='right'>操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {!isLoading &&
                                    items.map((t) => (
                                        <TableRow key={t.id} hover>
                                            <TableCell>
                                                <Typography variant='body2'>
                                                    {t.createdDate ? new Date(t.createdDate).toLocaleString() : '-'}
                                                </Typography>
                                                <Typography variant='caption' color='text.secondary'>
                                                    ID: {t.id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{channelLabel[t.channel] ?? t.channel}</TableCell>
                                            <TableCell>
                                                <Typography variant='body2'>{t.name || '-'}</Typography>
                                                <Typography variant='caption' color='text.secondary'>
                                                    {t.phone || t.email || ''}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 420 }}>
                                                <Typography
                                                    variant='body2'
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {t.issue || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size='small'
                                                    label={statusLabel[t.status] ?? t.status}
                                                    color={statusColor[t.status] ?? 'default'}
                                                    variant={t.status === 'new' ? 'outlined' : 'filled'}
                                                />
                                            </TableCell>
                                            <TableCell align='right'>
                                                <Stack direction='row' spacing={1} justifyContent='flex-end'>
                                                    {t.status !== 'open' && (
                                                        <Button size='small' onClick={() => updateStatus(t.id, 'open')}>
                                                            处理
                                                        </Button>
                                                    )}
                                                    {t.status !== 'pending' && (
                                                        <Button size='small' onClick={() => updateStatus(t.id, 'pending')}>
                                                            待回复
                                                        </Button>
                                                    )}
                                                    {t.status !== 'closed' && (
                                                        <Button size='small' color='success' onClick={() => updateStatus(t.id, 'closed')}>
                                                            关闭
                                                        </Button>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                {!isLoading && items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6}>
                                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                                <Typography color='text.secondary'>暂无工单</Typography>
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

export default SupportTickets

