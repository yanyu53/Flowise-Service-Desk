import express from 'express'
import supportChannelsController from '../../controllers/support-channels'

const router = express.Router()

router.post('/:channel/webhook', supportChannelsController.webhook)

export default router

