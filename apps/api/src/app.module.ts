import { Module } from '@nestjs/common'
import { AppController } from './app.controller.js'
import { HealthService } from './health.service.js'
import { AuthService } from './modules/auth/auth.service.js'
import { ACCESS_REPOSITORY, IdentityContextService } from './modules/identity/identity-context.service.js'
import { PostgresAccessRepository } from './modules/identity/postgres-access.repository.js'
import { MembersService } from './modules/members/members.service.js'
import { InvitationsService } from './modules/invitations/invitations.service.js'
import { ObjectsService } from './modules/objects/objects.service.js'
import { ShiftsService } from './modules/shifts/shifts.service.js'
import { TimesheetsService } from './modules/timesheets/timesheets.service.js'

@Module({
  controllers: [AppController],
  providers: [
    IdentityContextService,
    HealthService,
    AuthService,
    MembersService,
    InvitationsService,
    ObjectsService,
    ShiftsService,
    TimesheetsService,
    { provide: ACCESS_REPOSITORY, useClass: PostgresAccessRepository },
  ],
})
export class AppModule {}
