import { spawnSync } from 'node:child_process'
import { Client } from 'pg'
import { projectRoot } from './migration-plan.mjs'

const sourceUrl = process.env.DATABASE_URL
if (!sourceUrl) throw new Error('DATABASE_URL is required')

const verifyDatabase = 'smena_migration_verify'
const verifySchema = 'smena_migration_verify'
const adminConnection = process.env.MIGRATION_ADMIN_URL
const adminUrl = new URL(adminConnection ?? sourceUrl)
const targetUrl = new URL(adminConnection ?? sourceUrl)
if (adminConnection) {
  adminUrl.pathname = '/postgres'
  targetUrl.pathname = `/${verifyDatabase}`
  targetUrl.search = ''
} else {
  targetUrl.searchParams.set('options', `-c search_path=${verifySchema},public`)
}

const admin = new Client({ connectionString: adminUrl.toString() })
await admin.connect()

function migrate() {
  const result = spawnSync(process.execPath, ['apps/api/scripts/migrate.mjs'], {
    cwd: projectRoot,
    env: { ...process.env, APP_ENV: 'test', DATABASE_URL: targetUrl.toString() },
    encoding: 'utf8',
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Migration command failed with exit code ${result.status}`)
}

try {
  if (adminConnection) {
    await admin.query(`drop database if exists ${verifyDatabase} with (force)`)
    await admin.query(`create database ${verifyDatabase}`)
  } else {
    await admin.query(`drop schema if exists ${verifySchema} cascade`)
    await admin.query(`create schema ${verifySchema}`)
  }
  migrate()
  migrate()

  const target = new Client({ connectionString: targetUrl.toString() })
  await target.connect()
  try {
    const result = await target.query(`
      select
        to_regclass('organizations') is not null as organizations,
        to_regclass('auth_sessions') is not null as auth_sessions,
        to_regclass('shifts') is not null as shifts,
        (select count(*) from smena_schema_migrations) as migration_count
    `)
    const row = result.rows[0]
    if (!row?.organizations || !row.auth_sessions || !row.shifts || Number(row.migration_count) !== 4) {
      throw new Error(`Unexpected migrated schema: ${JSON.stringify(row)}`)
    }
  } finally {
    await target.end()
  }
} finally {
  if (adminConnection) {
    await admin.query(`drop database if exists ${verifyDatabase} with (force)`)
  } else {
    await admin.query(`drop schema if exists ${verifySchema} cascade`)
  }
  await admin.end()
}

process.stdout.write('migration verification passed\n')
