import { BulkUploadSummary } from "@praesid/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BulkUploadCardProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  upload: BulkUploadSummary | null;
  isUploading: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
}

export const BulkUploadCard = ({
  file,
  onFileChange,
  upload,
  isUploading,
  canSubmit,
  onSubmit,
}: BulkUploadCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Bulk upload</CardTitle>
      <CardDescription>
        Upload a CSV or XLSX with a narrative column. Each row is classified in
        the background.
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          className="flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-2 file:py-1 file:text-foreground"
        />
        <Button onClick={onSubmit} disabled={!canSubmit}>
          {isUploading ? "Uploading…" : "Upload & classify"}
        </Button>
      </div>
      {file && !upload && (
        <span className="text-sm text-muted-foreground">{file.name}</span>
      )}
      {upload && (
        <div className="text-sm text-muted-foreground tabular-nums">
          {upload.filename}:{" "}
          {upload.status === "COMPLETED" ? "done" : upload.status.toLowerCase()}{" "}
          — {upload.processedRows + upload.failedRows}/{upload.totalRows}{" "}
          classified
          {upload.failedRows > 0 ? ` (${upload.failedRows} failed)` : ""}
        </div>
      )}
    </CardContent>
  </Card>
);
