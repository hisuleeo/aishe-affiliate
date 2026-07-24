import { apiClient } from "@/lib/api-client";

export type HighwayCertificate = {
  id?: string;
  holderName?: string;
  issuedAt?: string;
  level?: string;
};

export async function getHighwayCertificate(): Promise<HighwayCertificate | null> {
  try {
    const response = await apiClient.get<HighwayCertificate | null>("/highway-quiz/certificate");
    return response.data ?? null;
  } catch {
    return null;
  }
}
