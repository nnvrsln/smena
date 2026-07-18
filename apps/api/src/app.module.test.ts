import assert from 'node:assert/strict'
import test from 'node:test'
import { Test } from '@nestjs/testing'
import { AppController } from './app.controller.js'
import { AppModule } from './app.module.js'

test('Nest composition root resolves identity context service', async () => {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const controller = module.get(AppController)
  const context = await controller.context('worker')

  assert.equal(context?.user.role, 'worker')
  assert.deepEqual(context?.objects.map((object) => object.name), ['ЖК «Северный»'])
  await module.close()
})
