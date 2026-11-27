import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toApiError } from './errors'

/**
 * The only Axios instance the app uses. Feature api/ modules import this; components never do.
 * Auth is a Sanctum session cookie; Axios copies the XSRF-TOKEN cookie into the X-XSRF-TOKEN header.
 */
export const http = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
})

let csrfRequest: Promise<unknown> | null = null

/** Asks Laravel to set the XSRF-TOKEN cookie. Concurrent callers share one request. */
export function fetchCsrfCookie(): Promise<unknown> {
  csrfRequest ??= axios.get('/sanctum/csrf-cookie', { withCredentials: true }).finally(() => {
    csrfRequest = null
  })
  return csrfRequest
}

const hasXsrfCookie = () => document.cookie.split('; ').some((c) => c.startsWith('XSRF-TOKEN='))
const SAFE_METHODS = ['get', 'head', 'options']

http.interceptors.request.use(async (config) => {
  if (!SAFE_METHODS.includes((config.method ?? 'get').toLowerCase()) && !hasXsrfCookie()) {
    await fetchCsrfCookie()
  }
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _csrfRetried?: boolean }

http.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetriableConfig | undefined
  // 419 = CSRF token expired: refresh it and retry once.
  if (error.response?.status === 419 && config && !config._csrfRetried) {
    config._csrfRetried = true
    await fetchCsrfCookie()
    return http(config)
  }
  return Promise.reject(toApiError(error))
})
