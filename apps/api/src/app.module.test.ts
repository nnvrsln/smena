import assert from 'node:assert/strict'
import test from 'node:test'
import { Test } from '@nestjs/testing'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { Pool } from 'pg'
import { AppModule } from './app.module.js'

test('login creates a server session used by protected context and logout', async () => {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
  await app.init()
  await app.getHttpAdapter().getInstance().ready()

  try {
    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { phone: '+7 999 000-00-03', password: 'Smena2026!' },
    })
    assert.equal(login.statusCode, 201)
    const setCookie = login.headers['set-cookie']
    const cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(';')[0]
    assert.ok(cookie?.startsWith('smena_session='))
    assert.equal(login.json().context.user.role, 'worker')

    const context = await app.inject({ method: 'GET', url: '/api/v1/me/context', headers: { cookie } })
    assert.equal(context.statusCode, 200)
    assert.deepEqual(context.json().objects.map((object: { name: string }) => object.name), ['ЖК «Северный»'])

    const logout = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie } })
    assert.equal(logout.statusCode, 204)
    const afterLogout = await app.inject({ method: 'GET', url: '/api/v1/me/context', headers: { cookie } })
    assert.equal(afterLogout.statusCode, 401)
  } finally {
    await app.close()
  }
})

test('contractor manages member object assignments without crossing organization boundary', async () => {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
  await app.init()
  await app.getHttpAdapter().getInstance().ready()

  let contractorCookie: string | undefined
  let workerId: string | undefined
  let originalObjectIds: string[] = []
  let managedObjectId: string | undefined
  let originalManagedMemberIds: string[] = []
  try {
    const contractorLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { phone: '+7 999 000-00-01', password: 'Smena2026!' },
    })
    contractorCookie = (Array.isArray(contractorLogin.headers['set-cookie']) ? contractorLogin.headers['set-cookie'][0] : contractorLogin.headers['set-cookie'])?.split(';')[0]
    assert.ok(contractorCookie)

    const members = await app.inject({ method: 'GET', url: '/api/v1/members', headers: { cookie: contractorCookie } })
    assert.equal(members.statusCode, 200)
    assert.equal(members.json().members.length, 3)
    const worker = members.json().members.find((member: { role: string }) => member.role === 'worker')
    assert.ok(worker)
    assert.ok(['on_shift', 'shift_completed', 'not_started'].includes(worker.todayStatus))
    workerId = worker.id
    originalObjectIds = worker.objectIds

    const contractorContext = contractorLogin.json().context
    const objectIds = contractorContext.objects.slice(0, 2).map((object: { id: string }) => object.id)
    const firstObjectId = objectIds[0]
    assert.ok(firstObjectId)
    managedObjectId = firstObjectId
    originalManagedMemberIds = members.json().members
      .filter((member: { role: string; objectIds: string[] }) => member.role !== 'contractor' && member.objectIds.includes(firstObjectId))
      .map((member: { id: string }) => member.id)
    const foreignObject = await app.inject({
      method: 'PUT',
      url: `/api/v1/members/${workerId}/objects`,
      headers: { cookie: contractorCookie },
      payload: { objectIds: ['30000000-0000-4000-8000-000000000004'] },
    })
    assert.equal(foreignObject.statusCode, 400)

    const update = await app.inject({
      method: 'PUT',
      url: `/api/v1/members/${workerId}/objects`,
      headers: { cookie: contractorCookie },
      payload: { objectIds },
    })
    assert.equal(update.statusCode, 200)
    assert.deepEqual(update.json().member.objectIds, objectIds)

    const objectTeam = await app.inject({
      method: 'PUT',
      url: `/api/v1/objects/${managedObjectId}/members`,
      headers: { cookie: contractorCookie },
      payload: { memberIds: [workerId] },
    })
    assert.equal(objectTeam.statusCode, 200)
    assert.ok(objectTeam.json().members.find((member: { id: string; objectIds: string[] }) => member.id === workerId)?.objectIds.includes(managedObjectId))

    const foreignObjectTeam = await app.inject({
      method: 'PUT',
      url: '/api/v1/objects/30000000-0000-4000-8000-000000000004/members',
      headers: { cookie: contractorCookie },
      payload: { memberIds: [workerId] },
    })
    assert.equal(foreignObjectTeam.statusCode, 404)

    const workerLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { phone: '+7 999 000-00-03', password: 'Smena2026!' },
    })
    const workerCookie = (Array.isArray(workerLogin.headers['set-cookie']) ? workerLogin.headers['set-cookie'][0] : workerLogin.headers['set-cookie'])?.split(';')[0]
    assert.ok(workerCookie)
    assert.equal(workerLogin.json().context.objects.length, 2)

    const forbidden = await app.inject({ method: 'GET', url: '/api/v1/members', headers: { cookie: workerCookie } })
    assert.equal(forbidden.statusCode, 403)
  } finally {
    if (contractorCookie && managedObjectId) {
      await app.inject({
        method: 'PUT',
        url: `/api/v1/objects/${managedObjectId}/members`,
        headers: { cookie: contractorCookie },
        payload: { memberIds: originalManagedMemberIds },
      })
    }
    if (contractorCookie && workerId) {
      await app.inject({
        method: 'PUT',
        url: `/api/v1/members/${workerId}/objects`,
        headers: { cookie: contractorCookie },
        payload: { objectIds: originalObjectIds },
      })
    }
    await app.close()
  }
})

test('contractor creates and edits objects while other roles remain read-only', async () => {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
  await app.init()
  await app.getHttpAdapter().getInstance().ready()
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  let createdId: string | undefined
  try {
    const contractorLogin = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { phone: '+7 999 000-00-01', password: 'Smena2026!' } })
    const contractorCookie = (Array.isArray(contractorLogin.headers['set-cookie']) ? contractorLogin.headers['set-cookie'][0] : contractorLogin.headers['set-cookie'])?.split(';')[0]
    assert.ok(contractorCookie)

    const invalid = await app.inject({ method: 'POST', url: '/api/v1/objects', headers: { cookie: contractorCookie }, payload: { name: 'A', code: '' } })
    assert.equal(invalid.statusCode, 400)

    const created = await app.inject({ method: 'POST', url: '/api/v1/objects', headers: { cookie: contractorCookie }, payload: { name: 'Тестовый объект', code: 'Корпус Т' } })
    assert.equal(created.statusCode, 201)
    createdId = created.json().object.id
    assert.equal(created.json().object.plannedWorkers, 0)

    const duplicate = await app.inject({ method: 'POST', url: '/api/v1/objects', headers: { cookie: contractorCookie }, payload: { name: 'Другой объект', code: 'Корпус Т' } })
    assert.equal(duplicate.statusCode, 409)
    assert.equal(duplicate.json().code, 'OBJECT_CODE_EXISTS')

    const updated = await app.inject({ method: 'PUT', url: `/api/v1/objects/${createdId}`, headers: { cookie: contractorCookie }, payload: { name: 'Тестовый объект после правки', code: 'Секция Т' } })
    assert.equal(updated.statusCode, 200)
    assert.equal(updated.json().object.name, 'Тестовый объект после правки')
    assert.equal(updated.json().object.plannedWorkers, 0)

    const context = await app.inject({ method: 'GET', url: '/api/v1/me/context', headers: { cookie: contractorCookie } })
    assert.ok(context.json().objects.some((object: { id: string }) => object.id === createdId))

    const foremanLogin = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { phone: '+7 999 000-00-02', password: 'Smena2026!' } })
    const foremanCookie = (Array.isArray(foremanLogin.headers['set-cookie']) ? foremanLogin.headers['set-cookie'][0] : foremanLogin.headers['set-cookie'])?.split(';')[0]
    const forbidden = await app.inject({ method: 'POST', url: '/api/v1/objects', headers: { cookie: foremanCookie }, payload: { name: 'Запрещённый объект', code: 'Нет' } })
    assert.equal(forbidden.statusCode, 403)

    const foreign = await app.inject({ method: 'PUT', url: '/api/v1/objects/30000000-0000-4000-8000-000000000004', headers: { cookie: contractorCookie }, payload: { name: 'Чужой объект', code: 'Чужой' } })
    assert.equal(foreign.statusCode, 404)
  } finally {
    if (createdId) {
      await pool.query('delete from object_daily_summaries where object_id=$1', [createdId])
      await pool.query('delete from objects where id=$1', [createdId])
    }
    await pool.end()
    await app.close()
  }
})

test('worker completes the QR shift lifecycle and creates the first timesheet day', async () => {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
  await app.init()
  await app.getHttpAdapter().getInstance().ready()
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    const workerLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { phone: '+7 999 000-00-03', password: 'Smena2026!' },
    })
    assert.equal(workerLogin.statusCode, 201)
    const setCookie = workerLogin.headers['set-cookie']
    const workerCookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(';')[0]
    assert.ok(workerCookie)
    const workerId = workerLogin.json().context.user.id as string
    const assignedObject = workerLogin.json().context.objects[0] as { id: string; name: string }

    const emptyCurrent = await app.inject({ method: 'GET', url: '/api/v1/shifts/current', headers: { cookie: workerCookie } })
    assert.equal(emptyCurrent.statusCode, 200)
    assert.equal(emptyCurrent.json().shift, null)

    const missingQr = await app.inject({
      method: 'POST', url: '/api/v1/shifts/start', headers: { cookie: workerCookie },
      payload: { objectId: assignedObject.id, occurredAtDevice: new Date().toISOString() },
    })
    assert.equal(missingQr.statusCode, 400)
    assert.equal(missingQr.json().code, 'QR_REQUIRED')

    const invalidQr = await app.inject({
      method: 'POST', url: '/api/v1/shifts/start', headers: { cookie: workerCookie },
      payload: { objectId: assignedObject.id, qrToken: 'WRONG-QR', occurredAtDevice: new Date().toISOString() },
    })
    assert.equal(invalidQr.statusCode, 400)
    assert.equal(invalidQr.json().code, 'QR_INVALID')

    const foreignObjectId = '30000000-0000-4000-8000-000000000002'
    const inaccessibleObject = await app.inject({
      method: 'POST', url: '/api/v1/shifts/start', headers: { cookie: workerCookie },
      payload: { objectId: foreignObjectId, qrToken: `SMENA-QR-${foreignObjectId}`, occurredAtDevice: new Date().toISOString() },
    })
    assert.equal(inaccessibleObject.statusCode, 404)
    assert.equal(inaccessibleObject.json().code, 'OBJECT_ACCESS_DENIED')

    const started = await app.inject({
      method: 'POST', url: '/api/v1/shifts/start', headers: { cookie: workerCookie },
      payload: { objectId: assignedObject.id, qrToken: `SMENA-QR-${assignedObject.id}`, occurredAtDevice: new Date().toISOString() },
    })
    assert.equal(started.statusCode, 201)
    assert.equal(started.json().shift.objectId, assignedObject.id)
    assert.equal(started.json().shift.objectName, assignedObject.name)
    assert.equal(started.json().shift.status, 'open')
    assert.equal(started.json().shift.startMethod, 'qr_scan')

    const current = await app.inject({ method: 'GET', url: '/api/v1/shifts/current', headers: { cookie: workerCookie } })
    assert.equal(current.statusCode, 200)
    assert.equal(current.json().shift.id, started.json().shift.id)

    const foremanLogin = await app.inject({
      method: 'POST', url: '/api/v1/auth/login',
      payload: { phone: '+7 999 000-00-02', password: 'Smena2026!' },
    })
    assert.equal(foremanLogin.statusCode, 201)
    const foremanSetCookie = foremanLogin.headers['set-cookie']
    const foremanCookie = (Array.isArray(foremanSetCookie) ? foremanSetCookie[0] : foremanSetCookie)?.split(';')[0]
    assert.ok(foremanCookie)
    const foremanObject = foremanLogin.json().context.objects.find((object: { id: string }) => object.id === assignedObject.id)
    assert.equal(foremanObject.presentWorkers, 1)

    const repeated = await app.inject({
      method: 'POST', url: '/api/v1/shifts/start', headers: { cookie: workerCookie },
      payload: { objectId: assignedObject.id, qrToken: `SMENA-QR-${assignedObject.id}`, occurredAtDevice: new Date().toISOString() },
    })
    assert.equal(repeated.statusCode, 409)
    assert.equal(repeated.json().code, 'SHIFT_ALREADY_OPEN')

    const stored = await pool.query<{ shifts: string; events: string }>(`select (select count(*) from shifts where status='open')::text shifts, (select count(*) from shift_events where event_type='shift_started')::text events`)
    assert.deepEqual(stored.rows[0], { shifts: '1', events: '1' })

    const contractorLogin = await app.inject({
      method: 'POST', url: '/api/v1/auth/login',
      payload: { phone: '+7 999 000-00-01', password: 'Smena2026!' },
    })
    const contractorSetCookie = contractorLogin.headers['set-cookie']
    const contractorCookie = (Array.isArray(contractorSetCookie) ? contractorSetCookie[0] : contractorSetCookie)?.split(';')[0]
    assert.ok(contractorCookie)
    const contractorObject = contractorLogin.json().context.objects.find((object: { id: string }) => object.id === assignedObject.id)
    assert.equal(contractorObject.presentWorkers, 1)
    assert.equal(contractorLogin.json().context.objects.reduce((sum: number, object: { presentWorkers: number }) => sum + object.presentWorkers, 0), 1)
    const forbidden = await app.inject({
      method: 'POST', url: '/api/v1/shifts/start', headers: { cookie: contractorCookie },
      payload: { objectId: assignedObject.id, qrToken: `SMENA-QR-${assignedObject.id}`, occurredAtDevice: new Date().toISOString() },
    })
    assert.equal(forbidden.statusCode, 403)
    assert.equal(forbidden.json().code, 'ACCESS_DENIED')

    const invalidEnd = await app.inject({
      method: 'POST', url: '/api/v1/shifts/end', headers: { cookie: workerCookie },
      payload: { occurredAtDevice: 'not-a-date' },
    })
    assert.equal(invalidEnd.statusCode, 400)
    assert.equal(invalidEnd.json().code, 'INVALID_DEVICE_TIME')

    const ended = await app.inject({
      method: 'POST', url: '/api/v1/shifts/end', headers: { cookie: workerCookie },
      payload: { occurredAtDevice: new Date().toISOString() },
    })
    assert.equal(ended.statusCode, 201)
    assert.equal(ended.json().shift.id, started.json().shift.id)
    assert.equal(ended.json().shift.status, 'closed')
    assert.ok(ended.json().shift.endedAtServer)
    assert.equal(typeof ended.json().shift.workedMinutes, 'number')

    const noCurrent = await app.inject({ method: 'GET', url: '/api/v1/shifts/current', headers: { cookie: workerCookie } })
    assert.equal(noCurrent.statusCode, 200)
    assert.equal(noCurrent.json().shift, null)
    const today = await app.inject({ method: 'GET', url: '/api/v1/shifts/today', headers: { cookie: workerCookie } })
    assert.equal(today.statusCode, 200)
    assert.equal(today.json().shift.id, started.json().shift.id)
    assert.equal(today.json().shift.status, 'closed')

    const contractorAfterEnd = await app.inject({ method: 'GET', url: '/api/v1/me/context', headers: { cookie: contractorCookie } })
    const contractorAttendance = contractorAfterEnd.json().objects.reduce((sum: number, object: { presentWorkers: number }) => sum + object.presentWorkers, 0)
    assert.equal(contractorAttendance, 0)
    const foremanAfterEnd = await app.inject({ method: 'GET', url: '/api/v1/me/context', headers: { cookie: foremanCookie } })
    const foremanObjectAfterEnd = foremanAfterEnd.json().objects.find((object: { id: string }) => object.id === assignedObject.id)
    assert.equal(foremanObjectAfterEnd.presentWorkers, 0)

    const repeatedEnd = await app.inject({
      method: 'POST', url: '/api/v1/shifts/end', headers: { cookie: workerCookie },
      payload: { occurredAtDevice: new Date().toISOString() },
    })
    assert.equal(repeatedEnd.statusCode, 409)
    assert.equal(repeatedEnd.json().code, 'SHIFT_NOT_OPEN')

    const closedStored = await pool.query<{ closed: string; events: string }>(`select (select count(*) from shifts where status='closed')::text closed, (select count(*) from shift_events)::text events`)
    assert.deepEqual(closedStored.rows[0], { closed: '1', events: '2' })

    const workDate = ended.json().shift.startedAtServer.slice(0, 10)
    const contractorDays = await app.inject({ method: 'GET', url: `/api/v1/timesheet/days?date=${workDate}`, headers: { cookie: contractorCookie } })
    assert.equal(contractorDays.statusCode, 200)
    assert.equal(contractorDays.json().days.length, 1)
    assert.equal(contractorDays.json().days[0].shiftId, started.json().shift.id)
    assert.equal(contractorDays.json().days[0].status, 'complete')
    assert.equal(contractorDays.json().days[0].userName, 'Иванов Иван')

    const foremanDays = await app.inject({ method: 'GET', url: `/api/v1/timesheet/days?date=${workDate}`, headers: { cookie: foremanCookie } })
    assert.equal(foremanDays.statusCode, 200)
    assert.equal(foremanDays.json().days.length, 1)

    const detail = await app.inject({ method: 'GET', url: `/api/v1/timesheet/days/${started.json().shift.id}`, headers: { cookie: foremanCookie } })
    assert.equal(detail.statusCode, 200)
    assert.equal(detail.json().day.events.length, 2)
    assert.deepEqual(detail.json().day.events.map((event: { type: string }) => event.type), ['shift_started', 'shift_ended'])

    const contractorHistory = await app.inject({
      method: 'GET',
      url: `/api/v1/timesheet/members/${workerId}?from=${workDate}&to=${workDate}`,
      headers: { cookie: contractorCookie },
    })
    assert.equal(contractorHistory.statusCode, 200)
    assert.equal(contractorHistory.json().member.id, workerId)
    assert.equal(contractorHistory.json().days.length, 1)
    assert.deepEqual(contractorHistory.json().summary, { shiftCount: 1, completedCount: 1, workedMinutes: ended.json().shift.workedMinutes, objectCount: 1 })

    const foremanHistory = await app.inject({
      method: 'GET',
      url: `/api/v1/timesheet/members/${workerId}?from=${workDate}&to=${workDate}`,
      headers: { cookie: foremanCookie },
    })
    assert.equal(foremanHistory.statusCode, 200)
    assert.equal(foremanHistory.json().days[0].objectId, assignedObject.id)

    const inaccessibleHistory = await app.inject({
      method: 'GET',
      url: `/api/v1/timesheet/members/20000000-0000-4000-8000-000000000001?from=${workDate}&to=${workDate}`,
      headers: { cookie: foremanCookie },
    })
    assert.equal(inaccessibleHistory.statusCode, 404)
    assert.equal(inaccessibleHistory.json().code, 'MEMBER_HISTORY_NOT_FOUND')

    const workerForbidden = await app.inject({ method: 'GET', url: `/api/v1/timesheet/days?date=${workDate}`, headers: { cookie: workerCookie } })
    assert.equal(workerForbidden.statusCode, 403)
    assert.equal(workerForbidden.json().code, 'ACCESS_DENIED')

    const invalidDate = await app.inject({ method: 'GET', url: '/api/v1/timesheet/days?date=19-07-2026', headers: { cookie: contractorCookie } })
    assert.equal(invalidDate.statusCode, 400)
    assert.equal(invalidDate.json().code, 'INVALID_TIMESHEET_DATE')

    const invalidRange = await app.inject({
      method: 'GET',
      url: `/api/v1/timesheet/members/${workerId}?from=2026-02-31&to=${workDate}`,
      headers: { cookie: contractorCookie },
    })
    assert.equal(invalidRange.statusCode, 400)
    assert.equal(invalidRange.json().code, 'INVALID_TIMESHEET_RANGE')
  } finally {
    await pool.end()
    await app.close()
  }
})
