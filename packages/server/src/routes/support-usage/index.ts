import express from 'express'
import supportUsageController from '../../controllers/support-usage'

const router = express.Router()

router.get('/usage/summary', supportUsageController.getSummary)
router.get('/usage/kpis', supportUsageController.getKpis)

export default router

