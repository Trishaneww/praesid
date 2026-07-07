import { IncidentCodeStatus } from "@praesid/shared";

export const ACTIVE_TENANT_SLUG = "cat-construction";

export const STATUS_LABELS: Record<IncidentCodeStatus, string> = {
  AUTO: "Auto",
  NEEDS_REVIEW: "Needs review",
  HUMAN_CONFIRMED: "Confirmed",
};
