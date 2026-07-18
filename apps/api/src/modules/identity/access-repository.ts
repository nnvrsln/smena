import type { ObjectSummary, OrganizationSummary, Role, UserSummary } from '@smena/contracts'

export interface IdentityRecord {
  user: UserSummary
  organization: OrganizationSummary
  objectIds: string[] | 'all'
}

export interface AccessRepository {
  findIdentityByRole(role: Role): Promise<IdentityRecord | null>
  findIdentityByUserId(userId: string): Promise<IdentityRecord | null>
  listObjectsForIdentity(identity: IdentityRecord): Promise<ObjectSummary[]>
}
