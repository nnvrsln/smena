import assert from 'node:assert/strict'
import test from 'node:test'
import { Test } from '@nestjs/testing'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
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
    workerId = worker.id
    originalObjectIds = worker.objectIds

    const contractorContext = contractorLogin.json().context
    const objectIds = contractorContext.objects.slice(0, 2).map((object: { id: string }) => object.id)
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
