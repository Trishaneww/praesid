import { OiicsSearchRequest, OiicsSearchResponse } from "@praesid/shared";
import { API_BASE_URL } from "@/constants/api";

export const searchOiicsCodes = async (
  narrative: string,
): Promise<OiicsSearchResponse> => {
  const request: OiicsSearchRequest = { narrative };
  const response = await fetch(`${API_BASE_URL}/oiics/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Search failed with status ${response.status}`);
  }
  return response.json();
};

export const formatSimilarity = (similarity: number): string =>
  `${(similarity * 100).toFixed(1)}%`;
