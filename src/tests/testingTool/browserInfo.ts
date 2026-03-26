/**
 * Represents parsed browser information.
 */
interface BrowserInfo {
  name: string;
  version: string;
}

/**
 * Represents the complete legacy browser detection result.
 */
interface LegacyBrowserInfo {
  browser: BrowserInfo;
  platform: string;
}

/**
 * Parses browser name and version from a given User-Agent string.
 *
 * Detection priority order:
 * 1. Firefox
 * 2. Edge (Chromium-based)
 * 3. Chrome
 * 4. Safari
 *
 * If no known browser pattern is matched,
 * returns "Unknown" for both name and version.
 *
 * @param ua - The full User-Agent string.
 * @returns Parsed browser name and version.
 */
function parseBrowserFromUA(ua: string): BrowserInfo {
  let match: RegExpMatchArray | null;

  match = ua.match(/Firefox\/([\d.]+)/);
  if (match) {
    return { name: 'Firefox', version: match[1] };
  }

  match = ua.match(/Edg\/([\d.]+)/);
  if (match) {
    return { name: 'Edge', version: match[1] };
  }

  match = ua.match(/Chrome\/([\d.]+)/);
  if (match) {
    return { name: 'Chrome', version: match[1] };
  }

  match = ua.match(/Version\/([\d.]+).*Safari/);
  if (match) {
    return { name: 'Safari', version: match[1] };
  }

  return { name: 'Unknown', version: 'Unknown' };
}

/**
 * Detects platform/OS information using modern and legacy APIs.
 *
 * Strategy:
 * 1. Prefer `navigator.userAgentData.platform` if available (modern browsers).
 * 2. Fallback to User-Agent string pattern matching.
 *
 * @returns Platform name (e.g., Android, iOS, Windows, macOS, Linux).
 */
function getPlatformInfo(): string {
  const ua: string = navigator.userAgent;

  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Win/.test(ua)) return 'Windows';
  if (/Mac/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';

  return 'Unknown';
}

/**
 * Retrieves legacy browser and platform information.
 *
 * This function relies entirely on:
 * - `navigator.userAgent`
 * - UA string parsing
 *
 * Output structure keeps browser inside an array
 * to allow future extension for multi-engine detection.
 *
 * @returns Legacy browser information object.
 */
export function getBrowserInfoLegacy(): LegacyBrowserInfo {
  const ua: string = navigator.userAgent;

  return {
    browser: parseBrowserFromUA(ua),
    platform: getPlatformInfo()
  };
}
