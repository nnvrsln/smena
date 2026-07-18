import type { ApiError, LoginRequest, LoginResponse, MeContextResponse } from '@smena/contracts'

export class ApiRequestError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message)
  }
}

async function responseError(response: Response): Promise<ApiRequestError> {
  const fallback: ApiError = { code: 'REQUEST_FAILED', message: 'Не удалось выполнить запрос.' }
  const error = await response.json().catch(() => fallback) as ApiError
  return new ApiRequestError(response.status, error.code, error.message)
}

export async function loadMeContext(signal?: AbortSignal): Promise<MeContextResponse> {
  const response = await fetch('/api/v1/me/context', { credentials: 'include', signal })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<MeContextResponse>
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
  })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<LoginResponse>
}

export async function logout(): Promise<void> {
  const response = await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' })
  if (!response.ok && response.status !== 204) throw await responseError(response)
}
