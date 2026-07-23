import { access } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { postgresEnvironment, postgresExecutable } from './postgres-tools.mjs'

const connectionString = process.env.RESTORE_DATABASE_URL
if (!connectionString) throw new Error('RESTORE_DATABASE_URL is required and must target a disposable database')

const target = new URL(connectionString)
const databaseName = decodeURIComponent(target.pathname.replace(/^\//u, ''))
if (!databaseName.endsWith('_restore_test') && process.env.SMENA_ALLOW_RESTORE !== '1') {
  throw new Error('Refusing restore: target database must end with _restore_test')
}

const inputArgument = process.argv[2]
if (!inputArgument) throw new Error('Pass the backup file path as the first argument')
const input = path.resolve(inputArgument)
await access(input)

const result = spawnSync(
  postgresExecutable('pg_restore', process.env.PG_RESTORE_PATH),
  ['--clean', '--if-exists', '--no-owner', '--no-privileges', '--exit-on-error', '--dbname', databaseName, input],
  { env: postgresEnvironment(connectionString), stdio: 'inherit' },
)
if (result.error) throw result.error
if (result.status !== 0) throw new Error(`pg_restore failed with exit code ${result.status}`)
process.stdout.write(`restored ${input} into ${databaseName}\n`)
