import { useEffect, useState } from 'react';

import { Tenant } from '@praesid/shared';
import { listTenants } from '@/lib/tenants';
import { ACTIVE_TENANT_SLUG } from '@/constants/incidents';

export const useWorkspace = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const options = await listTenants();
        setTenants(options);
        setTenant(
          options.find((option) => option.slug === ACTIVE_TENANT_SLUG) ??
            options[0] ??
            null,
        );
      } catch {
        // Sidebar chrome renders regardless; the page surfaces load errors.
      }
    };
    load();
  }, []);

  return { tenant, tenants };
};
