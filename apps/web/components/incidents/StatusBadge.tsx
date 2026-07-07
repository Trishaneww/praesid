import { IncidentCodeStatus } from "@praesid/shared";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/constants/incidents";

const STATUS_VARIANT: Record<
  IncidentCodeStatus,
  "success" | "warning" | "default"
> = {
  AUTO: "success",
  NEEDS_REVIEW: "warning",
  HUMAN_CONFIRMED: "default",
};

export const StatusBadge = ({ status }: { status: IncidentCodeStatus }) => (
  <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
);
