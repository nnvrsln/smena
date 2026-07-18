import type { ObjectSummary, Role } from '@smena/contracts'
import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'
import type { AccessRepository, IdentityRecord } from './access-repository.js'

interface IdentityRow {
  user_id: string
  display_name: string
  organization_id: string
  organization_name: string
  role: Role
}

interface ObjectRow {
  id: string
  name: string
  code: string
  present_workers: number
  planned_workers: number
  day_progress: number
  issue_count: number
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
export class PostgresAccessRepository implements AccessRepository, OnModuleDestroy {
  private readonly pool: Pool

  constructor(connectionString = process.env.DATABASE_URL) {
    if (!connectionString) throw new Error('DATABASE_URL is required when SMENA_DATA_SOURCE=postgres')
    this.pool = new Pool({ connectionString, max: 5 })
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end()
  }

  async findIdentityByRole(role: Role): Promise<IdentityRecord | null> {
    const identityResult = await this.pool.query<IdentityRow>(
      `select
         u.id::text as user_id,
         u.display_name,
         o.id::text as organization_id,
         o.name as organization_name,
         m.role
       from memberships m
       join users u on u.id = m.user_id and u.status = 'active'
       join organizations o on o.id = m.organization_id and o.status = 'active'
       where m.role = $1 and m.status = 'active'
       order by m.created_at, m.id
       limit 1`,
      [role],
    )

    return this.identityFromRow(identityResult.rows[0])
  }

  async findIdentityByUserId(userId: string): Promise<IdentityRecord | null> {
    const identityResult = await this.pool.query<IdentityRow>(
      `select
         u.id::text as user_id,
         u.display_name,
         o.id::text as organization_id,
         o.name as organization_name,
         m.role
       from memberships m
       join users u on u.id = m.user_id and u.status = 'active'
       join organizations o on o.id = m.organization_id and o.status = 'active'
       where u.id = $1 and m.status = 'active'
       order by m.created_at, m.id
       limit 1`,
      [userId],
    )
    return this.identityFromRow(identityResult.rows[0])
  }

  private async identityFromRow(row: IdentityRow | undefined): Promise<IdentityRecord | null> {
    if (!row) return null

    let objectIds: string[] | 'all' = 'all'
    if (row.role !== 'contractor') {
      const scopeResult = await this.pool.query<{ object_id: string }>(
        `select om.object_id::text as object_id
         from object_memberships om
         join objects o
           on o.id = om.object_id
          and o.organization_id = om.organization_id
          and o.status = 'active'
         where om.user_id = $1
           and om.organization_id = $2
           and om.status = 'active'
         order by om.created_at, om.id`,
        [row.user_id, row.organization_id],
      )
      objectIds = scopeResult.rows.map((scope) => scope.object_id)
    }

    return {
      user: {
        id: row.user_id,
        displayName: row.display_name,
        initials: initialsFor(row.display_name),
        role: row.role,
      },
      organization: { id: row.organization_id, name: row.organization_name },
      objectIds,
    }
  }

  async listObjectsForIdentity(identity: IdentityRecord): Promise<ObjectSummary[]> {
    const parameters: unknown[] = [identity.organization.id]
    const objectScope = identity.objectIds === 'all' ? '' : 'and o.id = any($2::uuid[])'
    if (identity.objectIds !== 'all') parameters.push(identity.objectIds)

    const result = await this.pool.query<ObjectRow>(
      `select
         o.id::text,
         o.name,
         o.code,
         coalesce(s.present_workers, 0)::integer as present_workers,
         coalesce(s.planned_workers, 0)::integer as planned_workers,
         coalesce(s.day_progress, 0)::integer as day_progress,
         coalesce(s.issue_count, 0)::integer as issue_count
       from objects o
       left join object_daily_summaries s
         on s.organization_id = o.organization_id
        and s.object_id = o.id
        and s.summary_date = current_date
       where o.organization_id = $1
         and o.status = 'active'
         ${objectScope}
       order by o.created_at, o.id`,
      parameters,
    )

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      presentWorkers: row.present_workers,
      plannedWorkers: row.planned_workers,
      dayProgress: row.day_progress,
      issueCount: row.issue_count,
    }))
  }
}
