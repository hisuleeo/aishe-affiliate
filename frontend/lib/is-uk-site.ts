export function normalizeHostname(input?: string | null): string {
  if (!input) return "";
  return input.toLowerCase().split(":")[0].trim();
}

export function isUkSiteHostname(input?: string | null): boolean {
  const host = normalizeHostname(input);
  return host === "aishe.uk" || host.endsWith(".aishe.uk");
}

export function isMyAisheHostname(input?: string | null): boolean {
  const host = normalizeHostname(input);
  return host === "my.aishe.uk";
}

export function isProSiteHostname(input?: string | null): boolean {
  const host = normalizeHostname(input);
  return host === "app.aishe.pro" || host.endsWith(".aishe.pro");
}
