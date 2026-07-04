import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../lib/clients/prisma.service';
import {
  EMBEDDING_CLIENT,
  EmbeddingClient,
} from '../../lib/clients/embedding-client';
import { EMBEDDING_MODEL_ID } from '../../constants/embeddings';
import { CURRENT_OIICS_VERSION, OIICS_RULES_DIR } from '../../constants/oiics';
import { OIICS_WORKBOOK_PATH } from './constants';
import { chunkItems } from '../../lib/collections';
import { loadOiicsWorkbook } from './loadOiicsWorkbook';
import { parseOiicsCodeSheets, ParsedOiicsCode } from './parseOiicsCodeSheets';
import { composeOiicsEmbeddingText } from './composeOiicsEmbeddingText';
import { saveOiicsRulesSheets } from './saveOiicsRulesSheets';

const UPSERT_CHUNK_SIZE = 25;
const EMBED_CHUNK_SIZE = 64;

interface EmbeddableOiicsCode extends ParsedOiicsCode {
  embeddingText: string;
}

async function runOiicsIngestion() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);
  const embeddingClient = app.get<EmbeddingClient>(EMBEDDING_CLIENT);

  try {
    const workbook = await loadOiicsWorkbook(OIICS_WORKBOOK_PATH);
    console.log(
      `Workbook sheets: ${workbook.worksheets.map((sheet) => `"${sheet.name}"`).join(', ')}`,
    );

    const savedRuleFiles = saveOiicsRulesSheets(workbook, OIICS_RULES_DIR);
    console.log(
      `Saved ${savedRuleFiles.length} rules sheets under ${OIICS_RULES_DIR}/`,
    );

    const parsedCodes = parseOiicsCodeSheets(workbook);
    const embeddableCodes: EmbeddableOiicsCode[] = parsedCodes.map((code) => ({
      ...code,
      embeddingText: composeOiicsEmbeddingText(code),
    }));
    console.log(
      `Parsed ${embeddableCodes.length} codes from ${OIICS_WORKBOOK_PATH}`,
    );

    await upsertCodes(prisma, embeddableCodes);
    const codesNeedingEmbedding = await selectCodesNeedingEmbedding(
      prisma,
      embeddableCodes,
    );
    console.log(
      `${codesNeedingEmbedding.length} of ${embeddableCodes.length} codes need (re-)embedding`,
    );
    await embedAndStoreVectors(prisma, embeddingClient, codesNeedingEmbedding);

    await printImportedCounts(prisma);
  } finally {
    await app.close();
  }
}

const upsertCodes = async (
  prisma: PrismaService,
  codes: EmbeddableOiicsCode[],
) => {
  let upsertedCount = 0;
  for (const chunk of chunkItems(codes, UPSERT_CHUNK_SIZE)) {
    await Promise.all(
      chunk.map((code) =>
        prisma.oiicsCode.upsert({
          where: {
            structure_code_version: {
              structure: code.structure,
              code: code.code,
              version: CURRENT_OIICS_VERSION,
            },
          },
          create: {
            structure: code.structure,
            code: code.code,
            version: CURRENT_OIICS_VERSION,
            title: code.title,
            definition: code.definition,
            includes: code.includes,
            excludes: code.excludes,
            codingInteractions: code.codingInteractions,
            notes: code.notes,
            hierarchyRaw: code.hierarchyRaw,
            hierarchyLevel: code.hierarchyLevel,
            isSummary: code.isSummary,
            parentCode: code.parentCode,
          },
          update: {
            title: code.title,
            definition: code.definition,
            includes: code.includes,
            excludes: code.excludes,
            codingInteractions: code.codingInteractions,
            notes: code.notes,
            hierarchyRaw: code.hierarchyRaw,
            hierarchyLevel: code.hierarchyLevel,
            isSummary: code.isSummary,
            parentCode: code.parentCode,
          },
        }),
      ),
    );
    upsertedCount += chunk.length;
    if (upsertedCount % 500 < UPSERT_CHUNK_SIZE) {
      console.log(`  upserted ${upsertedCount}/${codes.length}`);
    }
  }
};

// A code needs embedding when its vector is missing, its composed text changed,
// or it was embedded with a different model.
const selectCodesNeedingEmbedding = async (
  prisma: PrismaService,
  codes: EmbeddableOiicsCode[],
): Promise<EmbeddableOiicsCode[]> => {
  const existingRows = await prisma.$queryRaw<
    {
      structure: string;
      code: string;
      embeddedText: string | null;
      embeddingModel: string | null;
      hasEmbedding: boolean;
    }[]
  >`
    SELECT structure::text, code, "embeddedText", "embeddingModel", (embedding IS NOT NULL) AS "hasEmbedding"
    FROM "OiicsCode"
    WHERE version = ${CURRENT_OIICS_VERSION}
  `;
  const existingByKey = new Map(
    existingRows.map((row) => [`${row.structure}|${row.code}`, row]),
  );

  return codes.filter((code) => {
    const existing = existingByKey.get(`${code.structure}|${code.code}`);
    if (!existing || !existing.hasEmbedding) return true;
    return (
      existing.embeddedText !== code.embeddingText ||
      existing.embeddingModel !== EMBEDDING_MODEL_ID
    );
  });
};

const embedAndStoreVectors = async (
  prisma: PrismaService,
  embeddingClient: EmbeddingClient,
  codes: EmbeddableOiicsCode[],
) => {
  let embeddedCount = 0;
  for (const chunk of chunkItems(codes, EMBED_CHUNK_SIZE)) {
    const vectors = await embeddingClient.embedText(
      chunk.map((code) => code.embeddingText),
      'document',
    );
    await Promise.all(
      chunk.map((code, index) => {
        const vectorLiteral = `[${vectors[index].join(',')}]`;
        return prisma.$executeRaw`
          UPDATE "OiicsCode"
          SET embedding = ${vectorLiteral}::vector,
              "embeddedText" = ${code.embeddingText},
              "embeddingModel" = ${EMBEDDING_MODEL_ID}
          WHERE structure = ${code.structure}::"OiicsStructure"
            AND code = ${code.code}
            AND version = ${CURRENT_OIICS_VERSION}
        `;
      }),
    );
    embeddedCount += chunk.length;
    console.log(`  embedded ${embeddedCount}/${codes.length}`);
  }
};

const printImportedCounts = async (prisma: PrismaService) => {
  const counts = await prisma.oiicsCode.groupBy({
    by: ['structure'],
    where: { version: CURRENT_OIICS_VERSION },
    _count: { _all: true },
    orderBy: { structure: 'asc' },
  });
  console.log(`\nImported codes for OIICS ${CURRENT_OIICS_VERSION}:`);
  for (const { structure, _count } of counts) {
    console.log(`  ${structure.padEnd(16)} ${_count._all}`);
  }
};

runOiicsIngestion()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
