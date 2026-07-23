import type { CurrentShiftResponse, EndShiftRequest, ShiftSummary, StartShiftRequest, TodayShiftResponse } from '@smena/contracts'
import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'

@Injectable()
export class ShiftsService implements OnModuleDestroy {
  private readonly pool: Pool
  constructor() { const connectionString = process.env.DATABASE_URL; if (!connectionString) throw new Error('DATABASE_URL is required for shifts'); this.pool = new Pool({ connectionString, max: 5 }) }
  async onModuleDestroy() { await this.pool.end() }
  async current(userId: string): Promise<CurrentShiftResponse> {
    const result = await this.pool.query(`select s.id::text, s.object_id::text, o.name object_name, o.code object_code, s.status, s.started_at_server, s.ended_at_server, s.start_method, floor(extract(epoch from (coalesce(s.ended_at_server,now())-s.started_at_server))/60)::integer worked_minutes from shifts s join objects o on o.id=s.object_id where s.user_id=$1 and s.status='open' order by s.started_at_server desc limit 1`, [userId])
    const row = result.rows[0]; return { shift: row ? this.map(row) : null }
  }
  async today(userId: string): Promise<TodayShiftResponse> {
    const result = await this.pool.query(`select s.id::text, s.object_id::text, o.name object_name, o.code object_code, s.status, s.started_at_server, s.ended_at_server, s.start_method, floor(extract(epoch from (coalesce(s.ended_at_server,now())-s.started_at_server))/60)::integer worked_minutes from shifts s join objects o on o.id=s.object_id where s.user_id=$1 and s.started_at_server>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC' and s.started_at_server<(date_trunc('day',now() at time zone 'UTC')+interval '1 day') at time zone 'UTC' order by s.started_at_server desc limit 1`, [userId])
    const row = result.rows[0]; return { shift: row ? this.map(row) : null }
  }
  async start(userId: string, organizationId: string, body: Partial<StartShiftRequest>): Promise<{ shift: ShiftSummary }> {
    if (!body.objectId || !body.qrToken) throw new BadRequestException({ code: 'QR_REQUIRED', message: 'Отсканируйте QR-код объекта.' })
    const client = await this.pool.connect()
    try {
      await client.query('begin')
      const scope = await client.query(`select o.id::text, o.name, o.code from objects o join object_memberships om on om.object_id=o.id and om.organization_id=o.organization_id where o.id=$1 and o.organization_id=$2 and o.status='active' and om.user_id=$3 and om.status='active'`, [body.objectId, organizationId, userId])
      if (!scope.rows[0]) throw new NotFoundException({ code: 'OBJECT_ACCESS_DENIED', message: 'Объект недоступен для вашей роли.' })
      const qr = await client.query(`select object_id from object_qr_codes where object_id=$1 and organization_id=$2 and status='active' and token_hash=encode(digest($3,'sha256'),'hex')`, [body.objectId, organizationId, body.qrToken.trim()])
      if (!qr.rows[0]) throw new BadRequestException({ code: 'QR_INVALID', message: 'QR-код не относится к выбранному объекту.' })
      const existing = await client.query(`select id from shifts where user_id=$1 and status='open' for update`, [userId])
      if (existing.rows[0]) throw new ConflictException({ code: 'SHIFT_ALREADY_OPEN', message: 'Смена уже начата.' })
      const started = new Date(body.occurredAtDevice ?? new Date().toISOString())
      if (Number.isNaN(started.getTime())) throw new BadRequestException({ code: 'INVALID_DEVICE_TIME', message: 'Некорректное время устройства.' })
      const inserted = await client.query(`insert into shifts (organization_id,user_id,object_id,started_at_device,start_method) values ($1,$2,$3,$4,'qr_scan') returning id::text, object_id::text, status, started_at_server, start_method`, [organizationId, userId, body.objectId, started.toISOString()])
      const row = inserted.rows[0]
      await client.query(`insert into shift_events (shift_id,organization_id,user_id,object_id,event_type,method,occurred_at_device) values ($1,$2,$3,$4,'shift_started','qr_scan',$5)`, [row.id, organizationId, userId, body.objectId, started.toISOString()])
      await client.query('commit')
      return { shift: this.map({ ...row, object_name: scope.rows[0].name, object_code: scope.rows[0].code }) }
    } catch (error) { await client.query('rollback'); throw error } finally { client.release() }
  }
  async end(userId: string, organizationId: string, body: Partial<EndShiftRequest>): Promise<{ shift: ShiftSummary }> {
    const ended = new Date(body.occurredAtDevice ?? new Date().toISOString())
    if (Number.isNaN(ended.getTime())) throw new BadRequestException({ code: 'INVALID_DEVICE_TIME', message: 'Некорректное время устройства.' })
    const client = await this.pool.connect()
    try {
      await client.query('begin')
      const open = await client.query(`select s.id::text, s.object_id::text, s.started_at_server, o.name object_name, o.code object_code from shifts s join objects o on o.id=s.object_id and o.organization_id=s.organization_id where s.user_id=$1 and s.organization_id=$2 and s.status='open' for update`, [userId, organizationId])
      const current = open.rows[0]
      if (!current) throw new ConflictException({ code: 'SHIFT_NOT_OPEN', message: 'Нет открытой смены для завершения.' })
      if (ended.getTime() < new Date(current.started_at_server).getTime()) throw new BadRequestException({ code: 'SHIFT_END_BEFORE_START', message: 'Время завершения не может быть раньше начала смены.' })
      const updated = await client.query(`update shifts set status='closed', ended_at_device=$2, ended_at_server=now() where id=$1 returning id::text, object_id::text, status, started_at_server, ended_at_server, start_method, floor(extract(epoch from (ended_at_server-started_at_server))/60)::integer worked_minutes`, [current.id, ended.toISOString()])
      const row = updated.rows[0]
      await client.query(`insert into shift_events (shift_id,organization_id,user_id,object_id,event_type,method,occurred_at_device) values ($1,$2,$3,$4,'shift_ended','manual',$5)`, [row.id, organizationId, userId, row.object_id, ended.toISOString()])
      await client.query('commit')
      return { shift: this.map({ ...row, object_name: current.object_name, object_code: current.object_code }) }
    } catch (error) { await client.query('rollback'); throw error } finally { client.release() }
  }
  private map(row: any): ShiftSummary { return { id: row.id, objectId: row.object_id, objectName: row.object_name, objectCode: row.object_code, status: row.status, startedAtServer: new Date(row.started_at_server).toISOString(), startMethod: row.start_method, ...(row.ended_at_server ? { endedAtServer: new Date(row.ended_at_server).toISOString() } : {}), workedMinutes: Number(row.worked_minutes ?? 0) } }
}
