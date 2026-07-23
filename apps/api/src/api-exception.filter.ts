import { ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'

interface ErrorBody {
  code: string
  message: string
  requestId: string
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp()
    const request = context.getRequest<FastifyRequest>()
    const reply = context.getResponse<FastifyReply>()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const knownResponse = exception instanceof HttpException ? exception.getResponse() : undefined
    const body = this.bodyFor(knownResponse, request.id)

    if (!(exception instanceof HttpException)) {
      const error = exception instanceof Error ? exception : new Error('Unknown error')
      process.stderr.write(`${JSON.stringify({
        level: 'error',
        event: 'request_failed',
        requestId: request.id,
        method: request.method,
        path: request.url.split('?')[0],
        status,
        error: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      })}\n`)
    }

    reply.status(status).send(body)
  }

  private bodyFor(response: string | object | undefined, requestId: string): ErrorBody {
    if (response && typeof response === 'object' && 'code' in response && 'message' in response) {
      const candidate = response as { code?: unknown; message?: unknown }
      if (typeof candidate.code === 'string' && typeof candidate.message === 'string') {
        return { code: candidate.code, message: candidate.message, requestId }
      }
    }
    if (typeof response === 'string') {
      return { code: 'HTTP_ERROR', message: response, requestId }
    }
    return {
      code: 'INTERNAL_ERROR',
      message: 'Внутренняя ошибка. Повторите попытку позже.',
      requestId,
    }
  }
}
