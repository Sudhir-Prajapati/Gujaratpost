'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Fragment } from 'react';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Flame, Eye, Play, ChevronRight, ChevronLeft, Camera, X, Bookmark, Sun, Cloud, CloudRain, Shield, Trophy, TrendingUp, TrendingDown, Wind, ChevronDown, ArrowUpRight, Thermometer, Droplet, MoreVertical, Fuel, Megaphone, Radio, MapPin, Sparkles, Loader2 } from 'lucide-react';
import {
  getArticleTitle,
  getArticleExcerpt,
  formatDate,
  formatViews,
  getCategoryLabel,
  getLocationLabel,
  VIDEOS,
  getLocalized,
  ARTICLES,
  getArticlesByCategory,
  PHOTOS,
} from '@/data';
import { getCategoryColor, getTrendingTopicHref } from '@/lib/utils';
import { safeYouTubeId } from '@/lib/youtube';
import { getPublicArticles, getPublicVideos, getHeroSettings, getMarketRates, getPublicWeather, getPublicCategories, getLiveCenterData, getPublicGallery, getPublicAstrology } from '@/lib/api';

import { useApp } from '@/components/AppProvider';
import type { Article, Language } from '@/types';
import InstagramStories from '@/components/sections/InstagramStories';
import WebStoriesSection from '@/components/sections/WebStoriesSection';
import YouTubeShorts from '@/components/sections/YouTubeShorts';
import { ZODIAC_SIGNS, ZodiacSign } from '@/components/sections/AstrologySection';
import { ZodiacIcon, GUJARAT_ZODIAC_LETTERS } from '@/components/ui/ZodiacIcon';
import ZodiacDetailModal from '@/components/sections/ZodiacDetailModal';
import LatestUpdatesSection from '@/components/sections/LatestUpdatesSection';
import TrendingSection from '@/components/sections/TrendingSection';
import Advertisement from '@/components/ads/Advertisement';
import AdSectionBanner from '@/components/ads/AdSectionBanner';
import SidebarAdBanner from '@/components/ads/SidebarAdBanner';
import CategorySection from '@/components/sections/CategorySection';
import RandomAdsSection from '@/components/ads/RandomAdsSection';
import ArticleMedia from '@/components/ui/ArticleMedia';
import VideoSection from '@/components/sections/VideoSection';
import { useIsApk } from '@/lib/useIsApk';
import ApkHomeFeed from '@/components/apk/ApkHomeFeed';
import ApkHomeSkeleton from '@/components/apk/ApkHomeSkeleton';
import { AutoArticleTitle, AutoArticleExcerpt, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';

import dynamic from 'next/dynamic';

const Skeleton = ({ h = 'h-[200px]' }: { h?: string }) => (
  <div className={`w-full ${h} animate-pulse rounded-2xl bg-muted/40`} />
);

const VideoDesk = dynamic(() => import('./home/VideoDesk'), { loading: () => <Skeleton h="h-[160px]" /> });
const CityHyperlocalSection = dynamic(() => import('./home/CityHyperlocalSection'), { loading: () => <Skeleton h="h-[280px]" /> });
const CrimeSection = dynamic(() => import('./home/CrimeSection'), { loading: () => <Skeleton h="h-[280px]" /> });
const PoliticsSection = dynamic(() => import('./home/PoliticsSection'), { loading: () => <Skeleton h="h-[280px]" /> });
const FactCheckSection = dynamic(() => import('./home/FactCheckSection'), { loading: () => <Skeleton h="h-[200px]" /> });
const NationalSection = dynamic(() => import('./home/NationalSection'), { loading: () => <Skeleton h="h-[280px]" /> });
const WorldSection = dynamic(() => import('./home/WorldSection'), { loading: () => <Skeleton h="h-[280px]" /> });
const LiveCenterSection = dynamic(() => import('./home/LiveCenterSection'), { loading: () => <Skeleton h="h-[200px]" /> });
const WeatherDashboardSection = dynamic(() => import('./home/WeatherDashboardSection'), { loading: () => <Skeleton h="h-[200px]" /> });
const DynamicCategorySection = dynamic(() => import('./home/DynamicCategorySection'));
const EntertainTechLifeSection = dynamic(() => import('./home/EntertainTechLifeSection'), { loading: () => <Skeleton h="h-[280px]" /> });
const PhotoGallerySection = dynamic(() => import('./home/PhotoGallerySection'), { loading: () => <Skeleton h="h-[420px]" /> });


const stripHtmlTags = (str?: string) => (str || '').replace(/<[^>]*>?/gm, '').replace(/!\[.*?\]\(.*?\)/g, '');

const CHANNEL_URL = 'https://www.youtube.com/@Gujaratpostnews';
const CHANNEL_ID = 'UCqQ8YbFSZ4j8J4iVJOHurTw';
const LATEST_VIDEO_ID = 'A_5vL-ngK4M';

const HOME_IMAGE_FALLBACKS = [
  '/assets/demo/3.jpg',
  '/assets/demo/4.jpg',
  '/assets/demo/1.jpg',
  '/assets/demo/2.jpg',
  '/assets/demo/5.jpg',
  '/assets/demo/6.jpg',
  '/assets/demo/7.jpg',
  '/assets/demo/8.jpg',
];

const MOCK_TITLE_MAP: Record<string, { en: string; hi: string }> = {
  'સંસદનું ચોમાસુ સત્ર આજથી! અનેક મોટા ખરડા પર થશે ઘમાસાણ': {
    en: 'Parliament Monsoon Session begins today! Clash expected over key bills',
    hi: 'संसद का मानसून सत्र आज से! कई बड़े विधेयकों पर होगा हंगामा'
  },
  'ખુશખબર! GDP વૃદ્ધિ દર અંદાજ કરતાં વધુ નોંધાયો': {
    en: 'Good news! GDP growth rate exceeds expectations',
    hi: 'खुशखबरी! जीडीपी वृद्धि दर अनुमान से अधिक दर्ज'
  },
  'બે નવી વંદે ભારત ટ્રેનોને લીલી ઝંડી, જાણો રૂટ': {
    en: 'Two new Vande Bharat trains flagged off, know routes',
    hi: 'दो नई वंदे भारत ट्रेनों को हरी झंडी, जानें रूट'
  },
  'કેન્દ્ર સરકારની મોટી જાહેરાત! નવી યોજનાથી કરોડો લોકોને લાભ': {
    en: 'Center announces new scheme, millions to benefit',
    hi: 'केंद्र सरकार की बड़ी घोषणा! नई योजना से करोड़ों को लाभ'
  },
  'નવી રાષ્ટ્રીય શિક્ષણ નીતિનો બીજો તબક્કો આગામી સત્રથી લાગુ, જાણો શું બદલાશે': {
    en: 'Second phase of New National Education Policy from next session, know details',
    hi: 'नई राष्ट्रीय शिक्षा नीति का दूसरा चरण अगले सत्र से लागू, जानें क्या बदलेगा'
  },
  'ભારતીય સેનાને મળી મોટી તાકાત! સ્વદેશી બનાવટનું નવું સંરક્ષણ સાધન સામેલ': {
    en: 'Indian Army gets major boost! New indigenous defense equipment inducted',
    hi: 'भारतीय सेना को मिली बड़ी ताकत! नया स्वदेशी रक्षा उपकरण शामिल'
  },
  'સુપ્રીમ કોર્ટનો મોટો ચુકાદો! લાખો કેસોને સીધી અસર': {
    en: 'Supreme Court historic judgment! Direct impact on millions of cases',
    hi: 'सुप्रीम कोर्ट का बड़ा फैसला! लाखों मामलों पर सीधा असर'
  },
  'કરોડો લોકોને ફાયદો! કેન્દ્રે જાહેર કરી નવી આરોગ્ય વીમા યોજના': {
    en: 'Millions to benefit! Center launches new health insurance scheme',
    hi: 'करोड़ों लोगों को फायदा! केंद्र ने घोषित की नई स्वास्थ्य बीमा योजना'
  },
  'ખેડૂતો માટે ખુશખબર! નવી MSP જાહેર, કઠોળના ભાવમાં વધારો': {
    en: 'Good news for farmers! New MSP declared, pulse prices hiked',
    hi: 'किसानों के लिए खुशखबरी! नई एमएसपी घोषित, दालों के दाम बढ़े'
  },
  'દેશમાં 6G ટ્રાયલ શરૂ! ટૂંક સમયમાં પસંદગીના શહેરોમાં ટેસ્ટિંગ': {
    en: '6G trials begin in India! Testing soon in select cities',
    hi: 'देश में 6G ट्रायल शुरू! जल्द चुनिंदा शहरों में टेस्टिंग'
  },
  'મહિલા ઉદ્યોગ સાહસિકો માટે મોટી રાહત! નવી લોન યોજનામાં 0% વ્યાજ': {
    en: 'Big relief for women entrepreneurs! 0% interest in new loan scheme',
    hi: 'महिला उद्यमियों के लिए बड़ी राहत! नई ऋण योजना में 0% ब्याज'
  },
  'દેશના 10 મોટા શહેરોને જોડતો નવો એક્સપ્રેસવે નેટવર્ક મંજૂર!': {
    en: 'New expressway network approved connecting 10 major cities!',
    hi: 'देश के 10 बड़े शहरों को जोड़ने वाला नया एक्सप्रेसवे नेटवर्क मंजूर!'
  },
  'ભારતની મોટી જીત! સંયુક્ત રાષ્ટ્રમાં પ્રસ્તાવને વ્યાપક સમર્થન': {
    en: 'India’s major victory! Broad support for proposal in United Nations',
    hi: 'भारत की बड़ी जीत! संयुक्त राष्ट्र में प्रस्ताव को व्यापक समर्थन'
  },
  'મોટાભાગના સભ્ય દેશોએ ભારતના પ્રસ્તાવને ટેકો આપતા આંતરરાષ્ટ્રીય મંચ પર દેશની સ્થિતિ વધુ મજબૂત બની.': {
    en: 'With broad support from member nations, India’s global standing strengthens further.',
    hi: 'अधिकांश सदस्य देशों द्वारा भारत के प्रस्ताव का समर्थन करने से स्थिति मजबूत हुई।'
  },
  'યુરોપમાં નવી વ્યાપાર સંધિ પર હસ્તાક્ષર, ભારતને પણ ફાયદો': {
    en: 'New trade treaty signed in Europe, India to benefit as well',
    hi: 'यूरोप में नई व्यापार संधि पर हस्ताक्षर, भारत को भी फायदा'
  },
  'અમેરિકામાં ભારતીય સમુદાયનું વિશાળ સાંસ્કૃતિક આયોજન, જુઓ ઝલક': {
    en: 'Grand cultural event by Indian community in USA, see glimpses',
    hi: 'अमेरिका में भारतीय समुदाय का विशाल सांस्कृतिक आयोजन, देखें झलक'
  },
  'એશિયાઈ દેશો વચ્ચે નવી આર્થિક ભાગીદારીની મોટી જાહેરાત': {
    en: 'Major announcement of new economic partnership among Asian nations',
    hi: 'एशियाई देशों के बीच नई आर्थिक साझेदारी की बड़ी घोषणा'
  },
  'ગલ્ફ દેશોમાં ભારતીય શ્રમિકો માટે ખુશખબર! નવી કલ્યાણ યોજના જાહેર': {
    en: 'Good news for Indian workers in Gulf countries! New welfare scheme announced',
    hi: 'खाड़ी देशों में भारतीय श्रमिकों के लिए खुशखबरी! नई कल्याण योजना घोषित'
  },
  'ગુજરાત ચૂંટણી 2027 નજીક! જિલ્લાઓમાં તૈયારીઓ તેજ, સત્તાધારી પક્ષ સક્રિય': {
    en: 'Gujarat Election 2027 near! Preparations active in districts',
    hi: 'गुजरात चुनाव 2027 नजदीक! जिलों में तैयारियां तेज, सत्ताधारी दल सक्रिय'
  },
  'CMની મોટી બેઠક! વિકાસ પ્રોજેક્ટ માટે સમીક્ષા, ગ્રામીણ વિસ્તારો પર ભાર': {
    en: 'CM holds major meeting! Review of development projects, focus on rural areas',
    hi: 'सीएम की बड़ी बैठक! विकास परियोजनाओं के लिए समीक्षा, ग्रामीण क्षेत्रों पर जोर'
  },
  'ભાજપ પ્રદેશ કારોબારીની બેઠકમાં સંગઠન વિસ્તરણ પર મોટી ચર્ચા': {
    en: 'BJP state executive meeting discusses organizational expansion',
    hi: 'भाजपा प्रदेश कार्यकारिणी की बैठक में संगठन विस्तार पर बड़ी चर्चा'
  },
  'AAPનો મોટો દાવો! ગ્રામ્ય ગુજરાતમાં ભૂ-સ્તરીય નેટવર્ક વિસ્તાર્યું': {
    en: 'AAP claims major ground-level network expansion in rural Gujarat',
    hi: 'आप का बड़ा दावा! ग्रामीण गुजरात में भू-स्तरीय नेटवर्क का विस्तार'
  },
  'મોટો વિવાદ! અમદાવાદ મ્યુનિ. કમિશનરે તંત્ર સામે વાંધો ઉઠાવ્યો': {
    en: 'Major controversy! Ahmedabad Muni Commissioner raises objection against system',
    hi: 'बड़ा विवाद! अहमदाबाद नगर आयुक्त ने प्रणाली के खिलाफ आपत्ति जताई'
  },
  'સૈન્ય તાલીમમાં મોટી ગેરરીતિ! 100થી વધુ પ્રમોશન રદ કરાયા': {
    en: 'Major irregularity in military training! Over 100 promotions cancelled',
    hi: 'सैन्य प्रशिक्षण में बड़ी गड़बड़ी! 100 से अधिक पदोन्नति रद्द की गईं'
  },
  'કોંગ્રેસે ખોલ્યા પત્તા! 2027 ચૂંટણી ઝુંબેશ વ્યૂહ જાહેર કર્યો': {
    en: 'Congress reveals cards! Unveils 2027 election campaign strategy',
    hi: 'कांग्रेस ने खोले पत्ते! 2027 चुनाव अभियान रणनीति घोषित की'
  },
  'વિધાનસભા ચોમાસુ સત્રમાં હોબાળો! વિપક્ષે બેરોજગારી મુદ્દે સ્થગન પ્રસ્તાવ આપ્યો': {
    en: 'Uproar in Assembly Monsoon session! Opposition submits adjournment motion on unemployment',
    hi: 'विधानसभा मानसून सत्र में हंगामा! विपक्ष ने बेरोजगारी मुद्दे पर स्थगन प्रस्ताव दिया'
  },
  'હાઈકોર્ટની આકરી નોટિસ! રાજ્ય સરકારને ભરતી પ્રક્રિયા અંગે જવાબ માંગ્યો': {
    en: 'Strict notice from High Court! State Government asked for response on recruitment process',
    hi: 'हाईकोर्ट का सख्त नोटिस! राज्य सरकार से भर्ती प्रक्रिया पर जवाब मांगा'
  },
  'કેન્દ્રીય મંત્રીની ગુજરાત મુલાકાત! નવા ઔદ્યોગિક કોરિડોરની જાહેરાત શક્ય': {
    en: 'Union Minister visits Gujarat! Announcement of new industrial corridor likely',
    hi: 'केंद्रीय मंत्री का गुजरात दौरा! नए औद्योगिक गलियारे की घोषणा संभव'
  },
  'મતદાર યાદી સુધારણા ઝુંબેશ શરૂ! નાગરિકોને ઓનલાઈન નોંધણીની અપીલ': {
    en: 'Voter list revision drive starts! Appeal to citizens for online registration',
    hi: 'मतदाता सूची पुनरीक्षण अभियान शुरू! नागरिकों से ऑनलाइन पंजीकरण की अपील'
  },
  'યુવાનો માટે મોટી તક! પોલીસ ભરતીમાં 10,000 જગ્યાઓ ટૂંક સમયમાં ભરાશે': {
    en: 'Great opportunity for youth! 10,000 vacancies in police recruitment to be filled soon',
    hi: 'युवाओं के लिए बड़ा मौका! पुलिस भर्ती में 10,000 पद जल्द भरे जाएंगे'
  },
  'અમદાવાદમાં કરોડોનું કૌભાંડ! ફેક ઇન્વેસ્ટમેન્ટ એપ નેટવર્કનો પર્દાફાશ, અનેક ધરપકડ': {
    en: 'Crores scam in Ahmedabad! Fake investment app network busted, many arrested',
    hi: 'अहमदाबाद में करोड़ों का घोटाला! फेक निवेश ऐप नेटवर्क का भंडाफोड़, कई गिरफ्तार'
  },
  'સુરત પોલીસની સંયુક્ત રેડ! કરોડોની મુદ્દામાલ જપ્ત': {
    en: 'Joint raid by Surat police! Contraband worth crores seized',
    hi: 'सूरत पुलिस की संयुक्त छापेमारी! करोड़ों का माल जब्त'
  },
  'રાજકોટમાં અપહરણ ગેંગનો પર્દાફાશ! પાંચ આરોપી ઝડપાયા': {
    en: 'Kidnapping gang exposed in Rajkot! Five suspects arrested',
    hi: 'राजकोट में अपहरण गिरोह का पर्दाफाश! पांच आरोपी गिरफ्तार'
  },
  'વડોદરામાં ATM સ્કીમિંગ ગેંગ ઝડપાઈ! મહિનાઓની તપાસ બાદ ભાંડો ફૂટ્યો': {
    en: 'ATM skimming gang caught in Vadodara! Secret busted after months of investigation',
    hi: 'वडोदरा में एटीएम स्किमिंग गैंग पकड़ी गई! महीनों की जांच के बाद खुलासा'
  },
  'ભાવનગરમાં દારૂનો મોટો જથ્થો ઝડપાયો, ત્રણ આરોપી કબજે': {
    en: 'Huge alcohol haul seized in Bhavnagar, three suspects in custody',
    hi: 'भावनगर में शराब का बड़ा जहीरा जब्त, तीन आरोपी हिरासत में'
  },
  'જૂનાગઢમાં ઓનલાઇન લોન એપના નામે બ્લેકમેલિંગ! ફરિયાદ નોંધાઈ': {
    en: 'Blackmailing in Junagadh in the name of online loan apps! FIR registered',
    hi: 'जूनागढ़ में ऑनलाइन लोन ऐप के नाम पर ब्लैकमेलिंग! प्राथमिकी दर्ज'
  },
  'સાવધાન! વાયરલ વીડિયો ગુજરાતના પૂરનો નથી, જૂનો અને અલગ રાજ્યનો છે': {
    en: 'Caution! Viral video is not from Gujarat floods, it is old and from another state',
    hi: 'सावधान! वायरल वीडियो गुजरात बाढ़ का नहीं, पुराना और दूसरे राज्य का है'
  },
  'હા, રાજ્યમાં ખેડૂત સહાય યોજનાની રકમમાં ખરેખર વધારો કરાયો છે!': {
    en: 'Yes, farmer assistance scheme amount has indeed been increased in the state!',
    hi: 'हां, राज्य में किसान सहायता योजना की राशि में वास्तव में वृद्धि की गई है!'
  },
  'સોશિયલ મીડિયા પર ફરતો મેસેજ: "કાલથી પેટ્રોલ ₹50 થશે" – જાણો હકીકત': {
    en: 'Viral message on social media: "Petrol will be ₹50 from tomorrow" – Know fact',
    hi: 'सोशल मीडिया पर वायरल संदेश: "कल से पेट्रोल ₹50 होगा" – जानें सच'
  },
  'શું ખરેખર રાજ્યમાં તમામ શાળાઓ આગામી સપ્તાહથી બંધ રહેશે? જાણો સાચી વિગત': {
    en: 'Will all schools in state really remain closed from next week? Know details',
    hi: 'क्या वास्तव में राज्य में सभी स्कूल अगले हफ्ते से बंद रहेंगे? जानें सच'
  },
  'હા, રાજ્ય સરકારે વરિષ્ઠ નાગરિકો માટે બસ ભાડામાં ખરેખર છૂટ જાહેર કરી છે': {
    en: 'Yes, state government has announced bus fare discount for senior citizens',
    hi: 'हां, राज्य सरकार ने वरिष्ठ नागरिकों के लिए बस किराए में छूट घोषित की है'
  },
  'વોટ્સએપ પર ફરતો "નવો બેંક નિયમ" મેસેજ ખોટો, RBIએ કર્યો ઈનકાર': {
    en: '"New bank rule" message circulating on WhatsApp is false, RBI denies',
    hi: 'व्हाट्सएप पर वायरल "नया बैंक नियम" संदेश झूठा, आरबीआई ने किया इनकार'
  },
  'એ તસવીર અમદાવાદ પુલ તૂટવાની નથી, ત્રણ વર્ષ જૂની અને બીજા દેશની છે': {
    en: 'That image is not of Ahmedabad bridge collapse, it is 3 years old and from another country',
    hi: 'वह तस्वीर अहमदाबाद पुल ढहने की नहीं, तीन साल पुरानी और दूसरे देश की है'
  },
  'હા, રાજ્યમાં નવી રોજગાર ભરતી માટે ઓનલાઈન અરજી ખરેખર શરૂ થઈ ગઈ છે': {
    en: 'Yes, online application for new employment recruitment has started in state',
    hi: 'हां, राज्य में नई रोजगार भर्ती के लिए ऑनलाइन आवेदन वास्तव में शुरू हो गया है'
  }
};

export const getMockTitle = (item: any, language: Language): string => {
  if (!item) return '';
  if (language === 'en') {
    if (item.titleEn) return item.titleEn;
    if (item.title) return item.title;
    if (item.titleGu && MOCK_TITLE_MAP[item.titleGu]) return MOCK_TITLE_MAP[item.titleGu].en;
    return item.titleGu || '';
  }
  if (language === 'hi') {
    if (item.titleHi) return item.titleHi;
    if (item.titleGu && MOCK_TITLE_MAP[item.titleGu]) return MOCK_TITLE_MAP[item.titleGu].hi;
    return item.titleGu || item.title || '';
  }
  return item.titleGu || item.title || '';
};

export const getMockRelativeTime = (timeStrGu: string | undefined, language: Language): string => {
  if (!timeStrGu) return language === 'en' ? '1 hour ago' : language === 'hi' ? '1 घंटा पहले' : '1 કલાક પહેલાં';
  if (language === 'en') {
    if (timeStrGu.includes('1 કલાક')) return '1 hour ago';
    if (timeStrGu.includes('2 કલાક')) return '2 hours ago';
    if (timeStrGu.includes('3 કલાક')) return '3 hours ago';
    if (timeStrGu.includes('4 કલાક')) return '4 hours ago';
    if (timeStrGu.includes('5 કલાક')) return '5 hours ago';
    if (timeStrGu.includes('6 કલાક')) return '6 hours ago';
    if (timeStrGu.includes('7 કલાક')) return '7 hours ago';
    if (timeStrGu.includes('8 કલાક')) return '8 hours ago';
    if (timeStrGu.includes('10 કલાક')) return '10 hours ago';
    if (timeStrGu.includes('11 કલાક')) return '11 hours ago';
    if (timeStrGu.includes('12 કલાક')) return '12 hours ago';
    if (timeStrGu.includes('13 કલાક')) return '13 hours ago';
    if (timeStrGu.includes('14 કલાક')) return '14 hours ago';
    if (timeStrGu.includes('30 મિનિટ')) return '30 mins ago';
    return timeStrGu.replace('કલાક પહેલાં', 'hours ago').replace('મિનિટ પહેલાં', 'mins ago');
  }
  if (language === 'hi') {
    if (timeStrGu.includes('1 કલાક')) return '1 घंटा पहले';
    if (timeStrGu.includes('2 કલાક')) return '2 घंटे पहले';
    if (timeStrGu.includes('3 કલાક')) return '3 घंटे पहले';
    if (timeStrGu.includes('4 કલાક')) return '4 घंटे पहले';
    if (timeStrGu.includes('5 કલાક')) return '5 घंटे पहले';
    if (timeStrGu.includes('6 કલાક')) return '6 घंटे पहले';
    if (timeStrGu.includes('7 કલાક')) return '7 घंटे પહેલાં';
    if (timeStrGu.includes('8 કલાક')) return '8 घंटे पहले';
    if (timeStrGu.includes('10 કલાક')) return '10 घंटे पहले';
    if (timeStrGu.includes('11 કલાક')) return '11 घंटे पहले';
    if (timeStrGu.includes('12 કલાક')) return '12 घंटे पहले';
    if (timeStrGu.includes('13 કલાક')) return '13 घंटे पहले';
    if (timeStrGu.includes('14 કલાક')) return '14 घंटे पहले';
    if (timeStrGu.includes('30 મિનિટ')) return '30 मिनट पहले';
    return timeStrGu.replace('કલાક પહેલાં', 'ઘંટે પહેલાં').replace('મિનિટ પહેલાં', 'મિનટ પહેલાં');
  }
  return timeStrGu;
};

export const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
];

export function getArticleImage(article?: Article | null): string {
  if (!article) return DEMO_IMAGES[0];
  const raw = article.image || (article as any).featuredImage || (article as any).thumbnail;
  if (raw && typeof raw === 'string' && raw.trim() !== '') {
    return raw.trim();
  }
  let hash = 0;
  const key = article.id || article.slug || article.titleGu || article.title || '';
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % DEMO_IMAGES.length;
  return DEMO_IMAGES[idx];
}

function makeHomeImagesUnique<T extends Article>(sections: T[][]): T[][] {
  return sections.map((section) =>
    section.map((article) => {
      if (!article) return article;
      const image = getArticleImage(article);
      return { ...article, image };
    })
  );
}

/* ===========================================================================
   Main HeroSection -- tv9gujarati.com style 3-column layout
=========================================================================== */
// Helper to safely extract category slug from article (handles object or string)
function getCatSlug(a: any): string {
  if (!a) return '';
  const cat = (a as any).category;
  if (cat && typeof cat === 'object') {
    return ((cat.slug || cat.name || '')).toLowerCase();
  }
  const slug = (a as any).categorySlug || cat || '';
  return (typeof slug === 'string' ? slug : '').toLowerCase();
}

export default function HeroSection({
  initialArticles = [],
  initialVideos = [],
  initialHeroSettings = null,
  initialCategories = [],
  initialMarketRates = null,
  initialWeatherData = null,
  initialCategoryArticles = {},
  initialReels = [],
}: {
  initialArticles?: Article[];
  initialVideos?: any[];
  initialHeroSettings?: any;
  initialCategories?: any[];
  initialMarketRates?: any;
  initialWeatherData?: any;
  initialCategoryArticles?: Record<string, Article[]>;
  initialReels?: any[];
}) {
  const { language } = useApp();
  const [videoMode, setVideoMode] = useState<'latest' | 'live'>('latest');

  const [articlesList, setArticlesList] = useState<Article[]>(initialArticles);
  const [videosList, setVideosList] = useState<any[]>(initialVideos);

  // Helper to fill pool to N items
  const fillPool = (priorityArts: Article[], fallbackArts: Article[], targetSize: number): Article[] => {
    const pool = [...priorityArts];
    for (const item of fallbackArts) {
      if (pool.length >= targetSize) break;
      if (item && item.id && !pool.some((p) => p.id === item.id)) {
        pool.push(item);
      }
    }
    return pool;
  };

  // Helper to ensure an article is published before featuring in public feeds
  const isPublicArticle = (a: any): boolean => {
    if (!a) return false;
    if (a.status === 'DRAFT' || a.status === 'ARCHIVED' || a.status === 'IN_REVIEW') return false;
    if (a.isPublished === false) return false;
    return true;
  };

  const publishedInitialArticles = (initialArticles || []).filter(isPublicArticle);

  // Helper to compute heroPool identically for both initial SSR state and client useEffect
  const computeHeroPoolList = (arts: Article[], heroSettingsData: any) => {
    const pubArts = (arts || []).filter(isPublicArticle);
    const slots: Article[] = (heroSettingsData?.slots || []).filter(isPublicArticle);
    const slotIds = new Set(slots.map((a: Article) => a.id));

    const customGridArts: Article[] = (heroSettingsData?.heroGridArticles || []).filter(isPublicArticle);
    const featuredArts = pubArts.filter((a: Article) => a.isFeatured);

    const autoPool = pubArts
      .filter((a: Article) => !slotIds.has(a.id))
      .sort((a: Article, b: Article) => {
        const aTime = new Date(a.publishedAt || (a as any).createdAt || 0).getTime();
        const bTime = new Date(b.publishedAt || (b as any).createdAt || 0).getTime();
        const aScore = (a.isFeatured ? 10 : 0) + (a.isBreaking ? 5 : 0) + (a.isTrending ? 5 : 0);
        const bScore = (b.isFeatured ? 10 : 0) + (b.isBreaking ? 5 : 0) + (b.isTrending ? 5 : 0);
        if (bScore !== aScore) return bScore - aScore;
        return bTime - aTime;
      });

    const uniqueList = [...featuredArts, ...customGridArts].filter(
      (art, idx, arr) => art && arr.findIndex((x) => x?.id === art.id) === idx
    );

    return fillPool(uniqueList, autoPool, 16);
  };

  // Pre-calculate initial hero slots & grid from initialHeroSettings
  const initialSlots: Article[] = (initialHeroSettings?.slots || []).filter(isPublicArticle);
  const initFeatured = publishedInitialArticles.filter((a) => a.isFeatured);
  const initTrending = publishedInitialArticles.filter((a) => a.isTrending);

  const initialHeroPool = computeHeroPoolList(initialArticles, initialHeroSettings);

  const initialCustomTrendingArts: Article[] = (initialHeroSettings?.trendingNewsArticles || []).filter(isPublicArticle);
  const initialCustomPopularArts: Article[] = (initialHeroSettings?.popularNewsArticles || []).filter(isPublicArticle);
  const initialCustomMostReadArts: Article[] = (initialHeroSettings?.mostReadArticles || []).filter(isPublicArticle);
  const initialPopularPool = fillPool([...initialCustomTrendingArts, ...initTrending, ...initialCustomPopularArts], publishedInitialArticles, 10);
  const initialMostReadPool = initialCustomMostReadArts.length > 0 ? initialCustomMostReadArts : publishedInitialArticles.slice(0, 5);

  const initialCategoriesDB = Array.isArray(initialCategories)
    ? initialCategories.filter((c) => c.showInHome !== false && c.isActive !== false).sort((a, b) => (b.homeOrder ?? b.displayOrder ?? 0) - (a.homeOrder ?? a.displayOrder ?? 0))
    : [];
  const initialCategorySlugs = initialCategoriesDB.map((c) => c.slug?.toLowerCase()).filter(Boolean);

  // DB-backed article state
  const [topNews, setTopNews] = useState<Article[]>(publishedInitialArticles.slice(0, 6));
  const [topStories, setTopStories] = useState<Article[]>(initialHeroPool);
  const [bottomFeatured, setBottomFeatured] = useState<Article[]>(initialSlots.length > 0 ? initialSlots : initFeatured.slice(0, 3));
  const [trendingArtDB, setTrendingArtDB] = useState<Article[]>(initialPopularPool);
  const [mostReadArtDB, setMostReadArtDB] = useState<Article[]>(initialMostReadPool);
  const [gujaratArtDB, setGujaratArtDB] = useState<Article[]>(
    (initialCategoryArticles['gujarat'] && initialCategoryArticles['gujarat'].length > 0)
      ? initialCategoryArticles['gujarat']
      : publishedInitialArticles.filter((a) => { const s = getCatSlug(a); return s === 'gujarat' || s === 'state'; }).slice(0, 16)
  );
  const [crimeArtDB, setCrimeArtDB] = useState<Article[]>(
    (initialCategoryArticles['crime'] && initialCategoryArticles['crime'].length > 0)
      ? initialCategoryArticles['crime']
      : publishedInitialArticles.filter((a) => getCatSlug(a) === 'crime').slice(0, 4)
  );
  const [nationalArtDB, setNationalArtDB] = useState<Article[]>(
    (initialCategoryArticles['national'] && initialCategoryArticles['national'].length > 0)
      ? initialCategoryArticles['national']
      : publishedInitialArticles.filter((a) => { const s = getCatSlug(a); return s === 'national' || s === 'india'; }).slice(0, 4)
  );
  const [worldArtDB, setWorldArtDB] = useState<Article[]>(
    (initialCategoryArticles['world'] && initialCategoryArticles['world'].length > 0)
      ? initialCategoryArticles['world']
      : publishedInitialArticles.filter((a) => { const c = getCatSlug(a); return c === 'world' || c === 'international' || (a.location || '').toLowerCase() === 'international'; }).slice(0, 4)
  );
  const [businessArtDB, setBusinessArtDB] = useState<Article[]>(
    (initialCategoryArticles['business'] && initialCategoryArticles['business'].length > 0)
      ? initialCategoryArticles['business']
      : publishedInitialArticles.filter((a) => getCatSlug(a) === 'business').slice(0, 4)
  );
  const [sportsArtDB, setSportsArtDB] = useState<Article[]>(
    (initialCategoryArticles['sports'] && initialCategoryArticles['sports'].length > 0)
      ? initialCategoryArticles['sports']
      : publishedInitialArticles.filter((a) => getCatSlug(a) === 'sports').slice(0, 7)
  );
  const [dynamicTrendingTopics, setDynamicTrendingTopics] = useState<string[]>(initialHeroSettings?.trendingTopics || initialHeroSettings?.setting?.trendingTopics || []);
  const [marketRates, setMarketRates] = useState<any>(initialMarketRates || {
    gold: { price: '₹74,850', change: '▲ ₹450', purity: '24 Karat', unit: '10 Grams' },
    silver: { price: '₹84,200', change: '— Stable', purity: '999 Fine', unit: '1 Kg' },
  });
  const [weatherData, setWeatherData] = useState<any>(initialWeatherData || {
    city: 'અમદાવાદ',
    cityEn: 'Ahmedabad',
    temp: 32,
    humidity: 68,
    windSpeed: 14,
    conditionGu: 'આંશિક વાદળછાયું',
    conditionEn: 'Partly cloudy',
  });
  const [astrologySignsDB, setAstrologySignsDB] = useState<ZodiacSign[]>(ZODIAC_SIGNS);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(!initialArticles.length);
  const [orderedCategorySlugs, setOrderedCategorySlugs] = useState<string[]>(initialCategorySlugs.length > 0 ? initialCategorySlugs : ['gujarat', 'national', 'world', 'politics', 'crime']);
  const [allCategoriesDB, setAllCategoriesDB] = useState<any[]>(initialCategoriesDB);
  const { isApk } = useIsApk();

  useEffect(() => {
    if (initialCategories && Array.isArray(initialCategories) && initialCategories.length > 0) {
      const filtered = initialCategories
        .filter((c: any) => c.showInHome !== false && c.isActive !== false)
        .sort((a: any, b: any) => (b.homeOrder ?? b.displayOrder ?? 0) - (a.homeOrder ?? a.displayOrder ?? 0));
      setAllCategoriesDB(filtered);
    }
  }, [initialCategories]);

  useEffect(() => {
    const handleSyncCategories = () => {
      getPublicCategories({ showInHome: true }).then((cats) => {
        if (cats && Array.isArray(cats) && cats.length > 0) {
          const filtered = cats
            .filter((c: any) => c.showInHome !== false && c.isActive !== false)
            .sort((a: any, b: any) => (b.homeOrder ?? b.displayOrder ?? 0) - (a.homeOrder ?? a.displayOrder ?? 0));
          setAllCategoriesDB(filtered);
        }
      }).catch(() => {});
    };

    window.addEventListener('focus', handleSyncCategories);
    window.addEventListener('gp-categories-updated', handleSyncCategories);
    return () => {
      window.removeEventListener('focus', handleSyncCategories);
      window.removeEventListener('gp-categories-updated', handleSyncCategories);
    };
  }, []);

  useEffect(() => {
    // If we already have initial articles and hero settings passed from SSR,
    // only fetch client-dynamic data if missing.
    // Heavy datasets (articles, hero settings, categories, videos) are already populated!
    const hasInitialData = initialArticles && initialArticles.length > 0 && initialHeroSettings;

    if (hasInitialData) {
      if (typeof window !== 'undefined') {
        (window as any).__gpDataReady = true;
        window.dispatchEvent(new CustomEvent('gp-data-ready'));
      }
      setIsInitialLoading(false);

      const needsMarket = !initialMarketRates;
      const needsWeather = !initialWeatherData;
      const needsVideos = !initialVideos || initialVideos.length === 0;

      // Always fetch fresh live YouTube videos on client mount to update views and durations
      getPublicVideos('video').then((videoRes) => {
        if (videoRes && videoRes.length > 0) {
          setVideosList(videoRes);
        }
      }).catch(() => {});

      if (needsMarket || needsWeather || needsVideos) {
        Promise.all([
          needsMarket ? getMarketRates().catch(() => null) : Promise.resolve(null),
          needsWeather ? getPublicWeather('ahmedabad').catch(() => null) : Promise.resolve(null),
          needsVideos ? getPublicVideos('video').catch(() => null) : Promise.resolve(null),
        ]).then(([marketRes, weatherRes, videoRes]: any[]) => {
          if (weatherRes) setWeatherData(weatherRes);
          if (marketRes) setMarketRates(marketRes);
          if (videoRes && videoRes.length > 0) {
            setVideosList(videoRes);
          }
        }).catch((err) => console.warn('Error loading weather/rates/videos:', err));
      }
      return;
    }

    // Fallback if SSR had empty data (e.g. direct client route navigation)
    Promise.all([
      getPublicArticles({ limit: 60 }),
      getHeroSettings(),
      getPublicVideos('video'),
      getMarketRates(),
      getPublicWeather('ahmedabad'),
      getPublicCategories({ showInHome: true }),
    ]).then(([mainRes, heroRes, videoRes, marketRes, weatherRes, categoriesRes]: any[]) => {
      if (weatherRes) {
        setWeatherData(weatherRes);
      }
      if (marketRes) {
        setMarketRates(marketRes);
      }
      if (categoriesRes && Array.isArray(categoriesRes) && categoriesRes.length > 0) {
        const sortedCats = [...categoriesRes]
          .filter((c) => c.showInHome !== false && c.isActive !== false)
          .sort((a, b) => (b.homeOrder ?? b.displayOrder ?? 0) - (a.homeOrder ?? a.displayOrder ?? 0));
        setAllCategoriesDB(sortedCats);
        const sortedSlugs = sortedCats.map((c) => c.slug?.toLowerCase()).filter(Boolean);
        setOrderedCategorySlugs(sortedSlugs);
      }
      if (heroRes && Array.isArray(heroRes.trendingTopics) && heroRes.trendingTopics.length > 0) {
        setDynamicTrendingTopics(heroRes.trendingTopics);
      } else if (heroRes?.setting?.trendingTopics && Array.isArray(heroRes.setting.trendingTopics)) {
        setDynamicTrendingTopics(heroRes.setting.trendingTopics);
      }

      // Admin-selected bottom 3 image articles from Hero Settings API
      const slotsArticles: Article[] = (heroRes?.slots || []).filter(Boolean);
      if (slotsArticles.length > 0) {
        setBottomFeatured(slotsArticles);
      }

      // Main pool — powers main hero, right 2, text articles
      if (mainRes && mainRes.articles && mainRes.articles.length > 0) {
        const arts: Article[] = mainRes.articles;
        setArticlesList(arts);
        setTopNews(arts.filter((a) => a.isBreaking || a.isFeatured).concat(arts).filter((a, idx, arr) => arr.findIndex((x) => x.id === a.id) === idx).slice(0, 6));

        const heroPool = computeHeroPoolList(arts, heroRes);
        setTopStories(heroPool);
        const customTrendingArts: Article[] = (heroRes?.trendingNewsArticles || []).filter(Boolean);
        const customPopularArts: Article[] = (heroRes?.popularNewsArticles || []).filter(Boolean);
        const customMostReadArts: Article[] = (heroRes?.mostReadArticles || []).filter(Boolean);
        const trendingArts = arts.filter((a: Article) => a.isTrending);
        const popularPool = fillPool([...customTrendingArts, ...trendingArts, ...customPopularArts], arts, 10);
        setTrendingArtDB(popularPool);
        const mostReadPool = (customMostReadArts.length > 0 ? customMostReadArts : arts).slice(0, 3);
        setMostReadArtDB(mostReadPool);
        setGujaratArtDB(arts.filter((a: Article) => { const s = getCatSlug(a); return s === 'gujarat' || s === 'state'; }).slice(0, 16));
        setCrimeArtDB(arts.filter((a: Article) => getCatSlug(a) === 'crime').slice(0, 4));
        setNationalArtDB(arts.filter((a: Article) => { const s = getCatSlug(a); return s === 'national' || s === 'india'; }).slice(0, 4));
        setWorldArtDB(arts.filter((a: Article) => { const c = getCatSlug(a); return c === 'world' || c === 'international'; }).slice(0, 4));
        setBusinessArtDB(arts.filter((a: Article) => getCatSlug(a) === 'business').slice(0, 4));
        setSportsArtDB(arts.filter((a: Article) => getCatSlug(a) === 'sports').slice(0, 7));
      }

      if (videoRes && videoRes.length > 0) {
        setVideosList(videoRes);
      }
    })
      .catch(() => { })
      .finally(() => {
        if (typeof window !== 'undefined') {
          (window as any).__gpDataReady = true;
          window.dispatchEvent(new CustomEvent('gp-data-ready'));
        }
        setIsInitialLoading(false);
      });

    const safetyTimer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        (window as any).__gpDataReady = true;
        window.dispatchEvent(new CustomEvent('gp-data-ready'));
      }
      setIsInitialLoading(false);
    }, 2000);

    return () => clearTimeout(safetyTimer);
  }, []);

  // Sidebar auto-changing video state (cycles every 10s)
  const featuredSidebar = videosList.filter(v => v.isFeatured && (v.type === 'video' || !v.type));
  const sidebarVideos = featuredSidebar.length > 0
    ? featuredSidebar
    : videosList.filter(v => v.type === 'video' || !v.type).slice(0, 6);
  const [activeSidebarVideoIndex, setActiveSidebarVideoIndex] = useState(0);
  const [isSidebarVideoPlaying, setIsSidebarVideoPlaying] = useState(false);

  useEffect(() => {
    if (sidebarVideos.length === 0 || isSidebarVideoPlaying) return;
    const interval = setInterval(() => {
      setActiveSidebarVideoIndex((prev) => (prev + 1) % sidebarVideos.length);
    }, 2000); // 2 seconds rotation
    return () => clearInterval(interval);
  }, [sidebarVideos.length, isSidebarVideoPlaying]);

  const isCategoryVisible = (slug: string) => {
    if (!allCategoriesDB || !Array.isArray(allCategoriesDB) || allCategoriesDB.length === 0) {
      return true;
    }
    const cat = allCategoriesDB.find((c) => (c.slug || '').toLowerCase() === slug.toLowerCase());
    if (!cat) return true;
    return cat.isActive !== false && cat.showInHome !== false;
  };

  const activeOrderedCategories = useMemo(() => {
    const STATIC_ORDER = [
      'videos',
      'gujarat',
      'national',
      'latest-news',
      'trending',
      'instagram',
      'world',
      'politics',
      'webstory',
      'crime',
      'entertainment',
      'fact-check',
      'photos',
      'shorts',
      'weather',
      'live-center',
    ];

    if (!allCategoriesDB || !Array.isArray(allCategoriesDB) || allCategoriesDB.length === 0) {
      return STATIC_ORDER;
    }

    const homeCats = [...allCategoriesDB].filter(c => c.isActive !== false && c.showInHome !== false);
    homeCats.sort((a, b) => (b.homeOrder ?? b.displayOrder ?? 0) - (a.homeOrder ?? a.displayOrder ?? 0));

    return homeCats;
  }, [allCategoriesDB]);

  const sectionMap: Record<string, React.ReactNode> = {
    videos: (
      <div key="videos" className="mx-auto max-w-screen-xl px-2 my-6">
        <VideoDesk videos={videosList.length > 0 ? videosList : (initialVideos && initialVideos.length > 0 ? initialVideos : VIDEOS)} language={language} />
      </div>
    ),
    gujarat: <CityHyperlocalSection key="gujarat" language={language} articles={articlesList} dynamicTrendingTopics={dynamicTrendingTopics} />,
    national: <NationalSection key="national" language={language} initialArticles={(initialCategoryArticles['national'] && initialCategoryArticles['national'].length > 0) ? initialCategoryArticles['national'] : publishedInitialArticles.filter((a) => { const s = getCatSlug(a); return s === 'national' || s === 'india'; })} />,
    trending: (
      <Fragment key="trending-frag">
        <TrendingSection
          key="trending"
          initialArticles={initialHeroSettings?.trendingNewsArticles || (initialHeroSettings as any)?.setting?.trendingNewsArticles}
        />
        <AdSectionBanner section="AFTER_TRENDING" />
      </Fragment>
    ),
    'latest-news': (
      <LatestUpdatesSection
        key="latest-news"
        view="all"
        initialArticles={articlesList}
        initialPopularNews={initialHeroSettings?.popularNewsArticles || (initialHeroSettings as any)?.setting?.popularNewsArticles}
        initialMostRead={initialHeroSettings?.mostReadArticles || undefined}
      />
    ),
    instagram: <InstagramStories key="instagram" initialReels={initialReels} />,
    world: <WorldSection key="world" language={language} initialArticles={(initialCategoryArticles['world'] && initialCategoryArticles['world'].length > 0) ? initialCategoryArticles['world'] : publishedInitialArticles.filter((a) => {
      const c = ((a as any).category?.slug || (a as any).categorySlug || a.category || '').toLowerCase().trim();
      const n = ((a as any).category?.name || (a as any).categoryName || '').toLowerCase().trim();
      const gu = ((a as any).category?.nameGu || (a as any).categoryGu || '').toLowerCase().trim();
      const loc = (a.location || '').toLowerCase().trim();
      return c === 'world' || c === 'international' || c === 'videsh' || n === 'world' || n === 'international' || gu.includes('વિશ્વ') || gu.includes('વિદેશ') || loc === 'international';
    })} />,
    politics: <PoliticsSection key="politics" language={language} initialArticles={(initialCategoryArticles['politics'] && initialCategoryArticles['politics'].length > 0) ? initialCategoryArticles['politics'] : publishedInitialArticles.filter((a) => { const cs = getCatSlug(a); return cs === 'politics' || cs === 'rajkaran'; })} />,
    webstory: (
      <Fragment key="webstory-frag">
        <WebStoriesSection key="webstory" />
        <AdSectionBanner section="AFTER_WEBSTORIES" />
      </Fragment>
    ),
    crime: (
      <section key="crime" className="mx-auto max-w-screen-xl px-4 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-8 items-start">
          <div className="flex flex-col gap-10 min-w-0">
            <CrimeSection language={language} view="content" initialArticles={(initialCategoryArticles['crime'] && initialCategoryArticles['crime'].length > 0) ? initialCategoryArticles['crime'] : publishedInitialArticles.filter((a) => getCatSlug(a) === 'crime')} initialWeather={weatherData} initialAstrology={astrologySignsDB} />
          </div>
          <div className="flex flex-col gap-6 sticky top-20 select-none">
            <div>
              <div className="flex items-end gap-1.5 h-[46px] border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2.5 mb-6">
                <span className="text-[#B3121B] text-[15px] font-extrabold leading-none pb-0.5">♦</span>
                <h3 className="text-[15px] font-black text-foreground leading-none pb-0.5">
                  {language === 'gu' ? 'સોના-ચાંદીના ભાવ' : 'Gold & Silver Rates'}
                </h3>
              </div>

              <div className="border border-border/80 rounded-sm bg-card p-3.5 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-extrabold select-none shadow-sm">
                      🏅
                    </div>
                    <div>
                      <h4 className="text-[14px] text-foreground leading-tight" style={{ fontFamily: "'Hind Vadodara', 'Noto Sans Gujarati', sans-serif", fontWeight: 700 }}>
                        {language === 'gu' ? 'Gold (10 Grams)' : 'Gold (10 Grams)'}
                      </h4>
                      <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                        {language === 'gu' ? '24 Karat' : '24 Karat'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] text-foreground leading-none" style={{ fontFamily: "'Hind Vadodara', 'Noto Sans Gujarati', sans-serif", fontWeight: 800 }}>
                      {marketRates?.gold?.price || '₹74,850'}
                    </p>
                    <p className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-0.5 mt-1 select-none">
                      {marketRates?.gold?.change || '▲ ₹450'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/40" />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-extrabold select-none shadow-sm">
                      🥈
                    </div>
                    <div>
                      <h4 className="text-[14px] text-foreground leading-tight" style={{ fontFamily: "'Hind Vadodara', 'Noto Sans Gujarati', sans-serif", fontWeight: 700 }}>
                        {language === 'gu' ? 'Silver (1 Kg)' : 'Silver (1 Kg)'}
                      </h4>
                      <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                        {language === 'gu' ? 'Per Kg' : 'Per Kg'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] text-foreground leading-none" style={{ fontFamily: "'Hind Vadodara', 'Noto Sans Gujarati', sans-serif", fontWeight: 800 }}>
                      {marketRates?.silver?.price || '₹84,200'}
                    </p>
                    <p className="text-[11px] font-bold text-muted-foreground flex items-center justify-end gap-0.5 mt-1 select-none">
                      {marketRates?.silver?.change || '— Stable'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <CrimeSection language={language} view="sidebar" initialArticles={(initialCategoryArticles['crime'] && initialCategoryArticles['crime'].length > 0) ? initialCategoryArticles['crime'] : publishedInitialArticles.filter((a) => getCatSlug(a) === 'crime')} initialWeather={weatherData} initialAstrology={astrologySignsDB} />
          </div>
        </div>
      </section>
    ),
    entertainment: <EntertainTechLifeSection key="entertainment" language={language} initialArticles={publishedInitialArticles} initialCategoryArticles={initialCategoryArticles} />,
    technology: null,
    health: null,
    'fact-check': <FactCheckSection key="fact-check" language={language} initialArticles={(initialCategoryArticles['factcheck'] && initialCategoryArticles['factcheck'].length > 0) ? initialCategoryArticles['factcheck'] : publishedInitialArticles.filter((a) => { const s = getCatSlug(a); return s === 'fact-check' || s === 'factcheck'; })} />,
    photos: (
      <Fragment key="photos-frag">
        <PhotoGallerySection language={language} />
        <AdSectionBanner section="AFTER_GALLERY" />
      </Fragment>
    ),
    weather: <WeatherDashboardSection key="weather" language={language} />,
    shorts: (
      <Fragment key="shorts-frag">
        <YouTubeShorts key="youtube-shorts" />
        <AdSectionBanner section="AFTER_VIDEOS" />
      </Fragment>
    ),
    'live-center': <LiveCenterSection key="live-center" language={language} />,
  };

  const currentSidebarVideo = sidebarVideos[activeSidebarVideoIndex] || {
    youtubeId: 'A_5vL-ngK4M',
    title: 'Latest Video',
    titleGu: 'ગુજરાત પોસ્ટ તાજેતરનો વીડિયો',
    titleHi: 'नवीनतम वीडियो',
  };

  const [savedIds, setSavedIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gp-saved-articles');
      if (stored) setSavedIds(JSON.parse(stored));
    } catch (e) {
      console.warn(e);
    }
  }, []);
  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = savedIds.includes(id) ? savedIds.filter(x => x !== id) : [...savedIds, id];
    setSavedIds(next);
    try {
      localStorage.setItem('gp-saved-articles', JSON.stringify(next));
    } catch (err) {
      console.warn(err);
    }
  };

  // Derived slices
  const leftItems = topNews.slice(0, 5);
  const topStoriesSlice = topStories.slice(0, 16);
  const stateRowArticles = [
    ...gujaratArtDB,
    ...topStories,
    ...trendingArtDB,
    ...topNews,
  ].filter((article, index, list) => list.findIndex((item) => item.id === article.id) === index).slice(0, 16);

  // Videos from backend API
  const videos = videosList.filter(v => v.type === 'video' || v.type === 'podcast' || v.type === 'interview').slice(0, 10);

  const [
    uniqueTopStories,
    uniqueLeftItems,
    uniqueGujaratArt,
    uniqueCrimeArt,
    uniqueNationalArt,
    uniqueWorldArt,
    uniqueBusinessArt,
    uniqueSportsArt,
    uniqueTrendingArt,
  ] = makeHomeImagesUnique([
    topStoriesSlice,
    leftItems,
    stateRowArticles,
    crimeArtDB,
    nationalArtDB,
    worldArtDB,
    businessArtDB,
    sportsArtDB,
    trendingArtDB,
  ]);

  const leadStoryId = uniqueTopStories[0]?.id;
  const leadSideArticles = [
    ...uniqueLeftItems,
    ...uniqueTopStories.slice(9),
    ...uniqueGujaratArt,
  ].filter((article, index, list) => (
    article.id !== leadStoryId &&
    list.findIndex((item) => item.id === article.id) === index
  )).slice(0, 8);

  const middleColumnPool = useMemo(() => {
    const combined = [...uniqueTopStories, ...articlesList, ...initialArticles];
    const uniqueMap = new Map<string, Article>();
    combined.forEach((art) => {
      if (art && art.id && !uniqueMap.has(art.id)) {
        uniqueMap.set(art.id, art);
      }
    });
    return Array.from(uniqueMap.values());
  }, [uniqueTopStories, articlesList, initialArticles]);

  // DEDICATED ANDROID APK FEED:
  // Shows ONLY inside the installed Android APK (TWA).
  // Standard Desktop & Mobile Web Browsers render the standard portal below.
  if (isApk) {
    const feedArticles = articlesList.length > 0
      ? articlesList
      : (middleColumnPool.length > 0 ? middleColumnPool : uniqueTopStories);

    if (isInitialLoading && feedArticles.length === 0) {
      return <ApkHomeSkeleton />;
    }
    return (
      <ApkHomeFeed
        articles={feedArticles}
        videos={videosList}
        categories={allCategoriesDB}
      />
    );
  }

  // STANDARD WEB & MOBILE BROWSER (100% UNTOUCHED):
  if (isInitialLoading || !topStories.length) {
    return <HeroSectionSkeleton language={language} />;
  }
  return (
    <div className="mx-auto max-w-screen-xl px-2 py-0.5 space-y-1">

      {/* ── ROW 1: Content + Sidebar Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

        {/* Left Content Side */}
        <div className="flex flex-col gap-6">

          {/* Top Row: Hero Story & Middle Column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

            {/* Hero Story Column */}
            <div className="flex flex-col gap-3">
              {uniqueTopStories[0] && (
                <Link href={`/news/${uniqueTopStories[0].slug}`} className="group flex flex-col w-full">
                  {/* Hero image */}
                  <div className="relative w-full overflow-hidden rounded-sm shadow-sm aspect-[16/9] md:aspect-[3/2]">
                    <ArticleMedia
                      src={uniqueTopStories[0].image || (uniqueTopStories[0] as any).featuredImage}
                      alt={uniqueTopStories[0].title}
                      className="transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  {/* Category & Live Badge tags */}
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="bg-[#B3121B] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1.5 shadow-sm">
                      <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
                      {language === 'gu' ? 'લાઇવ' : language === 'hi' ? 'लाइव' : 'LIVE'}
                    </span>
                    <span className="text-muted-foreground text-[12px] font-bold">
                      {getCategoryLabel(uniqueTopStories[0], language)}
                    </span>
                  </div>
                  {/* Headline */}
                  <h1 className="text-foreground font-extrabold text-[20px] sm:text-[22px] md:text-[24px] leading-[1.22] tracking-tight mt-1.5 group-hover:text-accent transition-colors line-clamp-2">
                    <AutoArticleTitle article={uniqueTopStories[0]} language={language} />
                  </h1>
                  {/* Excerpt */}
                  <p className="text-muted-foreground text-[12.5px] sm:text-[13px] leading-relaxed mt-1.5 line-clamp-2 font-medium">
                    <AutoArticleExcerpt article={uniqueTopStories[0]} language={language} />
                  </p>
                  {/* Meta */}
                  {uniqueTopStories[0].author && (
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground font-semibold border-t border-border/50 pt-2">
                      <span className="font-black text-foreground">
                        {getLocalized(language, {
                          en: uniqueTopStories[0].author.name,
                          gu: uniqueTopStories[0].author.nameGu,
                          hi: uniqueTopStories[0].author.nameHi,
                        })}
                      </span>
                    </div>
                  )}
                </Link>
              )}

            </div>

            {/* ═══ MIDDLE COLUMN — 2-Column Newspaper Grid ════════════════ */}
            <div className="flex flex-col gap-2 border-l border-r border-border/40 px-4 min-w-0">
              {/* Top Row: Image Cards */}
              <div className="grid grid-cols-2 gap-x-4 items-start">
                {uniqueTopStories[1] && (
                  <Link href={`/news/${uniqueTopStories[1].slug}`} className="group flex flex-col gap-2 min-w-0">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted">
                      <ArticleMedia
                        src={uniqueTopStories[1].image || (uniqueTopStories[1] as any).featuredImage}
                        alt={uniqueTopStories[1].title}
                        className="transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <h3 className="text-[13.5px] font-black leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2">
                      <AutoArticleTitle article={uniqueTopStories[1]} language={language} />
                    </h3>
                  </Link>
                )}

                {uniqueTopStories[2] && (
                  <Link href={`/news/${uniqueTopStories[2].slug}`} className="group flex flex-col gap-2 min-w-0">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted">
                      <ArticleMedia
                        src={uniqueTopStories[2].image || (uniqueTopStories[2] as any).featuredImage}
                        alt={uniqueTopStories[2].title}
                        className="transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <h3 className="text-[13.5px] font-black leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2">
                      <AutoArticleTitle article={uniqueTopStories[2]} language={language} />
                    </h3>
                  </Link>
                )}
              </div>

              {/* Text Article Rows: 5 paired rows with aligned top borders and line-clamp-2 */}
              {[
                [middleColumnPool[3], middleColumnPool[4]],
                [middleColumnPool[5], middleColumnPool[6]],
                [middleColumnPool[7], middleColumnPool[8]],
                [middleColumnPool[9], middleColumnPool[10]],
                [middleColumnPool[11], middleColumnPool[12]],
              ].map(([leftArt, rightArt], idx) => (
                <div key={idx} className="grid grid-cols-2 gap-x-4 border-t border-border/40 pt-2 pb-1 items-start">
                  {leftArt ? (
                    <Link
                      href={`/news/${leftArt.slug}`}
                      className="group flex flex-col hover:bg-muted/10 transition-colors rounded-md min-w-0"
                    >
                      <h3 className="text-[13.5px] font-black leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2">
                        <AutoArticleTitle article={leftArt} language={language} />
                      </h3>
                    </Link>
                  ) : <div />}

                  {rightArt ? (
                    <Link
                      href={`/news/${rightArt.slug}`}
                      className="group flex flex-col hover:bg-muted/10 transition-colors rounded-md min-w-0"
                    >
                      <h3 className="text-[13.5px] font-black leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2">
                        <AutoArticleTitle article={rightArt} language={language} />
                      </h3>
                    </Link>
                  ) : <div />}
                </div>
              ))}
            </div>
          </div> {/* Close Top Row grid */}

          {/* Bottom Row: Three image cards (#14, #15, #16 articles in sequence right after the top 13, or Admin custom picks) */}
          {(() => {
            const card14 = bottomFeatured[0] || uniqueTopStories[13] || articlesList[13];
            const card15 = bottomFeatured[1] || uniqueTopStories[14] || articlesList[14];
            const card16 = bottomFeatured[2] || uniqueTopStories[15] || articlesList[15];

            const cards = [card14, card15, card16].filter(Boolean);

            if (cards.length === 0) return null;

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 border-t border-border/80 pt-4">
                {cards.slice(0, 3).map((art, idx) => {
                  if (!art) return null;
                  return (
                    <Link
                      key={art.id || idx}
                      href={`/news/${art.slug}`}
                      className="group flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-0 min-w-0 pb-3 md:pb-0 border-b md:border-b-0 border-border/30 last:border-b-0"
                    >
                      <div className="relative aspect-[16/10] w-28 md:w-full h-20 md:h-auto shrink-0 overflow-hidden rounded-sm border border-border/10 bg-muted mb-0 md:mb-2.5">
                        <ArticleMedia
                          src={art.image || (art as any).featuredImage || getArticleImage(art)}
                          alt={art.title || ''}
                          className="transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[#B3121B] font-extrabold text-[11px] md:text-[13px] mb-0.5 md:mb-1 select-none uppercase tracking-wide">
                          {getCategoryLabel(art, language)}
                        </span>
                        <h3 className="text-[13px] md:text-[13.5px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                          <AutoArticleTitle article={art} language={language} />
                        </h3>

                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })()}

        </div> {/* Close Left Content Side */}

        {/* ═══ RIGHT SIDEBAR — Ad + YouTube Latest + Popular ═══════════════ */}
        <div className="flex flex-col gap-4">
          <SidebarAdBanner
            slot="SIDEBAR_HERO_TOP"
            language={language}
            fallbackTitleGu="મેગા સેલ ડેઝ"
            fallbackTitleEn="Mega Sale Days"
            fallbackTagGu="ફેશન અને ઈલેક્ટ્રોનિક્સ પર 70% સુધી છૂટ — ફક્ત આજે!"
            fallbackTagEn="Up to 70% off on fashion and electronics — today only!"
            fallbackCtaGu="હમણાં ખરીદો"
            fallbackCtaEn="Shop Now"
            fallbackGradient="linear-gradient(135deg,#FF6B35,#C81D25)"
            minHeight={210}
            enableTributeSlides={true}
          />

          {/* YouTube Video Section */}
          <div className="w-full rounded-md border border-slate-200 bg-card p-4 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-[#B3121B] font-black text-[13.5px] md:text-[14px] flex items-center gap-1.5 select-none">
                <Play className="h-3.5 w-3.5 fill-current" />
                {getLocalized(language, {
                  en: 'YouTube Videos',
                  gu: 'યુટ્યુબ વીડિયો',
                  hi: 'यूट्यूब वीडियो'
                })}
              </span>
              <span className="bg-accent text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                {getLocalized(language, {
                  en: 'VIDEO',
                  gu: 'વીડિયો',
                  hi: 'वीडियो',
                })}
              </span>
            </div>

            <div
              className="relative w-full overflow-hidden rounded-sm border border-slate-200/60 bg-black shadow-inner cursor-pointer group"
              style={{ aspectRatio: '16/9' }}
              onClick={() => setIsSidebarVideoPlaying(true)}
            >
              {isSidebarVideoPlaying ? (
                <iframe
                  src={`https://www.youtube.com/embed/${safeYouTubeId(currentSidebarVideo.youtubeId)}?autoplay=1&rel=0&modestbranding=1&controls=1`}
                  title="Gujarat Post Video"
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <Image
                    src={currentSidebarVideo.thumbnail || `https://i.ytimg.com/vi/${safeYouTubeId(currentSidebarVideo.youtubeId)}/hqdefault.jpg`}
                    alt={currentSidebarVideo.title || 'Video'}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 350px"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition-transform duration-300 group-hover:scale-110 border-2 border-white/80">
                      <Play className="h-6 w-6 fill-current ml-0.5" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground pt-1 border-t border-border/40 mt-1 gap-2">
              <span className="line-clamp-1 max-w-[170px]" title={getLocalized(language, {
                en: currentSidebarVideo.title,
                gu: currentSidebarVideo.titleGu,
                hi: currentSidebarVideo.titleHi,
              })}>
                {getLocalized(language, {
                  en: currentSidebarVideo.title,
                  gu: currentSidebarVideo.titleGu,
                  hi: currentSidebarVideo.titleHi,
                })}
              </span>
              <a
                href={`https://www.youtube.com/watch?v=${currentSidebarVideo.youtubeId}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#B3121B] hover:underline flex items-center gap-0.5 font-black shrink-0"
              >
                {language === 'gu' ? 'યુટ્યુબ પર જુઓ ↗' : 'Watch on YouTube ↗'}
              </a>
            </div>
          </div>

          {/* Popular Articles */}
          <div className="w-full rounded-sm border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-[#B3121B] font-black text-[13.5px] md:text-[14px] select-none">
                {language === 'gu' ? 'સૌથી વધુ વંચાયેલા' : 'Most Read'}
              </span>
              <Link
                href="/category/trending"
                className="text-[11px] font-black text-[#B3121B]/95 hover:text-[#B3121B] hover:underline"
              >
                {language === 'gu' ? 'વધુ જુઓ →' : 'View all →'}
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-border">
              {(mostReadArtDB.length > 0 ? mostReadArtDB : uniqueTrendingArt).slice(0, 3).map((art, idx) => (
                <Link
                  key={art.id}
                  href={`/news/${art.slug}`}
                  className="group flex items-start gap-3 py-3.5 hover:bg-muted/10 rounded-md transition-all px-2.5 first:pt-1 last:pb-1"
                >
                  <span className="text-[18px] font-black text-[#B3121B]/85 group-hover:text-[#B3121B] font-serif w-5 shrink-0 mt-0.5 transition-colors select-none text-center">
                    {idx + 1}
                  </span>
                  <h4 className="text-[12.5px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors flex-1 line-clamp-2">
                    <AutoArticleTitle article={art} language={language} />
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>



      <AdSectionBanner section="AFTER_HERO" />

      {/* Dynamic Render of Homepage Sections ordered by DB displayOrder */}
      {activeOrderedCategories.map((item, idx) => {
        const slug = (typeof item === 'string' ? item : item.slug || '').toLowerCase();

        // Skip standalone rendering for health & technology as they are already combined inside 3-column EntertainTechLifeSection (entertainment)
        if (slug === 'health' || slug === 'technology' || slug === 'manoranjan') {
          return null;
        }

        const categoryObj = typeof item === 'string' ? allCategoriesDB?.find(c => (c.slug || '').toLowerCase() === slug) : item;
        const hasCustomNode = Object.prototype.hasOwnProperty.call(sectionMap, slug);
        const node = sectionMap[slug];

        return (
          <Fragment key={slug || idx}>
            {hasCustomNode ? (
              node
            ) : (
              <DynamicCategorySection
                category={categoryObj || slug}
                language={language}
                initialArticles={publishedInitialArticles}
              />
            )}
          </Fragment>
        );
      })}

      {/* 17. NEWSLETTER SECTION (Screenshot 5) */}
      <div className="mx-auto max-w-screen-xl px-2 py-2 mb-6 select-none">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 p-6 md:p-8 bg-[#140e0c] text-white rounded-xl shadow-md border border-white/5">
          <div className="flex flex-col gap-2 max-w-xl text-center lg:text-left">
            <h3 className="text-lg sm:text-xl md:text-2xl font-black leading-tight">
              {language === 'gu'
                ? 'દરરોજ સવારે ગુજરાતના મુખ્ય સમાચાર — તમારા ઈનબોક્સમાં'
                : 'Every morning main news of Gujarat — in your inbox'}
            </h3>
            <p className="text-xs sm:text-sm text-[#a3a3a3] font-bold">
              {language === 'gu'
                ? 'ન્યૂઝલેટર સબસ્ક્રાઇબ કરો અને દિવસની શરૂઆત માહિતી સાથે કરો.'
                : 'Subscribe to our newsletter and start your day informed.'}
            </p>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full lg:w-auto min-w-0 sm:min-w-[400px]"
          >
            <input
              type="email"
              placeholder={language === 'gu' ? 'તમારો ઈમેલ દાખલ કરો' : 'Enter your email'}
              className="flex-1 px-4 py-3 bg-[#241c19] border border-[#3c302a] text-white text-sm rounded-sm focus:outline-none focus:border-[#e02020] placeholder-[#6d5e56]"
              required
            />
            <button
              type="submit"
              className="bg-[#e02020] hover:bg-[#c01818] text-white text-sm font-black px-6 py-3 rounded-sm transition-all whitespace-nowrap"
            >
              {language === 'gu' ? 'સબસ્ક્રાઇબ' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

/* --- Hero Section Skeleton Loader ------------------------------------------- */
function HeroSectionSkeleton({ language }: { language: Language }) {
  const labelTopNews = language === 'gu' ? 'મુખ્ય સમાચાર' : language === 'hi' ? 'शीर्ष समाचार' : 'Top News';
  const labelTopStories = language === 'gu' ? 'ટૉપ સ્ટોરી' : language === 'hi' ? 'मुख्य कहानियां' : 'Top Stories';
  const labelTrending = language === 'gu' ? 'ટ્રેન્ડિંગ સમાચાર' : language === 'hi' ? 'ट्रेंडિંગ समाचार' : 'Trending News';
  const labelStateNews = language === 'gu' ? 'રાજ્ય સમાચાર' : language === 'hi' ? 'રાજ્ય સમાચાર' : 'State News';
  const labelLiveTV = language === 'gu' ? 'લાઈવ ટીવી' : language === 'hi' ? 'लाइव टीवी' : 'Live TV';
  const labelWeather = language === 'gu' ? 'હવામાન' : language === 'hi' ? 'मौसम' : 'Weather';
  const labelEPaper = language === 'gu' ? 'ઈ-પેપર' : language === 'hi' ? 'ई-पेपर' : 'E-Paper';

  return (
    <div className="mx-auto max-w-screen-xl px-2 py-0.5 space-y-2 animate-pulse">
      {/* ROW 1: 3-column main section */}
      <div className="grid grid-cols-1 gap-1 lg:grid-cols-[minmax(0,1fr)_280px] items-start">
        <div className="min-w-0">
          {/* ── REDESIGNED HERO NEWS SECTION SKELETON ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-pulse">

            {/* LEFT COLUMN (Featured News + 3 Horizontal Cards Skeleton) */}
            <div className="w-full flex flex-col gap-6">
              <div className="w-full">
                <div className="relative aspect-[16/9] w-full rounded-lg bg-muted" />
                <div className="h-3.5 w-16 bg-muted rounded mt-3" />
                <div className="h-8 w-full bg-muted rounded mt-2" />
                <div className="h-8 w-3/4 bg-muted rounded mt-2" />
              </div>
              <div className="flex flex-col gap-5 border-t border-border/80 pt-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex-1 space-y-1.5 py-1">
                      <div className="h-3 w-16 bg-muted rounded" />
                      <div className="h-4.5 w-full bg-muted rounded" />
                      <div className="h-4.5 w-5/6 bg-muted rounded" />
                    </div>
                    <div className="relative w-[88px] h-[58px] rounded-lg bg-muted shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT SIDE (2-Column Grid of 6 Small Cards Skeleton) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col w-full">
                  <div className="relative aspect-[2/1] w-full rounded-lg bg-muted" />
                  <div className="h-3 w-16 bg-muted rounded mt-2" />
                  <div className="h-4.5 w-full bg-muted rounded mt-2" />
                  <div className="h-4.5 w-5/6 bg-muted rounded mt-1.5" />
                </div>
              ))}
            </div>

          </div>

          {/* Trending Bar skeleton */}
          <div className="min-w-0 mt-2">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-[18px] w-[18px] text-accent/20 fill-current" />
                  <span className="text-[15px] font-black leading-tight text-muted-foreground/35">{labelTrending}</span>
                </div>
                <div className="flex gap-1">
                  <div className="h-6 w-6 rounded-full bg-muted" />
                  <div className="h-6 w-6 rounded-full bg-muted" />
                </div>
              </div>
              <div className="flex divide-x divide-border px-1 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 px-3.5 py-1 shrink-0 w-[240px] md:w-[280px]">
                    <div className="h-8 w-4 rounded bg-muted" />
                    <div className="h-[40px] w-[56px] shrink-0 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-3/4 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rajya Samachar / State News skeleton */}
          <div className="min-w-0 mt-2">
            <div className="flex items-center justify-between mb-1 border-b border-border pb-1">
              <span className="text-[18px] md:text-[20px] font-black leading-tight text-muted-foreground/35">{labelStateNews}</span>
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex h-[98px] gap-2 rounded border border-border bg-card p-1.5 shadow-sm">
                  <div className="h-full w-[82px] shrink-0 rounded bg-muted" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT WIDGETS skeleton */}
        <div className="flex flex-col gap-1.5 w-full lg:w-[280px]">
          {/* Live TV Widget Skeleton */}
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between bg-accent/20 px-3 py-1.5">
              <span className="text-xs md:text-sm font-black text-muted-foreground/30 uppercase tracking-wide">{labelLiveTV}</span>
              <div className="h-4 w-12 rounded bg-muted" />
            </div>
            <div className="relative aspect-[4/3] bg-muted" />
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="h-6 w-24 rounded bg-muted" />
              <div className="h-6 w-16 rounded bg-muted" />
            </div>
          </div>

          {/* Weather Widget Skeleton */}
          <div className="rounded-lg border border-border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-1">
              <span className="text-xs md:text-sm font-black text-muted-foreground/30">{labelWeather}</span>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-20 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
                <div className="h-8 w-12 rounded bg-muted" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="h-8 rounded-xl bg-muted" />
                <div className="h-8 rounded-xl bg-muted" />
                <div className="h-8 rounded-xl bg-muted" />
              </div>
            </div>
          </div>

          {/* EPaper Widget Skeleton */}
          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-1 mb-1">
              <span className="text-xs md:text-sm font-black text-muted-foreground/30">{labelEPaper}</span>
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
            <div className="flex gap-3">
              <div className="h-[90px] w-[80px] shrink-0 rounded bg-muted" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
                <div className="h-6 w-24 rounded bg-muted mt-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export {
  VideoDesk,
  CityHyperlocalSection,
  CrimeSection,
  PoliticsSection,
  FactCheckSection,
  NationalSection,
  WorldSection,
  LiveCenterSection,
  WeatherDashboardSection,
  DynamicCategorySection,
  EntertainTechLifeSection,
  PhotoGallerySection,
};

