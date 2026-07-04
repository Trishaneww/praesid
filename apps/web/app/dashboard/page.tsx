'use client';

// Next.js
import { useRouter } from 'next/navigation';

// Hooks
import { useIncidents } from '@/hooks/useIncidents';

// Components
import { CreateIncidentForm } from '@/components/incidents/CreateIncidentForm';
import { IncidentsTable } from '@/components/incidents/IncidentsTable';

export default function DashboardPage() {
  const router = useRouter();
  const {
    tenant,
    incidents,
    narrative,
    setNarrative,
    autoClassify,
    setAutoClassify,
    isLoading,
    isSubmitting,
    submitIncident,
  } = useIncidents();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">Incidents</h1>
        <p className="text-sm text-muted-foreground">
          {tenant?.name ?? 'Loading tenant…'}
        </p>
      </div>

      <CreateIncidentForm
        narrative={narrative}
        onNarrativeChange={setNarrative}
        autoClassify={autoClassify}
        onAutoClassifyChange={setAutoClassify}
        isSubmitting={isSubmitting}
        canSubmit={!!tenant && !!narrative.trim() && !isSubmitting}
        onSubmit={submitIncident}
      />

      <IncidentsTable
        incidents={incidents}
        isLoading={isLoading}
        onSelect={(id) => router.push(`/dashboard/incidents/${id}`)}
      />
    </main>
  );
}
