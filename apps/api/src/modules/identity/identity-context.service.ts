import type { MeContextResponse, Role } from '@smena/contracts'
import { Inject, Injectable } from '@nestjs/common'
import { navigationFor, permissionsFor } from '../access/policy.js'
import type { AccessRepository } from './access-repository.js'

export const ACCESS_REPOSITORY = Symbol('ACCESS_REPOSITORY')

@Injectable()
export class IdentityContextService {
  constructor(@Inject(ACCESS_REPOSITORY) private readonly repository: AccessRepository) {}

  async getContext(role: Role, environment: 'development' | 'production'): Promise<MeContextResponse | null> {
    const identity = await this.repository.findIdentityByRole(role)
    if (!identity) return null

    return {
      user: identity.user,
      organization: identity.organization,
      objects: await this.repository.listObjectsForIdentity(identity),
      permissions: permissionsFor(role),
      navigation: navigationFor(role),
      environment,
    }
  }
}
