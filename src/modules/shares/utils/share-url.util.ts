/**
 * Build share URL with share code
 * @param baseUrl - Base URL of the application
 * @param shareCode - Unique share code
 * @returns Complete share URL
 */
export function buildShareUrl(baseUrl: string, shareCode: string): string {
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/share/${shareCode}`;
}
