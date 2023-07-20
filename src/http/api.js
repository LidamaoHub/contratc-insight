import { post } from './axios'

export const getReport = (data = {}) => post('/v1/get_report', data)
