import { Controller, Get } from '@nestjs/common';
import { Tenant } from '@praesid/shared';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  listTenants(): Promise<Tenant[]> {
    return this.tenantsService.listTenants();
  }
}
