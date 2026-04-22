import express from 'express'
import { feishuWebhook } from '../../controllers/support-feishu'

const router = express.Router()

router.post('/webhook', feishuWebhook)

export default router

