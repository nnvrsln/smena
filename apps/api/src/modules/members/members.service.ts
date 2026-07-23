import type { MemberSummary, Role } from '@smena/contracts'
import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common'
import { Pool, type PoolClient } from 'pg'

interface MemberRow {
  id: string
  display_name: string
  phone_normalized: string
  role: Role
  status: 'active' | 'inactive'
  object_ids: string[]
  today_shift_status: 'open' | 'closed' | null
  today_object_id: string | null
}

function initialsFor(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('ru-RU') ?? '')
    .join('')
}

@Injectable()
export class MembersService implements OnModuleDestroy {
  private readonly pool: Pool

  constructor(connectionString = process.env.DATABASE_URL) {
    if (!connectionString) throw new Error('DATABASE_URL is required for member management')
    this.pool = new Pool({ connectionString, max: 5 })
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end()
  }

  async list(organizationId: string): Promise<MemberSummary[]> {
    const result = await this.pool.query<MemberRow>(
      `select
         u.id::text,
         u.display_name,
         u.phone_normalized,
         m.role,
         m.status,
         today_shift.today_shift_status,
         today_shift.today_object_id,
         coalesce(
           array_agg(om.object_id::text order by o.created_at, o.id)
             filter (where om.status = 'active' and o.status = 'active'),
           array[]::text[]
         ) as object_ids
       from memberships m
       join users u on u.id = m.user_id
       left join object_memberships om
         on om.organization_id = m.organization_id
        and om.user_id = m.user_id
       left join objects o
         on o.organization_id = om.organization_id
        and o.id = om.object_id
       left join lateral (
         select s.status as today_shift_status, s.object_id::text as today_object_id
         from shifts s
         where s.organization_id = m.organization_id
           and s.user_id = m.user_id
           and s.started_at_server >= date_trunc('day', now())
           and s.started_at_server < date_trunc('day', now()) + interval '1 day'
         order by case when s.status = 'open' then 0 else 1 end, s.started_at_server desc
         limit 1
       ) today_shift on true
       where m.organization_id = $1
       group by u.id, u.display_name, u.phone_normalized, m.role, m.status, m.created_at, m.id,
         today_shift.today_shift_status, today_shift.today_object_id
       order by
         case m.role when 'contractor' then 1 when 'foreman' then 2 else 3 end,
         m.created_at,
         m.id`,
      [organizationId],
    )
    return result.rows.map(this.mapMember)
  }

  async get(organizationId: string, memberId: string): Promise<MemberSummary> {
    const client = await this.pool.connect()
    try {
      const member = await this.findMember(client, organizationId, memberId)
      if (!member) throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'Сотрудник не найден в организации.' })
      return member
    } finally {
      client.release()
    }
  }

  async updateObjectAssignments(organizationId: string, memberId: string, objectIds: string[]): Promise<MemberSummary> {
    const uniqueObjectIds = [...new Set(objectIds)]
    const client = await this.pool.connect()
    try {
      await client.query('begin')
      const membership = await client.query<{ role: Role }>(
        `select role from memberships
         where organization_id = $1 and user_id = $2 and status = 'active'
         for update`,
        [organizationId, memberId],
      )
      const role = membership.rows[0]?.role
      if (!role) throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'Сотрудник не найден в организации.' })
      if (role === 'contractor') throw new BadRequestException({ code: 'OWNER_ASSIGNMENT_IMMUTABLE', message: 'Доступ владельца организации не ограничивается объектами.' })

      if (uniqueObjectIds.length > 0) {
        const allowed = await client.query<{ id: string }>(
          `select id::text from objects
           where organization_id = $1 and status = 'active' and id = any($2::uuid[])`,
          [organizationId, uniqueObjectIds],
        )
        if (allowed.rowCount !== uniqueObjectIds.length) {
          throw new BadRequestException({ code: 'INVALID_OBJECT_SCOPE', message: 'Один или несколько объектов недоступны организации.' })
        }
      }

      await client.query(
        `update object_memberships
         set status = 'inactive'
         where organization_id = $1
           and user_id = $2
           and status = 'active'
           and not (object_id = any($3::uuid[]))`,
        [organizationId, memberId, uniqueObjectIds],
      )

      for (const objectId of uniqueObjectIds) {
        await client.query(
          `insert into object_memberships (organization_id, object_id, user_id, status)
           values ($1, $2, $3, 'active')
           on conflict (object_id, user_id) do update set status = 'active'`,
          [organizationId, objectId, memberId],
        )
      }

      const member = await this.findMember(client, organizationId, memberId)
      await client.query('commit')
      if (!member) throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'Сотрудник не найден.' })
      return member
    } catch (error) {
      await client.query('rollback')
      throw error
    } finally {
      client.release()
    }
  }

  async updateObjectMembers(organizationId: string, objectId: string, memberIds: string[]): Promise<MemberSummary[]> {
    const uniqueMemberIds = [...new Set(memberIds)]
    const client = await this.pool.connect()
    try {
      await client.query('begin')
      const object = await client.query(
        `select id from objects
         where organization_id = $1 and id::text = $2 and status = 'active'
         for update`,
        [organizationId, objectId],
      )
      if (!object.rows[0]) throw new NotFoundException({ code: 'OBJECT_NOT_FOUND', message: 'Объект не найден в организации.' })

      if (uniqueMemberIds.length > 0) {
        const allowed = await client.query<{ id: string }>(
          `select user_id::text as id from memberships
           where organization_id = $1
             and user_id::text = any($2::text[])
             and status = 'active'
             and role <> 'contractor'`,
          [organizationId, uniqueMemberIds],
        )
        if (allowed.rowCount !== uniqueMemberIds.length) {
          throw new BadRequestException({ code: 'INVALID_MEMBER_SCOPE', message: 'Один или несколько сотрудников недоступны для назначения.' })
        }
      }

      await client.query(
        `update object_memberships om
         set status = 'inactive'
         from memberships m
         where om.organization_id = $1
           and om.object_id::text = $2
           and om.status = 'active'
           and m.organization_id = om.organization_id
           and m.user_id = om.user_id
           and m.role <> 'contractor'
           and not (om.user_id::text = any($3::text[]))`,
        [organizationId, objectId, uniqueMemberIds],
      )

      for (const memberId of uniqueMemberIds) {
        await client.query(
          `insert into object_memberships (organization_id, object_id, user_id, status)
           values ($1, $2, $3, 'active')
           on conflict (object_id, user_id) do update set status = 'active'`,
          [organizationId, objectId, memberId],
        )
      }

      const memberRows = await client.query<{ id: string }>(
        `select user_id::text as id from memberships
         where organization_id = $1
         order by case role when 'contractor' then 1 when 'foreman' then 2 else 3 end, created_at, id`,
        [organizationId],
      )
      const members: MemberSummary[] = []
      for (const row of memberRows.rows) {
        const member = await this.findMember(client, organizationId, row.id)
        if (member) members.push(member)
      }
      await client.query('commit')
      return members
    } catch (error) {
      await client.query('rollback')
      throw error
    } finally {
      client.release()
    }
  }

  private async findMember(client: PoolClient, organizationId: string, memberId: string): Promise<MemberSummary | null> {
    const result = await client.query<MemberRow>(
      `select
         u.id::text,
         u.display_name,
         u.phone_normalized,
         m.role,
         m.status,
         today_shift.today_shift_status,
         today_shift.today_object_id,
         coalesce(
           array_agg(om.object_id::text order by o.created_at, o.id)
             filter (where om.status = 'active' and o.status = 'active'),
           array[]::text[]
         ) as object_ids
       from memberships m
       join users u on u.id = m.user_id
       left join object_memberships om
         on om.organization_id = m.organization_id
        and om.user_id = m.user_id
       left join objects o
         on o.organization_id = om.organization_id
        and o.id = om.object_id
       left join lateral (
         select s.status as today_shift_status, s.object_id::text as today_object_id
         from shifts s
         where s.organization_id = m.organization_id
           and s.user_id = m.user_id
           and s.started_at_server >= date_trunc('day', now())
           and s.started_at_server < date_trunc('day', now()) + interval '1 day'
         order by case when s.status = 'open' then 0 else 1 end, s.started_at_server desc
         limit 1
       ) today_shift on true
       where m.organization_id = $1 and m.user_id = $2
       group by u.id, u.display_name, u.phone_normalized, m.role, m.status,
         today_shift.today_shift_status, today_shift.today_object_id`,
      [organizationId, memberId],
    )
    const row = result.rows[0]
    return row ? this.mapMember(row) : null
  }

  private readonly mapMember = (row: MemberRow): MemberSummary => ({
    id: row.id,
    displayName: row.display_name,
    initials: initialsFor(row.display_name),
    phone: row.phone_normalized,
    role: row.role,
    status: row.status,
    objectIds: row.object_ids,
    todayStatus: row.role === 'contractor'
      ? 'not_applicable'
      : row.today_shift_status === 'open'
        ? 'on_shift'
        : row.today_shift_status === 'closed'
          ? 'shift_completed'
          : 'not_started',
    ...(row.today_object_id ? { todayObjectId: row.today_object_id } : {}),
  })
}
