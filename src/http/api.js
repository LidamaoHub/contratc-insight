import { post } from './axios'

export const getReport = (data = {}) => post('/v1/get_report', data)
export const getProxyUpdate = (data = {}) => post('/v1/get_proxy_update_count', data)
export const getTxAmount = (data = {}) => post('/v1/get_tx_amount', data)
export const getShortUrl = (data = {}) => post('/v1/get_short_url', data)
export const setShortUrl = (data = {}) => post('/v1/set_short_url', data)
