'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Users } from 'lucide-react';
import { getHeroSettings } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import { useAutoTranslate } from '@/lib/translate';
import type { Language } from '@/types';

export interface PartySeat {
  id: string;
  name: string;
  nameGu?: string;
  logoUrl?: string;
  seats: number | string;
  won?: number | string;
  leads?: number | string;
  trailing?: number | string;
  color?: string;
}

export interface ElectionBannerConfig {
  enabled: boolean;
  title: string;
  showLive: boolean;
  mapIconUrl?: string;
  totalSeats: number | string;
  majorityTarget: number | string;
  showOnAllPages?: boolean;
  parties: PartySeat[];
}

export const DEFAULT_ELECTION_BANNER: ElectionBannerConfig = {
  enabled: false,
  title: 'ગુજરાત ચૂંટણી 2026',
  showLive: true,
  mapIconUrl: '',
  totalSeats: 182,
  majorityTarget: 92,
  showOnAllPages: false,
  parties: [
    {
      id: 'bjp',
      name: 'BJP',
      nameGu: 'BJP',
      logoUrl: '',
      seats: 100,
      won: 82,
      leads: 18,
      trailing: 0,
      color: '#FF6B00',
    },
    {
      id: 'cong',
      name: 'Congress',
      nameGu: 'Congress',
      logoUrl: '',
      seats: 55,
      won: 38,
      leads: 17,
      trailing: 0,
      color: '#19AAED',
    },
    {
      id: 'aap',
      name: 'AAP',
      nameGu: 'AAP',
      logoUrl: '',
      seats: 15,
      won: 8,
      leads: 7,
      trailing: 0,
      color: '#0066CC',
    },
    {
      id: 'oth',
      name: 'અન્ય',
      nameGu: 'અન્ય',
      logoUrl: '',
      seats: 12,
      won: 6,
      leads: 6,
      trailing: 0,
      color: '#6B7280',
    },
  ],
};

// ── Built-in High Quality SVGs for major parties ──────────────────────

// ── Helper to sanitize and optimize party/election logos ────────────────
export function getOptimizedPartyLogoUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('wikimedia.org')) return '';
  if (trimmed.includes('res.cloudinary.com')) {
    // Replace .avif with .png so 100% of browsers decode it cleanly
    let safeUrl = trimmed.replace(/\.avif(\?.*)?$/i, '.png$1');
    if (!safeUrl.includes('/f_auto')) {
      safeUrl = safeUrl.replace('/upload/', '/upload/f_auto,q_auto/');
    }
    return safeUrl;
  }
  return trimmed;
}

export function getPartyStats(party: PartySeat) {
  const nameLower = (party.name || '').toLowerCase();
  const seatsNum = Number(party.seats) || 0;

  let won = party.won;
  let leads = party.leads;
  let trailing = party.trailing !== undefined && party.trailing !== '' ? party.trailing : 0;

  if (won === undefined || won === '' || leads === undefined || leads === '') {
    if (nameLower.includes('bjp') || nameLower.includes('ભાજપ')) {
      won = 82;
      leads = 18;
      trailing = 0;
    } else if (nameLower.includes('cong') || nameLower.includes('કોંગ્રેસ')) {
      won = 38;
      leads = 17;
      trailing = 0;
    } else if (nameLower.includes('aap') || nameLower.includes('આપ')) {
      won = 8;
      leads = 7;
      trailing = 0;
    } else if (nameLower.includes('અન્ય') || nameLower.includes('oth')) {
      won = 6;
      leads = 6;
      trailing = 0;
    } else {
      won = Math.round(seatsNum * 0.7);
      leads = Math.max(0, seatsNum - Number(won));
      trailing = 0;
    }
  }

  // BJP won is highlighted in red, others in blue as in Image 3
  const isBjp = nameLower.includes('bjp') || nameLower.includes('ભાજપ');
  const wonColor = isBjp ? 'text-red-600 dark:text-red-500' : 'text-blue-600 dark:text-blue-400';

  return { won, leads, trailing, wonColor };
}

export function PartyLogoRenderer({ party }: { party: PartySeat }) {
  const [imgError, setImgError] = useState(false);
  const nameLower = (party.name || '').toLowerCase();
  const idLower = (party.id || '').toLowerCase();
  const cleanUrl = getOptimizedPartyLogoUrl(party.logoUrl);

  // If a custom image was uploaded and hasn't errored
  if (cleanUrl && !imgError) {
    return (
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200/60 dark:border-zinc-700 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
        <Image
          src={cleanUrl}
          alt={party.name || 'Party Logo'}
          fill
          sizes="44px"
          className="object-contain p-0.5"
          unoptimized
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // 1. BJP Lotus Symbol - Orange Rounded Square (matching Image 3)
  if (nameLower.includes('bjp') || nameLower.includes('ભાજપ') || idLower.includes('bjp')) {
    return (
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-b from-[#FF7A00] to-[#E65100] flex items-center justify-center shadow-2xs p-1.5 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15 C45 30 38 48 38 65 C44 68 56 68 62 65 C62 48 55 30 50 15 Z" fill="#FF5500" stroke="#000" strokeWidth="2.5" />
          <path d="M35 30 C28 42 22 55 24 66 C30 68 36 67 40 64 C38 52 36 40 35 30 Z" fill="#FF6B00" stroke="#000" strokeWidth="2.5" />
          <path d="M65 30 C72 42 78 55 76 66 C70 68 64 67 60 64 C62 52 64 40 65 30 Z" fill="#FF6B00" stroke="#000" strokeWidth="2.5" />
          <path d="M22 45 C15 55 12 65 16 72 C22 73 28 71 31 66 C27 58 24 51 22 45 Z" fill="#FF7700" stroke="#000" strokeWidth="2.5" />
          <path d="M78 45 C85 55 88 65 84 72 C78 73 72 71 69 66 C73 58 76 51 78 45 Z" fill="#FF7700" stroke="#000" strokeWidth="2.5" />
          <path d="M22 74 C35 81 65 81 78 74 C72 70 28 70 22 74 Z" fill="#138808" stroke="#000" strokeWidth="2" />
          <path d="M48 76 L48 88 L52 88 L52 76 Z" fill="#000" />
        </svg>
      </div>
    );
  }

  // 2. Congress Hand Symbol - Blue Rounded Square (matching Image 3)
  if (nameLower.includes('cong') || nameLower.includes('કોંગ્રેસ') || nameLower.includes('inc') || idLower.includes('cong')) {
    return (
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-b from-[#0084FF] to-[#0055D4] flex items-center justify-center shadow-2xs p-1.5 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
          <path d="M48 8 C45 8 43 10 43 14 L43 42 C41 42 39 43 38 45 L38 20 C38 16 36 14 34 14 C32 14 30 16 30 20 L30 48 C28 48 27 50 26 51 L26 28 C26 24 24 22 22 22 C20 22 18 24 18 28 L18 60 C18 78 30 92 48 92 C66 92 76 78 76 60 L76 34 C76 30 74 28 72 28 C70 28 68 30 68 34 L68 48 C66 48 64 46 64 44 L64 14 C64 10 62 8 60 8 C58 8 56 10 56 14 L56 42 C54 42 51 42 49 42 L49 14 C49 10 47 8 48 8 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
          <rect x="25" y="53" width="44" height="6.5" fill="#FF9933" rx="1" />
          <rect x="23" y="62" width="48" height="6.5" fill="#FFFFFF" rx="1" />
          <rect x="25" y="71" width="44" height="6.5" fill="#138808" rx="1" />
        </svg>
      </div>
    );
  }

  // 3. AAP Symbol - Golden Yellow Rounded Square (matching Image 3)
  if (nameLower.includes('aap') || nameLower.includes('આપ') || idLower.includes('aap')) {
    return (
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-b from-[#FFBE00] to-[#E5A800] flex flex-col items-center justify-center shadow-2xs p-1 shrink-0 text-[#004B87]">
        <span className="text-[12px] sm:text-[13px] font-black tracking-tight leading-none">aap</span>
        <div className="w-6 h-1.5 bg-[#004B87] rounded-xs mt-1"></div>
      </div>
    );
  }

  // 4. Other / Group Symbol - Slate Rounded Square (matching Image 3)
  return (
    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#475569] flex items-center justify-center text-white shadow-2xs shrink-0">
      <Users className="w-5 h-5 sm:w-6 sm:h-6" />
    </div>
  );
}


const ELECTION_I18N: Record<string, Record<Language, string>> = {
  won: { gu: 'જીત', hi: 'जीत', en: 'Won' },
  leads: { gu: 'આગે', hi: 'आगे', en: 'Leads' },
  trailing: { gu: 'પાછળ', hi: 'पीछे', en: 'Trailing' },
  totalSeats: { gu: 'કુલ બેઠકો', hi: 'कुल सीटें', en: 'Total Seats' },
  majorityTarget: { gu: 'બહુમતી માટે', hi: 'बहुमत के लिए', en: 'Majority' },
  others: { gu: 'અન્ય', hi: 'अन्य', en: 'Others' },
};

function getElectionTitle(rawTitle: string, lang: Language): string {
  const t = (rawTitle || '').trim();
  if (t.includes('ગુજરાત ચૂંટણી') || t.includes('Gujarat Election') || t.includes('गुजरात चुनाव')) {
    const year = t.match(/\d{4}/)?.[0] || '2026';
    if (lang === 'gu') return `ગુજરાત ચૂંટણી ${year}`;
    if (lang === 'hi') return `गुजरात चुनाव ${year}`;
    return `Gujarat Election ${year}`;
  }
  return '';
}

export function PartyCard({ party, language = 'gu' }: { party: PartySeat; language?: Language }) {
  const { won, leads, trailing, wonColor } = getPartyStats(party);

  return (
    <div className="bg-white dark:bg-card/95 border border-gray-200/90 dark:border-zinc-800 rounded-2xl p-2.5 sm:p-3 shadow-xs hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between flex-1 min-w-[138px] sm:min-w-[148px] max-w-[190px]">
      {/* Top Row: Logo Box + Name & Total Seats */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <PartyLogoRenderer party={party} />
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <span className="text-xs sm:text-[13px] font-bold text-gray-700 dark:text-gray-300 leading-tight truncate">
            {party.nameGu || party.name}
          </span>
          <span className="text-xl sm:text-2xl font-black text-gray-950 dark:text-gray-100 leading-none mt-1">
            {party.seats}
          </span>
        </div>
      </div>

      {/* Subtle Divider Line */}
      <div className="border-t border-gray-100 dark:border-zinc-800/80 my-2" />

      {/* Bottom Row: 3 Columns (જીત, આગે, પાછળ) */}
      <div className="grid grid-cols-3 text-center gap-1">
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 leading-none">
            જીત
          </span>
          <span className={`text-xs sm:text-sm font-black ${wonColor} leading-none mt-1`}>
            {won}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 leading-none">
            આગે
          </span>
          <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 leading-none mt-1">
            {leads}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 leading-none">
            પાછળ
          </span>
          <span className="text-xs sm:text-sm font-black text-red-500 dark:text-red-400 leading-none mt-1">
            {trailing}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ElectionBannerProps {
  initialConfig?: ElectionBannerConfig | null;
}

export default function ElectionBanner({ initialConfig }: ElectionBannerProps) {
  const { language } = useApp();
  const pathname = usePathname();
  const [config, setConfig] = useState<ElectionBannerConfig>(() => initialConfig || DEFAULT_ELECTION_BANNER);
    const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  // Parse raw JSON safely
  const parseBannerData = useCallback((enabled: boolean, rawJson: any): ElectionBannerConfig => {
    let parsed: any = {};
    if (typeof rawJson === 'string' && rawJson.trim()) {
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        parsed = {};
      }
    } else if (typeof rawJson === 'object' && rawJson !== null) {
      parsed = rawJson;
    }

    return {
      enabled: Boolean(enabled),
      title: parsed.title || DEFAULT_ELECTION_BANNER.title,
      showLive: parsed.showLive !== undefined ? Boolean(parsed.showLive) : DEFAULT_ELECTION_BANNER.showLive,
      mapIconUrl: parsed.mapIconUrl || '',
      totalSeats: parsed.totalSeats !== undefined ? parsed.totalSeats : DEFAULT_ELECTION_BANNER.totalSeats,
      majorityTarget: parsed.majorityTarget !== undefined ? parsed.majorityTarget : DEFAULT_ELECTION_BANNER.majorityTarget,
      showOnAllPages: Boolean(parsed.showOnAllPages),
      parties: Array.isArray(parsed.parties) && parsed.parties.length > 0
        ? parsed.parties
        : DEFAULT_ELECTION_BANNER.parties,
    };
  }, []);

  const refreshBanner = useCallback(async () => {
    try {
      const res: any = await getHeroSettings(true);
      const enabled = res?.electionBannerEnabled ?? res?.setting?.electionBannerEnabled ?? false;
      const rawJson = res?.electionBannerJson || res?.setting?.electionBannerJson || null;
      setConfig(parseBannerData(Boolean(enabled), rawJson));
    } catch (e) {
      // keep fallback
    } finally {
      setLoaded(true);
    }
  }, [parseBannerData]);

  useEffect(() => {
    refreshBanner();

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('gp-admin-updates');
        bc.onmessage = (event) => {
          if (
            event?.data?.type === 'ELECTION_BANNER_UPDATED' ||
            event?.data?.type === 'HERO_UPDATED' ||
            event?.data?.type === 'API_CACHE_CLEARED'
          ) {
            refreshBanner();
          }
        };
      }
    } catch {}

    return () => {
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [refreshBanner]);

  // Split title if space exists (e.g. "ગુજરાત ચૂંટણી" and "2026") - MUST run before early returns to preserve Hook order
  const presetTitle = getElectionTitle(config.title || 'ગુજરાત ચૂંટણી 2026', language);
  const autoTitle = useAutoTranslate(config.title || 'ગુજરાત ચૂંટણી 2026', language);
  const activeTitle = presetTitle || autoTitle || config.title || 'ગુજરાત ચૂંટણી 2026';

  const titleParts = activeTitle.split(' ');
  const titleLine1 = titleParts.slice(0, -1).join(' ') || titleParts[0];
  const titleLine2 = titleParts.length > 1 ? titleParts[titleParts.length - 1] : '';

  // Don't render on admin / login
  if (pathname === '/login' || pathname === '/cms-admin' || pathname.startsWith('/admin')) {
    return null;
  }

  // If disabled, don't render anything
  if (!config.enabled) {
    return null;
  }

  // If only on homepage and we are not on homepage, don't render
  if (!config.showOnAllPages && pathname !== '/') {
    return null;
  }

  return (
    <section className="mx-auto max-w-screen-xl px-4 py-2 sm:py-2.5 w-full select-none">
      <div className="w-full bg-white dark:bg-card border-2 border-red-200/90 dark:border-red-950/60 rounded-2xl sm:rounded-3xl shadow-[0_4px_24px_rgba(220,38,38,0.08)] px-3 sm:px-6 py-2.5 sm:py-3 overflow-hidden">
        
        {/* ─── DESKTOP VIEW (>= md): Starts from hero section start and ends at hero section end ─── */}
        <div className="hidden md:flex items-center justify-between gap-4 w-full">
          {/* 1. Left: Gujarat Map + Title + LIVE badge */}
          <div className="flex items-center gap-3 shrink-0 pr-4 lg:pr-6 border-r-2 border-red-200/80">
            {config.mapIconUrl ? (
              <div className="relative w-10 h-10 lg:w-12 lg:h-12 shrink-0">
                <Image
                  src={getOptimizedPartyLogoUrl(config.mapIconUrl) || config.mapIconUrl}
                  alt="Election Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="shrink-0 flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12">
                <svg
                  viewBox="0 0 100 100"
                  className="w-10 h-10 lg:w-11 lg:h-11 fill-[#DC2626] drop-shadow-sm"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M48,15 C56,16 63,14 69,18 C75,23 83,24 87,30 C89,35 86,42 83,46 C80,51 77,59 78,66 C79,71 74,74 69,73 C62,72 57,67 52,69 C45,71 39,66 35,61 C30,56 25,55 21,48 C18,41 21,34 28,31 C34,28 39,20 44,15 Z M26,42 C29,45 34,47 39,45 C44,43 49,47 50,51 C46,54 39,56 33,52 C28,49 25,45 26,42 Z" />
                </svg>
              </div>
            )}

            <div className="flex flex-col justify-center">
              <div className="text-sm lg:text-base font-black text-gray-900 dark:text-gray-100 leading-tight tracking-tight whitespace-nowrap">
                {titleLine1}
              </div>
              {titleLine2 && (
                <div className="text-base lg:text-xl font-black text-gray-950 dark:text-gray-50 leading-tight">
                  {titleLine2}
                </div>
              )}
              {config.showLive && (
                <div className="mt-1 inline-flex items-center gap-1.5 bg-[#DC2626] text-white px-2.5 py-0.5 rounded-full text-[10px] lg:text-xs font-black tracking-wider uppercase shadow-xs w-max">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  <span>LIVE</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Middle: Parties distributed evenly */}
          <div className="flex items-center justify-center gap-3 lg:gap-4 flex-1">
            {config.parties.map((party) => (
              <PartyCard key={party.id || party.name} party={party} language={language} />
            ))}
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-gray-200 dark:bg-zinc-800 shrink-0 mx-1"></div>

          {/* 3. Right: Total Seats & Majority Target */}
          <div className="flex items-center gap-4 lg:gap-6 shrink-0 pl-2">
            <div className="flex items-center gap-2">
              <span className="text-xl lg:text-2xl select-none" title="કુલ બેઠકો">🪑</span>
              <div className="flex flex-col">
                <span className="text-xs lg:text-sm font-bold text-gray-600 dark:text-gray-400 leading-none whitespace-nowrap">
                  કુલ બેઠકો
                </span>
                <span className="text-xl lg:text-2xl font-black text-gray-950 dark:text-gray-100 leading-none mt-1">
                  {config.totalSeats}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xl lg:text-2xl select-none" title="બહુમતી માટે">🎯</span>
              <div className="flex flex-col">
                <span className="text-xs lg:text-sm font-bold text-gray-600 dark:text-gray-400 leading-none whitespace-nowrap">
                  બહુમતી માટે
                </span>
                <span className="text-xl lg:text-2xl font-black text-gray-950 dark:text-gray-100 leading-none mt-1">
                  {config.majorityTarget}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── MOBILE VIEW (< md): Left-to-Right Horizontal Swipe (Starts cleanly at left, NO clipping) ─── */}
        <div className="flex md:hidden items-center justify-start gap-2.5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1">
          {/* 1. Left: Map + Title + LIVE */}
          <div className="flex items-center gap-2.5 shrink-0 pr-3 border-r-2 border-red-200/80 snap-start">
            {config.mapIconUrl ? (
              <div className="relative w-8 h-8 shrink-0">
                <Image
                  src={config.mapIconUrl}
                  alt="Election Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="shrink-0 flex items-center justify-center w-8 h-8">
                <svg
                  viewBox="0 0 100 100"
                  className="w-7 h-7 fill-[#DC2626] drop-shadow-sm"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M48,15 C56,16 63,14 69,18 C75,23 83,24 87,30 C89,35 86,42 83,46 C80,51 77,59 78,66 C79,71 74,74 69,73 C62,72 57,67 52,69 C45,71 39,66 35,61 C30,56 25,55 21,48 C18,41 21,34 28,31 C34,28 39,20 44,15 Z M26,42 C29,45 34,47 39,45 C44,43 49,47 50,51 C46,54 39,56 33,52 C28,49 25,45 26,42 Z" />
                </svg>
              </div>
            )}

            <div className="flex flex-col justify-center">
              <div className="text-[12px] font-black text-gray-900 dark:text-gray-100 leading-tight whitespace-nowrap">
                {titleLine1} {titleLine2}
              </div>
              {config.showLive && (
                <div className="mt-0.5 inline-flex items-center gap-1 bg-[#DC2626] text-white px-2 py-0.2 rounded-full text-[9px] font-black tracking-wider uppercase shadow-xs w-max">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                  </span>
                  <span>LIVE</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Parties in horizontal scrollable cards */}
          {config.parties.map((party) => (
            <div
              key={party.id || party.name}
              className="shrink-0 snap-center min-w-[145px]"
            >
              <PartyCard party={party} language={language} />
            </div>
          ))}

          {/* Divider */}
          <div className="h-7 w-px bg-gray-200 dark:bg-zinc-800 shrink-0 mx-0.5"></div>

          {/* 3. Seats & Majority on mobile */}
          <div className="flex items-center gap-3 shrink-0 snap-end pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-base select-none">🪑</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 leading-none whitespace-nowrap">
                  કુલ બેઠકો
                </span>
                <span className="text-base font-black text-gray-950 dark:text-gray-100 leading-none mt-0.5">
                  {config.totalSeats}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-base select-none">🎯</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 leading-none whitespace-nowrap">
                  બહુમતી માટે
                </span>
                <span className="text-base font-black text-gray-950 dark:text-gray-100 leading-none mt-0.5">
                  {config.majorityTarget}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );}
