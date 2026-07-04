import { useEffect, useState } from 'react';

import { toast } from 'sonner';
import { IncidentDetail, SimilarIncident } from '@praesid/shared';
import {
  classifyIncident,
  fetchSimilarIncidents,
  getIncident,
} from '@/lib/incidents';

export const useIncidentDetail = (id: string) => {
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [similar, setSimilar] = useState<SimilarIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [detail, similarIncidents] = await Promise.all([
          getIncident(id),
          fetchSimilarIncidents(id),
        ]);
        if (!cancelled) {
          setIncident(detail);
          setSimilar(similarIncidents);
        }
      } catch {
        if (!cancelled) toast.error('Failed to load incident.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const reclassify = async () => {
    if (isClassifying) return;
    setIsClassifying(true);
    try {
      setIncident(await classifyIncident(id));
      setSimilar(await fetchSimilarIncidents(id));
      toast.success('Incident re-classified.');
    } catch {
      toast.error('Re-classification failed.');
    } finally {
      setIsClassifying(false);
    }
  };

  return { incident, similar, isLoading, isClassifying, reclassify };
};
