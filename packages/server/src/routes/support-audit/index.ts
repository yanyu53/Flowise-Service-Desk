import express from 'express'
import supportAuditController from '../../controllers/support-audit'

const router = express.Router()

router.get('/audit', supportAuditController.list)
router.get('/audit/summary', supportAuditController.getSummary)

export default router

