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

  const plan = await migrationPlan()
  const appliedCount = await client.query('select count(*)::integer as count from smena_schema_migrations')
  const existingFoundation = await client.query(
    `select to_regclass(format('%I.organizations', current_schema())) is not null as exists`,
  )
  if (appliedCount.rows[0]?.count === 0 && existingFoundation.rows[0]?.exists) {
    if (process.env.SMENA_BASELINE_EXISTING !== '1') {
      throw new Error('Existing schema has no migration ledger. Set SMENA_BASELINE_EXISTING=1 once after verifying migrations 001-004.')
    }
    const markers = new Map([
      ['001_foundation.sql', `select to_regclass('organizations') is not null as applied`],
      ['002_development_seed.sql', `select exists(select 1 from organizations where id='10000000-0000-4000-8000-000000000001') as applied`],
      ['003_auth_sessions.sql', `select to_regclass('auth_sessions') is not null as applied`],
      ['004_shifts_qr.sql', `select to_regclass('shifts') is not null as applied`],
    ])
    for (const migration of plan) {
      const marker = markers.get(migration.name)
      if (!marker) continue
      const result = await client.query(marker)
      if (result.rows[0]?.applied) {
        await client.query(
          'insert into smena_schema_migrations (name,checksum) values ($1,$2)',
          [migration.name, migration.checksum],
        )
        process.stdout.write(`baseline ${migration.name}\n`)
      }
    }
  }

  for (const migration of plan) {
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
