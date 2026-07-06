'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, Eye, Heart, MessageCircle, MoreHorizontal, Play, Send, Volume2 } from 'lucide-react';
import { VIDEOS, formatViews, getLocalized } from '@/data';
import { useApp } from '@/components/AppProvider';
import Footer from '@/components/layout/Footer';

const shortItems = VIDEOS.filter((item) => item.type === 'short');

const buildShorts = () =>
  Array.from({ length: 28 }, (_, index) => {
    const item = shortItems[index % shortItems.length] || VIDEOS[index % VIDEOS.length];
    const cycle = Math.floor(index / Math.max(shortItems.length, 1)) + 1;

    return {
      ...item,
      key: `${item.id}-short-${index}`,
      views: item.views + cycle * 12500,
      likes: 2100 + index * 421,
      comments: 120 + index * 19,
    };
  });

export default function ShortsPageClient() {
  const { language } = useApp();
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const shorts = useMemo(() => buildShorts(), []);

  return (
    <main className="bg-primary text-white">
      <section className="mx-auto grid max-w-screen-xl grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[240px_1fr_240px]">
        <aside className="hidden lg:block">
          <div className="sticky top-44 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-black uppercase text-accent">Gujarat Post</p>
            <h1 className="mt-1 text-3xl font-black leading-tight">Shorts</h1>
            <p className="mt-3 text-sm font-semibold text-white/60">
              {getLocalized(language, {
                en: 'Swipe-style news updates built for fast watching.',
                gu: 'ઝડપી જોવા માટે બનાવેલા સ્વાઇપ-સ્ટાઇલ ન્યૂઝ અપડેટ્સ.',
                hi: 'तेज देखने के लिए बनाए गए स्वाइप-स्टाइल न्यूज अपडेट.',
              })}
            </p>
            <Link href="/watch" className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-black text-white">
              Watch
            </Link>
          </div>
        </aside>

        <div className="mx-auto h-[calc(100svh-92px)] w-full max-w-[460px] snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-none bg-black scrollbar-hide sm:rounded-[2rem] sm:border sm:border-white/10 sm:shadow-2xl">
          {shorts.map((item, index) => {
            const isLiked = Boolean(liked[item.key]);

            return (
              <article key={item.key} className="relative h-[calc(100svh-92px)] min-h-[620px] snap-start overflow-hidden bg-black">
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  priority={index < 2}
                  sizes="(max-width: 640px) 100vw, 460px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/20" />

                <div className="absolute left-4 right-20 top-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-accent live-badge" />
                    Shorts
                  </span>
                  <span className="rounded-full bg-black/35 px-3 py-1.5 text-xs font-bold backdrop-blur">{item.duration}</span>
                </div>

                <button
                  type="button"
                  className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:scale-105 hover:bg-accent"
                  aria-label="Play short"
                >
                  <Play className="h-7 w-7 fill-current" />
                </button>

                <div className="absolute bottom-0 left-0 right-16 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-black">GP</span>
                    <div>
                      <p className="text-sm font-black">Gujarat Post</p>
                      <p className="text-xs font-semibold text-white/60">{formatViews(item.views)} views</p>
                    </div>
                  </div>
                  <h2 className="line-clamp-3 text-xl font-black leading-tight">
                    {getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
                  </h2>
                  <p className="mt-3 line-clamp-2 text-sm font-semibold text-white/70">
                    {getLocalized(language, {
                      en: 'Breaking update, local angle and quick context in under a minute.',
                      gu: 'એક મિનિટથી ઓછી અંદર બ્રેકિંગ અપડેટ, લોકલ એંગલ અને ઝડપી સંદર્ભ.',
                      hi: 'एक मिनट से कम में ब्रेकिंग अपडेट, लोकल एंगल और तेज संदर्भ.',
                    })}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                    <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">#GujaratPost</span>
                    <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">#Breaking</span>
                  </div>
                </div>

                <div className="absolute bottom-20 right-3 flex w-12 flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setLiked((value) => ({ ...value, [item.key]: !isLiked }))}
                    className={`flex flex-col items-center gap-1 text-xs font-black ${isLiked ? 'text-accent' : 'text-white'}`}
                    aria-label="Like short"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
                      <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                    </span>
                    {formatViews(item.likes + (isLiked ? 1 : 0))}
                  </button>
                  <button type="button" className="flex flex-col items-center gap-1 text-xs font-black" aria-label="Comments">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    {item.comments}
                  </button>
                  <button type="button" className="flex flex-col items-center gap-1 text-xs font-black" aria-label="Share short">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur">
                      <Send className="h-5 w-5" />
                    </span>
                    Share
                  </button>
                  <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur" aria-label="Save short">
                    <Bookmark className="h-5 w-5" />
                  </button>
                  <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur" aria-label="Mute">
                    <Volume2 className="h-5 w-5" />
                  </button>
                </div>
              </article>
            );
          })}
          {/* Last Slide: Footer */}
          <div
            className="relative h-[calc(100svh-92px)] min-h-[620px] snap-start overflow-y-auto scrollbar-hide bg-slate-950 flex flex-col justify-between"
            style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
          >
            <div className="pt-10 pb-4 px-4 text-center shrink-0">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-white/50 animate-pulse">
                You&apos;ve caught up!
              </span>
            </div>
            <div className="flex-1">
              <Footer isInline />
            </div>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-44 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-accent">
                <Eye className="h-4 w-4" />
                Trending Shorts
              </p>
              <div className="mt-3 space-y-3">
                {shorts.slice(0, 4).map((item, index) => (
                  <Link key={item.key} href="/shorts" className="flex gap-3 rounded-xl p-2 transition hover:bg-white/10">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black">{index + 1}</span>
                    <span className="line-clamp-2 text-sm font-bold text-white/80">
                      {getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <button type="button" className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10">
              <MoreHorizontal className="h-4 w-4" />
              More Shorts
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
