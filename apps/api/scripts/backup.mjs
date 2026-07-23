import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { postgresEnvironment, postgresExecutable } from './postgres-tools.mjs'
import { projectRoot } from './migration-plan.mjs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required')

const output = path.resolve(process.argv[2] ?? path.join(projectRoot, 'tmp', 'backups', `smena-${new Date().toISOString().replace(/[:.]/gu, '-')}.dump`))
await mkdir(path.dirname(output), { recursive: true })

const result = spawnSync(
  postgresExecutable('pg_dump', process.env.PG_DUMP_PATH),
  ['--format=custom', '--no-owner', '--no-privileges', '--file', output],
  { env: postgresEnvironment(connectionString), stdio: 'inherit' },
)
if (result.error) throw result.error
if (result.status !== 0) throw new Error(`pg_dump failed with exit code ${result.status}`)
process.stdout.write(`${output}\n`)
