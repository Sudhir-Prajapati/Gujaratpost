'use client';

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sanitizeImageUrl } from '@/lib/media';
import { 
  ChevronLeft, ChevronRight, Eye, Phone, Globe, Mail,
  Bookmark, Printer, Copy, Maximize2, X, Camera, Share2, Sparkles, Layers,
  ChevronDown, Loader2
} from 'lucide-react';
import { 
  getLocalized, PHOTOS, formatDate, formatViews, formatArticleDateTime,
  getArticleTitle, getCategoryLabel, getPhotoCategoryBadge 
} from '@/data';
import { useApp } from '@/components/AppProvider';
import { getPublicGallery } from '@/lib/api';
import { useAutoTranslate } from '@/lib/translate';
import { AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import type { Language } from '@/types';
import AdSectionBanner from '@/components/ads/AdSectionBanner';
import ArticleShareAudioBar from '@/app/news/[slug]/components/ArticleShareAudioBar';

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


function formatTimeAgo(dateString?: string | Date | null, language: string = 'gu'): string {
  if (!dateString) return language === 'gu' ? 'હમણાં જ' : 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return language === 'gu' ? 'હમણાં જ' : 'Just now';

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (language === 'gu') {
    if (diffMins < 1) return 'હમણાં જ';
    if (diffMins < 60) return `${diffMins} મિનિટ પહેલા`;
    if (diffHours < 24) return `${diffHours} કલાક પહેલા`;
    if (diffDays < 30) return `${diffDays} દિવસ પહેલા`;
    return `${Math.floor(diffDays / 30)} મહિના પહેલા`;
  }
  if (language === 'hi') {
    if (diffMins < 1) return 'अभी';
    if (diffMins < 60) return `${diffMins} मिनट पहले`;
    if (diffHours < 24) return `${diffHours} घंटे पहले`;
    if (diffDays < 30) return `${diffDays} दिन पहले`;
    return `${Math.floor(diffDays / 30)} महीने पहले`;
  }
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)} mo ago`;
}

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

function resolvePhotoUrl(val: any, fallback: string = ''): string {
  if (!val) return fallback;
  let raw = typeof val === 'string' ? val : (val.src || val.coverImage || val.image || val.thumbnail);
  if (typeof raw === 'string') {
    let trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0];
          const urlStr = typeof first === 'string' ? first : (first?.src || first?.url || fallback);
          return sanitizeImageUrl(urlStr);
        }
      } catch {}
    }
    const qIdx = trimmed.indexOf('"');
    if (qIdx !== -1) {
      trimmed = trimmed.substring(0, qIdx).trim();
    }
    trimmed = trimmed.replace(/[,\}\]]+$/, '').trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return sanitizeImageUrl(trimmed);
    }
  }
  if (typeof val === 'object' && Array.isArray(val.images) && val.images.length > 0) {
    const first = val.images[0];
    const urlStr = typeof first === 'string' ? first : (first?.src || first?.url || fallback);
    return sanitizeImageUrl(urlStr);
  }
  return fallback;
}

function getCardThumbnail(art: any, index: number = 0): string {
  const fallback = DEMO_THUMBNAILS[index % DEMO_THUMBNAILS.length];
  return resolvePhotoUrl(art, fallback);
}

const SidebarThumb = memo(function SidebarThumb({
  item,
  index,
  itemTitle,
}: {
  item: any;
  index: number;
  itemTitle: string;
}) {
  const fallback = DEMO_THUMBNAILS[index % DEMO_THUMBNAILS.length];
  const initial = resolvePhotoUrl(item, fallback);
  const [src, setSrc] = useState(initial);

  useEffect(() => {
    setSrc(resolvePhotoUrl(item, fallback));
  }, [item, fallback]);

  return (
    <div className="relative w-full h-full">
      <Image
        src={src}
        alt={itemTitle}
        fill
        sizes="130px"
        className="object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
        onError={() => setSrc(fallback)}
      />
    </div>
  );
});

const MorePhotoCard = memo(function MorePhotoCard({
  item,
  index,
  language,
}: {
  item: any;
  index: number;
  language: Language;
}) {
  const rawItemTitle = item.captionGu || item.caption || item.titleGu || item.title || item.alt || (language === 'gu' ? 'ફોટો ગેલેરી' : language === 'hi' ? 'फोटो गैलरी' : 'Photo Gallery');
  const fallback = DEMO_THUMBNAILS[index % DEMO_THUMBNAILS.length];
  const initialSrc = resolvePhotoUrl(item, fallback);
  const [src, setSrc] = useState(initialSrc);

  useEffect(() => {
    setSrc(resolvePhotoUrl(item, fallback));
  }, [item, fallback]);

  return (
    <Link
      href={`/photos/${item.id || item._id}`}
      className="group relative flex flex-col w-full overflow-hidden rounded-2xl bg-card dark:bg-[#161822] border border-border/80 dark:border-white/[0.08] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#B3121B]/40 select-none"
    >
      {/* 1. Top Section: Full Photo */}
      <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <Image
          src={src}
          alt={rawItemTitle}
          fill
          sizes="(max-width: 640px) 100vw, 400px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={() => setSrc(fallback)}
        />

        {/* Photo count badge top-right */}
        {Array.isArray(item.images) && item.images.length > 1 && (
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
            <span className="text-white text-[10.5px] font-black px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-sm border border-white/20 shadow-md flex items-center gap-1.5">
              <Camera className="w-3 h-3 text-red-400" />
              <span>{item.images.length}</span>
            </span>
          </div>
        )}
      </div>

      {/* 2. Bottom Section: Heading & Link below photo */}
      <div className="p-3.5 sm:p-3 flex flex-col justify-between flex-1 min-w-0 bg-card dark:bg-[#161822]">
        <h4 className="text-foreground group-hover:text-[#B3121B] text-[14.5px] md:text-[15.5px] font-extrabold leading-snug line-clamp-2 transition-colors">
          <AutoTranslateString text={rawItemTitle} language={language} />
        </h4>

        <div className="flex items-center gap-1.5 mt-2.5 text-[#B3121B] font-bold text-[12.5px] sm:text-[13px] tracking-wide">
          <div className="h-[2px] w-5 rounded-full bg-[#B3121B]" />
          <span>{language === 'gu' ? 'ફોટો જુઓ' : language === 'hi' ? 'फोटो देखें' : 'View Photos'}</span>
          <span>→</span>
        </div>
      </div>
    </Link>
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
    gu: "જિલ્લા ચૂંટણી રેલીમાં ભારે ઉત્સાહ અને સમર્થન દર્શાવતી વિશાળ જનમેદની એકઠી થઈ હતી. રાજકીય નેતાઓએ આગામી વિધાનસભા ચૂંટણી માટે નિર્ધારિત કલ્યાણકારી યોજનાઓ અંગે સંબોધન કર્યું હતું.",
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
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const photosList = dbAllPhotos && dbAllPhotos.length > 0 ? dbAllPhotos : PHOTOS;
  const photo = dbPhoto || photosList.find((p: any) => p.id === activeId || p.id === `photo-${activeId}` || p.id === activeId.replace('photo-', '')) || photosList[0];
  const activeIndex = photosList.findIndex((item: any) => item.id === photo?.id);
  const currentPhotoIndex = activeIndex >= 0 ? activeIndex : 0;
  
  const photoUrl = propPhotoUrl || `https://gujaratpost.com/photos/${photo?.id || activeId}`;
  const mainFallback = FALLBACK_NEWS_IMAGES[currentPhotoIndex % FALLBACK_NEWS_IMAGES.length];

  const rawCaption = photo?.captionGu || photo?.caption || photo?.alt || (language === 'gu' ? 'ફોટો ગેલેરી' : language === 'hi' ? 'फोटो गैलरी' : 'Photo Gallery');
  const autoTranslatedTitle = useAutoTranslate(rawCaption, language);
  const title = (language !== 'gu' && autoTranslatedTitle) ? autoTranslatedTitle : rawCaption;
  const caption = title;
  
  const category = getPhotoCategoryBadge(photo, language);

  const rawDescription = useMemo(() => {
    if (photo && MOCK_DESCRIPTIONS[photo.id]) {
      const mock = MOCK_DESCRIPTIONS[photo.id];
      if (language === 'gu') return mock.gu;
      if (language === 'hi') return mock.hi || mock.gu;
      return mock.en || mock.gu;
    }
    if (language === 'hi' && photo?.captionHi && photo.captionHi !== photo.captionGu) {
      return photo.captionHi;
    }
    if (photo?.descriptionGu || photo?.description) {
      return photo.descriptionGu || photo.description;
    }
    if (photo?.contentGu || photo?.content) {
      return photo.contentGu || photo.content;
    }
    if (photo?.caption && photo.caption !== photo?.captionGu) {
      return photo.caption;
    }
    if (Array.isArray(photo?.images) && photo.images.length > 0) {
      const firstDesc = photo.images[0]?.description || photo.images[0]?.caption;
      if (firstDesc && firstDesc !== photo?.captionGu) {
        return firstDesc;
      }
    }
    return photo?.caption || photo?.captionGu || photo?.alt || '';
  }, [photo, language]);

  const autoTranslatedDesc = useAutoTranslate(rawDescription, language);
  const bodyText = (language !== 'gu' && autoTranslatedDesc) ? autoTranslatedDesc : rawDescription;
  const paragraphs = bodyText.split(/\n\n+/).filter(Boolean);

  const authorName = photo?.photographer || (language === 'gu' ? 'ગુજરાત પોસ્ટ' : language === 'hi' ? 'गुजरात पोस्ट' : 'Gujarat Post');
  const rawDate = photo?.publishedAt || photo?.createdAt || (photo as any)?.date || photo?.updatedAt;
  const publishedFormatted = formatArticleDateTime(rawDate);

  // Build the vertical continuous gallery story items matching the user's reference
  const galleryItems = useMemo(() => {
    let items: any[] = [];

    // 1. Direct photo.images or photo.galleryImages or photo.slides (e.g. if passed as array)
    let rawImages = (photo as any)?.images || (photo as any)?.galleryImages || (photo as any)?.slides;
    if (typeof rawImages === 'string') {
      try {
        const parsed = JSON.parse(rawImages);
        if (Array.isArray(parsed) && parsed.length > 0) rawImages = parsed;
      } catch {}
    }

    // 2. Check JSON string in photo.src
    if (!rawImages && typeof photo?.src === 'string' && photo.src.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(photo.src);
        if (Array.isArray(parsed) && parsed.length > 0) rawImages = parsed;
      } catch {}
    }

    // 3. Check newline or comma in photo.src
    if (!rawImages && typeof photo?.src === 'string' && (photo.src.includes('\n') || (photo.src.includes(',') && !photo.src.startsWith('data:')))) {
      const splitUrls = photo.src.includes('\n')
        ? photo.src.split('\n').map((s: string) => s.trim()).filter((s: string) => s.startsWith('http') || s.startsWith('/'))
        : photo.src.split(',').map((s: string) => s.trim()).filter((s: string) => s.startsWith('http') || s.startsWith('/'));
      if (splitUrls.length > 1) {
        rawImages = splitUrls;
      }
    }

    // 4. Check explicit multiple image props (image2, image3, secondaryImage, etc.)
    if (!rawImages) {
      const collected = [photo?.src].filter(Boolean);
      ['image2', 'image3', 'image4', 'image5', 'secondaryImage', 'galleryImage2'].forEach((k) => {
        const val = (photo as any)?.[k];
        if (val && typeof val === 'string' && val.trim()) collected.push(val.trim());
      });
      if (collected.length > 1) rawImages = collected;
    }

    if (Array.isArray(rawImages) && rawImages.length > 0) {
      items = rawImages.map((entry: any, idx: number) => {
        const itemSrc = sanitizeImageUrl(typeof entry === 'string' ? entry : (entry.src || entry.url || photo?.src || mainFallback));
        let itemDesc = (typeof entry === 'object' && (entry.description || entry.captionGu || entry.caption))
          ? (entry.description || entry.captionGu || entry.caption)
          : (paragraphs[idx] || (photo?.caption && photo?.caption !== title ? photo.caption : ''));

        if (itemDesc === title) {
          itemDesc = (photo?.caption && photo?.caption !== title) ? photo.caption : '';
        }

        if (typeof itemDesc === 'string' && itemDesc.startsWith(title)) {
          itemDesc = itemDesc.substring(title.length).replace(/^[:\s\-]+/, '');
        }

        return {
          id: (typeof entry === 'object' && entry.id) || `${photo?.id || 'item'}-${idx + 1}`,
          src: itemSrc,
          title: title,
          description: itemDesc,
          photographer: (typeof entry === 'object' && entry.photographer) || photo?.photographer || authorName,
          source: photo?.copyright || 'ગુજરાત પોસ્ટ',
        };
      });
    }

    // If only 1 image on photo and no rawImages array:
    if (items.length === 0) {
      let desc = photo?.caption && photo?.caption !== title ? photo.caption : (paragraphs[0] || '');
      if (desc === title) desc = '';
      if (typeof desc === 'string' && desc.startsWith(title)) {
        desc = desc.substring(title.length).replace(/^[:\s\-]+/, '');
      }

      items = [
        {
          id: photo?.id || 'photo-1',
          src: photo?.src || mainFallback,
          title: title,
          description: desc,
          photographer: photo?.photographer || authorName,
          source: photo?.copyright || 'ગુજરાત પોસ્ટ',
        },
      ];
    }

    return items;
  }, [photo, language, title, caption, paragraphs, authorName, mainFallback]);

  // Comprehensive description text for audio reading (TTS) and accessibility
  const audioDescription = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[\s.,?!।:;'"“”\-–—#*•]/g, '');
    const normTitle = norm(title);

    // 1. Gather all non-empty paragraph blocks that are distinct from the title
    const distinctParas = paragraphs
      .map((p: string) => p.trim())
      .filter((p: string) => {
        const np = norm(p);
        return np && np !== normTitle && !normTitle.startsWith(np);
      });

    const collectedDescs: string[] = [];
    if (distinctParas.length > 0) {
      collectedDescs.push(distinctParas.join('\n\n'));
    }

    // 2. If any slide in galleryItems has distinct text not yet present, include it
    galleryItems.forEach((item: any) => {
      const d = (item.description || item.caption || '').trim();
      const nd = norm(d);
      if (
        nd &&
        nd !== normTitle &&
        !normTitle.startsWith(nd) &&
        !collectedDescs.some((existing: string) => norm(existing).includes(nd))
      ) {
        collectedDescs.push(d);
      }
    });

    if (collectedDescs.length > 0) {
      return collectedDescs.join('\n\n');
    }

    if (bodyText && norm(bodyText) !== normTitle) {
      return bodyText.trim();
    }

    return '';
  }, [title, paragraphs, galleryItems, bodyText]);

  // Keyboard navigation for Lightbox and Main Slider
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'ArrowRight') setActiveLightboxIndex((prev) => (prev + 1) % galleryItems.length);
        if (e.key === 'ArrowLeft') setActiveLightboxIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
        if (e.key === 'Escape') setIsLightboxOpen(false);
      } else if (galleryItems.length > 1) {
        if (e.key === 'ArrowRight') setActiveSlideIndex((prev) => (prev + 1) % galleryItems.length);
        if (e.key === 'ArrowLeft') setActiveSlideIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryItems.length, isLightboxOpen]);

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

  const tags = useMemo(() => {
    if (language === 'gu') {
      return ['ફોટો ગેલેરી', 'ગુજરાત', 'અમદાવાદ', 'તાજા સમાચાર', 'લાઈવ', 'વિશેષ કવરેજ', 'તસવીરો', 'ગુજરાત પોસ્ટ'];
    } else if (language === 'hi') {
      return ['फोटो गैलरी', 'गुजरात', 'अहमदाबाद', 'ताजा समाचार', 'लाइव', 'विशेष कवरेज', 'तस्वीरें', 'गुजरात पोस्ट'];
    }
    return ['Photo Gallery', 'Gujarat', 'Ahmedabad', 'Breaking News', 'Live', 'Special Coverage', 'Pictures', 'Gujarat Post'];
  }, [language]);

  // Photos pool excluding active photo for the 8-grid and load more
  const activePhotoId = photo?.id || photo?._id || activeId;
  const initialPool = useMemo(() => {
    return (photosList || []).filter((p: any) => (p.id || p._id) !== activePhotoId);
  }, [photosList, activePhotoId]);

  const [morePhotosList, setMorePhotosList] = useState<any[]>(initialPool);
  const [visiblePhotoCount, setVisiblePhotoCount] = useState(8);
  const [galleryPage, setGalleryPage] = useState(1);
  const [loadingMoreGallery, setLoadingMoreGallery] = useState(false);
  const [hasMoreFromApi, setHasMoreFromApi] = useState(true);

  useEffect(() => {
    setMorePhotosList(initialPool);
  }, [initialPool]);

  const handleLoadMorePhotos = async () => {
    // 1. If we have more in memory than visiblePhotoCount, reveal next 8
    if (visiblePhotoCount + 8 <= morePhotosList.length) {
      setVisiblePhotoCount((prev) => prev + 8);
      return;
    }

    // 2. Fetch more from API
    if (hasMoreFromApi && !loadingMoreGallery) {
      setLoadingMoreGallery(true);
      try {
        const nextPage = galleryPage + 1;
        const res = await getPublicGallery({ page: nextPage, limit: 12, relatedToId: activePhotoId });
        if (res && res.length > 0) {
          setMorePhotosList((prev) => {
            const existingIds = new Set(prev.map((p) => p.id || p._id));
            const newItems = res.filter((p: any) => !existingIds.has(p.id || p._id) && (p.id || p._id) !== activePhotoId);
            return [...prev, ...newItems];
          });
          setGalleryPage(nextPage);
          setVisiblePhotoCount((prev) => prev + 8);
        } else {
          setHasMoreFromApi(false);
          setVisiblePhotoCount(morePhotosList.length);
        }
      } catch {
        setHasMoreFromApi(false);
        setVisiblePhotoCount(morePhotosList.length);
      } finally {
        setLoadingMoreGallery(false);
      }
    } else {
      setVisiblePhotoCount(morePhotosList.length);
    }
  };

  const sidebarRecommendedPool = morePhotosList;

  return (
    <>
      <ReadingProgressBar />
      
      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 cursor-pointer"
            aria-label="Close Lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative h-[85vh] w-[92vw] max-w-6xl flex items-center justify-center">
            <img
              src={galleryItems[activeLightboxIndex]?.src || mainFallback}
              alt={galleryItems[activeLightboxIndex]?.title || caption}
              className="max-h-[85vh] max-w-full object-contain mx-auto rounded-lg shadow-2xl"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== mainFallback) target.src = mainFallback;
              }}
            />

            {/* Prev / Next controls in lightbox */}
            {galleryItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveLightboxIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-[#B3121B] transition-all border border-white/20 cursor-pointer shadow-lg"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveLightboxIndex((prev) => (prev + 1) % galleryItems.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-[#B3121B] transition-all border border-white/20 cursor-pointer shadow-lg"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </>
            )}

            {/* Lightbox Caption Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/85 backdrop-blur-md px-6 py-2.5 text-center text-white border border-white/15 max-w-2xl w-full shadow-2xl">
              <p className="text-sm font-bold truncate">
                {galleryItems[activeLightboxIndex]?.title || caption}
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {activeLightboxIndex + 1} of {galleryItems.length} • {galleryItems[activeLightboxIndex]?.photographer || authorName}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="wrap w-full max-w-[1240px] mx-auto px-3 sm:px-5 lg:px-6 py-6 overflow-x-clip">
        <div className="article-grid" suppressHydrationWarning>
          <article suppressHydrationWarning>
            
            {/* Breadcrumbs matching NewsDetailClient */}
            <nav className="breadcrumb select-none flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-neutral-500 font-medium">
              <Link href="/" className="hover:text-[var(--red)] transition-colors">
                {language === 'gu' ? 'હોમ' : language === 'hi' ? 'होम' : 'Home'}
              </Link>
              <span>/</span>
              <Link href="/photos" className="hover:text-[var(--red)] transition-colors">
                {language === 'gu' ? 'ફોટો ગેલેરી' : language === 'hi' ? 'फोटो गैलरी' : 'Photo Gallery'}
              </Link>
              <span>/</span>
              <span className="text-neutral-700 dark:text-neutral-300 font-normal truncate max-w-[280px] sm:max-w-md">
                <AutoTranslateString text={rawCaption} language={language} />
              </span>
            </nav>

            {/* Category kick bar */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="art-kick">
                <span className="bar"></span>
                <span>
                  <AutoTranslateString text={category} language={language} /> · {language === 'gu' ? 'વિશેષ કવરેજ' : language === 'hi' ? 'विशेष कवरेज' : 'Special Coverage'}
                </span>
              </div>
              <span className="live-badge rounded bg-accent px-2.5 py-0.5 text-xs font-black text-white ml-2 shadow-sm">
                📷 {galleryItems.length} {galleryItems.length === 1 ? (language === 'gu' ? 'તસવીર' : language === 'hi' ? 'तस्वीर' : 'Photo') : (language === 'gu' ? 'તસવીરો' : language === 'hi' ? 'तस्वीरें' : 'Photos')}
              </span>
            </div>

            {/* Article Title */}
            <h1 className="article-title">
              <AutoTranslateString text={rawCaption} language={language} />
            </h1>

            {/* Byline / Author card matching NewsDetailClient */}
            <div className="byline select-none" suppressHydrationWarning>
              <div className="flex items-center gap-[11px]">
                <div className="shrink-0 w-[38px] h-[38px] rounded-full bg-[var(--red)] text-white flex items-center justify-center font-bold text-sm shadow">
                  GP
                </div>
                <div>
                  <div className="text-[13.5px] leading-tight">
                    <span className="text-[var(--ink-2)]">Published by: </span>
                    <span className="font-bold text-[var(--red)]">
                      {authorName}
                    </span>
                  </div>
                  {publishedFormatted && (
                    <div className="text-[12px] text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1" suppressHydrationWarning>
                      <span>
                        <span className="font-medium text-neutral-600 dark:text-neutral-300">Published on:</span>{' '}
                        {publishedFormatted}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                
                {/* Google News Follow Badge */}
                <a
                  href="https://news.google.com/search?q=gujaratpost&hl=gu-IN&gl=IN&ceid=IN%3Agu"
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

            {/* Top Share Row */}
            <div className="mb-6">
              <ArticleShareAudioBar
                title={title}
                body={audioDescription}
                articleUrl={photoUrl}
                language={language}
                copied={copied}
                copyUrl={copyUrl}
                saved={saved}
                handleToggleSave={() => setSaved(!saved)}
                audioText={audioDescription}
              />
            </div>

            {/* Gallery: Single heading + numbered image grid (1, 2, 3, 4...) */}
            <div className="gallery-stream mt-6">
              <article className="overflow-hidden rounded-2xl bg-white dark:bg-[#0f0f10] border border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-2xl">

                {/* Single shared description block at top */}
                {paragraphs.length > 0 && (
                  <div className="p-5 md:p-6 bg-white dark:bg-[#131315] border-b border-neutral-100 dark:border-neutral-800">
                    <p className="text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                      <AutoTranslateString text={paragraphs.slice(0, 2).join(' ')} language={language} />
                    </p>
                  </div>
                )}

                {/* Image display: Single main photo stage with Prev/Next slider controls and thumbnail bar */}
                <div className="p-1 sm:p-2 flex flex-col justify-center">
                  <div
                    className="relative group overflow-hidden rounded-xl sm:rounded-2xl bg-zinc-100 dark:bg-neutral-950 cursor-pointer w-full flex items-center justify-center min-h-[360px] sm:min-h-[460px] max-h-[82vh] shadow-inner select-none"
                    onClick={() => { setActiveLightboxIndex(activeSlideIndex); setIsLightboxOpen(true); }}
                  >
                    {/* Ambient blur backdrop for rich presentation without blank voids */}
                    <img
                      src={galleryItems[activeSlideIndex]?.src || mainFallback}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-60 dark:opacity-40 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-md pointer-events-none" aria-hidden="true" />

                    {/* Complete uncropped photo centered with natural proportions */}
                    <img
                      key={activeSlideIndex}
                      src={galleryItems[activeSlideIndex]?.src || mainFallback}
                      alt={galleryItems[activeSlideIndex]?.title || caption}
                      className="relative z-10 w-auto max-w-full h-auto max-h-[78vh] object-contain mx-auto transition-transform duration-500 ease-out group-hover:scale-[1.01]"
                      loading="eager"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== mainFallback) target.src = mainFallback;
                      }}
                    />

                    {/* Top-left Photo Count Badge */}
                    {galleryItems.length > 1 && (
                      <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1.5 rounded-full bg-black/80 backdrop-blur-md px-3 py-1 text-[12px] font-black text-white border border-white/20 shadow-lg pointer-events-none">
                        <Camera className="h-3.5 w-3.5 text-red-400" />
                        <span>{activeSlideIndex + 1} / {galleryItems.length}</span>
                      </div>
                    )}

                    {/* Top-right Lightbox Expand Icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveLightboxIndex(activeSlideIndex);
                        setIsLightboxOpen(true);
                      }}
                      className="absolute top-3.5 right-3.5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-[#B3121B] transition-all border border-white/20 shadow-lg cursor-pointer"
                      title={language === 'gu' ? 'મોટો ફોટો જુઓ' : language === 'hi' ? 'बड़ा फोटो देखें' : 'View Fullscreen'}
                      aria-label="Fullscreen"
                    >
                      <Maximize2 className="h-4.5 w-4.5 text-white" />
                    </button>

                    {/* Prev / Next navigation arrow buttons */}
                    {galleryItems.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSlideIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
                          }}
                          aria-label="Previous photo"
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/75 text-white hover:bg-[#B3121B] hover:scale-110 active:scale-95 transition-all shadow-xl backdrop-blur-md border border-white/20 cursor-pointer"
                        >
                          <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSlideIndex((prev) => (prev + 1) % galleryItems.length);
                          }}
                          aria-label="Next photo"
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/75 text-white hover:bg-[#B3121B] hover:scale-110 active:scale-95 transition-all shadow-xl backdrop-blur-md border border-white/20 cursor-pointer"
                        >
                          <ChevronRight className="h-6 w-6 stroke-[2.5]" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Navigation Bar for multi-image albums */}
                  {galleryItems.length > 1 && (
                    <div className="mt-2.5 p-3 bg-neutral-100 dark:bg-[#131315] rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[12.5px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-red-500" />
                          <span>
                            {language === 'gu'
                              ? `તસવીર ${activeSlideIndex + 1} / ${galleryItems.length}`
                              : language === 'hi'
                                ? `तस्वीर ${activeSlideIndex + 1} / ${galleryItems.length}`
                                : `Photo ${activeSlideIndex + 1} of ${galleryItems.length}`}
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveSlideIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length)}
                            className="p-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[#B3121B] hover:text-white transition-colors cursor-pointer"
                            aria-label="Previous thumbnail"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveSlideIndex((prev) => (prev + 1) % galleryItems.length)}
                            className="p-1 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[#B3121B] hover:text-white transition-colors cursor-pointer"
                            aria-label="Next thumbnail"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Thumbnails row */}
                      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1">
                        {galleryItems.map((item, idx) => {
                          const isSelected = idx === activeSlideIndex;
                          const thumbSrc = item.src || mainFallback;
                          return (
                            <button
                              key={item.id || idx}
                              type="button"
                              onClick={() => setActiveSlideIndex(idx)}
                              className={`relative shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-[#B3121B] scale-105 shadow-md ring-2 ring-[#B3121B]/40 opacity-100'
                                  : 'border-transparent opacity-60 hover:opacity-100 hover:border-neutral-400'
                              }`}
                            >
                              <img
                                src={thumbSrc}
                                alt={item.title || `Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  const fallback = FALLBACK_NEWS_IMAGES[idx % FALLBACK_NEWS_IMAGES.length];
                                  if (target.src !== fallback) target.src = fallback;
                                }}
                              />
                              <span className="absolute bottom-1 right-1 text-[10px] font-black text-white bg-black/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
                                {idx + 1}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Photographer credit at bottom */}
                <div className="px-4 py-3 bg-white dark:bg-[#131315] border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-[13px] text-neutral-500 dark:text-neutral-400">
                    <Camera className="inline h-3.5 w-3.5 mr-1 text-red-500" />
                    {language === 'gu' ? 'તસવીર:' : language === 'hi' ? 'तस्वीर:' : 'Photo:'} {authorName}
                  </span>
                </div>
              </article>
            </div>

            {/* Topics Tags Bar matching NewsDetailClient */}
            <div className="flex flex-wrap items-center gap-2 mt-10 select-none border-t border-neutral-200 dark:border-neutral-800 pt-6">
              <span className="topics-title font-extrabold text-neutral-900 dark:text-white mr-2 text-[14.5px] tracking-wide uppercase border-b-2 border-[#B3121B] pb-0.5">
                {language === 'gu' ? 'ટોપિક્સ:' : language === 'hi' ? 'વિષય:' : 'Topics:'}
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

            {/* 8 More Photos Section with "વધુ જુઓ" Load More */}
            {morePhotosList.length > 0 && (
              <section className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                {/* Header: Rounded red pill + Title + View All link */}
                <div className="flex items-center justify-between pb-3 mb-5 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="w-[5px] h-[19px] bg-[#B3121B] rounded-full inline-block shrink-0" />
                    <h3 className="text-[19px] font-bold text-neutral-900 dark:text-white tracking-tight leading-none">
                      {language === 'gu' ? 'વધુ ફોટો' : language === 'hi' ? 'अन्य फोटो' : 'More Photos'}
                    </h3>
                  </div>
                  <Link
                    href="/photos"
                    className="text-[13.5px] font-bold text-[#B3121B] hover:underline flex items-center gap-0.5 shrink-0"
                  >
                    {language === 'gu' ? 'બધા જુઓ' : language === 'hi' ? 'सभी देखें' : 'View All'} →
                  </Link>
                </div>

                {/* Grid of Photo Cards — 8 cards initially */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {morePhotosList.slice(0, visiblePhotoCount).map((item: any, idx: number) => (
                    <MorePhotoCard
                      key={item.id || item._id || idx}
                      item={item}
                      index={idx}
                      language={language}
                    />
                  ))}
                </div>

                {/* Load More Button ("વધુ જુઓ") */}
                {visiblePhotoCount < morePhotosList.length && (
                  <div className="flex justify-center mt-8">
                    <button
                      type="button"
                      onClick={handleLoadMorePhotos}
                      disabled={loadingMoreGallery}
                      className="group inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-accent px-9 py-3 text-accent hover:bg-accent hover:text-white transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 select-none bg-card"
                    >
                      {loadingMoreGallery ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-current" />
                          <span className="text-base sm:text-lg font-black tracking-wide leading-none">
                            {language === 'gu' ? 'લોડ થઈ રહ્યું છે...' : language === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-base sm:text-lg font-black tracking-wide leading-none">
                            {language === 'gu' ? 'વધુ જુઓ' : language === 'hi' ? 'और देखें' : 'View More'}
                          </span>
                          <ChevronDown className="w-5 h-5 stroke-[3] transition-transform duration-200 group-hover:translate-y-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </section>
            )}
          </article>

          {/* Sidebar - Latest News */}
          <aside className="select-none h-fit sticky top-4" style={{ width: '100%', maxWidth: '336px' }} suppressHydrationWarning>
            {/* Header: Rounded red capsule + લેટેસ્ટ સમાચાર + વધુ જુઓ → */}
            <div className="flex items-center justify-between pb-3 mb-1 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-[5px] h-[19px] bg-[#B3121B] rounded-full inline-block shrink-0" />
                <h2 className="text-[18px] font-bold text-neutral-900 dark:text-white tracking-tight leading-none">
                  {language === 'gu' ? 'લેટેસ્ટ સમાચાર' : language === 'hi' ? 'लेटेस्ट समाचार' : 'Latest News'}
                </h2>
              </div>
              <Link
                href="/category/trending"
                className="text-[13.5px] font-bold text-[#B3121B] hover:underline whitespace-nowrap flex items-center gap-0.5 shrink-0"
              >
                {language === 'gu' ? 'વધુ જુઓ' : language === 'hi' ? 'और देखें' : 'View More'} →
              </Link>
            </div>

            {/* Latest News List — text left, image right */}
            <div className="space-y-0">
              {(dbTrending && dbTrending.length > 0 ? dbTrending : sidebarRecommendedPool).slice(0, 8).map((item: any, index: number) => {
                const isNewsItem = !!(item.title || item.titleGu || item.titleEn);
                const rawItemTitle = isNewsItem
                  ? (getLocalized(language, { en: item.title || item.titleEn || '', gu: item.titleGu || item.title || '', hi: item.titleHi || item.title || '' }) || item.title || '')
                  : (getLocalized(language, { en: item.caption || '', gu: item.captionGu || item.caption || '', hi: item.captionHi || item.caption || '' }) || item.caption || '');
                const itemCategory = isNewsItem
                  ? (getCategoryLabel(item, language) || (language === 'gu' ? 'સમાચાર' : language === 'hi' ? 'समाचार' : 'News'))
                  : getPhotoCategoryBadge(item, language);
                const itemHref = isNewsItem ? `/news/${item.slug || item.id}` : `/photos/${item.id}`;
                const relTime = formatTimeAgo(item.createdAt || item.publishedAt, language);

                return (
                  <Link
                    key={item.id || index}
                    href={itemHref}
                    className="flex items-center justify-between gap-3 py-3 border-b border-neutral-200 dark:border-neutral-800 hover:opacity-90 transition-opacity group"
                  >
                    {/* Text — left side */}
                    <div className="flex-1 min-w-0 pr-1">
                      <span className="text-[12.5px] font-bold text-[#B3121B] block mb-1">
                        <AutoTranslateString text={itemCategory} language={language} />
                      </span>
                      <h3 className="text-[14.5px] font-bold leading-[1.35] text-neutral-900 dark:text-neutral-100 group-hover:text-[#B3121B] transition-colors line-clamp-2">
                        <AutoTranslateString text={rawItemTitle} language={language} />
                      </h3>
                      <span className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1.5 block" suppressHydrationWarning>
                        {relTime}
                      </span>
                    </div>
                    {/* Thumbnail — right side */}
                    <div className="relative shrink-0 w-[124px] h-[82px] rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                      <SidebarThumb item={item} index={index} itemTitle={rawItemTitle} />
                    </div>
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
