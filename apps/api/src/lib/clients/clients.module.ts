import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AwsService } from './aws.service';
import { EMBEDDING_CLIENT } from './embedding-client';
import { VoyageEmbeddingService } from './voyage-embedding.service';

@Global()
@Module({
  providers: [
    PrismaService,
    AwsService,
    { provide: EMBEDDING_CLIENT, useClass: VoyageEmbeddingService },
  ],
  exports: [PrismaService, AwsService, EMBEDDING_CLIENT],
})
export class ClientsModule {}
