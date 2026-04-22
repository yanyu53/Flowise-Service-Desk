import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import { cloneDeep } from 'lodash'

import { Box, Button, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Stack, OutlinedInput } from '@mui/material'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { Grid } from '@/ui-component/grid/Grid'
import { TooltipWithParser } from '@/ui-component/tooltip/TooltipWithParser'
import { GridActionsCellItem } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import { CodeEditor } from '@/ui-component/editor/CodeEditor'
import HowToUseFunctionDialog from './HowToUseFunctionDialog'
import { PermissionButton, StyledPermissionButton } from '@/ui-component/button/RBACButtons'
import { Available } from '@/ui-component/rbac/available'
import ExportAsTemplateDialog from '@/ui-component/dialog/ExportAsTemplateDialog'
import PasteJSONDialog from './PasteJSONDialog'

// Icons
import { IconX, IconFileDownload, IconPlus, IconTemplate, IconCode } from '@tabler/icons-react'

// API
import toolsApi from '@/api/tools'

// Hooks
import useConfirm from '@/hooks/useConfirm'
import useApi from '@/hooks/useApi'

// utils
import useNotifier from '@/utils/useNotifier'
import { generateRandomGradient, formatDataGridRows } from '@/utils/genericHelper'
import { HIDE_CANVAS_DIALOG, SHOW_CANVAS_DIALOG } from '@/store/actions'

const exampleAPIFunc = `/*
* You can use any libraries imported in Flowise
* You can use properties specified in Input Schema as variables. Ex: Property = userid, Variable = $userid
* You can get default flow config: $flow.sessionId, $flow.chatId, $flow.chatflowId, $flow.input, $flow.state
* You can get custom variables: $vars.<variable-name>
* Must return a string value at the end of function
*/

const fetch = require('node-fetch');
const url = 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true';
const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};
try {
    const response = await fetch(url, options);
    const text = await response.text();
    return text;
} catch (error) {
    console.error(error);
    return '';
}`

const ToolDialog = ({ show, dialogProps, onUseTemplate, onCancel, onConfirm, setError }) => {
    const portalElement = document.getElementById('portal')

    const customization = useSelector((state) => state.customization)
    const dispatch = useDispatch()

    // ==============================|| Snackbar ||============================== //

    useNotifier()
    const { confirm } = useConfirm()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const getSpecificToolApi = useApi(toolsApi.getSpecificTool)

    const [toolId, setToolId] = useState('')
    const [toolName, setToolName] = useState('')
    const [toolDesc, setToolDesc] = useState('')
    const [toolIcon, setToolIcon] = useState('')
    const [toolSchema, setToolSchema] = useState([])
    const [toolFunc, setToolFunc] = useState('')
    const [showHowToDialog, setShowHowToDialog] = useState(false)

    const [exportAsTemplateDialogOpen, setExportAsTemplateDialogOpen] = useState(false)
    const [exportAsTemplateDialogProps, setExportAsTemplateDialogProps] = useState({})

    const [showPasteJSONDialog, setShowPasteJSONDialog] = useState(false)

    const deleteItem = useCallback(
        (id) => () => {
            setTimeout(() => {
                setToolSchema((prevRows) => prevRows.filter((row) => row.id !== id))
            })
        },
        []
    )

    const addNewRow = () => {
        setTimeout(() => {
            setToolSchema((prevRows) => {
                let allRows = [...cloneDeep(prevRows)]
                const lastRowId = allRows.length ? allRows[allRows.length - 1].id + 1 : 1
                allRows.push({
                    id: lastRowId,
                    property: '',
                    description: '',
                    type: '',
                    required: false
                })
                return allRows
            })
        })
    }

    const onSaveAsTemplate = () => {
        setExportAsTemplateDialogProps({
            title: '导出为模板',
            tool: {
                name: toolName,
                description: toolDesc,
                iconSrc: toolIcon,
                schema: toolSchema,
                func: toolFunc
            }
        })
        setExportAsTemplateDialogOpen(true)
    }

    const onRowUpdate = (newRow) => {
        setTimeout(() => {
            setToolSchema((prevRows) => {
                let allRows = [...cloneDeep(prevRows)]
                const indexToUpdate = allRows.findIndex((row) => row.id === newRow.id)
                if (indexToUpdate >= 0) {
                    allRows[indexToUpdate] = { ...newRow }
                }
                return allRows
            })
        })
    }

    const columns = useMemo(
        () => [
            { field: 'property', headerName: '属性', editable: true, flex: 1 },
            {
                field: 'type',
                headerName: '类型',
                type: 'singleSelect',
                valueOptions: ['string', 'number', 'boolean', 'date'],
                editable: true,
                width: 120
            },
            { field: 'description', headerName: '说明', editable: true, flex: 1 },
            { field: 'required', headerName: '必填', type: 'boolean', editable: true, width: 80 },
            {
                field: 'actions',
                type: 'actions',
                width: 80,
                getActions: (params) => [
                    <GridActionsCellItem key={'Delete'} icon={<DeleteIcon />} label='删除' onClick={deleteItem(params.id)} />
                ]
            }
        ],
        [deleteItem]
    )

    useEffect(() => {
        if (show) dispatch({ type: SHOW_CANVAS_DIALOG })
        else dispatch({ type: HIDE_CANVAS_DIALOG })
        return () => dispatch({ type: HIDE_CANVAS_DIALOG })
    }, [show, dispatch])

    useEffect(() => {
        if (getSpecificToolApi.data) {
            setToolId(getSpecificToolApi.data.id)
            setToolName(getSpecificToolApi.data.name)
            setToolDesc(getSpecificToolApi.data.description)
            setToolSchema(formatDataGridRows(getSpecificToolApi.data.schema))
            if (getSpecificToolApi.data.func) setToolFunc(getSpecificToolApi.data.func)
            else setToolFunc('')
        }
    }, [getSpecificToolApi.data])

    useEffect(() => {
        if (getSpecificToolApi.error && setError) {
            setError(getSpecificToolApi.error)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSpecificToolApi.error])

    useEffect(() => {
        if (dialogProps.type === 'EDIT' && dialogProps.data) {
            // When tool dialog is opened from Tools dashboard
            setToolId(dialogProps.data.id)
            setToolName(dialogProps.data.name)
            setToolDesc(dialogProps.data.description)
            setToolIcon(dialogProps.data.iconSrc)
            setToolSchema(formatDataGridRows(dialogProps.data.schema))
            if (dialogProps.data.func) setToolFunc(dialogProps.data.func)
            else setToolFunc('')
        } else if (dialogProps.type === 'EDIT' && dialogProps.toolId) {
            // When tool dialog is opened from CustomTool node in canvas
            getSpecificToolApi.request(dialogProps.toolId)
        } else if (dialogProps.type === 'IMPORT' && dialogProps.data) {
            // When tool dialog is to import existing tool
            setToolName(dialogProps.data.name)
            setToolDesc(dialogProps.data.description)
            setToolIcon(dialogProps.data.iconSrc)
            setToolSchema(formatDataGridRows(dialogProps.data.schema))
            if (dialogProps.data.func) setToolFunc(dialogProps.data.func)
            else setToolFunc('')
        } else if (dialogProps.type === 'TEMPLATE' && dialogProps.data) {
            // When tool dialog is a template
            setToolName(dialogProps.data.name)
            setToolDesc(dialogProps.data.description)
            setToolIcon(dialogProps.data.iconSrc)
            setToolSchema(formatDataGridRows(dialogProps.data.schema))
            if (dialogProps.data.func) setToolFunc(dialogProps.data.func)
            else setToolFunc('')
        } else if (dialogProps.type === 'ADD') {
            // When tool dialog is to add a new tool
            setToolId('')
            setToolName('')
            setToolDesc('')
            setToolIcon('')
            setToolSchema([])
            setToolFunc('')
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dialogProps])

    const useToolTemplate = () => {
        onUseTemplate(dialogProps.data)
    }

    const exportTool = async () => {
        try {
            const toolResp = await toolsApi.getSpecificTool(toolId)
            if (toolResp.data) {
                const toolData = toolResp.data
                delete toolData.id
                delete toolData.createdDate
                delete toolData.updatedDate
                let dataStr = JSON.stringify(toolData, null, 2)
                //let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
                const blob = new Blob([dataStr], { type: 'application/json' })
                const dataUri = URL.createObjectURL(blob)

                let exportFileDefaultName = `${toolName}-CustomTool.json`

                let linkElement = document.createElement('a')
                linkElement.setAttribute('href', dataUri)
                linkElement.setAttribute('download', exportFileDefaultName)
                linkElement.click()
            }
        } catch (error) {
            enqueueSnackbar({
                message: `导出工具失败：${
                    typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                }`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: true,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
            onCancel()
        }
    }

    const addNewTool = async () => {
        try {
            const obj = {
                name: toolName,
                description: toolDesc,
                color: generateRandomGradient(),
                schema: JSON.stringify(toolSchema),
                func: toolFunc,
                iconSrc: toolIcon
            }
            const createResp = await toolsApi.createNewTool(obj)
            if (createResp.data) {
                enqueueSnackbar({
                    message: '工具已新增',
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
                onConfirm(createResp.data.id)
            }
        } catch (error) {
            enqueueSnackbar({
                message: `新增工具失败：${
                    typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                }`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: true,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
            onCancel()
        }
    }

    const saveTool = async () => {
        try {
            const saveResp = await toolsApi.updateTool(toolId, {
                name: toolName,
                description: toolDesc,
                schema: JSON.stringify(toolSchema),
                func: toolFunc,
                iconSrc: toolIcon
            })
            if (saveResp.data) {
                enqueueSnackbar({
                    message: '工具已保存',
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
                onConfirm(saveResp.data.id)
            }
        } catch (error) {
            enqueueSnackbar({
                message: `保存工具失败：${
                    typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                }`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: true,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
            onCancel()
        }
    }

    const deleteTool = async () => {
        const confirmPayload = {
            title: '删除工具',
            description: `确认删除工具 ${toolName} 吗？`,
            confirmButtonName: '删除',
            cancelButtonName: '取消'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                const delResp = await toolsApi.deleteTool(toolId)
                if (delResp.data) {
                    enqueueSnackbar({
                        message: '工具已删除',
                        options: {
                            key: new Date().getTime() + Math.random(),
                            variant: 'success',
                            action: (key) => (
                                <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                    <IconX />
                                </Button>
                            )
                        }
                    })
                    onConfirm()
                }
            } catch (error) {
                enqueueSnackbar({
                    message: `删除工具失败：${
                        typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                    }`,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        persist: true,
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
                onCancel()
            }
        }
    }

    const handlePastedJSON = (formattedData) => {
        setToolSchema(formattedData)
        setShowPasteJSONDialog(false)
    }

    const component = show ? (
        <Dialog
            fullWidth
            maxWidth='md'
            open={show}
            onClose={onCancel}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
        >
            <DialogTitle sx={{ fontSize: '1rem', p: 3, pb: 0 }} id='alert-dialog-title'>
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    {dialogProps.title}
                    <Box>
                        {dialogProps.type === 'EDIT' && (
                            <>
                                <PermissionButton
                                    permissionId={'templates:toolexport'}
                                    style={{ marginRight: '10px' }}
                                    variant='outlined'
                                    onClick={() => onSaveAsTemplate()}
                                    startIcon={<IconTemplate />}
                                    color='secondary'
                                >
                                    导出为模板
                                </PermissionButton>
                                <PermissionButton
                                    permissionId={'tools:export'}
                                    variant='outlined'
                                    onClick={() => exportTool()}
                                    startIcon={<IconFileDownload />}
                                >
                                    导出
                                </PermissionButton>
                            </>
                        )}
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '75vh', position: 'relative', px: 3, pb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <Box>
                        <Stack sx={{ position: 'relative', alignItems: 'center' }} direction='row'>
                            <Typography variant='overline'>
                                工具名称
                                <span style={{ color: 'red' }}>&nbsp;*</span>
                            </Typography>
                            <TooltipWithParser title={'工具名建议使用小写字母和下划线，例如：my_tool'} />
                        </Stack>
                        <OutlinedInput
                            id='toolName'
                            type='string'
                            fullWidth
                            disabled={dialogProps.type === 'TEMPLATE'}
                            placeholder='我的新工具'
                            value={toolName}
                            name='toolName'
                            onChange={(e) => setToolName(e.target.value)}
                        />
                    </Box>
                    <Box>
                        <Stack sx={{ position: 'relative', alignItems: 'center' }} direction='row'>
                            <Typography variant='overline'>
                                工具描述
                                <span style={{ color: 'red' }}>&nbsp;*</span>
                            </Typography>
                            <TooltipWithParser
                                title={'用于描述工具用途，帮助模型判断何时调用该工具。'}
                            />
                        </Stack>
                        <OutlinedInput
                            id='toolDesc'
                            type='string'
                            fullWidth
                            disabled={dialogProps.type === 'TEMPLATE'}
                            placeholder='请描述该工具的用途，帮助模型判断何时调用。'
                            multiline={true}
                            rows={3}
                            value={toolDesc}
                            name='toolDesc'
                            onChange={(e) => setToolDesc(e.target.value)}
                        />
                    </Box>
                    <Box>
                        <Stack sx={{ position: 'relative' }} direction='row'>
                            <Typography variant='overline'>工具图标地址</Typography>
                        </Stack>
                        <OutlinedInput
                            id='toolIcon'
                            type='string'
                            fullWidth
                            disabled={dialogProps.type === 'TEMPLATE'}
                            placeholder='https://raw.githubusercontent.com/gilbarbara/logos/main/logos/airtable.svg'
                            value={toolIcon}
                            name='toolIcon'
                            onChange={(e) => setToolIcon(e.target.value)}
                        />
                    </Box>
                    <Box>
                        <Stack sx={{ position: 'relative', justifyContent: 'space-between' }} direction='row'>
                            <Stack sx={{ position: 'relative', alignItems: 'center' }} direction='row'>
                                <Typography variant='overline'>输入 Schema</Typography>
                                <TooltipWithParser title={'JSON 格式的输入定义。'} />
                            </Stack>
                            {dialogProps.type !== 'TEMPLATE' && (
                                <Stack direction='row' spacing={1}>
                                    <Button variant='outlined' onClick={() => setShowPasteJSONDialog(true)} startIcon={<IconCode />}>
                                        粘贴 JSON
                                    </Button>
                                    <Button variant='outlined' onClick={addNewRow} startIcon={<IconPlus />}>
                                        添加项
                                    </Button>
                                </Stack>
                            )}
                        </Stack>
                        <Grid columns={columns} rows={toolSchema} disabled={dialogProps.type === 'TEMPLATE'} onRowUpdate={onRowUpdate} />
                    </Box>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Stack sx={{ position: 'relative', alignItems: 'center' }} direction='row'>
                                <Typography variant='overline'>Javascript 函数</Typography>
                                <TooltipWithParser title='工具被调用时将执行该函数。你可以将 Input Schema 中定义的属性作为变量使用，例如属性 <code>userid</code> 可通过 <code>$userid</code> 访问。函数返回值必须是字符串。你也可以参考这份 <a target="_blank" href="https://docs.flowiseai.com/tools/custom-tool#override-function-from-api">指南</a>，通过 API 覆盖函数代码。' />
                            </Stack>
                            <Stack direction='row'>
                                <Button
                                    style={{ marginBottom: 10, marginRight: 10 }}
                                    color='secondary'
                                    variant='text'
                                    onClick={() => setShowHowToDialog(true)}
                                >
                                    函数使用说明
                                </Button>
                                {dialogProps.type !== 'TEMPLATE' && (
                                    <Button style={{ marginBottom: 10 }} variant='outlined' onClick={() => setToolFunc(exampleAPIFunc)}>
                                        查看示例
                                    </Button>
                                )}
                            </Stack>
                        </Box>
                        <CodeEditor
                            disabled={dialogProps.type === 'TEMPLATE'}
                            value={toolFunc}
                            theme={customization.isDarkMode ? 'dark' : 'light'}
                            lang={'js'}
                            onValueChange={(code) => setToolFunc(code)}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                {dialogProps.type === 'EDIT' && (
                    <StyledPermissionButton permissionId={'tools:delete'} color='error' variant='contained' onClick={() => deleteTool()}>
                        删除
                    </StyledPermissionButton>
                )}
                {dialogProps.type === 'TEMPLATE' && (
                    <Available permission={'tools:view,tools:create'}>
                        <StyledButton color='secondary' variant='contained' onClick={useToolTemplate}>
                            使用模板
                        </StyledButton>
                    </Available>
                )}
                {dialogProps.type !== 'TEMPLATE' && (
                    <StyledPermissionButton
                        permissionId={'tools:update,tools:create'}
                        disabled={!(toolName && toolDesc)}
                        variant='contained'
                        onClick={() => (dialogProps.type === 'ADD' || dialogProps.type === 'IMPORT' ? addNewTool() : saveTool())}
                    >
                        {dialogProps.confirmButtonName}
                    </StyledPermissionButton>
                )}
            </DialogActions>
            <ConfirmDialog />
            {exportAsTemplateDialogOpen && (
                <ExportAsTemplateDialog
                    show={exportAsTemplateDialogOpen}
                    dialogProps={exportAsTemplateDialogProps}
                    onCancel={() => setExportAsTemplateDialogOpen(false)}
                />
            )}

            <HowToUseFunctionDialog show={showHowToDialog} onCancel={() => setShowHowToDialog(false)} />

            {showPasteJSONDialog && (
                <PasteJSONDialog
                    show={showPasteJSONDialog}
                    onCancel={() => setShowPasteJSONDialog(false)}
                    onConfirm={handlePastedJSON}
                    customization={customization}
                />
            )}
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

ToolDialog.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    onUseTemplate: PropTypes.func,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func,
    setError: PropTypes.func
}

export default ToolDialog
