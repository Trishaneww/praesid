import { IncidentCodeSummary, OiicsStructure } from "@praesid/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/incidents/StatusBadge";
import { OIICS_STRUCTURE_LABELS } from "@/constants/oiics";
import { formatConfidence, formatSimilarity } from "@/lib/incidents";

interface IncidentCodeCardProps {
  code: IncidentCodeSummary;
  onConfirm: (structure: OiicsStructure) => void;
}

export const IncidentCodeCard = ({ code, onConfirm }: IncidentCodeCardProps) => (
  <Card>
    <CardHeader className="gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase">
          {OIICS_STRUCTURE_LABELS[code.structure]}
        </span>
        <StatusBadge status={code.status} />
      </div>
      <CardTitle className="flex items-baseline gap-2 text-base">
        <span className="font-mono">{code.code}</span>
        <span className="font-normal">{code.title ?? "—"}</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-2 text-sm">
      <p className="text-muted-foreground">{code.rationale}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-xs text-muted-foreground tabular-nums">
          <span>Confidence {formatConfidence(code.confidence)}</span>
          {code.retrievalSimilarity !== null && (
            <span>Similarity {formatSimilarity(code.retrievalSimilarity)}</span>
          )}
        </div>
        {code.status !== "HUMAN_CONFIRMED" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onConfirm(code.structure)}
          >
            Confirm
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);
