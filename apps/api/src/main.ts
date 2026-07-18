import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module.js'

const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
  logger: process.env.NODE_ENV === 'production' ? ['error', 'warn', 'log'] : ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') app.enableCors({ origin: true, credentials: true })
await app.listen(4180, '127.0.0.1')
