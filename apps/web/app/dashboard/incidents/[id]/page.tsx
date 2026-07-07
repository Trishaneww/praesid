'use client';

// Next.js
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// Shadcn UI
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Hooks
import { useIncidentDetail } from '@/hooks/useIncidentDetail';

// Layout + components
import { AppTopbar } from '@/components/layout/AppTopbar';
import { IncidentCodeCard } from '@/components/incidents/IncidentCodeCard';
import { SimilarIncidentsPanel } from '@/components/incidents/SimilarIncidentsPanel';

// Libs
import { formatIncidentDate } from '@/lib/incidents';

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { incident, similar, isLoading, isClassifying, reclassify, confirmCode } =
    useIncidentDetail(params.id);

  return (
    <>
      <AppTopbar
        title="Incident detail"
        section="Incidents"
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            ← Back
          </Button>
        }
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && !incident && (
        <p className="text-sm text-muted-foreground">Incident not found.</p>
      )}

      {incident && (
        <>
          <Card>
            <CardHeader className="gap-1">
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatIncidentDate(incident.createdAt)}
              </span>
              <CardTitle className="text-base font-normal">
                {incident.narrative}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {incident.codeCount} coded · {incident.needsReviewCount} need
                review
              </span>
              <Button
                variant="outline"
                onClick={reclassify}
                disabled={isClassifying}
              >
                {isClassifying ? 'Re-classifying…' : 'Re-classify'}
              </Button>
            </CardContent>
          </Card>

          {incident.codes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not classified yet — run Re-classify to code this incident.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {incident.codes.map((code) => (
                <IncidentCodeCard
                  key={code.structure}
                  code={code}
                  onConfirm={confirmCode}
                />
              ))}
            </div>
          )}

          <SimilarIncidentsPanel
            similar={similar}
            onSelect={(id) => router.push(`/dashboard/incidents/${id}`)}
          />
          </>
        )}
      </main>
    </>
  );
}
