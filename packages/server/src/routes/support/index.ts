import express from 'express'
import supportController from '../../controllers/support'
import supportTicketsRouter from '../support-tickets'
import supportChannelsRouter from '../support-channels'
import supportFeishuRouter from '../support-feishu'
import supportCustomersRouter from '../support-customers'
import supportUsageRouter from '../support-usage'
import supportAuditRouter from '../support-audit'

const router = express.Router()

// 转人工 / 留资 / 工单（MVP）
router.post('/handoff', supportController.handoffToHuman)
router.use('/tickets', supportTicketsRouter)
router.use('/channels', supportChannelsRouter)
router.use('/feishu', supportFeishuRouter)
router.use('/', supportCustomersRouter)
router.use('/', supportUsageRouter)
router.use('/', supportAuditRouter)

export default router

