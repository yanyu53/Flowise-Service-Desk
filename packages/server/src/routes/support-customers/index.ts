import express from 'express'
import supportCustomersController from '../../controllers/support-customers'

const router = express.Router()

router.get('/customers', supportCustomersController.listCustomers)
router.get('/conversations', supportCustomersController.listConversations)
router.get('/dashboard', supportCustomersController.getDashboard)

export default router

