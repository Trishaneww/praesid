import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface CreateIncidentFormProps {
  narrative: string;
  onNarrativeChange: (value: string) => void;
  autoClassify: boolean;
  onAutoClassifyChange: (value: boolean) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
}

export const CreateIncidentForm = ({
  narrative,
  onNarrativeChange,
  autoClassify,
  onAutoClassifyChange,
  isSubmitting,
  canSubmit,
  onSubmit,
}: CreateIncidentFormProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Log an incident</CardTitle>
      <CardDescription>
        Paste a raw incident description. Praesid codes it against OIICS.
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-3">
      <Textarea
        value={narrative}
        onChange={(event) => onNarrativeChange(event.target.value)}
        placeholder='e.g. "Worker fell from scaffold and fractured their wrist while installing drywall."'
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={autoClassify}
            onChange={(event) => onAutoClassifyChange(event.target.checked)}
            className="size-4 rounded border-border accent-primary"
          />
          Classify on create
        </label>
        <Button onClick={onSubmit} disabled={!canSubmit}>
          {isSubmitting ? "Saving…" : "Create incident"}
        </Button>
      </div>
    </CardContent>
  </Card>
);
