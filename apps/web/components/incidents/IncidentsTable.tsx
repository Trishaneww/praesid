import { IncidentSummary } from "@praesid/shared";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatIncidentDate } from "@/lib/incidents";

interface IncidentsTableProps {
  incidents: IncidentSummary[];
  isLoading: boolean;
  onSelect: (id: string) => void;
}

export const IncidentsTable = ({
  incidents,
  isLoading,
  onSelect,
}: IncidentsTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-28">Date</TableHead>
        <TableHead>Narrative</TableHead>
        <TableHead className="w-48">Codes</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {isLoading && (
        <TableRow>
          <TableCell colSpan={3} className="text-muted-foreground">
            Loading…
          </TableCell>
        </TableRow>
      )}
      {!isLoading && incidents.length === 0 && (
        <TableRow>
          <TableCell colSpan={3} className="text-muted-foreground">
            No incidents yet.
          </TableCell>
        </TableRow>
      )}
      {incidents.map((incident) => (
        <TableRow
          key={incident.id}
          onClick={() => onSelect(incident.id)}
          className="cursor-pointer"
        >
          <TableCell className="text-muted-foreground tabular-nums">
            {formatIncidentDate(incident.createdAt)}
          </TableCell>
          <TableCell className="max-w-md truncate">
            {incident.narrative}
          </TableCell>
          <TableCell>
            {incident.codeCount === 0 ? (
              <Badge variant="muted">Unclassified</Badge>
            ) : (
              <span className="flex gap-1.5">
                <Badge variant="success">{incident.codeCount} coded</Badge>
                {incident.needsReviewCount > 0 && (
                  <Badge variant="warning">
                    {incident.needsReviewCount} review
                  </Badge>
                )}
              </span>
            )}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
