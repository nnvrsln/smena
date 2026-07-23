import { Pool } from 'pg'
import { migrationPlan } from './migration-plan.mjs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required')

const pool = new Pool({ connectionString, max: 1 })
const client = await pool.connect()

try {
  await client.query('select pg_advisory_lock($1)', [73032003])
  await client.query(`
    create table if not exists smena_schema_migrations (
      name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `)

  for (const migration of await migrationPlan()) {
    const applied = await client.query(
      'select checksum from smena_schema_migrations where name = $1',
      [migration.name],
    )
    const recordedChecksum = applied.rows[0]?.checksum
    if (recordedChecksum && recordedChecksum !== migration.checksum) {
      throw new Error(`Migration ${migration.name} changed after it was applied`)
    }
    if (recordedChecksum) {
      process.stdout.write(`skip ${migration.name}\n`)
      continue
    }

    await client.query(migration.sql)
    await client.query(
      'insert into smena_schema_migrations (name, checksum) values ($1, $2)',
      [migration.name, migration.checksum],
    )
    process.stdout.write(`apply ${migration.name}\n`)
  }
} finally {
  await client.query('select pg_advisory_unlock($1)', [73032003]).catch(() => undefined)
  client.release()
  await pool.end()
}
