'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Compass, Search, MapPin, Newspaper, Globe, Play, Camera, ShieldCheck, Building2, Mail, FileText, Cpu, HeartPulse, TrendingUp, Clapperboard, Landmark } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getLocalized } from '@/data';
import type { SitemapData } from '@/lib/sitemap-data';
import { LocalizedText } from '@/components/i18n/LocalizedContent';

const routes: Record<string, string> = {
  videos: '/videos', gallery: '/photos', reels: '/instagram', 'instagram-reels': '/instagram', insta: '/instagram', 'insta-reels': '/instagram', shorts: '/shorts', photos: '/photos',
  'photo-gallery': '/photos', instagram: '/instagram', epaper: '/epaper',
  'news-brief': '/news-brief', aqi: '/aqi', podcasts: '/videos?tab=podcast',
};

function DirectoryIcon({ id, company = false }: { id: string; company?: boolean }) {
  const icons = {
    videos: Play, shorts: Clapperboard, photos: Camera, instagram: Camera,
    gujarat: MapPin, national: Landmark, world: Globe, politics: Landmark,
    crime: ShieldCheck, health: HeartPulse, entertainment: Clapperboard,
    technology: Cpu, 'fact-check': ShieldCheck, trending: TrendingUp,
  };
  const Icon = company
    ? id.includes('contact') || id.includes('feedback') ? Mail : id.includes('policy') ? ShieldCheck : id.includes('about') ? Building2 : FileText
    : icons[id as keyof typeof icons] || MapPin;
  return <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />;
}

export default function SitemapClient({ initialData }: { initialData: SitemapData }) {
  const { language } = useApp();
  const [query, setQuery] = useState('');
  const [data, setData] = useState(initialData);
  const activeCategories = data.categories;
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/sitemap', { cache: 'no-store' });
        if (!response.ok) return;
        const next = await response.json();
        if (active && Array.isArray(next.categories) && Array.isArray(next.company)) setData(next);
      } catch { /* Retain the last successful sitemap when offline. */ }
    };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  const matches = query.trim() ? activeCategories.filter((category) =>
    [category.name, category.nameGu, category.nameHi, category.slug]
      .some((value) => value?.toLowerCase().includes(query.trim().toLowerCase()))) : [];
  const title = getLocalized(language, { gu: 'સાઇટમેપ', en: 'Site Map', hi: 'साइटमैप' });

  return (
    <main className="border-b border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-800 dark:bg-[#101114] dark:text-neutral-100">
      <div className="relative isolate overflow-hidden border-b border-neutral-200/70 bg-white dark:border-white/5 dark:bg-zinc-900/70">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-red-500/10 blur-3xl dark:bg-red-500/5" />
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <Link href="/" className="hover:text-red-600">{getLocalized(language, { gu: 'મુખ્ય પાનું (Home)', en: 'Home', hi: 'मुख्य पृष्ठ (Home)' })}</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-semibold text-neutral-900 dark:text-white">{title}</span>
          </nav>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                <Compass className="h-3.5 w-3.5" />
                {getLocalized(language, { gu: 'સંપૂર્ણ વેબસાઇટ ડિરેક્ટરી', en: 'Complete Website Directory', hi: 'संपूर्ण वेबसाइट निर्देशिका' })}
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">{title} <span className="text-red-600 dark:text-red-400">/</span> {getLocalized(language, { gu: 'ગુજરાત પોસ્ટ', en: 'Gujarat Post', hi: 'गुजरात पोस्ट' })}</h1>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {getLocalized(language, { gu: 'ગુજરાત પોસ્ટ પર ઉપલબ્ધ તમામ સક્રિય સમાચાર કેટેગરીઝ, શહેરી ડેસ્ક અને ડિજિટલ સેવાઓનું સત્તાવાર નેવિગેશન.', en: 'Official navigation for active news categories, city desks and digital services on Gujarat Post.', hi: 'गुजरात पोस्ट की सक्रिय समाचार श्रेणियों, शहर डेस्क और डिजिटल सेवाओं का आधिकारिक नेविगेशन।' })}
              </p>
            </div>
            <div className="relative w-full shrink-0 space-y-2 md:w-80">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>{getLocalized(language, { gu: 'કુલ શ્રેણીઓ:', en: 'Total categories:', hi: 'कुल श्रेणियाँ:' })}</span>
                <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-bold text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">{activeCategories.length}</span>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                  aria-label={getLocalized(language, { gu: 'કેટેગરી કે શહેર શોધો', en: 'Search categories or cities', hi: 'श्रेणी या शहर खोजें' })}
                  placeholder={getLocalized(language, { gu: 'કેટેગરી કે શહેર શોધો (Search)...', en: 'Search categories or cities...', hi: 'श्रेणी या शहर खोजें (Search)...' })}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 dark:border-neutral-700 dark:bg-zinc-800/80" />
              </div>
              {query.trim() && (
                <div className="absolute inset-x-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-zinc-900">
                  {matches.length ? matches.map((category) => (
                    <Link key={category.slug} href={routes[category.slug] || `/category/${encodeURIComponent(category.slug)}`} className="block rounded-lg px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-zinc-800">
                      {getLocalized(language, { gu: category.nameGu, en: category.name, hi: category.nameHi }) || category.name || category.slug}
                    </Link>
                  )) : <p role="status" className="px-3 py-2 text-sm text-neutral-500">{getLocalized(language, { gu: 'કોઈ પરિણામ મળ્યું નથી', en: 'No results found', hi: 'कोई परिणाम नहीं मिला' })}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-7 px-4 py-7 sm:px-6 sm:py-10">
        <section aria-labelledby="sitemap-categories" className="space-y-5 rounded-3xl border border-neutral-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60 sm:p-6">
          <h2 id="sitemap-categories" className="flex items-center gap-3 text-xl font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"><Newspaper className="h-5 w-5" aria-hidden="true" /></span>
            {getLocalized(language, { gu: 'કેટેગરીઝ', en: 'Categories', hi: 'श्रेणियाँ' })}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(query.trim() ? matches : activeCategories).map((category) => (
              <Link key={category.slug} href={routes[category.slug] || `/category/${encodeURIComponent(category.slug)}`}
                className="group flex min-h-20 items-center gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 px-4 py-4 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50/70 hover:text-red-700 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-white/5 dark:bg-white/[0.025] dark:hover:border-red-500/40 dark:hover:bg-red-500/[0.06] dark:hover:text-red-300">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200/80 bg-white text-neutral-500 transition group-hover:border-red-200 group-hover:text-red-600 dark:border-white/10 dark:bg-zinc-800 dark:text-neutral-400 dark:group-hover:border-red-500/30 dark:group-hover:text-red-400"><DirectoryIcon id={category.slug} /></span>
                <LocalizedText text={getLocalized(language, { gu: category.nameGu, en: category.name, hi: category.nameHi }) || category.name || category.slug} />
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-neutral-400 transition group-hover:translate-x-1 group-hover:text-red-500" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
        <section aria-labelledby="sitemap-company" className="space-y-5 rounded-3xl border border-neutral-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60 sm:p-6">
          <h2 id="sitemap-company" className="flex items-center gap-3 text-xl font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-white/5 dark:text-neutral-300"><Building2 className="h-5 w-5" aria-hidden="true" /></span>
            {getLocalized(language, { gu: 'કંપની', en: 'Company', hi: 'कंपनी' })}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.company.map((item) => (
              <Link key={item.href} href={item.href}
                onClick={item.action === 'cookie-settings' ? (event) => { event.preventDefault(); window.dispatchEvent(new CustomEvent('gp-open-cookie-settings')); } : undefined}
                className="group flex min-h-16 items-center gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 px-4 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50/70 hover:text-red-700 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-white/5 dark:bg-white/[0.025] dark:hover:border-red-500/40 dark:hover:bg-red-500/[0.06] dark:hover:text-red-300">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-500 shadow-sm transition group-hover:text-red-600 dark:bg-zinc-800 dark:text-neutral-400 dark:group-hover:text-red-400"><DirectoryIcon id={item.href} company /></span>
                <LocalizedText text={item.label} />
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-neutral-400 transition group-hover:translate-x-1 group-hover:text-red-500" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
