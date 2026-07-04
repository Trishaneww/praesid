import { BulkUploadSummary, CreateBulkUploadRequest } from '@praesid/shared';
import { API_BASE_URL } from '@/constants/api';

const readJson = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; // data:<mime>;base64,<data>
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const createBulkUpload = async (
  tenantId: string,
  file: File,
): Promise<BulkUploadSummary> => {
  const request: CreateBulkUploadRequest = {
    tenantId,
    filename: file.name,
    contentBase64: await fileToBase64(file),
  };
  return fetch(`${API_BASE_URL}/bulk-uploads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  }).then(readJson);
};

export const getBulkUpload = (id: string): Promise<BulkUploadSummary> =>
  fetch(`${API_BASE_URL}/bulk-uploads/${id}`).then(readJson);
