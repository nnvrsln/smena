import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Inject, Param, Post, Put, Query, Req, Res } from '@nestjs/common'
import type { ApiError, CreateInvitationRequest, CreateInvitationResponse, CreateObjectRequest, EndShiftRequest, InvitationListResponse, InvitationPreviewResponse, LoginRequest, LoginResponse, MemberListResponse, MemberTimesheetHistoryResponse, ObjectMutationResponse, Permission, RegisterInvitationRequest, RegisterInvitationResponse, StartShiftRequest, TimesheetDayDetailResponse, TimesheetDayListResponse, UpdateMemberObjectsRequest, UpdateMemberObjectsResponse, UpdateObjectMembersRequest, UpdateObjectMembersResponse, UpdateObjectRequest } from '@smena/contracts'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { can } from './modules/access/policy.js'
import { HealthService } from './health.service.js'
import { AuthService } from './modules/auth/auth.service.js'
import { IdentityContextService } from './modules/identity/identity-context.service.js'
import { MembersService } from './modules/members/members.service.js'
import { InvitationsService } from './modules/invitations/invitations.service.js'
import { ObjectsService } from './modules/objects/objects.service.js'
import { ShiftsService } from './modules/shifts/shifts.service.js'
import { TimesheetsService } from './modules/timesheets/timesheets.service.js'

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
    @Inject(MembersService) private readonly membersService: MembersService,
    @Inject(ObjectsService) private readonly objectsService: ObjectsService,
    @Inject(ShiftsService) private readonly shiftsService: ShiftsService,
    @Inject(TimesheetsService) private readonly timesheetsService: TimesheetsService,
    @Inject(HealthService) private readonly healthService: HealthService,
    @Inject(InvitationsService) private readonly invitationsService: InvitationsService,
  ) {}

  @Get('/health')
  async health() {
    const postgres = await this.healthService.postgresReady()
    if (!postgres) {
      throw new HttpException(
        { code: 'SERVICE_NOT_READY', message: 'PostgreSQL is unavailable.' },
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
    return { status: 'ok', service: 'smena-api', checks: { api: 'ok', postgres: 'ok' } }
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

  @Get('/api/v1/invitations/:token')
  async invitationPreview(@Param('token') token: string): Promise<InvitationPreviewResponse> {
    return this.invitationsService.preview(token)
  }

  @Post('/api/v1/invitations/:token/register')
  async registerInvitation(
    @Param('token') token: string,
    @Body() body: Partial<RegisterInvitationRequest>,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<RegisterInvitationResponse> {
    const userId = await this.invitationsService.register(token, body)
    const session = await this.authService.createSession(userId)
    const context = await this.identityService.getContextForUser(userId, process.env.NODE_ENV === 'production' ? 'production' : 'development')
    if (!context) throw new HttpException({ code: 'ACCESS_NOT_ASSIGNED', message: 'Доступ не создан.' }, HttpStatus.INTERNAL_SERVER_ERROR)
    reply.header('set-cookie', sessionCookie(session.token, session.expiresAt))
    return { context }
  }

  @Get('/api/v1/invitations')
  async invitations(@Req() request: FastifyRequest): Promise<InvitationListResponse> {
    const context = await this.authorizedContext(request, 'member.manage')
    return this.invitationsService.list(context.organization.id)
  }

  @Post('/api/v1/invitations')
  async createInvitation(@Req() request: FastifyRequest, @Body() body: Partial<CreateInvitationRequest>): Promise<CreateInvitationResponse> {
    const context = await this.authorizedContext(request, 'member.manage')
    return this.invitationsService.create(context.organization.id, context.user.id, body)
  }

  @Delete('/api/v1/invitations/:invitationId')
  async revokeInvitation(@Req() request: FastifyRequest, @Param('invitationId') invitationId: string) {
    const context = await this.authorizedContext(request, 'member.manage')
    return { invitation: await this.invitationsService.revoke(context.organization.id, invitationId) }
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

  @Get('/api/v1/members')
  async members(@Req() request: FastifyRequest): Promise<MemberListResponse> {
    const context = await this.authorizedContext(request, 'member.manage')
    return { members: await this.membersService.list(context.organization.id) }
  }

  @Get('/api/v1/shifts/current')
  async currentShift(@Req() request: FastifyRequest) {
    const userId = await this.authService.authenticate(sessionToken(request))
    if (!userId) throw new HttpException({ code: 'SESSION_REQUIRED', message: 'Войдите, чтобы продолжить.' }, HttpStatus.UNAUTHORIZED)
    return this.shiftsService.current(userId)
  }

  @Post('/api/v1/objects')
  async createObject(@Req() request: FastifyRequest, @Body() body: Partial<CreateObjectRequest>): Promise<ObjectMutationResponse> {
    const context = await this.authorizedContext(request, 'object.manage')
    return { object: await this.objectsService.create(context.organization.id, this.validObjectInput(body)) }
  }

  @Put('/api/v1/objects/:objectId')
  async updateObject(@Req() request: FastifyRequest, @Param('objectId') objectId: string, @Body() body: Partial<UpdateObjectRequest>): Promise<ObjectMutationResponse> {
    const context = await this.authorizedContext(request, 'object.manage')
    return { object: await this.objectsService.update(context.organization.id, objectId, this.validObjectInput(body)) }
  }

  @Put('/api/v1/objects/:objectId/members')
  async updateObjectMembers(
    @Req() request: FastifyRequest,
    @Param('objectId') objectId: string,
    @Body() body: Partial<UpdateObjectMembersRequest>,
  ): Promise<UpdateObjectMembersResponse> {
    const context = await this.authorizedContext(request, 'member.manage')
    if (!Array.isArray(body.memberIds) || body.memberIds.some((id) => typeof id !== 'string')) {
      throw new HttpException({ code: 'INVALID_MEMBER_IDS', message: 'Передайте корректный список сотрудников.' }, HttpStatus.BAD_REQUEST)
    }
    return { members: await this.membersService.updateObjectMembers(context.organization.id, objectId, body.memberIds) }
  }

  @Get('/api/v1/shifts/today')
  async todayShift(@Req() request: FastifyRequest) {
    const userId = await this.authService.authenticate(sessionToken(request))
    if (!userId) throw new HttpException({ code: 'SESSION_REQUIRED', message: 'Войдите, чтобы продолжить.' }, HttpStatus.UNAUTHORIZED)
    return this.shiftsService.today(userId)
  }

  @Post('/api/v1/shifts/start')
  async startShift(@Req() request: FastifyRequest, @Body() body: Partial<StartShiftRequest>) {
    const context = await this.authorizedContext(request, 'shift.manage.self')
    const userId = context.user.id
    return this.shiftsService.start(userId, context.organization.id, body)
  }

  @Post('/api/v1/shifts/end')
  async endShift(@Req() request: FastifyRequest, @Body() body: Partial<EndShiftRequest>) {
    const context = await this.authorizedContext(request, 'shift.manage.self')
    return this.shiftsService.end(context.user.id, context.organization.id, body)
  }

  @Get('/api/v1/timesheet/days')
  async timesheetDays(@Req() request: FastifyRequest, @Query('date') date?: string): Promise<TimesheetDayListResponse> {
    const context = await this.timesheetContext(request)
    const selectedDate = date ?? new Date().toISOString().slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(selectedDate) || Number.isNaN(new Date(`${selectedDate}T00:00:00Z`).getTime())) throw new HttpException({ code: 'INVALID_TIMESHEET_DATE', message: 'Передайте дату в формате YYYY-MM-DD.' }, HttpStatus.BAD_REQUEST)
    return this.timesheetsService.list(context.organization.id, context.objects.map((object) => object.id), selectedDate)
  }

  @Get('/api/v1/timesheet/members/:memberId')
  async memberTimesheetHistory(
    @Req() request: FastifyRequest,
    @Param('memberId') memberId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<MemberTimesheetHistoryResponse> {
    const context = await this.timesheetContext(request)
    const defaultTo = new Date().toISOString().slice(0, 10)
    const defaultFromDate = new Date(`${defaultTo}T00:00:00Z`)
    defaultFromDate.setUTCDate(defaultFromDate.getUTCDate() - 30)
    const selectedFrom = from ?? defaultFromDate.toISOString().slice(0, 10)
    const selectedTo = to ?? defaultTo
    if (!this.validIsoDate(selectedFrom) || !this.validIsoDate(selectedTo)) {
      throw new HttpException({ code: 'INVALID_TIMESHEET_RANGE', message: 'Передайте период в формате YYYY-MM-DD.' }, HttpStatus.BAD_REQUEST)
    }
    const rangeDays = (Date.parse(`${selectedTo}T00:00:00Z`) - Date.parse(`${selectedFrom}T00:00:00Z`)) / 86_400_000
    if (rangeDays < 0 || rangeDays > 62) {
      throw new HttpException({ code: 'INVALID_TIMESHEET_RANGE', message: 'Период истории должен содержать не более 63 дней.' }, HttpStatus.BAD_REQUEST)
    }
    const history = await this.timesheetsService.memberHistory(
      context.organization.id,
      context.objects.map((object) => object.id),
      memberId,
      selectedFrom,
      selectedTo,
      context.user.role === 'contractor',
    )
    return {
      member: await this.membersService.get(context.organization.id, memberId),
      from: selectedFrom,
      to: selectedTo,
      ...history,
    }
  }

  @Get('/api/v1/timesheet/days/:shiftId')
  async timesheetDay(@Req() request: FastifyRequest, @Param('shiftId') shiftId: string): Promise<TimesheetDayDetailResponse> {
    const context = await this.timesheetContext(request)
    return { day: await this.timesheetsService.detail(context.organization.id, context.objects.map((object) => object.id), shiftId) }
  }

  @Put('/api/v1/members/:memberId/objects')
  async updateMemberObjects(
    @Req() request: FastifyRequest,
    @Param('memberId') memberId: string,
    @Body() body: Partial<UpdateMemberObjectsRequest>,
  ): Promise<UpdateMemberObjectsResponse> {
    const context = await this.authorizedContext(request, 'member.manage')
    if (!Array.isArray(body.objectIds) || body.objectIds.some((id) => typeof id !== 'string')) {
      throw new HttpException({ code: 'INVALID_OBJECT_IDS', message: 'Передайте корректный список объектов.' }, HttpStatus.BAD_REQUEST)
    }
    return { member: await this.membersService.updateObjectAssignments(context.organization.id, memberId, body.objectIds) }
  }

  private async authorizedContext(request: FastifyRequest, permission: Permission) {
    const userId = await this.authService.authenticate(sessionToken(request))
    if (!userId) throw new HttpException({ code: 'SESSION_REQUIRED', message: 'Войдите, чтобы продолжить.' }, HttpStatus.UNAUTHORIZED)
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'
    const context = await this.identityService.getContextForUser(userId, environment)
    if (!context || !can(context.user.role, permission)) {
      throw new HttpException({ code: 'ACCESS_DENIED', message: 'Недостаточно прав для этого действия.' }, HttpStatus.FORBIDDEN)
    }
    return context
  }

  private async timesheetContext(request: FastifyRequest) {
    const userId = await this.authService.authenticate(sessionToken(request))
    if (!userId) throw new HttpException({ code: 'SESSION_REQUIRED', message: 'Войдите, чтобы продолжить.' }, HttpStatus.UNAUTHORIZED)
    const context = await this.identityService.getContextForUser(userId, process.env.NODE_ENV === 'production' ? 'production' : 'development')
    const permission: Permission = context?.user.role === 'contractor' ? 'shift.read.organization' : 'shift.read.team'
    if (!context || !can(context.user.role, permission)) throw new HttpException({ code: 'ACCESS_DENIED', message: 'Недостаточно прав для просмотра табеля.' }, HttpStatus.FORBIDDEN)
    return context
  }

  private validObjectInput(body: Partial<CreateObjectRequest>): CreateObjectRequest {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    if (name.length < 3 || name.length > 80) throw new HttpException({ code: 'INVALID_OBJECT_NAME', message: 'Название объекта должно содержать от 3 до 80 символов.' }, HttpStatus.BAD_REQUEST)
    if (code.length < 2 || code.length > 40) throw new HttpException({ code: 'INVALID_OBJECT_CODE', message: 'Обозначение должно содержать от 2 до 40 символов.' }, HttpStatus.BAD_REQUEST)
    return { name, code }
  }

  private validIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false
    const parsed = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }
}
