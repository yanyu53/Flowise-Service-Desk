import express from 'express'
import supportTicketsController from '../../controllers/support-tickets'

const router = express.Router()

router.post('/', supportTicketsController.createTicket)
router.get('/', supportTicketsController.listTickets)
router.get('/:id', supportTicketsController.getTicket)
router.patch('/:id', supportTicketsController.updateTicket)

export default router

