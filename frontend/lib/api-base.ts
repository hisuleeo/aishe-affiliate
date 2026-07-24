import { isUkSiteHostname } from "@/lib/is-uk-site";

const DEFAULT_PRO_API = "https://api.aishe.pro";
const DEFAULT_UK_API = "https://api.aishe.uk";

export function resolveApiBaseUrlForHostname(hostname: string): string {
  if (isUkSiteHostname(hostname)) {
    return process.env.NEXT_PUBLIC_API_URL_UK || DEFAULT_UK_API;
  }
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_PRO_API;
}
