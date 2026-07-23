import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ApiExceptionFilter } from './api-exception.filter.js'
import { AppModule } from './app.module.js'

const appEnvironment = process.env.APP_ENV ?? (process.env.NODE_ENV === 'production' ? 'production' : 'development')
if (!['development', 'test', 'staging', 'production'].includes(appEnvironment)) {
  throw new Error('APP_ENV must be development, test, staging or production')
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')

const port = Number(process.env.PORT ?? 4180)
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('PORT must be a valid TCP port')
const host = process.env.HOST ?? '127.0.0.1'
const webOrigin = process.env.WEB_ORIGIN
if ((appEnvironment === 'staging' || appEnvironment === 'production') && !webOrigin) {
  throw new Error('WEB_ORIGIN is required in staging and production')
}

const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
  logger: ['error'],
})

app.useGlobalFilters(new ApiExceptionFilter())
app.enableCors({ origin: webOrigin ?? true, credentials: true })

const startedAt = new WeakMap<FastifyRequest, number>()
const fastify = app.getHttpAdapter().getInstance()
fastify.addHook('onRequest', (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
  startedAt.set(request, Date.now())
  reply.header('x-request-id', request.id)
  done()
})
fastify.addHook('onResponse', (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
  process.stdout.write(`${JSON.stringify({
    level: 'info',
    event: 'request_completed',
    requestId: request.id,
    method: request.method,
    path: request.url.split('?')[0],
    status: reply.statusCode,
    durationMs: Date.now() - (startedAt.get(request) ?? Date.now()),
  })}\n`)
  done()
})

await app.listen(port, host)
