import { Injectable } from '@nestjs/common';
import { Tenant } from '@praesid/shared';
import { PrismaService } from '../lib/clients/prisma.service';

@Injectable()
export class TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }
}
