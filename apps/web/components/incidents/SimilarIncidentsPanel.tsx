import { SimilarIncident } from "@praesid/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatSimilarity } from "@/lib/incidents";

interface SimilarIncidentsPanelProps {
  similar: SimilarIncident[];
  onSelect: (id: string) => void;
}

export const SimilarIncidentsPanel = ({
  similar,
  onSelect,
}: SimilarIncidentsPanelProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Similar incidents</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-2">
      {similar.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No similar incidents for this tenant yet.
        </p>
      ) : (
        similar.map((incident) => (
          <button
            key={incident.id}
            onClick={() => onSelect(incident.id)}
            className="flex items-baseline gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
          >
            <span className="text-muted-foreground tabular-nums">
              {formatSimilarity(incident.similarity)}
            </span>
            <span className="flex-1 truncate">{incident.narrative}</span>
          </button>
        ))
      )}
    </CardContent>
  </Card>
);
