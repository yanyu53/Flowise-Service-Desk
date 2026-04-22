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
import supportCustomersApi from '@/api/supportCustomers'

const channelLabel = {
    web: '网页',
    feishu: '飞书',
    wecom: '企微',
    dingtalk: '钉钉',
    mp: '公众号',
    unknown: '未知'
}

const SupportCustomers = () => {
    const listCustomersApi = useApi(supportCustomersApi.listCustomers)

    const [error, setError] = useState(null)
    const [isLoading, setLoading] = useState(true)

    const [items, setItems] = useState([])
    const [total, setTotal] = useState(0)

    const [filters, setFilters] = useState({
        channel: ''
    })

    /* Pagination */
    const [currentPage, setCurrentPage] = useState(1)
    const [pageLimit, setPageLimit] = useState(() => Number(localStorage.getItem('supportCustomersPageSize') || DEFAULT_ITEMS_PER_PAGE))

    const queryParams = useMemo(() => {
        const limit = pageLimit
        const offset = (currentPage - 1) * pageLimit
        const params = { limit, offset }
        if (filters.channel) params.channel = filters.channel
        return params
    }, [currentPage, pageLimit, filters])

    const refresh = () => listCustomersApi.request(queryParams)

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams])

    useEffect(() => setLoading(listCustomersApi.loading), [listCustomersApi.loading])
    useEffect(() => {
        if (listCustomersApi.error) setError(listCustomersApi.error)
    }, [listCustomersApi.error])
    useEffect(() => {
        if (listCustomersApi.data) {
            const { items, total } = listCustomersApi.data
            setItems(Array.isArray(items) ? items : [])
            setTotal(typeof total === 'number' ? total : 0)
        }
    }, [listCustomersApi.data])

    const onChange = (page, nextLimit) => {
        setCurrentPage(page)
        setPageLimit(nextLimit)
        localStorage.setItem('supportCustomersPageSize', nextLimit)
    }

    return (
        <MainCard>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <ViewHeader title='客户' description='按渠道聚合的客户列表（飞书 open_id / 网页 chatId 等）' />

                    <Box sx={{ width: '100%' }}>
                        <Grid container spacing={2} alignItems='center'>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='customer-channel'>渠道</InputLabel>
                                    <Select
                                        labelId='customer-channel'
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
                            <Grid item xs={12} md={10}>
                                <Stack direction='row' spacing={1} justifyContent='flex-end'>
                                    <Button size='small' variant='outlined' onClick={() => setFilters({ channel: '' })}>
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
                                    <TableCell>最后活跃</TableCell>
                                    <TableCell>渠道</TableCell>
                                    <TableCell>标识</TableCell>
                                    <TableCell>联系人</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {!isLoading &&
                                    items.map((c) => (
                                        <TableRow key={c.id} hover>
                                            <TableCell>
                                                <Typography variant='body2'>
                                                    {c.lastSeenAt ? new Date(c.lastSeenAt).toLocaleString() : c.updatedDate ? new Date(c.updatedDate).toLocaleString() : '-'}
                                                </Typography>
                                                <Typography variant='caption' color='text.secondary'>
                                                    ID: {c.id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size='small' variant='outlined' label={channelLabel[c.channel] ?? c.channel} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant='body2'>{c.externalUserId || c.chatId || '-'}</Typography>
                                                <Typography variant='caption' color='text.secondary'>
                                                    {c.externalUserId ? 'externalUserId' : 'chatId'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant='body2'>{c.name || '-'}</Typography>
                                                <Typography variant='caption' color='text.secondary'>
                                                    {c.phone || c.email || ''}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                {!isLoading && items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4}>
                                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                                <Typography color='text.secondary'>暂无客户数据（先产生一些对话再来看）</Typography>
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

export default SupportCustomers

