'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Eye, Clock, ArrowRight, Video } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getLocalized } from '@/data';
import { getPublicVideos } from '@/lib/api';
import { safeYouTubeId } from '@/lib/youtube';

interface VideoItem {
  id: string;
  youtubeId?: string;
  title: string;
  titleGu?: string;
  titleHi?: string;
  thumbnail: string;
  duration?: string;
  views?: number;
  publishedAt?: string;
}

const FALLBACK_VIDEOS: VideoItem[] = [
  {
    id: 'sA6BrUmBXiA',
    youtubeId: 'sA6BrUmBXiA',
    title: 'નારી શક્તિના પીપુડાં વગાડે છે મંત્રી રિવાબા ! TET-1 પાસ આ મહિલાની વાત સાંભળો',
    titleGu: 'નારી શક્તિના પીપુડાં વગાડે છે મંત્રી રિવાબા ! TET-1 પાસ આ મહિલાની વાત સાંભળો',
    titleHi: 'नारी शक्ति का ढोल बजाती हैं मंत्री रिवाबा ! TET-1 पास इस महिला की बात सुनें',
    thumbnail: 'https://i.ytimg.com/vi/sA6BrUmBXiA/hqdefault.jpg',
    duration: '3:18',
    views: 190,
  },
  {
    id: 'rQHoqCTiQvI',
    youtubeId: 'rQHoqCTiQvI',
    title: 'સંતાનો આવો નશો કેમ ? કપડવંજ તાલુકા પંચાયતના પ્રમુખ જે.કે.પરમારનો ઓડિયો વાયરલ',
    titleGu: 'સંતાનો આવો નશો કેમ ? કપડવંજ તાલુકા પંચાયતના પ્રમુખ જે.કે.પરમારનો ઓડિયો વાયરલ',
    titleHi: 'बच्चों ऐसा नशा क्यों? कपड़वंज तालुका पंचायत अध्यक्ष जे.के.परमार का ऑडियो वायरल',
    thumbnail: 'https://i.ytimg.com/vi/rQHoqCTiQvI/hqdefault.jpg',
    duration: '3:41',
    views: 461,
  },
  {
    id: 'WF2Kuec5HV0',
    youtubeId: 'WF2Kuec5HV0',
    title: 'ધી સાબરકાંઠા જિલ્લા સહકારી ખરીદ વેચાણ સંઘ બન્યો ભ્રષ્ટાચારનો અડ્ડો ! આવી રીતે થાય છે લાખોની ઉચાપત',
    titleGu: 'ધી સાબરકાંઠા જિલ્લા સહકારી ખરીદ વેચાણ સંઘ બન્યો ભ્રષ્ટાચારનો અડ્ડો ! આવી રીતે થાય છે લાખોની ઉચાપત',
    titleHi: 'साबरकांठा जिला सहकारी खरीद बिक्री संघ बना भ्रष्टाचार का अड्डा ! ऐसे होता है लाखों का घोटाला',
    thumbnail: 'https://i.ytimg.com/vi/WF2Kuec5HV0/hqdefault.jpg',
    duration: '8:50',
    views: 334,
  },
  {
    id: 'LDDtOMwdJ_0',
    youtubeId: 'LDDtOMwdJ_0',
    title: 'કપડવંજ TDO કચેરીમાં ભ્રષ્ટાચારનો સડો, સાંભળો- વિસ્તારણ અધિકારીએ ગરીબોને લૂંટવા વચેટિયાને આપ્યો આદેશ',
    titleGu: 'કપડવંજ TDO કચેરીમાં ભ્રષ્ટાચારનો સડો, સાંભળો- વિસ્તારણ અધિકારીએ ગરીબોને લૂંટવા વચેટિયાને આપ્યો આદેશ',
    titleHi: 'कपड़वंज TDO कार्यालय में भ्रष्टाचार, सुनें- विस्तार अधिकारी ने गरीबों को लूटने का दिया आदेश',
    thumbnail: 'https://i.ytimg.com/vi/LDDtOMwdJ_0/hqdefault.jpg',
    duration: '13:43',
    views: 334,
  },
  {
    id: '-iXZuFoHqiw',
    youtubeId: '-iXZuFoHqiw',
    title: 'કપડવંજ તાલુકાની જનતાએ આ સ્ટોરી ખાસ જોવી જોઈએ, TDO કચેરીમાં ભ્રષ્ટાચારનો સડો',
    titleGu: 'કપડવંજ તાલુકાની જનતાએ આ સ્ટોરી ખાસ જોવી જોઈએ, TDO કચેરીમાં ભ્રષ્ટાચારનો સડો',
    titleHi: 'कपड़वंज तालुका की जनता को यह स्टोरी जरूर देखनी चाहिए, TDO कार्यालय में भ्रष्टाचार',
    thumbnail: 'https://i.ytimg.com/vi/-iXZuFoHqiw/hqdefault.jpg',
    duration: '1:19',
    views: 21,
  },
  {
    id: 'uJalvs-jgFc',
    youtubeId: 'uJalvs-jgFc',
    title: 'વડોદરાના AAP નેતાનું પાપ, ચાર વર્ષ સુધી પક્ષની મહિલા સાથે દુષ્કર્મ આચર્યું, અશ્લિલ વીડિયો બનાવ્યાં',
    titleGu: 'વડોદરાના AAP નેતાનું પાપ, ચાર વર્ષ સુધી પક્ષની મહિલા સાથે દુષ્કર્મ આચર્યું, અશ્લિલ વીડિયો બનાવ્યાં',
    titleHi: 'वडोदरा के AAP नेता का पाप, चार साल तक पार्टी की महिला के साथ किया दुष्कर्म',
    thumbnail: 'https://i.ytimg.com/vi/uJalvs-jgFc/hqdefault.jpg',
    duration: '10:00',
    views: 520,
  },
];

interface Props {
  initialVideos?: VideoItem[];
}

export default function VideoSection({ initialVideos }: Props) {
  const { language } = useApp();
  const [videos, setVideos] = useState<VideoItem[]>(
    initialVideos && initialVideos.length > 0 ? initialVideos : FALLBACK_VIDEOS
  );
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isPlayingMain, setIsPlayingMain] = useState(false);

  useEffect(() => {
    getPublicVideos('video')
      .then((res) => {
        if (res && Array.isArray(res) && res.length > 0) {
          const mapped: VideoItem[] = res.map((v: any) => ({
            id: v.id || v.youtubeId,
            youtubeId: v.youtubeId || v.id,
            title: v.title,
            titleGu: v.titleGu || v.title,
            titleHi: v.titleHi || v.title,
            thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.youtubeId || v.id}/hqdefault.jpg`,
            duration: v.duration || '3:00',
            views: typeof v.views === 'number' ? v.views : 250,
          }));
          setVideos(mapped.slice(0, 6));
        }
      })
      .catch(() => {});
  }, []);

  const activeMain = selectedVideo || videos[0] || FALLBACK_VIDEOS[0];
  const sidebarList = videos.filter((v) => v.id !== activeMain.id).slice(0, 5);

  const getTitle = (item: VideoItem) => {
    if (language === 'gu') return item.titleGu || item.title;
    if (language === 'hi') return item.titleHi || item.title;
    return item.title;
  };

  const sectionTitle = getLocalized(language, { en: 'Videos', gu: 'વીડિયો', hi: 'वीडियो' });
  const viewMoreText = getLocalized(language, { en: 'View More', gu: 'વધુ જુઓ', hi: 'और देखें' });

  return (
    <section className="my-6 mx-auto max-w-screen-xl px-2">
      <div className="overflow-hidden rounded-2xl bg-[#a50f15] p-4 md:p-6 shadow-xl border border-red-800/40 text-white">
        
        <div className="mb-4 flex items-center justify-between border-b border-white/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white">
              <Video className="h-5 w-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
              {sectionTitle}
            </h2>
          </div>

          <Link
            href="/videos"
            className="group flex items-center gap-1 text-xs md:text-sm font-extrabold text-white/90 hover:text-white transition-colors"
          >
            <span>{viewMoreText}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] items-start">
          
          <div className="flex flex-col">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg border border-white/10 group">
              {isPlayingMain ? (
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${safeYouTubeId(activeMain.youtubeId || activeMain.id)}?autoplay=1&rel=0`}
                  title={getTitle(activeMain)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div
                  className="relative h-full w-full cursor-pointer"
                  onClick={() => setIsPlayingMain(true)}
                >
                  <Image
                    src={activeMain.thumbnail}
                    alt={getTitle(activeMain)}
                    fill
                    sizes="(max-width: 1024px) 100vw, 65vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-white text-[#a50f15] shadow-2xl transition-transform duration-300 group-hover:scale-110">
                      <Play className="h-4 w-4 sm:h-6 sm:w-6 md:h-7 md:w-7 fill-current ml-0.5 md:ml-1" />
                    </span>
                  </div>

                  <span className="absolute bottom-2 right-2 rounded bg-black/85 px-1.5 py-0.5 text-[10px] sm:text-xs font-black text-white tracking-wider">
                    {activeMain.duration || '3:18'}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-2.5">
              <h3 className="text-sm sm:text-base md:text-xl font-black leading-snug text-white line-clamp-2">
                {getTitle(activeMain)}
              </h3>
              <div className="mt-1 flex items-center gap-2.5 text-[11px] sm:text-xs font-bold text-white/80">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {activeMain.views || 190} {language === 'gu' ? 'વ્યૂઝ' : language === 'hi' ? 'ভিউઝ' : 'views'}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {activeMain.duration || '3:18'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {sidebarList.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedVideo(item);
                  setIsPlayingMain(true);
                }}
                className={`group flex items-center gap-3 rounded-xl p-2 transition-all cursor-pointer border ${
                  activeMain.id === item.id
                    ? 'bg-black/40 border-white/30 shadow-md'
                    : 'bg-black/20 hover:bg-black/35 border-white/10'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-28 md:w-32 shrink-0 overflow-hidden rounded-lg bg-black">
                  <Image
                    src={item.thumbnail}
                    alt={getTitle(item)}
                    fill
                    sizes="128px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#a50f15] shadow">
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                    </span>
                  </div>
                  {/* Duration Badge */}
                  <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-0.2 text-[10px] font-bold text-white">
                    {item.duration || '3:41'}
                  </span>
                </div>

                {/* Text Info */}
                <div className="flex flex-1 flex-col justify-center min-w-0">
                  <h4 className="text-xs md:text-sm font-extrabold leading-tight text-white line-clamp-2 group-hover:text-white/90 transition-colors">
                    {getTitle(item)}
                  </h4>
                  <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-white/70">
                    <span>{item.views || 400} {language === 'gu' ? 'વ્યૂઝ' : language === 'hi' ? 'व्यूज' : 'views'}</span>
                    <span>·</span>
                    <span>{item.duration || '3:41'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
