'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Headphones, Clock, Radio, X, Volume2 } from 'lucide-react';
import type { Language } from '@/types';
import { getPublicVideos } from '@/lib/api';
import { safeYouTubeId } from '@/lib/youtube';
import { AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import AdSectionBanner from '@/components/ads/AdSectionBanner';

interface PodcastItem {
  id: string;
  title: string;
  titleGu: string;
  titleHi?: string;
  thumbnail: string;
  youtubeId: string;
  duration: string;
  views?: number;
  channel?: string;
}

const FALLBACK_PODCASTS: PodcastItem[] = [
  {
    id: 'pod-1',
    title: 'Gujarat Election 2027: Ground Reality & Political Equations',
    titleGu: 'ગુજરાત ચૂંટણી 2027: જમીની વાસ્તવિકતા અને પક્ષોના સમીકરણો',
    titleHi: 'गुजरात चुनाव 2027: जमीनी हकीकत और समीकरण',
    youtubeId: 'LDDtOMwdJ_0',
    thumbnail: 'https://i.ytimg.com/vi/LDDtOMwdJ_0/hqdefault.jpg',
    duration: '42:15',
    channel: 'Gujarat Post Studio',
    views: 38400,
  },
  {
    id: 'pod-2',
    title: 'Gujarat Economy & Budget Special: Industry Leaders Roundtable',
    titleGu: 'ગુજરાત અર્થતંત્ર અને બજેટ સ્પેશિયલ: ઉદ્યોગ જગતના અગ્રણીઓ સાથે સંવાદ',
    titleHi: 'गुजरात अर्थव्यवस्था और बजट स्पेशल: उद्योगपतियों के साथ चर्चा',
    youtubeId: 'ituhQR8gwas',
    thumbnail: 'https://i.ytimg.com/vi/ituhQR8gwas/hqdefault.jpg',
    duration: '35:50',
    channel: 'Gujarat Post Studio',
    views: 29500,
  },
  {
    id: 'pod-3',
    title: 'Youth, Jobs & Startups in Gujarat: What Next for Gen-Z?',
    titleGu: 'ગુજરાતના યુવાઓ, રોજગાર અને સ્ટાર્ટઅપ્સ: Gen-Z માટે ભવિષ્યની નવી દિશા',
    titleHi: 'गुजरात के युवा, रोजगार और स्टार्टअप्स: नई राह',
    youtubeId: '3Bh1otISm7U',
    thumbnail: 'https://i.ytimg.com/vi/3Bh1otISm7U/hqdefault.jpg',
    duration: '48:10',
    channel: 'Gujarat Post Studio',
    views: 45200,
  },
  {
    id: 'pod-4',
    title: 'Media, Fact-Checking & Digital News Era: Behind the Headlines',
    titleGu: 'ડિજિટલ પત્રકારત્વ અને ફેક્ટ-ચેકિંગ: હેડલાઇન્સ પાછળનું અસલી સત્ય',
    titleHi: 'डिजिटल पत्रकारिता और फैक्ट-चेकिंग: खबरों के पीछे का सच',
    youtubeId: 'L0gEEuhWu8Y',
    thumbnail: 'https://i.ytimg.com/vi/L0gEEuhWu8Y/hqdefault.jpg',
    duration: '51:30',
    channel: 'Gujarat Post Studio',
    views: 31800,
  },
];

export default function PodcastSection({ language }: { language: Language }) {
  const [podcasts, setPodcasts] = useState<PodcastItem[]>(FALLBACK_PODCASTS);
  const [activePlayId, setActivePlayId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getPublicVideos('podcast')
      .then((res) => {
        if (isMounted && res && res.length > 0) {
          setPodcasts(res);
        }
      })
      .catch(() => {
        // Fallback already pre-set
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const badgeTitle = language === 'gu' ? 'પોડકાસ્ટ' : language === 'hi' ? 'पॉडकास्ट' : 'Podcasts';
  const subtitle =
    language === 'gu'
      ? 'ગુજરાત પોસ્ટ એક્સક્લુઝિવ પોડકાસ્ટ • વિશેષ સંવાદ અને વિશ્લેષણ'
      : language === 'hi'
      ? 'गुजरात पोस्ट एक्सक्लूसिव पॉडकास्ट • विशेष संवाद एवं विश्लेषण'
      : 'Gujarat Post Exclusive Podcasts • In-depth Conversations';

  return (
    <section className="mx-auto max-w-screen-xl px-4 mt-2.5 md:mt-3 mb-2 select-none" id="podcasts">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 mb-2.5 md:mb-3">
        <div className="flex items-center gap-3">
          <span className="section-heading-badge bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg leading-none tracking-tight flex items-center gap-2 shadow-xs">
            <Headphones className="h-4.5 w-4.5" />
            <span>{badgeTitle}</span>
          </span>
          <span className="hidden sm:inline-block text-[13px] md:text-[14px] font-bold text-muted-foreground truncate max-w-md">
            {subtitle}
          </span>
        </div>
        <Link
          href="/videos?tab=podcast"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[15px] md:text-[16px] hover:underline shrink-0"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : language === 'hi' ? 'और देखें →' : 'View More →'}
        </Link>
      </div>

      {/* Podcast Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {podcasts.slice(0, 4).map((item, idx) => {
          const displayTitle = language === 'gu' ? item.titleGu || item.title : language === 'hi' ? item.titleHi || item.title : item.title;
          const safeYt = safeYouTubeId(item.youtubeId);
          const thumbUrl = item.thumbnail || `https://i.ytimg.com/vi/${safeYt}/hqdefault.jpg`;

          return (
            <div
              key={item.id || idx}
              onClick={() => setActivePlayId(safeYt)}
              className="group cursor-pointer flex flex-col rounded-xl overflow-hidden border border-border/80 bg-card hover:border-[#B3121B]/40 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                <Image
                  src={thumbUrl}
                  alt={displayTitle}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40 pointer-events-none" />

                {/* Top Badge: Audio / Studio */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[11px] font-black text-white uppercase tracking-wider border border-white/10">
                  <Radio className="h-3 w-3 text-red-500 animate-pulse" />
                  <span>EPISODE #{idx + 1}</span>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[11px] font-bold text-white/90">
                  <Clock className="h-3 w-3" />
                  <span>{item.duration || '40:00'}</span>
                </div>

                {/* Centered Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-[#B3121B] text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-115 group-hover:bg-red-600">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Text Info */}
              <div className="p-3.5 flex flex-col flex-1 justify-between bg-card">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 text-[11px] font-black text-[#B3121B] uppercase tracking-wider">
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>{item.channel || 'Gujarat Post Studio'}</span>
                  </div>
                  <h4 className="text-[14.5px] md:text-[15px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                    <AutoTranslateString text={displayTitle} language={language} />
                  </h4>
                </div>

                <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-[11.5px] text-muted-foreground font-bold">
                  <span className="flex items-center gap-1">
                    <Headphones className="h-3.5 w-3.5 text-muted-foreground/80" />
                    <span>{language === 'gu' ? 'સાંભળો / જુઓ' : 'Listen / Watch'}</span>
                  </span>
                  <span className="text-[#B3121B] font-extrabold group-hover:underline">
                    {language === 'gu' ? 'શરૂ કરો ▶' : 'Play ▶'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Modal Player */}
      {activePlayId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setActivePlayId(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActivePlayId(null)}
              className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-md"
              title="Close"
              aria-label="Close video player"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Responsive 16:9 Iframe */}
            <div className="relative aspect-video w-full">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activePlayId}?autoplay=1&rel=0`}
                title="Gujarat Post Podcast Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
