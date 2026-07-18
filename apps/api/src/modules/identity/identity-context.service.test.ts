import assert from 'node:assert/strict'
import test from 'node:test'
import { DevelopmentAccessRepository } from './development-access.repository.js'
import { IdentityContextService } from './identity-context.service.js'

const service = new IdentityContextService(new DevelopmentAccessRepository())

test('each role receives only its object scope', async () => {
  const contractor = await service.getContext('contractor', 'development')
  const foreman = await service.getContext('foreman', 'development')
  const worker = await service.getContext('worker', 'development')

  assert.equal(contractor?.objects.length, 3)
  assert.deepEqual(foreman?.objects.map((object) => object.id), ['object-severny', 'object-gorizont'])
  assert.deepEqual(worker?.objects.map((object) => object.id), ['object-severny'])
})

test('worker context never exposes manager actions', async () => {
  const worker = await service.getContext('worker', 'development')
  assert.equal(worker?.permissions.includes('member.manage'), false)
  assert.equal(worker?.permissions.includes('task.create'), false)
  assert.equal(worker?.permissions.includes('shift.manage.self'), true)
})
