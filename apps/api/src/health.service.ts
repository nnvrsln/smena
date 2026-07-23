import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly pool: Pool

  constructor() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('DATABASE_URL is required for health checks')
    this.pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 2_000 })
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end()
  }

  async postgresReady(): Promise<boolean> {
    try {
      await this.pool.query('select 1')
      return true
    } catch {
      return false
    }
  }
}
