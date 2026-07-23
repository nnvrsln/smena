export const roles = ['contractor', 'foreman', 'worker'] as const

export type Role = (typeof roles)[number]

export const permissions = [
  'organization.read',
  'organization.manage',
  'object.read',
  'object.manage',
  'member.read',
  'member.manage',
  'shift.read.self',
  'shift.read.team',
  'shift.read.organization',
  'shift.manage.self',
  'task.read.self',
  'task.read.object',
  'task.create',
  'task.manage',
  'issue.create',
  'issue.comment',
  'issue.manage',
  'report.read',
] as const

export type Permission = (typeof permissions)[number]

export type NavigationKey =
  | 'overview'
  | 'objects'
  | 'team'
  | 'tasks'
  | 'timesheet'
  | 'reports'
  | 'today'
  | 'messages'
  | 'profile'

export interface NavigationItem {
  key: NavigationKey
  label: string
}

export interface OrganizationSummary {
  id: string
  name: string
}

export interface UserSummary {
  id: string
  displayName: string
  initials: string
  role: Role
}

export interface ObjectSummary {
  id: string
  name: string
  code: string
  presentWorkers: number
  plannedWorkers: number
  dayProgress: number
  issueCount: number
}

export interface CreateObjectRequest {
  name: string
  code: string
}

export type UpdateObjectRequest = CreateObjectRequest
export interface ObjectMutationResponse { object: ObjectSummary }

export interface MeContextResponse {
  user: UserSummary
  organization: OrganizationSummary
  objects: ObjectSummary[]
  permissions: Permission[]
  navigation: NavigationItem[]
  environment: 'development' | 'production'
}

export interface LoginRequest {
  phone: string
  password: string
}

export interface LoginResponse {
  context: MeContextResponse
}

export interface MemberSummary {
  id: string
  displayName: string
  initials: string
  phone: string
  role: Role
  status: 'active' | 'inactive'
  objectIds: string[]
  todayStatus: 'on_shift' | 'shift_completed' | 'not_started' | 'not_applicable'
  todayObjectId?: string
}

export interface MemberListResponse {
  members: MemberSummary[]
}

export interface UpdateMemberObjectsRequest {
  objectIds: string[]
}

export interface UpdateMemberObjectsResponse {
  member: MemberSummary
}

export interface UpdateObjectMembersRequest {
  memberIds: string[]
}

export interface UpdateObjectMembersResponse {
  members: MemberSummary[]
}

export interface ShiftSummary {
  id: string
  objectId: string
  objectName: string
  objectCode: string
  status: 'open' | 'closed'
  startedAtServer: string
  startMethod: 'qr_scan' | 'manual'
  endedAtServer?: string
  workedMinutes: number
}

export interface CurrentShiftResponse { shift: ShiftSummary | null }
export interface TodayShiftResponse { shift: ShiftSummary | null }
export interface StartShiftRequest { objectId: string; qrToken: string; occurredAtDevice: string }
export interface StartShiftResponse { shift: ShiftSummary }
export interface EndShiftRequest { occurredAtDevice: string }
export interface EndShiftResponse { shift: ShiftSummary }

export interface TimesheetDaySummary {
  shiftId: string
  date: string
  userId: string
  userName: string
  userInitials: string
  objectId: string
  objectName: string
  objectCode: string
  startedAt: string
  endedAt?: string
  workedMinutes: number
  status: 'open' | 'complete'
}

export interface TimesheetEventSummary {
  id: string
  type: 'shift_started' | 'shift_ended'
  method: 'qr_scan' | 'manual'
  occurredAtDevice: string
  receivedAtServer: string
}

export interface TimesheetDayDetail extends TimesheetDaySummary { events: TimesheetEventSummary[] }
export interface TimesheetDayListResponse { date: string; days: TimesheetDaySummary[] }
export interface TimesheetDayDetailResponse { day: TimesheetDayDetail }

export interface MemberTimesheetHistorySummary {
  shiftCount: number
  completedCount: number
  workedMinutes: number
  objectCount: number
}

export interface MemberTimesheetHistoryResponse {
  member: MemberSummary
  from: string
  to: string
  days: TimesheetDaySummary[]
  summary: MemberTimesheetHistorySummary
}

export interface ApiError {
  code: string
  message: string
}

export function isRole(value: string | undefined): value is Role {
  return roles.includes(value as Role)
}
