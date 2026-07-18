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
