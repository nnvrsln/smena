import { Module } from '@nestjs/common'
import { AppController } from './app.controller.js'
import { AuthService } from './modules/auth/auth.service.js'
import { ACCESS_REPOSITORY, IdentityContextService } from './modules/identity/identity-context.service.js'
import { PostgresAccessRepository } from './modules/identity/postgres-access.repository.js'

@Module({
  controllers: [AppController],
  providers: [
    IdentityContextService,
    AuthService,
    { provide: ACCESS_REPOSITORY, useClass: PostgresAccessRepository },
  ],
})
export class AppModule {}
