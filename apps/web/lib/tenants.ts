import { Tenant } from "@praesid/shared";
import { API_BASE_URL } from "@/constants/api";

export const listTenants = async (): Promise<Tenant[]> => {
  const response = await fetch(`${API_BASE_URL}/tenants`);
  if (!response.ok) {
    throw new Error(`Failed to load tenants (${response.status})`);
  }
  return response.json();
};
