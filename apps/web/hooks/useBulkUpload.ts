import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { toast } from 'sonner';
import { BulkUploadSummary } from '@praesid/shared';
import { createBulkUpload, getBulkUpload } from '@/lib/bulk';

const POLL_INTERVAL_MS = 3000;

export const useBulkUpload = (
  tenantId: string | undefined,
  onComplete: () => void,
) => {
  const [file, setFile] = useState<File | null>(null);
  const [upload, setUpload] = useState<BulkUploadSummary | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useLayoutEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const submit = async () => {
    if (!tenantId || !file || isUploading) return;
    setIsUploading(true);
    try {
      const created = await createBulkUpload(tenantId, file);
      setUpload(created);
      setFile(null);
      toast.success(`Uploaded ${created.totalRows} incidents — classifying…`);
    } catch {
      toast.error('Upload failed. Check the file has a narrative column.');
    } finally {
      setIsUploading(false);
    }
  };

  // Poll the job while it's processing.
  useEffect(() => {
    if (
      !upload ||
      upload.status === 'COMPLETED' ||
      upload.status === 'FAILED'
    ) {
      return;
    }
    const timer = setInterval(async () => {
      try {
        const next = await getBulkUpload(upload.id);
        setUpload(next);
        if (next.status === 'COMPLETED' || next.status === 'FAILED') {
          clearInterval(timer);
          onCompleteRef.current();
          toast.success('Bulk classification complete.');
        }
      } catch {
        // transient; keep polling
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [upload?.id, upload?.status]);

  return { file, setFile, upload, isUploading, submit };
};
