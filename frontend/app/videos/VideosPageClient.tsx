'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Clock, Eye, Mic, Play, UserRound, Video } from 'lucide-react';
import { VIDEOS, formatViews, getLocalized } from '@/data';
import { useApp } from '@/components/AppProvider';

type TabType = 'all' | 'video' | 'short' | 'podcast' | 'interview';

const tabs = [
  { key: 'all', label: 'All', gu: 'બધું', hi: 'सभी', icon: Play },
  { key: 'video', label: 'Videos', gu: 'વીડિયો', hi: 'वीडियो', icon: Video },
  { key: 'short', label: 'Shorts', gu: 'શોર્ટ્સ', hi: 'शॉर्ट्स', icon: Play },
  { key: 'podcast', label: 'Podcasts', gu: 'પોડકાસ્ટ', hi: 'पॉडकास्ट', icon: Mic },
  { key: 'interview', label: 'Interviews', gu: 'ઇન્ટરવ્યૂ', hi: 'इंटरव्यू', icon: UserRound },
] as const;

interface VideosPageClientProps {
  initialVideos: any[];
}

export default function VideosPageClient({ initialVideos }: VideosPageClientProps) {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const displayVideos = initialVideos.length > 0 ? initialVideos : VIDEOS;
  const filtered = activeTab === 'all' ? displayVideos : displayVideos.filter((item) => item.type === activeTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPlayingVideoId(null);
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-black text-foreground">{getLocalized(language, { en: 'Videos & Multimedia', gu: 'વીડિયો અને મલ્ટીમીડિયા', hi: 'वीडियो और मल्टीमीडिया' })}</h1>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">{getLocalized(language, { en: 'Watch latest Gujarat news videos, shorts, podcasts and interviews.', gu: 'ગુજરાતના તાજા વીડિયો, શોર્ટ્સ, પોડકાસ્ટ અને ઇન્ટરવ્યૂ જુઓ.', hi: 'गुजरात के ताजा वीडियो, शॉर्ट्स, पॉडकास्ट और इंटरव्यू देखें.' })}</p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} type="button" onClick={() => handleTabChange(tab.key)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${active ? 'border-accent bg-accent text-white' : 'border-border bg-card text-foreground'}`}>
              <Icon className="h-4 w-4" />
              {getLocalized(language, { en: tab.label, gu: tab.gu, hi: tab.hi })}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <article key={item.id} className="news-card overflow-hidden rounded-lg border border-border bg-card">
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
                  <Image src={item.thumbnail} alt={item.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 transition-all group-hover/video:bg-black/20">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white transition-transform group-hover/video:scale-110"><Play className="h-6 w-6 fill-current" /></span>
                  </div>
                  <span className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-0.5 text-xs font-bold text-white">{item.duration}</span>
                  <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-black text-white">{item.type.toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="line-clamp-2 text-base font-black leading-snug text-foreground">{getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}</h2>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatViews(item.views)}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(item.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
