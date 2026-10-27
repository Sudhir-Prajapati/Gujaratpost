'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, Play, Bell, Radio, X, Volume2, VolumeX, Camera, ChevronRight, ChevronDown } from 'lucide-react';
import { formatViews, getLocalized, getCategoryLabel } from '@/data';
import { getPublicVideos, getPublicArticles, getPublicGallery } from '@/lib/api';
import { safeYouTubeId } from '@/lib/youtube';
import { useApp } from '@/components/AppProvider';
import { useIsApk } from '@/lib/useIsApk';
import ApkVideoPlayer from '@/components/apk/ApkVideoPlayer';
import { toGu } from '@/lib/utils';
import type { Article } from '@/types';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';

type TabType = 'video' | 'short' | 'latest';

function timeAgo(dateStr?: string, language = 'gu'): string {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return language === 'gu' ? 'હમણાં જ' : language === 'hi' ? 'अभी' : 'Just now';
  if (diff < 60) return language === 'gu' ? `${diff} મિનિટ પહેલા` : language === 'hi' ? `${diff} मिनट पहले` : `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return language === 'gu' ? `${h} કલાક પહેલા` : language === 'hi' ? `${h} घंटे पहले` : `${h}h ago`;
  return language === 'gu' ? `${Math.floor(h / 24)} દિવસ પહેલા` : language === 'hi' ? `${Math.floor(h / 24)} दिन पहले` : `${Math.floor(h / 24)}d ago`;
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
      className="group relative h-[280px] md:h-[350px] w-full rounded-2xl overflow-hidden bg-card border border-border/20 shadow-xs cursor-pointer block select-none transition-transform duration-300 hover:-translate-y-0.5"
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
          {language === 'gu' ? 'ફોટો ગેલેરી' : language === 'hi' ? 'फोटो गैलरी' : 'Photo Gallery'}
        </span>
      </div>

      {/* Bottom title text overlaid inside */}
      <div className="absolute inset-x-0 bottom-0 p-3 z-10 pointer-events-none">
        <p className="text-white text-[12.5px] sm:text-[13.5px] font-bold leading-snug line-clamp-2 drop-shadow-md group-hover:text-amber-300 transition-colors">
          <AutoTranslateString text={photo.titleGu || photo.title || ''} language={language as any} />
        </p>
      </div>
    </Link>
  );
}

export default function VideosPageClient() {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [playingVideoId] = useState<string | null>(null);
  const [videoList, setVideoList] = useState<any[]>([]);
  const [shortsList, setShortsList] = useState<any[]>([]);
  const [visibleShortsCount, setVisibleShortsCount] = useState(5);
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [visibleLatestNewsCount, setVisibleLatestNewsCount] = useState(8);
  const [galleryList, setGalleryList] = useState<any[]>([]);
  const { isApk } = useIsApk();
  const [apkModalVideoId, setApkModalVideoId] = useState<string | null>(null);
  const [apkSelectedVideo, setApkSelectedVideo] = useState<any | null>(null);
  const [apkModalMuted, setApkModalMuted] = useState(false);
  const apkModalIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Left column ref & height measurement for flexible dynamic right sidebar alignment
  const leftColRef = useRef<HTMLDivElement>(null);
  const [leftColHeight, setLeftColHeight] = useState<number>(0);

  useEffect(() => {
    const el = leftColRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setLeftColHeight(Math.round(entry.contentRect.height));
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
      } catch { }
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
    { key: 'video', gu: 'લેટેસ્ટ વીડિયો', hi: 'लेटेस्ट वीडियो', en: 'Latest Videos' },
    { key: 'short', gu: 'શોર્ટ્સ', hi: 'शॉर्ट्स', en: 'Shorts' },
    { key: 'latest', gu: 'લેટેસ્ટ સમાચાર', hi: 'लेटेस्ट समाचार', en: 'Latest News' },
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
      titleGu: 'ગુજરાત પોસ્ટ ન્યૂઝ — લેટેસ્ટ સમાચાર',
      titleHi: 'गुजरात पोस्ट न्यूज़ — ताजा समाचार',
      thumbnail: 'https://i.ytimg.com/vi/ituhQR8gwas/hqdefault.jpg',
      duration: '16:17',
      views: '46K',
      type: 'video',
    };
  }, [cleanVideos]);

  // Top 21 latest videos from YouTube (excluding the active featured video to avoid duplicate on page)
  const latestVideos = useMemo(() => {
    if (cleanVideos.length <= 1) return cleanVideos;
    const filtered = cleanVideos.filter((v) => v.youtubeId !== featuredVideo.youtubeId);
    if (filtered.length % 3 !== 0) {
      const missingCount = 3 - (filtered.length % 3);
      const usedIds = new Set(filtered.map((v) => v.id || v.youtubeId));
      const candidates = cleanVideos.filter((v) => !usedIds.has(v.id || v.youtubeId));
      if (candidates.length >= missingCount) {
        filtered.push(...candidates.slice(0, missingCount));
      }
    }
    return filtered.slice(0, 21);
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
      return list;
    }
    return [
      { id: 's1', youtubeId: 'sA6BrUmBXiA', titleGu: 'કઠલાલના ભાજપ નેતાના બખેડા', hash: '#kathlal', thumbnail: '/assets/demo/1.jpg' },
      { id: 's2', youtubeId: 'rQHoqCTiQvI', titleGu: 'કપડવંજ જીઆઈડીસીમાં આત્મહત્યાનો પ્રયાસ', hash: '#kapadvanj', thumbnail: '/assets/demo/4.jpg' },
      { id: 's3', youtubeId: 'WF2Kuec5HV0', titleGu: 'ACB ની કાર્યવાહી, DILR કચેરી', hash: '#acb', thumbnail: '/assets/demo/2.jpg' },
      { id: 's4', youtubeId: 'LDDtOMwdJ_0', titleGu: 'વેનેઝુએલામાં મહાવિનાશ', hash: '#venezuela', thumbnail: '/assets/demo/6.jpg' },
      { id: 's5', youtubeId: '-iXZuFoHqiw', titleGu: 'ભયાનક પૂરની વિડિઓ', hash: '#flood', thumbnail: '/assets/demo/3.jpg' },
    ];
  }, [shortsList]);

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
      return articlesList;
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
        image: '/uploads/ઇશા-સિંહ3.jpg',
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
        image: '/uploads/ઈશિતા-રાજ1.jpg',
      },
    ];
  }, [galleryList]);

  // Dynamic flexible counts for right sidebar so its height matches the left column
  const sidebarCounts = useMemo(() => {
    // If not measured yet or on small screen, provide balanced defaults
    if (!leftColHeight || leftColHeight <= 600) {
      return { popularCount: 4, photoCount: 2, newsCount: 2 };
    }

    const bannerH = 204;
    const popularHeaderH = 36;
    const popularItemH = 72;
    const photoHeaderH = 46;
    const photoItemH = 360; // 350px card + 10px gap
    const newsHeaderH = 36;
    const newsItemH = 85;

    let photoCount = 1;
    let popularCount = 3;
    let newsCount = 0;

    let currentH = bannerH + popularHeaderH + (3 * popularItemH) + photoHeaderH + photoItemH;
    let remaining = leftColHeight - currentH;

    // Can we add 2nd photo?
    if (remaining >= photoItemH) {
      photoCount = 2;
      remaining -= photoItemH;
    }

    // Can we add 4th popular video?
    if (remaining >= popularItemH) {
      popularCount = 4;
      remaining -= popularItemH;
    }

    // Can we add 3rd photo?
    if (remaining >= photoItemH + 60) {
      photoCount = 3;
      remaining -= photoItemH;
    }

    // Can we add news articles?
    if (remaining >= newsHeaderH + newsItemH) {
      remaining -= newsHeaderH;
      newsCount = Math.min(4, Math.max(1, Math.floor(remaining / newsItemH)));
      remaining -= (newsCount * newsItemH);
    }

    // If extra room and popularCount < 5:
    if (remaining >= popularItemH && popularCount < 5) {
      popularCount = 5;
    }

    return { popularCount, photoCount, newsCount };
  }, [leftColHeight]);

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
                  <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">
                    {getLocalized(language, { en: 'Gujarat Post', gu: 'ગુજરાત પોસ્ટ', hi: 'गुजरात पोस्ट' })}
                  </h1>
                  <span className="flex items-center justify-center bg-white/20 text-white rounded-full p-0.5" title="Verified Channel">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </span>
                </div>
                <p className="mt-2 text-xs md:text-[13px] font-semibold opacity-90 leading-none">
                  {getLocalized(language, {
                    en: '@GujaratPost · 4.2M Subscribers · 3,240 Videos',
                    gu: '@GujaratPost · 4.2M સબસ્ક્રાઇબર્સ · 3,240 વિડિયો',
                    hi: '@GujaratPost · 4.2M सब्सक्राइबर्स · 3,240 वीडियो',
                  })}
                </p>
                <p className="mt-3 text-xs leading-relaxed max-w-xl opacity-80 font-semibold line-clamp-2 md:line-clamp-none">
                  {getLocalized(language, {
                    en: 'Gujarat\'s latest news, breaking updates, exclusive investigative reports and special programs — first and fastest. Subscribe to our YouTube channel.',
                    gu: 'ગુજરાતના તાજા સમાચાર, બ્રેકિંગ ન્યૂઝ, એક્સક્લુઝિવ તપાસ અહેવાલ અને ખાસ કાર્યક્રમો — સૌથી પહેલા, સૌથી ઝડપી. અમારી યુટ્યુબ ચેનલ સબસ્ક્રાઇબ કરો.',
                    hi: 'गुजरात की ताजा खबरें, ब्रेकिंग न्यूज, एक्सक्लूसिव जांच रिपोर्ट और विशेष कार्यक्रम — सबसे पहले, सबसे तेज। हमारे यूट्यूब चैनल को सब्सक्राइब करें।',
                  })}
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
                <span>{getLocalized(language, { en: 'Subscribe', gu: 'સબસ્ક્રાઇબ કરો', hi: 'सब्सक्राइब करें' })}</span>
              </a>
              <a
                href="https://www.youtube.com/@Gujaratpostnews"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-black/20 hover:bg-black/35 border border-white/25 text-white font-black text-xs md:text-sm px-5 py-2.5 rounded-full hover:scale-102 transition-all cursor-pointer select-none active:scale-[0.98]"
              >
                <Play className="h-4 w-4 shrink-0 fill-current" />
                <span>{getLocalized(language, { en: 'Watch on YouTube', gu: 'YouTube પર જુઓ', hi: 'YouTube पर देखें' })}</span>
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
          <div ref={leftColRef} className="min-w-0">

            {/* Featured Video Player Box */}
            <div className="p-4 bg-card border border-border rounded-xl mb-3 shadow-sm">
              <div className="flex flex-col md:flex-row gap-5">
                <div className="relative aspect-video w-full md:w-3/5 shrink-0 rounded-lg overflow-hidden bg-black shadow-sm group">
                  {playingVideoId === featuredVideo.id ? (
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.youtube-nocookie.com/embed/${safeYouTubeId(featuredVideo.youtubeId)}?enablejsapi=1&autoplay=1&controls=1&mute=0&rel=0&playsinline=1&modestbranding=1`}
                      title={featuredVideo.titleGu}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : (
                    <div className="relative w-full h-full cursor-pointer" onClick={() => { if (isApk) { setApkModalVideoId(safeYouTubeId(featuredVideo.youtubeId)); setApkSelectedVideo(featuredVideo); } else { window.open(`https://www.youtube.com/watch?v=${safeYouTubeId(featuredVideo.youtubeId)}`, '_blank', 'noopener,noreferrer'); } }}>
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

                <div
                  className="flex flex-col justify-center min-w-0 cursor-pointer"
                  onClick={() => {
                    if (isApk) {
                      setApkModalVideoId(safeYouTubeId(featuredVideo.youtubeId));
                      setApkSelectedVideo(featuredVideo);
                    } else {
                      window.open(`https://www.youtube.com/watch?v=${safeYouTubeId(featuredVideo.youtubeId)}`, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-accent uppercase tracking-wider">
                    <Radio className="h-3 w-3 fill-current animate-pulse text-accent" />
                    {getLocalized(language, { en: 'Now on YouTube', gu: 'યુટ્યુબ પર હમણાં', hi: 'यूट्यूब पर अभी' })}
                  </span>
                  <h2 className="mt-1 text-base md:text-lg font-black leading-snug tracking-tight text-foreground hover:text-accent transition-colors line-clamp-3">
                    <AutoTranslateString text={featuredVideo.titleGu || featuredVideo.title || ''} language={language} />
                  </h2>
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">
                    👁 {language === 'gu' ? toGu(featuredVideo.views) : featuredVideo.views} {getLocalized(language, { en: 'views', gu: 'વ્યૂઝ', hi: 'व्यूज' })} · {featuredVideo.duration}
                  </p>
                </div>
              </div>
            </div>

            {/* ── SECTION 1: LATEST VIDEOS ─────────────────────────────── */}
            <section id="video" className="mb-2 pt-0">
              <div className="flex items-center gap-2.5 mb-5 pb-2 border-b-2 border-border">
                <span className="w-2.5 h-5 bg-accent rounded-sm inline-block shrink-0" />
                <h3 className="text-base md:text-lg font-black text-foreground uppercase tracking-wider">
                  {getLocalized(language, { en: 'Latest Videos', gu: 'લેટેસ્ટ વીડિયો', hi: 'लेटेस्ट वीडियो' })}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-x-4 md:gap-y-6">
                {latestVideos.map((item) => (
                  <div
                    key={item.id}
                    className="group flex flex-col cursor-pointer p-3.5 md:p-0 bg-card md:bg-transparent border md:border-0 border-border rounded-xl md:rounded-none shadow-xs md:shadow-none transition-all"
                    onClick={() => {
                      if (isApk) {
                        setApkModalVideoId(safeYouTubeId(item.youtubeId));
                        setApkSelectedVideo(item);
                      } else {
                        window.open(`https://www.youtube.com/watch?v=${safeYouTubeId(item.youtubeId)}`, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    <div className="relative aspect-video w-full rounded-lg md:rounded-md overflow-hidden bg-black shadow-sm group">
                      {playingVideoId === item.id ? (
                        <iframe
                          className="absolute inset-0 h-full w-full"
                          src={`https://www.youtube-nocookie.com/embed/${safeYouTubeId(item.youtubeId)}?enablejsapi=1&autoplay=1&controls=1&mute=0&rel=0&playsinline=1&modestbranding=1`}
                          title={getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      ) : (
                        <div className="relative w-full h-full cursor-pointer">
                          <Image
                            src={item.thumbnail}
                            alt={getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
                            fill
                            sizes="(max-width: 768px) 100vw, 25vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-103"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/15 transition-all">
                            <span className="flex h-11 w-11 md:h-10 md:w-10 items-center justify-center rounded-full bg-white text-accent shadow-sm transition-transform group-hover:scale-110">
                              <Play className="h-5 w-5 md:h-4.5 md:w-4.5 fill-current ml-0.5" />
                            </span>
                          </div>
                          <span className="absolute bottom-2 right-2 md:bottom-1.5 md:right-1.5 rounded bg-black/85 px-2 py-0.5 md:px-1.5 md:py-0.5 text-xs md:text-[10px] font-bold text-white tracking-wide">
                            {item.duration}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 md:mt-2.5 min-w-0">
                      <span className="md:hidden inline-flex items-center gap-1 text-[11px] font-black text-accent uppercase tracking-wider mb-1">
                        <Radio className="h-3 w-3 fill-current animate-pulse text-accent" />
                        યુટ્યુબ પર હમણાં
                      </span>
                      <h4 className="text-[15px] md:text-[13px] font-black md:font-bold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-2">
                        {getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
                      </h4>
                      <div className="mt-2 md:mt-1 flex items-center gap-1.5 text-xs md:text-[10px] font-semibold md:font-bold text-muted-foreground">
                        <span className="text-accent">▶</span>
                        <span>Gujarat Post</span>
                        <span>·</span>
                        <span>{toGu(formatViews(item.views))} views</span>
                        <span className="md:hidden">·</span>
                        <span className="md:hidden">{item.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div> {/* CLOSE LEFT COLUMN */}

          {/* ── RIGHT COLUMN: Sidebar (Flexible to match left column height) ── */}
          <div
            className="sticky top-4 self-start"
          >

            <div className="group rounded-xl border border-red-100 dark:border-red-950/20 bg-gradient-to-br from-red-50/10 to-red-50/30 dark:from-red-950/5 dark:to-red-950/10 p-5 mb-6 text-center shadow-sm hover:shadow transition-all duration-300">
              <div className="flex items-center justify-center gap-2 text-accent font-black text-[13px] uppercase tracking-wide mb-2.5">
                <YoutubeIcon className="h-6 w-6 text-[#FF0000] drop-shadow-sm transition-transform duration-300 group-hover:scale-105" />
                <span>{getLocalized(language, { en: 'Gujarat Post YouTube Channel', gu: 'ગુજરાત પોસ્ટ યુટ્યુબ ચેનલ', hi: 'गुजरात पोस्ट यूट्यूब चैनल' })}</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground font-semibold px-1 mb-4 leading-normal">
                {getLocalized(language, {
                  en: 'All videos, bulletins and exclusive investigations — in one place, watch anytime.',
                  gu: 'તમામ વીડિયો, બુલેટિન અને એક્સક્લુઝિવ તપાસ — એક જ જગ્યાએ, ગમે ત્યારે નિહાળો.',
                  hi: 'सभी वीडियो, बुलेटिन और एक्सक्लूसिव जांच — एक ही जगह, कभी भी देखें।',
                })}
              </p>
              <a
                href="https://www.youtube.com/@Gujaratpostnews?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#E62117] hover:bg-[#CC181E] text-white font-black text-sm py-2.5 rounded-xl transition-all hover:scale-102 shadow hover:shadow-md cursor-pointer select-none active:scale-[0.98]"
              >
                <Bell className="h-4 w-4 fill-current shrink-0" />
                <span>{getLocalized(language, { en: 'Subscribe', gu: 'સબસ્ક્રાઇબ કરો', hi: 'सब्सक्राइब करें' })}</span>
              </a>
            </div>

            {/* ── 1. POPULAR VIDEOS (લોકપ્રિય વીડિયો) ── */}
            <div>
              <div className="flex items-center gap-2 mb-3.5 pb-2 border-b-2 border-border">
                <span className="w-2 h-4.5 bg-accent rounded-sm inline-block shrink-0" />
                <span className="text-sm font-black text-foreground">
                  {getLocalized(language, { en: 'Popular Videos', gu: 'લોકપ્રિય વીડિયો', hi: 'लोकप्रिय वीडियो' })}
                </span>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {popularSidebarVideos.slice(0, sidebarCounts.popularCount).map((item, i) => (
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
                      {language === 'gu' ? toGu(i + 1) : i + 1}
                    </span>

                    {/* Video Thumbnail with play icon */}
                    <div
                      className="relative w-22 h-14 sm:w-24 sm:h-15 aspect-video shrink-0 rounded-md overflow-hidden bg-black shadow-xs cursor-pointer group/thumb"
                      onClick={() => {
                        if (isApk) {
                          setApkModalVideoId(safeYouTubeId(item.youtubeId));
                          setApkSelectedVideo(item);
                        } else {
                          window.open(`https://www.youtube.com/watch?v=${safeYouTubeId(item.youtubeId)}`, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      {playingVideoId === item.id ? (
                        <iframe
                          className="absolute inset-0 h-full w-full"
                          src={`https://www.youtube-nocookie.com/embed/${safeYouTubeId(item.youtubeId)}?enablejsapi=1&autoplay=1&controls=1&mute=0&rel=0&playsinline=1&modestbranding=1`}
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
                        <AutoTranslateString text={item.titleGu || (item as any).title || ''} language={language} />
                      </a>
                      <span className="text-[10px] font-semibold text-muted-foreground mt-1 flex items-center gap-1">
                        <span className="text-accent">▶</span>
                        <span>{language === 'gu' ? toGu(item.views) : item.views}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 2. PHOTO GALLERY (ફોટો ગેલેરી) ── */}
            {sidebarCounts.photoCount > 0 && (
              <div className="mt-4 pt-3 border-t-2 border-border">
                <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b-[2.5px] border-slate-900 dark:border-white/20">
                  <span className="bg-[#B3121B] text-white px-4.5 py-2 text-sm sm:text-base font-black rounded-lg tracking-tight shadow-xs select-none leading-none">
                    {language === 'gu' ? 'ફોટો ગેલેરી' : language === 'hi' ? 'फोटो गैलरी' : 'Photo Gallery'}
                  </span>
    <Link
      href="/photos"
      className="text-sm sm:text-base font-black text-[#B3121B] hover:text-red-700 hover:underline flex items-center gap-1 transition-colors"
    >
      <span>{getLocalized(language, { en: 'More Photo Gallery', gu: 'વધુ ફોટો ગેલેરી', hi: 'और फोटो गैलरी' })}</span>
      <span>→</span>
    </Link>
  </div>

  {/* Photo Gallery: Dynamic count based on left column height */ }
  <div className="flex flex-col gap-2.5">
    {latestPhotos.slice(0, sidebarCounts.photoCount).map((photo, idx) => (
      <SidebarPhotoCard
        key={photo.id || idx}
        photo={photo}
        index={idx}
        language={language}
      />
    ))}
  </div>
              </div >
            )
}

{/* ── 3. LATEST NEWS (તાજા સમાચાર) ── */ }
{
  sidebarCounts.newsCount > 0 && (
    <div className="mt-3 pt-2.5 border-t-2 border-border">
      <div className="flex items-center justify-between mb-3.5 pb-2 border-b-2 border-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-4.5 bg-accent rounded-sm inline-block shrink-0" />
          <span className="text-sm font-black text-foreground">
            {language === 'gu' ? 'લેટેસ્ટ સમાચાર' : language === 'hi' ? 'लेटेस्ट समाचार' : 'Latest News'}
          </span>
        </div>
        <Link href="/category/latest" className="text-xs font-bold text-accent hover:underline">
          {language === 'gu' ? 'વધુ જુઓ →' : 'View all →'}
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {latestImageArticles.slice(0, sidebarCounts.newsCount).map((art) => (
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
  )
}
          </div >
        </div > {/* CLOSE FIRST GRID */ }

{/* ── FULL WIDTH SECTIONS BELOW SIDEBAR ────────────────────────────── */ }
<div className="mt-2 flex flex-col border-t border-border pt-2">

  {/* ── SECTION 2: SHORTS ────────────────────────────────────── */}
  <section id="short" className="order-1 mb-4 pt-0">
    <div className="flex items-center justify-between gap-3 mb-3 pb-1.5 border-b-2 border-border">
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-5 bg-accent rounded-sm inline-block shrink-0" />
        <h3 className="text-base md:text-lg font-black text-foreground uppercase tracking-wider">
          {getLocalized(language, { en: 'Shorts', gu: 'શોર્ટ્સ', hi: 'शॉर्ट्स' })}
        </h3>
      </div>
      {visibleShortsCount < shortsVideos.length && (
        <button
          type="button"
          onClick={() => setVisibleShortsCount((count) => count + 5)}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs sm:text-sm font-bold text-accent hover:bg-accent/10 transition-colors"
          aria-label={language === 'gu' ? 'વધુ શોર્ટ્સ જુઓ' : 'Show more shorts'}
        >
          {language === 'gu' ? 'વધુ જુઓ' : language === 'hi' ? 'और देखें' : 'More videos'}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {shortsVideos.slice(0, visibleShortsCount).map((item) => (
        <a
          key={item.id}
          href={`https://www.youtube.com/shorts/${safeYouTubeId(item.youtubeId)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-[9/16] w-full max-w-[280px] sm:max-w-none mx-auto rounded-xl overflow-hidden bg-black shadow-sm cursor-pointer"
        >
          <Image
            src={item.thumbnail}
            alt={item.titleGu}
            fill
            sizes="(max-width: 768px) 100vw, 15vw"
            className="object-cover opacity-85 transition-transform duration-300 group-hover:scale-105 group-hover:opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-3">
            <span className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur mb-2 transition-transform group-hover:scale-110 self-start">
              <Play className="h-4 w-4 sm:h-3 sm:w-3 fill-current ml-0.5" />
            </span>
                    <h4 className="text-[13px] sm:text-[11px] font-bold leading-snug text-white line-clamp-2">
                      <AutoTranslateString text={item.titleGu || item.title || ''} language={language} />
                    </h4>
  <span className="text-[10px] sm:text-[9px] font-black text-accent mt-0.5">
    {item.hash}
  </span>
</div>
                </a >
              ))}
            </div >
          </section >

  {/* ── SECTION 3: LATEST NEWS ──────────────────────────────── */ }
  < section id = "latest" className = "order-2 mb-5 pt-2" >
            <div className="flex items-center justify-between gap-3 mb-5 pb-2 border-b-2 border-border">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-5 bg-accent rounded-sm inline-block shrink-0" />
                <h3 className="text-base md:text-lg font-black text-foreground uppercase tracking-wider">
                  {language === 'gu' ? 'લેટેસ્ટ સમાચાર' : language === 'hi' ? 'लेटेस्ट समाचार' : 'Latest News'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {latestImageArticles.slice(0, visibleLatestNewsCount).map((article: any) => {
                const title = language === 'gu'
                  ? (article.titleGu || article.title)
                  : language === 'hi'
                    ? (article.titleHi || article.title)
                    : article.title;
                const image = article.featuredImage || article.image || article.thumbnail || '/assets/gujarat-post-logo.png';

                return (
                  <Link
                    key={article.id}
                    href={`/news/${article.slug}`}
                    className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow p-3.5 sm:p-0 flex flex-col"
                  >
                    <div className="relative aspect-video w-full rounded-lg sm:rounded-none overflow-hidden bg-muted">
                      <Image
                        src={image}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-0 pt-3 sm:p-3">
                      <span className="text-[11px] sm:text-[10px] font-black text-accent uppercase tracking-wider line-clamp-1">
                        <AutoTranslateString text={getCategoryLabel(article, language)} language={language} />
                      </span>
                      <h4 className="mt-1 text-[15px] sm:text-base md:text-sm font-black md:font-bold leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2">
                        <AutoArticleTitle article={article} language={language} />
                      </h4>
      <span className="mt-2 block text-xs md:text-[10px] font-semibold text-muted-foreground">
        {timeAgo(article.publishedAt || article.createdAt, language)}
      </span>
    </div>
  </Link>
  );
              })}
</div>
{
  visibleLatestNewsCount < latestImageArticles.length && (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={() => setVisibleLatestNewsCount((count) => count + 8)}
        className="group inline-flex items-center gap-2.5 rounded-full border-2 border-accent px-9 py-3 text-accent hover:bg-accent hover:text-white transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98]"
      >
        <span className="text-lg md:text-xl font-black tracking-wide leading-none">
          {language === 'gu' ? 'વધુ જુઓ' : language === 'hi' ? 'और देखें' : 'View More'}
        </span>
        <ChevronDown className="w-5 h-5 transition-transform duration-200 group-hover:translate-y-0.5 stroke-[3]" />
      </button>
    </div>
  )
}
          </section >

        </div >

      </div >

  {/* APK: YouTube-style video player (player at top + related below) */ }
{
  isApk && apkModalVideoId && (
    <ApkVideoPlayer
      videoId={apkModalVideoId}
      initialVideo={apkSelectedVideo}
      allVideos={cleanVideos.filter((v) => v.youtubeId !== apkModalVideoId).slice(0, 20)}
      onClose={() => { setApkModalVideoId(null); setApkSelectedVideo(null); }}
      onSelectVideo={(ytId, video) => { setApkModalVideoId(ytId); setApkSelectedVideo(video || null); }}
    />
  )
}
    </div >
  );
}

