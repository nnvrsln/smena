import type { CreateObjectRequest, ObjectSummary, UpdateObjectRequest } from '@smena/contracts'
import { ConflictException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common'
import { Pool, type PoolClient } from 'pg'

interface ObjectRow {
  id: string
  name: string
  code: string
  present_workers: number
  planned_workers: number
  day_progress: number
  issue_count: number
}

@Injectable()
export class ObjectsService implements OnModuleDestroy {
  private readonly pool: Pool

  constructor() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('DATABASE_URL is required for object management')
    this.pool = new Pool({ connectionString, max: 5 })
  }

  async onModuleDestroy(): Promise<void> { await this.pool.end() }

  async create(organizationId: string, body: CreateObjectRequest): Promise<ObjectSummary> {
    const client = await this.pool.connect()
    try {
      await client.query('begin')
      const created = await client.query<{ id: string }>(
        `insert into objects (organization_id, name, code, status)
         values ($1, $2, $3, 'active')
         returning id::text`,
        [organizationId, body.name, body.code],
      )
      const objectId = created.rows[0]?.id
      if (!objectId) throw new Error('Object insert returned no id')
      const object = await this.find(client, organizationId, objectId)
      await client.query('commit')
      if (!object) throw new Error('Created object could not be read')
      return object
    } catch (error) {
      await client.query('rollback')
      if (this.isUniqueViolation(error)) throw new ConflictException({ code: 'OBJECT_CODE_EXISTS', message: 'Объект с таким обозначением уже существует.' })
      throw error
    } finally { client.release() }
  }

  async update(organizationId: string, objectId: string, body: UpdateObjectRequest): Promise<ObjectSummary> {
    const client = await this.pool.connect()
    try {
      await client.query('begin')
      const updated = await client.query(
        `update objects set name=$3, code=$4
         where id=$1 and organization_id=$2 and status='active'`,
        [objectId, organizationId, body.name, body.code],
      )
      if (updated.rowCount !== 1) throw new NotFoundException({ code: 'OBJECT_NOT_FOUND', message: 'Объект не найден в вашей организации.' })
      const object = await this.find(client, organizationId, objectId)
      await client.query('commit')
      if (!object) throw new NotFoundException({ code: 'OBJECT_NOT_FOUND', message: 'Объект не найден.' })
      return object
    } catch (error) {
      await client.query('rollback')
      if (this.isUniqueViolation(error)) throw new ConflictException({ code: 'OBJECT_CODE_EXISTS', message: 'Объект с таким обозначением уже существует.' })
      throw error
    } finally { client.release() }
  }

  private async find(client: PoolClient, organizationId: string, objectId: string): Promise<ObjectSummary | null> {
    const result = await client.query<ObjectRow>(
      `select o.id::text,o.name,o.code,
        coalesce((select count(*) from shifts where organization_id=o.organization_id and object_id=o.id and status='open'),0)::integer present_workers,
        coalesce(assignments.assigned_workers,0)::integer planned_workers,
        coalesce(s.day_progress,0)::integer day_progress,
        coalesce(s.issue_count,0)::integer issue_count
       from objects o
       left join object_daily_summaries s on s.organization_id=o.organization_id and s.object_id=o.id and s.summary_date=current_date
       left join lateral (
         select count(*)::integer assigned_workers
         from object_memberships om
         join memberships m on m.organization_id=om.organization_id and m.user_id=om.user_id and m.status='active' and m.role='worker'
         where om.organization_id=o.organization_id and om.object_id=o.id and om.status='active'
       ) assignments on true
       where o.id=$1 and o.organization_id=$2 and o.status='active'`,
      [objectId, organizationId],
    )
    const row = result.rows[0]
    return row ? { id: row.id, name: row.name, code: row.code, presentWorkers: row.present_workers, plannedWorkers: row.planned_workers, dayProgress: row.day_progress, issueCount: row.issue_count } : null
  }

  private isUniqueViolation(error: unknown): error is { code: string } {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
  }
}
