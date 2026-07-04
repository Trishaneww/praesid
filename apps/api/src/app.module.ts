import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from './lib/clients/clients.module';
import { OiicsModule } from './oiics/oiics.module';
import { IncidentsModule } from './incidents/incidents.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ClientsModule,
    OiicsModule,
    IncidentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
  ],
})
export class AppModule {}
