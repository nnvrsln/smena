import { existsSync } from 'node:fs'
import path from 'node:path'
import { projectRoot } from './migration-plan.mjs'

export function postgresExecutable(name, override) {
  if (override) return override
  const localName = process.platform === 'win32' ? `${name}.exe` : name
  const local = path.join(projectRoot, '.tools', 'postgresql-18.4', 'pgsql', 'bin', localName)
  return existsSync(local) ? local : localName
}

export function postgresEnvironment(connectionString) {
  const url = new URL(connectionString)
  const database = url.pathname.replace(/^\//u, '')
  if (!database) throw new Error('Database name is missing from the connection URL')
  return {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGDATABASE: decodeURIComponent(database),
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
  }
}
