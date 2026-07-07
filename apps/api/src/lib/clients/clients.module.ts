import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AwsService } from './aws.service';
import { AnthropicService } from './anthropic.service';
import { EMBEDDING_CLIENT } from './embedding-client';
import { VoyageEmbeddingService } from './voyage-embedding.service';

@Global()
@Module({
  providers: [
    PrismaService,
    AwsService,
    AnthropicService,
    { provide: EMBEDDING_CLIENT, useClass: VoyageEmbeddingService },
  ],
  exports: [PrismaService, AwsService, AnthropicService, EMBEDDING_CLIENT],
})
export class ClientsModule {}
