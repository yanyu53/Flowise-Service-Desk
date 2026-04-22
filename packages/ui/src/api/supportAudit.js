import client from './client'

const list = (params) => client.get('/support/audit', { params })
const getSummary = (params) => client.get('/support/audit/summary', { params })

export default {
    list,
    getSummary
}

