'use client';

// Shadcn UI
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Hooks
import { useOiicsSearch } from '@/hooks/useOiicsSearch';

// Libs
import { OIICS_STRUCTURE_LABELS } from '@/constants/oiics';
import { formatSimilarity } from '@/lib/oiics';
import { OIICS_STRUCTURES } from '@praesid/shared';

export default function HomePage() {
  const { narrative, setNarrative, results, isSearching, searchCodes } =
    useOiicsSearch();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-8">
      <Card>
        <CardHeader>
          <CardTitle>Praesid</CardTitle>
          <CardDescription>
            Test the OIICS vector search — describe an incident and see the top
            candidate codes per structure.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            value={narrative}
            onChange={(event) => setNarrative(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && searchCodes()}
            placeholder='e.g. "Employee broke their hand falling off a crane"'
          />
          <Button
            onClick={searchCodes}
            disabled={isSearching || !narrative.trim()}
          >
            {isSearching ? 'Searching…' : 'Search'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className="grid gap-4 sm:grid-cols-2">
          {OIICS_STRUCTURES.map((structure) => (
            <Card key={structure}>
              <CardHeader>
                <CardTitle className="text-base">
                  {OIICS_STRUCTURE_LABELS[structure]}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {results.candidatesByStructure[structure].map((candidate) => (
                  <div
                    key={candidate.code}
                    className="flex items-baseline gap-3 text-sm"
                  >
                    <span className="font-mono font-medium">
                      {candidate.code}
                    </span>
                    <span className="flex-1">{candidate.title}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatSimilarity(candidate.similarity)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
