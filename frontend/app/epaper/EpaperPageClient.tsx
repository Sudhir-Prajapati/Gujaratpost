'use client';

import Link from 'next/link';
import { Archive, CalendarDays, Download, Eye, Newspaper, Search } from 'lucide-react';
import { getLocalized } from '@/data';
import { useApp } from '@/components/AppProvider';

const editions = [
  { city: 'Ahmedabad', gu: 'અમદાવાદ', hi: 'अहमदाबाद', date: '21 Jun 2026', pages: 24 },
  { city: 'Surat', gu: 'સુરત', hi: 'सूरत', date: '21 Jun 2026', pages: 20 },
  { city: 'Rajkot', gu: 'રાજકોટ', hi: 'राजकोट', date: '21 Jun 2026', pages: 18 },
  { city: 'Vadodara', gu: 'વડોદરા', hi: 'वडोदरा', date: '21 Jun 2026', pages: 18 },
  { city: 'Gujarat State', gu: 'ગુજરાત રાજ્ય', hi: 'गुजरात राज्य', date: '21 Jun 2026', pages: 28 },
  { city: 'Business Special', gu: 'બિઝનેસ સ્પેશિયલ', hi: 'बिजनेस स्पेशल', date: '21 Jun 2026', pages: 12 },
];

export default function EpaperPageClient() {
  const { language } = useApp();

  return (
    <main className="bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-screen-xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-black uppercase text-accent">
                <Newspaper className="h-4 w-4" />
                E-paper
              </span>
              <h1 className="mt-4 text-3xl font-black leading-tight text-foreground sm:text-5xl">
                {getLocalized(language, { en: 'Gujarat Post E-paper', gu: 'ગુજરાત પોસ્ટ ઈ-પેપર', hi: 'गुजरात पोस्ट ई-पेपर' })}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">
                {getLocalized(language, {
                  en: 'Read today’s city editions, special supplements and archived Gujarat Post pages.',
                  gu: 'આજના શહેર આવૃત્તિઓ, સ્પેશિયલ સપ્લિમેન્ટ અને ગુજરાત પોસ્ટના આર્કાઇવ પેજ વાંચો.',
                  hi: 'आज के शहर संस्करण, विशेष सप्लीमेंट और गुजरात पोस्ट के आर्काइव पेज पढ़ें.',
                })}
              </p>
            </div>

            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-12 w-full rounded-full border border-border bg-muted pl-11 pr-4 text-sm font-semibold text-foreground outline-none focus:border-accent"
                placeholder={getLocalized(language, { en: 'Search edition or date', gu: 'આવૃત્તિ અથવા તારીખ શોધો', hi: 'संस्करण या तारीख खोजें' })}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-xl px-4 py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-heading text-2xl font-black text-foreground">
            {getLocalized(language, { en: 'Today’s Editions', gu: 'આજની આવૃત્તિઓ', hi: 'आज के संस्करण' })}
          </h2>
          <button type="button" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-black text-foreground transition hover:border-accent hover:text-accent">
            <CalendarDays className="h-4 w-4" />
            21 Jun 2026
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {editions.map((edition, index) => (
            <article key={edition.city} className="news-card overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative min-h-72 bg-primary p-5 text-white">
                <div className="absolute inset-x-0 top-0 h-2 bg-accent" />
                <div className="rounded-lg border border-white/15 bg-white p-4 text-primary shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-accent">Gujarat Post</p>
                      <h3 className="text-2xl font-black">{getLocalized(language, { en: edition.city, gu: edition.gu, hi: edition.hi })}</h3>
                    </div>
                    <Newspaper className="h-8 w-8 text-accent" />
                  </div>
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 7 }).map((_, line) => (
                      <span key={line} className={`block rounded ${line === 0 ? 'h-4 w-10/12 bg-slate-900' : 'h-2 bg-slate-200'}`} />
                    ))}
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {Array.from({ length: 3 }).map((_, box) => (
                      <span key={box} className="h-12 rounded bg-slate-200" />
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-bold text-white/75">
                  <span>{edition.date}</span>
                  <span>{edition.pages} pages</span>
                </div>
                <span className="absolute right-4 top-4 rounded-full bg-white/10 px-2 py-1 text-[10px] font-black">#{index + 1}</span>
              </div>
              <div className="flex gap-2 p-4">
                <Link href="/epaper" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-black text-white transition hover:bg-red-700">
                  <Eye className="h-4 w-4" />
                  Read
                </Link>
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition hover:border-accent hover:text-accent" aria-label="Download edition">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-screen-xl px-4 pb-10">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-black uppercase text-accent"><Archive className="h-4 w-4" /> Archive</p>
              <h2 className="mt-1 text-xl font-black text-foreground">
                {getLocalized(language, { en: 'Previous Editions', gu: 'જૂની આવૃત્તિઓ', hi: 'पुराने संस्करण' })}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {['20 Jun', '19 Jun', '18 Jun', '17 Jun'].map((date) => (
                <button key={date} type="button" className="rounded-full bg-muted px-4 py-2 text-sm font-black text-foreground transition hover:bg-accent hover:text-white">
                  {date}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
