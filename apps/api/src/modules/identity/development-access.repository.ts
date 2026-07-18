import type { ObjectSummary, Role } from '@smena/contracts'
import type { AccessRepository, IdentityRecord } from './access-repository.js'

const organization = { id: 'org-smena-stroy', name: 'Смена Строй' }

const objects: ObjectSummary[] = [
  { id: 'object-severny', name: 'ЖК «Северный»', code: 'Корпус 4', presentWorkers: 13, plannedWorkers: 15, dayProgress: 72, issueCount: 2 },
  { id: 'object-gorizont', name: 'БЦ «Горизонт»', code: 'Секция А', presentWorkers: 17, plannedWorkers: 18, dayProgress: 84, issueCount: 0 },
  { id: 'object-school-18', name: 'Школа №18', code: 'Отделка', presentWorkers: 12, plannedWorkers: 14, dayProgress: 51, issueCount: 1 },
]

const identities: Record<Role, IdentityRecord> = {
  contractor: {
    user: { id: 'user-contractor', displayName: 'Александр Романов', initials: 'АР', role: 'contractor' },
    organization,
    objectIds: 'all',
  },
  foreman: {
    user: { id: 'user-foreman', displayName: 'Петров Алексей', initials: 'ПА', role: 'foreman' },
    organization,
    objectIds: ['object-severny', 'object-gorizont'],
  },
  worker: {
    user: { id: 'user-worker', displayName: 'Иванов Иван', initials: 'ИИ', role: 'worker' },
    organization,
    objectIds: ['object-severny'],
  },
}

export class DevelopmentAccessRepository implements AccessRepository {
  async findIdentityByRole(role: Role): Promise<IdentityRecord> {
    return identities[role]
  }

  async findIdentityByUserId(userId: string): Promise<IdentityRecord | null> {
    return Object.values(identities).find((identity) => identity.user.id === userId) ?? null
  }

  async listObjectsForIdentity(identity: IdentityRecord): Promise<ObjectSummary[]> {
    if (identity.objectIds === 'all') return objects.map((object) => ({ ...object }))
    return objects.filter((object) => identity.objectIds.includes(object.id)).map((object) => ({ ...object }))
  }
}
