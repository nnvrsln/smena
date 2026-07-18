import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'

const scrypt = promisify(scryptCallback)
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000

interface CredentialRow {
  id: string
  password_hash: string
}

export interface CreatedSession {
  token: string
  userId: string
  expiresAt: Date
}

function normalizePhone(value: string): string | null {
  let digits = value.replace(/\D/gu, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`
  if (digits.length === 10) digits = `7${digits}`
  return digits.length === 11 && digits.startsWith('7') ? `+${digits}` : null
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, salt, expectedHex] = storedHash.split('$')
  if (algorithm !== 'scrypt' || !salt || !expectedHex) return false
  const expected = Buffer.from(expectedHex, 'hex')
  const actual = await scrypt(password, salt, expected.length) as Buffer
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly pool: Pool

  constructor(connectionString = process.env.DATABASE_URL) {
    if (!connectionString) throw new Error('DATABASE_URL is required for authentication')
    this.pool = new Pool({ connectionString, max: 5 })
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end()
  }

  async login(phone: string, password: string): Promise<CreatedSession | null> {
    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone || password.length < 8) return null

    const result = await this.pool.query<CredentialRow>(
      `select id::text, password_hash
       from users
       where phone_normalized = $1 and status = 'active'
       limit 1`,
      [normalizedPhone],
    )
    const credential = result.rows[0]
    if (!credential || !(await verifyPassword(password, credential.password_hash))) return null

    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + sessionLifetimeMs)
    await this.pool.query(
      `insert into auth_sessions (user_id, token_hash, expires_at)
       values ($1, $2, $3)`,
      [credential.id, tokenHash(token), expiresAt],
    )
    return { token, userId: credential.id, expiresAt }
  }

  async authenticate(token: string | undefined): Promise<string | null> {
    if (!token) return null
    const result = await this.pool.query<{ user_id: string }>(
      `update auth_sessions s
       set last_seen_at = now()
       from users u
       where s.token_hash = $1
         and s.user_id = u.id
         and s.revoked_at is null
         and s.expires_at > now()
         and u.status = 'active'
       returning s.user_id::text`,
      [tokenHash(token)],
    )
    return result.rows[0]?.user_id ?? null
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) return
    await this.pool.query(
      `update auth_sessions set revoked_at = now()
       where token_hash = $1 and revoked_at is null`,
      [tokenHash(token)],
    )
  }
}
