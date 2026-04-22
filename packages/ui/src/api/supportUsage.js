import client from './client'

const getSummary = (params) => client.get('/support/usage/summary', { params })
const getKpis = (params) => client.get('/support/usage/kpis', { params })

export default {
    getSummary,
    getKpis
}

