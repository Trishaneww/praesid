import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { OIICS_STRUCTURES } from '@praesid/shared';
import { AppModule } from '../../app.module';
import { OiicsService } from '../../oiics/oiics.service';

const DEFAULT_NARRATIVE = 'worker fell from scaffold and broke their wrist';

async function runOiicsRetrievalCheck() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const narrative = process.argv[2] ?? DEFAULT_NARRATIVE;
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    console.log(`Narrative: "${narrative}"\n`);
    const { candidatesByStructure } = await app
      .get(OiicsService)
      .searchCandidateCodes(narrative);

    for (const structure of OIICS_STRUCTURES) {
      console.log(`Top ${structure} candidates:`);
      for (const candidate of candidatesByStructure[structure]) {
        console.log(
          `  ${candidate.code.padEnd(6)} ${candidate.similarity.toFixed(4)}  ${candidate.title}`,
        );
      }
      console.log('');
    }
  } finally {
    await app.close();
  }
}

runOiicsRetrievalCheck()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
