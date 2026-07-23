import { spawn } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot = path.resolve(apiRoot, '..', '..')
const migrationsRoot = path.join(projectRoot, 'infra', 'postgres')
const databaseUrl = process.env.DATABASE_URL
const testSchema = 'smena_test'

if (!databaseUrl) throw new Error('DATABASE_URL is required to run API tests')
if (!/^[a-z][a-z0-9_]*$/.test(testSchema)) throw new Error('Unsafe test schema name')

async function listTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? listTests(target) : target.endsWith('.test.ts') ? [target] : []
  }))
  return files.flat().sort()
}

function testDatabaseUrl() {
  const url = new URL(databaseUrl)
  url.searchParams.set('options', `-c search_path=${testSchema},public`)
  return url.toString()
}

async function provision(client) {
  await client.query(`drop schema if exists ${testSchema} cascade`)
  await client.query(`create schema ${testSchema}`)
  await client.query(`set search_path to ${testSchema}, public`)
  for (const migration of ['001_foundation.sql', '002_development_seed.sql', '003_auth_sessions.sql', '004_shifts_qr.sql', '005_invitations.sql']) {
    await client.query(await readFile(path.join(migrationsRoot, migration), 'utf8'))
  }
}

const pool = new Pool({ connectionString: databaseUrl, max: 1 })
const client = await pool.connect()
let exitCode = 1

try {
  await provision(client)
  const testFiles = await listTests(path.join(apiRoot, 'src'))
  exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', '--test', '--test-concurrency=1', ...testFiles], {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: testDatabaseUrl(), NODE_ENV: 'test' },
      stdio: 'inherit',
    })
    child.once('error', reject)
    child.once('exit', (code) => resolve(code ?? 1))
  })
} finally {
  await client.query('rollback').catch(() => undefined)
  await client.query(`drop schema if exists ${testSchema} cascade`)
  client.release()
  await pool.end()
}

process.exitCode = exitCode
