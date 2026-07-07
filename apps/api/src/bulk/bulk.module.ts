import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { IncidentsModule } from '../incidents/incidents.module';
import { CLASSIFICATION_QUEUE } from '../constants/queue';
import { BulkController } from './bulk.controller';
import { BulkService } from './bulk.service';
import { ClassificationProcessor } from './classification.processor';
import { BulkUploadsRepository } from './bulk.repository';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
        },
      }),
    }),
    BullModule.registerQueue({ name: CLASSIFICATION_QUEUE }),
    IncidentsModule,
  ],
  controllers: [BulkController],
  providers: [BulkService, ClassificationProcessor, BulkUploadsRepository],
})
export class BulkModule {}
