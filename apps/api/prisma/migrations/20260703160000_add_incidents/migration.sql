CREATE TYPE "IncidentCodeStatus" AS ENUM ('AUTO', 'NEEDS_REVIEW', 'HUMAN_CONFIRMED');

CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3),
    "reportedBy" TEXT,
    "externalRef" TEXT,
    "embeddingModel" TEXT,
    "embeddedText" TEXT,
    "embedding" vector(1024),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IncidentCode" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "structure" "OiicsStructure" NOT NULL,
    "code" TEXT NOT NULL,
    "codeVersion" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "retrievalSimilarity" DOUBLE PRECISION,
    "rationale" TEXT NOT NULL,
    "alternativesConsidered" JSONB,
    "modelId" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "status" "IncidentCodeStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

CREATE INDEX "Incident_tenantId_createdAt_idx" ON "Incident"("tenantId", "createdAt");

CREATE UNIQUE INDEX "IncidentCode_incidentId_structure_key" ON "IncidentCode"("incidentId", "structure");

ALTER TABLE "Incident" ADD CONSTRAINT "Incident_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentCode" ADD CONSTRAINT "IncidentCode_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX incident_embedding_hnsw
  ON "Incident" USING hnsw (embedding vector_cosine_ops);
