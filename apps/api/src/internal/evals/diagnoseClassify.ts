import { existsSync, readFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { OiicsStructure } from '@praesid/shared';
import { AppModule } from '../../app.module';
import { AnthropicService } from '../../lib/clients/anthropic.service';
import { EMBEDDING_CLIENT } from '../../lib/clients/embedding-client';
import type { EmbeddingClient } from '../../lib/clients/embedding-client';
import { OiicsRepository } from '../../oiics/oiics.repository';
import { decomposeIncidentNarrative } from '../../lib/incidents/decomposeIncidentNarrative';
import { classifyStructureCode } from '../../lib/incidents/classifyStructureCode';
import { loadOiicsRules } from '../../lib/incidents/loadOiicsRules';
import { GoldCase } from './types';

const STRUCTURES: OiicsStructure[] = ['PART_OF_BODY', 'SOURCE'];

async function diagnose() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const limit = Number(process.argv[2] ?? 3);
  const cases = readFileSync('data/evals/osha-sir.jsonl', 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as GoldCase)
    .slice(0, limit);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const anthropic = app.get(AnthropicService);
  const oiics = app.get(OiicsRepository);
  const embeddingClient = app.get<EmbeddingClient>(EMBEDDING_CLIENT);
  const rules = loadOiicsRules();

  try {
    for (const testCase of cases) {
      const { phrases } = await decomposeIncidentNarrative(
        anthropic.client,
        testCase.narrative,
      );
      console.log(`\n### ${testCase.narrative}`);
      for (const structure of STRUCTURES) {
        const phrase = phrases[structure];
        const gold = testCase.expected[structure];
        console.log(
          `\n  [${structure}] gold(2.01)=${gold?.code} "${gold?.title}"  phrase=${JSON.stringify(phrase)}`,
        );
        if (!phrase) continue;
        const [vector] = await embeddingClient.embedText([phrase], 'query');
        const candidates = await oiics.retrieveClassificationCandidates(
          structure,
          vector,
        );
        console.log(
          `    ${candidates.length} candidates: ${candidates
            .slice(0, 12)
            .map((c) => `${c.code}:${c.title}`)
            .join(' | ')}`,
        );
        const { classification } = await classifyStructureCode(
          anthropic.client,
          {
            structure,
            narrative: testCase.narrative,
            candidates,
            rulesText: rules[structure],
          },
        );
        console.log(
          `    → pred=${classification.code ?? 'NULL'} conf=${classification.confidence} :: ${classification.rationale}`,
        );
      }
    }
  } finally {
    await app.close();
  }
}

diagnose()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
