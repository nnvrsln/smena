import type { MemberTimesheetHistorySummary, TimesheetDayDetail, TimesheetDayListResponse, TimesheetDaySummary } from '@smena/contracts'
import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'

interface TimesheetRow {
  shift_id: string
  work_date: string
  user_id: string
  user_name: string
  object_id: string
  object_name: string
  object_code: string
  started_at: Date
  ended_at: Date | null
  worked_minutes: number
  shift_status: 'open' | 'closed'
}

function initialsFor(displayName: string) {
  return displayName.trim().split(/\s+/u).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('ru-RU') ?? '').join('')
}

@Injectable()
export class TimesheetsService implements OnModuleDestroy {
  private readonly pool: Pool
  constructor(connectionString = process.env.DATABASE_URL) { if (!connectionString) throw new Error('DATABASE_URL is required for timesheets'); this.pool = new Pool({ connectionString, max: 5 }) }
  async onModuleDestroy() { await this.pool.end() }

  async list(organizationId: string, objectIds: string[], date: string): Promise<TimesheetDayListResponse> {
    const result = await this.pool.query<TimesheetRow>(`${this.daySelect()} where s.organization_id=$1 and s.object_id=any($2::uuid[]) and s.started_at_server::date=$3::date order by s.started_at_server desc`, [organizationId, objectIds, date])
    return { date, days: result.rows.map((row) => this.map(row)) }
  }

  async detail(organizationId: string, objectIds: string[], shiftId: string): Promise<TimesheetDayDetail> {
    const result = await this.pool.query<TimesheetRow>(`${this.daySelect()} where s.id=$1 and s.organization_id=$2 and s.object_id=any($3::uuid[])`, [shiftId, organizationId, objectIds])
    const row = result.rows[0]
    if (!row) throw new NotFoundException({ code: 'TIMESHEET_DAY_NOT_FOUND', message: 'День табеля не найден или недоступен.' })
    const events = await this.pool.query<{ id: string; event_type: 'shift_started' | 'shift_ended'; method: 'qr_scan' | 'manual'; occurred_at_device: Date; received_at_server: Date }>(`select id::text,event_type,method,occurred_at_device,received_at_server from shift_events where shift_id=$1 order by received_at_server,id`, [shiftId])
    return { ...this.map(row), events: events.rows.map((event) => ({ id: event.id, type: event.event_type, method: event.method, occurredAtDevice: event.occurred_at_device.toISOString(), receivedAtServer: event.received_at_server.toISOString() })) }
  }

  async memberHistory(
    organizationId: string,
    objectIds: string[],
    memberId: string,
    from: string,
    to: string,
    allowOrganizationMember: boolean,
  ): Promise<{ days: TimesheetDaySummary[]; summary: MemberTimesheetHistorySummary }> {
    const access = await this.pool.query(
      `select 1
       from memberships m
       where m.organization_id = $1
         and m.user_id::text = $2
         and m.status = 'active'
         and (
           $4::boolean
           or exists (
             select 1
             from object_memberships om
             where om.organization_id = m.organization_id
               and om.user_id = m.user_id
               and om.status = 'active'
               and om.object_id = any($3::uuid[])
           )
         )`,
      [organizationId, memberId, objectIds, allowOrganizationMember],
    )
    if (!access.rows[0]) throw new NotFoundException({ code: 'MEMBER_HISTORY_NOT_FOUND', message: 'Сотрудник не найден или недоступен для вашей роли.' })

    const result = await this.pool.query<TimesheetRow>(
      `${this.daySelect()}
       where s.organization_id = $1
         and s.object_id = any($2::uuid[])
         and s.user_id::text = $3
         and s.started_at_server::date between $4::date and $5::date
       order by s.started_at_server desc`,
      [organizationId, objectIds, memberId, from, to],
    )
    const days = result.rows.map((row) => this.map(row))
    return {
      days,
      summary: {
        shiftCount: days.length,
        completedCount: days.filter((day) => day.status === 'complete').length,
        workedMinutes: days.reduce((sum, day) => sum + day.workedMinutes, 0),
        objectCount: new Set(days.map((day) => day.objectId)).size,
      },
    }
  }

  private daySelect() {
    return `select s.id::text shift_id,s.started_at_server::date::text work_date,u.id::text user_id,u.display_name user_name,o.id::text object_id,o.name object_name,o.code object_code,s.started_at_server started_at,s.ended_at_server ended_at,floor(extract(epoch from (coalesce(s.ended_at_server,now())-s.started_at_server))/60)::integer worked_minutes,s.status shift_status from shifts s join users u on u.id=s.user_id join objects o on o.id=s.object_id and o.organization_id=s.organization_id`
  }
  private map(row: TimesheetRow): TimesheetDaySummary {
    return { shiftId: row.shift_id, date: row.work_date, userId: row.user_id, userName: row.user_name, userInitials: initialsFor(row.user_name), objectId: row.object_id, objectName: row.object_name, objectCode: row.object_code, startedAt: row.started_at.toISOString(), ...(row.ended_at ? { endedAt: row.ended_at.toISOString() } : {}), workedMinutes: Number(row.worked_minutes), status: row.shift_status === 'closed' ? 'complete' : 'open' }
  }
}
