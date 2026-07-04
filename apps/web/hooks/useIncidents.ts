import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';
import { IncidentSummary, Tenant } from '@praesid/shared';
import { createIncident, listIncidents } from '@/lib/incidents';
import { listTenants } from '@/lib/tenants';
import { ACTIVE_TENANT_SLUG } from '@/constants/incidents';

export const useIncidents = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [narrative, setNarrative] = useState('');
  const [autoClassify, setAutoClassify] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(async (tenantId: string) => {
    try {
      setIncidents(await listIncidents(tenantId));
    } catch {
      toast.error('Failed to load incidents. Is the API running on port 3001?');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const tenants = await listTenants();
        const active =
          tenants.find((option) => option.slug === ACTIVE_TENANT_SLUG) ??
          tenants[0] ??
          null;
        setTenant(active);
        if (active) await refresh(active.id);
      } catch {
        toast.error('Failed to load tenant. Is the API running on port 3001?');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [refresh]);

  const submitIncident = async () => {
    if (!tenant || !narrative.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createIncident({
        tenantId: tenant.id,
        narrative: narrative.trim(),
        autoClassify,
      });
      setNarrative('');
      toast.success(
        autoClassify ? 'Incident created and classified.' : 'Incident created.',
      );
      await refresh(tenant.id);
    } catch {
      toast.error('Failed to create incident.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reload = useCallback(() => {
    if (tenant) void refresh(tenant.id);
  }, [tenant, refresh]);

  return {
    tenant,
    incidents,
    narrative,
    setNarrative,
    autoClassify,
    setAutoClassify,
    isLoading,
    isSubmitting,
    submitIncident,
    reload,
  };
};
