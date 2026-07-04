import { existsSync, readFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AnthropicService } from '../../lib/clients/anthropic.service';
import { decomposeIncidentNarrative } from '../../lib/incidents/decomposeIncidentNarrative';
import { GoldCase } from './types';

async function diagnose() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const limit = Number(process.argv[2] ?? 8);
  const cases = readFileSync('data/evals/osha-sir.jsonl', 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as GoldCase)
    .slice(0, limit);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const anthropic = app.get(AnthropicService);

  try {
    for (const testCase of cases) {
      const { phrases } = await decomposeIncidentNarrative(
        anthropic.client,
        testCase.narrative,
      );
      console.log(`\n### ${testCase.narrative}`);
      console.log(
        `  PART_OF_BODY phrase: ${JSON.stringify(phrases.PART_OF_BODY)}`,
      );
      console.log(`  all: ${JSON.stringify(phrases)}`);
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
