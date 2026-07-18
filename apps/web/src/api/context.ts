import { isRole, type ApiError, type MeContextResponse, type Role } from '@smena/contracts'

export function requestedDevelopmentRole(): Role {
  const role = new URLSearchParams(window.location.search).get('as') ?? undefined
  return isRole(role) ? role : 'contractor'
}

export async function loadMeContext(role: Role, signal?: AbortSignal): Promise<MeContextResponse> {
  const response = await fetch('/api/v1/me/context', {
    headers: import.meta.env.DEV ? { 'x-smena-demo-role': role } : undefined,
    credentials: 'include',
    signal,
  })

  if (!response.ok) {
    const error = await response.json() as ApiError
    throw new Error(error.message)
  }

  return response.json() as Promise<MeContextResponse>
}
