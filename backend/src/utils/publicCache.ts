export const publicCache = new Map<string, { timestamp: number; payload: any }>();
export const MAX_PUBLIC_CACHE_ENTRIES = 500;

export const searchCache = new Map<string, { timestamp: number; payload: any }>();
export const MAX_SEARCH_CACHE_ENTRIES = 200;
export const SEARCH_CACHE_TTL_MS = 60 * 1000;

export function clearPublicRoutesCache() {
  publicCache.clear();
  searchCache.clear();
}
