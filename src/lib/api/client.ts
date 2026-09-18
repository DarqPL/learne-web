import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import { tokenStore } from '../auth/tokenStore'
import type { AuthTokenResponse } from './types'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

interface RetriableConfig extends AxiosRequestConfig {
  _retried?: boolean
}

const PUBLIC_PATHS = new Set<string>([
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/register/request-otp',
  '/api/auth/register/verify-otp',
  '/api/auth/register/resend-otp',
  '/api/auth/password-reset/request',
  '/api/auth/password-reset/confirm',
])

function isPublicPath(url: string): boolean {
  return PUBLIC_PATHS.has(url.split('?')[0])
}

function buildRetryHeaders(headers: AxiosRequestConfig['headers'], accessToken: string): AxiosRequestConfig['headers'] {
  const toJSON = (headers as { toJSON?: () => Record<string, unknown> } | undefined)?.toJSON
  const existingHeaders = typeof toJSON === 'function' ? toJSON.call(headers) : { ...(headers ?? {}) }

  return {
    ...existingHeaders,
    Authorization: `Bearer ${accessToken}`,
  } as AxiosRequestConfig['headers']
}

let refreshPromise: Promise<AuthTokenResponse> | null = null
let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

async function doRefresh(): Promise<AuthTokenResponse> {
  const response = await http.post<AuthTokenResponse>('/api/auth/refresh')
  tokenStore.set(response.data.accessToken)
  return response.data
}

export function refreshAccessToken(): Promise<AuthTokenResponse> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

http.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { response, config } = error
    if (
      !config ||
      !response ||
      response.status !== 401 ||
      isPublicPath(config.url ?? '')
    ) {
      return Promise.reject(error)
    }
    if ((config as RetriableConfig)._retried === true) {
      tokenStore.clear()
      unauthorizedHandler?.()
      return Promise.reject(error)
    }
    try {
      const { accessToken } = await refreshAccessToken()
      const retryConfig = {
        ...config,
        _retried: true,
        headers: buildRetryHeaders(config.headers, accessToken),
      } as RetriableConfig
      return http.request(retryConfig)
    } catch (refreshError) {
      tokenStore.clear()
      unauthorizedHandler?.()
      return Promise.reject(refreshError)
    }
  },
)

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    if (data?.message) {
      return data.message
    }
    if (error.response?.status === 401) {
      return 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.'
    }
  }
  return fallback
}
