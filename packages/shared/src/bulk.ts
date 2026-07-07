export type BulkUploadStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface CreateBulkUploadRequest {
  tenantId: string;
  filename: string;
  contentBase64: string; // the .csv/.xlsx file, base64-encoded
}

export interface BulkUploadSummary {
  id: string;
  tenantId: string;
  filename: string;
  status: BulkUploadStatus;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  createdAt: string;
  completedAt: string | null;
}
