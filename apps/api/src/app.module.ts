import { Module } from '@nestjs/common'
import { AppController } from './app.controller.js'
import { DevelopmentAccessRepository } from './modules/identity/development-access.repository.js'
import { ACCESS_REPOSITORY, IdentityContextService } from './modules/identity/identity-context.service.js'
import { PostgresAccessRepository } from './modules/identity/postgres-access.repository.js'

function accessRepository() {
  return process.env.SMENA_DATA_SOURCE === 'postgres'
    ? new PostgresAccessRepository()
    : new DevelopmentAccessRepository()
}

@Module({
  controllers: [AppController],
  providers: [
    IdentityContextService,
    { provide: ACCESS_REPOSITORY, useFactory: accessRepository },
  ],
})
export class AppModule {}
