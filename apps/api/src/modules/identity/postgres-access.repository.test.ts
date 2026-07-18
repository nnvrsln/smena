import assert from 'node:assert/strict'
import test from 'node:test'
import { Pool } from 'pg'
import { PostgresAccessRepository } from './postgres-access.repository.js'

const databaseUrl = process.env.DATABASE_URL

test('PostgreSQL enforces organization and object scopes for all three roles', { skip: !databaseUrl }, async () => {
  const repository = new PostgresAccessRepository(databaseUrl)
  const pool = new Pool({ connectionString: databaseUrl })

  try {
    const total = await pool.query<{ count: string }>('select count(*)::text as count from objects')
    assert.equal(total.rows[0]?.count, '4', 'seed must contain a foreign-organization object')

    const expectedCounts = { contractor: 3, foreman: 2, worker: 1 } as const
    for (const [role, expectedCount] of Object.entries(expectedCounts)) {
      const identity = await repository.findIdentityByRole(role as keyof typeof expectedCounts)
      assert.ok(identity)
      const objects = await repository.listObjectsForIdentity(identity)
      assert.equal(objects.length, expectedCount)
      assert.ok(objects.every((object) => object.name !== 'Скрытый объект'))
    }
  } finally {
    await repository.onModuleDestroy()
    await pool.end()
  }
})
