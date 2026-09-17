'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, ChevronRight, Clock, Eye, Phone, Globe, Mail,
  Bookmark, Printer, Copy, Maximize2, X, Camera, Share2, Sparkles, Layers
} from 'lucide-react';
import { 
  getLocalized, PHOTOS, formatDate, formatTime, formatViews, 
  getArticleTitle, getCategoryLabel, getRelativeTime 
} from '@/data';
import { useApp } from '@/components/AppProvider';

const ReadingProgressBar = memo(function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return <div className="reading-progress" style={{ width: `${progress}%` }} />;
});

const DEMO_THUMBNAILS = [
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80',
];

const FALLBACK_NEWS_IMAGES = [
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=90',
];

function getCardThumbnail(art: any, index: number = 0): string {
  const raw = art?.image || art?.featuredImage || art?.thumbnail || art?.src;
  if (
    raw &&
    raw.trim() !== '' &&
    !raw.includes('photo-1599930113854') &&
    !raw.includes('placehold.co')
  ) {
    return raw;
  }
  return DEMO_THUMBNAILS[index % DEMO_THUMBNAILS.length];
}

const FilmstripThumb = memo(function FilmstripThumb({
  item,
  idx,
  isActive,
  onClick,
}: {
  item: any;
  idx: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const fallback = FALLBACK_NEWS_IMAGES[idx % FALLBACK_NEWS_IMAGES.length];
  const [src, setSrc] = useState(item.src || fallback);

  useEffect(() => {
    setSrc(item.src || fallback);
  }, [item.src, fallback]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative aspect-[4/3] h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
        isActive
          ? 'border-[#B3121B] ring-2 ring-[#B3121B]/30 scale-105 shadow-md'
          : 'border-transparent opacity-65 hover:opacity-100 hover:border-neutral-300 dark:hover:border-neutral-700'
      }`}
    >
      <Image
        src={src}
        alt={item.alt || item.captionGu || `Thumbnail ${idx + 1}`}
        fill
        sizes="100px"
        className="object-cover"
        onError={() => setSrc(fallback)}
      />
      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[9px] font-black text-white">
        #{idx + 1}
      </span>
    </button>
  );
});

const SidebarThumb = memo(function SidebarThumb({
  item,
  index,
  itemTitle,
}: {
  item: any;
  index: number;
  itemTitle: string;
}) {
  const initial = getCardThumbnail(item, index);
  const fallback = DEMO_THUMBNAILS[index % DEMO_THUMBNAILS.length];
  const [src, setSrc] = useState(initial);

  useEffect(() => {
    setSrc(getCardThumbnail(item, index));
  }, [item, index]);

  return (
    <div className="imgwrap">
      <Image
        src={src}
        alt={itemTitle}
        fill
        sizes="92px"
        className="object-cover"
        onError={() => setSrc(fallback)}
      />
    </div>
  );
});

const MOCK_DESCRIPTIONS: Record<string, { en: string; gu: string; hi: string; category: { en: string; gu: string; hi: string } }> = {
  ph1: {
    category: { en: "Gujarat", gu: "ગુજરાત", hi: "गुजरात" },
    en: "Ahmedabad witnessed heavy continuous rain causing traffic snarls and waterlogging in low-lying areas. The Sabarmati Riverfront development authority has monitored the water level closely and opened key gates to maintain safety guidelines. Civic teams are working continuously to clear roads and ensure public safety across major zones.\n\nLocal authorities have issued emergency contact numbers for residents and activated multiple rescue centers. Citizens are advised to plan their commute according to rain alerts and avoid underpasses during heavy spells.",
    gu: "અમદાવાદમાં અવિરત ભારે વરસાદને પગલે નીચાણવાળા વિસ્તારોમાં પાણી ભરાયા છે અને ટ્રાફિક જામની સમસ્યા સર્જાઈ છે. સાબરમતી રિવરફ્રન્ટ ડેવલપમેન્ટ ઓથોરિટી દ્વારા પાણીના સ્તર પર ચાંપતી નજર રાખવામાં આવી રહી છે અને સુરક્ષા માર્ગદર્શિકા જાળવવા માટે મુખ્ય દરવાજા ખોલવામાં આવ્યા છે. મ્યુનિસિપલ ટીમો રસ્તાઓ સાફ કરવા માટે સતત કામ કરી રહી છે.\n\nસ્થાનિક તંત્ર દ્વારા નાગરિકો માટે ઈમરજન્સી હેલ્પલાઈન નંબરો જાહેર કરવામાં આવ્યા છે અને બચાવ કેન્દ્રો સક્રિય કરાયા છે. ભારે વરસાદ દરમિયાન લોકોને અંડરપાસથી બચવા અને સાવચેતી રાખવા અપીલ કરાઈ છે.",
    hi: "अहमदाबाद में लगातार भारी बारिश के कारण निचले इलाकों में जलभराव हो गया और ट्रैफिक जाम की समस्या पैदा हो गई। साबरमती रिवरफ्रंट विकास प्राधिकरण पानी के स्तर पर पैनी नजर रख रहा है और सुरक्षा बनाए रखने के लिए मुख्य गेट खोल दिए गए हैं।"
  },
  ph2: {
    category: { en: "Sports", gu: "રમતગમત", hi: "खेल" },
    en: "The Gujarat Cricket Team was seen during an intense practice session at the Narendra Modi Stadium. With the upcoming domestic and IPL seasons, key batsmen and bowlers were seen refining their skills under head coach's supervision.",
    gu: "ગુજરાત ક્રિકેટ ટીમ નરેન્દ્ર મોદી સ્ટેડિયમમાં સઘન પ્રેક્ટિસ સેશન દરમિયાન જોવા મળી હતી. આગામી સ્થાનિક અને આઈપીએલ સીઝનને ધ્યાનમાં રાખીને, મુખ્ય બેટ્સમેનો અને બોલરો હેડ કોચની દેખરેખ હેઠળ તેમની કુશળતા સુધારી રહ્યા છે.",
    hi: "नरेंद्र मोदी स्टेडियम में गुजरात क्रिकेट टीम अभ्यास सत्र के दौरान नजर आई। आगामी घरेलू और आईपीएल सीज़न को देखते हुए।"
  },
  ph3: {
    category: { en: "Politics", gu: "રાજકારણ", hi: "राजनीति" },
    en: "A massive crowd gathered at the district election rally showing high enthusiasm and support. Political leaders addressed key developmental schemes, civic infrastructure plans, and employment initiatives.",
    gu: "જિલ્લા ચૂંટણી રેલીમાં ભારે ઉત્સાહ અને સમર્થન દર્શાવતી વિશાળ જનમેદની એકઠી થઈ હતી. રાજકીય નેતાઓએ આગામી 2027ની વિધાનસભા ચૂંટણી માટે નિર્ધારિત કલ્યાણકારી યોજનાઓ અંગે સંબોધન કર્યું હતું.",
    hi: "जिला चुनाव रैली में भारी उत्साह और समर्थन दिखाते हुए विशाल जनसमुदाय एकत्रित हुआ।"
  },
  ph4: {
    category: { en: "Entertainment", gu: "મનોરંજન", hi: "मनोरंजन" },
    en: "Navratri Garba celebrations reached peak excitement in Gujarat as thousands of youngsters danced to traditional folk tunes. Dressed in vibrant ethnic attire, participants showcased traditional ras garba.",
    gu: "નવરાત્રી ગરબા મહોત્સવ ગુજરાતમાં ચરમસીમા પર પહોંચ્યો હતો જ્યાં હજારો ખેલૈયાઓ પરંપરાગત લોકધૂન પર ઝૂમ્યા હતા. વાઇબ્રન્ટ પરંપરાગત પોશાક સજ્જ થઈને ખેલૈયાઓએ રાસ-ગરબાની રમઝટ બોલાવી હતી.",
    hi: "गुजरात में नवरात्रि गरबा महोत्सव का उत्साह चरम पर पहुंच गया जहां हजारों युवाओं ने पारंपरिक धुनों पर नृत्य किया।"
  },
  ph5: {
    category: { en: "Business", gu: "બિઝનેસ", hi: "बिजनेस" },
    en: "The iconic GIFT City skyline captured during twilight, representing Gujarat's growing corporate footprint and global financial integrations. With state-of-the-art infrastructure and tech hubs.",
    gu: "સંધ્યાકાળે લેવાયેલ GIFT સિટીની આકર્ષક સ્કાઇલાઇન, જે ગુજરાતના વધતા જતા કોર્પોરેટ ક્ષેત્ર અને વૈશ્વિક નાણાકીય એકીકરણનું પ્રતિનિધિત્વ કરે છે. અત્યાધુનિક ઇન્ફ્રાસ્ટ્રક્ચર અને ટેક હબ સાથે.",
    hi: "संध्याकाल के समय ली गई गिफ्ट सिटी की स्काईलाइन, जो गुजरात के बढ़ते कॉर्पोरेट क्षेत्र का प्रतिनिधित्व करती है।"
  },
  ph6: {
    category: { en: "Education", gu: "શિક્ષણ", hi: "शिक्षा" },
    en: "Students interacting in a modern digital classroom implemented across municipal schools in Gujarat. Equipped with interactive smartboards, educational software, and tablet-based learning.",
    gu: "ગુજરાતની સરકારી શાળાઓમાં અમલીકૃત આધુનિક ડિજિટલ ક્લાસરૂમમાં વિદ્યાર્થીઓ અભ્યાસ કરી રહ્યા છે. ઇન્ટરેક્ટિવ સ્માર્ટબોર્ડ્સ અને શૈક્ષણિક સોફ્ટવેર સાથે.",
    hi: "गुजरात के सरकारी स्कूलों में लागू आधुनिक डिजिटल कक्षा में छात्र पढ़ाई कर रहे हैं।"
  }
};

interface Props {
  activeId: string;
  photo?: any;
  allPhotos: any[];
  trending: any[];
  photoUrl?: string;
}

export default function PhotoDetailClient({ activeId, photo: dbPhoto, allPhotos: dbAllPhotos, trending: dbTrending, photoUrl: propPhotoUrl }: Props) {
  const { language } = useApp();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const photosList = dbAllPhotos && dbAllPhotos.length > 0 ? dbAllPhotos : PHOTOS;
  const photo = dbPhoto || photosList.find(p => p.id === activeId || p.id === `photo-${activeId}` || p.id === activeId.replace('photo-', '')) || photosList[0];
  const activeIndex = photosList.findIndex((item) => item.id === photo?.id);
  const currentPhotoIndex = activeIndex >= 0 ? activeIndex : 0;
  
  const photoUrl = propPhotoUrl || `https://gujaratpost.com/photos/${photo?.id || activeId}`;

  const mainFallback = FALLBACK_NEWS_IMAGES[currentPhotoIndex % FALLBACK_NEWS_IMAGES.length];
  const [mainImgSrc, setMainImgSrc] = useState(photo?.src || mainFallback);
  useEffect(() => {
    setMainImgSrc(photo?.src || mainFallback);
  }, [photo?.src, mainFallback]);

  const nextIndex = photosList.length > 0 ? (currentPhotoIndex + 1) % photosList.length : 0;
  const prevIndex = photosList.length > 0 ? (currentPhotoIndex - 1 + photosList.length) % photosList.length : 0;

  const handleNext = useCallback(() => {
    if (photosList[nextIndex]) {
      router.push(`/photos/${photosList[nextIndex].id}`);
    }
  }, [nextIndex, photosList, router]);

  const handlePrev = useCallback(() => {
    if (photosList[prevIndex]) {
      router.push(`/photos/${photosList[prevIndex].id}`);
    }
  }, [prevIndex, photosList, router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape' && isLightboxOpen) setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isLightboxOpen]);

  const copyUrl = async () => {
    try {
      const urlToCopy = typeof window !== 'undefined' ? window.location.href : photoUrl;
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const rawCaption = photo?.captionGu || photo?.caption || photo?.alt || 'Photo Gallery';
  const caption = getLocalized(language, { 
    en: photo?.caption || photo?.alt || '', 
    gu: photo?.captionGu || photo?.caption || photo?.alt || '', 
    hi: photo?.captionHi || photo?.caption || photo?.alt || '' 
  }) || rawCaption;

  const title = caption;
  
  const descriptionData = (photo && MOCK_DESCRIPTIONS[photo.id]) || {
    category: { en: photo?.category || "Photo Gallery", gu: photo?.category || 'ફોટો ગેલેરી', hi: photo?.category || 'फोटो गैलरी' },
    en: photo?.caption || '',
    gu: photo?.captionGu || photo?.caption || '',
    hi: photo?.captionHi || photo?.caption || ''
  };

  const category = getLocalized(language, descriptionData.category);
  const bodyText = getLocalized(language, descriptionData);
  const paragraphs = bodyText.split(/\n\n+/);

  const authorName = photo?.photographer || (language === 'gu' ? 'ગુજરાત પોસ્ટ ફોટોગ્રાફર' : language === 'hi' ? 'गुजरात पोस्ट फोटोग्राफर' : 'Gujarat Post Photographer');

  const gistPoints = useMemo(() => {
    return [
      caption,
      `${language === 'gu' ? 'સ્થળ / કેટેગરી:' : language === 'hi' ? 'स्थान / श्रेणी:' : 'Category:'} ${category}`,
      `${language === 'gu' ? 'કવરેજ સ્તરો:' : language === 'hi' ? 'कवरेज स्तर:' : 'Coverage:'} ${language === 'gu' ? 'સ્થાનિક તસવીરો અને તાજા સમાચાર' : language === 'hi' ? 'स्थानीय तस्वीरें और ताजा खबरें' : 'Local HD Imagery'}`,
    ];
  }, [caption, category, language]);

  const tags = useMemo(() => {
    if (language === 'gu') {
      return ['ફોટો ગેલેરી', 'ગુજરાત', 'અમદાવાદ', 'તાજા સમાચાર', 'લાઈવ', 'વિશેષ કવરેજ', 'તસવીરો', 'ગુજરાત પોસ્ટ'];
    } else if (language === 'hi') {
      return ['फोटो गैलरी', 'गुजरात', 'अहमदाबाद', 'ताजा समाचार', 'लाइव', 'विशेष कवरेज', 'तस्वीरें', 'गुजरात पोस्ट'];
    }
    return ['Photo Gallery', 'Gujarat', 'Ahmedabad', 'Breaking News', 'Live', 'Special Coverage', 'Pictures', 'Gujarat Post'];
  }, [language]);

  const trendingList = dbTrending || [];
  const sidebarRecommendedPool = photosList.filter(p => p.id !== photo.id);

  return (
    <>
      <ReadingProgressBar />
      
      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20"
            aria-label="Close Lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative h-[85vh] w-[92vw] max-w-6xl">
            <Image
              src={mainImgSrc}
              alt={photo.alt || caption}
              fill
              sizes="100vw"
              className="object-contain"
              priority
              onError={() => setMainImgSrc(mainFallback)}
            />

            {/* Prev / Next controls in lightbox */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-red-600 transition-all border border-white/20"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-red-600 transition-all border border-white/20"
              aria-label="Next photo"
            >
              <ChevronRight className="h-7 w-7" />
            </button>

            {/* Lightbox Caption Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/80 backdrop-blur-md px-6 py-2.5 text-center text-white border border-white/15 max-w-2xl w-full shadow-2xl">
              <p className="text-sm font-bold truncate">{caption}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {currentPhotoIndex + 1} of {photosList.length} • {photo.photographer || 'Gujarat Post'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="wrap py-6">
        <div className="article-grid" suppressHydrationWarning>
          <article suppressHydrationWarning>
            
            {/* Breadcrumbs matching NewsDetailClient */}
            <nav className="breadcrumb select-none flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-neutral-500 font-medium">
              <Link href="/" className="hover:text-[var(--red)] transition-colors">
                {language === 'gu' ? 'હોમ' : language === 'hi' ? 'होम' : 'Home'}
              </Link>
              <span>/</span>
              <Link href="/photos" className="hover:text-[var(--red)] transition-colors">
                {getLocalized(language, { en: 'Photo Gallery', gu: 'ફોટો ગેલેરી', hi: 'फोटो गैलरी' })}
              </Link>
              <span>:</span>
              <span className="text-red-700 dark:text-red-400 font-bold truncate max-w-[280px] sm:max-w-md">
                {title}
              </span>
            </nav>

            {/* Category kick bar */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="art-kick">
                <span className="bar"></span>
                <span>{category} · {language === 'gu' ? 'અંતરદૃશ્ય કવરેજ' : language === 'hi' ? 'विशेष कवरेज' : 'Special Coverage'}</span>
              </div>
              <span className="live-badge rounded bg-accent px-2 py-0.5 text-xs font-black text-white ml-2">
                📷 {currentPhotoIndex + 1} / {photosList.length} {language === 'gu' ? 'ફોટા' : language === 'hi' ? 'तस्वीरें' : 'Photos'}
              </span>
            </div>

            {/* Article Title */}
            <h1 className="article-title">{title}</h1>

            {/* Byline / Author card matching NewsDetailClient */}
            <div className="byline select-none" suppressHydrationWarning>
              <div className="flex items-center gap-[11px]">
                <div className="shrink-0 w-[38px] h-[38px] rounded-full bg-[var(--red)] text-white flex items-center justify-center font-bold text-sm">
                  GP
                </div>
                <div>
                  <div className="text-[13.5px]">
                    <span className="text-[var(--ink-2)]">{language === 'gu' ? 'લેખક:' : language === 'hi' ? 'लेखक:' : 'Author:'} </span>
                    <span className="font-bold text-[var(--red)]">
                      {authorName}
                    </span>
                  </div>
                  <div className="text-[12px] text-[var(--ink-3)] mt-[2px]" suppressHydrationWarning>
                    <span>{formatDate(photo?.createdAt || '2026-08-12')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[12.5px] text-[var(--ink-2)]" suppressHydrationWarning>
                  👁 {formatViews(photo?.views || 10450)} {getLocalized(language, { en: 'views', gu: 'વ્યૂઝ', hi: 'વ્યૂઝ' })}
                </span>
                
                {/* Google News Follow Badge */}
                <a
                  href="https://news.google.com/search?q=Gujarat+Post"
                  target="_blank"
                  rel="noreferrer"
                  title="Follow Gujarat Post on Google News"
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-md hover:border-[#4285F4]/50 transition-all duration-200 hover:scale-[1.03] active:scale-95 select-none"
                  style={{ textDecoration: 'none' }}
                >
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
                    <rect x="2" y="2" width="8.5" height="20" rx="1.5" fill="#4285F4" />
                    <rect x="12.5" y="3" width="9.5" height="3.8" rx="1" fill="#EA4335" />
                    <rect x="12.5" y="9.1" width="9.5" height="3.8" rx="1" fill="#FBBC05" />
                    <rect x="12.5" y="15.2" width="9.5" height="6.5" rx="1" fill="#34A853" />
                  </svg>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[8px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">FOLLOW ON</span>
                    <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-100 tracking-tight" style={{ fontFamily: 'Google Sans, sans-serif' }}>Google News</span>
                  </span>
                </a>
              </div>
            </div>

            {/* Share Row matching NewsDetailClient */}
            <div className="share-row-custom select-none flex flex-wrap gap-3 items-center mb-6 p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm backdrop-blur-sm" suppressHydrationWarning>
              <span className="lbl font-black text-neutral-900 dark:text-neutral-100 mr-1 text-[14px] tracking-wide uppercase flex items-center gap-1.5 select-none" suppressHydrationWarning>
                <span className="h-2 w-2 rounded-full bg-[#B3121B] animate-ping" />
                {language === 'gu' ? 'શેર કરો:' : language === 'hi' ? 'શેર કરેં:' : 'Share:'}
              </span>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${title} ${photoUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp"
                suppressHydrationWarning
                className="group relative flex items-center justify-center w-11 h-11 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-[0_8px_20px_rgba(37,211,102,0.35)] hover:border-[#25D366]"
              >
                <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] shrink-0 transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110">
                  <path fill="#25D366" d="M12.01 0a12 12 0 0 0-10.4 18l-1.6 5.8 6-1.6a12 12 0 1 0 6-22.2z" />
                  <path fill="#FFF" d="M16.9 14.1c-.3-.1-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.5 0-.2-.1-.4-.2-.6-.2-.4-.7-1.7-1-2.3-.3-.6-.6-.5-.8-.5H8c-.2 0-.6.1-.9.4C6.8 7.3 6 8.1 6 9.8c0 1.7 1.2 3.4 1.4 3.6.2.2 2.4 3.7 5.9 5.2.8.3 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.1-.3-.2-.5-.3z" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(photoUrl)}`}
                target="_blank"
                rel="noreferrer"
                title="Facebook"
                suppressHydrationWarning
                className="group relative flex items-center justify-center w-11 h-11 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-[0_8px_20px_rgba(24,119,242,0.35)] hover:border-[#1877F2]"
              >
                <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] shrink-0 transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110">
                  <path fill="#1877F2" d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078v-3.47h3.047V9.35c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12z" />
                </svg>
              </a>

              {/* X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(photoUrl)}`}
                target="_blank"
                rel="noreferrer"
                title="Post on X"
                suppressHydrationWarning
                className="group relative flex items-center justify-center w-11 h-11 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_8px_20px_rgba(255,255,255,0.2)] hover:border-black dark:hover:border-white"
              >
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0 text-neutral-900 dark:text-neutral-100 transition-transform duration-300 group-hover:rotate-[-12deg] group-hover:scale-110">
                  <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Action Buttons */}
              <div className="ml-auto flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setSaved(!saved)} 
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-200 shadow-sm ${saved ? 'bg-amber-500 text-white border-amber-600' : 'bg-card border-border hover:bg-muted text-foreground'}`}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-white' : ''}`} />
                  {saved ? 'Saved' : 'Save'}
                </button>

                <button 
                  type="button" 
                  onClick={() => window.print()} 
                  className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-all duration-200 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                  Print
                </button>

                <button 
                  type="button" 
                  onClick={copyUrl} 
                  className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-all duration-200 shadow-sm"
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Main Featured Photo Figure & Viewer */}
            <figure className="article-fig">
              <div className="imgwrap relative aspect-[16/10] overflow-hidden bg-black/90 rounded-xl shadow-md group">
                <Image 
                  src={mainImgSrc} 
                  alt={photo.alt || caption} 
                  fill 
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-contain" 
                  priority
                  onError={() => setMainImgSrc(mainFallback)}
                />

                {/* Top Right Fullscreen Button */}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute top-3.5 right-3.5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-red-600 transition border border-white/20 shadow-md"
                  title="Full Screen"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>

                {/* Top Left Counter Pill */}
                <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-3 py-1 text-xs font-bold text-white border border-white/20 shadow">
                  <Camera className="h-3.5 w-3.5 text-red-500" />
                  {currentPhotoIndex + 1} / {photosList.length}
                </div>

                {/* Prev / Next Navigation Arrows */}
                <button 
                  type="button" 
                  onClick={handlePrev} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-red-600 transition border border-white/20 shadow-lg opacity-90 group-hover:opacity-100"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  type="button" 
                  onClick={handleNext} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-red-600 transition border border-white/20 shadow-lg opacity-90 group-hover:opacity-100"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <figcaption>
                <span>{caption}</span>
                <span style={{ whiteSpace: 'nowrap' }}>
                  {language === 'gu' ? 'તસવીર: ગુજરાત પોસ્ટ' : language === 'hi' ? 'તસવીર: ગુજરાત પોસ્ટ' : 'Photo: Gujarat Post'}
                </span>
              </figcaption>
            </figure>

            {/* Interactive Filmstrip Thumbnails Below Main Photo */}
            <div className="my-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-3 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-neutral-500 dark:text-neutral-400 tracking-wider mb-2">
                <span>{language === 'gu' ? 'ફોટો ગેલેરી ફિલ્મસ્ટ્રીપ' : language === 'hi' ? 'फोटो गैलरी फिल्मस्ट्रिप' : 'Photo Gallery Filmstrip'}</span>
                <span>{currentPhotoIndex + 1} / {photosList.length}</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {photosList.map((item, idx) => {
                  const isActive = item.id === photo.id;
                  return (
                    <FilmstripThumb
                      key={item.id}
                      item={item}
                      idx={idx}
                      isActive={isActive}
                      onClick={() => router.push(`/photos/${item.id}`)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Article Content Body matching NewsDetailClient */}
            <div className="article-body space-y-4 text-base leading-relaxed text-neutral-900 dark:text-neutral-100 prose dark:prose-invert max-w-none [&_b]:font-extrabold [&_strong]:font-extrabold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through [&_a]:text-[#B3121B] [&_a]:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:list-item [&_li]:my-1 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#B3121B] [&_blockquote]:pl-4 [&_blockquote]:font-bold [&_blockquote]:not-italic [&_blockquote]:my-3 [&_img]:rounded-xl [&_figure]:my-6">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Topics Tags Bar matching NewsDetailClient */}
            <div className="flex flex-wrap items-center gap-2 mt-8 select-none border-t border-neutral-200 dark:border-neutral-800 pt-5">
              <span className="topics-title font-extrabold text-neutral-900 dark:text-white mr-2 text-[14.5px] tracking-wide uppercase border-b-2 border-[#B3121B] pb-0.5">
                {language === 'gu' ? 'ટોપિક્સ:' : language === 'hi' ? 'विषય:' : 'Topics:'}
              </span>
              {tags.map((tag, tIdx) => (
                <Link
                  key={tIdx}
                  href={`/photos`}
                  className="topic-pill cursor-pointer bg-neutral-100 dark:bg-neutral-800/80 hover:bg-[#B3121B] dark:hover:bg-[#B3121B] text-neutral-800 dark:text-neutral-200 hover:text-white dark:hover:text-white rounded-full px-4 py-1.5 text-xs font-bold border border-neutral-300 dark:border-neutral-700 hover:border-[#B3121B] dark:hover:border-[#B3121B] shadow-sm transition-all duration-200"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </article>

          {/* Sidebar matching NewsDetailClient */}
          <aside className="select-none h-fit sticky top-[100px]" style={{ width: '100%', maxWidth: '336px' }} suppressHydrationWarning>
            {/* Heading and recommended stories stick together below header */}
            <div className="wtitle mb-3">
              <span className="d"></span>
              <span>{language === 'gu' ? 'તમારા માટે ભલામણ' : language === 'hi' ? 'आपके लिए अनुशंसित' : 'Recommended Stories'}</span>
            </div>

            <div className="space-y-0">
              {sidebarRecommendedPool.slice(0, 5).map((item, index) => {
                const itemTitle = getLocalized(language, { en: item.caption, gu: item.captionGu, hi: item.captionHi });
                const itemCategory = item.category || (language === 'gu' ? 'ગેલેરી' : 'Gallery');
                return (
                  <Link key={item.id} href={`/photos/${item.id}`} className="s-compact hover:opacity-85 transition-opacity">
                    <div>
                      <span className="kick">{itemCategory}</span>
                      <h3>{itemTitle}</h3>
                      <div className="meta" suppressHydrationWarning>
                        <span>{formatDate(item.createdAt || '2026-08-12')}</span>
                      </div>
                    </div>
                    <SidebarThumb item={item} index={index} itemTitle={itemTitle} />
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
      <div style={{ height: '50px' }} />
    </>
  );
}
