import { existsSync, readFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { OIICS_STRUCTURES, OiicsStructure } from '@praesid/shared';
import { AppModule } from '../../app.module';
import { AnthropicService } from '../../lib/clients/anthropic.service';
import { OiicsService } from '../../oiics/oiics.service';
import {
  ClassificationService,
  StructurePrediction,
} from '../../incidents/classification.service';
import {
  addUsage,
  EMPTY_USAGE,
  estimateCostUsd,
  TokenUsage,
} from '../../lib/incidents/tokenUsage';
import { GoldCase, GoldExpectation } from './types';
import { judgeConceptMatch } from './judgeConceptMatch';
import { normalizeTitle } from './normalizeTitle';

const OSHA_PATH = 'data/evals/osha-sir.jsonl';
const HANDWRITTEN_PATH = 'data/evals/handwritten.jsonl';

interface ScoredRow {
  source: 'osha' | 'handwritten';
  structure: OiicsStructure;
  gold: GoldExpectation;
  pred: StructurePrediction | null;
  primary: boolean; // concept-match (osha) or exact code (handwritten)
  secondary: boolean; // exact-title (osha) or parent-level (handwritten)
}

const loadCases = (path: string): GoldCase[] =>
  existsSync(path)
    ? readFileSync(path, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as GoldCase)
    : [];

const pct = (numerator: number, denominator: number): string =>
  denominator === 0 ? '—' : `${((numerator / denominator) * 100).toFixed(1)}%`;

function reportSection(
  title: string,
  rows: ScoredRow[],
  primaryLabel: string,
  secondaryLabel: string,
) {
  console.log(`\n=== ${title} ===`);
  console.log(
    `${'structure'.padEnd(16)} ${'n'.padStart(4)} ${'predicted'.padStart(9)} ${primaryLabel.padStart(16)} ${secondaryLabel.padStart(16)}`,
  );
  for (const structure of OIICS_STRUCTURES) {
    const forStructure = rows.filter((row) => row.structure === structure);
    if (forStructure.length === 0) continue;
    const predicted = forStructure.filter((row) => row.pred).length;
    const primary = forStructure.filter((row) => row.primary).length;
    const secondary = forStructure.filter((row) => row.secondary).length;
    console.log(
      `${structure.padEnd(16)} ${String(forStructure.length).padStart(4)} ${String(predicted).padStart(9)} ${`${primary} ${pct(primary, forStructure.length)}`.padStart(16)} ${`${secondary} ${pct(secondary, forStructure.length)}`.padStart(16)}`,
    );
  }
  const predicted = rows.filter((row) => row.pred).length;
  const primary = rows.filter((row) => row.primary).length;
  const secondary = rows.filter((row) => row.secondary).length;
  console.log(
    `${'ALL'.padEnd(16)} ${String(rows.length).padStart(4)} ${String(predicted).padStart(9)} ${`${primary} ${pct(primary, rows.length)}`.padStart(16)} ${`${secondary} ${pct(secondary, rows.length)}`.padStart(16)}`,
  );
}

async function runEval() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const limit = process.argv[2] ? Number(process.argv[2]) : Infinity;

  const cases = [...loadCases(OSHA_PATH), ...loadCases(HANDWRITTEN_PATH)].slice(
    0,
    limit,
  );
  if (cases.length === 0) {
    throw new Error(
      `No gold cases found. Build one first (pnpm evals:build-osha) or add ${HANDWRITTEN_PATH}.`,
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const classifier = app.get(ClassificationService);
  const oiics = app.get(OiicsService);
  const anthropic = app.get(AnthropicService);

  try {
    const rows: ScoredRow[] = [];
    let totalUsage: TokenUsage = EMPTY_USAGE;

    // Stage 1 — run the pipeline over every case.
    for (const [index, testCase] of cases.entries()) {
      const { predictions, usage } = await classifier.classifyNarrative(
        testCase.narrative,
      );
      totalUsage = addUsage(totalUsage, usage);
      const byStructure = new Map(
        predictions.map((prediction) => [prediction.structure, prediction]),
      );
      for (const structure of Object.keys(
        testCase.expected,
      ) as OiicsStructure[]) {
        rows.push({
          source: testCase.source,
          structure,
          gold: testCase.expected[structure] as GoldExpectation,
          pred: byStructure.get(structure) ?? null,
          primary: false,
          secondary: false,
        });
      }
      console.log(
        `  [${index + 1}/${cases.length}] ${testCase.source} ${testCase.id} → ${predictions.length} codes`,
      );
    }

    // Stage 2a — score OSHA rows by concept match (LLM judge) + reference exact-title.
    const oshaRows = rows.filter((row) => row.source === 'osha');
    for (const row of oshaRows) {
      if (!row.pred) continue;
      row.secondary =
        normalizeTitle(row.pred.title) === normalizeTitle(row.gold.title ?? '');
      row.primary = (
        await judgeConceptMatch(anthropic.client, {
          structure: row.structure,
          predictedTitle: row.pred.title,
          goldTitle: row.gold.title ?? '',
        })
      ).match;
    }

    // Stage 2b — score handwritten rows by exact 3.02 code + parent-level near-miss.
    const hwRows = rows.filter((row) => row.source === 'handwritten');
    const parentRefs = hwRows.flatMap((row) => [
      { structure: row.structure, code: row.gold.code },
      ...(row.pred ? [{ structure: row.structure, code: row.pred.code }] : []),
    ]);
    const parents = await oiics.getCodeParents(parentRefs);
    for (const row of hwRows) {
      if (!row.pred) continue;
      const exact = row.pred.code === row.gold.code;
      const predParent = parents[`${row.structure}|${row.pred.code}`];
      const goldParent = parents[`${row.structure}|${row.gold.code}`];
      row.primary = exact;
      row.secondary =
        exact ||
        (!!predParent && predParent === goldParent) ||
        predParent === row.gold.code ||
        goldParent === row.pred.code;
    }

    if (oshaRows.length > 0) {
      reportSection(
        'OSHA concept-match (2.01 gold)',
        oshaRows,
        'conceptMatch',
        'exactTitle',
      );
    }
    if (hwRows.length > 0) {
      reportSection(
        'Hand-written exact-match (3.02 gold)',
        hwRows,
        'exactCode',
        'parentOrExact',
      );
    }

    console.log(
      `\nCost: $${estimateCostUsd(totalUsage).toFixed(4)} over ${cases.length} cases ` +
        `(~$${(estimateCostUsd(totalUsage) / cases.length).toFixed(5)}/case)`,
    );
    console.log(
      `Tokens: in ${totalUsage.input}, out ${totalUsage.output}, cacheRead ${totalUsage.cacheRead}, cacheWrite ${totalUsage.cacheWrite}`,
    );
  } finally {
    await app.close();
  }
}

runEval()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
