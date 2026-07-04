CREATE TYPE "BulkUploadStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

ALTER TABLE "Incident" ADD COLUMN     "bulkUploadId" TEXT;

CREATE TABLE "BulkUpload" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" "BulkUploadStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BulkUpload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BulkUpload_tenantId_createdAt_idx" ON "BulkUpload"("tenantId", "createdAt");

CREATE INDEX "Incident_bulkUploadId_idx" ON "Incident"("bulkUploadId");

ALTER TABLE "BulkUpload" ADD CONSTRAINT "BulkUpload_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Incident" ADD CONSTRAINT "Incident_bulkUploadId_fkey" FOREIGN KEY ("bulkUploadId") REFERENCES "BulkUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
