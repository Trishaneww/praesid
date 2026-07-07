CREATE SCHEMA IF NOT EXISTS "public";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE TYPE "OiicsStructure" AS ENUM ('NATURE', 'PART_OF_BODY', 'EVENT', 'SOURCE', 'WORKER_ACTIVITY', 'LOCATION');
CREATE TABLE "OiicsCode" (
    "id" TEXT NOT NULL,
    "structure" "OiicsStructure" NOT NULL,
    "code" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "definition" TEXT,
    "includes" TEXT,
    "excludes" TEXT,
    "codingInteractions" TEXT,
    "notes" TEXT,
    "hierarchyRaw" TEXT NOT NULL,
    "hierarchyLevel" INTEGER NOT NULL,
    "isSummary" BOOLEAN NOT NULL DEFAULT false,
    "parentCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "embeddingModel" TEXT,
    "embeddedText" TEXT,
    "embedding" vector(1024),

    CONSTRAINT "OiicsCode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OiicsCode_structure_version_isActive_idx" ON "OiicsCode"("structure", "version", "isActive");
CREATE UNIQUE INDEX "OiicsCode_structure_code_version_key" ON "OiicsCode"("structure", "code", "version");
CREATE INDEX oiics_embedding_hnsw
  ON "OiicsCode" USING hnsw (embedding vector_cosine_ops);

