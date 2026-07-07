import { Injectable } from '@nestjs/common';
import { Tenant } from '@praesid/shared';
import { TenantsRepository } from './tenants.repository';

@Injectable()
export class TenantsService {
  constructor(private readonly tenantsRepository: TenantsRepository) {}

  listTenants(): Promise<Tenant[]> {
    return this.tenantsRepository.findAll();
  }
}
