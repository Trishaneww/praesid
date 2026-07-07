import { Injectable } from '@nestjs/common';
import { BulkUpload } from '../generated/prisma/client';
import { PrismaService } from '../lib/clients/prisma.service';

@Injectable()
export class BulkUploadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    tenantId: string;
    filename: string;
    totalRows: number;
  }): Promise<BulkUpload> {
    return this.prisma.bulkUpload.create({ data });
  }

  markProcessing(id: string): Promise<BulkUpload> {
    return this.prisma.bulkUpload.update({
      where: { id },
      data: { status: 'PROCESSING' },
    });
  }

  findById(id: string): Promise<BulkUpload | null> {
    return this.prisma.bulkUpload.findUnique({ where: { id } });
  }

  findByTenant(tenantId: string): Promise<BulkUpload[]> {
    return this.prisma.bulkUpload.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  incrementProgress(id: string, succeeded: boolean): Promise<BulkUpload> {
    return this.prisma.bulkUpload.update({
      where: { id },
      data: succeeded
        ? { processedRows: { increment: 1 } }
        : { failedRows: { increment: 1 } },
    });
  }

  markCompleted(id: string): Promise<BulkUpload> {
    return this.prisma.bulkUpload.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }
}
