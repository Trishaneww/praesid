import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from './lib/clients/clients.module';
import { OiicsModule } from './oiics/oiics.module';
import { IncidentsModule } from './incidents/incidents.module';
import { TenantsModule } from './tenants/tenants.module';
import { BulkModule } from './bulk/bulk.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ClientsModule,
    OiicsModule,
    IncidentsModule,
    TenantsModule,
    BulkModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
  ],
})
export class AppModule {}
