import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const projectRoot = path.resolve(apiRoot, '..', '..')
export const migrationsRoot = path.join(projectRoot, 'infra', 'postgres')

export async function migrationPlan(appEnvironment = process.env.APP_ENV ?? 'development') {
  const entries = await readdir(migrationsRoot)
  const includeSeed = appEnvironment === 'development' || appEnvironment === 'test'
  const names = entries
    .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/u.test(name))
    .filter((name) => includeSeed || name !== '002_development_seed.sql')
    .sort()

  return Promise.all(names.map(async (name) => {
    const sql = await readFile(path.join(migrationsRoot, name), 'utf8')
    return {
      name,
      sql,
      checksum: createHash('sha256').update(sql).digest('hex'),
    }
  }))
}
