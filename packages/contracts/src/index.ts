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

export interface ShiftSummary {
  id: string
  objectId: string
  objectName: string
  objectCode: string
  status: 'open' | 'closed'
  startedAtServer: string
  startMethod: 'qr_scan' | 'manual'
}

export interface CurrentShiftResponse { shift: ShiftSummary | null }
export interface StartShiftRequest { objectId: string; qrToken: string; occurredAtDevice: string }
export interface StartShiftResponse { shift: ShiftSummary }

export interface ApiError {
  code: string
  message: string
}

export function isRole(value: string | undefined): value is Role {
  return roles.includes(value as Role)
}
