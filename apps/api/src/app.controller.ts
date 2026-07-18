import { Controller, Get, Headers, HttpException, HttpStatus, Inject, Query } from '@nestjs/common'
import { isRole, type ApiError, type Permission, type Role } from '@smena/contracts'
import { can } from './modules/access/policy.js'
import { IdentityContextService } from './modules/identity/identity-context.service.js'

@Controller()
export class AppController {
  constructor(@Inject(IdentityContextService) private readonly identityService: IdentityContextService) {}

  @Get('/health')
  health() {
    return { status: 'ok', service: 'smena-api', dataSource: process.env.SMENA_DATA_SOURCE ?? 'development' }
  }

  @Get('/api/v1/me/context')
  async context(@Headers('x-smena-demo-role') requestedRole?: string) {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    if (environment === 'production') {
      const error: ApiError = { code: 'SESSION_REQUIRED', message: 'Production session adapter is not connected yet.' }
      throw new HttpException(error, HttpStatus.UNAUTHORIZED)
    }

    const role: Role = isRole(requestedRole) ? requestedRole : 'contractor'
    return this.identityService.getContext(role, environment)
  }

  @Get('/api/v1/authorization/check')
  check(@Headers('x-smena-demo-role') requestedRole?: string, @Query('action') action?: Permission) {
    if (!isRole(requestedRole) || !action) {
      throw new HttpException({ code: 'INVALID_ACCESS_CHECK', message: 'Role and action are required.' }, HttpStatus.BAD_REQUEST)
    }
    return { allowed: can(requestedRole, action) }
  }
}
