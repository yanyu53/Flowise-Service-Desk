import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { Dialog, DialogContent, DialogTitle } from '@mui/material'
import { CodeEditor } from '@/ui-component/editor/CodeEditor'

const overrideConfig = `{
    overrideConfig: {
        vars: {
            var1: 'abc'
        }
    }
}`

const HowToUseVariablesDialog = ({ show, onCancel }) => {
    const portalElement = document.getElementById('portal')

    const component = show ? (
        <Dialog
            onClose={onCancel}
            open={show}
            fullWidth
            maxWidth='sm'
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
        >
            <DialogTitle sx={{ fontSize: '1rem' }} id='alert-dialog-title'>
                变量使用说明
            </DialogTitle>
            <DialogContent>
                <p style={{ marginBottom: '10px' }}>
                    变量可在自定义工具、自定义函数、自定义加载器、If Else 函数中使用，前缀为 `$`。
                </p>
                <CodeEditor
                    disabled={true}
                    value={`$vars.<variable-name>`}
                    height={'50px'}
                    theme={'dark'}
                    lang={'js'}
                    basicSetup={{ highlightActiveLine: false, highlightActiveLineGutter: false }}
                />
                <p style={{ marginBottom: '10px' }}>
                    变量也可用于任意节点的文本参数。例如在智能体的系统消息中：
                </p>
                <CodeEditor
                    disabled={true}
                    value={`You are a {{$vars.personality}} AI assistant`}
                    height={'50px'}
                    theme={'dark'}
                    lang={'js'}
                    basicSetup={{ highlightActiveLine: false, highlightActiveLineGutter: false }}
                />
                <p style={{ marginBottom: '10px' }}>
                    若变量类型为静态，则直接使用变量值；若为运行时，则从 `.env` 文件读取。
                </p>
                <p style={{ marginBottom: '10px' }}>
                    也可以在 API 的 `overrideConfig` 中通过 <b>vars</b> 覆盖变量值：
                </p>
                <CodeEditor
                    disabled={true}
                    value={overrideConfig}
                    height={'170px'}
                    theme={'dark'}
                    lang={'js'}
                    basicSetup={{ highlightActiveLine: false, highlightActiveLineGutter: false }}
                />
                <p>
                    更多说明请查看{' '}
                    <a target='_blank' rel='noreferrer' href='https://docs.flowiseai.com/using-flowise/variables'>
                        文档
                    </a>
                </p>
            </DialogContent>
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

HowToUseVariablesDialog.propTypes = {
    show: PropTypes.bool,
    onCancel: PropTypes.func
}

export default HowToUseVariablesDialog
