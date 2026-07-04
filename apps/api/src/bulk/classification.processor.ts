import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as Sentry from '@sentry/nestjs';
import { PrismaService } from '../lib/clients/prisma.service';
import { ClassificationService } from '../incidents/classification.service';
import {
  CLASSIFICATION_CONCURRENCY,
  CLASSIFICATION_QUEUE,
} from '../constants/queue';
import { ClassificationJobData } from './bulk.service';

@Processor(CLASSIFICATION_QUEUE, { concurrency: CLASSIFICATION_CONCURRENCY })
export class ClassificationProcessor extends WorkerHost {
  constructor(
    private readonly classification: ClassificationService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<ClassificationJobData>): Promise<void> {
    const { incidentId, bulkUploadId } = job.data;

    let succeeded = true;
    try {
      await this.classification.classifyIncident(incidentId);
    } catch (error) {
      succeeded = false;
      Sentry.captureException(error);
    }

    const upload = await this.prisma.bulkUpload.update({
      where: { id: bulkUploadId },
      data: succeeded
        ? { processedRows: { increment: 1 } }
        : { failedRows: { increment: 1 } },
    });
    if (upload.processedRows + upload.failedRows >= upload.totalRows) {
      await this.prisma.bulkUpload.update({
        where: { id: bulkUploadId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }
  }
}
