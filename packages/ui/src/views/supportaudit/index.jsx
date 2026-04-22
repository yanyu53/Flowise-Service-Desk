import { useEffect, useMemo, useState } from 'react'

// material-ui
import {
    Box,
    Button,
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
    Paper,
    TextField,
    Chip
} from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'
import TablePagination, { DEFAULT_ITEMS_PER_PAGE } from '@/ui-component/pagination/TablePagination'

// API + hooks
import useApi from '@/hooks/useApi'
import supportAuditApi from '@/api/supportAudit'

const actionLabel = {
    'handoff.created': '转人工创建',
    'ticket.updated': '工单更新',
    'compliance.blocked': '合规拦截'
}

const actionColor = {
    'handoff.created': 'primary',
    'ticket.updated': 'warning',
    'compliance.blocked': 'error'
}

const SupportAudit = () => {
    const listApi = useApi(supportAuditApi.list)

    const [error, setError] = useState(null)
    const [isLoading, setLoading] = useState(true)

    const [items, setItems] = useState([])
    const [total, setTotal] = useState(0)

    const [filters, setFilters] = useState({
        action: '',
        ticketId: ''
    })

    /* Pagination */
    const [currentPage, setCurrentPage] = useState(1)
    const [pageLimit, setPageLimit] = useState(() => Number(localStorage.getItem('supportAuditPageSize') || DEFAULT_ITEMS_PER_PAGE))

    const queryParams = useMemo(() => {
        const limit = pageLimit
        const offset = (currentPage - 1) * pageLimit
        const params = { limit, offset }
        if (filters.action) params.action = filters.action
        if (filters.ticketId) params.ticketId = filters.ticketId
        return params
    }, [currentPage, pageLimit, filters])

    const refresh = () => listApi.request(queryParams)

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams])

    useEffect(() => setLoading(listApi.loading), [listApi.loading])
    useEffect(() => {
        if (listApi.error) setError(listApi.error)
    }, [listApi.error])
    useEffect(() => {
        if (listApi.data) {
            const { items, total } = listApi.data
            setItems(Array.isArray(items) ? items : [])
            setTotal(typeof total === 'number' ? total : 0)
        }
    }, [listApi.data])

    const onChange = (page, nextLimit) => {
        setCurrentPage(page)
        setPageLimit(nextLimit)
        localStorage.setItem('supportAuditPageSize', nextLimit)
    }

    return (
        <MainCard>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <ViewHeader title='审计日志（MVP）' description='记录转人工、工单更新、合规拦截等关键事件' />

                    <Box sx={{ width: '100%' }}>
                        <Grid container spacing={2} alignItems='center'>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='audit-action'>动作</InputLabel>
                                    <Select
                                        labelId='audit-action'
                                        label='动作'
                                        value={filters.action}
                                        onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
                                        size='small'
                                    >
                                        <MenuItem value=''>全部</MenuItem>
                                        <MenuItem value='handoff.created'>转人工创建</MenuItem>
                                        <MenuItem value='ticket.updated'>工单更新</MenuItem>
                                        <MenuItem value='compliance.blocked'>合规拦截</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    size='small'
                                    label='工单 ID'
                                    value={filters.ticketId}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, ticketId: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={5}>
                                <Stack direction='row' spacing={1} justifyContent='flex-end'>
                                    <Button size='small' variant='outlined' onClick={() => setFilters({ action: '', ticketId: '' })}>
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
                                    <TableCell>时间</TableCell>
                                    <TableCell>动作</TableCell>
                                    <TableCell>工单</TableCell>
                                    <TableCell>说明</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {!isLoading &&
                                    items.map((e) => (
                                        <TableRow key={e.id} hover>
                                            <TableCell>
                                                <Typography variant='body2'>
                                                    {e.createdDate ? new Date(e.createdDate).toLocaleString() : '-'}
                                                </Typography>
                                                <Typography variant='caption' color='text.secondary'>
                                                    ID: {e.id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size='small'
                                                    label={actionLabel[e.action] ?? e.action}
                                                    color={actionColor[e.action] ?? 'default'}
                                                    variant='outlined'
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant='body2'>{e.ticketId || '-'}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 520 }}>
                                                <Typography
                                                    variant='body2'
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {e.message || '-'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                {!isLoading && items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4}>
                                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                                <Typography color='text.secondary'>暂无审计事件</Typography>
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

export default SupportAudit

