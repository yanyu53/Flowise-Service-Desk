import client from './client'

const listTickets = (params) => client.get('/support/tickets', { params })
const getTicket = (id) => client.get(`/support/tickets/${id}`)
const createTicket = (body) => client.post('/support/tickets', body)
const updateTicket = (id, body) => client.put(`/support/tickets/${id}`, body)

export default {
    listTickets,
    getTicket,
    createTicket,
    updateTicket
}

