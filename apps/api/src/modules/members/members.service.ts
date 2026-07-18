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
       where m.organization_id = $1
       group by u.id, u.display_name, u.phone_normalized, m.role, m.status, m.created_at, m.id
       order by
         case m.role when 'contractor' then 1 when 'foreman' then 2 else 3 end,
         m.created_at,
         m.id`,
      [organizationId],
    )
    return result.rows.map(this.mapMember)
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

  private async findMember(client: PoolClient, organizationId: string, memberId: string): Promise<MemberSummary | null> {
    const result = await client.query<MemberRow>(
      `select
         u.id::text,
         u.display_name,
         u.phone_normalized,
         m.role,
         m.status,
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
       where m.organization_id = $1 and m.user_id = $2
       group by u.id, u.display_name, u.phone_normalized, m.role, m.status`,
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
  })
}
