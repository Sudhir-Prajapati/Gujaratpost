import { getBackendApiUrl, authFetch } from './api';

export interface EPaperEdition {
  id: string;
  title?: string; // Sub-edition name e.g. "Ahmedabad City", "Ahmedabad East", "City Life", etc.
  city: string;
  cityGu?: string;
  cityHi?: string;
  date: string; // ISO format YYYY-MM-DD
  pages: number;
  fileUrl: string;
  thumbnailUrl?: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishTime?: string;
  isActive: boolean;
  editionType?: 'PDF' | 'TEMPLATE';
  templateData?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface CityItem {
  id: string;
  city: string;
  cityGu?: string;
  cityHi?: string;
}

export const DEFAULT_CITIES_LIST: CityItem[] = [
  { id: 'ahmedabad', city: 'Ahmedabad', cityGu: 'અમદાવાદ' },
  { id: 'surat', city: 'Surat', cityGu: 'સુરત' },
  { id: 'rajkot', city: 'Rajkot', cityGu: 'રાજકોટ' },
  { id: 'vadodara', city: 'Vadodara', cityGu: 'વડોદરા' },
  { id: 'gujarat-state', city: 'Gujarat State', cityGu: 'ગુજરાત રાજ્ય' },
  { id: 'business-special', city: 'Business Special', cityGu: 'બિઝનેસ સ્પેશિયલ' },
];

export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateOffsetStr(daysOffset: number): string {
  const now = new Date();
  now.setDate(now.getDate() + daysOffset);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Clean up legacy localStorage data if any exists
export function clearLegacyLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('gp-epaper-editions');
    localStorage.removeItem('gp-epaper-cities');
  } catch {}
}

// Helper to safely parse JSON from Response without throwing on HTML/text/500 errors
async function safeParseJson<T = any>(res: Response): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const status = res.status;
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let errorMsg = `Server returned status ${status}`;
    if (contentType.includes('application/json')) {
      try {
        const errJson = await res.json();
        errorMsg = errJson?.message || errJson?.error || errorMsg;
      } catch (_) {}
    } else {
      try {
        const text = await res.text();
        if (text && text.length < 150) errorMsg = text.trim();
      } catch (_) {}
    }
    return { ok: false, status, error: errorMsg };
  }

  if (contentType.includes('application/json')) {
    try {
      const data = await res.json();
      return { ok: true, status, data };
    } catch (err: any) {
      return { ok: false, status, error: `Invalid JSON response: ${err?.message}` };
    }
  }

  try {
    const text = await res.text();
    const data = JSON.parse(text);
    return { ok: true, status, data };
  } catch (err: any) {
    return { ok: false, status, error: `Invalid JSON response: ${err?.message}` };
  }
}

// API Functions
export async function fetchPublicEPapers(params?: { city?: string; date?: string; search?: string }): Promise<EPaperEdition[]> {
  clearLegacyLocalStorage();
  try {
    const query = new URLSearchParams();
    if (params?.city && params.city !== 'ALL') query.append('city', params.city);
    if (params?.date && params.date !== 'ALL') query.append('date', params.date);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(getBackendApiUrl(`/api/public/epaper?${query.toString()}`), { cache: 'no-store' });
    const result = await safeParseJson(res);
    if (result.ok && result.data?.data?.editions && Array.isArray(result.data.data.editions)) {
      return result.data.data.editions;
    }
    if (!result.ok) {
      console.warn('Public epapers fetch warning:', result.error);
    }
  } catch (err) {
    console.warn('Failed to fetch public epapers from API:', err);
  }
  return [];
}

export async function fetchAdminEPapers(params?: { city?: string; date?: string; status?: string; search?: string }): Promise<EPaperEdition[]> {
  clearLegacyLocalStorage();
  try {
    const query = new URLSearchParams();
    if (params?.city && params.city !== 'ALL') query.append('city', params.city);
    if (params?.date && params.date !== 'ALL') query.append('date', params.date);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const res = await authFetch(getBackendApiUrl(`/api/admin/epaper?${query.toString()}`));
    
    // If unauthorized or forbidden, exit cleanly without throwing
    if (res.status === 401 || res.status === 403) {
      return [];
    }

    const result = await safeParseJson(res);
    if (result.ok && result.data?.data?.editions && Array.isArray(result.data.data.editions)) {
      return result.data.data.editions;
    }
    if (!result.ok) {
      console.warn('Failed to fetch admin epapers from API:', result.error);
    }
  } catch (err) {
    console.warn('Failed to fetch admin epapers from API:', err);
  }
  return [];
}

export async function createEPaperEdition(data: Partial<EPaperEdition>): Promise<{ edition?: EPaperEdition; error?: string } | null> {
  try {
    const res = await authFetch(getBackendApiUrl('/api/admin/epaper'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await safeParseJson(res);
    if (result.ok && result.data?.data?.edition) {
      return { edition: result.data.data.edition };
    }
    if (result.data?.error || result.data?.message) {
      return { error: result.data.error || result.data.message };
    }
    if (!result.ok) {
      return { error: result.error || `Error ${result.status}` };
    }
  } catch (err: any) {
    console.warn('Failed to create epaper edition via API:', err);
    return { error: err?.message || 'Server error creating epaper edition' };
  }
  return null;
}

export async function updateEPaperEdition(id: string, data: Partial<EPaperEdition>): Promise<{ edition?: EPaperEdition; error?: string } | null> {
  try {
    const res = await authFetch(getBackendApiUrl(`/api/admin/epaper/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await safeParseJson(res);
    if (result.ok && result.data?.data?.edition) {
      return { edition: result.data.data.edition };
    }
    if (result.data?.error || result.data?.message) {
      return { error: result.data.error || result.data.message };
    }
    if (!result.ok) {
      return { error: result.error || `Error ${result.status}` };
    }
  } catch (err: any) {
    console.warn('Failed to update epaper edition via API:', err);
    return { error: err?.message || 'Server error updating epaper edition' };
  }
  return null;
}

export async function deleteEPaperEdition(id: string): Promise<boolean> {
  try {
    const res = await authFetch(getBackendApiUrl(`/api/admin/epaper/${id}`), {
      method: 'DELETE',
    });
    const result = await safeParseJson(res);
    return (result.ok && result.data?.success) || false;
  } catch (err) {
    console.warn('Failed to delete epaper edition via API:', err);
  }
  return false;
}

export async function fetchEPaperCities(): Promise<CityItem[]> {
  try {
    const res = await fetch(getBackendApiUrl('/api/public/epaper/cities'), { cache: 'no-store' });
    const result = await safeParseJson(res);
    if (result.ok && result.data?.data?.cities && Array.isArray(result.data.data.cities)) {
      return result.data.data.cities.map((c: any) => ({
        id: c.id || c.city.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        city: c.city,
        cityGu: c.cityGu || c.city,
      }));
    }
  } catch (err) {
    console.warn('Failed to fetch cities from API:', err);
  }
  return DEFAULT_CITIES_LIST;
}

export async function createEPaperCity(cityName: string): Promise<CityItem | null> {
  try {
    const res = await authFetch(getBackendApiUrl('/api/admin/epaper/cities'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: cityName, cityGu: cityName }),
    });
    const result = await safeParseJson(res);
    if (result.ok && result.data?.data?.city) {
      const c = result.data.data.city;
      return { id: c.id || c.city, city: c.city, cityGu: c.cityGu || c.city };
    }
  } catch (err) {
    console.warn('Failed to create city via API:', err);
  }
  return null;
}

export async function deleteEPaperCity(cityIdOrName: string): Promise<boolean> {
  try {
    const res = await authFetch(getBackendApiUrl(`/api/admin/epaper/cities/${encodeURIComponent(cityIdOrName)}`), {
      method: 'DELETE',
    });
    const result = await safeParseJson(res);
    return (result.ok && result.data?.success) || false;
  } catch (err) {
    console.warn('Failed to delete city via API:', err);
  }
  return false;
}
