export type CookieConsentCategory = 'essential' | 'functional' | 'analytics' | 'marketing';

export interface CookieConsentPreferences {
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentRecord {
  version: string;
  timestamp: string;
  preferences: CookieConsentPreferences;
}

export const COOKIE_CONSENT_KEY = 'gp_cookie_consent';
export const CURRENT_CONSENT_VERSION = '1.0.0';
export const CONSENT_EXPIRATION_DAYS = 365;

export const DEFAULT_PREFERENCES: CookieConsentPreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export const ALL_ALLOWED_PREFERENCES: CookieConsentPreferences = {
  essential: true,
  functional: true,
  analytics: true,
  marketing: true,
};

/**
 * Validates a parsed record to ensure all required fields and categories are valid.
 */
export function isValidConsentRecord(record: any): record is CookieConsentRecord {
  if (!record || typeof record !== 'object') return false;
  if (typeof record.version !== 'string' || typeof record.timestamp !== 'string') return false;
  if (!record.preferences || typeof record.preferences !== 'object') return false;

  const { essential, functional, analytics, marketing } = record.preferences;
  if (essential !== true) return false;
  if (typeof functional !== 'boolean' || typeof analytics !== 'boolean' || typeof marketing !== 'boolean') {
    return false;
  }

  // Check expiration (365 days)
  const recordTime = new Date(record.timestamp).getTime();
  if (isNaN(recordTime)) return false;
  const now = Date.now();
  const maxAgeMs = CONSENT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
  if (now - recordTime > maxAgeMs) {
    return false; // Expired
  }

  return true;
}

/**
 * Reads consent record from document.cookie or localStorage safely in client environments.
 */
export function getStoredConsent(): CookieConsentRecord | null {
  if (typeof window === 'undefined') return null;

  // 1. Try reading cookie
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_CONSENT_KEY}=([^;]*)`));
    if (match && match[1]) {
      const parsed = JSON.parse(decodeURIComponent(match[1]));
      if (isValidConsentRecord(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    // Continue to localStorage fallback
  }

  // 2. Try reading localStorage
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidConsentRecord(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    // LocalStorage blocked/unavailable
  }

  return null;
}

/**
 * Saves consent record to both document.cookie and localStorage, then broadcasts update.
 */
export function saveConsentRecord(preferences: Partial<CookieConsentPreferences>): CookieConsentRecord {
  const fullPreferences: CookieConsentPreferences = {
    essential: true,
    functional: Boolean(preferences.functional),
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
  };

  const record: CookieConsentRecord = {
    version: CURRENT_CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    preferences: fullPreferences,
  };

  if (typeof window !== 'undefined') {
    const serialized = encodeURIComponent(JSON.stringify(record));
    const maxAge = CONSENT_EXPIRATION_DAYS * 24 * 60 * 60;
    const isHttps = window.location.protocol === 'https:';

    // 1. Write cookie (accessible to server on next request if needed)
    try {
      document.cookie = `${COOKIE_CONSENT_KEY}=${serialized}; path=/; max-age=${maxAge}; ${
        isHttps ? 'Secure;' : ''
      } SameSite=Lax`;
    } catch (e) {
      console.warn('[Consent] Failed to write consent cookie:', e);
    }

    // 2. Write localStorage
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(record));
    } catch (e) {
      console.warn('[Consent] Failed to write consent to localStorage:', e);
    }

    // 3. Broadcast custom event
    window.dispatchEvent(new CustomEvent('gp-cookie-consent-updated', { detail: record }));
  }

  return record;
}
