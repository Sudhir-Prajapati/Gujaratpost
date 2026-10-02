'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, Play, Bell, Radio, X, Volume2, VolumeX, Camera } from 'lucide-react';
import { formatViews, getLocalized, getCategoryLabel } from '@/data';
import { getPublicVideos, getPublicArticles, getPublicGallery } from '@/lib/api';
import { safeYouTubeId } from '@/lib/youtube';
import { useApp } from '@/components/AppProvider';
import { useIsApk } from '@/lib/useIsApk';
import ApkVideoPlayer from '@/components/apk/ApkVideoPlayer';
import { toGu } from '@/lib/utils';
import type { Article } from '@/types';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';

type TabType = 'video' | 'short' | 'exclusive' | 'bulletin';

function timeAgo(dateStr?: string, language = 'gu'): string {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return language === 'gu' ? 'હમણાં જ' : 'Just now';
  if (diff < 60) return language === 'gu' ? `${diff} મિનિટ પહેલા` : `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return language === 'gu' ? `${h} કલાક પહેલા` : `${h}h ago`;
  return language === 'gu' ? `${Math.floor(h / 24)} દિવસ પહેલા` : `${Math.floor(h / 24)}d ago`;
}

function YoutubeIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M22.5 7.1a2.8 2.8 0 0 0-2-2C18.7 4.6 12 4.6 12 4.6s-6.7 0-8.5.5a2.8 2.8 0 0 0-2 2A29.5 29.5 0 0 0 1 12a29.5 29.5 0 0 0 .5 4.9 2.8 2.8 0 0 0 2 2c1.8.5 8.5.5 8.5.5s6.7 0 8.5-.5a2.8 2.8 0 0 0 2-2A29.5 29.5 0 0 0 23 12a29.5 29.5 0 0 0-.5-4.9Z" />
      <path fill="white" d="m9.8 15.2 5.6-3.2-5.6-3.2v6.4Z" />
    </svg>
  );
}

const FALLBACK_PHOTO_IMAGES = [
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
];

function SidebarPhotoCardImage({
  src: initialSrc,
  alt,
  index,
}: {
  src: string;
  alt: string;
  index: number;
}) {
  const fallback = FALLBACK_PHOTO_IMAGES[index % FALLBACK_PHOTO_IMAGES.length];
  const [src, setSrc] = useState(initialSrc || fallback);

  useEffect(() => {
    setSrc(initialSrc || fallback);
  }, [initialSrc, fallback]);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes="(max-width: 768px) 100vw, 360px"
      className="object-cover transition-transform duration-500 ease-out group-hover:scale-108"
      onError={() => {
        if (src !== fallback) {
          setSrc(fallback);
        }
      }}
    />
  );
}

function SidebarPhotoCard({ photo, index, language }: { photo: any; index: number; language: string }) {
  return (
    <Link
      href={`/photos/${photo.id}`}
      className="group relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-card border border-border/20 shadow-xs cursor-pointer block select-none transition-transform duration-300 hover:-translate-y-0.5"
    >
      <SidebarPhotoCardImage
        src={photo.image}
        alt={photo.titleGu || photo.title || 'ફોટો ગેલેરી'}
        index={index}
      />
      {/* Top subtle ambient shadow */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

      {/* Dark subtle gradient overlay at bottom for clear text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />

      {/* Top-Left Red Pill Badge: "ફોટો ગેલેરી" matching homepage */}
      <div className="absolute top-2.5 left-2.5 z-10">
        <span className="bg-[#B3121B] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-xs select-none">
          {language === 'gu' ? 'ફોટો ગેલેરી' : language === 'hi' ? 'फोटो गैलરી' : 'Photo Gallery'}
        </span>
      </div>

      {/* Bottom title text overlaid inside */}
      <div className="absolute inset-x-0 bottom-0 p-3 z-10 pointer-events-none">
        <p className="text-white text-[12.5px] sm:text-[13.5px] font-bold leading-snug line-clamp-2 drop-shadow-md group-hover:text-amber-300 transition-colors">
          {photo.titleGu || photo.title}
        </p>
      </div>
    </Link>
  );
}

export default function VideosPageClient() {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [videoList, setVideoList] = useState<any[]>([]);
  const [shortsList, setShortsList] = useState<any[]>([]);
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [galleryList, setGalleryList] = useState<any[]>([]);
  const { isApk } = useIsApk();
  const [apkModalVideoId, setApkModalVideoId] = useState<string | null>(null);
  const [apkSelectedVideo, setApkSelectedVideo] = useState<any | null>(null);
  const [apkModalMuted, setApkModalMuted] = useState(false);
  const apkModalIframeRef = useRef<HTMLIFrameElement | null>(null);

  const closeApkModal = () => setApkModalVideoId(null);

  const toggleApkModalAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setApkModalMuted((prev) => {
      const next = !prev;
      try {
        apkModalIframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: next ? 'mute' : 'unMute', args: '' }),
          '*'
        );
        if (!next) {
          apkModalIframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }),
            '*'
          );
        }
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    getPublicVideos('video').then((res) => {
      setVideoList(res || []);
    });
    getPublicVideos('short').then((res) => {
      setShortsList(res || []);
    });
    getPublicArticles({ limit: 50, sort: 'latest' }).then((res) => {
      if (res?.articles?.length > 0) {
        setArticlesList(res.articles);
      }
    });
    getPublicGallery({ limit: 60 }).then((res) => {
      if (res && res.length > 0) {
        setGalleryList(res);
      }
    });
  }, []);

  // Strict deduplication by youtubeId
  const cleanVideos = useMemo(() => {
    const seen = new Set<string>();
    const result: any[] = [];
    for (const item of videoList) {
      const key = item.youtubeId?.trim() || item.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    return result;
  }, [videoList]);

  // Tab definitions
  const tabs = [
    { key: 'video', gu: 'તાજા વીડિયો', hi: 'ताजा वीडियो', en: 'Latest Videos' },
    { key: 'short', gu: 'શોર્ટ્સ', hi: 'शॉर्ट्स', en: 'Shorts' },
    { key: 'exclusive', gu: 'એક્સક્લુઝિવ તપાસ', hi: 'एक्सक्लूसिव जांच', en: 'Exclusive investigation' },
    { key: 'bulletin', gu: 'ન્યૂઝ બુલેટિન', hi: 'न्यूज़ बुलेटिन', en: 'News Bulletin' },
  ] as const;

  // Handle category smooth scroll navigation
  const handleTabChange = (key: TabType) => {
    setActiveTab(key);
    const element = document.getElementById(key);
    if (element) {
      const headerOffset = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Dynamic featured video from latest YouTube video (Top 1)
  const featuredVideo = useMemo(() => {
    if (cleanVideos.length > 0) {
      const top = cleanVideos[0];
      return {
        id: top.id,
        youtubeId: top.youtubeId,
        title: top.title,
        titleGu: top.titleGu || top.title,
        titleHi: top.titleHi || top.title,
        thumbnail: top.thumbnail || `https://img.youtube.com/vi/${safeYouTubeId(top.youtubeId)}/maxresdefault.jpg`,
        duration: top.duration || '10:00',
        views: top.views ? formatViews(top.views) : '46K',
        type: top.type || 'video',
      };
    }
    return {
      id: 'f1',
      youtubeId: 'ituhQR8gwas',
      title: 'Gujarat Post News Live',
      titleGu: 'ગુજરાત પોસ્ટ ન્યૂઝ — તાજા સમાચાર',
      titleHi: 'गुजरात पोस्ट न्यूज़ — ताजा समाचार',
      thumbnail: 'https://i.ytimg.com/vi/ituhQR8gwas/hqdefault.jpg',
      duration: '16:17',
      views: '46K',
      type: 'video',
    };
  }, [cleanVideos]);

  // Top 20 latest videos from YouTube (excluding the active featured video to avoid duplicate on page)
  const latestVideos = useMemo(() => {
    if (cleanVideos.length <= 1) return cleanVideos;
    return cleanVideos.filter((v) => v.youtubeId !== featuredVideo.youtubeId).slice(0, 20);
  }, [cleanVideos, featuredVideo.youtubeId]);

  const shortsVideos = useMemo(() => {
    if (shortsList.length > 0) {
      const seen = new Set<string>();
      const list: any[] = [];
      for (const s of shortsList) {
        const key = s.youtubeId?.trim() || s.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          list.push({
            id: s.id,
            youtubeId: s.youtubeId,
            titleGu: s.titleGu || s.title,
            hash: '#GujaratPost',
            thumbnail: s.thumbnail || `https://i.ytimg.com/vi/${s.youtubeId}/frame0.jpg`,
          });
        }
      }
      return list.slice(0, 5);
    }
    return [
      { id: 's1', youtubeId: 'sA6BrUmBXiA', titleGu: 'કઠલાલના ભાજપ નેતાના બખેડા', hash: '#kathlal', thumbnail: '/assets/demo/1.jpg' },
      { id: 's2', youtubeId: 'rQHoqCTiQvI', titleGu: 'કપડવંજ જીઆઈડીસીમાં આત્મહત્યાનો પ્રયાસ', hash: '#kapadvanj', thumbnail: '/assets/demo/4.jpg' },
      { id: 's3', youtubeId: 'WF2Kuec5HV0', titleGu: 'ACB ની કાર્યવાહી, DILR કચેરી', hash: '#acb', thumbnail: '/assets/demo/2.jpg' },
      { id: 's4', youtubeId: 'LDDtOMwdJ_0', titleGu: 'વેનેઝુએલામાં મહાવિનાશ', hash: '#venezuela', thumbnail: '/assets/demo/6.jpg' },
      { id: 's5', youtubeId: '-iXZuFoHqiw', titleGu: 'ભયાનક પૂરની વિડિઓ', hash: '#flood', thumbnail: '/assets/demo/3.jpg' },
    ];
  }, [shortsList]);

  // Distinct videos for exclusive investigation section without duplicating top 20
  const exclusiveVideos = useMemo(() => {
    if (cleanVideos.length > 21) {
      return cleanVideos.slice(21, 29);
    }
    return cleanVideos.slice(8, 16);
  }, [cleanVideos]);



  const popularSidebarVideos = useMemo(() => {
    if (cleanVideos.length >= 6) {
      return cleanVideos.slice(3, 8).map((v) => ({
        id: v.id,
        youtubeId: v.youtubeId,
        titleGu: v.titleGu || v.title,
        thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${safeYouTubeId(v.youtubeId)}/hqdefault.jpg`,
        duration: v.duration || '5:00',
        views: `${formatViews(v.views || 46000)} views`,
      }));
    }
    return [];
  }, [cleanVideos]);

  // Latest news with thumbnail images for right sidebar
  const latestImageArticles = useMemo(() => {
    if (articlesList.length > 0) {
      return articlesList.slice(0, 10);
    }
    return [
      {
        id: 'fa1',
        slug: 'gujarat-monsoon-update',
        title: 'ગુજરાતમાં આગામી 48 કલાક ભારે વરસાદની આગાહી, હવામાન વિભાગનું એલર્ટ',
        titleGu: 'ગુજરાતમાં આગામી 48 કલાક ભારે વરસાદની આગાહી, હવામાન વિભાગનું એલર્ટ',
        category: 'ગુજરાત',
        categoryGu: 'ગુજરાત',
        image: '/assets/demo/1.jpg',
        publishedAt: new Date().toISOString(),
      },
      {
        id: 'fa2',
        slug: 'ahmedabad-metro-expansion',
        title: 'અમદાવાદ મેટ્રો ફેઝ-2 નું કામ ઝડપથી પ્રગતિમાં, ગાંધીનગર સુધી જોડાણ',
        titleGu: 'અમદાવાદ મેટ્રો ફેઝ-2 નું કામ ઝડપથી પ્રગતિમાં, ગાંધીનગર સુધી જોડાણ',
        category: 'શહેરો',
        categoryGu: 'શહેરો',
        image: '/assets/demo/2.jpg',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'fa3',
        slug: 'gujarat-education-policy-update',
        title: 'શિક્ષણ વિભાગ દ્વારા નવી નીતિ જાહેર: ધોરણ 1 થી 8 ના અભ્યાસક્રમમાં ફેરફાર',
        titleGu: 'શિક્ષણ વિભાગ દ્વારા નવી નીતિ જાહેર: ધોરણ 1 થી 8 ના અભ્યાસક્રમમાં ફેરફાર',
        category: 'શિક્ષણ',
        categoryGu: 'શિક્ષણ',
        image: '/assets/demo/3.jpg',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'fa4',
        slug: 'gujarat-police-cyber-crime-drive',
        title: 'સાયબર ક્રાઇમ સામે ગુજરાત પોલીસનું મોટું અભિયાન, 15 આરોપીઓની ધરપકડ',
        titleGu: 'સાયબર ક્રાઇમ સામે ગુજરાત પોલીસનું મોટું અભિયાન, 15 આરોપીઓની ધરપકડ',
        category: 'ક્રાઈમ',
        categoryGu: 'ક્રાઈમ',
        image: '/assets/demo/4.jpg',
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
      },
      {
        id: 'fa5',
        slug: 'vadodara-croc-viral-video',
        title: 'વડોદરામાં સ્કૂટર પર મગરને લઇને જતા બે યુવકોનો વીડિયો વાઇરલ, જાણો શું હતો મામલો',
        titleGu: 'વડોદરામાં સ્કૂટર પર મગરને લઇને જતા બે યુવકોનો વીડિયો વાઇરલ, જાણો શું હતો મામલો',
        category: 'ગુજરાત',
        categoryGu: 'ગુજરાત',
        image: '/assets/demo/5.jpg',
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
      },
      {
        id: 'fa6',
        slug: 'ic-814-kandahar-hijack-film',
        title: 'IC 814 કંદહાર હાઇજેક ફિલ્મમાં આતંકવાદીઓના નામ હિન્દુ પરથી, વિવાદ વકર્યો',
        titleGu: 'IC 814 કંદહાર હાઇજેક ફિલ્મમાં આતંકવાદીઓના નામ હિન્દુ પરથી, વિવાદ વકર્યો',
        category: 'મનોરંજન',
        categoryGu: 'મનોરંજન',
        image: '/assets/demo/6.jpg',
        publishedAt: new Date(Date.now() - 18000000).toISOString(),
      },
      {
        id: 'fa7',
        slug: 'health-masala-powder-acidity',
        title: 'આ મસાલા પાઉડર ગેસ અને એસિડિટીને શાંત કરીને પેટને ઠંડક આપશે, માત્ર 2 ચમચી',
        titleGu: 'આ મસાલા પાઉડર ગેસ અને એસિડિટીને શાંત કરીને પેટને ઠંડક આપશે, માત્ર 2 ચમચી',
        category: 'હેલ્થ',
        categoryGu: 'હેલ્થ',
        image: '/assets/demo/1.jpg',
        publishedAt: new Date(Date.now() - 21600000).toISOString(),
      },
      {
        id: 'fa8',
        slug: 'ed-raid-aap-mla-amanatullah',
        title: 'ED એ AAP ના ધારાસભ્ય અમાનતુલ્લા ખાનના ઓખલા સ્થિત ઘર પર દરોડા પાડ્યાં',
        titleGu: 'ED એ AAP ના ધારાસભ્ય અમાનતુલ્લા ખાનના ઓખલા સ્થિત ઘર પર દરોડા પાડ્યાં',
        category: 'દેશ',
        categoryGu: 'દેશ',
        image: '/assets/demo/2.jpg',
        publishedAt: new Date(Date.now() - 25200000).toISOString(),
      },
    ] as unknown as Article[];
  }, [articlesList]);

  // Latest 4 photos from the Photo Gallery API
  const latestPhotos = useMemo(() => {
    // 1. Filter real photo gallery items from getPublicGallery
    const realUploadPhotos = galleryList.filter(
      (p: any) => p && (p.category === 'ફોટો ગેલેરી' || p.categoryGu === 'ફોટો ગેલેરી' || (p.src && p.src.startsWith('/uploads/')))
    );

    const pool = realUploadPhotos.length > 0 ? realUploadPhotos : galleryList;

    if (pool.length > 0) {
      return pool.slice(0, 4).map((item, idx) => ({
        id: item.id || `photo-${idx}`,
        title: item.captionGu || item.caption || item.alt || 'ફોટો ગેલેરી',
        titleGu: item.captionGu || item.caption || item.alt || 'ફોટો ગેલેરી',
        titleHi: item.captionHi || item.caption || 'फोटो गैलरी',
        image: item.src || item.image || FALLBACK_PHOTO_IMAGES[idx % FALLBACK_PHOTO_IMAGES.length],
        time: item.createdAt || new Date(Date.now() - (idx + 1) * 3600000 * 4).toISOString(),
      }));
    }

    // Default 4 real photo gallery items matching Gujarat Post homepage
    return [
      {
        id: '9021623f-bec3-4046-9283-95d5b65f1a63',
        title: 'મોનાલિસાની ગ્લેમરસ અદા જોઇ ફેન્સ દિવાના બન્યાં',
        titleGu: 'મોનાલિસાની ગ્લેમરસ અદા જોઇ ફેન્સ દિવાના બન્યાં',
        image: '/uploads/monalisha2.jpg',
      },
      {
        id: '2ec6d55b-81f2-4d39-8806-49f8284d9c57',
        title: 'ઇશા સિંહનો ડીપનેક ડ્રેસમાં હોટ લુક',
        titleGu: 'ઇશા સિંહનો ડીપનેક ડ્રેસમાં હોટ લુક',
        image: '/uploads/àª\x87àª¶àª¾-àª¸àª¿àª\x82àª¹3.jpg',
      },
      {
        id: '73b5b1a7-92cf-4db9-ae22-004583cd2368',
        title: 'પલક તિવારીનો ઓફ શોલ્ડર આઉટફીટનો ગ્લેમરસ લૂક',
        titleGu: 'પલક તિવારીનો ઓફ શોલ્ડર આઉટફીટનો ગ્લેમરસ લૂક',
        image: '/uploads/palak-tiwari21.jpg',
      },
      {
        id: 'b7efd181-7557-4edc-903e-85bcdc549aea',
        title: 'ગ્રીન સાડીમાં ઈશિતા રાજ લાગી રહી છે ગોર્જિયસ',
        titleGu: 'ગ્રીન સાડીમાં ઈશિતા રાજ લાગી રહી છે ગોર્જિયસ',
        image: '/uploads/àª\x88àª¶àª¿àª¤àª¾-àª°àª¾àª\x9C1.jpg',
      },
    ];
  }, [galleryList]);

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-screen-xl px-4 py-6">

        {/* ── YOUTUBE VERIFIED CHANNEL BANNER CARD ─────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-[#9E0F0F] text-white p-6 md:p-8 mb-6 shadow-md border border-red-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">

            {/* Left side: Avatar + info */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-6 min-w-0">
              {/* White rounded avatar logo */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center p-1.5 shrink-0 shadow-inner">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
                  <Image
                    src="/assets/demo/logo.png"
                    alt="Gujarat Post Logo"
                    fill
                    className="object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-700 via-rose-600 to-amber-500 text-white font-black text-2xl select-none">
                    GP
                  </span>
                </div>
              </div>

              {/* Title / Handle / Description */}
              <div className="text-center md:text-left min-w-0">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">ગુજરાત પોસ્ટ</h1>
                  <span className="flex items-center justify-center bg-white/20 text-white rounded-full p-0.5" title="Verified Channel">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </span>
                </div>
                <p className="mt-2 text-xs md:text-[13px] font-semibold opacity-90 leading-none">
                  @GujaratPost · 4.2M સબસ્ક્રાઇબર્સ · 3,240 વિડિયો
                </p>
                <p className="mt-3 text-xs leading-relaxed max-w-xl opacity-80 font-semibold line-clamp-2 md:line-clamp-none">
                  ગુજરાતના તાજા સમાચાર, બ્રેકિંગ ન્યૂઝ, એક્સક્લુઝિવ તપાસ અહેવાલ અને ખાસ કાર્યક્રમો — સૌથી પહેલા, સૌથી ઝડપી. અમારી યુટ્યુબ ચેનલ સબસ્ક્રાઇબ કરો.
                </p>
              </div>
            </div>

            {/* Right side: Subscribe buttons */}
            <div className="flex flex-row gap-3 shrink-0 self-center mt-2 md:mt-0">
              <a
                href="https://www.youtube.com/@Gujaratpostnews?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-black font-black text-xs md:text-sm px-5 py-2.5 rounded-full hover:bg-slate-100 hover:scale-102 transition-all shadow cursor-pointer select-none active:scale-[0.98]"
              >
                <Bell className="h-4 w-4 shrink-0 fill-current" />
                <span>સબસ્ક્રાઇબ કરો</span>
              </a>
              <a
                href="https://www.youtube.com/@Gujaratpostnews"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-black/20 hover:bg-black/35 border border-white/25 text-white font-black text-xs md:text-sm px-5 py-2.5 rounded-full hover:scale-102 transition-all cursor-pointer select-none active:scale-[0.98]"
              >
                <Play className="h-4 w-4 shrink-0 fill-current" />
                <span>YouTube પર જુઓ</span>
              </a>
            </div>

          </div>
        </div>

        {/* ── FILTER PILLS NAVIGATION ───────────────────────────────────── */}
        <div className="flex gap-2.5 overflow-x-auto scrollbar-none mb-6 pb-1">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`rounded-full px-5 py-2 text-xs font-black whitespace-nowrap transition cursor-pointer ${active
                    ? 'bg-accent text-white font-black border border-accent'
                    : 'border border-border bg-card text-foreground hover:border-accent hover:text-accent font-semibold'
                  }`}
              >
                {getLocalized(language, { en: tab.en, gu: tab.gu, hi: tab.hi })}
              </button>
            );
          })}
        </div>

        {/* ── CONTENT GRID + SIDEBAR ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

          {/* ── LEFT COLUMN: Featured & Sections ──────────────────────────── */}
          <div className="min-w-0">

            {/* Featured Video Player Box */}
            <div className="p-4 bg-card border border-border rounded-xl mb-8 shadow-sm">
              <div className="flex flex-col md:flex-row gap-5">
                <div className="relative aspect-video w-full md:w-3/5 shrink-0 rounded-lg overflow-hidden bg-black shadow-sm group">
                  {playingVideoId === featuredVideo.id ? (
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.youtube.com/embed/${safeYouTubeId(featuredVideo.youtubeId)}?enablejsapi=1&autoplay=1&controls=1&mute=0&rel=0&playsinline=1&modestbranding=1`}
                      title={featuredVideo.titleGu}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : (
                    <div className="relative w-full h-full cursor-pointer" onClick={() => { if (isApk) { setApkModalVideoId(safeYouTubeId(featuredVideo.youtubeId)); setApkSelectedVideo(featuredVideo); } else { setPlayingVideoId(featuredVideo.id); } }}>
                      <Image
                        src={featuredVideo.thumbnail}
                        alt={featuredVideo.titleGu}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-103"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/15 transition-all">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-accent shadow-md transition-transform group-hover:scale-110">
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </span>
                      </div>
                      <span className="absolute bottom-2.5 right-2.5 rounded bg-black/80 px-2 py-0.5 text-xs font-bold text-white tracking-wider">
                        {featuredVideo.duration}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center min-w-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-accent uppercase tracking-wider">
                    <Radio className="h-3 w-3 fill-current animate-pulse text-accent" />
                    યુટ્યુબ પર હમણાં
                  </span>
                  <h2 className="mt-1 text-base md:text-lg font-black leading-snug tracking-tight text-foreground line-clamp-3">
                    {featuredVideo.titleGu}
                  </h2>
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">
                    👁 {featuredVideo.views} views · {featuredVideo.duration}
                  </p>
                </div>
              </div>
            </div>

            {/* ── SECTION 1: LATEST VIDEOS ─────────────────────────────── */}
            <section id="video" className="mb-2 pt-4">
              <div className="flex items-center gap-2.5 mb-5 pb-2 border-b-2 border-border">
                <span className="w-2.5 h-5 bg-accent rounded-sm inline-block shrink-0" />
                <h3 className="text-base md:text-lg font-black text-foreground uppercase tracking-wider">
                  તાજા વીડિયો
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                {latestVideos.map((item) => (
                  <div key={item.id} className="group flex flex-col">
                    <div className="relative aspect-video w-full rounded-md overflow-hidden bg-black shadow-sm group">
                      {playingVideoId === item.id ? (
                        <iframe
                          className="absolute inset-0 h-full w-full"
                          src={`https://www.youtube.com/embed/${safeYouTubeId(item.youtubeId)}?enablejsapi=1&autoplay=1&controls=1&mute=0&rel=0&playsinline=1&modestbranding=1`}
                          title={getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      ) : (
                        <div className="relative w-full h-full cursor-pointer" onClick={() => { if (isApk) { setApkModalVideoId(safeYouTubeId(item.youtubeId)); setApkSelectedVideo(item); } else { setPlayingVideoId(item.id); } }}>
                          <Image
                            src={item.thumbnail}
                            alt={getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-103"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-accent shadow-sm transition-transform group-hover:scale-110">
                              <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                            </span>
                          </div>
                          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {item.duration}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 min-w-0">
                      <h4 className="text-[12.5px] md:text-[13px] font-bold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-2">
                        {getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
                      </h4>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <span className="text-accent">▶</span>
                        <span>Gujarat Post</span>
                        <span>·</span>
                        <span>{toGu(formatViews(item.views))} views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div> {/* CLOSE LEFT COLUMN */}

          {/* ── RIGHT COLUMN: Sidebar ───────────────────────────────────── */}
          <div className="sticky top-4 self-start">

            <div className="group rounded-xl border border-red-100 dark:border-red-950/20 bg-gradient-to-br from-red-50/10 to-red-50/30 dark:from-red-950/5 dark:to-red-950/10 p-5 mb-6 text-center shadow-sm hover:shadow transition-all duration-300">
              <div className="flex items-center justify-center gap-2 text-accent font-black text-[13px] uppercase tracking-wide mb-2.5">
                <YoutubeIcon className="h-6 w-6 text-[#FF0000] drop-shadow-sm transition-transform duration-300 group-hover:scale-105" />
                <span>ગુજરાત પોસ્ટ યુટ્યુબ ચેનલ</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground font-semibold px-1 mb-4 leading-normal">
                તમામ વીડિયો, બુલેટિન અને એક્સક્લુઝિવ તપાસ — એક જ જગ્યાએ, ગમે ત્યારે નિહાળો.
              </p>
              <a
                href="https://www.youtube.com/@Gujaratpostnews?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#E62117] hover:bg-[#CC181E] text-white font-black text-sm py-2.5 rounded-xl transition-all hover:scale-102 shadow hover:shadow-md cursor-pointer select-none active:scale-[0.98]"
              >
                <Bell className="h-4 w-4 fill-current shrink-0" />
                <span>સબસ્ક્રાઇબ કરો</span>
              </a>
            </div>

            {/* ── 1. POPULAR VIDEOS (લોકપ્રિય વીડિયો) ── */}
            <div>
              <div className="flex items-center gap-2 mb-3.5 pb-2 border-b-2 border-border">
                <span className="w-2 h-4.5 bg-accent rounded-sm inline-block shrink-0" />
                <span className="text-sm font-black text-foreground">
                  લોકપ્રિય વીડિયો
                </span>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {popularSidebarVideos.map((item, i) => (
                  <div
                    key={item.id}
                    className="group flex items-start gap-3 py-3 first:pt-1 last:pb-1"
                  >
                    <span
                      className="text-[20px] sm:text-[22px] font-extrabold leading-none select-none w-6 shrink-0 text-center mt-1"
                      style={{
                        fontVariantNumeric: 'tabular-nums',
                        color: 'transparent',
                        WebkitTextStroke: '1.5px var(--ink-3)'
                      }}
                    >
                      {toGu(i + 1)}
                    </span>

                    {/* Video Thumbnail with play icon */}
                    <div
                      className="relative w-22 h-14 sm:w-24 sm:h-15 aspect-video shrink-0 rounded-md overflow-hidden bg-black shadow-xs cursor-pointer group/thumb"
                      onClick={() => {
                        if (isApk) {
                          setApkModalVideoId(safeYouTubeId(item.youtubeId));
                          setApkSelectedVideo(item);
                        } else {
                          setPlayingVideoId(item.id);
                        }
                      }}
                    >
                      {playingVideoId === item.id ? (
                        <iframe
                          className="absolute inset-0 h-full w-full"
                          src={`https://www.youtube.com/embed/${safeYouTubeId(item.youtubeId)}?enablejsapi=1&autoplay=1&controls=1&mute=0&rel=0&playsinline=1&modestbranding=1`}
                          title={item.titleGu}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      ) : (
                        <>
                          <Image
                            src={item.thumbnail || `https://i.ytimg.com/vi/${safeYouTubeId(item.youtubeId)}/hqdefault.jpg`}
                            alt={item.titleGu}
                            fill
                            sizes="(max-width: 768px) 100px, 120px"
                            className="object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover/thumb:bg-black/10 transition-all">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-xs transition-transform group-hover/thumb:scale-110">
                              <Play className="h-3 w-3 fill-current ml-0.5" />
                            </span>
                          </div>
                          {item.duration && (
                            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[8px] font-bold text-white leading-tight">
                              {item.duration}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Video Title + Views */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <a
                        href={item.youtubeId ? `https://www.youtube.com/watch?v=${item.youtubeId}` : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12.5px] font-bold leading-snug text-foreground/95 group-hover:text-accent transition-colors line-clamp-2"
                        title={item.titleGu}
                      >
                        {item.titleGu}
                      </a>
                      <span className="text-[10px] font-semibold text-muted-foreground mt-1 flex items-center gap-1">
                        <span className="text-accent">▶</span>
                        <span>{item.views}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 2. PHOTO GALLERY (ફોટો ગેલેરી) - 6 IMAGES ── */}
            <div className="mt-4 pt-3 border-t-2 border-border">
              <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b-[2.5px] border-slate-900 dark:border-white/20">
                <span className="bg-[#B3121B] text-white px-3.5 py-1.5 text-xs md:text-sm font-black rounded-lg tracking-tight shadow-xs select-none leading-none">
                  {language === 'gu' ? 'ફોટો ગેલેરી' : language === 'hi' ? 'फोटो गैलરી' : 'Photo Gallery'}
                </span>
                <Link
                  href="/photos"
                  className="text-xs md:text-[13px] font-extrabold text-[#B3121B] hover:text-red-700 hover:underline flex items-center gap-1 transition-colors"
                >
                  <span>{language === 'gu' ? 'વધુ ફોટો ગેલેરી' : 'More Photo Gallery'}</span>
                  <span>→</span>
                </Link>
              </div>

              {/* Photo Gallery: 3 Larger Images (1 per row, full width) */}
              <div className="flex flex-col gap-2.5">
                {latestPhotos.slice(0, 3).map((photo, idx) => (
                  <SidebarPhotoCard
                    key={photo.id || idx}
                    photo={photo}
                    index={idx}
                    language={language}
                  />
                ))}
              </div>
            </div>

            {/* ── 3. LATEST NEWS (તાજા સમાચાર) ── */}
            <div className="mt-3 pt-2.5 border-t-2 border-border">
              <div className="flex items-center justify-between mb-3.5 pb-2 border-b-2 border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4.5 bg-accent rounded-sm inline-block shrink-0" />
                  <span className="text-sm font-black text-foreground">
                    {language === 'gu' ? 'તાજા સમાચાર' : language === 'hi' ? 'ताज़ा समाचार' : 'Latest News'}
                  </span>
                </div>
                <Link href="/category/latest" className="text-xs font-bold text-accent hover:underline">
                  {language === 'gu' ? 'વધુ જુઓ →' : 'View all →'}
                </Link>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {latestImageArticles.slice(0, 4).map((art) => (
                  <Link
                    key={art.id}
                    href={`/news/${art.slug}`}
                    className="group flex items-start gap-3 py-2.5 first:pt-1 last:pb-0"
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[10px] font-black text-accent uppercase tracking-wider line-clamp-1">
                        {getCategoryLabel(art, language)}
                      </span>
                      <h4 className="text-[13.5px] font-bold leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2 mt-0.5">
                        <AutoArticleTitle article={art} language={language} />
                      </h4>
                      <span className="text-[10px] font-semibold text-muted-foreground mt-1">
                        {timeAgo(art.publishedAt || (art as any).createdAt, language)}
                      </span>
                    </div>
                    <div className="relative w-24 h-18 sm:w-28 sm:h-20 shrink-0 self-start rounded-lg overflow-hidden bg-muted border border-border/40">
                      <img
                        src={(art as any).featuredImage || art.image || (art as any).thumbnail || '/assets/gujarat-post-logo.png'}
                        alt={art.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/gujarat-post-logo.png'; }}
                        loading="lazy"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div> {/* CLOSE FIRST GRID */}

        {/* ── FULL WIDTH SECTIONS BELOW SIDEBAR ────────────────────────────── */}
        <div className="mt-2 border-t border-border pt-2">

          {/* ── SECTION 2: SHORTS ────────────────────────────────────── */}
          <section id="short" className="mb-4 pt-0">
            <div className="flex items-center gap-2.5 mb-3 pb-1.5 border-b-2 border-border">
              <span className="w-2.5 h-5 bg-accent rounded-sm inline-block shrink-0" />
              <h3 className="text-base md:text-lg font-black text-foreground uppercase tracking-wider">
                શોર્ટ્સ
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {shortsVideos.map((item) => (
                <a
                  key={item.id}
                  href={`https://www.youtube.com/watch?v=${item.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-[9/16] w-full rounded-lg overflow-hidden bg-black shadow-sm cursor-pointer"
                >
                  <Image
                    src={item.thumbnail}
                    alt={item.titleGu}
                    fill
                    sizes="(max-width: 768px) 50vw, 15vw"
                    className="object-cover opacity-85 transition-transform duration-300 group-hover:scale-105 group-hover:opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur mb-2 transition-transform group-hover:scale-110 self-start">
                      <Play className="h-3 w-3 fill-current ml-0.5" />
                    </span>
                    <h4 className="text-[11px] font-bold leading-snug text-white line-clamp-2">
                      {item.titleGu}
                    </h4>
                    <span className="text-[9px] font-black text-accent mt-0.5">
                      {item.hash}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* ── SECTION 3: EXCLUSIVE INVESTIGATIONS ─────────────────── */}
          <section id="exclusive" className="mb-5 pt-2">
            <div className="flex items-center gap-2.5 mb-5 pb-2 border-b-2 border-border">
              <span className="w-2.5 h-5 bg-accent rounded-sm inline-block shrink-0" />
              <h3 className="text-base md:text-lg font-black text-foreground uppercase tracking-wider">
                એક્સક્લુઝિવ તપાસ
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-6">
              {exclusiveVideos.map((item: any) => (
                <div key={item.id} className="group flex flex-col">
                  <div className="relative aspect-video w-full rounded-md overflow-hidden bg-black shadow-sm group">
                    {playingVideoId === item.id ? (
                      <iframe
                        className="absolute inset-0 h-full w-full"
                        src={`https://www.youtube.com/embed/${safeYouTubeId(item.youtubeId)}?enablejsapi=1&autoplay=1&controls=1&mute=0&rel=0&playsinline=1&modestbranding=1`}
                        title={getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <div className="relative w-full h-full cursor-pointer" onClick={() => { if (isApk) { setApkModalVideoId(safeYouTubeId(item.youtubeId)); setApkSelectedVideo(item); } else { setPlayingVideoId(item.id); } }}>
                        <Image
                          src={item.thumbnail}
                          alt={getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-103"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-accent shadow-sm transition-transform group-hover:scale-110">
                            <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                          </span>
                        </div>
                        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {item.duration}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5 min-w-0">
                    <h4 className="text-[12.5px] md:text-[13px] font-bold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-2">
                      {getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
                    </h4>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      <span className="text-accent">▶</span>
                      <span>Gujarat Post</span>
                      <span>·</span>
                      <span>{toGu(formatViews(item.views))} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

      </div>

      {/* APK: YouTube-style video player (player at top + related below) */}
      {isApk && apkModalVideoId && (
        <ApkVideoPlayer
          videoId={apkModalVideoId}
          initialVideo={apkSelectedVideo}
          allVideos={cleanVideos.filter((v) => v.youtubeId !== apkModalVideoId).slice(0, 20)}
          onClose={() => { setApkModalVideoId(null); setApkSelectedVideo(null); }}
          onSelectVideo={(ytId, video) => { setApkModalVideoId(ytId); setApkSelectedVideo(video || null); }}
        />
      )}
    </div>
  );
}

