import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, setUnauthorizedHandler } from './client'
import { adminResendTeacherInvitation } from './adminApi'
import { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { tokenStore } from '../auth/tokenStore'

describe('adminResendTeacherInvitation', () => {
  const originalAdapter = http.defaults.adapter
  const onUnauthorized = vi.fn()
  const url = '/api/admin/teachers/7/invitation/resend'
  beforeEach(() => {
    onUnauthorized.mockReset()
    setUnauthorizedHandler(onUnauthorized)
    tokenStore.set('expired-token')
  })
  afterEach(() => {
    http.defaults.adapter = originalAdapter
    setUnauthorizedHandler(() => {})
    tokenStore.clear()
    vi.restoreAllMocks()
  })

  it('refreshes once after pre-business 401 and repeats the authorized POST without logging out', async () => {
    const data = { status: 'QUEUED', requestedAt: null, completedAt: null, failureCode: null, canResend: false }
    const requests: { url: string | undefined; method: string | undefined; authorization: unknown; data: unknown }[] = []
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      requests.push({ url: config.url, method: config.method, authorization: config.headers.Authorization, data: config.data })
      if (config.url === '/api/auth/refresh') {
        return { status: 200, statusText: 'OK', headers: {}, config, data: { accessToken: 'fresh-token' } }
      }
      if (requests.length === 1) {
        throw new AxiosError('expired JWT', 'ERR_BAD_RESPONSE', config, undefined, {
          status: 401, statusText: 'Unauthorized', headers: {}, config, data: {},
        })
      }
      return { status: 202, statusText: 'Accepted', headers: {}, config, data }
    })
    http.defaults.adapter = adapter

    const response = await adminResendTeacherInvitation(7)

    expect(response.status).toBe(202)
    expect(response.data).toEqual(data)
    expect(requests).toEqual([
      { url, method: 'post', authorization: 'Bearer expired-token', data: undefined },
      { url: '/api/auth/refresh', method: 'post', authorization: 'Bearer expired-token', data: undefined },
      { url, method: 'post', authorization: 'Bearer fresh-token', data: undefined },
    ])
    expect(tokenStore.get()).toBe('fresh-token')
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it.each([409, 503, null])('does not replay a business/server/network failure (%s)', async (status) => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      if (status === null) throw new AxiosError('network failure', 'ERR_NETWORK', config)
      throw new AxiosError('rejected', 'ERR_BAD_RESPONSE', config, undefined, {
        data: { message: 'rejected' }, status, statusText: 'Error', headers: {}, config,
      })
    })
    http.defaults.adapter = adapter
    await expect(adminResendTeacherInvitation(7)).rejects.toThrow(status === null ? 'network failure' : 'rejected')
    expect(adapter).toHaveBeenCalledTimes(1)
    expect(adapter.mock.calls[0][0].url).toBe(url)
    expect(tokenStore.get()).toBe('expired-token')
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
