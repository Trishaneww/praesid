'use client';

// Next.js
import { useRouter } from 'next/navigation';

// Hooks
import { useIncidents } from '@/hooks/useIncidents';
import { useBulkUpload } from '@/hooks/useBulkUpload';

// Components
import { CreateIncidentForm } from '@/components/incidents/CreateIncidentForm';
import { BulkUploadCard } from '@/components/incidents/BulkUploadCard';
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
    reload,
  } = useIncidents();
  const { file, setFile, upload, isUploading, submit } = useBulkUpload(
    tenant?.id,
    reload,
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">Incidents</h1>
        <p className="text-sm text-muted-foreground">
          {tenant?.name ?? 'Loading tenant…'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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

      <IncidentsTable
        incidents={incidents}
        isLoading={isLoading}
        onSelect={(id) => router.push(`/dashboard/incidents/${id}`)}
      />
    </main>
  );
}
