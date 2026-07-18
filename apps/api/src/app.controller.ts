import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Inject, Post, Query, Req, Res } from '@nestjs/common'
import type { ApiError, LoginRequest, LoginResponse, Permission } from '@smena/contracts'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { can } from './modules/access/policy.js'
import { AuthService } from './modules/auth/auth.service.js'
import { IdentityContextService } from './modules/identity/identity-context.service.js'

const sessionCookieName = 'smena_session'

function sessionToken(request: FastifyRequest): string | undefined {
  const cookie = request.headers.cookie
  if (!cookie) return undefined
  for (const part of cookie.split(';')) {
    const [name, ...value] = part.trim().split('=')
    if (name === sessionCookieName) return decodeURIComponent(value.join('='))
  }
  return undefined
}

function sessionCookie(token: string, expiresAt: Date): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${sessionCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`
}

function clearedSessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

@Controller()
export class AppController {
  constructor(
    @Inject(IdentityContextService) private readonly identityService: IdentityContextService,
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}

  @Get('/health')
  health() {
    return { status: 'ok', service: 'smena-api', dataSource: 'postgres' }
  }

  @Post('/api/v1/auth/login')
  async login(
    @Body() body: Partial<LoginRequest>,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<LoginResponse> {
    const session = await this.authService.login(body.phone ?? '', body.password ?? '')
    if (!session) {
      const error: ApiError = { code: 'INVALID_CREDENTIALS', message: 'Неверный телефон или пароль.' }
      throw new HttpException(error, HttpStatus.UNAUTHORIZED)
    }

    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    const context = await this.identityService.getContextForUser(session.userId, environment)
    if (!context) throw new HttpException({ code: 'ACCESS_NOT_ASSIGNED', message: 'Для пользователя не назначен доступ.' }, HttpStatus.FORBIDDEN)

    reply.header('set-cookie', sessionCookie(session.token, session.expiresAt))
    return { context }
  }

  @Post('/api/v1/auth/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<void> {
    await this.authService.logout(sessionToken(request))
    reply.header('set-cookie', clearedSessionCookie())
  }

  @Get('/api/v1/me/context')
  async context(@Req() request: FastifyRequest) {
    const userId = await this.authService.authenticate(sessionToken(request))
    if (!userId) {
      const error: ApiError = { code: 'SESSION_REQUIRED', message: 'Войдите, чтобы продолжить.' }
      throw new HttpException(error, HttpStatus.UNAUTHORIZED)
    }

    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    const context = await this.identityService.getContextForUser(userId, environment)
    if (!context) throw new HttpException({ code: 'ACCESS_NOT_ASSIGNED', message: 'Доступ к организации не назначен.' }, HttpStatus.FORBIDDEN)
    return context
  }

  @Get('/api/v1/authorization/check')
  async check(@Req() request: FastifyRequest, @Query('action') action?: Permission) {
    const userId = await this.authService.authenticate(sessionToken(request))
    if (!userId || !action) throw new HttpException({ code: 'INVALID_ACCESS_CHECK', message: 'Session and action are required.' }, HttpStatus.BAD_REQUEST)
    const context = await this.identityService.getContextForUser(userId, 'development')
    if (!context) throw new HttpException({ code: 'ACCESS_NOT_ASSIGNED', message: 'Access is not assigned.' }, HttpStatus.FORBIDDEN)
    return { allowed: can(context.user.role, action) }
  }
}
