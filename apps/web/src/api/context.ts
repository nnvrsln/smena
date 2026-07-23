import type { ApiError, CreateInvitationRequest, CreateInvitationResponse, CreateObjectRequest, CurrentShiftResponse, InvitationListResponse, InvitationPreviewResponse, LoginRequest, LoginResponse, MeContextResponse, MemberListResponse, MemberTimesheetHistoryResponse, ObjectMutationResponse, RegisterInvitationRequest, RegisterInvitationResponse, StartShiftRequest, StartShiftResponse, UpdateMemberObjectsResponse, UpdateObjectMembersResponse, UpdateObjectRequest } from '@smena/contracts'

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

export async function loadInvitation(token: string, signal?: AbortSignal): Promise<InvitationPreviewResponse> {
  const response = await fetch(`/api/v1/invitations/${encodeURIComponent(token)}`, { signal })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<InvitationPreviewResponse>
}

export async function registerInvitation(token: string, body: RegisterInvitationRequest): Promise<RegisterInvitationResponse> {
  const response = await fetch(`/api/v1/invitations/${encodeURIComponent(token)}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<RegisterInvitationResponse>
}

export async function loadInvitations(signal?: AbortSignal): Promise<InvitationListResponse> {
  const response = await fetch('/api/v1/invitations', { credentials: 'include', signal })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<InvitationListResponse>
}

export async function createInvitation(body: CreateInvitationRequest): Promise<CreateInvitationResponse> {
  const response = await fetch('/api/v1/invitations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<CreateInvitationResponse>
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const response = await fetch(`/api/v1/invitations/${encodeURIComponent(invitationId)}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!response.ok) throw await responseError(response)
}

export async function loadMembers(signal?: AbortSignal): Promise<MemberListResponse> {
  const response = await fetch('/api/v1/members', { credentials: 'include', signal })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<MemberListResponse>
}

export async function updateMemberObjects(memberId: string, objectIds: string[]): Promise<UpdateMemberObjectsResponse> {
  const response = await fetch(`/api/v1/members/${encodeURIComponent(memberId)}/objects`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ objectIds }),
  })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<UpdateMemberObjectsResponse>
}

export async function createObject(body: CreateObjectRequest): Promise<ObjectMutationResponse> {
  const response = await fetch('/api/v1/objects', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<ObjectMutationResponse>
}

export async function updateObject(objectId: string, body: UpdateObjectRequest): Promise<ObjectMutationResponse> {
  const response = await fetch(`/api/v1/objects/${encodeURIComponent(objectId)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<ObjectMutationResponse>
}

export async function updateObjectMembers(objectId: string, memberIds: string[]): Promise<UpdateObjectMembersResponse> {
  const response = await fetch(`/api/v1/objects/${encodeURIComponent(objectId)}/members`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ memberIds }),
  })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<UpdateObjectMembersResponse>
}

export async function loadCurrentShift(signal?: AbortSignal): Promise<CurrentShiftResponse> {
  const response = await fetch('/api/v1/shifts/current', { credentials: 'include', signal })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<CurrentShiftResponse>
}

export async function loadTodayShift(signal?: AbortSignal): Promise<import('@smena/contracts').TodayShiftResponse> {
  const response = await fetch('/api/v1/shifts/today', { credentials: 'include', signal })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<import('@smena/contracts').TodayShiftResponse>
}

export async function startShift(body: StartShiftRequest): Promise<StartShiftResponse> {
  const response = await fetch('/api/v1/shifts/start', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<StartShiftResponse>
}

export async function endShift(body: import('@smena/contracts').EndShiftRequest): Promise<import('@smena/contracts').EndShiftResponse> {
  const response = await fetch('/api/v1/shifts/end', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<import('@smena/contracts').EndShiftResponse>
}

export async function loadTimesheetDays(date: string, signal?: AbortSignal): Promise<import('@smena/contracts').TimesheetDayListResponse> {
  const response = await fetch(`/api/v1/timesheet/days?date=${encodeURIComponent(date)}`, { credentials: 'include', signal })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<import('@smena/contracts').TimesheetDayListResponse>
}

export async function loadTimesheetDay(shiftId: string, signal?: AbortSignal): Promise<import('@smena/contracts').TimesheetDayDetailResponse> {
  const response = await fetch(`/api/v1/timesheet/days/${encodeURIComponent(shiftId)}`, { credentials: 'include', signal })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<import('@smena/contracts').TimesheetDayDetailResponse>
}

export async function loadMemberTimesheetHistory(memberId: string, from: string, to: string, signal?: AbortSignal): Promise<MemberTimesheetHistoryResponse> {
  const query = new URLSearchParams({ from, to })
  const response = await fetch(`/api/v1/timesheet/members/${encodeURIComponent(memberId)}?${query}`, { credentials: 'include', signal })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<MemberTimesheetHistoryResponse>
}
