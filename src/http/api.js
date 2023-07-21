import { post } from './axios'

export const getReport = (data = {}) => post('/v1/get_report', data)
export const getRiskList = (data = {}) => post('/v1/get_risk_list', data)
