'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Clock, Eye, Mic, Play, UserRound, Video } from 'lucide-react';
import { VIDEOS, formatViews, getLocalized } from '@/data';
import SectionHeader from '@/components/ui/SectionHeader';
import { useApp } from '@/components/AppProvider';

type TabType = 'video' | 'short' | 'podcast' | 'interview';

const tabs = [
  { key: 'video', label: 'Videos', gu: 'વીડિયો', hi: 'वीडियो', icon: Video },
  { key: 'short', label: 'Shorts', gu: 'શોર્ટ્સ', hi: 'शॉर्ट्स', icon: Play },
  { key: 'podcast', label: 'Podcasts', gu: 'પોડકાસ્ટ', hi: 'पॉडकास्ट', icon: Mic },
  { key: 'interview', label: 'Interviews', gu: 'ઇન્ટરવ્યૂ', hi: 'इंटरव्यू', icon: UserRound },
] as const;

export default function VideoSection() {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const filtered = VIDEOS.filter((item) => item.type === activeTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPlayingVideoId(null);
  };

  return (
    <section className="bg-muted py-3">
      <div className="mx-auto max-w-screen-xl px-4">
        <SectionHeader title="Videos & Multimedia" titleGu="વીડિયો અને મલ્ટીમીડિયા" titleHi="वीडियो और मल्टीमीडिया" language={language} href="/videos" />

        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black transition ${active ? 'border-accent bg-accent text-white' : 'border-border bg-card text-foreground hover:border-accent'}`}
              >
                <Icon className="h-4 w-4" />
                {getLocalized(language, { en: tab.label, gu: tab.gu, hi: tab.hi })}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((item) => (
            <article key={item.id} className="news-card overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative aspect-video">
                {playingVideoId === item.id ? (
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1&controls=1&mute=0&rel=0`}
                    title={getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="group/video relative h-full w-full cursor-pointer" onClick={() => setPlayingVideoId(item.id)}>
                    <Image src={item.thumbnail} alt={item.title} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 transition-all group-hover/video:bg-black/20">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform group-hover/video:scale-110">
                        <Play className="h-5 w-5 fill-current" />
                      </span>
                    </div>
                    <span className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-0.5 text-xs font-bold text-white">{item.duration}</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 text-sm font-black leading-snug text-foreground">
                  {getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
                </h3>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatViews(item.views)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(item.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
