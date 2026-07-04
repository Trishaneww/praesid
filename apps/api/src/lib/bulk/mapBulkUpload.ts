import { BulkUploadSummary } from '@praesid/shared';
import { BulkUpload } from '../../generated/prisma/client';

export const formatBulkUpload = (upload: BulkUpload): BulkUploadSummary => ({
  id: upload.id,
  tenantId: upload.tenantId,
  filename: upload.filename,
  status: upload.status,
  totalRows: upload.totalRows,
  processedRows: upload.processedRows,
  failedRows: upload.failedRows,
  createdAt: upload.createdAt.toISOString(),
  completedAt: upload.completedAt?.toISOString() ?? null,
});
