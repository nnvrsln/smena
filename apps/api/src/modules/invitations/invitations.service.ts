import { createHash, randomBytes } from 'node:crypto'
import type {
  CreateInvitationRequest, CreateInvitationResponse, InvitationListResponse,
  InvitationPreviewResponse, InvitationSummary, RegisterInvitationRequest,
} from '@smena/contracts'
import { BadRequestException, ConflictException, GoneException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common'
import { Pool, type PoolClient } from 'pg'
import { hashPassword, normalizePhone } from '../auth/auth.service.js'

interface InvitationRow {
  id: string
  organization_id: string
  organization_name: string
  role: 'foreman' | 'worker'
  expires_at: Date
  status: 'active' | 'used' | 'revoked'
  created_at: Date
  object_ids: string[]
}

const weakPasswords = new Set(['password', 'password1', '12345678', 'qwerty123', 'smena2026'])

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function cleanName(value: unknown, field: string): string {
  const result = typeof value === 'string' ? value.trim().replace(/\s+/gu, ' ') : ''
  if (result.length < 2 || result.length > 60) {
    throw new BadRequestException({ code: 'INVALID_PROFILE', message: `${field} должно содержать от 2 до 60 символов.` })
  }
  return result
}

@Injectable()
export class InvitationsService implements OnModuleDestroy {
  private readonly pool: Pool

  constructor() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('DATABASE_URL is required for invitations')
    this.pool = new Pool({ connectionString, max: 5 })
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end()
  }

  async create(organizationId: string, createdBy: string, body: Partial<CreateInvitationRequest>): Promise<CreateInvitationResponse> {
    if (body.role !== 'worker' && body.role !== 'foreman') {
      throw new BadRequestException({ code: 'INVALID_INVITATION_ROLE', message: 'Выберите роль рабочего или бригадира.' })
    }
    const objectIds = Array.isArray(body.objectIds) ? [...new Set(body.objectIds.filter((id): id is string => typeof id === 'string'))] : []
    if (objectIds.length === 0) throw new BadRequestException({ code: 'INVITATION_OBJECT_REQUIRED', message: 'Выберите хотя бы один объект.' })
    const expiresInDays = Number(body.expiresInDays)
    if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 14) {
      throw new BadRequestException({ code: 'INVALID_INVITATION_EXPIRY', message: 'Срок приглашения должен быть от 1 до 14 дней.' })
    }
    const internalNote = typeof body.internalNote === 'string' ? body.internalNote.trim().slice(0, 240) : ''
    const token = randomBytes(32).toString('base64url')
    const client = await this.pool.connect()
    try {
      await client.query('begin')
      const allowed = await client.query<{ id: string }>(
        `select id::text from objects where organization_id=$1 and status='active' and id=any($2::uuid[])`,
        [organizationId, objectIds],
      )
      if (allowed.rowCount !== objectIds.length) throw new BadRequestException({ code: 'INVALID_OBJECT_SCOPE', message: 'Один или несколько объектов недоступны.' })
      const result = await client.query<{ id: string; expires_at: Date; created_at: Date }>(
        `insert into invitations (organization_id,role,token_hash,expires_at,created_by,internal_note)
         values ($1,$2,$3,now()+($4::text||' days')::interval,$5,$6)
         returning id::text,expires_at,created_at`,
        [organizationId, body.role, tokenHash(token), expiresInDays, createdBy, internalNote || null],
      )
      const invitation = result.rows[0]
      if (!invitation) throw new Error('Invitation was not created')
      for (const objectId of objectIds) {
        await client.query(
          `insert into invitation_objects (invitation_id,organization_id,object_id) values ($1,$2,$3)`,
          [invitation.id, organizationId, objectId],
        )
      }
      await client.query('commit')
      const origin = (process.env.WEB_ORIGIN ?? 'http://127.0.0.1:4173').replace(/\/$/u, '')
      return {
        invitation: {
          id: invitation.id, role: body.role, objectIds, expiresAt: invitation.expires_at.toISOString(),
          status: 'active', createdAt: invitation.created_at.toISOString(),
        },
        link: `${origin}/invite/${token}`,
      }
    } catch (error) {
      await client.query('rollback')
      throw error
    } finally {
      client.release()
    }
  }

  async list(organizationId: string): Promise<InvitationListResponse> {
    const result = await this.pool.query<InvitationRow>(`${this.invitationSelect()} where i.organization_id=$1 group by i.id,o.name order by i.created_at desc`, [organizationId])
    return { invitations: result.rows.map((row) => this.summary(row)) }
  }

  async revoke(organizationId: string, invitationId: string): Promise<InvitationSummary> {
    const result = await this.pool.query<InvitationRow>(
      `${this.invitationSelect()} where i.organization_id=$1 and i.id=$2 group by i.id,o.name`,
      [organizationId, invitationId],
    )
    const current = result.rows[0]
    if (!current) throw new NotFoundException({ code: 'INVITATION_NOT_FOUND', message: 'Приглашение не найдено.' })
    if (this.status(current) !== 'active') throw new ConflictException({ code: 'INVITATION_NOT_ACTIVE', message: 'Это приглашение уже нельзя отозвать.' })
    await this.pool.query(`update invitations set status='revoked',revoked_at=now() where id=$1`, [invitationId])
    return { ...this.summary(current), status: 'revoked' }
  }

  async preview(token: string): Promise<InvitationPreviewResponse> {
    const row = await this.findByToken(this.pool, token)
    this.assertActive(row)
    const objects = await this.pool.query<{ id: string; name: string; code: string }>(
      `select o.id::text,o.name,o.code from invitation_objects io join objects o on o.id=io.object_id and o.organization_id=io.organization_id
       where io.invitation_id=$1 order by o.created_at,o.id`,
      [row.id],
    )
    return {
      organization: { id: row.organization_id, name: row.organization_name },
      role: row.role,
      objects: objects.rows,
      expiresAt: row.expires_at.toISOString(),
    }
  }

  async register(token: string, body: Partial<RegisterInvitationRequest>): Promise<string> {
    const firstName = cleanName(body.firstName, 'Имя')
    const lastName = cleanName(body.lastName, 'Фамилия')
    const middleName = typeof body.middleName === 'string' && body.middleName.trim() ? cleanName(body.middleName, 'Отчество') : null
    const specialization = cleanName(body.specialization, 'Специализация')
    const phone = normalizePhone(typeof body.phone === 'string' ? body.phone : '')
    if (!phone) throw new BadRequestException({ code: 'INVALID_PHONE', message: 'Введите российский номер телефона.' })
    const password = typeof body.password === 'string' ? body.password : ''
    if (password.length < 8 || weakPasswords.has(password.toLocaleLowerCase('en-US'))) {
      throw new BadRequestException({ code: 'WEAK_PASSWORD', message: 'Используйте пароль от 8 символов, который трудно угадать.' })
    }
    const passwordHash = await hashPassword(password)
    const client = await this.pool.connect()
    try {
      await client.query('begin')
      const row = await this.findByToken(client, token, true)
      this.assertActive(row)
      const existing = await client.query(`select id from users where phone_normalized=$1`, [phone])
      if (existing.rows[0]) throw new ConflictException({ code: 'PHONE_ALREADY_USED', message: 'Этот телефон уже зарегистрирован. Войдите в существующий аккаунт.' })
      const displayName = `${lastName} ${firstName}${middleName ? ` ${middleName}` : ''}`
      const user = await client.query<{ id: string }>(
        `insert into users (phone_normalized,display_name,password_hash,status,first_name,last_name,middle_name,specialization)
         values ($1,$2,$3,'active',$4,$5,$6,$7) returning id::text`,
        [phone, displayName, passwordHash, firstName, lastName, middleName, specialization],
      )
      const userId = user.rows[0]?.id
      if (!userId) throw new Error('User was not created')
      await client.query(
        `insert into memberships (organization_id,user_id,role,status) values ($1,$2,$3,'active')`,
        [row.organization_id, userId, row.role],
      )
      await client.query(
        `insert into object_memberships (organization_id,object_id,user_id,status)
         select organization_id,object_id,$2,'active' from invitation_objects where invitation_id=$1`,
        [row.id, userId],
      )
      const used = await client.query(
        `update invitations set status='used',used_by=$2,used_at=now()
         where id=$1 and status='active' and expires_at>now() returning id`,
        [row.id, userId],
      )
      if (!used.rows[0]) throw new GoneException({ code: 'INVITATION_USED', message: 'Приглашение уже использовано.' })
      await client.query('commit')
      return userId
    } catch (error) {
      await client.query('rollback')
      throw error
    } finally {
      client.release()
    }
  }

  private invitationSelect() {
    return `select i.id::text,i.organization_id::text,o.name organization_name,i.role,i.expires_at,i.status,i.created_at,
      coalesce(array_agg(io.object_id::text order by io.object_id) filter(where io.object_id is not null),array[]::text[]) object_ids
      from invitations i join organizations o on o.id=i.organization_id left join invitation_objects io on io.invitation_id=i.id`
  }

  private async findByToken(client: Pool | PoolClient, token: string, lock = false): Promise<InvitationRow> {
    if (!/^[A-Za-z0-9_-]{40,60}$/u.test(token)) throw new NotFoundException({ code: 'INVITATION_INVALID', message: 'Ссылка приглашения некорректна.' })
    const result = await client.query<InvitationRow>(
      `select i.id::text,i.organization_id::text,o.name organization_name,i.role,i.expires_at,i.status,i.created_at,
       array[]::text[] object_ids
       from invitations i join organizations o on o.id=i.organization_id
       where i.token_hash=$1${lock ? ' for update of i' : ''}`,
      [tokenHash(token)],
    )
    const row = result.rows[0]
    if (!row) throw new NotFoundException({ code: 'INVITATION_INVALID', message: 'Ссылка приглашения некорректна.' })
    return row
  }

  private assertActive(row: InvitationRow): void {
    if (row.status === 'used') throw new GoneException({ code: 'INVITATION_USED', message: 'Приглашение уже использовано.' })
    if (row.status === 'revoked') throw new GoneException({ code: 'INVITATION_REVOKED', message: 'Приглашение отозвано.' })
    if (row.expires_at.getTime() <= Date.now()) throw new GoneException({ code: 'INVITATION_EXPIRED', message: 'Срок приглашения истёк.' })
  }

  private status(row: InvitationRow): InvitationSummary['status'] {
    return row.status === 'active' && row.expires_at.getTime() <= Date.now() ? 'expired' : row.status
  }

  private summary(row: InvitationRow): InvitationSummary {
    return {
      id: row.id, role: row.role, objectIds: row.object_ids, expiresAt: row.expires_at.toISOString(),
      status: this.status(row), createdAt: row.created_at.toISOString(),
    }
  }
}
