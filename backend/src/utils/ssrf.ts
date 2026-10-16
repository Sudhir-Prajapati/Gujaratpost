import dns from 'dns/promises';
import { URL } from 'url';

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxSizeBytes?: number;
  maxRedirects?: number;
  headers?: Record<string, string>;
  etag?: string | null;
  lastModified?: string | null;
  allowLocalInDev?: boolean;
}

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  statusText: string;
  data: string;
  etag: string | null;
  lastModified: string | null;
  contentType: string | null;
  finalUrl: string;
  notModified?: boolean;
}

/**
 * Checks if an IPv4 address is in a reserved/private/loopback range.
 */
function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IPv4 is treated as unsafe
  }

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private)
  if (a === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-local, AWS / Cloud metadata service 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future use)
  if (a >= 240) return true;

  // 255.255.255.255 (Broadcast)
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

/**
 * Checks if an IPv6 address is in a reserved/private/loopback range.
 */
function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // Loopback ::1
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

  // Unspecified ::
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

  // IPv4-mapped IPv6 (::ffff:192.168.1.1 or ::ffff:c0a8:0101)
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.substring(7);
    if (ipv4Part.includes('.')) {
      return isPrivateIpv4(ipv4Part);
    }
  }

  // Unique local addresses fc00::/7 (fc00:: - fdff::)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // Link-local unicast fe80::/10 (fe80:: - febf::)
  if (/^fe[89ab]/.test(normalized)) return true;

  return false;
}

export interface SafeUrlOptions {
  allowLocalInDev?: boolean;
}

/**
 * Validates a target URL against SSRF attacks.
 * Verifies URL syntax, permitted schemes, and ensures the resolved IP is not private/local.
 */
export async function validateSafeUrl(
  rawUrl: string,
  options: SafeUrlOptions = {}
): Promise<{ safe: boolean; error?: string; url?: URL; ip?: string }> {
  try {
    const parsed = new URL(rawUrl);

    // Only allow HTTP and HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, error: `Disallowed protocol scheme: ${parsed.protocol}. Only http: and https: are permitted.` };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Cloud metadata service (169.254.169.254) is ALWAYS blocked in all environments
    if (hostname === '169.254.169.254') {
      return { safe: false, error: 'Access to cloud instance metadata service (169.254.169.254) is blocked by SSRF policy.' };
    }

    // In local development testing, allow localhost and 127.0.0.1 if requested
    if (options.allowLocalInDev && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1')) {
      return { safe: true, url: parsed, ip: '127.0.0.1' };
    }

    // Block common local keywords
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0'
    ) {
      return { safe: false, error: `Access to local network host "${hostname}" is blocked.` };
    }

    // Resolve DNS records to verify actual IP
    let addresses: string[] = [];
    try {
      const lookupResult = await dns.lookup(hostname, { all: true });
      addresses = lookupResult.map((r) => r.address);
    } catch (dnsErr: any) {
      return { safe: false, error: `DNS resolution failed for host "${hostname}": ${dnsErr.message || dnsErr}` };
    }

    if (addresses.length === 0) {
      return { safe: false, error: `No DNS records found for host "${hostname}".` };
    }

    // Verify all resolved IPs
    for (const addr of addresses) {
      if (addr.includes(':')) {
        if (isPrivateIpv6(addr)) {
          return { safe: false, error: `Host "${hostname}" resolved to private IPv6 address (${addr}), blocked by SSRF policy.` };
        }
      } else {
        if (isPrivateIpv4(addr)) {
          return { safe: false, error: `Host "${hostname}" resolved to private IPv4 address (${addr}), blocked by SSRF policy.` };
        }
      }
    }

    return { safe: true, url: parsed, ip: addresses[0] };
  } catch (err: any) {
    return { safe: false, error: `Invalid URL format: ${err.message || err}` };
  }
}

/**
 * Secure HTTP fetcher for external RSS feeds with SSRF defense, redirect re-validation,
 * response size limits, and timeout protection.
 */
export async function safeFetchFeed(targetUrl: string, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? 10000;
  const maxSizeBytes = options.maxSizeBytes ?? 5 * 1024 * 1024; // 5 MB
  const maxRedirects = options.maxRedirects ?? 3;
  const allowLocalInDev = options.allowLocalInDev ?? (process.env.NODE_ENV !== 'production');

  let currentUrl = targetUrl;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    // 1. SSRF validation on target URL
    const check = await validateSafeUrl(currentUrl, { allowLocalInDev });
    if (!check.safe || !check.url) {
      throw new Error(`SSRF Security Error: ${check.error || 'Unsafe target URL'}`);
    }

    // 2. Prepare headers with conditional caching if provided
    const headers: Record<string, string> = {
      'User-Agent': 'GujaratPost-RSS-Bot/1.0 (+https://gujaratpost.in; editorial@gujaratpost.in)',
      Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/plain;q=0.8, */*;q=0.5',
      ...options.headers,
    };

    if (options.etag) {
      headers['If-None-Match'] = options.etag;
    }
    if (options.lastModified) {
      headers['If-Modified-Since'] = options.lastModified;
    }

    // 3. Initiate fetch with abort controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
        redirect: 'manual', // Manual redirect control to validate each hop against SSRF
      });

      clearTimeout(timeoutId);

      // Handle 304 Not Modified
      if (response.status === 304) {
        return {
          ok: true,
          status: 304,
          statusText: 'Not Modified',
          data: '',
          etag: response.headers.get('etag'),
          lastModified: response.headers.get('last-modified'),
          contentType: response.headers.get('content-type'),
          finalUrl: currentUrl,
          notModified: true,
        };
      }

      // Handle Redirects
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error(`Received redirect status ${response.status} without Location header`);
        }
        const resolvedRedirect = new URL(location, currentUrl).toString();
        currentUrl = resolvedRedirect;
        redirectsCount++;
        continue;
      }

      if (!response.ok) {
        throw new Error(`Remote server responded with HTTP ${response.status} (${response.statusText})`);
      }

      // Check Content-Length header if available
      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader) {
        const declaredSize = parseInt(contentLengthHeader, 10);
        if (!isNaN(declaredSize) && declaredSize > maxSizeBytes) {
          throw new Error(`Feed response size (${declaredSize} bytes) exceeds limit of ${maxSizeBytes} bytes`);
        }
      }

      // Read response body safely with size checking
      const text = await response.text();
      if (text.length > maxSizeBytes) {
        throw new Error(`Feed payload exceeds safe size limit (${text.length} bytes > ${maxSizeBytes} bytes)`);
      }

      return {
        ok: true,
        status: response.status,
        statusText: response.statusText,
        data: text,
        etag: response.headers.get('etag'),
        lastModified: response.headers.get('last-modified'),
        contentType: response.headers.get('content-type'),
        finalUrl: currentUrl,
        notModified: false,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Feed request timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }

  throw new Error(`Exceeded maximum redirect limit of ${maxRedirects}`);
}
