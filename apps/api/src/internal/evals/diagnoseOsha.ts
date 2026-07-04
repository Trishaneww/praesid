import { existsSync, readFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { OiicsStructure } from '@praesid/shared';
import { AppModule } from '../../app.module';
import { ClassificationService } from '../../incidents/classification.service';
import { GoldCase } from './types';

// Prints gold vs predicted titles side by side so we can eyeball whether a low
// concept-match score is a classifier problem or a scoring problem.
async function diagnose() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const limit = Number(process.argv[2] ?? 5);
  const cases = readFileSync('data/evals/osha-sir.jsonl', 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as GoldCase)
    .slice(0, limit);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const classifier = app.get(ClassificationService);

  try {
    for (const testCase of cases) {
      const { predictions } = await classifier.classifyNarrative(
        testCase.narrative,
      );
      const byStructure = new Map(predictions.map((p) => [p.structure, p]));
      console.log(`\n### ${testCase.id}: ${testCase.narrative}`);
      for (const structure of Object.keys(
        testCase.expected,
      ) as OiicsStructure[]) {
        const gold = testCase.expected[structure];
        const pred = byStructure.get(structure);
        console.log(
          `  ${structure.padEnd(14)} gold: ${gold?.code} "${gold?.title}"`,
        );
        console.log(
          `  ${''.padEnd(14)} pred: ${pred ? `${pred.code} "${pred.title}"` : '(none)'}`,
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
