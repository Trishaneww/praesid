'use client';

// React + Next.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// External
import { Search } from 'lucide-react';

// Shadcn UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Hooks
import { useIncidents } from '@/hooks/useIncidents';
import { useBulkUpload } from '@/hooks/useBulkUpload';

// Layout + components
import { AppTopbar } from '@/components/layout/AppTopbar';
import { StatTiles } from '@/components/dashboard/StatTiles';
import { CreateIncidentForm } from '@/components/incidents/CreateIncidentForm';
import { BulkUploadCard } from '@/components/incidents/BulkUploadCard';
import { IncidentsTable } from '@/components/incidents/IncidentsTable';

// Logic
import { buildDashboardStats } from '@/lib/dashboard';
import { filterIncidents } from '@/lib/incidents';

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
    reload,
  } = useIncidents();
  const { file, setFile, upload, isUploading, submit } = useBulkUpload(
    tenant?.id,
    reload,
  );
  const [query, setQuery] = useState('');

  const stats = buildDashboardStats(incidents);
  const visibleIncidents = filterIncidents(incidents, query);

  return (
    <>
      <AppTopbar
        title="Incidents"
        section="Safety"
        actions={
          <Button nativeButton={false} render={<a href="#log-incident" />}>
            New incident
          </Button>
        }
      />

      <div className="flex w-full flex-1 flex-col gap-6 px-6 py-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incidents</h1>
          <p className="text-sm text-muted-foreground">
            {tenant?.name ?? 'Loading tenant…'} · codified against OIICS
          </p>
        </div>

        <StatTiles stats={stats} />

        <div id="log-incident" className="grid gap-4 md:grid-cols-2">
          <CreateIncidentForm
            narrative={narrative}
            onNarrativeChange={setNarrative}
            autoClassify={autoClassify}
            onAutoClassifyChange={setAutoClassify}
            isSubmitting={isSubmitting}
            canSubmit={!!tenant && !!narrative.trim() && !isSubmitting}
            onSubmit={submitIncident}
          />
          <BulkUploadCard
            file={file}
            onFileChange={setFile}
            upload={upload}
            isUploading={isUploading}
            canSubmit={!!tenant && !!file && !isUploading}
            onSubmit={submit}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-medium">Recent incidents</h2>
              <p className="text-sm text-muted-foreground">
                {visibleIncidents.length} of {incidents.length} shown
              </p>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search narratives…"
                className="pl-8"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <IncidentsTable
              incidents={visibleIncidents}
              isLoading={isLoading}
              onSelect={(id) => router.push(`/dashboard/incidents/${id}`)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
