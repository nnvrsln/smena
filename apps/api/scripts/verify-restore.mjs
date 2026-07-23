import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { Client } from 'pg'
import { projectRoot } from './migration-plan.mjs'

const sourceUrl = process.env.DATABASE_URL
const adminConnection = process.env.MIGRATION_ADMIN_URL
if (!sourceUrl) throw new Error('DATABASE_URL is required')
if (!adminConnection) throw new Error('MIGRATION_ADMIN_URL is required for restore verification')

const targetDatabase = 'smena_restore_test'
const adminUrl = new URL(adminConnection)
adminUrl.pathname = '/postgres'
const targetUrl = new URL(adminConnection)
targetUrl.pathname = `/${targetDatabase}`
targetUrl.search = ''
const backup = path.join(projectRoot, 'tmp', 'backups', 'restore-verification.dump')
await mkdir(path.dirname(backup), { recursive: true })

function run(command, arguments_, environment) {
  const result = spawnSync(command, arguments_, {
    cwd: projectRoot,
    env: { ...process.env, ...environment },
    encoding: 'utf8',
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}`)
}

const admin = new Client({ connectionString: adminUrl.toString() })
await admin.connect()

try {
  run(process.execPath, ['apps/api/scripts/backup.mjs', backup], { DATABASE_URL: sourceUrl })
  await admin.query(`drop database if exists ${targetDatabase} with (force)`)
  await admin.query(`create database ${targetDatabase}`)
  run(
    process.execPath,
    ['apps/api/scripts/restore.mjs', backup],
    { RESTORE_DATABASE_URL: targetUrl.toString() },
  )

  const restored = new Client({ connectionString: targetUrl.toString() })
  await restored.connect()
  try {
    const result = await restored.query(`
      select
        (select count(*) from organizations) as organizations,
        (select count(*) from objects) as objects,
        (select count(*) from users) as users,
        (select count(*) from smena_schema_migrations) as migrations
    `)
    const row = result.rows[0]
    if (
      Number(row?.organizations) !== 2
      || Number(row.objects) !== 4
      || Number(row.users) !== 3
      || Number(row.migrations) !== 5
    ) {
      throw new Error(`Unexpected restored data: ${JSON.stringify(row)}`)
    }
  } finally {
    await restored.end()
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  run(npmCommand, ['test'], { DATABASE_URL: targetUrl.toString(), APP_ENV: 'test', NODE_ENV: 'test' })
} finally {
  await admin.query(`drop database if exists ${targetDatabase} with (force)`)
  await admin.end()
  await rm(backup, { force: true })
}

process.stdout.write('backup and restore verification passed\n')
