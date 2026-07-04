import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../lib/clients/prisma.service';
import { MOCK_TENANT } from '../../constants/tenants';

async function runTenantSeed() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);

  try {
    const tenant = await prisma.tenant.upsert({
      where: { slug: MOCK_TENANT.slug },
      create: { name: MOCK_TENANT.name, slug: MOCK_TENANT.slug },
      update: { name: MOCK_TENANT.name },
    });
    console.log(
      `Seeded tenant "${tenant.name}" (slug=${tenant.slug}) id=${tenant.id}`,
    );
  } finally {
    await app.close();
  }
}

runTenantSeed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
