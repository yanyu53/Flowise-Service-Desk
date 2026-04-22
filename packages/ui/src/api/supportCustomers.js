import client from './client'

const listCustomers = (params) => client.get('/support/customers', { params })
const listConversations = (params) => client.get('/support/conversations', { params })
const getDashboard = () => client.get('/support/dashboard')

export default {
    listCustomers,
    listConversations,
    getDashboard
}

