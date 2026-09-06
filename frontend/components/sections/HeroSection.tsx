'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Fragment } from 'react';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight, Flame, Eye, Play, ChevronRight, ChevronLeft, Camera, X, Bookmark, Sun, Cloud, CloudRain, Shield, Trophy, TrendingUp, TrendingDown, Wind, ChevronDown, ArrowUpRight, Thermometer, Droplet, MoreVertical, Fuel, Megaphone, Radio, MapPin, Sparkles, Loader2 } from 'lucide-react';
import {
  getArticleTitle,
  getArticleExcerpt,
  formatTime,
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
import { AutoArticleTitle, AutoArticleExcerpt, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';

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
export default function HeroSection({
  initialArticles = [],
  initialVideos = [],
  initialHeroSettings = null,
  initialCategories = [],
}: {
  initialArticles?: Article[];
  initialVideos?: any[];
  initialHeroSettings?: any;
  initialCategories?: any[];
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

  const initialCustomPopularArts: Article[] = (initialHeroSettings?.popularNewsArticles || []).filter(isPublicArticle);
  const initialCustomMostReadArts: Article[] = (initialHeroSettings?.mostReadArticles || []).filter(isPublicArticle);
  const initialPopularPool = fillPool([...initTrending, ...initialCustomPopularArts], publishedInitialArticles, 10);
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
  const [gujaratArtDB, setGujaratArtDB] = useState<Article[]>(publishedInitialArticles.filter((a) => a.category?.toLowerCase() === 'gujarat' || a.category?.toLowerCase() === 'state').slice(0, 16));
  const [crimeArtDB, setCrimeArtDB] = useState<Article[]>(publishedInitialArticles.filter((a) => a.category?.toLowerCase() === 'crime').slice(0, 4));
  const [nationalArtDB, setNationalArtDB] = useState<Article[]>(publishedInitialArticles.filter((a) => a.category?.toLowerCase() === 'national' || a.category?.toLowerCase() === 'india').slice(0, 4));
  const [worldArtDB, setWorldArtDB] = useState<Article[]>(publishedInitialArticles.filter((a) => a.category?.toLowerCase() === 'world').slice(0, 4));
  const [businessArtDB, setBusinessArtDB] = useState<Article[]>(publishedInitialArticles.filter((a) => a.category?.toLowerCase() === 'business').slice(0, 4));
  const [sportsArtDB, setSportsArtDB] = useState<Article[]>(publishedInitialArticles.filter((a) => a.category?.toLowerCase() === 'sports').slice(0, 7));
  const [dynamicTrendingTopics, setDynamicTrendingTopics] = useState<string[]>(initialHeroSettings?.trendingTopics || initialHeroSettings?.setting?.trendingTopics || []);
  const [marketRates, setMarketRates] = useState<any>({
    gold: { price: '₹74,850', change: '▲ ₹450', purity: '24 Karat', unit: '10 Grams' },
    silver: { price: '₹84,200', change: '— Stable', purity: '999 Fine', unit: '1 Kg' },
  });
  const [weatherData, setWeatherData] = useState<any>({
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

  useEffect(() => {
    // Fetch main articles pool, hero slots settings, videos, market rates, weather, AND categories in parallel
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
        const customPopularArts: Article[] = (heroRes?.popularNewsArticles || []).filter(Boolean);
        const customMostReadArts: Article[] = (heroRes?.mostReadArticles || []).filter(Boolean);
        const trendingArts = arts.filter((a: Article) => a.isTrending);
        const popularPool = fillPool([...trendingArts, ...customPopularArts], arts, 10);
        setTrendingArtDB(popularPool);
        const mostReadPool = customMostReadArts.length > 0 ? customMostReadArts : arts.slice(0, 5);
        setMostReadArtDB(mostReadPool);
        setGujaratArtDB(arts.filter((a: Article) => a.category?.toLowerCase() === 'gujarat' || a.category?.toLowerCase() === 'state').slice(0, 16));
        setCrimeArtDB(arts.filter((a: Article) => a.category?.toLowerCase() === 'crime').slice(0, 4));
        setNationalArtDB(arts.filter((a: Article) => a.category?.toLowerCase() === 'national' || a.category?.toLowerCase() === 'india').slice(0, 4));
        setWorldArtDB(arts.filter((a: Article) => a.category?.toLowerCase() === 'world').slice(0, 4));
        setBusinessArtDB(arts.filter((a: Article) => a.category?.toLowerCase() === 'business').slice(0, 4));
        setSportsArtDB(arts.filter((a: Article) => a.category?.toLowerCase() === 'sports').slice(0, 7));
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
    if (!allCategoriesDB || !Array.isArray(allCategoriesDB) || allCategoriesDB.length === 0) {
      return ['videos', 'gujarat', 'national', 'trending', 'latest-news', 'instagram', 'world', 'politics', 'webstory', 'crime', 'entertainment', 'fact-check', 'photos', 'weather', 'shorts', 'live-center'];
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
    national: <NationalSection key="national" language={language} />,
    trending: (
      <Fragment key="trending-frag">
        <TrendingSection key="trending" />
        <AdSectionBanner section="AFTER_TRENDING" />
      </Fragment>
    ),
    'latest-news': (
      <LatestUpdatesSection
        key="latest-news"
        view="all"
        initialArticles={articlesList}
        initialPopularNews={initialHeroSettings?.popularNewsArticles || (initialHeroSettings as any)?.setting?.popularNewsArticles}
      />
    ),
    instagram: <InstagramStories key="instagram" />,
    world: <WorldSection key="world" language={language} />,
    politics: <PoliticsSection key="politics" language={language} />,
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
            <CrimeSection language={language} view="content" />
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

            <CrimeSection language={language} view="sidebar" />
          </div>
        </div>
      </section>
    ),
    entertainment: <EntertainTechLifeSection key="entertainment" language={language} />,
    technology: null,
    health: null,
    'fact-check': <FactCheckSection key="fact-check" language={language} />,
    photos: (
      <Fragment key="photos-frag">
        <PhotoGallerySection language={language} />
        <AdSectionBanner section="AFTER_GALLERY" />
      </Fragment>
    ),
    weather: <WeatherDashboardSection key="weather" language={language} />,
    shorts: (
      <Fragment key="shorts-frag">
        <VideoDesk videos={(videosList.length > 0 ? videosList : initialVideos || []).slice(0, 7)} language={language} onlyShorts={true} />
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
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground font-semibold border-t border-border/50 pt-2">
                    {uniqueTopStories[0].author && (
                      <span className="font-black text-foreground">
                        {getLocalized(language, {
                          en: uniqueTopStories[0].author.name,
                          gu: uniqueTopStories[0].author.nameGu,
                          hi: uniqueTopStories[0].author.nameHi,
                        })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(uniqueTopStories[0].publishedAt)}
                    </span>
                  </div>
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
                        <div className="flex items-center gap-1.5 mt-1 md:mt-2.5 text-[10.5px] text-muted-foreground font-semibold">
                          <span>
                            {language === 'gu'
                              ? (art.relativeTimeGu || formatDate(art.publishedAt, 'gu'))
                              : language === 'hi'
                                ? (art.relativeTimeHi || formatDate(art.publishedAt, 'hi'))
                                : (art.relativeTime || formatDate(art.publishedAt, 'en'))}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                            <span>
                              {language === 'gu'
                                ? (art.readingTime ? `${art.readingTime} મિનિટ વાંચન` : '૪ મિનિટ વાંચન')
                                : language === 'hi'
                                  ? (art.readingTime ? `${art.readingTime} मिनट पठन` : '4 मिनट पठन')
                                  : (art.readingTime ? `${art.readingTime} min read` : '4 min read')}
                            </span>
                          </span>
                        </div>
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
            minHeight={180}
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
              {(mostReadArtDB.length > 0 ? mostReadArtDB : uniqueTrendingArt).slice(0, 5).map((art, idx) => (
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

/* --- Native Sponsored Ads Section (Taboola/Outbrain style) ---------------- */
interface NativeAd {
  id: string;
  title: string;
  titleGu: string;
  description?: string;
  descriptionGu?: string;
  image: string;
  source: string;
  sourceGu: string;
  buttonText?: string;
  buttonTextGu?: string;
  href: string;
}

const NATIVE_ADS: NativeAd[] = [
  {
    id: 'ad-1',
    title: 'Stop Searching for the Perfect Everyday Top',
    titleGu: 'રોજિંદા ઉપયોગ માટે પર્ફેક્ટ ટોપ શોધવાનું બંધ કરો',
    description: 'Soft fabrics, flattering silhouettes, and timeless details come together in tops made to keep you stylish and comfortable all day long.',
    descriptionGu: 'નરમ કાપડ, આકર્ષક સિલુએટ્સ અને કાલાતીત વિગતો આખો દિવસ તમને સ્ટાઇલિશ અને આરામદાયક રાખવા માટે તૈયાર કરવામાં આવી છે.',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80',
    source: 'Everyday Fashion',
    sourceGu: 'વ્યભિચારી | પ્રાયોજિત',
    buttonText: 'Shop Now',
    buttonTextGu: 'હવે ખરીદી કરો',
    href: '#'
  },
  {
    id: 'ad-2',
    title: "Woman sells ring given by ex, then jeweler tells her 'This can't be true'",
    titleGu: "મહિલાએ તેના પૂર્વ પ્રેમીએ આપેલી વીંટી વેચી, ઝવેરીએ કહ્યું 'આ સાચું ન હોઈ શકે'",
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80',
    source: 'Daily Life',
    sourceGu: 'લાઇવ ડેઇલી | પ્રાયોજિત',
    href: '#'
  },
  {
    id: 'ad-3',
    title: 'finance courses for corporate employees',
    titleGu: 'કોર્પોરેટ કર્મચારીઓ માટે ફાઇનાન્સ કોર્સ',
    description: 'finance courses for corporate employees',
    descriptionGu: 'કોર્પોરેટ કર્મચારીઓ માટે ખાસ ડિઝાઇન કરેલા ફાઇનાન્સ અભ્યાસક્રમો',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80',
    source: 'Finance Acad',
    sourceGu: 'વેબસી | પ્રાયોજિત',
    buttonText: 'Shop Now',
    buttonTextGu: 'હવે ખરીદી કરો',
    href: '#'
  },
  {
    id: 'ad-4',
    title: '20 Celeb Transformations That Quietly Stunned Hollywood',
    titleGu: '૨૦ સેલિબ્રિટી ટ્રાન્સફોર્મેશન જેણે હોલીવુડને સ્તબ્ધ કરી દીધું',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    source: 'Celeb Buzz',
    sourceGu: 'રાજા-નિર્મિત ગુંડાઓ | પ્રાયોજિત',
    href: '#'
  },
  {
    id: 'ad-5',
    title: 'My Husband Called Me Useless At A Company BBQ. Then I Said This To His CEO',
    titleGu: 'મારી કંપનીના બાર્બેક્યુમાં પતિએ મને નકામી કહી, પછી મેં તેના CEOને આ વાત કહી',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80',
    source: 'Viral Stories',
    sourceGu: 'બીચ રાઇડર | પ્રાયોજિત',
    href: '#'
  },
  {
    id: 'ad-6',
    title: 'This New Smart Watch is Sweeping the Country',
    titleGu: 'આ નવી સ્માર્ટ વોચ દેશભરમાં ધૂમ મચાવી રહી છે',
    description: 'Track your health, receive calls, and stay fit with the next generation of affordable luxury watches.',
    descriptionGu: 'પરવડે તેવી લક્ઝરી ઘડિયાળોની નવી પેઢી સાથે તમારા સ્વાસ્થ્યને ટ્રૅક કરો અને ફિટ રહો.',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80',
    source: 'Tech Watch',
    sourceGu: 'સ્માર્ટ ટેક | પ્રાયોજિત',
    buttonText: 'Order Now',
    buttonTextGu: 'હવે ઓર્ડર કરો',
    href: '#'
  },
  {
    id: 'ad-7',
    title: 'The Most Beautiful Island Resorts You Can Visit Without a Passport',
    titleGu: 'પાસપોર્ટ વગર તમે મુલાકાત લઈ શકો તેવા સુંદર ટાપુ રિસોર્ટ્સ',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    source: 'Island Travel',
    sourceGu: 'પ્રવાસન ડેસ્ક | પ્રાયોજિત',
    href: '#'
  },
  // Batch 2 Ads
  {
    id: 'ad-8',
    title: 'The Most Affordable Dental Implants in Ahmedabad',
    titleGu: 'અમદાવાદમાં સૌથી વધુ સસ્તા અને ગુણવત્તાયુક્ત ડેન્ટલ ઇમ્પ્લાન્ટ્સ',
    description: 'Restore your smile with top quality dental implants starting at low prices.',
    descriptionGu: 'સૌથી ઓછી કિંમતથી શરૂ થતા ગુણવત્તાયુક્ત ડેન્ટલ ઇમ્પ્લાન્ટ્સ વડે તમારું સ્મિત પાછું મેળવો.',
    image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&q=80',
    source: 'Dental Care',
    sourceGu: 'ડેન્ટલ કેર | પ્રાયોજિત',
    buttonText: 'Book Now',
    buttonTextGu: 'બુક કરો',
    href: '#'
  },
  {
    id: 'ad-9',
    title: 'Top SUV Cars Launching Under 10 Lakhs in 2026',
    titleGu: '૨૦૨૬માં ૧૦ લાખની અંદર લોન્ચ થનારી શાનદાર SUV કાર્સ',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80',
    source: 'Auto World',
    sourceGu: 'મોટર વર્લ્ડ | પ્રાયોજિત',
    href: '#'
  },
  {
    id: 'ad-10',
    title: 'If You Suffer From Knee Pain, Try This Simple Daily Exercise',
    titleGu: 'જો તમે ઘૂંટણના દુખાવાથી પરેશાન છો, તો અજમાવો આ સરળ કસરત',
    description: 'Relieve joints naturally with a quick 5-minute stretch routine at home.',
    descriptionGu: 'ઘરે જ માત્ર ૫-મિનિટની સરળ કસરતોથી ઘૂંટણના સાંધાના દુખાવામાં કુદરતી રાહત મેળવો.',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
    source: 'Health Life',
    sourceGu: 'આરોગ્ય સેતુ | પ્રાયોજિત',
    buttonText: 'Learn More',
    buttonTextGu: 'વધુ જાણો',
    href: '#'
  },
  {
    id: 'ad-11',
    title: 'Why Smart Homes Are Becoming The New Standard in India',
    titleGu: 'શા માટે ભારતમાં સ્માર્ટ હોમ્સ નવો ટ્રેન્ડ બની રહ્યા છે',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80',
    source: 'Smart Home Tech',
    sourceGu: 'ટેક હોમ | પ્રાયોજિત',
    href: '#'
  },
  {
    id: 'ad-12',
    title: '15 Foods You Should Never Eat After Age 50',
    titleGu: '૫૦ વર્ષની ઉંમર પછી ક્યારેય ન ખાવા જોઈએ તેવા ૧૫ ખોરાક',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&q=80',
    source: 'Food Diet',
    sourceGu: 'આહાર ન્યુટ્રિશન | પ્રાયોજિત',
    href: '#'
  },
  {
    id: 'ad-13',
    title: 'Unsold Luxury Cabins in Himachal Pradesh Are Selling for Next to Nothing',
    titleGu: 'હિમાચલ પ્રદેશમાં ન વેચાયેલા લક્ઝરી કેબિન ખૂબ જ સસ્તા ભાવે મળી રહ્યા છે',
    description: 'Stunning mountain views and top tier design at a fraction of the cost.',
    descriptionGu: 'આકર્ષક પર્વતીય નજારા અને લક્ઝરી સુવિધાઓ ધરાવતા કોટેજ ખૂબ જ ઓછી કિંમતે ઉપલબ્ધ.',
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&q=80',
    source: 'Himachal Cabins',
    sourceGu: 'હિલ સ્ટેશન પ્રવાસ | પ્રાયોજિત',
    buttonText: 'View Details',
    buttonTextGu: 'વિગત જુઓ',
    href: '#'
  },
  {
    id: 'ad-14',
    title: 'The Ultimate Guide to Saving for Retirement in Your 30s',
    titleGu: '૩૦ વર્ષની ઉંમરે નિવૃત્તિ માટે બચત કરવાની અંતિમ માર્ગદર્શિકા',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
    source: 'Wealth Guide',
    sourceGu: 'બચત ડેસ્ક | પ્રાયોજિત',
    href: '#'
  },
  {
    id: 'ad-15',
    title: 'Top 10 High-Paying Work From Home Jobs in 2026',
    titleGu: '૨૦૨૬માં ઘરે બેઠા શાનદાર કમાણી આપતી ટોપ ૧૦ નોકરીઓ',
    description: 'Work from anywhere and earn a stable income with these growing career opportunities.',
    descriptionGu: 'આ વધતી જતી કારકિર્દીની તકો સાથે ગમે ત્યાંથી કામ કરો અને સ્થિર આવક મેળવો.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
    source: 'Job Careers',
    sourceGu: 'રોજગાર ન્યૂઝ | પ્રાયોજિત',
    buttonText: 'Apply Now',
    buttonTextGu: 'અરજી કરો',
    href: '#'
  },
  {
    id: 'ad-16',
    title: 'Indian Travelers Are Loving This New Suitcase Design',
    titleGu: 'મુસાફરો માટે આ નવી સુટકેસ ડિઝાઇન સોશિયલ મીડિયા પર વાયરલ',
    image: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600&q=80',
    source: 'Travel Gear',
    sourceGu: 'પ્રવાસન કીટ | પ્રાયોજિત',
    href: '#'
  },
  {
    id: 'ad-17',
    title: 'The Cost of a Cruise Might Surprise You',
    titleGu: 'લક્ઝરી ક્રૂઝ સફરનો ખર્ચ જાણીને તમે ચોંકી જશો',
    description: 'Find amazing discounts on last-minute cruise departures worldwide.',
    descriptionGu: 'વિશ્વભરમાં છેલ્લી ઘડીના લક્ઝરી ક્રૂઝ બુકિંગ પર મેળવો આકર્ષક ડિસ્કાઉન્ટ.',
    image: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=80',
    source: 'Cruise Deals',
    sourceGu: 'સફર ડેસ્ક | પ્રાયોજિત',
    buttonText: 'View Deals',
    buttonTextGu: 'ડીલ્સ જુઓ',
    href: '#'
  },
  {
    id: 'ad-18',
    title: 'If You Own a Car in Gujarat, Read This Before Paying Insurance',
    titleGu: 'ગુજરાતમાં કાર ધરાવતા લોકો માટે ખાસ વીમા ટિપ્સ',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80',
    source: 'Car Insure',
    sourceGu: 'વાહન વીમો | પ્રાયોજિત',
    href: '#'
  },
  {
    id: 'ad-19',
    title: 'Best Credit Cards with Zero Annual Fees for 2026',
    titleGu: 'કોઈપણ વાર્ષિક ચાર્જ વગરના ૨૦૨૬ના શ્રેષ્ઠ ક્રેડિટ કાર્ડ્સ',
    image: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=600&q=80',
    source: 'Card Expert',
    sourceGu: 'નાણાકીય સલાહ | પ્રાયોજિત',
    href: '#'
  },
  {
    id: 'ad-20',
    title: 'These Hair Oils Are Proven to Reduce Hair Fall in 2 Weeks',
    titleGu: 'માત્ર ૨ અઠવાડિયામાં વાળ ખરતા અટકાવતા શ્રેષ્ઠ હેર ઓઇલ',
    description: 'Restore thickness and volume naturally with 100% organic ayurvedic herbal oils.',
    descriptionGu: '૧૦૦% ઓર્ગેનિક આયુર્વેદિક હર્બલ તેલ વડે વાળની ​​જાડાઈ અને જથ્થો કુદરતી રીતે પુનઃસ્થાપિત કરો.',
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80',
    source: 'Hair Care',
    sourceGu: 'બ્યુટી ટીપ્સ | પ્રાયોજિત',
    buttonText: 'Order Now',
    buttonTextGu: 'હવે ઓર્ડર કરો',
    href: '#'
  },
  {
    id: 'ad-21',
    title: 'Top Luxury Retirement Homes in Gujarat (See Prices)',
    titleGu: 'ગુજરાતમાં ઉપલબ્ધ લક્ઝરી નિવૃત્ત આશ્રમોની કિંમત જુઓ',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80',
    source: 'Senior Living',
    sourceGu: 'નિવૃત્ત વિલા | પ્રાયોજિત',
    href: '#'
  }
];

function AdCard({
  ad,
  language,
  isRow2,
  className = ''
}: {
  ad: NativeAd;
  language: Language;
  isRow2: boolean;
  className?: string;
}) {
  if (isRow2) {
    return (
      <a
        href={ad.href}
        className={`group flex flex-row gap-3 p-3 rounded-xl border border-border/40 hover:border-[#B3121B]/30 hover:shadow-md transition-all duration-300 bg-card md:flex-col md:p-4 ${className}`}
      >
        <div className="relative w-[90px] h-[72px] shrink-0 overflow-hidden rounded-lg md:w-full md:h-44 md:mb-3">
          <Image
            src={ad.image}
            alt={ad.title}
            fill
            sizes="(max-width: 768px) 90px, 360px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h4 className="text-[12.5px] md:text-[14.5px] font-black leading-snug text-foreground line-clamp-3 md:line-clamp-2 group-hover:text-[#B3121B] transition-colors">
              {language === 'gu' ? ad.titleGu : ad.title}
            </h4>
            {ad.description && (
              <p className="hidden md:block text-[12px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                {language === 'gu' ? ad.descriptionGu : ad.description}
              </p>
            )}
          </div>
          <div className="mt-2 md:mt-4 flex items-center justify-between gap-2">
            <span className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-wider truncate">
              {language === 'gu' ? ad.sourceGu : `${ad.source}`}
            </span>
            {ad.buttonText && (
              <span className="hidden md:inline-block border border-[#B3121B] text-[#B3121B] text-[10.5px] font-black rounded-full px-3 py-1 hover:bg-[#B3121B] hover:text-white transition-all duration-200 shrink-0">
                {language === 'gu' ? ad.buttonTextGu : ad.buttonText}
              </span>
            )}
          </div>
        </div>
      </a>
    );
  } else {
    return (
      <a
        href={ad.href}
        className={`group flex flex-row gap-3 p-3 rounded-xl border border-border/40 hover:border-[#B3121B]/30 hover:shadow-md transition-all duration-300 bg-card md:gap-4 md:p-4 ${className}`}
      >
        <div className="relative w-[90px] h-[72px] shrink-0 overflow-hidden rounded-lg md:w-56 md:h-36">
          <Image
            src={ad.image}
            alt={ad.title}
            fill
            sizes="(max-width: 768px) 90px, 224px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5 md:py-1">
          <div>
            <h4 className="text-[12.5px] md:text-[15.5px] font-black leading-snug text-foreground line-clamp-3 md:line-clamp-2 group-hover:text-[#B3121B] transition-colors">
              {language === 'gu' ? ad.titleGu : ad.title}
            </h4>
            {ad.description && (
              <p className="hidden md:block text-[12px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                {language === 'gu' ? ad.descriptionGu : ad.description}
              </p>
            )}
          </div>
          <div className="mt-2 md:mt-4 flex items-center justify-between gap-2">
            <span className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-wider truncate">
              {language === 'gu' ? ad.sourceGu : `${ad.source}`}
            </span>
            {ad.buttonText && (
              <span className="hidden md:inline-block border border-[#B3121B] text-[#B3121B] text-[10.5px] font-black rounded-full px-4 py-1.5 hover:bg-[#B3121B] hover:text-white transition-all duration-200 shrink-0">
                {language === 'gu' ? ad.buttonTextGu : ad.buttonText}
              </span>
            )}
          </div>
        </div>
      </a>
    );
  }
}

function getInfiniteAds(count: number): NativeAd[] {
  const list: NativeAd[] = [];
  for (let i = 0; i < count; i++) {
    const originalAd = NATIVE_ADS[i % NATIVE_ADS.length];
    const repeatCount = Math.floor(i / NATIVE_ADS.length);
    list.push({
      ...originalAd,
      id: `${originalAd.id}-rep-${repeatCount}`,
    });
  }
  return list;
}

const MAX_GROUPS = 5;
const MAX_ADS_COUNT = MAX_GROUPS * 7;

export function NativeAdsSection({ language }: { language: Language }) {
  const [loadedCount, setLoadedCount] = useState(7);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || loadedCount >= MAX_ADS_COUNT) return;

    let timer: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingRef.current) {
          isLoadingRef.current = true;
          setIsLoadingMore(true);

          timer = setTimeout(() => {
            setLoadedCount((prev) => Math.min(prev + 7, MAX_ADS_COUNT));
            isLoadingRef.current = false;
            setIsLoadingMore(false);
          }, 400);
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.01
      }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [loadedCount]);

  const visibleAds = getInfiniteAds(loadedCount);
  const groups: NativeAd[][] = [];
  for (let i = 0; i < visibleAds.length; i += 7) {
    groups.push(visibleAds.slice(i, i + 7));
  }
  const limitedGroups = groups.slice(0, MAX_GROUPS);

  return (
    <section id="infinite-ads-section" ref={containerRef} className="mx-auto max-w-screen-xl px-4 py-8 select-none border-t border-border/40 mt-8">
      {/* Styles for smooth load-in transitions and custom scrollbar */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="flex items-center gap-2 mb-6 select-none">
        <span className="h-[2px] flex-1 bg-neutral-200 dark:bg-neutral-800" />
        <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider px-3 bg-background relative z-10">
          {language === 'gu' ? 'તમને આ પણ ગમશે' : 'RECOMMENDED FOR YOU'}
        </span>
        <span className="h-[2px] flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <div className="space-y-6 border border-neutral-200/30 dark:border-neutral-800/40 rounded-xl p-4 bg-neutral-50/10 dark:bg-neutral-900/5">
        {limitedGroups.map((group, groupIndex) => {
          const row1 = group.slice(0, 2);
          const row2 = group.slice(2, 5);
          const row3 = group.slice(5, 7);
          const animClass = groupIndex > 0 ? 'animate-slideUp' : '';

          return (
            <div key={groupIndex} className="space-y-6">
              {/* Divider between batches */}
              {groupIndex > 0 && (
                <div className="flex items-center gap-2 py-4 select-none animate-slideUp">
                  <span className="h-[1.5px] flex-1 bg-neutral-200 dark:bg-neutral-800" />
                  <span className="text-[10px] font-black uppercase text-muted-foreground/80 tracking-widest px-3">
                    {groupIndex % 2 === 1
                      ? (language === 'gu' ? 'વધુ પ્રાયોજિત લિંક્સ' : 'MORE SPONSORED LINKS')
                      : (language === 'gu' ? 'તમને રસ પડી શકે તેવી વધુ કડીઓ' : 'MORE LINKS FOR YOU')}
                  </span>
                  <span className="h-[1.5px] flex-1 bg-neutral-200 dark:bg-neutral-800" />
                </div>
              )}

              {/* ROW A: 2 Columns */}
              {row1.length > 0 && (
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6 ${animClass}`}>
                  {row1.map((ad) => (
                    <AdCard key={ad.id} ad={ad} language={language} isRow2={false} />
                  ))}
                </div>
              )}

              {/* ROW B: 3 Columns */}
              {row2.length > 0 && (
                <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 ${animClass}`}>
                  {row2.map((ad) => (
                    <AdCard key={ad.id} ad={ad} language={language} isRow2={true} />
                  ))}
                </div>
              )}

              {/* ROW C: 2 Columns */}
              {row3.length > 0 && (
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6 ${groupIndex > 0 ? '' : 'animate-slideUp'}`}>
                  {row3.map((ad) => (
                    <AdCard key={ad.id} ad={ad} language={language} isRow2={false} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {/* Sentinel for Infinite Scroll Trigger (Stops after 5 component groups) */}
        {loadedCount < MAX_ADS_COUNT && (
          <div ref={sentinelRef} className="h-12 w-full flex items-center justify-center mt-6">
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-bold select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B3121B] animate-ping" />
              <span>{language === 'gu' ? 'વધુ લોડ થઈ રહ્યું છે...' : 'Loading more recommendations...'}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* --- Video Desk Section ---------------------------------------------------- */
function cleanVideoTitle(str: string): string {
  if (!str) return '';
  // Strip trailing hashtags like #teacher #news #gujaratpost #protest
  return str.replace(/(?:\s*#[a-zA-Z0-9_\u0A80-\u0AFF]+)+$/gi, '').trim();
}

function VideoDesk({ videos, language, showShorts = true, onlyShorts = false }: { videos: typeof VIDEOS; language: Language; showShorts?: boolean; onlyShorts?: boolean }) {
  const [playId, setPlayId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const sidebarPaused = useRef(false);
  const isShortsPaused = useRef(false);

  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [featuredHovered, setFeaturedHovered] = useState(false);

  // Auto-change the featured video every 6 seconds if no video is playing and not hovered
  useEffect(() => {
    if (playId || featuredHovered) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % Math.min(videos.length, 6));
    }, 2000);
    return () => clearInterval(interval);
  }, [playId, featuredHovered, videos.length]);

  // Auto-scroll the right sidebar using setInterval (checks ref each tick)
  useEffect(() => {
    const interval = setInterval(() => {
      const el = sidebarRef.current;
      if (!el || sidebarPaused.current) return;
      el.scrollTop += 1;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        el.scrollTop = 0;
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll the horizontal Shorts container smoothly (60fps continuous loop)
  useEffect(() => {
    if (!onlyShorts) return;
    let animId: number;
    const scrollStep = () => {
      const el = scrollContainerRef.current;
      if (el && !isShortsPaused.current && !playId) {
        el.scrollLeft += 0.8;
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animId = requestAnimationFrame(scrollStep);
    };
    animId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animId);
  }, [onlyShorts, playId]);

  if (!videos.length) return null;

  // Restrict VideoDesk to ONLY featured videos if featured videos exist in database/admin
  const featuredOnly = videos.filter(v => (v as any).isFeatured);
  const sourcePool = featuredOnly.length > 0 ? featuredOnly : videos;

  // Hard filter: exclude Shorts when showShorts=false (extra safety layer)
  const displayVideos = !showShorts
    ? sourcePool.filter(v => v.type === 'video' || !v.type)
    : onlyShorts
      ? sourcePool.filter(v => v.type === 'short')
      : sourcePool;


  if (!displayVideos.length) return null;

  const featuredVideo = displayVideos[featuredIndex % displayVideos.length];
  // Filter out current featured video from sidebar list to avoid duplication
  const sidebarVideos = displayVideos.filter((_, idx) => idx !== (featuredIndex % displayVideos.length)).slice(0, 15);

  const handleSidebarClick = (youtubeId: string, id: string) => {
    setPlayId(youtubeId);
    const originalIndex = videos.findIndex(vid => vid.id === id);
    if (originalIndex !== -1) {
      setFeaturedIndex(originalIndex);
    }
  };

  const updateArrows = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 10);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (onlyShorts) {
    const customShorts = [
      {
        id: 's1',
        categoryGu: 'હવામાન',
        categoryEn: 'Weather',
        titleGu: '60 સેકન્ડમાં વરસાદ એલર્ટ',
        viewsGu: '12K',
        duration: '0:60',
        isBannerCard: true,
        youtubeId: 'sA6BrUmBXiA'
      },
      {
        id: 's2',
        categoryGu: 'ગુજરાત',
        categoryEn: 'Gujarat',
        titleGu: 'ગુજરાત ટાઇટન્સની ટ્રેનિંગ મોમેન્ટ',
        viewsGu: '8.4K',
        duration: '0:45',
        image: '/assets/demo/3.jpg',
        youtubeId: 'rQHoqCTiQvI'
      },
      {
        id: 's3',
        categoryGu: 'બિઝનેસ',
        categoryEn: 'Business',
        titleGu: 'શેર બજારમાં ઐતિહાસિક ઉછાળો',
        viewsGu: '6.7K',
        duration: '0:40',
        image: '/assets/demo/5.jpg',
        youtubeId: 'WF2Kuec5HV0'
      },
      {
        id: 's4',
        categoryGu: 'લાઈફસ્ટાઈલ',
        categoryEn: 'Lifestyle',
        titleGu: 'ચોમાસામાં આરોગ્ય ટિપ્સ',
        viewsGu: '14.2K',
        duration: '0:40',
        image: '/assets/demo/6.jpg',
        youtubeId: 'LDDtOMwdJ_0'
      },
      {
        id: 's5',
        categoryGu: 'ફિટનેસ',
        categoryEn: 'Fitness',
        titleGu: 'યોગા અને માનસિક શાંતિ',
        viewsGu: '9.3K',
        duration: '0:35',
        image: '/assets/demo/7.jpg',
        youtubeId: '-iXZuFoHqiw'
      },
      {
        id: 's6',
        categoryGu: 'ટેકનોલોજી',
        categoryEn: 'Technology',
        titleGu: 'નવા AI ટૂલ્સની શક્તિશાળી સુવિધાઓ',
        viewsGu: '7.1K',
        duration: '0:30',
        image: '/assets/demo/8.jpg',
        youtubeId: 'uJalvs-jgFc'
      },
      {
        id: 's7',
        categoryGu: 'સમાચાર',
        categoryEn: 'News',
        titleGu: 'નવરાત્રી સેટની એક્લુદ ક્લિપ',
        viewsGu: '11K',
        duration: '0:59',
        image: '/assets/demo/1.jpg',
        youtubeId: 'A_5vL-ngK4M'
      },
      {
        id: 's8',
        categoryGu: 'રાજકારણ',
        categoryEn: 'Politics',
        titleGu: 'વિધાનસભા ચોમાસુ સત્રના તાજા દ્રશ્યો',
        viewsGu: '15.8K',
        duration: '0:50',
        image: '/assets/demo/4.jpg',
        youtubeId: 'sA6BrUmBXiA'
      },
      {
        id: 's9',
        categoryGu: 'સ્પોર્ટ્સ',
        categoryEn: 'Sports',
        titleGu: 'ક્રિકેટ મેચની રોમાંચક પળો',
        viewsGu: '18.4K',
        duration: '0:42',
        image: '/assets/demo/2.jpg',
        youtubeId: 'rQHoqCTiQvI'
      },
      {
        id: 's10',
        categoryGu: 'મનોરંજન',
        categoryEn: 'Entertainment',
        titleGu: 'નવી ગુજરાતી ફિલ્મનું ટ્રેલર',
        viewsGu: '22.1K',
        duration: '0:48',
        image: '/assets/demo/6.jpg',
        youtubeId: 'WF2Kuec5HV0'
      },
      {
        id: 's11',
        categoryGu: 'શિક્ષણ',
        categoryEn: 'Education',
        titleGu: 'વિદ્યાર્થીઓ માટે સ્કોલરશિપ અપડેટ',
        viewsGu: '10.5K',
        duration: '0:38',
        image: '/assets/demo/3.jpg',
        youtubeId: 'LDDtOMwdJ_0'
      },
      {
        id: 's12',
        categoryGu: 'વાયરલ',
        categoryEn: 'Viral',
        titleGu: 'સોશિયલ મીડિયા પર વાયરલ થયેલો વીડિયો',
        viewsGu: '25.6K',
        duration: '0:33',
        image: '/assets/demo/7.jpg',
        youtubeId: '-iXZuFoHqiw'
      }
    ];

    return (
      <section className="mt-6">
        {/* Red Panel containing only Shorts */}
        <div className="w-full bg-[#B3121B] text-white rounded-sm px-5 md:px-8 py-6 border border-white/10 relative overflow-hidden shadow-lg">

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-5 select-none">
            <span className="bg-white/20 text-white font-black text-[12.5px] px-3.5 py-1.5 rounded-sm tracking-wide border border-white/25">
              {language === 'gu' ? 'શોર્ટ  વીડિયો' : language === 'hi' ? 'शॉर्ट  वीडियो' : 'Short Videos'}
            </span>
            <Link
              href="/shorts"
              className="text-white/95 font-extrabold text-[13px] md:text-[14px] hover:text-white hover:underline flex items-center gap-1"
            >
              {language === 'gu' ? 'વધુ શોર્ટ્સ →' : 'More Shorts →'}
            </Link>
          </div>

          {/* Shorts Strip */}
          <div className="relative z-10">
            <div className="relative">
              {/* Left arrow */}
              {showLeftArrow && (
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  className="absolute left-[-14px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white text-[#B3121B] flex items-center justify-center shadow-xl border border-slate-200 hover:scale-105 transition-transform"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-6 w-6 stroke-[3]" />
                </button>
              )}

              {/* Scrollable list */}
              <div
                ref={scrollContainerRef}
                onScroll={updateArrows}
                onMouseEnter={() => { isShortsPaused.current = true; }}
                onMouseLeave={() => { isShortsPaused.current = false; }}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
              >
                {[...customShorts, ...customShorts].map((card, index) => (
                  <div
                    key={`${card.id}-${index}`}
                    className="group relative flex-shrink-0 w-[145px] sm:w-[165px] md:w-[175px] cursor-pointer"
                    onClick={() => setPlayId(card.youtubeId)}
                  >
                    {/* Vertical Card 9/16 matching Image 1 */}
                    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/15 shadow-md flex flex-col justify-between p-3 select-none">
                      {card.isBannerCard ? (
                        <div className="absolute inset-0 bg-gradient-to-b from-[#800A11] via-[#5C060B] to-[#3B0306] flex flex-col justify-between p-3.5">
                          {/* Top row */}
                          <div className="flex items-center justify-between z-10">
                            <span className="bg-[#B3121B] text-white px-2.5 py-0.5 text-[10.5px] font-black rounded-full shadow-sm">
                              {language === 'gu' ? card.categoryGu : card.categoryEn}
                            </span>
                            <MoreVertical className="h-4 w-4 text-white/80" />
                          </div>

                          {/* Middle Alert Banner Text */}
                          <div className="my-auto text-left leading-tight py-2 z-10">
                            <h3 className="text-3xl font-black text-white drop-shadow">60</h3>
                            <h3 className="text-lg font-black text-white drop-shadow">સેકન્ડમાં</h3>
                            <h3 className="text-lg font-black text-[#B3121B] bg-white px-1.5 py-0.5 inline-block rounded-sm mt-0.5 shadow">વરસાદ</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <h3 className="text-lg font-black text-white drop-shadow">એલર્ટ</h3>
                              <span className="w-6 h-6 rounded-full bg-[#B3121B] text-white flex items-center justify-center shadow">
                                <Play className="h-3 w-3 fill-current ml-0.5" />
                              </span>
                            </div>
                          </div>

                          {/* Bottom metadata */}
                          <div className="z-10">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/90">
                              <Eye className="h-3 w-3" />
                              <span>{card.viewsGu} વ્યુ</span>
                              <span>|</span>
                              <Clock className="h-3 w-3" />
                              <span>{card.duration}</span>
                            </div>
                            <div className="h-1 w-4 bg-[#B3121B] rounded-full mt-1.5" />
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Image */}
                          <Image
                            src={card.image || '/assets/demo/3.jpg'}
                            alt={card.titleGu}
                            fill
                            sizes="175px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

                          {/* Top row */}
                          <div className="relative z-10 flex items-center justify-between">
                            <span className="bg-[#B3121B] text-white px-2.5 py-0.5 text-[10.5px] font-black rounded-full shadow-sm">
                              {language === 'gu' ? card.categoryGu : card.categoryEn}
                            </span>
                            <MoreVertical className="h-4 w-4 text-white/80" />
                          </div>

                          {/* Center Play Button */}
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                            <span className="w-11 h-11 rounded-full bg-[#B3121B] text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 border border-white/20">
                              <Play className="h-5 w-5 fill-current ml-0.5" />
                            </span>
                          </div>

                          {/* Bottom title & metadata */}
                          <div className="relative z-10 mt-auto">
                            <p className="text-white text-[12px] font-black leading-snug line-clamp-2 drop-shadow">
                              {card.titleGu}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-white/90 mt-1.5 drop-shadow">
                              <Eye className="h-3 w-3 text-white/80" />
                              <span>{card.viewsGu} વ્યુ</span>
                              <span>|</span>
                              <Clock className="h-3 w-3 text-white/80" />
                              <span>{card.duration}</span>
                            </div>
                            <div className="h-1 w-4 bg-[#B3121B] rounded-full mt-1.5" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right arrow */}
              {showRightArrow && (
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="absolute right-[-14px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white text-[#B3121B] flex items-center justify-center shadow-xl border border-slate-200 hover:scale-105 transition-transform"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-6 w-6 stroke-[3]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Player Modal */}
        {playId && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4 py-6"
            onClick={() => setPlayId(null)}
          >
            <div
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute right-4 top-4 z-20">
                <button
                  type="button"
                  onClick={() => setPlayId(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${safeYouTubeId(playId)}?autoplay=1&rel=0`}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mt-6">
      {/* ── Red Panel containing Videos ── */}
      <div className="w-full bg-[#B3121B] text-white rounded-sm px-5 md:px-8 pt-5 pb-5 border border-white/10 relative overflow-hidden shadow-lg">

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-white font-black text-[18px] md:text-[20px] select-none tracking-tight">
              {language === 'gu' ? 'વીડિયો' : 'Videos'}
            </span>
          </div>
          <Link
            href="/videos"
            className="text-white/95 font-extrabold text-[13px] md:text-[14px] hover:text-white hover:underline flex items-center gap-1"
          >
            {language === 'gu' ? 'વધુ જુઓ →' : 'See All →'}
          </Link>
        </div>

        {/* 2-Column Layout: Featured left, List right */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6 items-stretch">

          {/* Left: Featured Video */}
          <div
            className="group flex flex-col cursor-pointer"
            onClick={() => setPlayId(featuredVideo.youtubeId)}
            onMouseEnter={() => setFeaturedHovered(true)}
            onMouseLeave={() => setFeaturedHovered(false)}
          >
            {/* Large thumbnail */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm bg-black/30 mb-3.5 shadow-inner border border-white/10">
              <Image
                key={featuredIndex}
                src={featuredVideo.thumbnail}
                alt={featuredVideo.titleGu}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02] animate-in fade-in duration-500"
              />
              {/* Large play button */}
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[54px] h-[54px] rounded-full bg-white/95 text-[#B3121B] flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-110">
                <Play className="h-6 w-6 fill-current ml-0.5" />
              </span>
              {/* Duration badge */}
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-black px-2 py-0.5 rounded-sm">
                {featuredVideo.duration}
              </span>
            </div>

            {/* Title container with fixed exact height & clean titles */}
            <div className="h-[46px] md:h-[50px] overflow-hidden flex items-start mt-1">
              <h3 key={`title-${featuredIndex}`} className="font-extrabold text-[15px] md:text-[18px] leading-[1.35] text-white group-hover:underline transition-all line-clamp-2 animate-in fade-in duration-500">
                {cleanVideoTitle(getLocalized(language, { en: featuredVideo.title, gu: featuredVideo.titleGu || featuredVideo.title, hi: featuredVideo.titleHi || featuredVideo.title }))}
              </h3>
            </div>

            {/* Meta */}
            <div key={`meta-${featuredIndex}`} className="flex items-center gap-1.5 mt-2 text-[11.5px] text-white/70 font-semibold select-none animate-in fade-in duration-500">
              <Eye className="h-3.5 w-3.5" />
              <span>
                {formatViews(featuredVideo.views)} {language === 'gu' ? 'વ્યુઝ' : 'views'}
              </span>
              <span>·</span>
              <span>{featuredVideo.duration}</span>
            </div>
          </div>

          {/* Right: Sidebar container */}
          <div className="flex flex-col h-full min-w-0">
            {/* Sidebar video list */}
            <div
              ref={sidebarRef}
              onMouseEnter={() => { sidebarPaused.current = true; }}
              onMouseLeave={() => { sidebarPaused.current = false; }}
              className="flex flex-col divide-y divide-white/10 h-full max-h-[450px] overflow-y-auto p-3 pr-2 scrollbar-hide bg-black/15 rounded-sm"
            >
              {sidebarVideos.map((v) => (
                <div
                  key={v.id}
                  className="group flex gap-3 py-3.5 cursor-pointer first:pt-0"
                  onClick={() => handleSidebarClick(v.youtubeId, v.id)}
                >
                  {/* Thumbnail */}
                  <div className="relative h-[68px] w-[108px] shrink-0 overflow-hidden rounded-sm bg-black/30 border border-white/10">
                    <Image
                      src={v.thumbnail}
                      alt={v.titleGu || v.title}
                      fill
                      sizes="108px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Mini play */}
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-[#B3121B] flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110">
                      <Play className="h-3 w-3 fill-current ml-0.5" />
                    </span>
                    {/* Duration */}
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                      {v.duration}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <div className="h-[36px] overflow-hidden flex items-start">
                      <h4 className="text-[13px] font-extrabold leading-[1.3] text-white group-hover:underline transition-all line-clamp-2">
                        {cleanVideoTitle(getLocalized(language, { en: v.title, gu: v.titleGu || v.title, hi: v.titleHi || v.title }))}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-white/65 font-semibold">
                      <span>{formatViews(v.views)}</span>
                      <span>·</span>
                      <span>{v.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Video Player Modal */}
      {playId && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4 py-6"
          onClick={() => setPlayId(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute right-4 top-4 z-20">
              <button
                type="button"
                onClick={() => setPlayId(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${safeYouTubeId(playId)}?autoplay=1&rel=0`}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const getZodiacSymbol = (id: string): string => {
  switch (id) {
    case 'aries': return '♈';
    case 'taurus': return '♉';
    case 'gemini': return '♊';
    case 'cancer': return '♋';
    case 'leo': return '♌';
    case 'virgo': return '♍';
    case 'libra': return '♎';
    case 'scorpio': return '♏';
    case 'sagittarius': return '♐';
    case 'capricorn': return '♑';
    case 'aquarius': return '♒';
    case 'pisces': return '♓';
    default: return '♈';
  }
};

const toGuLocal = (num: number | string): string => {
  const guDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  return String(num).split("").map(char => {
    const digit = parseInt(char, 10);
    return isNaN(digit) ? char : guDigits[digit];
  }).join("");
};

const getMockTime = (id: string): string => {
  switch (id) {
    case 'c1': return '10:30 AM';
    case 'c2': return '11:30 AM';
    case 'c3': return '12:30 PM';
    case 'l1': return '10:45 AM';
    case 'l2': return '11:15 AM';
    case 'l3': return '12:15 PM';
    case 'l4': return '01:05 PM';
    default: return '02:00 PM';
  }
};

const CITY_NAME_MAP: Record<string, { gu: string; hi: string; en: string }> = {
  'અમદાવાદ': { gu: 'અમદાવાદ', hi: 'अहमदाबाद', en: 'Ahmedabad' },
  'સુરત': { gu: 'સુરત', hi: 'सूरत', en: 'Surat' },
  'વડોદરા': { gu: 'વડોદરા', hi: 'वडोदरा', en: 'Vadodara' },
  'રાજકોટ': { gu: 'રાજકોટ', hi: 'राजकोट', en: 'Rajkot' },
  'ગાંધીનગર': { gu: 'ગાંધીનગર', hi: 'गांधीनगर', en: 'Gandhinagar' },
  'અન્ય': { gu: 'અન્ય', hi: 'अन्य', en: 'Other Cities' }
};

const TAG_NAME_MAP: Record<string, { gu: string; hi: string; en: string }> = {
  'મેટ્રો': { gu: 'મેટ્રો', hi: 'मेट्रो', en: 'Metro' },
  'વિકાસ': { gu: 'વિકાસ', hi: 'विकास', en: 'Development' },
  'અમદાવાદ': { gu: 'અમદાવાદ', hi: 'अहमदाबाद', en: 'Ahmedabad' },
  'ટ્રાફિક': { gu: 'ટ્રાફિક', hi: 'ट्रैफिक', en: 'Traffic' },
  'સિવિક': { gu: 'સિવિક', hi: 'सिविक', en: 'Civic' },
  'પર્યટન': { gu: 'પર્યટન', hi: 'पर्यटन', en: 'Tourism' },
  'AMC': { gu: 'AMC', hi: 'AMC', en: 'AMC' },
  'પોલીસ': { gu: 'પોલીસ', hi: 'पुलिस', en: 'Police' },
  'દંડ': { gu: 'દંડ', hi: 'जुर्माना', en: 'Penalty' },
  'નિયમ': { gu: 'નિયમ', hi: 'नियम', en: 'Rules' },
  'ડાયમંડ': { gu: 'ડાયમંડ', hi: 'डायमंड', en: 'Diamond' },
  'બિઝનેસ': { gu: 'બિઝનેસ', hi: 'बिजनेस', en: 'Business' },
  'સુરત': { gu: 'સુરત', hi: 'सूरत', en: 'Surat' },
  'વેપાર': { gu: 'વેપાર', hi: 'व्यापार', en: 'Trade' },
  'ટેક્સટાઇલ': { gu: 'ટેક્સટાઇલ', hi: 'टेक्सटाइल', en: 'Textile' },
  'નિકાસ': { gu: 'નિકાસ', hi: 'निर्यात', en: 'Export' },
  'ચોમાસું': { gu: 'ચોમાસું', hi: 'मानसून', en: 'Monsoon' },
  'ડ્રેનેજ': { gu: 'ડ્રેનેજ', hi: 'ड्रेनेज', en: 'Drainage' },
  'SMC': { gu: 'SMC', hi: 'SMC', en: 'SMC' },
  'બજેટ': { gu: 'બજેટ', hi: 'बजट', en: 'Budget' },
  'VMC': { gu: 'VMC', hi: 'VMC', en: 'VMC' },
  'પાણી': { gu: 'પાણી', hi: 'पानी', en: 'Water' },
  'MSU': { gu: 'MSU', hi: 'MSU', en: 'MSU' },
  'સંશોધન': { gu: 'સંશોધન', hi: 'अनुसंधान', en: 'Research' },
  'આરોગ્ય': { gu: 'આરોગ્ય', hi: 'स्वास्थ्य', en: 'Health' },
  'વિજ્ઞાન': { gu: 'વિજ્ઞાન', hi: 'विज्ञान', en: 'Science' },
  'સ્માર્ટ સિટી': { gu: 'સ્માર્ટ સિટી', hi: 'स्मार्ट सिटी', en: 'Smart City' },
  'રસ્તા': { gu: 'રસ્તા', hi: 'सड़कें', en: 'Roads' },
  'રાજકોટ': { gu: 'રાજકોટ', hi: 'राजकोट', en: 'Rajkot' },
  'એરપોર્ટ': { gu: 'એરપોર્ટ', hi: 'एयरपोर्ट', en: 'Airport' },
  'ટર્મિનલ': { gu: 'ટર્મિનલ', hi: 'टर्मिनल', en: 'Terminal' },
  'ફ્લાઇટ': { gu: 'ફ્લાઇટ', hi: 'फ्लाइट', en: 'Flight' },
  'GIFT સિટી': { gu: 'GIFT સિટી', hi: 'GIFT सिटी', en: 'GIFT City' },
  'ફિનટેક': { gu: 'ફિનટેક', hi: 'फिनटेक', en: 'Fintech' },
  'રોકાણ': { gu: 'રોકાણ', hi: 'निवेश', en: 'Investment' },
  'નોકરી': { gu: 'નોકરી', hi: 'नौकरी', en: 'Jobs' },
  'વિધાનસભા': { gu: 'વિધાનસભા', hi: 'विधानसभा', en: 'Assembly' },
  'ચોમાસુ સત્ર': { gu: 'ચોમાસુ સત્ર', hi: 'मानसून सत्र', en: 'Monsoon Session' },
  'રાજકારણ': { gu: 'રાજકારણ', hi: 'राजनीति', en: 'Politics' },
  'બિલ': { gu: 'બિલ', hi: 'विधेयक', en: 'Bill' },
  'ઉદ્યોગ': { gu: 'ઉદ્યોગ', hi: 'उद्योग', en: 'Industry' },
  'રોજગાર': { gu: 'રોજગાર', hi: 'रोजगार', en: 'Employment' },
  'ભાવનગર': { gu: 'ભાવનગર', hi: 'भावनगर', en: 'Bhavnagar' },
  'પ્રવાસન': { gu: 'પ્રવાસન', hi: 'पर्यटन', en: 'Tourism' },
  'જૂનાગઢ': { gu: 'જૂનાગઢ', hi: 'जूनागढ़', en: 'Junagadh' },
  'ગિરનાર': { gu: 'ગિરનાર', hi: 'गिरनार', en: 'Girnar' },
  'સુરક્ષા': { gu: 'સુરક્ષા', hi: 'सुरक्षा', en: 'Security' },
  'ડેરી': { gu: 'ડેરી', hi: 'डेयरी', en: 'Dairy' },
  'ખેડૂત': { gu: 'ખેડૂત', hi: 'किसान', en: 'Farmer' },
  'આણંદ': { gu: 'આણંદ', hi: 'आनंद', en: 'Anand' },
  'ચૂંટણી 2026': { gu: 'ચૂંટણી 2026', hi: 'चुनाव 2026', en: 'Election 2026' },
  'ચૂંટણી 2027': { gu: 'ચૂંટણી 2027', hi: 'चुनाव 2027', en: 'Election 2027' },
  'વરસાદ': { gu: 'વરસાદ', hi: 'बारिश', en: 'Rainfall' },
  'સોના-ચાંદી': { gu: 'સોના-ચાંદી', hi: 'सोना-चांदी', en: 'Gold-Silver' },
  'ક્રિકેટ': { gu: 'ક્રિકેટ', hi: 'क्रिकेट', en: 'Cricket' },
  'સેમિકન્ડક્ટર': { gu: 'સેમિકન્ડક્ટર', hi: 'सेमीकंडक्टर', en: 'Semiconductor' },
  'ડાયમંડ ઉદ્યોગ': { gu: 'ડાયમંડ ઉદ્યોગ', hi: 'डायमंड उद्योग', en: 'Diamond Industry' }
};

const getLocalizedTag = (tag: string, language: Language) => {
  if (TAG_NAME_MAP[tag]) {
    return getLocalized(language, TAG_NAME_MAP[tag]);
  }
  return tag;
};

/* --- City Hyperlocal Section ("ગુજરાત" Zone) ----------------------------- */
function CityHyperlocalSection({
  language,
  articles = [],
  dynamicTrendingTopics = [],
}: {
  language: Language;
  articles?: Article[];
  dynamicTrendingTopics?: string[];
}) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('અમદાવાદ');

  // Handle tab change — reset slide index
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSlideIdx(0);
  };


  type SlideItem = {
    id: string; slug: string; image: string;
    titleGu: string; title: string; titleHi: string;
    relativeTimeGu: string; relativeTime: string; relativeTimeHi: string;
    categoryGu: string; category: string; categoryHi: string;
    viewsGu: string; views: string;
    excerptGu: string; excerpt: string; excerptHi: string;
    tags: string[];
  };
  type ListItem = {
    id: string; slug: string; image: string;
    titleGu: string; title: string; titleHi: string;
    relativeTimeGu: string; relativeTime: string; relativeTimeHi: string;
    categoryGu: string; category: string; categoryHi: string;
    viewsGu: string; views: string;
  };

  const cityData: Record<string, { slides: SlideItem[]; list: ListItem[] }> = {
    'અમદાવાદ': {
      slides: [
        {
          id: 'ahm-c1', slug: 'ahmedabad-metro-phase-two-trial-run-346', image: '/assets/demo/3.jpg',
          titleGu: 'અમદાવાદમાં મેટ્રો ટ્રેનના ફેઝ-2નું સફળ ટ્રાયલ રન પૂર્ણ, ટૂંક સમયમાં શરૂ થશે સેવા',
          title: 'Phase-2 trial run of Ahmedabad Metro completed successfully, services soon',
          titleHi: 'अहमदाबाद मेट्रो फेज-2 का सफल ट्रायल रन पूरा, सेवाएं जल्द',
          relativeTimeGu: '30 મિનિટ પહેલાં', relativeTime: '30 mins ago', relativeTimeHi: '30 मिनट पहले',
          categoryGu: 'અમદાવાદ', category: 'Ahmedabad', categoryHi: 'अहमदाबाद',
          viewsGu: '34K', views: '34K',
          excerptGu: 'મેટ્રો ટ્રેનના ફેઝ-2 ટ્રાયલ રનને ગ્રીન સિગ્નલ મળી ગયું છે. ખૂબ જ ટૂંક સમયમાં મુસાફરો આ સેવાનો લાભ લઈ શકશે.',
          excerpt: 'The Phase-2 trial run of the metro train has received a green signal. Passengers will benefit soon.',
          excerptHi: 'मेट्रो ट्रेन के फेज-2 ट्रायल रन को हरी झंडी मिल गई है। यात्री जल्द लाभ उठा सकेंगे।',
          tags: ['મેટ્રો', 'વિકાસ', 'અમદાવાદ', 'ટ્રાફિક']
        },
        {
          id: 'ahm-c2', slug: 'ahmedabad-riverfront-beautification-350', image: '/assets/demo/6.jpg',
          titleGu: 'સાબરમતી રિવરફ્રન્ટ પર નવા બ્યુટીફિકેશન પ્રોજેક્ટનો શુભારંભ',
          title: 'New beautification project launched on Sabarmati Riverfront',
          titleHi: 'साबरमती रिवरफ्रंट पर नए ब्यूटीफिकेशन प्रोजेक्ट की शुरुआत',
          relativeTimeGu: '1 કલાક પહેલાં', relativeTime: '1 hour ago', relativeTimeHi: '1 घंटा पहले',
          categoryGu: 'અમદાવાદ', category: 'Ahmedabad', categoryHi: 'अहमदाबाद',
          viewsGu: '28K', views: '28K',
          excerptGu: 'રિવરફ્રન્ટ પર ગાર્ડન, વોકિંગ ટ્રેક અને ફૂડ ઝોનનું ભવ્ય આયોજન. AMC કમિશનરે જણાવ્યું કે આ પ્રોજેક્ટ 6 મહિનામાં પૂર્ણ થશે.',
          excerpt: 'Grand plans for garden, walking track and food zone on the riverfront. AMC Commissioner said the project will complete in 6 months.',
          excerptHi: 'रिवरफ्रंट पर गार्डन, वॉकिंग ट्रैक और फूड ज़ोन की भव्य योजना।',
          tags: ['સિવિક', 'વિકાસ', 'પર્યટન', 'AMC']
        },
        {
          id: 'ahm-c3', slug: 'ahmedabad-new-traffic-rules-351', image: '/assets/demo/1.jpg',
          titleGu: 'અમદાવાદમાં આજથી નવા ટ્રાફિક નિયમ લાગુ! ભારે દંડની જોગવાઈ',
          title: 'New traffic rules effective from today in Ahmedabad! Heavy penalty provisions',
          titleHi: 'अहमदाबाद में आज से नए ट्रैफिक नियम लागू! भारी जुर्माने का प्रावधान',
          relativeTimeGu: '2 કલાક પહેલાં', relativeTime: '2 hours ago', relativeTimeHi: '2 घंटे पहले',
          categoryGu: 'અમદાવાદ', category: 'Ahmedabad', categoryHi: 'अहमदाबाद',
          viewsGu: '41K', views: '41K',
          excerptGu: 'ટ્રાફિક પોલીસે નવા નિયમોની જાહેરાત કરી. હેલ્મેટ વિના, સીટ બેલ્ટ વિના અને ઝડપી ડ્રાઇવિંગ પર ભારે દંડ.',
          excerpt: 'Traffic police announced new rules. Heavy fines for riding without helmet, seatbelt, and overspeeding.',
          excerptHi: 'ट्रैफिक पुलिस ने नए नियमों की घोषणा की। हेलमेट, सीटबेल्ट और ओवरस्पीडिंग पर भारी जुर्माना।',
          tags: ['ટ્રાફિક', 'પોલીસ', 'દંડ', 'નિયમ']
        }
      ],
      list: [
        {
          id: 'ahm-l1', slug: 'ahmedabad-cyber-crime-helpline-352', image: '/assets/demo/5.jpg',
          titleGu: 'સાયબર ક્રાઇમ સામે મોટી ડ્રાઇવ: અમદાવાદ પોલીસે એડવાઈઝરી જાહેર કરી',
          title: 'Major drive against cyber crime: Ahmedabad police issues advisory',
          titleHi: 'साइबर अपराध के खिलाफ बड़ा अभियान: अहमदाबाद पुलिस ने एडवाइजरी जारी की',
          relativeTimeGu: '3 કલાક પહેલાં', relativeTime: '3 hours ago', relativeTimeHi: '3 घंटे पहले',
          categoryGu: 'અમદાવાદ', category: 'Ahmedabad', categoryHi: 'अहमदाबाद',
          viewsGu: '46K', views: '46K'
        },
        {
          id: 'ahm-l2', slug: 'ahmedabad-water-supply-improvement-353', image: '/assets/demo/4.jpg',
          titleGu: 'અમદાવાદમાં પાણી વિતરણ વ્યવસ્થામાં મોટો સુધારો, નવી પાઈપલાઈન નંખાશે',
          title: 'Major improvement in water distribution system in Ahmedabad, new pipeline to be laid',
          titleHi: 'अहमदाबाद में पानी वितरण व्यवस्था में बड़ा सुधार, नई पाइपलाइन बिछेगी',
          relativeTimeGu: '4 કલાક પહેલાં', relativeTime: '4 hours ago', relativeTimeHi: '4 घंटे पहले',
          categoryGu: 'અમદાવાદ', category: 'Ahmedabad', categoryHi: 'अहमदाबाद',
          viewsGu: '32K', views: '32K'
        },
        {
          id: 'ahm-l3', slug: 'ahmedabad-heritage-walk-record-354', image: '/assets/demo/2.jpg',
          titleGu: 'અમદાવાદ હેરિટેજ વોકમાં રેકોર્ડ ભાગીદારી, પ્રવાસીઓનો જબરદસ્ત ઉત્સાહ',
          title: 'Record participation in Ahmedabad Heritage Walk, tremendous enthusiasm among tourists',
          titleHi: 'अहमदाबाद हेरिटेज वॉक में रिकॉर्ड भागीदारी, पर्यटकों में जबरदस्त उत्साह',
          relativeTimeGu: '5 કલાક પહેલાં', relativeTime: '5 hours ago', relativeTimeHi: '5 घंटे पहले',
          categoryGu: 'અમદાવાદ', category: 'Ahmedabad', categoryHi: 'अहमदाबाद',
          viewsGu: '25K', views: '25K'
        },
        {
          id: 'ahm-l4', slug: 'ahmedabad-smart-city-cctv-355', image: '/assets/demo/8.jpg',
          titleGu: 'સ્માર્ટ સિટી હેઠળ 500 નવા CCTV કેમેરા લાગશે, સુરક્ષા વધશે',
          title: '500 new CCTV cameras under Smart City, security to increase',
          titleHi: 'स्मार्ट सिटी के तहत 500 नए CCTV कैमरे लगेंगे, सुरक्षा बढ़ेगी',
          relativeTimeGu: '6 કલાક પહેલાં', relativeTime: '6 hours ago', relativeTimeHi: '6 घंटे पहले',
          categoryGu: 'અમદાવાદ', category: 'Ahmedabad', categoryHi: 'अहमदाबाद',
          viewsGu: '19K', views: '19K'
        },
        {
          id: 'ahm-l5', slug: 'ahmedabad-metro-routes-expanded-356', image: '/assets/demo/3.jpg',
          titleGu: 'અમદાવાદમાં ટ્રાફિક સમસ્યા નિવારવા નવા ફ્લાયઓવર પ્રોજેક્ટની જાહેરાત',
          title: 'New flyover projects announced to resolve traffic issues in Ahmedabad',
          titleHi: 'अहमदाबाद में ट्रैफिक समस्या से निपटने के लिए नए फ्लाईओवर प्रोजेक्ट्स की घोषणा',
          relativeTimeGu: '8 કલાક પહેલાં', relativeTime: '8 hours ago', relativeTimeHi: '8 घंटे पहले',
          categoryGu: 'ટ્રાફિક', category: 'Traffic', categoryHi: 'ट्रैफिक',
          viewsGu: '15K', views: '15K'
        }
      ]
    },
    'સુરત': {
      slides: [
        {
          id: 'sur-c1', slug: 'surat-diamond-trading-hall-inauguration-345', image: '/assets/demo/1.jpg',
          titleGu: 'સુરતમાં ડાયમંડ બુર્સમાં નવા ટ્રેડિંગ સેન્ટરનું ઉદ્ઘાટન, વેપારીઓ ખુશખુશાલ',
          title: 'Inauguration of new trading center in Surat Diamond Bourse, merchants happy',
          titleHi: 'सूरत डायमंड बुर्स में नए ट्रेडिंग सेंटर का उद्घाटन, व्यापारी खुश',
          relativeTimeGu: '1 કલાક પહેલાં', relativeTime: '1 hour ago', relativeTimeHi: '1 घंटा पहले',
          categoryGu: 'સુરત', category: 'Surat', categoryHi: 'सूरत',
          viewsGu: '56K', views: '56K',
          excerptGu: 'સુરત ડાયમંડ બુર્સ વૈશ્વિક સ્તરે વેપાર માટે સજ્જ થઈ ગયું છે. આ નવા સેન્ટરથી વેપારમાં સરળતા રહેશે.',
          excerpt: 'Surat Diamond Bourse is now ready for global trade. This new center will make trading easier.',
          excerptHi: 'सूरत डायमंड बुर्स वैश्विक व्यापार के लिए तैयार है। इस नए केंद्र से व्यापार आसान होगा।',
          tags: ['ડાયમંડ', 'બિઝનેસ', 'સુરત', 'વેપાર']
        },
        {
          id: 'sur-c2', slug: 'surat-textile-market-boom-360', image: '/assets/demo/7.jpg',
          titleGu: 'સુરત ટેક્સટાઇલ માર્કેટમાં જોરદાર તેજી, વેપારીઓમાં ખુશીની લહેર',
          title: 'Strong boom in Surat textile market, wave of joy among traders',
          titleHi: 'सूरत कपड़ा बाजार में जोरदार तेजी, व्यापारियों में खुशी की लहर',
          relativeTimeGu: '2 કલાક પહેલાં', relativeTime: '2 hours ago', relativeTimeHi: '2 घंटे पहले',
          categoryGu: 'સુરત', category: 'Surat', categoryHi: 'सूरत',
          viewsGu: '43K', views: '43K',
          excerptGu: 'ચોમાસા પહેલાં ટેક્સટાઇલ માર્કેટમાં ભારે ડિમાન્ડ. નવા ઓર્ડરોથી વેપારીઓ ખુશ. નિકાસમાં પણ વધારો.',
          excerpt: 'Heavy demand in textile market before monsoon. Traders happy with new orders. Exports also increase.',
          excerptHi: 'मानसून से पहले कपड़ा बाजार में भारी मांग। नए ऑर्डरों से व्यापारी खुश।',
          tags: ['ટેક્સટાઇલ', 'બિઝનેસ', 'નિકાસ', 'સુરત']
        },
        {
          id: 'sur-c3', slug: 'surat-flood-preparedness-361', image: '/assets/demo/4.jpg',
          titleGu: 'સુરત મહાનગરપાલિકાએ ચોમાસા માટે તૈયારીઓ વધારી, ડ્રેનેજ સિસ્ટમ અપગ્રેડ',
          title: 'Surat Municipal Corporation increases monsoon preparedness, drainage system upgraded',
          titleHi: 'सूरत नगर निगम ने मानसून की तैयारियां बढ़ाई, ड्रेनेज सिस्टम अपग्रेड',
          relativeTimeGu: '3 કલાક પહેલાં', relativeTime: '3 hours ago', relativeTimeHi: '3 घंटे पहले',
          categoryGu: 'સુરત', category: 'Surat', categoryHi: 'सूरत',
          viewsGu: '31K', views: '31K',
          excerptGu: 'ચોમાસા પહેલાં SMC દ્વારા ડ્રેનેજ સફાઈ અને પમ્પિંગ સ્ટેશનોનું સમારકામ. પૂરની સ્થિતિ ટાળવા તૈયારીઓ.',
          excerpt: 'SMC undertakes drainage cleaning and pumping station repairs before monsoon. Preparations to avoid flood situations.',
          excerptHi: 'मानसून से पहले SMC ने ड्रेनेज सफाई और पंपिंग स्टेशनों की मरम्मत की।',
          tags: ['ચોમાસું', 'સિવિક', 'ડ્રેનેજ', 'SMC']
        }
      ],
      list: [
        {
          id: 'sur-l1', slug: 'surat-brts-expansion-362', image: '/assets/demo/2.jpg',
          titleGu: 'સુરત BRTS રૂટમાં વિસ્તરણ, નવા 3 રૂટ ઉમેરાશે',
          title: 'Surat BRTS route expansion, 3 new routes to be added',
          titleHi: 'सूरत BRTS रूट विस्तार, 3 नए रूट जोड़े जाएंगे',
          relativeTimeGu: '3 કલાક પહેલાં', relativeTime: '3 hours ago', relativeTimeHi: '3 घंटे पहले',
          categoryGu: 'સુરત', category: 'Surat', categoryHi: 'सूरत',
          viewsGu: '28K', views: '28K'
        },
        {
          id: 'sur-l2', slug: 'surat-it-hub-growth-363', image: '/assets/demo/5.jpg',
          titleGu: 'સુરતનું IT હબ ઝડપથી વિકસી રહ્યું છે, નવી કંપનીઓ આવી રહી છે',
          title: 'Surat IT hub growing rapidly, new companies arriving',
          titleHi: 'सूरत का IT हब तेजी से बढ़ रहा है, नई कंपनियां आ रही हैं',
          relativeTimeGu: '4 કલાક પહેલાં', relativeTime: '4 hours ago', relativeTimeHi: '4 घंटे पहले',
          categoryGu: 'સુરત', category: 'Surat', categoryHi: 'सूरत',
          viewsGu: '35K', views: '35K'
        },
        {
          id: 'sur-l3', slug: 'surat-river-cleaning-364', image: '/assets/demo/8.jpg',
          titleGu: 'તાપી નદી સફાઈ અભિયાનમાં હજારો જોડાયા, ઐતિહાસિક ભાગીદારી',
          title: 'Thousands join Tapi river cleaning drive, historic participation',
          titleHi: 'तापी नदी सफाई अभियान में हजारों शामिल, ऐतिहासिक भागीदारी',
          relativeTimeGu: '5 કલાક પહેલાં', relativeTime: '5 hours ago', relativeTimeHi: '5 घंटे पहले',
          categoryGu: 'સુરત', category: 'Surat', categoryHi: 'सूरत',
          viewsGu: '42K', views: '42K'
        },
        {
          id: 'sur-l4', slug: 'surat-education-hub-365', image: '/assets/demo/3.jpg',
          titleGu: 'સુરતમાં નવી મેડિકલ કોલેજ મંજૂર, વિદ્યાર્થીઓમાં ઉત્સાહ',
          title: 'New medical college approved in Surat, enthusiasm among students',
          titleHi: 'सूरत में नया मेडिकल कॉलेज मंजूर, छात्रों में उत्साह',
          relativeTimeGu: '7 કલાક પહેલાં', relativeTime: '7 hours ago', relativeTimeHi: '7 घंटे पहले',
          categoryGu: 'સુરત', category: 'Surat', categoryHi: 'सूरत',
          viewsGu: '21K', views: '21K'
        },
        {
          id: 'sur-l5', slug: 'surat-cleanliness-drive-366', image: '/assets/demo/2.jpg',
          titleGu: 'સુરત મહાનગરપાલિકા દ્વારા સ્વચ્છતા અભિયાન અંતર્ગત કડક કાર્યવાહી',
          title: 'Strict action by Surat Municipality under cleanliness drive',
          titleHi: 'सूरत नगर निगम द्वारा स्वच्छता अभियान के तहत सख्त कार्रवाई',
          relativeTimeGu: '9 કલાક પહેલાં', relativeTime: '9 hours ago', relativeTimeHi: '9 घंटे पहले',
          categoryGu: 'સિવિક', category: 'Civic', categoryHi: 'सिविक',
          viewsGu: '22K', views: '22K'
        }
      ]
    },
    'વડોદરા': {
      slides: [
        {
          id: 'vad-c1', slug: 'vadodara-municipality-budget-presented-370', image: '/assets/demo/4.jpg',
          titleGu: 'વડોદરા મ્યુનિ.નું નવું બજેટ રજૂ! પાણી અને રસ્તા પર સૌથી વધુ ભાર',
          title: 'Vadodara Municipal new budget presented! Highest emphasis on water and roads',
          titleHi: 'वडोदरा नगर निगम का नया बजट पेश! पानी और सड़कों पर सबसे ज्यादा जोर',
          relativeTimeGu: '1 કલાક પહેલાં', relativeTime: '1 hour ago', relativeTimeHi: '1 घंटा पहले',
          categoryGu: 'વડોદરા', category: 'Vadodara', categoryHi: 'वडोदरा',
          viewsGu: '61K', views: '61K',
          excerptGu: 'VMC દ્વારા ₹5,000 કરોડનું બજેટ રજૂ. પીવાના પાણી, રસ્તા અને ડ્રેનેજ પર સૌથી વધુ ફાળવણી.',
          excerpt: 'VMC presents Rs 5,000 crore budget. Maximum allocation for drinking water, roads and drainage.',
          excerptHi: 'VMC ने ₹5,000 करोड़ का बजट पेश किया। पीने के पानी, सड़कों और ड्रेनेज पर सबसे ज्यादा आवंटन।',
          tags: ['બજેટ', 'VMC', 'વિકાસ', 'પાણી']
        },
        {
          id: 'vad-c2', slug: 'vadodara-msu-research-breakthrough-371', image: '/assets/demo/2.jpg',
          titleGu: 'MSU ના વૈજ્ઞાનિકોની મોટી શોધ! કેન્સર સારવારમાં નવી આશા',
          title: 'Major discovery by MSU scientists! New hope in cancer treatment',
          titleHi: 'MSU वैज्ञानिकों की बड़ी खोज! कैंसर इलाज में नई उम्मीद',
          relativeTimeGu: '2 કલાક પહેલાં', relativeTime: '2 hours ago', relativeTimeHi: '2 घंटे पहले',
          categoryGu: 'વડોદરા', category: 'Vadodara', categoryHi: 'वडोदरा',
          viewsGu: '48K', views: '48K',
          excerptGu: 'MSU ના બાયોકેમિસ્ટ્રી વિભાગે એક નવી પદ્ધતિ વિકસાવી જે કેન્સરના સમયસર નિદાનમાં મદદ કરશે.',
          excerpt: 'MSU Biochemistry department developed a new method to help in early diagnosis of cancer.',
          excerptHi: 'MSU बायोकेमिस्ट्री विभाग ने एक नई विधि विकसित की जो कैंसर के समय पर निदान में मदद करेगी।',
          tags: ['MSU', 'સંશોધન', 'આરોગ્ય', 'વિજ્ઞાન']
        }
      ],
      list: [
        {
          id: 'vad-l1', slug: 'vadodara-flyover-inauguration-372', image: '/assets/demo/6.jpg',
          titleGu: 'વડોદરામાં નવા ફ્લાયઓવરનું ઉદ્ઘાટન, ટ્રાફિક સમસ્યા હળવી થશે',
          title: 'New flyover inaugurated in Vadodara, traffic problems to ease',
          titleHi: 'वडोदरा में नए फ्लाईओवर का उद्घाटन, ट्रैफिक समस्या कम होगी',
          relativeTimeGu: '3 કલાક પહેલાં', relativeTime: '3 hours ago', relativeTimeHi: '3 घंटे पहले',
          categoryGu: 'વડોદરા', category: 'Vadodara', categoryHi: 'वडोदरा',
          viewsGu: '39K', views: '39K'
        },
        {
          id: 'vad-l2', slug: 'vadodara-navratri-preparation-373', image: '/assets/demo/1.jpg',
          titleGu: 'વડોદરામાં નવરાત્રિની ભવ્ય તૈયારી શરૂ, આયોજકોમાં ઉત્સાહ',
          title: 'Grand Navratri preparations begin in Vadodara, enthusiasm among organizers',
          titleHi: 'वडोदरा में नवरात्रि की भव्य तैयारी शुरू, आयोजकों में उत्साह',
          relativeTimeGu: '5 કલાક પહેલાં', relativeTime: '5 hours ago', relativeTimeHi: '5 घंटे पहले',
          categoryGu: 'વડોદરા', category: 'Vadodara', categoryHi: 'वडोदरा',
          viewsGu: '55K', views: '55K'
        },
        {
          id: 'vad-l3', slug: 'vadodara-school-digital-initiative-374', image: '/assets/demo/7.jpg',
          titleGu: 'વડોદરાની શાળાઓમાં ડિજિટલ ક્રાંતિ, 100 શાળાઓમાં સ્માર્ટ ક્લાસ',
          title: 'Digital revolution in Vadodara schools, smart classes in 100 schools',
          titleHi: 'वडोदरा के स्कूलों में डिजिटल क्रांति, 100 स्कूलों में स्मार्ट क्लास',
          relativeTimeGu: '6 કલાક પહેલાં', relativeTime: '6 hours ago', relativeTimeHi: '6 घंटे पहले',
          categoryGu: 'વડોદરા', category: 'Vadodara', categoryHi: 'वडोदरा',
          viewsGu: '27K', views: '27K'
        },
        {
          id: 'vad-l4', slug: 'vadodara-lakshmi-vilas-palace-restoration-375', image: '/assets/demo/3.jpg',
          titleGu: 'લક્ષ્મી વિલાસ પેલેસનું રિસ્ટોરેશન પૂર્ણ, પ્રવાસીઓ માટે ખુલ્લું',
          title: 'Laxmi Vilas Palace restoration complete, open for tourists',
          titleHi: 'लक्ष्मी विलास पैलेस का रिस्टोरेशन पूरा, पर्यटकों के लिए खुला',
          relativeTimeGu: '8 કલાક પહેલાં', relativeTime: '8 hours ago', relativeTimeHi: '8 घंटे पहले',
          categoryGu: 'વડોદરા', category: 'Vadodara', categoryHi: 'वडोदरा',
          viewsGu: '44K', views: '44K'
        },
        {
          id: 'vad-l5', slug: 'vadodara-sports-complex-376', image: '/assets/demo/6.jpg',
          titleGu: 'વડોદરા સ્પોર્ટ્સ કોમ્પ્લેક્સનું કામ અંતિમ તબક્કામાં, ખેલાડીઓ ખુશ',
          title: 'Vadodara sports complex work in final stage, players happy',
          titleHi: 'वडोदरा स्पोर्ट्स कॉम्प्लेक्स का काम अंतिम चरण में, खिलाड़ी खुश',
          relativeTimeGu: '10 કલાક પહેલાં', relativeTime: '10 hours ago', relativeTimeHi: '10 घंटे पहले',
          categoryGu: 'રમતગમત', category: 'Sports', categoryHi: 'खेल',
          viewsGu: '18K', views: '18K'
        }
      ]
    },
    'રાજકોટ': {
      slides: [
        {
          id: 'raj-c1', slug: 'rajkot-smart-city-roadworks-underway-344', image: '/assets/demo/6.jpg',
          titleGu: 'રાજકોટમાં મોટું કામ! સ્માર્ટ સિટી પ્રોજેક્ટ હેઠળ રસ્તાઓનું ધમધમાટ કામ શરૂ',
          title: 'Major work in Rajkot! Roadworks start in full swing under Smart City project',
          titleHi: 'राजकोट में बड़ा काम! स्मार्ट सिटी प्रोजेक्ट के तहत सड़कों का काम शुरू',
          relativeTimeGu: '1 કલાક પહેલાં', relativeTime: '1 hour ago', relativeTimeHi: '1 घंटा पहले',
          categoryGu: 'રાજકોટ', category: 'Rajkot', categoryHi: 'राजकोट',
          viewsGu: '12K', views: '12K',
          excerptGu: 'શહેરના મુખ્ય વિસ્તારોમાં રસ્તા પહોળા કરવા અને નવી ડ્રેનેજ લાઈન નાખવાનું કામ યુદ્ધના ધોરણે શરૂ કરાયું છે.',
          excerpt: 'Road widening and new drainage line installation have started on a war footing in the main areas of the city.',
          excerptHi: 'शहर के मुख्य क्षेत्रों में सड़कों को चौड़ा करने और ड्रेनेज लाइन बिछाने का काम शुरू।',
          tags: ['સ્માર્ટ સિટી', 'રસ્તા', 'વિકાસ', 'રાજકોટ']
        },
        {
          id: 'raj-c2', slug: 'rajkot-airport-new-terminal-380', image: '/assets/demo/2.jpg',
          titleGu: 'રાજકોટ એરપોર્ટ પર નવા ટર્મિનલનું ટ્રાયલ રન સફળ, ટૂંક સમયમાં ફ્લાઇટ્સ શરૂ',
          title: 'Trial run of new terminal at Rajkot airport successful, flights to start soon',
          titleHi: 'राजकोट हवाई अड्डे पर नए टर्मिनल का ट्रायल रन सफल, उड़ानें जल्द शुरू',
          relativeTimeGu: '2 કલાક પહેલાં', relativeTime: '2 hours ago', relativeTimeHi: '2 घंटे पहले',
          categoryGu: 'રાજકોટ', category: 'Rajkot', categoryHi: 'राजकोट',
          viewsGu: '51K', views: '51K',
          excerptGu: 'રાજકોટ ગ્રીનફિલ્ડ એરપોર્ટ પર નવા ટર્મિનલનું ટ્રાયલ રન સફળતાપૂર્વક પૂર્ણ. દિલ્હી-મુંબઈ ફ્લાઇટ ટૂંક સમયમાં.',
          excerpt: 'Trial run of new terminal at Rajkot Greenfield Airport successfully completed. Delhi-Mumbai flights soon.',
          excerptHi: 'राजकोट ग्रीनफील्ड एयरपोर्ट के नए टर्मिनल का ट्रायल रन सफल। दिल्ली-मुंबई फ्लाइट जल्द।',
          tags: ['એરપોર્ટ', 'ટર્મિનલ', 'ફ્લાઇટ', 'રાજકોટ']
        }
      ],
      list: [
        {
          id: 'raj-l1', slug: 'rajkot-race-course-renovation-381', image: '/assets/demo/5.jpg',
          titleGu: 'રેસ કોર્સ રિંગ રોડનું નવીનીકરણ પૂર્ણ, સાંજે હજારો ફરવા આવે છે',
          title: 'Race Course Ring Road renovation complete, thousands visit in evening',
          titleHi: 'रेस कोर्स रिंग रोड का नवीनीकरण पूरा, शाम को हजारों आते हैं',
          relativeTimeGu: '3 કલાક પહેલાં', relativeTime: '3 hours ago', relativeTimeHi: '3 घंटे पहले',
          categoryGu: 'રાજકોટ', category: 'Rajkot', categoryHi: 'राजकोट',
          viewsGu: '38K', views: '38K'
        },
        {
          id: 'raj-l2', slug: 'rajkot-cricket-stadium-events-382', image: '/assets/demo/8.jpg',
          titleGu: 'રાજકોટ ક્રિકેટ સ્ટેડિયમમાં આંતરરાષ્ટ્રીય મેચની જાહેરાત, ચાહકોમાં ઉત્સાહ',
          title: 'International match announced at Rajkot Cricket Stadium, excitement among fans',
          titleHi: 'राजकोट क्रिकेट स्टेडियम में अंतरराष्ट्रीय मैच की घोषणा, प्रशंसकों में उत्साह',
          relativeTimeGu: '4 કલાક પહેલાં', relativeTime: '4 hours ago', relativeTimeHi: '4 घंटे पहले',
          categoryGu: 'રાજકોટ', category: 'Rajkot', categoryHi: 'राजकोट',
          viewsGu: '62K', views: '62K'
        },
        {
          id: 'raj-l3', slug: 'rajkot-industrial-zone-expansion-383', image: '/assets/demo/4.jpg',
          titleGu: 'રાજકોટ ઔદ્યોગિક ઝોનમાં વિસ્તરણ, 200+ નવા એકમો આવશે',
          title: 'Rajkot industrial zone expansion, 200+ new units to come',
          titleHi: 'राजकोट औद्योगिक ज़ोन में विस्तार, 200+ नई इकाइयां आएंगी',
          relativeTimeGu: '5 કલાક પહેલાં', relativeTime: '5 hours ago', relativeTimeHi: '5 घंटे पहले',
          categoryGu: 'રાજકોટ', category: 'Rajkot', categoryHi: 'राजकोट',
          viewsGu: '45K', views: '45K'
        },
        {
          id: 'raj-l4', slug: 'rajkot-new-hospital-384', image: '/assets/demo/1.jpg',
          titleGu: 'રાજકોટમાં 500 બેડની નવી સરકારી હૉસ્પિટલ મંજૂર',
          title: 'New 500-bed government hospital approved in Rajkot',
          titleHi: 'राजकोट में 500 बेड का नया सरकारी अस्पताल मंजूर',
          relativeTimeGu: '7 કલાક પહેલાં', relativeTime: '7 hours ago', relativeTimeHi: '7 घंटे पहले',
          categoryGu: 'રાજકોટ', category: 'Rajkot', categoryHi: 'राजकोट',
          viewsGu: '33K', views: '33K'
        },
        {
          id: 'raj-l5', slug: 'rajkot-water-supply-project-385', image: '/assets/demo/3.jpg',
          titleGu: 'રાજકોટના સરહદી વિસ્તારો માટે નવી નર્મદા પાઈપલાઈન યોજના મંજૂર',
          title: 'New Narmada pipeline project approved for Rajkot border areas',
          titleHi: 'राजकोट के सीमावर्ती क्षेत्रों के लिए नई नर्मदा पाइपलाइन योजना मंजूर',
          relativeTimeGu: '11 કલાક પહેલાં', relativeTime: '11 hours ago', relativeTimeHi: '11 घंटे पहले',
          categoryGu: 'વિકાસ', category: 'Development', categoryHi: 'विकास',
          viewsGu: '25K', views: '25K'
        }
      ]
    },
    'ગાંધીનગર': {
      slides: [
        {
          id: 'gn-c1', slug: 'gandhinagar-gift-city-fintech-390', image: '/assets/demo/5.jpg',
          titleGu: 'GIFT સિટીમાં ફિનટેક કંપનીઓનું મોટું રોકાણ, 10,000 નોકરીઓ સર્જાશે',
          title: 'Major investment by fintech companies in GIFT City, 10,000 jobs to be created',
          titleHi: 'GIFT सिटी में फिनटेक कंपनियों का बड़ा निवेश, 10,000 नौकरियां पैदा होंगी',
          relativeTimeGu: '1 કલાક પહેલાં', relativeTime: '1 hour ago', relativeTimeHi: '1 घंटा पहले',
          categoryGu: 'ગાંધીનગર', category: 'Gandhinagar', categoryHi: 'गांधीनगर',
          viewsGu: '78K', views: '78K',
          excerptGu: 'GIFT સિટીમાં 15 નવી ફિનટેક અને ઇન્શ્યોરન્સ કંપનીઓ આવી. ગુજરાત સરકારે વિશેષ પેકેજ જાહેર કર્યું.',
          excerpt: '15 new fintech and insurance companies came to GIFT City. Gujarat government announces special package.',
          excerptHi: 'GIFT सिटी में 15 नई फिनटेक और बीमा कंपनियां आईं। गुजरात सरकार ने विशेष पैकेज की घोषणा की।',
          tags: ['GIFT સિટી', 'ફિનટેક', 'રોકાણ', 'નોકરી']
        },
        {
          id: 'gn-c2', slug: 'gandhinagar-assembly-session-391', image: '/assets/demo/3.jpg',
          titleGu: 'ગાંધીનગર વિધાનસભામાં ચોમાસુ સત્ર શરૂ, અનેક મહત્વના વિધેયકો રજૂ',
          title: 'Monsoon session begins in Gandhinagar Assembly, several important bills presented',
          titleHi: 'गांधीनगर विधानसभा में मानसून सत्र शुरू, कई महत्वपूर्ण विधेयक पेश',
          relativeTimeGu: '2 કલાક પહેલાં', relativeTime: '2 hours ago', relativeTimeHi: '2 घंटे पहले',
          categoryGu: 'ગાંધીનગર', category: 'Gandhinagar', categoryHi: 'गांधीनगर',
          viewsGu: '55K', views: '55K',
          excerptGu: 'ચોમાસુ સત્રમાં ખેડૂત કલ્યાણ, શિક્ષણ અને આરોગ્ય સંબંધિત વિધેયકો રજૂ. વિપક્ષ દ્વારા મહત્વના પ્રશ્નો ઉઠાવાયા.',
          excerpt: 'Bills related to farmer welfare, education and health presented in monsoon session. Opposition raised important questions.',
          excerptHi: 'मानसून सत्र में किसान कल्याण, शिक्षा और स्वास्थ्य से जुड़े विधेयक पेश। विपक्ष ने महत्वपूर्ण सवाल उठाए।',
          tags: ['વિધાનસભા', 'ચોમાસુ સત્ર', 'રાજકારણ', 'બિલ']
        }
      ],
      list: [
        {
          id: 'gn-l1', slug: 'gandhinagar-new-it-policy-392', image: '/assets/demo/7.jpg',
          titleGu: 'ગુજરાત સરકારે નવી IT પોલિસી જાહેર કરી, સ્ટાર્ટઅપ્સને પ્રોત્સાહન',
          title: 'Gujarat government announces new IT policy, incentives for startups',
          titleHi: 'गुजरात सरकार ने नई IT पॉलिसी जारी की, स्टार्टअप्स को प्रोत्साहन',
          relativeTimeGu: '3 કલાક પહેલાં', relativeTime: '3 hours ago', relativeTimeHi: '3 घंटे पहले',
          categoryGu: 'ગાંધીનગર', category: 'Gandhinagar', categoryHi: 'गांधीनगर',
          viewsGu: '61K', views: '61K'
        },
        {
          id: 'gn-l2', slug: 'gandhinagar-infotech-campus-393', image: '/assets/demo/8.jpg',
          titleGu: 'ઇન્ફોસિટી પર નવું ટેક કેમ્પસ તૈયાર, 5,000 ઇજનેરોને રોજગાર મળશે',
          title: 'New tech campus ready at Infocity, 5,000 engineers to get jobs',
          titleHi: 'इन्फोसिटी पर नया टेक कैंपस तैयार, 5,000 इंजीनियरों को रोजगार',
          relativeTimeGu: '5 કલાક પહેલાં', relativeTime: '5 hours ago', relativeTimeHi: '5 घंटे पहले',
          categoryGu: 'ગાંધીનગર', category: 'Gandhinagar', categoryHi: 'गांधीनगर',
          viewsGu: '49K', views: '49K'
        },
        {
          id: 'gn-l3', slug: 'gandhinagar-cm-review-meeting-394', image: '/assets/demo/4.jpg',
          titleGu: 'CM દ્વારા વિકાસ કામોની સમીક્ષા, 10 પ્રોજેક્ટ ઝડપી કરવા સૂચના',
          title: 'CM reviews development works, instructs to fast-track 10 projects',
          titleHi: 'CM ने विकास कार्यों की समीक्षा की, 10 परियोजनाओं को तेज करने के निर्देश',
          relativeTimeGu: '6 કલાક પહેલાં', relativeTime: '6 hours ago', relativeTimeHi: '6 घंटे पहले',
          categoryGu: 'ગાંધીનગર', category: 'Gandhinagar', categoryHi: 'गांधीनगर',
          viewsGu: '72K', views: '72K'
        },
        {
          id: 'gn-l4', slug: 'gandhinagar-sector-green-initiative-395', image: '/assets/demo/6.jpg',
          titleGu: 'ગાંધીનગરના સેક્ટરોમાં ગ્રીન ઇનિશિએટિવ શરૂ, 10,000 વૃક્ષો વવાશે',
          title: 'Green initiative starts in Gandhinagar sectors, 10,000 trees to be planted',
          titleHi: 'गांधीनगर के सेक्टरों में ग्रीन पहल शुरू, 10,000 पेड़ लगाए जाएंगे',
          relativeTimeGu: '8 કલાક પહેલાં', relativeTime: '8 hours ago', relativeTimeHi: '8 घंटे पहले',
          categoryGu: 'ગાંધીનગર', category: 'Gandhinagar', categoryHi: 'गांधीनगर',
          viewsGu: '37K', views: '37K'
        },
        {
          id: 'gn-l5', slug: 'gandhinagar-solar-roof-395', image: '/assets/demo/1.jpg',
          titleGu: 'ગાંધીનગરમાં સરકારી ઇમારતો પર સોલાર રૂફટોપ સિસ્ટમ સ્થાપિત કરાશે',
          title: 'Solar rooftop systems to be installed on government buildings in Gandhinagar',
          titleHi: 'गांधीनगर में सरकारी इमारतों पर सोलर रूफटॉप सिस्टम लगाए जाएंगे',
          relativeTimeGu: '12 કલાક પહેલાં', relativeTime: '12 hours ago', relativeTimeHi: '12 घंटे पहले',
          categoryGu: 'સૌર ઉર્જા', category: 'Solar', categoryHi: 'सौर ऊर्जा',
          viewsGu: '34K', views: '34K'
        }
      ]
    },
    'અન્ય': {
      slides: [
        {
          id: 'oth-c1', slug: 'bhavnagar-new-industrial-units-approved-347', image: '/assets/demo/5.jpg',
          titleGu: 'ભાવનગરને મળી મોટી ભેટ! નવા ઔદ્યોગિક એકમને મંજૂરી, રોજગારી વધશે',
          title: 'Bhavnagar gets big gift! New industrial unit approved, jobs to rise',
          titleHi: 'भावनगर को मिला बड़ा तोहफा! नए औद्योगिक इकाई को मंजूरी',
          relativeTimeGu: '1 કલાક પહેલાં', relativeTime: '1 hour ago', relativeTimeHi: '1 घंटा पहले',
          categoryGu: 'ભાવનગર', category: 'Bhavnagar', categoryHi: 'भावनगर',
          viewsGu: '46K', views: '46K',
          excerptGu: 'ભાવનગરમાં નવા ઔદ્યોગિક એકમની સ્થાપના માટે રાજ્ય સરકારે મંજૂરી આપી. આ એકમથી 3,000+ નવી નોકરીઓ સર્જાશે.',
          excerpt: 'State government approves new industrial unit in Bhavnagar. 3,000+ new jobs to be created.',
          excerptHi: 'भावनगर में नई औद्योगिक इकाई के लिए राज्य सरकार ने मंजूरी दी। 3,000+ नई नौकरियां।',
          tags: ['ઉદ્યોગ', 'રોજગાર', 'ભાવનગર', 'વિકાસ']
        },
        {
          id: 'oth-c2', slug: 'girnar-ropeway-tourist-rush-increases-tremendously-205', image: '/assets/demo/3.jpg',
          titleGu: 'ગિરનાર રોપ-વે પર ઉમટ્યા પ્રવાસીઓ! સંખ્યામાં જોરદાર વધારો, સુરક્ષા ચિંતા',
          title: 'Tourists flock to Girnar Ropeway! Tremendous increase in numbers',
          titleHi: 'गिरनार रोपवे पर उमड़े पर्यटक! संख्या में भारी बढ़ोतरी',
          relativeTimeGu: '2 કલાક પહેલાં', relativeTime: '2 hours ago', relativeTimeHi: '2 घंटे पहले',
          categoryGu: 'જૂનાગઢ', category: 'Junagadh', categoryHi: 'जूनागढ़',
          viewsGu: '52K', views: '52K',
          excerptGu: 'ગિરનાર રોપ-વે પર પ્રવાસીઓની સંખ્યામાં રેકોર્ડબ્રેક વધારો. સુરક્ષા વ્યવસ્થા વધારવા માંગ.',
          excerpt: 'Record-breaking increase in tourists at Girnar Ropeway. Demand to enhance safety arrangements.',
          excerptHi: 'गिरनार रोपवे पर पर्यटकों की संख्या में रिकॉर्डतोड़ बढ़ोतरी।',
          tags: ['પ્રવાસન', 'જૂનાગઢ', 'ગિરનાર', 'સુરક્ષા']
        },
        {
          id: 'oth-c3', slug: 'anand-dairy-expansion-project-inauguration-349', image: '/assets/demo/1.jpg',
          titleGu: 'આણંદ ડેરી સંઘનું નવું પ્લાન્ટ વિસ્તરણ! ખેડૂતોને સીધો ફાયદો થશે',
          title: 'Anand Dairy Union new plant expansion! Farmers to benefit directly',
          titleHi: 'आनंद डेयरी संघ का नया प्लांट विस्तार! किसानों को होगा सीधा फायदा',
          relativeTimeGu: '3 કલાક પહેલાં', relativeTime: '3 hours ago', relativeTimeHi: '3 घंटे पहले',
          categoryGu: 'આણંદ', category: 'Anand', categoryHi: 'आनंद',
          viewsGu: '71K', views: '71K',
          excerptGu: 'આણંદ ડેરી સંઘ દ્વારા ₹200 કરોડના ખર્ચે નવું પ્લાન્ટ. દૂધ ઉત્પાદન ક્ષમતા બમણી થશે.',
          excerpt: 'New plant by Anand Dairy Union at Rs 200 crore cost. Milk production capacity to double.',
          excerptHi: 'आनंद डेयरी संघ ने ₹200 करोड़ की लागत से नया प्लांट। दूध उत्पादन क्षमता दोगुनी होगी।',
          tags: ['ડેરી', 'ખેડૂત', 'આણંદ', 'વિકાસ']
        }
      ],
      list: [
        {
          id: 'oth-l1', slug: 'jamnagar-refinery-expansion-396', image: '/assets/demo/7.jpg',
          titleGu: 'જામનગર રિફાઈનરીમાં વિસ્તરણ, 5,000 નવી નોકરીઓ સર્જાશે',
          title: 'Jamnagar refinery expansion, 5,000 new jobs to be created',
          titleHi: 'जामनगर रिफाइनरी में विस्तार, 5,000 नई नौकरियां पैदा होंगी',
          relativeTimeGu: '4 કલાક પહેલાં', relativeTime: '4 hours ago', relativeTimeHi: '4 घंटे पहले',
          categoryGu: 'જામનગર', category: 'Jamnagar', categoryHi: 'जामनगर',
          viewsGu: '58K', views: '58K'
        },
        {
          id: 'oth-l2', slug: 'kutch-rann-utsav-preparation-397', image: '/assets/demo/2.jpg',
          titleGu: 'કચ્છમાં રણોત્સવની તૈયારી શરૂ, આ વર્ષે નવા આકર્ષણો ઉમેરાશે',
          title: 'Rann Utsav preparations begin in Kutch, new attractions to be added this year',
          titleHi: 'कच्छ में रण उत्सव की तैयारी शुरू, इस साल नए आकर्षण जोड़े जाएंगे',
          relativeTimeGu: '5 કલાક પહેલાં', relativeTime: '5 hours ago', relativeTimeHi: '5 घंटे पहले',
          categoryGu: 'કચ્છ', category: 'Kutch', categoryHi: 'कच्छ',
          viewsGu: '65K', views: '65K'
        },
        {
          id: 'oth-l3', slug: 'mehsana-milk-production-record-398', image: '/assets/demo/4.jpg',
          titleGu: 'મહેસાણા જિલ્લામાં દૂધ ઉત્પાદનમાં રેકોર્ડ, ખેડૂતોની આવક વધી',
          title: 'Record milk production in Mehsana district, farmers income increased',
          titleHi: 'मेहसाणा जिले में दूध उत्पादन में रिकॉर्ड, किसानों की आय बढ़ी',
          relativeTimeGu: '6 કલાક પહેલાં', relativeTime: '6 hours ago', relativeTimeHi: '6 घंटे पहले',
          categoryGu: 'મહેસાણા', category: 'Mehsana', categoryHi: 'मेहसाणा',
          viewsGu: '43K', views: '43K'
        },
        {
          id: 'oth-l4', slug: 'morbi-ceramic-export-boom-399', image: '/assets/demo/8.jpg',
          titleGu: 'મોરબી સિરામિક ઉદ્યોગમાં જોરદાર તેજી, નિકાસમાં 30% વધારો',
          title: 'Strong boom in Morbi ceramic industry, 30% increase in exports',
          titleHi: 'मोरबी सिरेमिक उद्योग में जोरदार तेजी, निर्यात में 30% बढ़ोतरी',
          relativeTimeGu: '8 કલાક પહેલાં', relativeTime: '8 hours ago', relativeTimeHi: '8 घंटे पहले',
          categoryGu: 'મોરબી', category: 'Morbi', categoryHi: 'मोरबी',
          viewsGu: '51K', views: '51K'
        },
        {
          id: 'oth-l5', slug: 'morbi-industry-green-energy-388', image: '/assets/demo/5.jpg',
          titleGu: 'મોરબી સિરામિક ઉદ્યોગમાં હવે ગ્રીન એનર્જીનો ઉપયોગ વધારવા નિર્ણય',
          title: 'Morbi ceramic industry decides to increase use of green energy',
          titleHi: 'मोरबी सिरेमिक उद्योग में अब ग्रीन बनर्जी का उपयोग बढ़ाने का फैसला',
          relativeTimeGu: '9 કલાક પહેલાં', relativeTime: '9 hours ago', relativeTimeHi: '9 घंटे पहले',
          categoryGu: 'મોરબી', category: 'Morbi', categoryHi: 'मोरबी',
          viewsGu: '37K', views: '37K'
        }
      ]
    }
  };

  const getCategoryStr = (art: Article) => {
    if (!art || !art.category) return '';
    if (typeof art.category === 'string') return art.category.toLowerCase();
    if (typeof art.category === 'object') {
      const c = art.category as any;
      return `${c.name || ''} ${c.slug || ''}`.toLowerCase();
    }
    return '';
  };

  // Filter API articles for active tab
  const getArticlesForTab = useCallback((tabGuKey: string) => {
    if (!articles || articles.length === 0) return [];

    const cityEnMap: Record<string, string> = {
      'અમદાવાદ': 'ahmedabad',
      'સુરત': 'surat',
      'વડોદરા': 'vadodara',
      'રાજકોટ': 'rajkot',
      'ગાંધીનગર': 'gandhinagar',
    };

    const targetCity = cityEnMap[tabGuKey];
    if (!targetCity) {
      // 'અન્ય' (Other Cities / Districts / Regions of Gujarat)
      const mainCities = ['ahmedabad', 'surat', 'vadodara', 'rajkot', 'gandhinagar'];
      const nonGujaratCategories = ['world', 'education', 'fact check', 'photo gallery', 'lifestyle', 'business', 'sports', 'entertainment', 'tech', 'videos'];

      return articles.filter((art) => {
        const loc = ((art as any).location || '').toLowerCase();
        const cat = getCategoryStr(art);
        const catGu = ((art as any).categoryGu || '').toLowerCase();
        const slug = (art.slug || '').toLowerCase();
        const title = (art.title || '').toLowerCase();
        const titleGu = ((art as any).titleGu || '').toLowerCase();

        // Exclude articles belonging to the 5 main cities
        const isMainCity = mainCities.some(
          (c) =>
            loc === c ||
            loc.includes(c) ||
            cat.includes(c) ||
            catGu.includes(c) ||
            slug.includes(c) ||
            title.includes(c) ||
            titleGu.includes(c)
        );
        if (isMainCity) return false;

        // Exclude purely non-Gujarat categories unless location is explicitly set to Gujarat or a regional district
        const isNonGujaratCat = nonGujaratCategories.some((nc) => cat === nc || cat.includes(nc));
        if (isNonGujaratCat && !loc.includes('gujarat') && !loc.includes('kutch') && !loc.includes('bhavnagar') && !cat.includes('gujarat') && !cat.includes('state')) return false;

        return true;
      });
    }

    // Match strictly by Location, Category, Slug, or Title
    const matched = articles.filter((art) => {
      const loc = ((art as any).location || '').toLowerCase();
      const cat = getCategoryStr(art);
      const catGu = ((art as any).categoryGu || '').toLowerCase();
      const slug = (art.slug || '').toLowerCase();
      const title = (art.title || '').toLowerCase();
      const titleGu = ((art as any).titleGu || '').toLowerCase();

      return (
        loc === targetCity ||
        loc.includes(targetCity) ||
        cat.includes(targetCity) ||
        catGu.includes(tabGuKey) ||
        slug.includes(targetCity) ||
        title.includes(targetCity) ||
        titleGu.includes(tabGuKey)
      );
    });

    // Sort so articles with explicit Location or Category match come FIRST, ordered by latest date!
    return matched.sort((a, b) => {
      const locA = ((a as any).location || '').toLowerCase();
      const locB = ((b as any).location || '').toLowerCase();
      const catA = getCategoryStr(a);
      const catB = getCategoryStr(b);

      const exactLocA = locA === targetCity || locA.includes(targetCity) || catA.includes(targetCity);
      const exactLocB = locB === targetCity || locB.includes(targetCity) || catB.includes(targetCity);

      if (exactLocA && !exactLocB) return -1;
      if (!exactLocA && exactLocB) return 1;

      const timeA = new Date(a.publishedAt || (a as any).createdAt || 0).getTime();
      const timeB = new Date(b.publishedAt || (b as any).createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [articles]);

  const categoryGuMap: Record<string, string> = {
    'Gujarat': 'ગુજરાત',
    'State': 'ગુજરાત રાજ્ય',
    'Ahmedabad': 'અમદાવાદ',
    'Surat': 'સુરત',
    'Vadodara': 'વડોદરા',
    'Rajkot': 'રાજકોટ',
    'Gandhinagar': 'ગાંધીનગર',
    'Bhavnagar': 'ભાવનગર',
    'Junagadh': 'જૂનાગઢ',
    'Anand': 'આણંદ',
    'Jamnagar': 'જામનગર',
    'Kutch': 'કચ્છ',
    'Mehsana': 'મહેસાણા',
    'Morbi': 'મોરબી',
    'Other': 'અન્ય શહેરો',
    'Other Cities': 'અન્ય શહેરો',
    'Civic': 'સિવિક',
    'Development': 'વિકાસ',
    'Tourism': 'પર્યટન',
    'Traffic': 'ટ્રાફિક',
    'World': 'વિશ્વ',
    'Education': 'શિક્ષણ',
    'Fact Check': 'ફેક્ટ ચેક',
    'Photo Gallery': 'ફોટો ગેલેરી',
    'Lifestyle': 'લાઇફસ્ટાઇલ',
    'Business': 'બિઝનેસ',
    'Sports': 'રમતગમત',
    'Entertainment': 'મનોરંજન',
    'Tech': 'ટેકનોલોજી',
  };

  const getArtCategoryNameGu = (art: Article, tabGuKey: string) => {
    const loc = (art as any).location;
    if (loc && categoryGuMap[loc]) return categoryGuMap[loc];
    if (loc && CITY_NAME_MAP[loc]) return getLocalized('gu', CITY_NAME_MAP[loc]);

    let catName = '';
    if (typeof art.category === 'object' && (art.category as any).name) {
      catName = (art.category as any).name;
    } else if (typeof art.category === 'string') {
      catName = art.category;
    } else if ((art as any).categoryGu) {
      return (art as any).categoryGu;
    }

    if (categoryGuMap[catName]) return categoryGuMap[catName];
    if (CITY_NAME_MAP[catName]) return getLocalized('gu', CITY_NAME_MAP[catName]);
    if (CITY_NAME_MAP[tabGuKey]) return getLocalized('gu', CITY_NAME_MAP[tabGuKey]);

    return (art as any).categoryGu || 'અન્ય શહેરો';
  };

  const getArtCategoryNameEn = (art: Article, tabGuKey: string) => {
    if (typeof art.category === 'object' && (art.category as any).name) {
      return (art.category as any).name;
    }
    if (typeof art.category === 'string') return art.category;
    return CITY_NAME_MAP[tabGuKey]?.en || 'City';
  };


  const tabApiArticles = useMemo(() => getArticlesForTab(activeTab), [getArticlesForTab, activeTab]);

  const realSlides: SlideItem[] = useMemo(() => {
    return tabApiArticles.slice(0, 3).map((art: Article) => ({
      id: art.id,
      slug: art.slug,
      image: art.image || '/assets/demo/1.jpg',
      titleGu: art.titleGu || art.title,
      title: art.title,
      titleHi: art.titleHi || art.title,
      relativeTimeGu: formatTime(art.publishedAt),
      relativeTime: formatTime(art.publishedAt),
      relativeTimeHi: formatTime(art.publishedAt),
      categoryGu: getArtCategoryNameGu(art, activeTab),
      category: getArtCategoryNameEn(art, activeTab),
      categoryHi: (art as any).categoryHi || activeTab,
      viewsGu: `${art.views || 25}K`,
      views: `${art.views || 25}K`,
      excerptGu: art.excerptGu || art.excerpt || art.title,
      excerpt: art.excerpt || art.title,
      excerptHi: art.excerptHi || art.excerpt || art.title,
      tags: (art.tags as any) && (art.tags as any).length > 0 ? (art.tags as any) : [activeTab, 'સમાચાર', 'લાઇવ'],
    }));
  }, [tabApiArticles, activeTab]);

  const realList: ListItem[] = useMemo(() => {
    return tabApiArticles.slice(3, 8).map((art: Article) => ({
      id: art.id,
      slug: art.slug,
      image: art.image || '/assets/demo/2.jpg',
      titleGu: art.titleGu || art.title,
      title: art.title,
      titleHi: art.titleHi || art.title,
      relativeTimeGu: formatTime(art.publishedAt),
      relativeTime: formatTime(art.publishedAt),
      relativeTimeHi: formatTime(art.publishedAt),
      categoryGu: getArtCategoryNameGu(art, activeTab),
      category: getArtCategoryNameEn(art, activeTab),
      categoryHi: (art as any).categoryHi || activeTab,
      viewsGu: `${art.views || 20}K`,
      views: `${art.views || 20}K`,
    }));
  }, [tabApiArticles, activeTab]);



  const activeCityData = cityData[activeTab] || cityData['અમદાવાદ'];

  const mockSlides = useMemo(() => {
    if (realSlides.length >= 3) return realSlides;
    if (realSlides.length > 0) {
      const combined = [...realSlides];
      for (const fallback of activeCityData.slides) {
        if (combined.length >= 3) break;
        if (!combined.some((s) => s.id === fallback.id)) {
          combined.push(fallback);
        }
      }
      return combined;
    }
    return activeCityData.slides;
  }, [realSlides, activeCityData]);

  const mockList = useMemo(() => {
    if (realList.length >= 5) return realList;
    if (realList.length > 0) {
      const combined = [...realList];
      for (const fallback of activeCityData.list) {
        if (combined.length >= 5) break;
        if (!combined.some((l) => l.id === fallback.id)) {
          combined.push(fallback);
        }
      }
      return combined;
    }
    return activeCityData.list;
  }, [realList, activeCityData]);

  useEffect(() => {
    if (mockSlides.length <= 1) return;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % mockSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [mockSlides.length, activeTab]);

  const currentSlide = mockSlides[slideIdx % mockSlides.length];


  return (
    <section className="mt-6 border-t border-border pt-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

        {/* Left Column: Tab list + Carousel & Side list */}
        <div className="flex flex-col min-w-0">

          {/* Section Header with Underline */}
          <div className="relative border-b-2 border-slate-900 pb-2 mb-4 flex items-center justify-between">
            <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-sm select-none uppercase tracking-wide">
              {language === 'gu' ? 'ગુજરાત' : language === 'hi' ? 'गुजरात' : 'Gujarat'}
            </span>
            <Link
              href="/category/gujarat"
              className="text-[13px] md:text-[14px] font-black pb-1.5 text-[#B3121B] hover:text-[#B3121B]/80 transition-colors whitespace-nowrap cursor-pointer ml-auto flex items-center gap-1 select-none"
            >
              {language === 'gu' ? 'વધુ જુઓ →' : language === 'hi' ? 'और देखें →' : 'View All →'}
            </Link>
          </div>

          {/* Tab Navigation List */}
          <div className="flex items-center gap-5 border-b border-border pb-3 mb-6 overflow-x-auto scrollbar-none select-none">
            {['અમદાવાદ', 'સુરત', 'વડોદરા', 'રાજકોટ', 'ગાંધીનગર', 'અન્ય'].map((tab) => {
              const isActive = activeTab === tab;
              const tabLabel = CITY_NAME_MAP[tab] ? getLocalized(language, CITY_NAME_MAP[tab]) : tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`text-[13.5px] md:text-[14.5px] font-black pb-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${isActive
                    ? 'border-[#B3121B] text-[#B3121B]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {tabLabel}
                </button>
              );
            })}

          </div>

          {/* Main 2-Column Content Section */}
          <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-8 items-start">

            {/* Carousel Slide */}
            {currentSlide && (
              <div className="group relative flex flex-col min-w-0">
                {/* Image container */}
                <div className="relative aspect-[16/9] md:aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted">
                  <Link href={`/news/${currentSlide.slug}`} className="block relative w-full h-full cursor-pointer">
                    <ArticleMedia
                      src={currentSlide.image}
                      alt={currentSlide.titleGu}
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </Link>
                  {/* Left / Right Arrows */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSlideIdx((prev) => (prev - 1 + mockSlides.length) % mockSlides.length);
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10 text-[18px] font-bold select-none cursor-pointer"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSlideIdx((prev) => (prev + 1) % mockSlides.length);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10 text-[18px] font-bold select-none cursor-pointer"
                  >
                    ›
                  </button>
                  {/* Counter Index */}
                  <span className="absolute top-2.5 left-2.5 bg-black/70 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-sm z-10 select-none pointer-events-none">
                    {language === 'gu'
                      ? `${toGuLocal(slideIdx + 1)} / ${toGuLocal(mockSlides.length)}`
                      : `${slideIdx + 1} / ${mockSlides.length}`}
                  </span>
                </div>

                {/* Info Text below image */}
                <div className="mt-3.5 flex flex-col">
                  <span className="text-[#B3121B] font-black text-[12.5px] uppercase tracking-wide mb-1 select-none">
                    {getLocalized(language, { en: currentSlide.category, gu: currentSlide.categoryGu, hi: currentSlide.categoryHi })}
                  </span>

                  <Link href={`/news/${currentSlide.slug}`} className="group/link">
                    <div className="h-[48px] md:h-[50px] overflow-hidden">
                      <h3 className="font-extrabold text-[15.5px] md:text-[17px] leading-snug tracking-tight text-foreground group-hover/link:text-[#B3121B] transition-colors line-clamp-2">
                        <AutoTranslateString text={getLocalized(language, { en: currentSlide.title, gu: currentSlide.titleGu, hi: currentSlide.titleHi })} language={language} />
                      </h3>
                    </div>
                  </Link>

                  <div className="h-[38px] overflow-hidden mt-2">
                    <p className="text-muted-foreground text-[12.5px] leading-relaxed line-clamp-2 font-medium">
                      <AutoTranslateString text={stripHtmlTags(getLocalized(language, { en: currentSlide.excerpt, gu: currentSlide.excerptGu, hi: currentSlide.excerptHi }))} language={language} />
                    </p>
                  </div>

                  {/* Meta Details with Inline Tags */}
                  <div className="h-[38px] flex items-center gap-2.5 mt-3.5 text-[11px] text-muted-foreground font-semibold border-b border-border/40 pb-3 mb-3.5 overflow-hidden">
                    <span>
                      {getLocalized(language, { en: currentSlide.relativeTime, gu: currentSlide.relativeTimeGu, hi: currentSlide.relativeTimeHi })}
                    </span>
                    <span>•</span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentSlide.tags.slice(0, 3).map((tag) => {
                        const tagLabel = getLocalizedTag(tag, language);
                        return (
                          <span
                            key={tag}
                            className="bg-muted text-muted-foreground text-[10.5px] font-bold px-2 py-0.5 rounded-sm border border-border select-none animate-fade-in"
                          >
                            {tagLabel}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* List updates columns */}
            <div className="flex flex-col min-w-0 md:border-l md:border-border/60 md:pl-6 gap-2.5">
              {mockList.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="group flex gap-3.5 items-start py-1.5 border-b border-border/40 last:border-b-0 pb-2 last:pb-0"
                >
                  {/* Small thumbnail on the left */}
                  <div className="relative h-[68px] w-[108px] shrink-0 overflow-hidden rounded-sm bg-muted border border-border/10">
                    <ArticleMedia
                      src={item.image}
                      alt={item.titleGu}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Details on the right */}
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <span className="text-[#B3121B] font-extrabold text-[11px] uppercase tracking-wide mb-0.5 select-none leading-none">
                      {getLocalized(language, { en: item.category, gu: item.categoryGu, hi: item.categoryHi })}
                    </span>
                    <div className="h-[36px] overflow-hidden">
                      <h4 className="text-[13px] md:text-[13.5px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                        <AutoTranslateString text={getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })} language={language} />
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px] text-muted-foreground font-semibold select-none leading-none">
                      <span>
                        {getLocalized(language, { en: item.relativeTime, gu: item.relativeTimeGu, hi: item.relativeTimeHi })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground/60" />
                        <span>{getMockTime(item.id)}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          </div>

        </div>

        {/* Right Column: Sidebar Ads and widgets */}
        <div className="flex flex-col gap-6 sticky top-20 select-none">

          <SidebarAdBanner
            slot="SIDEBAR_GUJARAT"
            language={language}
            fallbackTitleGu="ઇઝી પર્સનલ લોન"
            fallbackTitleEn="Easy Personal Loan"
            fallbackTagGu="ફક્ત 10.5% વ્યાજે, 5 મિનિટમાં મંજૂરી"
            fallbackTagEn="Just 10.5% interest, approval in 5 mins"
            fallbackCtaGu="અરજી કરો"
            fallbackCtaEn="Apply Now"
            fallbackGradient="linear-gradient(135deg,#0f3d70,#001f3f)"
            minHeight={180}
          />

          {/* WhatsApp Channel widget */}
          <div className="w-full rounded-sm border border-slate-200 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2.5 font-black text-[14.5px] text-foreground">
              {/* WhatsApp green icon */}
              <span className="flex h-7.5 w-7.5 items-center justify-center rounded-sm bg-[#16794A] text-white text-[15px] font-bold select-none">
                💬
              </span>
              <span>{language === 'gu' ? 'WhatsApp ચેનલ' : 'WhatsApp Channel'}</span>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed my-3 font-semibold">
              {language === 'gu' ? 'તમારા શહેરના સમાચાર સૌથી પહેલા સીધા તમારા ફોન પર મેળવો' : 'Get your city news first directly on your phone.'}
            </p>
            <button className="w-full bg-[#16794A] hover:bg-[#12613b] text-white font-extrabold text-[12.5px] py-2.5 rounded-sm active:scale-[0.99] transition-all cursor-pointer">
              {language === 'gu' ? 'ચેનલ ફોલો કરો' : 'Follow Channel'}
            </button>
          </div>

          {/* Trending Topics widget */}
          <div>
            <div className="flex items-center gap-1.5 border-b border-border pb-1.5 mb-2">
              <span className="text-[#B3121B] font-black text-[13.5px] md:text-[14px]">
                {language === 'gu' ? '• Trending વિષયો' : '• Trending Topics'}
              </span>
            </div>
            <div className="border border-border rounded-sm bg-card p-2.5 shadow-sm">
              <div className="flex flex-wrap gap-1.5">
                {(dynamicTrendingTopics.length > 0 ? dynamicTrendingTopics : getLocalizedTrendingTags(language)).map((tag) => {
                  const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
                  return (
                    <Link
                      key={tag}
                      href={getTrendingTopicHref(cleanTag)}
                      className="border border-neutral-300 dark:border-neutral-700 text-[11px] font-black px-2.5 py-2 rounded-full text-foreground hover:border-[#B3121B] hover:bg-[#B3121B]/5 hover:text-[#B3121B] transition-all bg-card shadow-sm cursor-pointer select-none"
                    >
                      <span className="text-[#B3121B] font-extrabold mr-0.5">#</span>
                      <AutoTranslateString text={getLocalizedTag(cleanTag, language)} language={language} />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

/* --- Crime & Regional Updates Section ------------------------------------ */
function CrimeSection({
  language,
  view = 'all',
}: {
  language: Language;
  view?: 'content' | 'sidebar' | 'all';
}) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [popularStartIndex, setPopularStartIndex] = useState(0);
  const [selectedZodiac, setSelectedZodiac] = useState<ZodiacSign | null>(null);
  const [astrologySigns, setAstrologySigns] = useState<ZodiacSign[]>(ZODIAC_SIGNS);
  const [dbCrimeArticles, setDbCrimeArticles] = useState<Article[]>([]);
  const [weatherData, setWeatherData] = useState<any>({
    city: 'અમદાવાદ',
    cityEn: 'Ahmedabad',
    temp: 32,
    humidity: 68,
    windSpeed: 14,
    conditionGu: 'આંશિક વાદળછાયું',
    conditionEn: 'Partly cloudy',
  });

  useEffect(() => {
    getPublicArticles({ categorySlug: 'crime', limit: 25 }).then((crimeRes) => {
      if (crimeRes && crimeRes.articles && crimeRes.articles.length > 0) {
        setDbCrimeArticles(crimeRes.articles);
      }
    });
    getPublicWeather('ahmedabad').then((wRes) => {
      if (wRes) {
        setWeatherData(wRes);
      }
    });
    getPublicAstrology().then((signs) => {
      if (Array.isArray(signs) && signs.length > 0) {
        setAstrologySigns(signs);
      }
    });
  }, []);

  const mockSlides = [
    {
      id: 'c1',
      slug: 'cyber-cell-busts-fake-investment-app-network-in-ahmedabad-93',
      image: '/assets/demo/3.jpg',
      titleGu: 'અમદાવાદમાં કરોડોનું કૌભાંડ! ફેક ઇન્વેસ્ટમેન્ટ એપ નેટવર્કનો પર્દાફાશ, અનેક ધરપકડ',
      title: 'Crores scam in Ahmedabad! Fake investment app network busted, many arrested',
      titleHi: 'अहमदाबाद में करोड़ों का घोटाला! फेक निवेश ऐप नेटवर्क का भंडाफोड़, कई गिरफ्तार',
      relativeTimeGu: '1 કલાક પહેલાં',
      relativeTime: '1 hour ago',
      relativeTimeHi: '1 घंटा पहले',
      categoryGu: 'અમદાવાદ',
      category: 'Ahmedabad',
      categoryHi: 'अहमदाबाद',
      viewsGu: '68K',
      views: '68K'
    },
    {
      id: 'c2',
      slug: 'surat-police-seize-contraband-worth-crores-in-joint-raid-94',
      image: '/assets/demo/6.jpg',
      titleGu: 'સુરત પોલીસની સંયુક્ત રેડ! કરોડોની મુદ્દામાલ જપ્ત',
      title: 'Joint raid by Surat police! Contraband worth crores seized',
      titleHi: 'सूरत पुलिस की संयुक्त छापेमारी! करोड़ों का माल जब्त',
      relativeTimeGu: '2 કલાક પહેલાં',
      relativeTime: '2 hours ago',
      relativeTimeHi: '2 घंटे पहले',
      categoryGu: 'સુરત',
      category: 'Surat',
      categoryHi: 'सूरत',
      viewsGu: '71K',
      views: '71K'
    },
    {
      id: 'c3',
      slug: 'kidnapping-racket-busted-in-rajkot-five-arrested-95',
      image: '/assets/demo/4.jpg',
      titleGu: 'રાજકોટમાં અપહરણ ગેંગનો પર્દાફાશ! પાંચ આરોપી ઝડપાયા',
      title: 'Kidnapping gang exposed in Rajkot! Five suspects arrested',
      titleHi: 'राजकोट में अपहरण गिरोह का पर्दाफाश! पांच आरोपी गिरफ्तार',
      relativeTimeGu: '3 કલાક પહેલાં',
      relativeTime: '3 hours ago',
      relativeTimeHi: '3 घंटे पहले',
      categoryGu: 'રાજકોટ',
      category: 'Rajkot',
      categoryHi: 'राजकोट',
      viewsGu: '74K',
      views: '74K'
    }
  ];

  const mockList = [
    {
      id: 'l1',
      slug: 'atm-skimming-gang-caught-after-months-of-investigation-96',
      titleGu: 'વડોદરામાં ATM સ્કીમિંગ ગેંગ ઝડપાઈ! મહિનાઓની તપાસ બાદ ભાંડો ફૂટ્યો',
      title: 'ATM skimming gang caught in Vadodara! Secret busted after months of investigation',
      titleHi: 'वडोदरा में एटीएम स्किमिंग गैंग पकड़ी गई! महीनों की जांच के बाद हुआ खुलासा',
      relativeTimeGu: '4 કલાક પહેલાં',
      relativeTime: '4 hours ago',
      relativeTimeHi: '4 घंटे पहले',
      categoryGu: 'વડોદરા',
      category: 'Vadodara',
      categoryHi: 'વડોદરા',
      viewsGu: '78K',
      views: '78K'
    },
    {
      id: 'l2',
      slug: 'drug-trafficking-route-from-pakistan-via-gujarat-busted-98',
      titleGu: 'ભાવનગરમાં દારૂનો મોટો જથ્થો ઝડપાયો, ત્રણ આરોપી કબજે',
      title: 'Huge alcohol haul seized in Bhavnagar, three suspects in custody',
      titleHi: 'भावनगर में शराब का बड़ा जहीरा जब्त, तीन आरोपी गिरफ्तार',
      relativeTimeGu: '5 કલાક પહેલાં',
      relativeTime: '5 hours ago',
      relativeTimeHi: '5 घंटे पहले',
      categoryGu: 'ભાવનગર',
      category: 'Bhavnagar',
      categoryHi: 'भावनगर',
      viewsGu: '81K',
      views: '81K'
    },
    {
      id: 'l3',
      slug: 'land-fraud-case-senior-official-arrested-in-vadodara-97',
      titleGu: 'જૂનાગઢમાં ઓનલાઇન લોન એપના નામે બ્લેકમેલિંગ! ફરિયાદ નોંધાઈ',
      title: 'Blackmailing in Junagadh in the name of online loan apps! FIR registered',
      titleHi: 'जूनागढ़ में ऑनलाइन लोन ऐप के नाम पर ब्लैकमेलिंग! शिकायत दर्ज',
      relativeTimeGu: '6 કલાક પહેલાં',
      relativeTime: '6 hours ago',
      relativeTimeHi: '6 घंटे पहले',
      categoryGu: 'જૂનાગઢ',
      category: 'Junagadh',
      categoryHi: 'जूनागढ़',
      viewsGu: '90K',
      views: '90K'
    },
    {
      id: 'l4',
      slug: 'land-fraud-case-senior-official-arrested-in-vadodara-97',
      titleGu: 'જૂનાગઢમાં ઓનલાઇન લોન એપના નામે બ્લેકમેલિંગ! ફરિયાદ નોંધાઈ',
      title: 'Blackmailing in Junagadh in the name of online loan apps! FIR registered',
      titleHi: 'जूनागढ़ में ऑनलाइन लोन ऐप के नाम पर ब्लैकमेलिंग! शिकायत दर्ज',
      relativeTimeGu: '6 કલાક પહેલાં',
      relativeTime: '6 hours ago',
      relativeTimeHi: '6 घंटे पहले',
      categoryGu: 'જૂનાગઢ',
      category: 'Junagadh',
      categoryHi: 'जूनागढ़',
      viewsGu: '90K',
      views: '90K'
    }
  ];

  const mockPopularColumns = [
    {
      colId: 1,
      featured: {
        id: 'pf1',
        slug: 'gujarat-election-2027-preparations-active-301',
        image: '/assets/demo/1.jpg',
        titleGu: 'ગુજરાત ચૂંટણી 2027 નજીક! જિલ્લાઓમાં તૈયારીઓ તેજ, સત્તાધારી પક્ષ સક્રિય',
        title: 'Gujarat Election 2027 near! Preparations active in districts',
        category: 'Politics'
      },
      subs: [
        {
          id: 'ps1_1',
          slug: 'cm-meeting-vibrant-gujarat-rural-development-302',
          image: '/assets/demo/3.jpg',
          titleGu: 'CMની મોટી બેઠક! વિકાસ પ્રોજેક્ટ માટે સમીક્ષા, ગ્રામીણ વિસ્તારો પર ભાર',
          relativeTimeGu: '2 કલાક પહેલાં',
          viewsGu: '33K'
        },
        {
          id: 'ps1_2',
          slug: 'bjp-state-executive-meeting-organization-expansion-303',
          image: '/assets/demo/2.jpg',
          titleGu: 'ભાજપ પ્રદેશ કારોબારીની બેઠકમાં સંગઠન વિસ્તરણ પર મોટી ચર્ચા',
          relativeTimeGu: '3 કલાક પહેલાં',
          viewsGu: '45K'
        },
        {
          id: 'ps1_3',
          slug: 'aap-claims-ground-level-network-expansion-gujarat-304',
          image: '/assets/demo/4.jpg',
          titleGu: 'AAPનો મોટો દાવો! ગ્રામ્ય ગુજરાતમાં ભૂ-સ્તરીય નેટવર્ક વિસ્તાર્યું',
          relativeTimeGu: '4 કલાક પહેલાં',
          viewsGu: '38K'
        }
      ]
    },
    {
      colId: 2,
      featured: {
        id: 'pf2',
        slug: 'major-controversy-ahmedabad-muni-commissioner-objection-305',
        image: '/assets/demo/7.jpg',
        titleGu: 'મોટો વિવાદ! અમદાવાદ મ્યુનિ. કમિશનરે તંત્ર સામે વાંધો ઉઠાવ્યો',
        title: 'Major controversy! Ahmedabad Muni Commissioner raises objection against system',
        category: 'Civic'
      },
      subs: [
        {
          id: 'ps2_1',
          slug: 'military-training-irregularities-promotions-cancelled-306',
          image: '/assets/demo/5.jpg',
          titleGu: 'સૈન્ય તાલીમમાં મોટી ગેરરીતિ! 100થી વધુ પ્રમોશન રદ કરાયા',
          relativeTimeGu: '4 કલાક પહેલાં',
          viewsGu: '28K'
        },
        {
          id: 'ps2_2',
          slug: 'congress-reveals-cards-election-campaign-strategy-307',
          image: '/assets/demo/6.jpg',
          titleGu: 'કોંગ્રેસે ખોલ્યા પત્તા! 2027 ચૂંટણી ઝુંબેશ વ્યૂહ જાહેર કર્યો',
          relativeTimeGu: '5 કલાક પહેલાં',
          viewsGu: '50K'
        },
        {
          id: 'ps2_3',
          slug: 'assembly-monsoon-session-hung-opposition-adjournment-motion-308',
          image: '/assets/demo/1.jpg',
          titleGu: 'વિધાનસભા ચોમાસુ સત્રમાં હોબાળો! વિપક્ષે બેરોજગારી મુદ્દે સ્થગન પ્રસ્તાવ આપ્યો',
          relativeTimeGu: '6 કલાક પહેલાં',
          viewsGu: '42K'
        }
      ]
    },
    {
      colId: 3,
      featured: {
        id: 'pf3',
        slug: 'high-court-strict-notice-state-government-recruitment-process-309',
        image: '/assets/demo/4.jpg',
        titleGu: 'હાઈકોર્ટની આકરી નોટિસ! રાજ્ય સરકારને ભરતી પ્રક્રિયા અંગે જવાબ માંગ્યો',
        title: 'Strict notice from High Court! State Government asked for response on recruitment process',
        category: 'Legal'
      },
      subs: [
        {
          id: 'ps3_1',
          slug: 'union-minister-visit-gujarat-industrial-corridor-302',
          image: '/assets/demo/8.jpg',
          titleGu: 'કેન્દ્રીય મંત્રીની ગુજરાત મુલાકાત! નવા ઔદ્યોગિક કોરિડોરની જાહેરાત શક્ય',
          relativeTimeGu: '1 કલાક પહેલાં',
          viewsGu: '62K'
        },
        {
          id: 'ps3_2',
          slug: 'voter-list-revision-campaign-starts-online-registration-appeal-311',
          image: '/assets/demo/1.jpg',
          titleGu: 'મતદાર યાદી સુધારણા ઝુંબેશ શરૂ! નાગરિકોને ઓનલાઈન નોંધણીની અપીલ',
          relativeTimeGu: '2 કલાક પહેલાં',
          viewsGu: '41K'
        },
        {
          id: 'ps3_3',
          slug: 'police-recruitment-10000-vacancies-filled-soon-315',
          image: '/assets/demo/7.jpg',
          titleGu: 'યુવાનો માટે મોટી તક! પોલીસ ભરતીમાં 10,000 જગ્યાઓ ટૂંક સમયમાં ભરાશે',
          relativeTimeGu: '3 કલાક પહેલાં',
          viewsGu: '55K'
        }
      ]
    }
  ];

  const mockZodiacArticles = [
    {
      id: 'za0',
      slug: 'gujarat-heavy-rain-alert-waterlogging-400',
      image: '/assets/demo/1.jpg',
      symbol: '1',
      titleGu: 'ગુજરાત ચૂંટણી 2027 નજીક! જિલ્લાઓમાં તૈયારીઓ તેજ, સત્તાધારી પક્ષ સક્રિય',
      relativeTimeGu: '30 મિનિટ પહેલાં',
      viewsGu: '2.5L'
    },
    {
      id: 'za1',
      slug: 'monsoon-2025-gujarat-rain-forecast-weather-dept-401',
      image: '/assets/demo/7.jpg',
      symbol: '2',
      titleGu: 'મોટો વિવાદ! અમદાવાદ મ્યુનિ. કમિશનરે તંત્ર સામે વાંધો ઉઠાવ્યો',
      relativeTimeGu: '1 કલાક પહેલાં',
      viewsGu: '1.8L'
    },
    {
      id: 'za2',
      slug: 'gold-silver-price-surge-latest-rates-today-402',
      image: '/assets/demo/5.jpg',
      symbol: '3',
      titleGu: 'હાઈકોર્ટની આકરી નોટિસ! રાજ્ય સરકારને ભરતી પ્રક્રિયા અંગે જવાબ માંગ્યો',
      relativeTimeGu: '2 કલાક પહેલાં',
      viewsGu: '1.5L'
    }
  ];

  const visiblePopularArticles = [
    mockZodiacArticles[popularStartIndex],
    mockZodiacArticles[(popularStartIndex + 1) % mockZodiacArticles.length],
    mockZodiacArticles[(popularStartIndex + 2) % mockZodiacArticles.length]
  ];

  const slides = useMemo(() => {
    if (dbCrimeArticles.length > 0) {
      return dbCrimeArticles.slice(0, 3).map((art) => {
        const locEn = getLocationLabel(art, 'en') || art.location || art.category || 'Crime';
        const locGu = getLocationLabel(art, 'gu') || (art as any).locationGu || art.categoryGu || art.category || 'કાઇમ';
        const locHi = getLocationLabel(art, 'hi') || (art as any).locationHi || art.categoryHi || art.category || 'क्राइम';
        return {
          id: art.id,
          slug: art.slug,
          image: art.image || DEMO_IMAGES[0],
          article: art as Article,
          category: locEn,
          categoryGu: locGu,
          categoryHi: locHi,
          title: art.title,
          titleGu: art.titleGu || art.title,
          titleHi: (art as any).titleHi || art.title,
          relativeTime: formatTime(art.publishedAt),
          relativeTimeGu: formatTime(art.publishedAt),
          relativeTimeHi: formatTime(art.publishedAt),
          clockTime: art.publishedAt ? new Date(art.publishedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '10:30 AM',
        };
      });
    }
    return mockSlides.map((s) => ({ ...s, article: null as Article | null, clockTime: getMockTime(s.id) }));
  }, [dbCrimeArticles]);

  const rightList = useMemo(() => {
    if (dbCrimeArticles.length > 3) {
      return dbCrimeArticles.slice(3, 8).map((art) => {
        const locEn = getLocationLabel(art, 'en') || art.location || art.category || 'Crime';
        const locGu = getLocationLabel(art, 'gu') || (art as any).locationGu || art.categoryGu || art.category || 'કાઇમ';
        const locHi = getLocationLabel(art, 'hi') || (art as any).locationHi || art.categoryHi || art.category || 'क्राइम';
        return {
          id: art.id,
          slug: art.slug,
          category: locEn,
          categoryGu: locGu,
          categoryHi: locHi,
          title: art.title,
          titleGu: art.titleGu || art.title,
          titleHi: (art as any).titleHi || art.title,
          relativeTime: formatTime(art.publishedAt),
          relativeTimeGu: formatTime(art.publishedAt),
          relativeTimeHi: formatTime(art.publishedAt),
          clockTime: art.publishedAt ? new Date(art.publishedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '10:45 AM',
        };
      });
    }
    return mockList.map((item) => ({ ...item, clockTime: getMockTime(item.id) }));
  }, [dbCrimeArticles, language]);

  const popularColumns = useMemo(() => {
    const remainingCrime = dbCrimeArticles.length > 8 ? dbCrimeArticles.slice(8) : dbCrimeArticles;
    const list = remainingCrime;
    if (list.length > 0) {
      const cols = [];
      for (let c = 0; c < 3; c++) {
        const featArt = list[c] || list[c % list.length];
        const subs = [];
        for (let s = 0; s < 3; s++) {
          const subIdx = 3 + c * 3 + s;
          const subArt = list[subIdx] || list[(c * 3 + s) % list.length];
          if (subArt) {
            subs.push({
              id: subArt.id,
              slug: subArt.slug,
              image: subArt.image || DEMO_IMAGES[s % DEMO_IMAGES.length],
              title: getLocalized(language, { en: subArt.title, gu: subArt.titleGu || subArt.title, hi: (subArt as any).titleHi || subArt.title }),
              time: formatTime(subArt.publishedAt),
            });
          }
        }
        cols.push({
          colId: c + 1,
          featured: {
            id: featArt.id,
            slug: featArt.slug,
            image: featArt.image || DEMO_IMAGES[c],
            title: getLocalized(language, { en: featArt.title, gu: featArt.titleGu || featArt.title, hi: (featArt as any).titleHi || featArt.title }),
          },
          subs,
        });
      }
      return cols;
    }

    return mockPopularColumns.map((col) => ({
      colId: col.colId,
      featured: {
        id: col.featured.id,
        slug: col.featured.slug,
        image: col.featured.image,
        title: getMockTitle(col.featured, language),
      },
      subs: col.subs.map((sub) => ({
        id: sub.id,
        slug: sub.slug,
        image: sub.image,
        title: getMockTitle(sub, language),
        time: getMockRelativeTime(sub.relativeTimeGu, language),
      })),
    }));
  }, [dbCrimeArticles, language]);

  const currentSlide = slides[slideIdx % slides.length];

  const leftContent = (
    <div className="flex flex-col min-w-0">

      {/* Crime Header */}
      <div className="flex items-end justify-between h-[46px] border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2.5 mb-6">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'કાઇમ' : 'Crime'}
        </span>
        <Link
          href="/category/crime"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline pb-0.5"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More See →'}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-8 items-stretch">
        {/* Slide Carousel */}
        {currentSlide && (
          <div className="group relative flex flex-col min-w-0 h-full">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted">
              <Image
                src={currentSlide.image}
                alt={currentSlide.titleGu}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <button
                type="button"
                onClick={() => setSlideIdx((prev) => (prev - 1 + slides.length) % slides.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/60 hover:bg-[#B3121B] hover:border-[#B3121B] text-white transition-all duration-200 shadow-md backdrop-blur-md z-10 cursor-pointer select-none"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5 stroke-[3px] text-white" />
              </button>
              <button
                type="button"
                onClick={() => setSlideIdx((prev) => (prev + 1) % slides.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/60 hover:bg-[#B3121B] hover:border-[#B3121B] text-white transition-all duration-200 shadow-md backdrop-blur-md z-10 cursor-pointer select-none"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5 stroke-[3px] text-white" />
              </button>
              <span className="absolute top-2.5 left-2.5 bg-black/70 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-sm z-10 select-none">
                {language === 'gu'
                  ? `${toGuLocal((slideIdx % slides.length) + 1)} / ${toGuLocal(slides.length)}`
                  : `${(slideIdx % slides.length) + 1} / ${slides.length}`}
              </span>
            </div>

            <div className="mt-3.5 flex flex-col flex-1 justify-between">
              <div>
                <span className="text-[#B3121B] font-extrabold text-[12px] md:text-[13px] mb-1 select-none uppercase tracking-wide">
                  {getLocalized(language, { en: currentSlide.category, gu: currentSlide.categoryGu, hi: currentSlide.categoryHi })}
                </span>
                <Link href={`/news/${currentSlide.slug}`} className="group/link flex flex-col justify-start">
                  <h3 className="font-extrabold text-[15.5px] md:text-[17px] leading-snug tracking-tight text-foreground hover:text-[#B3121B] transition-colors line-clamp-3">
                    {currentSlide.article
                      ? <AutoArticleTitle article={currentSlide.article} language={language} />
                      : <AutoTranslateString text={currentSlide.titleGu} language={language} />}
                  </h3>
                </Link>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold mt-auto pt-2 select-none">
                <span>
                  {getLocalized(language, { en: currentSlide.relativeTime, gu: currentSlide.relativeTimeGu, hi: currentSlide.relativeTimeHi })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>{currentSlide.clockTime}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* List side updates (Text lists only, no images, matching the screen!) */}
        <div className="flex flex-col min-w-0 md:border-l md:border-border/60 md:pl-6 gap-0">

          {rightList.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.slug}`}
              className="group flex flex-col py-2 border-b border-border/40 last:border-b-0"
            >
              <span className="text-red-600 font-extrabold text-[11px] uppercase tracking-wide mb-0.5">
                {getLocalized(language, { en: item.category, gu: item.categoryGu, hi: item.categoryHi })}
              </span>
              <h4 className="text-[14px] md:text-[14.5px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                {getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
              </h4>
              <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px] text-muted-foreground font-semibold">
                <span>
                  {getLocalized(language, { en: item.relativeTime, gu: item.relativeTimeGu, hi: item.relativeTimeHi })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground/60" />
                  <span>{item.clockTime}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 3-Column Popular Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-border/40 pt-5 mt-3">
        {popularColumns.map((col) => (
          <div key={col.colId} className="flex flex-col min-w-0">
            <Link
              href={`/news/${col.featured.slug}`}
              className="group flex flex-col mb-2.5"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5">
                <ArticleMedia
                  src={col.featured.image}
                  alt={col.featured.title}
                  className="transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="text-[13px] md:text-[13.5px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                {col.featured.title}
              </h3>
            </Link>

            <div className="flex flex-col divide-y divide-border/40 border-t border-border/40 mt-1">
              {col.subs.slice(0, 3).map((sub) => (
                <Link
                  key={sub.id}
                  href={`/news/${sub.slug}`}
                  className="group py-3 flex items-center gap-3"
                >
                  {/* Thumbnail photo on left */}
                  <div className="relative h-16 w-20 shrink-0 rounded-lg overflow-hidden border border-border/20 bg-muted">
                    <ArticleMedia
                      src={sub.image}
                      alt={sub.title}
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Title & Metadata on right */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <h4 className="text-[12.5px] md:text-[13px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                      {sub.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px] text-muted-foreground font-semibold select-none">
                      <span>{sub.time}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col gap-6 select-none">

      {/* Weather Widget */}
      <div className="rounded-sm bg-[#1A1A1A] text-white p-5 border border-border/10 shadow-md">
        <div className="flex items-center gap-1.5 mb-4 select-none">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-[12px] md:text-[13px] font-black uppercase tracking-wider text-white/90">
            {language === 'gu' ? `હવામાન - ${weatherData.city || 'અમદાવાદ'}` : `Weather - ${weatherData.cityEn || 'Ahmedabad'}`}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <span className="text-4xl font-extrabold tracking-tight select-none">
              {language === 'gu' ? toGuLocal(weatherData.temp ?? 32) : (weatherData.temp ?? 32)}°
            </span>
            <p className="text-[12px] text-white/70 font-bold mt-1.5 select-none">
              {language === 'gu' ? (weatherData.conditionGu || 'આંશિક વાદળછાયું') : (weatherData.conditionEn || 'Partly cloudy')}
            </p>
          </div>

          <div className="relative h-12 w-12 text-yellow-400 select-none">
            <svg viewBox="0 0 24 24" className="h-full w-full fill-current">
              <path d="M19 12a7 7 0 1 0-7 7 7 7 0 0 0 7-7zm-7 5a5 5 0 1 1 5-5 5 5 0 0 1-5 5z" />
              <path d="M12 2a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1zm0 16a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1zm10-7h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2zM4 11H3a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2zm15.07-5.07a1 1 0 0 0-1.42 0l-.7.7a1 1 0 0 0 1.42 1.42l.7-.7a1 1 0 0 0 0-1.42zm-12.73 12.7a1 1 0 0 0-1.42 0l-.7.7a1 1 0 0 0 1.42 1.42l.7-.7a1 1 0 0 0 0-1.42zm12.73 0a1 1 0 0 0 0-1.42l-.7-.7a1 1 0 0 0-1.42 1.42l.7.7a1 1 0 0 0 1.42 0zm-12.73-12.7a1 1 0 0 0 0-1.42l-.7-.7a1 1 0 0 0-1.42 1.42l.7.7a1 1 0 0 0 1.42 0z" />
            </svg>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-6 text-[12px] font-bold text-white/80">
          <span className="flex items-center gap-1.5 select-none">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-2">
              <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z" />
            </svg>
            {language === 'gu' ? `ભેજ ${toGuLocal(weatherData.humidity ?? 68)}%` : `Humidity ${weatherData.humidity ?? 68}%`}
          </span>
          <span className="flex items-center gap-1.5 select-none">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-2">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.59-6.59A2 2 0 1 1 19 12H2" />
            </svg>
            {language === 'gu' ? `પવન ${toGuLocal(weatherData.windSpeed ?? 14)} કિમી` : `Wind ${weatherData.windSpeed ?? 14} km/h`}
          </span>
        </div>
      </div>

      {/* WhatsApp Channel widget */}
      <div className="w-full rounded-sm border border-[#16794A] bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2.5 font-black text-[14.5px] text-foreground">
          <span className="flex h-7.5 w-7.5 items-center justify-center rounded-sm bg-[#16794A] text-white text-[15px] font-bold select-none">
            💬
          </span>
          <span>{language === 'gu' ? 'WhatsApp ચેનલ' : 'WhatsApp Channel'}</span>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed my-3 font-semibold">
          {language === 'gu' ? 'બ્રેકિંગ ન્યૂઝ સૌથી પહેલા સીધા તમારા ફોન પર મેળવો.' : 'Get breaking news first directly on your phone.'}
        </p>
        <button className="w-full bg-[#16794A] hover:bg-[#12613b] text-white font-extrabold text-[12.5px] py-2.5 rounded-sm active:scale-[0.99] transition-all cursor-pointer">
          {language === 'gu' ? 'ચેનલ ફોલો કરો' : 'Follow Channel'}
        </button>
      </div>

      {/* Today's Horoscope Widget */}
      <div>
        <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
          <span className="text-[#B3121B] font-black text-[13.5px] md:text-[14px] flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-pulse" />
            {language === 'gu' ? '• આજનું રાશિફળ' : language === 'hi' ? '• आज का राशिफल' : '• Today\'s Horoscope'}
          </span>
        </div>
        <div className="border border-purple-500/20 dark:border-purple-500/30 rounded-xl bg-card p-2 sm:p-2.5 shadow-sm">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {astrologySigns.map((sign) => {
              const isSelected = selectedZodiac?.id === sign.id;
              const letters = (sign as any).lettersGu ? `(${(sign as any).lettersGu})` : GUJARAT_ZODIAC_LETTERS[sign.id] || `(${sign.name})`;
              const primaryName = language === 'gu' ? sign.nameGu : language === 'hi' ? sign.nameHi : sign.name;
              const subName = language === 'gu' ? letters : language === 'hi' ? letters : `(${sign.name})`;

              return (
                <div
                  key={sign.id}
                  onClick={() => setSelectedZodiac(sign)}
                  className={`relative flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg border transition-all duration-200 cursor-pointer select-none text-center overflow-hidden ${isSelected
                      ? 'bg-[#FFF8F0] dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 shadow-xs'
                      : 'bg-background hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border-border/60 hover:border-amber-300/60'
                    }`}
                >
                  {/* SVG Illustration Icon */}
                  <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center mb-1 select-none">
                    <ZodiacIcon id={sign.id} className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>

                  {/* Gujarati Name */}
                  <span className={`text-[12px] sm:text-[12.5px] font-black leading-tight select-none ${isSelected ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'
                    }`}>
                    {primaryName}
                  </span>

                  {/* Gujarati Initial Letters (અ, લ, ઈ) */}
                  <span className={`text-[9.5px] sm:text-[10px] font-semibold leading-tight select-none mt-0.5 ${isSelected ? 'text-amber-600 dark:text-amber-300 font-bold' : 'text-muted-foreground'
                    }`}>
                    {subName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );

  const zodiacModal = selectedZodiac && (
    <ZodiacDetailModal
      sign={selectedZodiac}
      onClose={() => setSelectedZodiac(null)}
      language={language}
    />
  );

  if (view === 'content') {
    return leftContent;
  }

  if (view === 'sidebar') {
    return (
      <>
        {sidebarContent}
        {zodiacModal}
      </>
    );
  }

  return (
    <section className="mt-2.5 border-t border-border pt-3.5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        {leftContent}
        {sidebarContent}
      </div>
      {zodiacModal}
    </section>
  );
}

/* --- Popular Stories Slider Section -------------------------------------- */
function PopularStoriesSection({
  language,
  view = 'all',
}: {
  language: Language;
  view?: 'content' | 'sidebar' | 'all';
}) {
  const ITEMS_PER_SLIDE = 3;
  const [groupIndex, setGroupIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [popularList, setPopularList] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      getHeroSettings(),
      getPublicArticles({ limit: 12 }),
    ]).then(([res, pubRes]: any[]) => {
      let customArts: any[] = [];
      if (res && Array.isArray(res.popularNewsArticles) && res.popularNewsArticles.length > 0) {
        customArts = res.popularNewsArticles;
      }
      const fallbackArts = pubRes?.articles || [];
      const combined = [...customArts];
      for (const item of fallbackArts) {
        if (combined.length >= 12) break;
        if (item && item.id && !combined.some((c: any) => c.id === item.id)) {
          combined.push(item);
        }
      }

      const mapped = combined.map((a: any, idx: number) => ({
        id: a.id,
        slug: a.slug,
        image: a.featuredImage || a.image || DEMO_IMAGES[idx % DEMO_IMAGES.length],
        titleGu: a.titleGu || a.title,
        title: a.title || a.titleGu,
        relativeTimeGu: formatDate(a.publishedAt || a.createdAt),
        relativeTime: formatDate(a.publishedAt || a.createdAt),
        viewsGu: `${a.articleNumber ? `#${a.articleNumber}` : ''}`,
        views: `${a.articleNumber ? `#${a.articleNumber}` : ''}`,
      }));
      setPopularList(mapped);
    });
  }, []);

  const mockArticles = [
    {
      id: 'za0',
      slug: 'monsoon-rain-gujarat-forecast-401',
      image: '/assets/demo/3.jpg',
      titleGu: '2025: ગુજરાતમાં ક્યારે વરસાદ? હવામાન વિભાગની આગાહી',
      title: '2025: When will it rain in Gujarat? Weather Department forecast',
      relativeTimeGu: 'પહેલાં',
      relativeTime: 'ago',
      viewsGu: '1.8L',
      views: '1.8L'
    },
    {
      id: 'za1',
      slug: 'gold-silver-price-surge-latest-rates-today-402',
      image: '/assets/demo/6.jpg',
      titleGu: 'સોના-ચાંદીના ભાવમાં જોરદાર ઉછાળો! જાણો આજના લેટેસ્ટ રેટ',
      title: 'Gold-silver prices surge! Know latest rates today',
      relativeTimeGu: '2 કલાક પહેલાં',
      relativeTime: '2 hours ago',
      viewsGu: '1.5L',
      views: '1.5L'
    },
    {
      id: 'za2',
      slug: 'gujarat-board-result-2025-declared-403',
      image: '/assets/demo/7.jpg',
      titleGu: 'ગુજરાત બોર્ડ પરિણામ 2025 જાહેર! ટોપર્સનું લિસ્ટ અને ટકાવારી જુઓ',
      title: 'Gujarat Board Result 2025 declared! Check toppers list and percentage',
      relativeTimeGu: '3 કલાક પહેલાં',
      relativeTime: '3 hours ago',
      viewsGu: '1.2L',
      views: '1.2L'
    },
    {
      id: 'za3',
      slug: 'dwarka-temple-flag-ceremony-devotees-excited-404',
      image: '/assets/demo/5.jpg',
      titleGu: 'સરકારી ન્યૂઝલેટર: યોજનાઓની પ્રગતિ અંગે અહેવાલ પ્રસિદ્ધ કરવામાં આવ્યો',
      title: 'Government Newsletter: Progress report of schemes published',
      relativeTimeGu: '4 કલાક પહેલાં',
      relativeTime: '4 hours ago',
      viewsGu: '95K',
      views: '95K'
    },
    {
      id: 'za4',
      slug: 'ahmedabad-metro-phase2-update-405',
      image: '/assets/demo/1.jpg',
      titleGu: 'અમદાવાદ મેટ્રો ફેઝ-2: કામ ઝડપથી આગળ, ક્યારે ઉઘડશે?',
      title: 'Ahmedabad Metro Phase-2: Work fast, when will it open?',
      relativeTimeGu: '5 કલાક પહેલાં',
      relativeTime: '5 hours ago',
      viewsGu: '85K',
      views: '85K'
    },
    {
      id: 'za5',
      slug: 'surat-diamond-industry-boom-406',
      image: '/assets/demo/2.jpg',
      titleGu: 'સુરત ડાયમંડ ઉદ્યોગ: નિકાસમાં નવો વિક્રમ, 20,000 નોકરી',
      title: 'Surat Diamond Industry: New export record, 20,000 jobs',
      relativeTimeGu: '6 કલાક પહેલાં',
      relativeTime: '6 hours ago',
      viewsGu: '72K',
      views: '72K'
    },
    {
      id: 'za6',
      slug: 'gujarat-cricket-ranji-trophy-407',
      image: '/assets/demo/4.jpg',
      titleGu: 'ગુજરાત ક્રિકેટ: રણજી ટ્રોફીમાં ઐતિહાસિક જીત, ચાહકો ઉત્સાહિત',
      title: 'Gujarat Cricket: Historic win in Ranji Trophy, fans excited',
      relativeTimeGu: '7 કલાક પહેલાં',
      relativeTime: '7 hours ago',
      viewsGu: '68K',
      views: '68K'
    },
    {
      id: 'za7',
      slug: 'solar-power-gujarat-village-408',
      image: '/assets/demo/8.jpg',
      titleGu: 'ગ્રામ્ય ગુજરાત: સૌર ઊર્જાથી 500 ગામ રોશન, ખેડૂતો ખુશ',
      title: 'Rural Gujarat: 500 villages lit by solar energy, farmers happy',
      relativeTimeGu: '8 કલાક પહેલાં',
      relativeTime: '8 hours ago',
      viewsGu: '60K',
      views: '60K'
    },
    {
      id: 'za8',
      slug: 'gandhinagar-startup-summit-409',
      image: '/assets/demo/5.jpg',
      titleGu: 'ગાંધીનગર સ્ટાર્ટઅપ સમિટ: 500 ઉદ્યોગ સાહસિક, ₹100 Cr રોકાણ',
      title: 'Gandhinagar Startup Summit: 500 entrepreneurs, ₹100 Cr investment',
      relativeTimeGu: '9 કલાક પહેલાં',
      relativeTime: '9 hours ago',
      viewsGu: '55K',
      views: '55K'
    },
    {
      id: 'za9',
      slug: 'gujarat-tourism-record-2025-410',
      image: '/assets/demo/6.jpg',
      titleGu: 'ગુજરાત પ્રવાસન: 2025માં 3 કરોડ પ્રવાસી, નવો રેકોર્ડ',
      title: 'Gujarat Tourism: 3 crore tourists in 2025, new record',
      relativeTimeGu: '10 કલાક પહેલાં',
      relativeTime: '10 hours ago',
      viewsGu: '48K',
      views: '48K'
    },
    {
      id: 'za10',
      slug: 'rajkot-smart-city-development-411',
      image: '/assets/demo/3.jpg',
      titleGu: 'રાજકોટ સ્માર્ટ સિટી: નવા પ્રોજેક્ટ સાથે શહેર બનશે અત્યાધુનિક',
      title: 'Rajkot Smart City: City to become ultra-modern with new projects',
      relativeTimeGu: '11 કલાક પહેલાં',
      relativeTime: '11 hours ago',
      viewsGu: '42K',
      views: '42K'
    },
    {
      id: 'za11',
      slug: 'gujarat-education-new-policy-2025-412',
      image: '/assets/demo/4.jpg',
      titleGu: 'ગુજરાત શિક્ષણ નીતિ 2025: વિદ્યાર્થીઓ માટે નવી સુવિધાઓ જાહેર',
      title: 'Gujarat Education Policy 2025: New facilities announced for students',
      relativeTimeGu: '12 કલાક પહેલાં',
      relativeTime: '12 hours ago',
      viewsGu: '38K',
      views: '38K'
    }
  ];

  const articlesToUse = popularList.length > 0 ? popularList : mockArticles;
  const totalGroups = Math.ceil(articlesToUse.length / ITEMS_PER_SLIDE);
  const startIndex = groupIndex * ITEMS_PER_SLIDE;
  const visibleArticles = articlesToUse.slice(startIndex, startIndex + ITEMS_PER_SLIDE);

  // Auto-scroll: advance one group every 2s, loops back to group 0
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setGroupIndex((prev) => (prev + 1) % totalGroups);
    }, 2000);
    return () => clearInterval(timer);
  }, [paused, totalGroups]);

  const getGoldNumberGu = (idx: number) => {
    const val = startIndex + idx + 1; // 1-based
    return toGuLocal(val);
  };

  const getGoldNumber = (idx: number) => {
    return String(startIndex + idx + 1); // 1-based
  };

  const leftContent = (
    <div className="flex flex-col min-w-0">

      {/* Header */}
      <div className="flex items-center justify-between border-b-[3px] border-slate-950 pb-2.5 mb-6">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 font-extrabold text-[17px] md:text-[19px] rounded-sm tracking-tight leading-none uppercase">
          {language === 'gu' ? 'લોકપ્રિય  સમાચાર' : 'Popular  News'}
        </span>
        <Link
          href="/category/trending"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More See →'}
        </Link>
      </div>

      {/* Slider Row */}
      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 [&>*:first-child]:col-span-2 md:[&>*:first-child]:col-span-1">
          {visibleArticles.map((art, idx) => (
            <div key={art.id} className="flex flex-col min-w-0">
              <Link href={`/news/${art.slug}`} className="group flex flex-col gap-2">
                {/* Image wrapper */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted">
                  {/* Overlay index badge matching tv9 style */}
                  <span className="absolute top-1.5 left-1.5 z-10 bg-black/75 text-white text-[11px] font-black h-5 w-5 flex items-center justify-center rounded-sm select-none">
                    {language === 'gu' ? getGoldNumberGu(idx) : getGoldNumber(idx)}
                  </span>

                  <ArticleMedia
                    src={art.image}
                    alt={art.title}
                    className="transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <h3 className="text-[12px] md:text-[13.5px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                  {language === 'gu' ? art.titleGu : art.title}
                </h3>
              </Link>

              {/* Metadata */}
              <div className="text-[10px] md:text-[11px] text-muted-foreground font-bold mt-1 select-none">
                {language === 'gu' ? art.relativeTimeGu : art.relativeTime}
              </div>
            </div>
          ))}
        </div>

        {/* Carousel controls - visual indicators */}
        <div className="flex justify-center items-center gap-1.5 mt-5 mb-1 select-none">
          {Array.from({ length: totalGroups }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setGroupIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${groupIndex === idx ? 'w-5 bg-[#B3121B]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              aria-label={`Go to slide group ${idx + 1}`}
            />
          ))}
        </div>
      </div>

    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col gap-6 select-none">

      {/* E-Paper Widget */}
      <div className="w-full rounded-sm border border-slate-200 bg-card p-6 shadow-sm flex items-center justify-between hover:border-red-300 transition-colors cursor-pointer select-none">
        <div className="flex items-center gap-3">
          <span className="bg-[#B3121B] text-white px-2.5 py-1 text-[11.5px] font-black rounded-sm">
            {language === 'gu' ? 'ઈ-પેપર' : 'E-Paper'}
          </span>
          <div className="flex flex-col">
            <span className="text-[12.5px] font-black text-foreground">
              {language === 'gu' ? 'આજનું ઈ-પેપર વાંચો' : 'Read today\'s E-paper'}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold mt-0.5">
              {language === 'gu' ? '14 જૂન 2025 · PDF' : '14 June 2025 · PDF'}
            </span>
          </div>
        </div>
        <span className="text-[#B3121B] font-extrabold text-[15px] pr-1">→</span>
      </div>

      <SidebarAdBanner
        slot="SIDEBAR_POPULAR"
        language={language}
        fallbackTitleGu="રિચાર્જ પ્લસ"
        fallbackTitleEn="Recharge Plus"
        fallbackTagGu="અનલિમિટેડ ડેટા + કોલિંગ ફક્ત ₹199/મહિને"
        fallbackTagEn="Unlimited data + calling only ₹199/month"
        fallbackCtaGu="રિચાર્જ કરો"
        fallbackCtaEn="Recharge Now"
        fallbackGradient="linear-gradient(135deg,#5D3FD3,#4A2CA8)"
        minHeight={265}
      />

    </div>
  );

  if (view === 'content') {
    return leftContent;
  }

  if (view === 'sidebar') {
    return sidebarContent;
  }

  return (
    <section className="mt-6 border-t border-border pt-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        {leftContent}
        {sidebarContent}
      </div>
    </section>
  );
}

// Localized helper lists
function getLocalizedCityTabs(lang: string) {
  if (lang === 'hi') return ['अहमदाबाद', 'सूरत', 'वडोदरा', 'राजकोट', 'गांधीनगर', 'अन्य'];
  if (lang === 'en') return ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Other'];
  return ['અમદાવાદ', 'સુરત', 'વડોદરા', 'રાજકોટ', 'ગાંધીનગર', 'અન્ય'];
}

function getLocalizedBeats(lang: string) {
  if (lang === 'hi') return ['सिविक', 'ट्रैफिक', 'मेट्रो', 'क्राइम', 'मौसम'];
  if (lang === 'en') return ['Civic', 'Traffic', 'Metro', 'Crime', 'Weather'];
  return ['સિવિક', 'ટ્રાફિક', 'મેટ્રો', 'ક્રાઇમ', 'હવામાન'];
}

function getLocalizedTrendingTags(lang: string) {
  if (lang === 'hi') return ['#चुनाव 2026', '#बारिश', '#सोना-चांदी', '#क्रिकेट', '#मेट्रो', '#सेमीकंडक्टर', '#डायमंड उद्योग', '#ट्रैफिक'];
  if (lang === 'en') return ['#Election 2026', '#Rain', '#Gold-Silver', '#Cricket', '#Metro', '#Semiconductor', '#Diamond Industry', '#Traffic'];
  return ['#ચૂંટણી 2026', '#વરસાદ', '#સોના-ચાંદી', '#ક્રિકેટ', '#મેટ્રો', '#સેમિકન્ડક્ટર', '#ડાયમંડ ઉદ્યોગ', '#ટ્રાફિક'];
}

/* --- Trending Sidebar Widget ------------------------------------------------ */
function TrendingSidebarWidget({ articles, language }: { articles: Article[]; language: Language }) {
  if (!articles.length) return null;

  return (
    <div className="border border-border/85 bg-card rounded-xl p-4 shadow-sm mt-3">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-2">
        <Flame className="h-5 w-5 text-accent animate-pulse fill-current shrink-0" />
        <h3 className="text-[16px] font-black text-foreground">
          {getLocalized(language, { en: 'Trending News', gu: 'ટ્રેન્ડિંગ સમાચાર', hi: 'ट्रेंडिंग समाचार' })}
        </h3>
      </div>

      {/* Vertical List */}
      <div className="flex flex-col gap-3.5">
        {articles.slice(0, 10).map((art, idx) => (
          <Link
            key={art.id}
            href={`/news/${art.slug}`}
            className="group flex items-start gap-3 transition-colors pb-3 border-b border-border/40 last:border-0 last:pb-0"
          >
            {/* Number Rank */}
            <span className="text-[20px] font-black text-accent/80 group-hover:text-accent w-6 shrink-0 mt-0.5 text-center">
              {idx + 1}
            </span>
            {/* Small Thumbnail */}
            <div className="relative h-[38px] w-[56px] shrink-0 overflow-hidden rounded-md border border-border/10 bg-muted">
              <ArticleMedia
                src={art.image}
                alt={art.title}
                className="transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            {/* Title */}
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-3 text-[13.5px] leading-snug font-medium text-foreground group-hover:text-accent transition-colors duration-150">
                <AutoArticleTitle article={art} language={language} />
              </h4>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* --- Section Label ---------------------------------------------------------- */
function SectionLabel({ title, titleGu, language }: { title: string; titleGu: string; language: Language }) {
  const display = language === 'en' ? title : titleGu;
  return (
    <div className="flex items-center gap-1.5 mb-1 border-b-2 border-accent pb-0.5">
      <Flame className="h-5 w-5 text-accent fill-current shrink-0" />
      <span className="text-[19px] md:text-[21px] font-black leading-tight text-foreground">{display}</span>
    </div>
  );
}

/* --- Article Hover Preview Removed ----------------------------------------- */

/* --- Left List Item --------------------------------------------------------- */
function LeftListItem({ article, language }: { article: Article; language: Language }) {
  const title = getArticleTitle(article, language);
  const cat = getCategoryLabel(article, language);
  const cc = getCategoryColor(article.category);
  return (
    <Link href={`/news/${article.slug}`} className="group flex min-h-[58px] gap-2 rounded px-1 py-1.5 transition hover:bg-muted/50">
      <div className="relative h-[50px] w-[68px] shrink-0 overflow-hidden rounded-md">
        <ArticleMedia src={article.image} alt={article.title} className="transition duration-300 group-hover:scale-105" />
      </div>
      <div className="min-w-0 flex flex-1 flex-col justify-between">
        <div>
          <span className="rounded px-1.5 py-[2px] text-[8px] font-black leading-none text-white" style={{ background: cc }}>{cat}</span>
          <p className="mt-0.5 line-clamp-2 text-[13.5px] font-black leading-[1.2] text-foreground transition-colors group-hover:text-accent">
            <AutoArticleTitle article={article} language={language} />
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{formatTime(article.publishedAt)}</span>
          <span>{formatDate(article.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

/* --- Story Row (horizontal list view matching user design) ----------------- */
function StoryRow({ article, language }: { article: Article; language: Language }) {
  const title = getArticleTitle(article, language);
  const cc = getCategoryColor(article.category || '');

  // Decide overlay icons for visual interest matching user screenshot
  const categoryLower = article.category?.toLowerCase() || '';
  const showPlay = ['entertainment', 'world', 'politics', 'sports'].includes(categoryLower);
  const showCamera = ['technology', 'business', 'lifestyle', 'crime'].includes(categoryLower);

  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex items-center justify-between gap-4 py-3 hover:bg-muted/40 transition-colors duration-200 first:pt-1 last:pb-1"
    >
      {/* Title (left side) */}
      <h3 className="flex-1 text-[14px] md:text-[15.5px] font-black leading-snug text-foreground transition-colors duration-200 group-hover:text-accent line-clamp-3 pr-2">
        <AutoArticleTitle article={article} language={language} />
      </h3>

      {/* Image Thumbnail (right side) */}
      <div className="relative h-[66px] w-[100px] shrink-0 overflow-hidden rounded-lg border border-border/10 shadow-sm">
        <ArticleMedia
          src={article.image}
          alt={article.title}
          className="transition-transform duration-300 group-hover:scale-105"
        />

        {/* Overlay icon at bottom-left of image */}
        {showPlay && (
          <div className="absolute left-1 bottom-1 bg-red-600 text-white rounded p-1 flex items-center justify-center shadow-lg">
            <Play className="h-3 w-3 fill-current text-white" />
          </div>
        )}
        {showCamera && (
          <div className="absolute left-1 bottom-1 bg-red-600 text-white rounded p-1 flex items-center justify-center shadow-lg">
            <Camera className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    </Link>
  );
}

/* --- Category Row (4-col horizontal) --------------------------------------- */
function CategoryRow({
  title, titleGu, href, articles, language
}: { title: string; titleGu: string; href: string; articles: Article[]; language: Language }) {
  const display = language === 'en' ? title : titleGu;
  return (
    <div>
      <div className="flex items-center justify-between mb-1 border-b border-border pb-1">
        <span className="section-heading text-[18px] md:text-[20px] font-black leading-tight text-foreground">{display}</span>
        <Link href={href} className="flex items-center gap-0.5 text-[13px] md:text-[14px] font-bold text-accent hover:underline">
          {language === 'gu' ? 'બધા જુઓ' : 'View all'} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
        {articles.slice(0, 16).map((art: Article) => {
          const t = getArticleTitle(art, language);
          const cc = getCategoryColor(art.category);
          return (
            <Link key={art.id} href={`/news/${art.slug}`} className="news-card group flex h-[98px] gap-2 overflow-hidden rounded-md border border-border bg-card p-1.5 shadow-sm transition hover:border-accent/40 hover:shadow-md">
              <div className="relative h-full w-[82px] shrink-0 overflow-hidden rounded">
                <ArticleMedia src={art.image} alt={art.title} className="transition group-hover:scale-105" />
              </div>
              <div className="min-w-0 flex flex-1 flex-col justify-between py-1">
                <p className="line-clamp-3 text-[13px] md:text-[13.5px] font-black leading-[1.2] text-foreground transition-colors group-hover:text-accent">
                  <AutoArticleTitle article={art} language={language} />
                </p>
                <div className="flex items-center gap-1 text-[10.5px] leading-none text-muted-foreground border-t border-border/30 pt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: cc }} />
                  <span>{formatTime(art.publishedAt)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* --- Category Row Compact (2-col split layout) ------------------------------ */
/* --- Category Column (4 side-by-side vertical grids) ----------------------- */
function CategoryColumn({
  title, titleGu, href, articles, language, showExcerpt = false
}: {
  title: string;
  titleGu: string;
  href: string;
  articles: Article[];
  language: Language;
  showExcerpt?: boolean;
}) {
  const displayTitle = language === 'en' ? title : titleGu;
  const viewAllText = language === 'gu' ? 'વધુ જુઓ >' : 'View all >';

  if (!articles || articles.length === 0) return null;

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-2.5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/80">
        <div className="flex items-center gap-1.5">
          <span className="h-4 w-[3px] bg-accent shrink-0 rounded-sm" />
          <span className="text-[15px] md:text-[16px] font-black text-foreground">{displayTitle}</span>
        </div>
        <Link href={href} className="text-[11px] font-black text-accent hover:underline">
          {viewAllText}
        </Link>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {articles.slice(0, 4).map((art: Article, idx: number) => {
          const t = getArticleTitle(art, language);
          const excerpt = getArticleExcerpt(art, language);

          if (idx === 0) {
            // First item: larger
            return (
              <Link key={art.id} href={`/news/${art.slug}`} className="group flex gap-2.5 pb-2.5 border-b border-border/40">
                <div className="relative h-[74px] w-[110px] shrink-0 overflow-hidden rounded-md">
                  <ArticleMedia src={art.image} alt={art.title} className="group-hover:scale-105 transition duration-300" />
                </div>
                <div className="min-w-0 flex flex-col justify-between flex-1">
                  <div>
                    <p className="line-clamp-2 text-[12px] font-black leading-snug text-foreground group-hover:text-accent transition duration-200">
                      <AutoArticleTitle article={art} language={language} />
                    </p>
                    {showExcerpt && excerpt && (
                      <p className="line-clamp-2 text-[10.5px] text-muted-foreground leading-normal mt-0.5 font-semibold">
                        <AutoArticleExcerpt article={art} language={language} />
                      </p>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-[9.5px] text-accent font-bold mt-1">
                    <Clock className="h-2.5 w-2.5 text-accent fill-none stroke-[3]" />
                    {formatTime(art.publishedAt)}
                  </span>
                </div>
              </Link>
            );
          } else {
            // Sub-items: smaller
            return (
              <Link key={art.id} href={`/news/${art.slug}`} className="group flex gap-2.5 items-start pb-2 border-b border-border/40 last:border-b-0 last:pb-0 last:mb-0">
                <div className="relative h-[50px] w-[70px] shrink-0 overflow-hidden rounded-md">
                  <ArticleMedia src={art.image} alt={art.title} className="group-hover:scale-105 transition duration-300" />
                </div>
                <div className="min-w-0 flex flex-col justify-between flex-1 min-h-[50px]">
                  <p className="line-clamp-2 text-[11px] font-black leading-snug text-foreground group-hover:text-accent transition duration-200">
                    <AutoArticleTitle article={art} language={language} />
                  </p>
                  <span className="flex items-center gap-1 text-[9.5px] text-accent font-bold mt-0.5">
                    <Clock className="h-2.5 w-2.5 text-accent fill-none stroke-[3]" />
                    {formatTime(art.publishedAt)}
                  </span>
                </div>
              </Link>
            );
          }
        })}
      </div>
    </div>
  );
}

interface SportsCricketScore {
  title: string;
  status: string;
  teams: Array<{ name: string; score: string }>;
}

interface SportsFootballScore {
  id: string;
  league: string;
  status: string;
  home: string;
  away: string;
  homeScore: string;
  awayScore: string;
}

function SportsShowcase({ articles, language }: { articles: Article[]; language: Language }) {
  if (!articles.length) return null;

  const mainArticle = articles[0];
  const listArticles = articles.slice(1, 6);
  const sideArticle = articles[6] ?? articles[4] ?? articles[1] ?? articles[0];

  return (
    <section className="rounded-sm border border-border bg-card px-4 py-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-6 w-[3px] rounded-full bg-accent" />
          <h2 className="text-[18px] font-black leading-none text-foreground">
            {language === 'gu' ? 'રમતગમત' : language === 'hi' ? 'खेल' : 'Sports'}
          </h2>
        </div>
        <Link href="/category/sports" className="text-[11px] font-black text-accent hover:underline">
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.25fr_1.05fr_0.85fr_1.05fr]">
        <SportsFeatureCard article={mainArticle} language={language} label="IPL 2025" large />
        <div className="flex flex-col rounded-md border border-border bg-background">
          {listArticles.map((article) => (
            <SportsListItem key={article.id} article={article} language={language} />
          ))}
        </div>
        <SportsFeatureCard article={sideArticle} language={language} label="ટેનિસ" />
        <SportsScorePanel language={language} />
      </div>
    </section>
  );
}

function SportsFeatureCard({
  article,
  language,
  label,
  large = false,
}: {
  article: Article;
  language: Language;
  label: string;
  large?: boolean;
}) {
  const title = getArticleTitle(article, language);
  const excerpt = getArticleExcerpt(article, language);
  const cc = getCategoryColor(article.category);

  return (
    <Link href={`/news/${article.slug}`} className="group relative block min-h-[210px] overflow-hidden rounded-md bg-slate-950">
      <ArticleMedia
        src={article.image}
        alt={article.title}
        className="transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
      <span
        className="absolute left-3 top-3 rounded px-2.5 py-1 text-[10px] font-black text-white"
        style={{ background: label === 'IPL 2025' ? '#dc2626' : cc }}
      >
        {label}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className={`${large ? 'text-[19px]' : 'text-[15px]'} line-clamp-2 font-black leading-snug`}>
          <AutoArticleTitle article={article} language={language} />
        </h3>
        {large && (
          <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-relaxed text-white/85">
            <AutoArticleExcerpt article={article} language={language} />
          </p>
        )}
        <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-white/85">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(article.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(article.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SportsListItem({ article, language }: { article: Article; language: Language }) {
  const title = getArticleTitle(article, language);
  const cat = getCategoryLabel(article, language);

  return (
    <Link href={`/news/${article.slug}`} className="group flex flex-1 gap-3 border-b border-border p-2.5 last:border-b-0 hover:bg-muted/60">
      <div className="relative h-[70px] w-[96px] shrink-0 overflow-hidden rounded">
        <ArticleMedia src={article.image} alt={article.title} className="transition duration-300 group-hover:scale-105" />
      </div>
      <div className="min-w-0 flex flex-1 flex-col justify-between">
        <div>
          <p className="text-[11px] font-black leading-none text-accent">{cat}</p>
          <p className="mt-1 line-clamp-2 text-[12.5px] font-black leading-snug text-foreground group-hover:text-accent">
            <AutoArticleTitle article={article} language={language} />
          </p>
        </div>
        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {formatDate(article.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {formatTime(article.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SportsScorePanel({ language }: { language: Language }) {
  const [cricket, setCricket] = useState<SportsCricketScore | null>(null);
  const [football, setFootball] = useState<SportsFootballScore[]>([]);

  useEffect(() => {
    setCricket(null);
    setFootball([]);
  }, []);

  const cricketRows = cricket?.teams.length
    ? cricket.teams.slice(0, 2)
    : [
      { name: 'GT', score: '196/4' },
      { name: 'MI', score: '160/8' },
    ];
  const footballRow = football[0];

  return (
    <aside className="rounded-md border border-dashed border-accent/55 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-black text-accent">
          {language === 'en' ? 'Live Score' : 'લાઇવ સ્કોર'}
        </h3>
        <Link href="/live" className="text-[10px] font-black text-accent underline">
          View All
        </Link>
      </div>

      <div className="space-y-2">
        <ScoreBox
          title={cricket?.title ?? 'IPL 2025'}
          rows={cricketRows.map((team) => ({ name: team.name, score: team.score }))}
          status={cricket?.status ?? 'GT won by 36 runs'}
          statusColor="text-emerald-600"
        />
        <ScoreBox
          title={footballRow?.league ?? 'Ranji Trophy'}
          rows={[
            { name: footballRow?.home ?? 'Gujarat', score: footballRow?.homeScore ?? '275/6' },
            { name: footballRow?.away ?? 'Mumbai', score: footballRow?.awayScore ?? '312/10' },
          ]}
          status={footballRow?.status ?? 'Day 2 - Stumps'}
          statusColor="text-accent"
        />
        <ScoreBox
          title="Pro Kabaddi"
          rows={[
            { name: 'GUJ', score: '32' },
            { name: 'BEN', score: '28' },
          ]}
          status="GUJ won"
          statusColor="text-emerald-600"
        />
      </div>
    </aside>
  );
}

function ScoreBox({
  title,
  rows,
  status,
  statusColor,
}: {
  title: string;
  rows: Array<{ name: string; score: string }>;
  status: string;
  statusColor: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 shadow-sm">
      <p className="mb-2 text-[10px] font-black text-sky-600">{title}</p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={`${title}-${row.name}`} className="flex items-center justify-between gap-3 text-[12px] font-black text-foreground">
            <span className="min-w-0 truncate">{row.name}</span>
            <span className="shrink-0">{row.score}</span>
          </div>
        ))}
      </div>
      <p className={`mt-2 text-right text-[10px] font-black ${statusColor}`}>{status}</p>
    </div>
  );
}

/* --- Video Strip ------------------------------------------------------------ */
function VideoStrip({ videos, language }: { videos: typeof VIDEOS; language: Language }) {
  const [playId, setPlayId] = useState<string | null>(null);

  const activeVideo = videos.find(v => v.id === playId);
  return (
    <div>
      {/* Modal Overlay */}
      {playId && activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4 py-6"
          onClick={() => setPlayId(null)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-black/80 px-4 py-3 backdrop-blur-sm">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{getLocalized(language, { en: activeVideo.title, gu: activeVideo.titleGu, hi: activeVideo.titleHi })}</p>
                <p className="text-xs text-white/70">{getLocalized(language, { en: 'Gujarat Post', gu: 'ગુજરાત પોસ્ટ', hi: 'गुजरात पोस्ट' })}</p>
              </div>
              <button
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-white/15"
                onClick={() => setPlayId(null)}
              >
                Close
              </button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${safeYouTubeId(activeVideo.youtubeId)}?autoplay=1&rel=0`}
                title={getLocalized(language, { en: activeVideo.title, gu: activeVideo.titleGu, hi: activeVideo.titleHi })}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="bg-[#e02020] text-white text-[13px] font-extrabold px-3 py-1 rounded-sm select-none">
          {language === 'gu' ? 'વીડિયો' : language === 'hi' ? 'वीडियो' : 'Videos'}
        </span>
        <Link
          href="/videos"
          className="text-[#e02020] text-sm font-bold hover:underline flex items-center gap-1"
        >
          {language === 'gu' ? 'બધા જુઓ' : 'View All'} →
        </Link>
      </div>
      {/* Underline */}
      <div className="h-[2.5px] w-full bg-black mb-5" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {videos.map((v) => (
          <div key={v.id} className="overflow-hidden rounded-xl border border-border/10 bg-card shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
            <div className="relative aspect-video overflow-hidden bg-slate-950">
              {playId === v.id ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${safeYouTubeId(v.youtubeId)}?autoplay=1&rel=0`}
                  title={getLocalized(language, { en: v.title, gu: v.titleGu, hi: v.titleHi })}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="group/v relative h-full w-full cursor-pointer" onClick={() => setPlayId(v.id)}>
                  <Image src={v.thumbnail} alt={v.title} fill sizes="20vw" className="object-cover transition duration-300 group-hover/v:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover/v:opacity-100">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-xl transition-transform duration-300 group-hover/v:scale-110">
                      <Play className="h-4 w-4 fill-current" />
                    </span>
                  </div>
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                    {v.duration}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-[12.5px] font-bold leading-snug text-foreground">
                {getLocalized(language, { en: v.title, gu: v.titleGu, hi: v.titleHi })}
              </p>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2 font-semibold">
                <Eye className="h-3 w-3" />{formatViews(v.views)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- Live TV Widget --------------------------------------------------------- */
interface LiveTVWidgetProps { language: Language; videoMode: 'latest' | 'live'; setVideoMode: (m: 'latest' | 'live') => void; }
function LiveTVWidget({ language, videoMode, setVideoMode }: LiveTVWidgetProps) {
  const [liveStatus, setLiveStatus] = useState<'checking' | 'live' | 'offline'>('checking');
  useEffect(() => {
    setLiveStatus('offline');
    setVideoMode('latest');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const isLive = liveStatus === 'live';
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between bg-accent px-3 py-1">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[12px] md:text-sm font-black text-white uppercase tracking-wide">
            {language === 'gu' ? 'લાઈવ ટીવી' : 'Live TV'}
          </span>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setVideoMode('latest')}
            className={`rounded px-2.5 py-0.5 text-[10px] md:text-xs font-black transition cursor-pointer ${videoMode === 'latest' ? 'bg-white text-accent' : 'text-white/80 hover:text-white'}`}>
            {language === 'gu' ? 'તાજા' : 'Latest'}
          </button>
          {isLive && (
            <button type="button" onClick={() => setVideoMode('live')}
              className={`rounded px-2.5 py-0.5 text-[10px] md:text-xs font-black transition cursor-pointer ${videoMode === 'live' ? 'bg-white text-accent' : 'text-white/80 hover:text-white'}`}>
              LIVE
            </button>
          )}
        </div>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        <iframe key={videoMode} className="absolute inset-0 h-full w-full"
          src={videoMode === 'live'
            ? `https://www.youtube.com/embed/live_stream?channel=${CHANNEL_ID}&autoplay=1&mute=1&rel=0`
            : `https://www.youtube.com/embed/${LATEST_VIDEO_ID}?autoplay=1&mute=1&rel=0&modestbranding=1`}
          title="Gujarat Post Live"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-1">
        <div className="flex items-center gap-1.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-[10px] md:text-xs font-black text-white">GP</span>
          <p className="text-xs md:text-sm font-black text-foreground">Gujarat Post</p>
        </div>
        <a href={CHANNEL_URL} target="_blank" rel="noreferrer"
          className="rounded bg-[#ff0000] px-3 py-1 text-[10px] md:text-xs font-black text-white hover:bg-red-600 transition">
          {language === 'gu' ? 'સબ્સ.' : 'Subscribe'}
        </a>
      </div>
    </div>
  );
}

/* --- Weather Widget --------------------------------------------------------- */
function WeatherWidget({ language }: { language: Language }) {
  const [weather, setWeather] = useState<Array<{ city: string; state: string; temperature: number; condition: string; humidity: number; windSpeed: number }> | null>(null);
  useEffect(() => {
    const FALLBACK_WEATHER = [
      { city: 'Ahmedabad', state: 'Gujarat', temperature: 32, condition: 'Partly cloudy', humidity: 65, windSpeed: 12 },
      { city: 'Vadodara', state: 'Gujarat', temperature: 31, condition: 'Sunny', humidity: 62, windSpeed: 10 }
    ];
    setWeather(FALLBACK_WEATHER);
  }, []);
  const label = language === 'gu' ? 'હવામાન' : language === 'hi' ? 'मौसम' : 'Weather';
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
        <span className="text-xs md:text-sm font-black text-foreground">{label}</span>
        {/* <span className="text-[10px] md:text-[11px] font-semibold uppercase text-accent tracking-wide">Ahmedabad · Gandhinagar · Vadodara</span> */}
      </div>
      {!weather ? (
        <div className="py-8 text-center text-sm font-semibold text-muted-foreground">Loading weather…</div>
      ) : weather.length === 0 ? (
        <div className="py-8 text-center text-sm font-semibold text-muted-foreground">Weather unavailable</div>
      ) : (
        <div className="space-y-3">
          {(Array.isArray(weather) ? weather.slice(0, 2) : []).map((item) => (
            <div key={item.city} className="rounded-2xl border border-border/80 bg-card p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-foreground">{item.city}</p>
                  <p className="text-[11px] text-muted-foreground">{item.condition}</p>
                </div>
                <span className="text-3xl font-black text-accent">{item.temperature}°C</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                <div className="rounded-xl bg-muted p-2 text-center">
                  <p className="font-semibold text-foreground">Humidity</p>
                  <p>{item.humidity}%</p>
                </div>
                <div className="rounded-xl bg-muted p-2 text-center">
                  <p className="font-semibold text-foreground">Wind</p>
                  <p>{item.windSpeed} km/h</p>
                </div>
                <div className="rounded-xl bg-muted p-2 text-center">
                  <p className="font-semibold text-foreground">Feels like</p>
                  <p>{item.temperature}°C</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- E-Paper Widget --------------------------------------------------------- */
function EPaperWidget({ language }: { language: Language }) {
  const label = language === 'gu' ? 'ઈ-પેપર' : 'E-Paper';
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between border-b border-border pb-1 mb-1.5">
        <span className="text-xs md:text-sm font-black text-foreground">{label}</span>
        <span className="text-[11px] md:text-xs text-accent font-bold">
          {language === 'gu' ? 'ઓનલાઈન વાંચો' : 'Read Online'}
        </span>
      </div>
      <Link href="/epaper" className="group flex items-center gap-3 hover:opacity-80 transition">
        <div className="relative h-[90px] w-[80px] shrink-0 overflow-hidden rounded border border-border shadow-md">
          <Image
            src="https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=200&q=80"
            alt="E-Paper"
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm md:text-base font-black text-foreground leading-snug">Gujarat Post</p>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="pt-1">
            <span
              className="inline-flex items-center gap-1 rounded bg-accent px-3 py-1 text-[10px] md:text-xs font-black text-white transition hover:bg-accent/90 shadow-sm">
              {language === 'gu' ? 'PDF ડાઉનલોડ' : 'PDF Download'}
            </span>
          </div>
        </div>
      </Link>
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

const mockPoliticsColumns = [
  {
    colId: 'pol-col-1',
    featured: {
      id: 'pol-feat-1',
      slug: 'gujarat-election-2027-preparations-active-501',
      image: '/assets/demo/4.jpg',
      categoryGu: 'ચૂંટણી',
      titleGu: 'ગુજરાત ચૂંટણી 2027 નજીક! જિલ્લાઓમાં તૈયારીઓ તેજ, સત્તાધારી પક્ષ સક્રિય',
      relativeTimeGu: '1 કલાક પહેલાં',
      views: 71000
    },
    subs: [
      {
        id: 'pol-sub-1-1',
        slug: 'delhi-politics-seat-sharing-talks-500',
        titleGu: 'સીટ શેરીંગ ફોર્મ્યુલા નક્કી: ગઠબંધન પક્ષો વચ્ચે બેઠકોની વહેંચણી ફાઈનલ'
      },
      {
        id: 'pol-sub-1-2',
        slug: 'state-assembly-speaker-rules-501',
        titleGu: 'વિધાનસભા સ્પીકરની ચેતવણી: તમામ સભ્યોને ગૃહની ગરિમા જાળવવા આદેશ'
      },
      {
        id: 'pol-sub-1-3',
        slug: 'government-policy-infrastructure-development-502',
        titleGu: 'નવા ઇન્ફ્રાસ્ટ્રક્ચર પ્રોજેક્ટ્સને મંજૂરી: રાજ્ય સરકારનો મોટો નિર્ણય'
      }
    ]
  },
  {
    colId: 'pol-col-2',
    featured: {
      id: 'pol-feat-2',
      slug: 'aap-ground-network-expansion-gujarat-502',
      image: '/assets/demo/1.jpg',
      categoryGu: 'AAP',
      titleGu: 'AAPનો મોટો દાવો! ગ્રામ્ય ગુજરાતમાં ભૂ-સ્તરીય નેટવર્ક વિસ્તાર્યું',
      relativeTimeGu: '2 કલાક પહેલાં'
    },
    subs: [
      {
        id: 'pol-sub-2-1',
        slug: 'ahmedabad-municipal-commissioner-dispute-503',
        titleGu: 'મોટો વિવાદ! અમદાવાદ મ્યુનિ. કમિશનરે તંત્ર સામે વાંધો ઉઠાવ્યો'
      },
      {
        id: 'pol-sub-2-2',
        slug: 'military-training-irregularities-promotions-cancelled-504',
        titleGu: 'સૈન્ય તાલીમમાં મોટી ગેરરીતિ! 100થી વધુ પ્રમોશન રદ કરાયા'
      },
      {
        id: 'pol-sub-2-3',
        slug: 'congress-unveils-strategy-2027-election-505',
        titleGu: 'કોંગ્રેસે ખોલ્યા પત્તા! 2027 ચૂંટણી ઝુંબેશ વ્યુહ જાહેર કર્યો'
      }
    ]
  },
  {
    colId: 'pol-col-3',
    featured: {
      id: 'pol-feat-3',
      slug: 'assembly-monsoon-session-commotion-unemployment-506',
      image: '/assets/demo/3.jpg',
      categoryGu: 'વિધાનસભા',
      titleGu: 'વિધાનસભા ચોમાસુ સત્રમાં હોબાળો! વિપક્ષે બેરોજગારી મુદ્દે સ્થગન પ્રસ્તાવ આપ્યો',
      relativeTimeGu: '3 કલાક પહેલાં'
    },
    subs: [
      {
        id: 'pol-sub-3-1',
        slug: 'high-court-notice-state-govt-recruitment-507',
        titleGu: 'હાઈકોર્ટની આકરી નોટિસ! રાજ્ય સરકારને ભરતી પ્રક્રિયા અંગે જવાબ માંગ્યો'
      },
      {
        id: 'pol-sub-3-2',
        slug: 'union-minister-gujarat-visit-industrial-corridor-announcement-508',
        titleGu: 'કેન્દ્રીય મંત્રીની ગુજરાત મુલાકાત! નવા ઔદ્યોગિક કોરિડોરની જાહેરાત શક્ય'
      },
      {
        id: 'pol-sub-3-3',
        slug: 'voter-list-revision-campaign-starts-online-registration-appeal-509',
        titleGu: 'મતદાર યાદી સુધારણા ઝુંબેશ શરૂ! નાગરિકોને ઓનલાઈન નોંધણીની અપીલ'
      }
    ]
  }
];

const mockPoliticsBottomCards = [
  {
    id: 'pol-bot-1',
    slug: 'cm-meeting-vibrant-gujarat-rural-development-511',
    image: '/assets/demo/5.jpg',
    categoryGu: 'મુખ્યમંત્રી',
    titleGu: 'CMની મોટી બેઠક! વિકાસ પ્રોજેક્ટ માટે સમીક્ષા, ગ્રામીણ વિસ્તારો પર ભાર',
    relativeTimeGu: '2 કલાક પહેલાં',
    views: 74000
  },
  {
    id: 'pol-bot-2',
    slug: 'bjp-state-executive-meeting-organization-expansion-512',
    image: '/assets/demo/6.jpg',
    categoryGu: 'ભાજપ',
    titleGu: 'ભાજપ પ્રદેશ કારોબારીની બેઠકમાં સંગઠન વિસ્તરણ પર મોટી ચર્ચા',
    relativeTimeGu: '3 કલાક પહેલાં',
    views: 78000
  },
  {
    id: 'pol-bot-3',
    slug: 'police-recruitment-10000-posts-513',
    image: '/assets/demo/2.jpg',
    categoryGu: 'ગૃહ વિભાગ',
    titleGu: 'યુવાનો માટે મોટી તક! પોલીસ ભરતીમાં 10,000 જગ્યાઓ ટૂંક સમયમાં ભરાશે',
    relativeTimeGu: '12 કલાક પહેલાં',
    views: 33000
  },
  {
    id: 'pol-bot-4',
    slug: 'municipal-corporation-election-ward-delimitation-514',
    image: '/assets/demo/3.jpg',
    categoryGu: 'સ્થાનિક સ્વરાજ્ય',
    titleGu: 'મહાનગરપાલિકા ચૂંટણી નજીક! વોર્ડ સીમાંકનની પ્રક્રિયા શરૂ',
    relativeTimeGu: '13 કલાક પહેલાં',
    views: 46000
  },
  {
    id: 'pol-bot-5',
    slug: 'alliance-possibility-before-next-election-515',
    image: '/assets/demo/7.jpg',
    categoryGu: 'ગઠબંધન',
    titleGu: 'આગામી ચૂંટણી પહેલાં મોટી હલચલ! નાના પક્ષો વચ્ચે ગઠબંધનની શક્યતાઓ તપાસાઈ રહી છે',
    relativeTimeGu: '14 કલાક પહેલાં',
    views: 52000
  },
  {
    id: 'pol-bot-6',
    slug: 'gujarat-assembly-session-dates-declared-516',
    image: '/assets/demo/4.jpg',
    categoryGu: 'વિધાનસભા',
    titleGu: 'વિધાનસભાનું ચોમાસું સત્ર ટૂંક સમયમાં યોજાશે! મહત્વના વિધેયકો રજૂ થવાની શક્યતા',
    relativeTimeGu: '15 કલાક પહેલાં',
    views: 61000
  }
];

/* --- Politics Section ("રાજકારણ" Zone) ----------------------------- */
export function PoliticsSection({ language }: { language: Language }) {
  const [dbPoliticsArticles, setDbPoliticsArticles] = useState<Article[]>([]);

  useEffect(() => {
    getPublicArticles({ categorySlug: 'politics', limit: 12 }).then((res) => {
      if (res && res.articles && res.articles.length > 0) {
        setDbPoliticsArticles(res.articles);
      }
    });
  }, []);

  const top3 = useMemo(() => {
    const list: Array<{ id: string; slug: string; image: string; article: Article | null; titleGu: string; categoryGu: string; time: string }> = [];
    dbPoliticsArticles.slice(0, 3).forEach((art) => {
      list.push({
        id: art.id,
        slug: art.slug,
        image: art.image || DEMO_IMAGES[0],
        categoryGu: art.categoryGu || art.category || 'રાજકારણ',
        article: art,
        titleGu: art.titleGu || art.title,
        time: formatTime(art.publishedAt),
      });
    });
    if (list.length < 3) {
      mockPoliticsColumns.forEach((col) => {
        if (list.length < 3 && !list.some((item) => item.id === col.featured.id)) {
          list.push({
            id: col.featured.id,
            slug: col.featured.slug,
            image: col.featured.image,
            categoryGu: col.featured.categoryGu,
            article: null,
            titleGu: col.featured.titleGu,
            time: getMockRelativeTime(col.featured.relativeTimeGu, language),
          });
        }
      });
    }
    return list;
  }, [dbPoliticsArticles, language]);

  const bottomGrid = useMemo(() => {
    const list: Array<{ id: string; slug: string; image: string; article: Article | null; titleGu: string; categoryGu: string; time: string }> = [];
    dbPoliticsArticles.slice(3, 9).forEach((art) => {
      list.push({
        id: art.id,
        slug: art.slug,
        image: art.image || DEMO_IMAGES[1],
        categoryGu: art.categoryGu || art.category || 'રાજકારણ',
        article: art,
        titleGu: art.titleGu || art.title,
        time: formatTime(art.publishedAt),
      });
    });
    if (list.length < 6) {
      mockPoliticsBottomCards.forEach((card) => {
        if (list.length < 6 && !list.some((item) => item.id === card.id)) {
          list.push({
            id: card.id,
            slug: card.slug,
            image: card.image,
            categoryGu: card.categoryGu,
            article: null,
            titleGu: card.titleGu,
            time: getMockRelativeTime(card.relativeTimeGu, language),
          });
        }
      });
    }
    return list;
  }, [dbPoliticsArticles, language]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-8">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-6">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'રાજકારણ' : language === 'hi' ? 'राजनीति' : 'Politics'}
        </span>
        <Link
          href="/category/politics"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More →'}
        </Link>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {top3.map((card) => (
          <div key={card.id} className="flex flex-col min-w-0">
            <div className="flex flex-col min-w-0">
              <Link
                href={`/news/${card.slug}`}
                className="group flex flex-col mb-2.5"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5">
                  <ArticleMedia
                    src={card.image}
                    alt={card.titleGu}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="text-[#B3121B] font-extrabold text-[12px] md:text-[13px] mb-1.5 select-none uppercase">
                  <AutoTranslateString text={card.categoryGu} language={language} />
                </span>
                <h3 className="text-[14px] md:text-[15.5px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2 min-h-[40px] md:min-h-[46px]">
                  {card.article
                    ? <AutoArticleTitle article={card.article} language={language} />
                    : <AutoTranslateString text={card.titleGu} language={language} />}
                </h3>
              </Link>

              {/* Clock Meta Row */}
              <div className="flex items-center gap-1.5 mb-1 pb-2 border-b border-border/40 text-[10.5px] text-muted-foreground font-semibold">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>{card.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 6-Card Politics Bottom Grid — Perfect 2x3 on Mobile, 3x2 on Tablet, 6-Col on Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 border-t border-border/40 pt-6 mt-6">
        {bottomGrid.map((card, idx) => {
          const isLastOdd = bottomGrid.length % 2 !== 0 && idx === bottomGrid.length - 1;
          return (
            <div
              key={card.id}
              className={`flex flex-col min-w-0 ${isLastOdd ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <Link
                href={`/news/${card.slug}`}
                className={`group flex ${isLastOdd ? 'flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0' : 'flex-col'}`}
              >
                <div className={`relative aspect-[16/10] overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5 ${isLastOdd ? 'w-28 sm:w-full h-20 sm:h-auto shrink-0 mb-0 sm:mb-2.5' : 'w-full'}`}>
                  <ArticleMedia
                    src={card.image}
                    alt={card.titleGu}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[#B3121B] font-extrabold text-[11px] mb-1 select-none uppercase leading-none">
                    <AutoTranslateString text={card.categoryGu} language={language} />
                  </span>
                  <h4 className="text-[12.5px] md:text-[13px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
                    {card.article
                      ? <AutoArticleTitle article={card.article} language={language} />
                      : <AutoTranslateString text={card.titleGu} language={language} />}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-2 text-[10.5px] text-muted-foreground font-semibold">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span>{card.time}</span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const mockFactCheckList = [
  {
    id: 'fc-1',
    slug: 'viral-video-not-from-gujarat-floods-521',
    image: '/assets/demo/2.jpg',
    status: 'misleading', // ભ્રામક
    statusLabelGu: 'ભ્રામક',
    titleGu: 'સાવધાન! વાયરલ વીડિયો ગુજરાતના પૂરનો નથી, જૂનો અને અલગ રાજ્યનો છે'
  },
  {
    id: 'fc-2',
    slug: 'gujarat-farmer-support-scheme-amount-increased-522',
    image: '/assets/demo/1.jpg',
    status: 'true', // સાચું
    statusLabelGu: 'સાચું',
    titleGu: 'હા, રાજ્યમાં ખેડૂત સહાય યોજનાની રકમમાં ખરેખર વધારો કરાયો છે!'
  },
  {
    id: 'fc-3',
    slug: 'social-media-petrol-price-fake-523',
    image: '/assets/demo/8.jpg',
    status: 'fake', // ખોટો દાવો
    statusLabelGu: 'ખોટો દાવો',
    titleGu: 'સોશિયલ મીડિયા પર ફરતો મેસેજ: "કાલથી પેટ્રોલ ₹50 થશે" – જાણો હકીકત'
  },
  {
    id: 'fc-4',
    slug: 'schools-closed-next-week-rumor-busted-524',
    image: '/assets/demo/3.jpg',
    status: 'misleading', // ભ્રામક
    statusLabelGu: 'ભ્રામક',
    titleGu: 'શું ખરેખર રાજ્યમાં તમામ શાળાઓ આગામી સપ્તાહથી બંધ રહેશે? જાણો સાચી વિગત'
  },
  {
    id: 'fc-5',
    slug: 'senior-citizens-bus-fare-discount-true-525',
    image: '/assets/demo/6.jpg',
    status: 'true', // સાચું
    statusLabelGu: 'સાચું',
    titleGu: 'હા, રાજ્ય સરકારે વરિષ્ઠ નાગરિકો માટે બસ ભાડામાં ખરેખર છૂટ જાહેર કરી છે'
  },
  {
    id: 'fc-6',
    slug: 'whatsapp-new-bank-rules-message-fake-526',
    image: '/assets/demo/7.jpg',
    status: 'fake', // ખોટો દાવો
    statusLabelGu: 'ખોટો દાવો',
    titleGu: 'વોટ્સએપ પર ફરતો "નવો બેંક નિયમ" મેસેજ ખોટો, RBIએ કર્યો ઈનકાર'
  },
  {
    id: 'fc-7',
    slug: 'ahmedabad-bridge-collapse-image-from-other-country-527',
    image: '/assets/demo/4.jpg',
    status: 'misleading', // ભ્રામક
    statusLabelGu: 'ભ્રામક',
    titleGu: 'એ તસવીર અમદાવાદ પુલ તૂટવાની નથી, ત્રણ વર્ષ જૂની અને બીજા દેશની છે'
  },
  {
    id: 'fc-8',
    slug: 'online-registration-new-job-recruitment-starts-528',
    image: '/assets/demo/5.jpg',
    status: 'true', // સાચું
    statusLabelGu: 'સાચું',
    titleGu: 'હા, રાજ્યમાં નવી રોજગાર ભરતી માટે ઓનલાઈન અરજી ખરેખર શરૂ થઈ ગઈ છે'
  }
];

/* --- Fact Check Section ("ફેક્ટ ચેક" Zone) ----------------------------- */
export function FactCheckSection({ language }: { language: Language }) {
  const [factCheckArticles, setFactCheckArticles] = useState<Article[]>([]);

  useEffect(() => {
    getPublicArticles({ categorySlug: 'fact-check', limit: 9 }).then((res) => {
      if (res && res.articles && res.articles.length > 0) {
        setFactCheckArticles(res.articles);
      } else {
        getPublicArticles({ categorySlug: 'factcheck', limit: 9 }).then((res2) => {
          if (res2 && res2.articles && res2.articles.length > 0) {
            setFactCheckArticles(res2.articles);
          }
        });
      }
    });
  }, []);

  const getStatusInfo = (art: any) => {
    const tagStr = (art.tagsGu?.[0] || art.tags?.[0] || art.titleGu || art.title || '').toLowerCase();
    if (tagStr.includes('સાચું') || tagStr.includes('true') || tagStr.includes('સત્ય')) {
      return { labelGu: 'સાચું', labelEn: 'TRUE', color: 'text-green-600' };
    }
    if (tagStr.includes('ભ્રામક') || tagStr.includes('misleading') || tagStr.includes('અધૂરું')) {
      return { labelGu: 'ભ્રામક', labelEn: 'MISLEADING', color: 'text-yellow-600' };
    }
    return { labelGu: 'ખોટો દાવો', labelEn: 'FAKE CLAIM', color: 'text-red-600' };
  };

  const hasDb = factCheckArticles.length > 0;
  const featArt = hasDb ? factCheckArticles[0] : null;
  const gridDbList = hasDb ? factCheckArticles.slice(1, 9) : [];

  const featStatus = featArt ? getStatusInfo(featArt) : { labelGu: 'ખોટો દાવો', labelEn: 'FAKE CLAIM', color: 'text-red-600' };
  const featTitle = featArt ? getLocalized(language, { en: featArt.title, gu: featArt.titleGu || featArt.title, hi: (featArt as any).titleHi || featArt.title }) : (
    language === 'gu'
      ? 'શું સરકારે ખરેખર બધા વિદ્યાર્થીઓને મફત લેપટોપ આપવાની જાહેરાત કરી? જાણો સત્ય'
      : 'Did government really announce free laptops for all students? Know truth'
  );
  const featExcerpt = featArt ? stripHtmlTags(getLocalized(language, { en: featArt.excerpt, gu: featArt.excerptGu || featArt.excerpt, hi: (featArt as any).excerptHi || featArt.excerpt })) : (
    language === 'gu'
      ? 'ગુજરાત પોસ્ટની તપાસમાં જાણવા મળ્યું કે વાયરલ પરિપત્ર બનાવટી છે – શિક્ષણ વિભાગે આવી કોઈ જાહેરાત કરી નથી.'
      : 'Gujarat Post investigation revealed that the viral circular is fake – the education department has made no such announcement.'
  );
  const featSlug = featArt ? featArt.slug : 'fake-news-alert-free-laptop-scheme-circular-busted-520';
  const featImage = featArt?.image || '/assets/demo/5.jpg';
  const featTime = featArt ? formatTime(featArt.publishedAt) : (language === 'gu' ? '1 કલાક પહેલાં' : '1 hour ago');

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-10">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-6">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[19px] md:text-[21px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'ફેક્ટ  ચેક' : language === 'hi' ? 'तथ्य  जांच' : 'Fact  Check'}
        </span>
        <Link
          href="/category/fact-check"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[15px] md:text-[16px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More →'}
        </Link>
      </div>

      {/* Grid: 3 columns layout (1 column for featured, 2 columns for list grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Column: Big Featured Fact Check Card (Spans 1 column on desktop) */}
        <div className="lg:col-span-1 flex flex-col min-w-0">
          <Link
            href={`/news/${featSlug}`}
            className="group flex flex-col"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-3.5">
              <Image
                src={featImage}
                alt="Fact Check Featured"
                fill
                sizes="(max-width: 1024px) 100vw, 35vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span className={`flex items-center gap-1 font-extrabold text-[12px] md:text-[13px] mb-1.5 select-none uppercase tracking-wide ${featStatus.color}`}>
              <span className="text-[10px]">●</span>
              {language === 'gu' ? featStatus.labelGu : featStatus.labelEn}
            </span>
            <h3 className="text-[15px] md:text-[16px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
              {featTitle}
            </h3>
            <p className="text-muted-foreground text-[12.5px] leading-relaxed mt-2.5 line-clamp-3 select-none">
              {featExcerpt}
            </p>
          </Link>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground font-semibold">
            <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>{featTime}</span>
          </div>
        </div>

        {/* Right Column: Grid of 8 Fact Check items (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 lg:pt-0">
          {hasDb && gridDbList.length > 0 ? (
            gridDbList.map((item) => {
              const st = getStatusInfo(item);
              const title = getLocalized(language, { en: item.title, gu: item.titleGu || item.title, hi: (item as any).titleHi || item.title });
              return (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="group flex gap-4 hover:bg-muted/10 transition-colors p-1"
                >
                  {/* Image Left */}
                  <div className="relative h-[68px] w-[100px] shrink-0 overflow-hidden rounded-sm border border-border/10 bg-muted">
                    <Image
                      src={item.image || '/assets/demo/2.jpg'}
                      alt={title}
                      fill
                      sizes="100px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Content Right */}
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    {/* Status Dot + Category Label */}
                    <div className="flex mb-1">
                      <span className={`flex items-center gap-1 text-[11px] font-black select-none leading-none uppercase ${st.color}`}>
                        <span className="text-[10px]">●</span>
                        {language === 'gu' ? st.labelGu : st.labelEn}
                      </span>
                    </div>
                    <h4 className="text-[12.5px] md:text-[13px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                      {title}
                    </h4>
                  </div>
                </Link>
              );
            })
          ) : (
            mockFactCheckList.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="group flex gap-4 hover:bg-muted/10 transition-colors p-1"
              >
                {/* Image Left */}
                <div className="relative h-[68px] w-[100px] shrink-0 overflow-hidden rounded-sm border border-border/10 bg-muted">
                  <Image
                    src={item.image}
                    alt={item.titleGu}
                    fill
                    sizes="100px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Content Right */}
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  {/* Status Dot + Category Label */}
                  <div className="flex mb-1">
                    <span className={`flex items-center gap-1 text-[11px] font-black select-none leading-none uppercase ${item.status === 'true'
                      ? 'text-green-600'
                      : item.status === 'fake'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                      }`}>
                      <span className="text-[10px]">●</span>
                      {language === 'gu' ? item.statusLabelGu : item.status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-[12.5px] md:text-[13px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                    {getMockTitle(item, language)}
                  </h4>
                </div>
              </Link>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

const mockNationalColumns = [
  {
    colId: 'nat-col-1',
    featured: {
      id: 'nat-feat-1',
      slug: 'parliament-monsoon-session-starts-today-531',
      image: '/assets/demo/2.jpg',
      titleGu: 'સંસદનું ચોમાસુ સત્ર આજથી! અનેક મોટા ખરડા પર થશે ઘમાસાણ',
      relativeTimeGu: '1 કલાક પહેલાં',
      views: 74000
    },
    subs: [
      {
        id: 'nat-sub-1-1',
        slug: 'gdp-growth-exceeds-estimate-532',
        image: '/assets/demo/7.jpg',
        titleGu: 'ખુશખબર! GDP વૃદ્ધિ દર અંદાજ કરતાં વધુ નોંધાયો',
        relativeTimeGu: '2 કલાક પહેલાં',
        views: 78000
      },
      {
        id: 'nat-sub-1-2',
        slug: 'two-new-vande-bharat-trains-flagged-off-533',
        image: '/assets/demo/8.jpg',
        titleGu: 'બે નવી વંદે ભારત ટ્રેનોને લીલી ઝંડી, જાણો રૂટ',
        relativeTimeGu: '3 કલાક પહેલાં',
        views: 81000
      },
      {
        id: 'nat-sub-1-3',
        slug: 'central-government-announcement-millions-benefit-534',
        image: '/assets/demo/4.jpg',
        titleGu: 'કેન્દ્ર સરકારની મોટી જાહેરાત! નવી યોજનાથી કરોડો લોકોને લાભ',
        relativeTimeGu: '4 કલાક પહેલાં',
        views: 60000
      }
    ]
  },
  {
    colId: 'nat-col-2',
    featured: {
      id: 'nat-feat-2',
      slug: 'new-education-policy-second-phase-implementation-535',
      image: '/assets/demo/5.jpg',
      titleGu: 'નવી રાષ્ટ્રીય શિક્ષણ નીતિનો બીજો તબક્કો આગામી સત્રથી લાગુ, જાણો શું બદલાશે',
      relativeTimeGu: '5 કલાક પહેલાં',
      views: 110000
    },
    subs: [
      {
        id: 'nat-sub-2-1',
        slug: 'indian-army-indigenous-defense-equipment-536',
        image: '/assets/demo/6.jpg',
        titleGu: 'ભારતીય સેનાને મળી મોટી તાકાત! સ્વદેશી બનાવટનું નવું સંરક્ષણ સાધન સામેલ',
        relativeTimeGu: '6 કલાક પહેલાં',
        views: 120000
      },
      {
        id: 'nat-sub-2-2',
        slug: 'supreme-court-historic-judgment-impact-millions-537',
        image: '/assets/demo/1.jpg',
        titleGu: 'સુપ્રીમ કોર્ટનો મોટો ચુકાદો! લાખો કેસોને સીધી અસર',
        relativeTimeGu: '7 કલાક પહેલાં',
        views: 140000,
        isHighlighted: true
      },
      {
        id: 'nat-sub-2-3',
        slug: 'new-health-insurance-scheme-announced-538',
        image: '/assets/demo/8.jpg',
        titleGu: 'કરોડો લોકોને ફાયદો! કેન્દ્રે જાહેર કરી નવી આરોગ્ય વીમા યોજના',
        relativeTimeGu: '8 કલાક પહેલાં',
        views: 160000
      }
    ]
  },
  {
    colId: 'nat-col-3',
    featured: {
      id: 'nat-feat-3',
      slug: 'farmers-good-news-new-msp-declared-539',
      image: '/assets/demo/5.jpg',
      titleGu: 'ખેડૂતો માટે ખુશખબર! નવી MSP જાહેર, કઠોળના ભાવમાં વધારો',
      relativeTimeGu: '6 કલાક પહેલાં',
      views: 12000
    },
    subs: [
      {
        id: 'nat-sub-3-1',
        slug: '6g-trials-start-in-india-testing-soon-540',
        image: '/assets/demo/7.jpg',
        titleGu: 'દેશમાં 6G ટ્રાયલ શરૂ! ટૂંક સમયમાં પસંદગીના શહેરોમાં ટેસ્ટિંગ',
        relativeTimeGu: '10 કલાક પહેલાં',
        views: 27000
      },
      {
        id: 'nat-sub-3-2',
        slug: 'women-entrepreneurs-loan-scheme-zero-interest-541',
        image: '/assets/demo/4.jpg',
        titleGu: 'મહિલા ઉદ્યોગ સાહસિકો માટે મોટી રાહત! નવી લોન યોજનામાં 0% વ્યાજ',
        relativeTimeGu: '11 કલાક પહેલાં',
        views: 33000
      },
      {
        id: 'nat-sub-3-3',
        slug: 'new-expressway-network-approved-connect-10-cities-542',
        image: '/assets/demo/8.jpg',
        titleGu: 'દેશના 10 મોટા શહેરોને જોડતો નવો એક્સપ્રેસવે નેટવર્ક મંજૂર!',
        relativeTimeGu: '12 કલાક પહેલાં',
        views: 46000
      }
    ]
  }
];

/* --- National Section ("દેશ" Zone) ----------------------------- */
export function NationalSection({ language }: { language: Language }) {
  const [dbNationalArticles, setDbNationalArticles] = useState<Article[]>([]);

  useEffect(() => {
    // Fetch national articles directly with categorySlug filter so we get all of them
    getPublicArticles({ categorySlug: 'national', limit: 12 }).then((res) => {
      if (res && res.articles && res.articles.length > 0) {
        setDbNationalArticles(res.articles);
      }
    });
  }, []);

  const top3 = useMemo(() => {
    const list: Array<{ id: string; slug: string; image: string; article: Article | null; titleGu: string; time: string }> = [];
    dbNationalArticles.slice(0, 3).forEach((art) => {
      list.push({
        id: art.id,
        slug: art.slug,
        image: art.image || DEMO_IMAGES[0],
        article: art,
        titleGu: art.titleGu || art.title,
        time: formatTime(art.publishedAt),
      });
    });
    if (list.length < 3) {
      mockNationalColumns.forEach((col) => {
        if (list.length < 3 && !list.some((item) => item.id === col.featured.id)) {
          list.push({ id: col.featured.id, slug: col.featured.slug, image: col.featured.image, article: null, titleGu: col.featured.titleGu, time: getMockRelativeTime(col.featured.relativeTimeGu, language) });
        }
      });
    }
    return list;
  }, [dbNationalArticles]);

  const bottomGrid = useMemo(() => {
    const list: Array<{ id: string; slug: string; image: string; article: Article | null; titleGu: string; time: string }> = [];
    dbNationalArticles.slice(3, 12).forEach((art) => {
      list.push({
        id: art.id,
        slug: art.slug,
        image: art.image || DEMO_IMAGES[1],
        article: art,
        titleGu: art.titleGu || art.title,
        time: formatTime(art.publishedAt),
      });
    });
    if (list.length < 9) {
      mockNationalColumns.forEach((col) => {
        col.subs.forEach((sub) => {
          if (list.length < 9 && !list.some((item) => item.id === sub.id)) {
            list.push({ id: sub.id, slug: sub.slug, image: sub.image, article: null, titleGu: sub.titleGu, time: getMockRelativeTime(sub.relativeTimeGu, language) });
          }
        });
      });
    }
    const col1 = list.filter((_, i) => i % 3 === 0);
    const col2 = list.filter((_, i) => i % 3 === 1);
    const col3 = list.filter((_, i) => i % 3 === 2);
    return { col1, col2, col3, totalRows: Math.max(col1.length, col2.length, col3.length) };
  }, [dbNationalArticles]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-1">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 mb-3.5">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'દેશ' : language === 'hi' ? 'देश' : 'National'}
        </span>
        <Link
          href="/category/national"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More →'}
        </Link>
      </div>

      {/* Top Row: 3 Featured Big Image Article Cards from DB */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-4">
        {top3.map((item) => (
          <div key={item.id} className="flex flex-col justify-between min-w-0 border-b border-border/40 pb-3">
            <Link href={`/news/${item.slug}`} className="group flex flex-col">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5">
                <ArticleMedia src={item.image} alt={item.titleGu} className="transition-transform duration-300 group-hover:scale-105" />
              </div>
              <h3 className="text-[14px] md:text-[15.5px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                {item.article
                  ? <AutoArticleTitle article={item.article} language={language} />
                  : <AutoTranslateString text={item.titleGu} language={language} />}
              </h3>
            </Link>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold mt-2.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>{item.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Grid: Sub-articles in 3 columns */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: bottomGrid.totalRows }).map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {[bottomGrid.col1[rowIdx], bottomGrid.col2[rowIdx], bottomGrid.col3[rowIdx]].map((sub, colIdx) => {
              if (!sub) return <div key={colIdx} />;
              return (
                <Link key={sub.id} href={`/news/${sub.slug}`} className="group flex gap-3 hover:bg-muted/10 transition-colors p-1 min-w-0">
                  <div className="relative h-[56px] w-[86px] shrink-0 overflow-hidden rounded-sm border border-border/10 bg-muted">
                    <ArticleMedia src={sub.image} alt={sub.titleGu} className="transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <h4 className="text-[12.5px] font-extrabold leading-snug line-clamp-2 text-foreground group-hover:text-[#B3121B] transition-colors">
                      {sub.article
                        ? <AutoArticleTitle article={sub.article} language={language} />
                        : <AutoTranslateString text={sub.titleGu} language={language} />}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground font-semibold">
                      <Clock className="h-3 w-3 text-muted-foreground/60" />
                      <span>{sub.time}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- Dynamic Foreign Exchange Rates Widget ──────────────────────────────── */
function CurrencyRatesWidget({ language }: { language: Language }) {
  const [rates, setRates] = useState<Array<{
    symbol: string;
    code: string;
    pair: string;
    nameEn: string;
    nameGu: string;
    nameHi: string;
    rate: number;
    change: number;
    bgColor: string;
    textColor: string;
  }>>([
    { symbol: '$', code: 'USD', pair: 'USD/INR', nameEn: 'US Dollar', nameGu: 'યુએસ ડોલર', nameHi: 'यूएस डॉलर', rate: 86.85, change: 0.12, bgColor: 'bg-green-500/10', textColor: 'text-green-600' },
    { symbol: '€', code: 'EUR', pair: 'EUR/INR', nameEn: 'Euro', nameGu: 'યુરો', nameHi: 'यूरो', rate: 90.45, change: -0.20, bgColor: 'bg-blue-500/10', textColor: 'text-blue-600' },
    { symbol: 'د.إ', code: 'AED', pair: 'AED/INR', nameEn: 'UAE Dirham', nameGu: 'યુએઈ દિરહામ', nameHi: 'યુએઈ દિરહામ', rate: 23.64, change: -0.05, bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-600' },
    { symbol: 'A$', code: 'AUD', pair: 'AUD/INR', nameEn: 'Australian Dollar', nameGu: 'ઓસ્ટ્રેલિયન ડોલર', nameHi: 'ऑस्ट्रेलियन डॉलर', rate: 55.48, change: 0.03, bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-600' },
    { symbol: '£', code: 'GBP', pair: 'GBP/INR', nameEn: 'British Pound', nameGu: 'બ્રિટિશ પાઉન્ડ', nameHi: 'ब्रिटिश पाउंड', rate: 108.78, change: 0.00, bgColor: 'bg-amber-500/10', textColor: 'text-amber-600' },
    { symbol: 'C$', code: 'CAD', pair: 'CAD/INR', nameEn: 'Canadian Dollar', nameGu: 'કેનેડિયન ડોલર', nameHi: 'कनाडाई डॉलर', rate: 61.20, change: 0.08, bgColor: 'bg-red-500/10', textColor: 'text-red-600' },
  ]);

  const [lastUpdated, setLastUpdated] = useState<string>('Live');

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.result === 'success' && data.rates && data.rates.INR) {
          const usdInr = data.rates.INR;
          const getInrRate = (currCode: string) => {
            if (currCode === 'USD') return usdInr;
            if (data.rates[currCode]) return usdInr / data.rates[currCode];
            return null;
          };

          setRates((prev) =>
            prev.map((item) => {
              const liveRate = getInrRate(item.code);
              if (liveRate) {
                const diff = liveRate - item.rate;
                return {
                  ...item,
                  rate: Number(liveRate.toFixed(2)),
                  change: Number(diff.toFixed(2)),
                };
              }
              return item;
            })
          );
          setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        }
      })
      .catch(() => {
        // Fallback gracefully to preset exchange rates
      });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between pb-1 mb-2 select-none border-b border-border/80">
        <span className="text-[#B3121B] font-extrabold text-[14px] md:text-[15px]">
          {language === 'gu' ? '• વિદેશી ચલણ' : language === 'hi' ? '• विदेशी मुद्रा' : '• Foreign Exchange'}
        </span>
        <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live {lastUpdated}</span>
        </span>
      </div>
      <div className="border border-border/80 rounded-sm bg-card divide-y divide-border/60 shadow-sm">
        {rates.map((item) => {
          const name = language === 'gu' ? item.nameGu : language === 'hi' ? item.nameHi : item.nameEn;
          const isUp = item.change > 0;
          const isDown = item.change < 0;

          return (
            <div key={item.code} className="flex items-center justify-between p-2.5 px-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${item.bgColor} ${item.textColor} font-extrabold text-[12px] select-none shrink-0`}>
                  {item.symbol}
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-black text-foreground">{name}</span>
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase leading-none mt-0.5">{item.pair}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-black text-foreground">₹{item.rate.toFixed(2)}</span>
                <span className={`text-[10.5px] font-black tracking-tight select-none ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {isUp ? `▲ +${item.change.toFixed(2)}` : isDown ? `▼ ${item.change.toFixed(2)}` : '— Stable'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const mockWorldFeatured = {
  id: 'w-feat',
  slug: 'india-major-victory-un-broad-support-proposal-551',
  image: '/assets/demo/8.jpg',
  categoryGu: 'સંયુક્ત રાષ્ટ્ર',
  titleGu: 'ભારતની મોટી જીત! સંયુક્ત રાષ્ટ્રમાં પ્રસ્તાવને વ્યાપક સમર્થન',
  excerptGu: 'મોટાભાગના સભ્ય દેશોએ ભારતના પ્રસ્તાવને ટેકો આપતા આંતરરાષ્ટ્રીય મંચ પર દેશની સ્થિતિ વધુ મજબૂત બની.',
  watermarkGu: 'ગુજરાત પોસ્ટ'
};

const mockWorldCards = [
  {
    id: 'w-card-1',
    slug: 'europe-new-trade-treaty-signed-india-benefits-552',
    image: '/assets/demo/1.jpg',
    categoryGu: 'યુરોપ',
    titleGu: 'યુરોપમાં નવી વ્યાપાર સંધિ પર હસ્તાક્ષર, ભારતને પણ ફાયદો',
    relativeTimeGu: '3 કલાક પહેલાં',
    views: 74000
  },
  {
    id: 'w-card-2',
    slug: 'usa-indian-community-huge-cultural-event-553',
    image: '/assets/demo/3.jpg',
    categoryGu: 'અમેરિકા',
    titleGu: 'અમેરિકામાં ભારતીય સમુદાયનું વિશાળ સાંસ્કૃતિક આયોજન, જુઓ ઝલક',
    relativeTimeGu: '4 કલાક પહેલાં',
    views: 78000
  },
  {
    id: 'w-card-3',
    slug: 'asian-countries-new-economic-partnership-announced-554',
    image: '/assets/demo/2.jpg',
    categoryGu: 'એશિયા',
    titleGu: 'એશિયાઈ દેશો વચ્ચે નવી આર્થિક ભાગીદારીની મોટી જાહેરાત',
    relativeTimeGu: '5 કલાક પહેલાં',
    views: 81000
  },
  {
    id: 'w-card-4',
    slug: 'gulf-countries-indian-workers-welfare-scheme-555',
    image: '/assets/demo/7.jpg',
    categoryGu: 'મધ્ય-પૂર્વ',
    titleGu: 'ગલ્ફ દેશોમાં ભારતીય શ્રમિકો માટે ખુશખબર! નવી કલ્યાણ યોજના જાહેર',
    relativeTimeGu: '6 કલાક પહેલાં',
    views: 90000
  }
];

/* --- World Section ("વિશ્વ" Zone) ----------------------------- */
export function WorldSection({ language }: { language: Language }) {
  const [dbWorldArticles, setDbWorldArticles] = useState<Article[]>([]);

  useEffect(() => {
    getPublicArticles({ categorySlug: 'world', limit: 10 }).then((res) => {
      if (res && res.articles && res.articles.length > 0) {
        setDbWorldArticles(res.articles);
      }
    });
  }, []);

  const featured = useMemo(() => {
    if (dbWorldArticles.length > 0) {
      const art = dbWorldArticles[0];
      return {
        id: art.id,
        slug: art.slug,
        image: art.image || DEMO_IMAGES[0],
        categoryGu: art.categoryGu || art.category || 'વિશ્વ',
        article: art as Article,
        titleGu: art.titleGu || art.title,
        excerptGu: art.excerptGu || art.excerpt || '',
        watermarkGu: 'ગુજરાત પોસ્ટ',
      };
    }
    return {
      id: mockWorldFeatured.id,
      slug: mockWorldFeatured.slug,
      image: mockWorldFeatured.image,
      categoryGu: mockWorldFeatured.categoryGu,
      article: null as Article | null,
      titleGu: mockWorldFeatured.titleGu,
      excerptGu: mockWorldFeatured.excerptGu,
      watermarkGu: 'ગુજરાત પોસ્ટ',
    };
  }, [dbWorldArticles]);

  const cardsList = useMemo(() => {
    const list: Array<{ id: string; slug: string; image: string; article: Article | null; titleGu: string; categoryGu: string; time: string }> = [];
    dbWorldArticles.slice(1, 5).forEach((art) => {
      list.push({
        id: art.id,
        slug: art.slug,
        image: art.image || DEMO_IMAGES[1],
        categoryGu: art.categoryGu || art.category || 'વિશ્વ',
        article: art,
        titleGu: art.titleGu || art.title,
        time: formatTime(art.publishedAt),
      });
    });
    if (list.length < 4) {
      mockWorldCards.forEach((card) => {
        if (list.length < 4 && !list.some((item) => item.id === card.id)) {
          list.push({
            id: card.id,
            slug: card.slug,
            image: card.image,
            categoryGu: card.categoryGu,
            article: null,
            titleGu: card.titleGu,
            time: getMockRelativeTime(card.relativeTimeGu, language),
          });
        }
      });
    }
    return list;
  }, [dbWorldArticles]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-6">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'વિશ્વ' : language === 'hi' ? 'विश्व' : 'World'}
        </span>
        <Link
          href="/category/world"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More News →'}
        </Link>
      </div>

      {/* Grid: Left column (main news) vs Right column (sidebar/widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-8 items-start">

        {/* Left Column: Big horizontal featured card + 4-column horizontal card list */}
        <div className="flex flex-col min-w-0">

          {/* Big Horizontal Featured Card */}
          <Link
            href={`/news/${featured.slug}`}
            className="group grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border/80 rounded-sm p-5 md:p-6 mb-8 hover:shadow-sm transition-shadow duration-200"
          >
            {/* Content Left */}
            <div className="flex flex-col justify-center min-w-0 order-2 md:order-1">
              <span className="text-red-600 font-extrabold text-[12px] md:text-[13px] mb-2 select-none uppercase tracking-wide">
                {featured.categoryGu}
              </span>
              <h3 className="text-[17px] md:text-[19px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors">
                {featured.article
                  ? <AutoArticleTitle article={featured.article} language={language} />
                  : <AutoTranslateString text={featured.titleGu} language={language} />}
              </h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed mt-3.5 line-clamp-4 select-none">
                {featured.article
                  ? <AutoArticleExcerpt article={featured.article} language={language} />
                  : <AutoTranslateString text={stripHtmlTags(featured.excerptGu)} language={language} />}
              </p>
            </div>

            {/* Image Right with Watermark */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm bg-muted order-1 md:order-2">
              <Image
                src={featured.image}
                alt={featured.titleGu}
                fill
                sizes="(max-width: 768px) 100vw, 30vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm select-none tracking-tight">
                {featured.watermarkGu}
              </span>
            </div>
          </Link>

          {/* Grid of 4 Vertical Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cardsList.map((card) => (
              <div key={card.id} className="flex flex-col min-w-0">
                <Link
                  href={`/news/${card.slug}`}
                  className="group flex flex-col"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5">
                    <Image
                      src={card.image}
                      alt={card.titleGu}
                      fill
                      sizes="(max-width: 768px) 100vw, 20vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <span className="text-[#B3121B] font-extrabold text-[12px] md:text-[13px] mb-1.5 select-none uppercase leading-none">
                    <AutoTranslateString text={card.categoryGu} language={language} />
                  </span>
                  <h4 className="text-[13px] md:text-[13.5px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
                    {card.article
                      ? <AutoArticleTitle article={card.article} language={language} />
                      : <AutoTranslateString text={card.titleGu} language={language} />}
                  </h4>
                </Link>
                <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-muted-foreground font-semibold">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>{card.time}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Column: Widgets */}
        <div className="flex flex-col gap-6">

          <SidebarAdBanner
            slot="SIDEBAR_WORLD"
            language={language}
            fallbackTitleGu="ડ્રીમ હોમ્સ"
            fallbackTitleEn="Dream Homes"
            fallbackTagGu="તમારું સપનાનું ઘર — 0% પ્રોસેસિંગ ફી સાથે"
            fallbackTagEn="Your dream home — with 0% processing fee"
            fallbackCtaGu="વધુ જાણો"
            fallbackCtaEn="Learn More"
            fallbackGradient="#0E8044"
            minHeight={180}
          />

          {/* Dynamic Foreign Currency Widget */}
          <CurrencyRatesWidget language={language} />

        </div>

      </div>
    </div>
  );
}

/* --- Live Center Section ─────────────────────────────────────────────────── */
/* --- Live Center Section ─────────────────────────────────────────────────── */
function LivePanel({
  title,
  rightElement,
  icon,
  variant,
  watermark,
  sourceText,
  children
}: {
  title: string;
  rightElement?: React.ReactNode;
  icon?: React.ReactNode;
  variant: 'red' | 'black';
  watermark?: React.ReactNode;
  sourceText: string;
  children: React.ReactNode;
}) {
  const panelBg = variant === 'red'
    ? 'bg-gradient-to-b from-[#C21E26] to-[#990D14] text-white border-red-700/20'
    : 'bg-gradient-to-b from-[#0F1115] to-[#050608] text-white border-neutral-900';

  const borderLine = variant === 'red' ? 'border-white/20' : 'border-white/10';

  return (
    <div className={`relative flex flex-col rounded-2xl border p-4 shadow-md overflow-hidden min-h-[420px] ${panelBg}`}>
      {/* Watermark in background */}
      {watermark}

      {/* Header */}
      <div className={`mb-4 flex items-center justify-between pb-2.5 border-b select-none ${borderLine} relative z-10`}>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-[16px] font-extrabold tracking-tight leading-none text-white">{title}</h3>
        </div>
        <div className="flex items-center">
          {rightElement}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between relative z-10">
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          {children}
        </div>

        {/* Source Footer */}
        <p className={`pt-3 text-[10px] font-bold select-none mt-4 leading-none ${variant === 'red' ? 'text-white/60' : 'text-neutral-400'}`}>
          {sourceText}
        </p>
      </div>
    </div>
  );
}

// Custom SVGs for card watermarks (matching the screenshots exactly)
const FuelWatermark = (
  <div className="absolute bottom-[-15px] right-[-10px] w-[220px] h-[160px] opacity-[0.16] pointer-events-none z-0 select-none text-black">
    <svg viewBox="0 0 200 150" fill="currentColor" className="w-full h-full">
      {/* Fuel nozzle Spout pointing up-left */}
      <path d="M125 78 L95 48 C90 43 82 43 77 48 L48 77 C43 82 43 90 48 95 L58 105 L35 128 C32 131 32 136 35 139 C38 142 43 142 46 139 L69 116 L79 126 C84 131 92 131 97 126 L126 97 C131 92 131 84 126 79 Z M65 92 C62 89 62 84 65 81 C68 78 73 78 76 81 C79 84 79 89 76 92 C73 95 68 95 65 92 Z" />
      <path d="M120 73 L155 38 C160 33 168 33 173 38 L195 60 C200 65 200 73 195 78 L160 113" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
      {/* Fuel droplet on the left */}
      <path d="M85 85 C85 93 79 100 72 100 C65 100 59 93 59 85 C59 75 72 60 72 60 C72 60 85 75 85 85 Z" />
      {/* Background waves */}
      <path d="M -20 80 Q 40 55 100 70 T 220 50" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3,3" fill="none" opacity="0.3" />
      <path d="M -20 90 Q 40 65 100 80 T 220 60" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3,3" fill="none" opacity="0.3" />
    </svg>
  </div>
);

const MarketWatermark = (
  <div className="absolute bottom-[-10px] right-[-10px] w-[220px] h-[120px] opacity-[0.07] pointer-events-none z-0 select-none text-white">
    <svg viewBox="0 0 200 100" fill="currentColor" className="w-full h-full">
      {/* Histogram bars */}
      <rect x="20" y="70" width="6" height="20" rx="1" />
      <rect x="32" y="55" width="6" height="35" rx="1" />
      <rect x="44" y="65" width="6" height="25" rx="1" />
      <rect x="56" y="45" width="6" height="45" rx="1" />
      <rect x="68" y="50" width="6" height="40" rx="1" />
      <rect x="80" y="30" width="6" height="60" rx="1" />
      <rect x="92" y="40" width="6" height="50" rx="1" />
      <rect x="104" y="35" width="6" height="55" rx="1" />
      <rect x="116" y="20" width="6" height="70" rx="1" />
      <rect x="128" y="45" width="6" height="45" rx="1" />
      <rect x="140" y="30" width="6" height="60" rx="1" />
      <rect x="152" y="25" width="6" height="65" rx="1" />
      <rect x="164" y="15" width="6" height="75" rx="1" />
      {/* Connecting line on top */}
      <path d="M 23 68 L 35 52 L 47 62 L 59 42 L 71 47 L 83 27 L 95 37 L 107 32 L 119 17 L 131 42 L 143 27 L 155 22 L 167 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      <circle cx="23" cy="68" r="2.5" />
      <circle cx="35" cy="52" r="2.5" />
      <circle cx="47" cy="62" r="2.5" />
      <circle cx="59" cy="42" r="2.5" />
      <circle cx="71" cy="47" r="2.5" />
      <circle cx="83" cy="27" r="2.5" />
      <circle cx="95" cy="37" r="2.5" />
      <circle cx="107" cy="32" r="2.5" />
      <circle cx="119" cy="17" r="2.5" />
      <circle cx="131" cy="42" r="2.5" />
      <circle cx="143" cy="27" r="2.5" />
      <circle cx="155" cy="22" r="2.5" />
      <circle cx="167" cy="12" r="2.5" />
    </svg>
  </div>
);

const CricketWatermark = (
  <div className="absolute bottom-[-5px] right-[-10px] w-[240px] h-[140px] opacity-[0.14] pointer-events-none z-0 select-none text-black">
    <svg viewBox="0 0 200 120" fill="currentColor" className="w-full h-full">
      {/* Stadium Stands */}
      <path d="M 0 100 Q 100 115 200 100 L 200 120 L 0 120 Z" opacity="0.6" />
      <path d="M 0 88 Q 100 103 200 88 L 200 100 Q 100 115 0 100 Z" opacity="0.4" />
      <path d="M 0 76 Q 100 91 200 76 L 200 88 Q 100 103 0 88 Z" opacity="0.3" />
      <path d="M 0 64 Q 100 79 200 64 L 200 76 Q 100 91 0 76 Z" opacity="0.2" />
      {/* Floodlights left */}
      <g transform="translate(20, 25)" className="text-white">
        <rect x="-12" y="-6" width="24" height="12" rx="1.5" fill="currentColor" />
        <line x1="0" y1="6" x2="-2" y2="45" stroke="currentColor" strokeWidth="2.5" />
        <polygon points="-8,6 -45,85 35,85" fill="currentColor" opacity="0.15" />
        <circle cx="-8" cy="-2" r="1.5" fill="white" />
        <circle cx="-3" cy="-2" r="1.5" fill="white" />
        <circle cx="3" cy="-2" r="1.5" fill="white" />
        <circle cx="8" cy="-2" r="1.5" fill="white" />
        <circle cx="-8" cy="2" r="1.5" fill="white" />
        <circle cx="-3" cy="2" r="1.5" fill="white" />
        <circle cx="3" cy="2" r="1.5" fill="white" />
        <circle cx="8" cy="2" r="1.5" fill="white" />
      </g>
      {/* Floodlights right */}
      <g transform="translate(180, 30)" className="text-white">
        <rect x="-12" y="-6" width="24" height="12" rx="1.5" fill="currentColor" />
        <line x1="0" y1="6" x2="2" y2="40" stroke="currentColor" strokeWidth="2.5" />
        <polygon points="8,6 -35,80 45,80" fill="currentColor" opacity="0.15" />
        <circle cx="-8" cy="-2" r="1.5" fill="white" />
        <circle cx="-3" cy="-2" r="1.5" fill="white" />
        <circle cx="3" cy="-2" r="1.5" fill="white" />
        <circle cx="8" cy="-2" r="1.5" fill="white" />
        <circle cx="-8" cy="2" r="1.5" fill="white" />
        <circle cx="-3" cy="2" r="1.5" fill="white" />
        <circle cx="3" cy="2" r="1.5" fill="white" />
        <circle cx="8" cy="2" r="1.5" fill="white" />
      </g>
      <path d="M -20 80 Q 40 55 100 70 T 220 50" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.2" />
    </svg>
  </div>
);

const FootballWatermark = (
  <div className="absolute bottom-[-10px] right-[-10px] w-[220px] h-[120px] opacity-[0.08] pointer-events-none z-0 select-none text-white">
    <svg viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
      <path d="M0 90 Q 50 65 100 80 T 200 50" opacity="0.3" />
      <path d="M0 80 Q 50 55 100 70 T 200 40" opacity="0.35" />
      <path d="M0 70 Q 50 45 100 60 T 200 30" opacity="0.4" />
      <path d="M0 60 Q 50 35 100 50 T 200 20" opacity="0.35" />
      <path d="M0 50 Q 50 25 100 40 T 200 10" opacity="0.3" />
      <path d="M 20 100 Q 50 60 80 10" opacity="0.3" />
      <path d="M 50 100 Q 80 60 110 10" opacity="0.35" />
      <path d="M 80 100 Q 110 60 140 10" opacity="0.4" />
      <path d="M 110 100 Q 140 60 170 10" opacity="0.35" />
      <path d="M 140 100 Q 170 60 200 10" opacity="0.3" />
      <path d="M 100 90 A 50 50 0 0 1 200 40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.25" />
      <path d="M 120 90 A 40 40 0 0 1 200 50" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.25" />
    </svg>
  </div>
);

const FUEL_PRICE_CITY_MAP: Record<string, { petrol: string; diesel: string; cng: string }> = {
  Ahmedabad: { petrol: '96.42', diesel: '92.17', cng: '76.00' },
  Vadodara: { petrol: '96.08', diesel: '91.83', cng: '75.50' },
  Surat: { petrol: '96.31', diesel: '92.06', cng: '76.20' },
  Rajkot: { petrol: '96.15', diesel: '91.90', cng: '75.80' },
};

export function LiveCenterSection({ language }: { language: Language }) {
  const [fuelCity, setFuelCity] = useState('Ahmedabad');
  const [fuelPrices, setFuelPrices] = useState(FUEL_PRICE_CITY_MAP);

  // Live Stock Market state
  const [stocks, setStocks] = useState([
    { name: 'Nifty 50', exchange: 'NSE', value: 23456.2, change: 188.4, changePercent: 0.93 },
    { name: 'BSE Sensex', exchange: 'BSE', value: 80309.1, change: 425.6, changePercent: 0.55 },
    { name: 'Nifty Bank', exchange: 'NSE', value: 49640.8, change: -124.1, changePercent: -0.23 }
  ]);

  // Live Exchange Rate
  const [usdRate, setUsdRate] = useState<{ rate: string; change: string }>({ rate: '83.92', change: '-0.12' });

  // Live Cricket state
  const [cricketMatches, setCricketMatches] = useState([
    { title: 'India vs England', statusType: 'live', statusText: 'LIVE', team1: 'India', team1Score: '168/8 (20)', team2: 'England', team2Score: '185/9 (19.2)' },
    { title: 'Ranji Trophy', statusType: 'day', statusText: 'Day 3', team1: 'Gujarat', team1Score: '284/6', team2: 'Mumbai', team2Score: '322/10' },
    { title: 'IPL', statusType: 'time', statusText: '22:00', team1: 'CSK', team1Score: '—', team2: 'MI', team2Score: '—' }
  ]);

  // Live Football state
  const [footballMatches, setFootballMatches] = useState([
    { league: 'ISL', statusType: 'live', statusText: "75'", homeTeam: 'Mumbai City FC', homeScore: '2', awayTeam: 'Mohun Bagan', awayScore: '1' },
    { league: 'EPL', statusType: 'time', statusText: '22:00', homeTeam: 'Man City', homeScore: '—', awayTeam: 'Arsenal', awayScore: '—' },
    { league: 'La Liga', statusType: 'time', statusText: '23:00', homeTeam: 'Real Madrid', homeScore: '—', awayTeam: 'Barcelona', awayScore: '—' }
  ]);

  // Fetch live center data from API
  useEffect(() => {
    getLiveCenterData().then((data) => {
      if (data) {
        if (data.fuelPrices) setFuelPrices(data.fuelPrices);
        if (data.stocks) setStocks(data.stocks);
        if (data.usdRate) setUsdRate(data.usdRate);
        if (data.cricketMatches) setCricketMatches(data.cricketMatches);
        if (data.footballMatches) setFootballMatches(data.footballMatches);
      }
    });

    // Live USD/INR Exchange Rate fetch
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rates && data.rates.INR) {
          const inrVal = data.rates.INR.toFixed(2);
          setUsdRate({ rate: inrVal, change: '-0.12' });
        }
      })
      .catch(() => { });

    // Periodic live simulation timer for market and sports ticks every 15s
    const timer = setInterval(() => {
      setStocks((prev) =>
        prev.map((st) => {
          const delta = (Math.random() - 0.48) * 14;
          const newVal = Math.round((st.value + delta) * 10) / 10;
          const newChange = Math.round((st.change + delta) * 10) / 10;
          const newPct = Math.round((newChange / (newVal - newChange)) * 10000) / 100;
          return {
            ...st,
            value: newVal,
            change: newChange,
            changePercent: newPct
          };
        })
      );
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  const activeFuel = fuelPrices[fuelCity] || fuelPrices.Ahmedabad || FUEL_PRICE_CITY_MAP.Ahmedabad;

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-8 relative">
      {/* Blurred Red Ambient Glow Orbs in Background */}
      <div className="absolute -top-6 left-10 w-96 h-96 bg-[#B3121B]/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-6 right-10 w-[420px] h-[420px] bg-red-600/12 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Container Box */}
      <div className="relative border border-neutral-200/80 dark:border-neutral-800 bg-[#f8f9fa] dark:bg-slate-900/40 rounded-2xl p-6 shadow-sm">

        {/* ── Header Row ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-neutral-200/40 dark:border-neutral-800/60 select-none">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-[#B3121B] text-white text-[13px] font-black px-4 py-1.5 rounded-full inline-flex items-center gap-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              {language === 'gu' ? '((•)) લાઈવ સેન્ટર' : '((•)) Live Center'}
            </span>
            <span className="text-[12.5px] text-muted-foreground font-extrabold">
              {language === 'gu'
                ? 'ઈંધણ ભાવ • શેરબજાર • રમતગમત — 2.5 મિનિટ અપડેટ'
                : 'Fuel Price · Stock Market · Sports — 2.5 min updates'}
            </span>
          </div>

          {/* Top Right Live Tag */}
          <span className="bg-red-50 text-[#B3121B] text-[11.5px] font-black px-3.5 py-1 rounded-full border border-red-100 flex items-center gap-1.5 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#B3121B] animate-pulse" />
            {language === 'gu' ? 'લાઈવ' : 'LIVE'}
          </span>
        </div>

        {/* ── 4-Column Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-5">

          {/* Panel 1: Fuel Price */}
          <LivePanel
            title={language === 'gu' ? 'ઈંધણ ભાવ' : 'Fuel Price'}
            variant="red"
            watermark={FuelWatermark}
            sourceText={language === 'gu' ? 'સ્ત્રોત: IOC / HPCL' : 'Source: IOC / HPCL'}
            rightElement={
              <div className="flex items-center gap-1 text-[12px] font-extrabold text-white select-none">
                <div className="relative">
                  <select
                    value={fuelCity}
                    onChange={(e) => setFuelCity(e.target.value)}
                    className="appearance-none bg-red-800/80 text-white text-[11px] font-black px-2.5 py-1 pr-6 rounded-md border border-red-400/40 focus:outline-none cursor-pointer"
                  >
                    <option value="Ahmedabad" className="bg-slate-900 text-white">Ahmedabad</option>
                    <option value="Vadodara" className="bg-slate-900 text-white">Vadodara</option>
                    <option value="Surat" className="bg-slate-900 text-white">Surat</option>
                    <option value="Rajkot" className="bg-slate-900 text-white">Rajkot</option>
                  </select>
                  <ChevronDown className="h-3 w-3 text-white absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            }
            icon={<Fuel className="h-5 w-5 text-white" />}
          >
            {[
              { name: 'પેટ્રોલ', nameEng: 'Petrol', price: activeFuel.petrol, unit: 'લીટર', symbol: 'P' as const },
              { name: 'ડીઝલ', nameEng: 'Diesel', price: activeFuel.diesel, unit: 'લીટર', symbol: 'D' as const },
              { name: 'CNG', nameEng: 'CNG', price: activeFuel.cng, unit: 'કિલો', symbol: 'C' as const }
            ].map((item) => (
              <div key={item.symbol} className="flex-1 flex items-center justify-between rounded-xl bg-white px-4 py-3.5 shadow-sm border border-neutral-100 hover:shadow transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center font-extrabold text-[16px] shrink-0
                    ${item.symbol === 'P' ? 'bg-red-50 text-red-600 border border-red-100' : ''}
                    ${item.symbol === 'D' ? 'bg-blue-50 text-blue-600 border border-blue-100' : ''}
                    ${item.symbol === 'C' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : ''}
                  `}>
                    {item.symbol}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-[13.5px] text-neutral-900 leading-none">
                      {language === 'gu' ? `${item.name} (${item.nameEng})` : `${item.nameEng} (${item.nameEng})`}
                    </p>
                    <p className="text-[10px] font-bold text-neutral-400 mt-2 leading-none">
                      {language === 'gu' ? `પ્રતિ ${item.unit}` : `per ${item.unit === 'લીટર' ? 'liter' : 'kg'}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[16px] font-black text-neutral-900 leading-none">₹{item.price}</p>
                  <p className="text-[9px] font-bold text-neutral-400 mt-1.5 leading-none">
                    / {item.unit}
                  </p>
                </div>
              </div>
            ))}
          </LivePanel>

          {/* Panel 2: Stock Market */}
          <LivePanel
            title={language === 'gu' ? 'શેરબજાર' : 'Stock Market'}
            variant="black"
            watermark={MarketWatermark}
            sourceText={language === 'gu' ? 'સ્ત્રોત: Yahoo Finance' : 'Source: Yahoo Finance'}
            rightElement={
              <span className="text-[10px] font-bold text-neutral-400 leading-none whitespace-nowrap">
                {language === 'gu' ? 'ભારત ₹ INR' : 'India ₹ INR'}
              </span>
            }
            icon={<TrendingUp className="h-5 w-5 text-white" />}
          >
            {stocks.map((item) => (
              <div key={item.name} className="rounded-xl bg-[#121518] p-3 border border-[#1F252C] shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-[13.5px] text-white leading-none">{item.name}</p>
                    <p className="text-[10px] font-bold text-neutral-400 mt-2 leading-none">{item.exchange}</p>
                  </div>
                  <p className="text-[15px] font-black text-white leading-none">
                    ₹{item.value.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </p>
                </div>
                <div className={`mt-2.5 flex items-center gap-1 text-[11px] font-black select-none leading-none
                  ${item.change >= 0 ? 'text-emerald-500' : 'text-red-500'}
                `}>
                  {item.change >= 0 ? '↗' : '↘'}
                  <span>{item.change >= 0 ? '+' : ''}{item.change.toFixed(1)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)</span>
                </div>
              </div>
            ))}
          </LivePanel>

          {/* Panel 3: Cricket */}
          <LivePanel
            title={language === 'gu' ? 'ક્રિકેટ' : 'Cricket'}
            variant="red"
            watermark={CricketWatermark}
            sourceText={language === 'gu' ? 'સ્ત્રોત: ESPN' : 'Source: ESPN'}
            rightElement={
              <Link href="/sports" className="text-[12px] font-extrabold text-white leading-none hover:text-white/80 transition-colors select-none whitespace-nowrap">
                {language === 'gu' ? '+ વધુ' : '+ More'}
              </Link>
            }
            icon={<Trophy className="h-5 w-5 text-white" />}
          >
            {cricketMatches.map((match, i) => (
              <div key={i} className="rounded-xl bg-white p-3 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-neutral-100">
                  <p className="font-extrabold text-[12.5px] text-neutral-900 leading-none">{match.title}</p>
                  {match.statusType === 'live' ? (
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 text-[8.5px] font-black rounded leading-none select-none border border-emerald-100">
                      {match.statusText}
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-[9.5px] font-bold select-none">
                      {match.statusText}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[12.5px] font-bold text-neutral-700">
                    <span>{match.team1}</span>
                    <span className="font-black text-neutral-900">{match.team1Score}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12.5px] font-bold text-neutral-700">
                    <span>{match.team2}</span>
                    <span className="font-black text-neutral-900">{match.team2Score}</span>
                  </div>
                </div>
              </div>
            ))}
          </LivePanel>

          {/* Panel 4: Football */}
          <LivePanel
            title={language === 'gu' ? 'ફૂટબોલ' : 'Football'}
            variant="black"
            watermark={FootballWatermark}
            sourceText={language === 'gu' ? 'સ્ત્રોત: ESPN' : 'Source: ESPN'}
            rightElement={
              <Link href="/sports" className="text-[12px] font-extrabold text-white leading-none hover:text-white/80 transition-colors select-none whitespace-nowrap">
                {language === 'gu' ? '+ વધુ' : '+ More'}
              </Link>
            }
            icon={<Shield className="h-5 w-5 text-white" />}
          >
            {footballMatches.map((match, i) => (
              <div key={i} className="rounded-xl bg-[#121518] p-3 border border-[#1F252C] shadow-sm">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#1F252C]">
                  <p className="font-extrabold text-[12.5px] text-white leading-none">{match.league}</p>
                  {match.statusType === 'live' ? (
                    <span className="bg-[#B3121B] text-white px-2 py-0.5 text-[8.5px] font-black rounded leading-none select-none">
                      {match.statusText}
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-[9.5px] font-bold select-none">
                      {match.statusText}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[12.5px] font-bold text-neutral-300">
                    <span>{match.homeTeam}</span>
                    <span className="font-black text-white">{match.homeScore}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12.5px] font-bold text-neutral-300">
                    <span>{match.awayTeam}</span>
                    <span className="font-black text-white">{match.awayScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </LivePanel>

        </div>

        {/* ── Bottom Live Highlights Ticker Bar ───────────────────── */}
        <div className="mt-6 pt-4 border-t border-neutral-200/40 dark:border-neutral-800/60 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-[#B3121B] text-white text-[12px] font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
              <Megaphone className="h-4 w-4" />
              {language === 'gu' ? 'લાઈવ હાઈલાઈટ્સ' : 'Live Highlights'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[12px] font-extrabold text-slate-700 dark:text-slate-300 overflow-x-auto scrollbar-hide py-1">
            <span>{stocks[0].name} ₹{stocks[0].value.toLocaleString('en-IN')} <span className={`font-black ${stocks[0].change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{stocks[0].change >= 0 ? '▲' : '▼'} {stocks[0].change}</span></span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>{stocks[1].name} ₹{stocks[1].value.toLocaleString('en-IN')} <span className={`font-black ${stocks[1].change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{stocks[1].change >= 0 ? '▲' : '▼'} {stocks[1].change}</span></span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>{stocks[2].name} ₹{stocks[2].value.toLocaleString('en-IN')} <span className={`font-black ${stocks[2].change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{stocks[2].change >= 0 ? '▲' : '▼'} {stocks[2].change}</span></span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Petrol ₹{activeFuel.petrol} /L</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>USD ₹{usdRate.rate} <span className="text-red-600 font-black">▼ {usdRate.change}</span></span>
          </div>

          <Link
            href="/live-updates"
            className="shrink-0 border border-red-200 dark:border-red-900/30 text-[#B3121B] dark:text-red-400 font-black text-[12px] rounded-lg px-3.5 py-1.5 flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            {language === 'gu' ? 'વધુ અપડેટસ જુઓ' : 'View More Updates'}
          </Link>
        </div>

      </div>
    </div>
  );
}

/* --- Weather Dashboard Section --------------------------------------------- */
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  Ahmedabad: { lat: 23.0225, lon: 72.5714 },
  Vadodara: { lat: 22.3072, lon: 73.1812 },
  Surat: { lat: 21.1702, lon: 72.8311 },
  Rajkot: { lat: 22.3039, lon: 70.8022 },
};

function parseWmoCode(code: number) {
  if (code === 0) return { desc: 'Sunny', descGu: 'તડકો', icon: 'sun' };
  if (code >= 1 && code <= 3) return { desc: 'Partly Cloudy', descGu: 'વાદળછાઈ', icon: 'cloud' };
  if (code === 45 || code === 48) return { desc: 'Mist', descGu: 'ધુમ્મસ', icon: 'cloud' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { desc: 'Rain', descGu: 'વરસાદ', icon: 'rain' };
  if (code >= 95) return { desc: 'Thunderstorm', descGu: 'ગાજવીજ', icon: 'rain' };
  return { desc: 'Clear', descGu: 'સ્વચ્છ', icon: 'sun' };
}

function parseAqi(val: number) {
  if (val <= 50) return { label: 'Good', labelGu: 'સારું' };
  if (val <= 100) return { label: 'Satisfactory', labelGu: 'સંતોષકારક' };
  if (val <= 200) return { label: 'Moderate', labelGu: 'સાધારણ' };
  if (val <= 300) return { label: 'Poor', labelGu: 'ખરાબ' };
  return { label: 'Very Poor', labelGu: 'અતિ ખરાબ' };
}

function WeatherDashboardSection({ language }: { language: Language }) {
  const [activeTab, setActiveTab] = useState<'weather' | 'aqi'>('weather');
  const [selectedCity, setSelectedCity] = useState('Ahmedabad');
  const [lastUpdateStr, setLastUpdateStr] = useState('');

  const isGu = language === 'gu';

  // Weather data state with default fallbacks
  const [weatherData, setWeatherData] = useState<Record<string, { temp: string; desc: string; descGu: string; icon: string; humidity: string; wind: string }>>({
    Ahmedabad: { temp: '29', desc: 'Mist', descGu: 'ધુમ્મસ', icon: 'cloud', humidity: '68%', wind: '19 km/h' },
    Vadodara: { temp: '31.7', desc: 'Partly Cloudy', descGu: 'વાદળછાઈ', icon: 'cloud', humidity: '52%', wind: '12 km/h' },
    Surat: { temp: '29.8', desc: 'Heavy Rain', descGu: 'ભારે વરસાદ', icon: 'rain', humidity: '68%', wind: '15 km/h' },
    Rajkot: { temp: '31.9', desc: 'Sunny', descGu: 'તડકો', icon: 'sun', humidity: '52%', wind: '10 km/h' }
  });

  const [aqiData, setAqiData] = useState<Record<string, { value: number; label: string; labelGu: string; pm25: number; pm10: number }>>({
    Ahmedabad: { value: 72, label: 'Satisfactory', labelGu: 'સંતોષકારક', pm25: 22, pm10: 45 },
    Vadodara: { value: 65, label: 'Satisfactory', labelGu: 'સંતોષકારક', pm25: 19, pm10: 40 },
    Surat: { value: 85, label: 'Moderate', labelGu: 'સાધારણ', pm25: 28, pm10: 55 },
    Rajkot: { value: 58, label: 'Good', labelGu: 'સારું', pm25: 15, pm10: 35 }
  });

  useEffect(() => {
    const fetchLiveData = async () => {
      const cities = ['Ahmedabad', 'Vadodara', 'Surat', 'Rajkot'];
      const updatedW = { ...weatherData };
      const updatedA = { ...aqiData };

      await Promise.all(
        cities.map(async (city) => {
          const coords = CITY_COORDS[city];
          if (!coords) return;

          try {
            const wRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
            );
            if (wRes.ok) {
              const wJson = await wRes.json();
              if (wJson?.current) {
                const c = wJson.current;
                const parsed = parseWmoCode(c.weather_code);
                updatedW[city] = {
                  temp: String(Math.round(c.temperature_2m * 10) / 10),
                  desc: parsed.desc,
                  descGu: parsed.descGu,
                  icon: parsed.icon,
                  humidity: `${c.relative_humidity_2m}%`,
                  wind: `${Math.round(c.wind_speed_10m)} km/h`,
                };
              }
            }
          } catch { }

          try {
            const aRes = await fetch(
              `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lon}&current=us_aqi,pm10,pm2_5`
            );
            if (aRes.ok) {
              const aJson = await aRes.json();
              if (aJson?.current) {
                const c = aJson.current;
                const val = Math.round(c.us_aqi || 65);
                const parsedAqi = parseAqi(val);
                updatedA[city] = {
                  value: val,
                  label: parsedAqi.label,
                  labelGu: parsedAqi.labelGu,
                  pm25: Math.round(c.pm2_5 || 22),
                  pm10: Math.round(c.pm10 || 45),
                };
              }
            }
          } catch { }
        })
      );

      setWeatherData(updatedW);
      setAqiData(updatedA);

      const now = new Date();
      const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setLastUpdateStr(formatted);
    };

    fetchLiveData();
  }, []);

  const mainWeather = weatherData[selectedCity] || weatherData.Ahmedabad;
  const otherCities = ['Ahmedabad', 'Vadodara', 'Surat', 'Rajkot'].filter(c => c !== selectedCity);

  return (
    <section className="mx-auto max-w-screen-xl px-4 py-4 mt-8 select-none">
      {/* Tab headers - Black, Red & White */}
      <div className="flex items-end">
        <div className="bg-slate-950 p-1 rounded-t-xl inline-flex gap-1 border-t border-x border-slate-800">
          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-2 px-5 py-2 text-xs md:text-sm font-black transition-all rounded-lg tracking-wider select-none ${activeTab === 'weather'
              ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
              : 'text-white/80 hover:text-white bg-transparent'
              }`}
          >
            <Sun className={`h-4 w-4 ${activeTab === 'weather' ? 'text-[#B3121B]' : 'text-white/60'}`} />
            {isGu ? 'હવામાન' : 'WEATHER'}
          </button>
          <button
            onClick={() => setActiveTab('aqi')}
            className={`flex items-center gap-2 px-5 py-2 text-xs md:text-sm font-black transition-all rounded-lg tracking-wider select-none ${activeTab === 'aqi'
              ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
              : 'text-white/80 hover:text-white bg-transparent'
              }`}
          >
            <Wind className={`h-4 w-4 ${activeTab === 'aqi' ? 'text-[#B3121B]' : 'text-white/60'}`} />
            {isGu ? 'હવા ગુણવત્તા (AQI)' : 'AQI'}
          </button>
        </div>
      </div>

      {/* Main Box - Clean Light Grey Container */}
      <div className="bg-[#f3f4f6] dark:bg-slate-900/90 p-6 rounded-b-2xl rounded-r-2xl border border-slate-200 dark:border-slate-800 shadow-md relative">
        {activeTab === 'weather' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
            {/* Left Area - Selected City weather info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b lg:border-b-0 lg:border-r border-slate-300 dark:border-slate-800 pb-6 lg:pb-0 lg:pr-10">
              <div className="flex flex-col">
                <h3 className="text-lg md:text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
                  {selectedCity} {isGu ? 'હવામાનની સ્થિતિ' : 'Weather Status'}
                </h3>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 select-none">
                  {isGu ? 'વર્તમાન તાપમાનનું સ્તર' : 'Current temperature level'}
                </p>
                <div className="flex items-center gap-5 mt-4">
                  <div className="relative">
                    {mainWeather.icon === 'cloud' && <Cloud className="h-16 w-16 text-slate-950 dark:text-white fill-slate-950/10" />}
                    {mainWeather.icon === 'rain' && <CloudRain className="h-16 w-16 text-slate-950 dark:text-white fill-slate-950/10" />}
                    {mainWeather.icon === 'sun' && <Sun className="h-16 w-16 text-[#B3121B] fill-[#B3121B]/10" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white select-none">
                      {mainWeather.temp}°C
                    </span>
                    <span className="mt-1.5 self-start bg-[#B3121B] text-white text-[11px] font-black px-3.5 py-1 rounded-full uppercase leading-none select-none shadow-sm">
                      {isGu ? mainWeather.descGu : mainWeather.desc}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Area - Other Cities */}
            <div className="flex flex-col gap-4">
              {/* City selector dropdown on top right */}
              <div className="self-end flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="appearance-none bg-white text-slate-950 dark:bg-slate-950 dark:text-white text-xs font-black px-4 py-2 pr-8 rounded-full border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B3121B] cursor-pointer shadow-sm"
                  >
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Vadodara">Vadodara</option>
                    <option value="Surat">Surat</option>
                    <option value="Rajkot">Rajkot</option>
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* City cards with Clean Black, Red, White styling */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {otherCities.map((city) => {
                  const item = weatherData[city];
                  return (
                    <div
                      key={city}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between gap-3 min-w-[190px] relative hover:shadow-md hover:border-[#B3121B]/40 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-black text-slate-950 dark:text-white">{city}</span>
                        <button
                          onClick={() => setSelectedCity(city)}
                          className="h-5.5 w-5.5 bg-[#B3121B] text-white rounded-full flex items-center justify-center hover:bg-slate-950 transition-colors"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-1">
                        {item.icon === 'cloud' && <Cloud className="h-8 w-8 text-slate-950 dark:text-white shrink-0" />}
                        {item.icon === 'rain' && <CloudRain className="h-8 w-8 text-slate-950 dark:text-white shrink-0" />}
                        {item.icon === 'sun' && <Sun className="h-8 w-8 text-[#B3121B] shrink-0" />}

                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="text-[12px] font-extrabold text-slate-900 dark:text-slate-200 flex items-center gap-1 select-none">
                            <Thermometer className="h-3.5 w-3.5 text-[#B3121B]" />
                            {item.temp}°C
                          </span>
                          <span className="text-[12px] font-extrabold text-slate-900 dark:text-slate-200 flex items-center gap-1 select-none">
                            <Droplet className="h-3.5 w-3.5 text-[#B3121B]" />
                            {item.humidity}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom update timestamp */}
              <div className="text-[10px] text-slate-500 font-semibold text-right select-none mt-2">
                Last Update: {lastUpdateStr || '2026-07-16 18:31'} (local time)
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
            {/* Left Area - Selected City AQI info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b lg:border-b-0 lg:border-r border-slate-300 dark:border-slate-800 pb-6 lg:pb-0 lg:pr-10">
              <div className="flex flex-col">
                <h3 className="text-lg md:text-xl font-black text-slate-950 dark:text-white">
                  {selectedCity} {isGu ? 'હવાની ગુણવત્તા સૂચકાંક (AQI)' : 'Air Quality Index'}
                </h3>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                  {isGu ? 'વર્તમાન વાયુ પ્રદૂષણ સ્તર' : 'Current air pollution levels'}
                </p>
                <div className="flex items-center gap-5 mt-4">
                  <div className="h-14 w-14 rounded-xl bg-[#B3121B] text-white flex items-center justify-center text-xl font-black shadow-md select-none">
                    {aqiData[selectedCity]?.value}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[16px] font-black text-slate-950 dark:text-white">
                      {isGu ? aqiData[selectedCity]?.labelGu : aqiData[selectedCity]?.label}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                      PM2.5: {aqiData[selectedCity]?.pm25 || 22} µg/m³ · PM10: {aqiData[selectedCity]?.pm10 || 45} µg/m³
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Area - Other Cities AQI */}
            <div className="flex flex-col gap-4">
              {/* City selector dropdown on top right */}
              <div className="self-end flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="appearance-none bg-white text-slate-950 dark:bg-slate-950 dark:text-white text-xs font-black px-4 py-2 pr-8 rounded-full border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B3121B] cursor-pointer shadow-sm"
                  >
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Vadodara">Vadodara</option>
                    <option value="Surat">Surat</option>
                    <option value="Rajkot">Rajkot</option>
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {otherCities.map((city) => {
                  const item = aqiData[city];
                  return (
                    <div
                      key={city}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between gap-3 min-w-[190px] hover:shadow-md hover:border-[#B3121B]/40 transition-all duration-300"
                    >
                      <span className="text-[13px] font-black text-slate-950 dark:text-white">{city}</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[12px] font-black text-white px-2.5 py-1 rounded bg-[#B3121B] shadow-sm select-none">
                          {item.value} AQI
                        </span>
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200">
                          {isGu ? item.labelGu : item.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold text-right select-none mt-2">
                Last Update: {lastUpdateStr || '2026-07-16 18:31'} (local time)
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  varsad: ['varsad', 'weather', 'rain', 'વરસાદ', 'હવામાન'],
  weather: ['weather', 'varsad', 'rain', 'વરસાદ', 'હવામાન'],
  rajkaran: ['rajkaran', 'politics', 'રાજકારણ'],
  politics: ['politics', 'rajkaran', 'રાજકારણ'],
  sports: ['sports', 'ramat-jagat', 'રમત-જગત', 'રમતગમત'],
  business: ['business', 'vepar', 'વેપાર'],
  education: ['education', 'shikshan', 'શિક્ષણ'],
  lifestyle: ['lifestyle', 'લાઇફસ્ટાઇલ'],
  election: ['election', 'election-2027', 'ચૂંટણી'],
  'gold-silver': ['gold-silver', 'gold', 'silver', 'સોના-ચાંદી'],
  health: ['health', 'helth', 'હેલ્થ', 'આરોગ્ય'],
  entertainment: ['entertainment', 'manoranjan', 'મનોરંજન'],
  technology: ['technology', 'tech', 'ટેકનોલોજી'],
};

/* ─── Dynamic Generic Category Section ─────────────────────────────────── */
export function DynamicCategorySection({ category, language }: { category: any; language: Language }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const catSlug = typeof category === 'string' ? category : (category?.slug || '');

  useEffect(() => {
    if (!catSlug) return;
    setLoading(true);

    const slugLower = catSlug.toLowerCase().trim();
    const synonyms = CATEGORY_SYNONYMS[slugLower] || [slugLower];

    Promise.all([
      getPublicArticles({ categorySlug: catSlug, limit: 20 }),
      synonyms.length > 1 ? getPublicArticles({ limit: 40 }) : Promise.resolve({ articles: [] })
    ]).then(([res1, res2]) => {
      const combined = [...(res1?.articles || []), ...(res2?.articles || [])];
      const uniqueMap = new Map();
      combined.forEach(a => { if (a && a.id) uniqueMap.set(a.id, a); });
      const allFetched = Array.from(uniqueMap.values());

      const targetSlug = slugLower;
      const targetName = (typeof category === 'object' ? (category?.name || '') : catSlug).toLowerCase().trim();
      const targetGu = (typeof category === 'object' ? (category?.nameGu || '') : catSlug).toLowerCase().trim();
      const searchTerms = Array.from(new Set([targetSlug, targetName, targetGu, ...synonyms.map(s => s.toLowerCase())])).filter(Boolean);

      const categoryFiltered = allFetched.filter((art: any) => {
        const artCatSlug = (art.category?.slug || art.categorySlug || '').toLowerCase().trim();
        const artCatName = (art.category?.name || art.categoryName || '').toLowerCase().trim();
        const artCatNameGu = (art.category?.nameGu || '').toLowerCase().trim();
        const artCatId = art.category?.id || art.categoryId;

        const artTitle = (art.title || '').toLowerCase();
        const artTitleGu = (art.titleGu || '').toLowerCase();
        const artExcerptGu = (art.excerptGu || art.excerpt || '').toLowerCase();

        return searchTerms.some(term => {
          if (!term || term.length < 2) return false;
          return (
            artCatSlug === term ||
            artCatName === term ||
            artCatNameGu === term ||
            (category?.id && artCatId === category.id) ||
            (term.length >= 3 && (artTitle.includes(term) || artTitleGu.includes(term) || artExcerptGu.includes(term)))
          );
        });
      });

      // Sort explicitly by publishedAt / createdAt descending (MOST RECENTLY UPLOADED ARTICLE FIRST)
      const sorted = [...categoryFiltered].sort((a, b) => {
        const timeA = new Date(a.publishedAt || (a as any).createdAt || 0).getTime();
        const timeB = new Date(b.publishedAt || (b as any).createdAt || 0).getTime();
        return timeB - timeA;
      });

      setArticles(sorted);
    }).catch((e) => console.warn(`Error loading articles for category ${catSlug}:`, e))
      .finally(() => setLoading(false));
  }, [catSlug, category]);

  const catNameGu = typeof category === 'object' ? (category?.nameGu || category?.name || catSlug) : catSlug;
  const catNameHi = typeof category === 'object' ? (category?.nameHi || category?.name || catSlug) : catSlug;
  const catNameEn = typeof category === 'object' ? (category?.name || catSlug) : catSlug;

  const categoryTitle = language === 'gu' ? catNameGu : (language === 'hi' ? catNameHi : catNameEn);

  if (loading) {
    return (
      <section className="mx-auto max-w-screen-xl px-4 mt-10 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted/60 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-64 rounded-xl bg-muted/30" />
          <div className="lg:col-span-5 h-64 rounded-xl bg-muted/30" />
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return (
      <section className="mx-auto max-w-screen-xl px-4 mt-10">
        <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 mb-4 select-none">
          <span className="bg-[#B3121B] text-white px-5 py-2 text-[16px] md:text-[18px] font-black rounded-lg leading-none tracking-tight">
            {categoryTitle}
          </span>
          <Link
            href={`/category/${catSlug}`}
            className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
          >
            {language === 'gu' ? 'બધા જુઓ →' : 'View All →'}
          </Link>
        </div>
        <div className="p-8 rounded-xl border border-dashed border-border/80 text-center text-muted-foreground bg-muted/10">
          <p className="text-sm font-extrabold">
            {language === 'gu'
              ? `"${categoryTitle}" કેટેગરીમાં ટૂંક સમયમાં નવા સમાચાર મૂકવામાં આવશે`
              : `Latest articles for "${categoryTitle}" will be published soon`}
          </p>
        </div>
      </section>
    );
  }

  const lead = articles[0]; // FIRST COME LATEST UPLOADED ARTICLE
  const sideArticles = articles.slice(1, 6);
  const isSingleArticle = articles.length === 1;

  return (
    <section className="mx-auto max-w-screen-xl px-4 mt-10">
      {/* Section Header - ALWAYS RED BRAND TAG */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 mb-4 select-none">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg leading-none tracking-tight">
          {categoryTitle}
        </span>
        <Link
          href={`/category/${catSlug}`}
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
        >
          {language === 'gu' ? 'બધા જુઓ →' : 'View All →'}
        </Link>
      </div>

      {/* DYNAMIC CONTENT LAYOUT BASED ON ARTICLE COUNT */}
      {isSingleArticle ? (
        /* SINGLE ARTICLE: FULL WIDTH BANNER CARD (THURS NO EMPTY RIGHT COLUMN) */
        <div className="bg-card border border-border/80 rounded-xl p-4 md:p-6 shadow-sm group">
          <Link href={`/news/${lead.slug}`} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 relative h-[240px] sm:h-[300px] md:h-[340px] w-full overflow-hidden rounded-xl bg-muted border border-border/20">
              <ArticleMedia
                src={lead.image || (lead as any).imageUrl || '/assets/demo/1.jpg'}
                alt={getArticleTitle(lead, language)}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute top-3 left-3 bg-[#B3121B] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-sm">
                {language === 'gu' ? 'તાજા સમાચાર' : 'LATEST'}
              </span>
            </div>

            <div className="md:col-span-5 flex flex-col justify-center space-y-3">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wide text-[#B3121B] bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded w-max">
                {categoryTitle}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-[#B3121B] transition-colors leading-snug">
                <AutoArticleTitle article={lead} language={language} />
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed font-medium">
                <AutoArticleExcerpt article={lead} language={language} />
              </p>
              <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground font-semibold border-t border-border/40">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>{formatDate(lead.publishedAt || (lead as any).createdAt, language)}</span>
              </div>
            </div>
          </Link>
        </div>
      ) : (
        /* MULTIPLE ARTICLES: MAIN FEATURED CARD ON LEFT + SIDE LIST ON RIGHT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Featured Lead Card (7 cols) */}
          {lead ? (
            <div className="lg:col-span-7 bg-card border border-border/80 rounded-xl p-4 shadow-sm group">
              <Link href={`/news/${lead.slug}`} className="flex flex-col gap-3">
                <div className="relative h-[240px] md:h-[300px] w-full overflow-hidden rounded-lg bg-muted border border-border/20">
                  <ArticleMedia
                    src={lead.image || (lead as any).imageUrl || '/assets/demo/1.jpg'}
                    alt={getArticleTitle(lead, language)}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 bg-[#B3121B] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-sm">
                    {language === 'gu' ? 'તાજા સમાચાર' : 'LATEST'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#B3121B] bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded">
                    {categoryTitle}
                  </span>
                  <h3 className="text-lg md:text-xl font-black text-foreground mt-2 line-clamp-2 group-hover:text-[#B3121B] transition-colors leading-snug">
                    <AutoArticleTitle article={lead} language={language} />
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1.5 line-clamp-2 font-medium">
                    <AutoArticleExcerpt article={lead} language={language} />
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground font-semibold">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span>{formatDate(lead.publishedAt || (lead as any).createdAt, language)}</span>
                  </div>
                </div>
              </Link>
            </div>
          ) : null}

          {/* Side Cards List (5 cols) */}
          <div className="lg:col-span-5 flex flex-col divide-y divide-border/50 bg-card border border-border/80 rounded-xl p-4 shadow-sm">
            {sideArticles.map((art) => (
              <Link
                key={art.id}
                href={`/news/${art.slug}`}
                className="group flex gap-3 py-3 first:pt-0 last:pb-0 hover:bg-muted/10 transition-colors"
              >
                <div className="relative h-[72px] w-[95px] shrink-0 overflow-hidden rounded-lg bg-muted border border-border/20">
                  <ArticleMedia
                    src={art.image || (art as any).imageUrl || '/assets/demo/2.jpg'}
                    alt={getArticleTitle(art, language)}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
                  <h4 className="text-[13px] font-extrabold text-foreground leading-snug line-clamp-2 group-hover:text-[#B3121B] transition-colors">
                    <AutoArticleTitle article={art} language={language} />
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold mt-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span>{formatDate(art.publishedAt || (art as any).createdAt, language)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── Entertainment · Tech · Health 3-Column Section ─────────────────── */
export function EntertainTechLifeSection({ language }: { language: Language }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryArticlesMap, setCategoryArticlesMap] = useState<Record<string, Article[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicCategories()
      .then(async (cats) => {
        const TARGET_SLUGS = ['health', 'entertainment', 'manoranjan', 'technology'];
        let matchedCats = Array.isArray(cats)
          ? cats.filter((c: any) => TARGET_SLUGS.includes((c.slug || '').toLowerCase()))
          : [];

        // Fallbacks if specific category records are missing in DB
        const fallbackCats = [
          { id: 'health', slug: 'health', name: 'Health', nameGu: 'હેલ્થ', nameHi: 'स्वास्थ्य' },
          { id: 'entertainment', slug: 'manoranjan', name: 'Entertainment', nameGu: 'મનોરંજન', nameHi: 'मनोरंजन' },
          { id: 'technology', slug: 'technology', name: 'Technology', nameGu: 'ટેકનોલોજી', nameHi: 'टेक्नोलॉजी' },
        ];

        // Combine to ensure we have exactly 3 target columns (Health, Entertainment, Technology)
        const finalCats: any[] = [];
        ['health', 'entertainment', 'technology'].forEach((target) => {
          const match = matchedCats.find((c) => {
            const s = (c.slug || '').toLowerCase();
            return s === target || (target === 'entertainment' && s === 'manoranjan');
          });
          if (match) {
            finalCats.push({ ...match, id: match.id || match.slug || target });
          } else {
            const fallback = fallbackCats.find((f) => f.slug === target || (target === 'entertainment' && f.slug === 'manoranjan'));
            if (fallback) finalCats.push(fallback);
          }
        });

        setCategories(finalCats);

        // Fetch articles for each of the 3 target categories in parallel
        const articlePromises = finalCats.map(async (cat: any) => {
          try {
            const res = await getPublicArticles({ categorySlug: cat.slug, limit: 4 });
            return { slug: cat.slug, articles: res.articles || [] };
          } catch (e) {
            console.warn(`Error fetching articles for category ${cat.slug}:`, e);
            return { slug: cat.slug, articles: [] };
          }
        });

        const results = await Promise.all(articlePromises);
        const map: Record<string, Article[]> = {};
        results.forEach((r) => {
          map[r.slug] = r.articles;
        });
        setCategoryArticlesMap(map);
      })
      .catch((err) => console.warn('Error loading 3-column dynamic section:', err))
      .finally(() => setLoading(false));
  }, []);

  type DisplayItem = { id?: string; slug?: string; img: string; title: string; titleGu: string; age: string };

  const getCategoryIcon = (slug: string) => {
    const s = slug.toLowerCase();
    if (s === 'health') {
      return (
        <svg className="h-4 w-4 text-[#B3121B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M12 9v6m-3-3h6" />
        </svg>
      );
    }
    if (s === 'entertainment' || s === 'manoranjan') {
      return (
        <svg className="h-4 w-4 text-[#B3121B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M7 3v18M17 3v18M3 7.5h18M3 12h18M3 16.5h18" />
        </svg>
      );
    }
    if (s === 'technology') {
      return (
        <svg className="h-4 w-4 text-[#B3121B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect width="16" height="16" x="4" y="4" rx="2" />
          <rect width="6" height="6" x="9" y="9" rx="1" />
          <path d="M15 2v2M9 2v2M15 20v2M9 20v2M20 15h2M20 9h2M2 15h2M2 9h2" />
        </svg>
      );
    }
    return (
      <svg className="h-4 w-4 text-[#B3121B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      </svg>
    );
  };

  const col = (
    titleGu: string,
    titleEn: string,
    href: string,
    items: DisplayItem[],
    btnTextGu: string,
    btnTextEn: string,
    icon: React.ReactNode
  ) => (
    <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm flex flex-col justify-between min-w-0">
      <div>
        <div className="flex flex-col mb-4 select-none">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <Link href={href} className="flex items-center gap-1 group/title">
              <h3 className="text-[16px] md:text-[17px] font-black text-foreground leading-none group-hover:text-[#B3121B] transition-colors">
                {language === 'gu' ? titleGu : titleEn}
              </h3>
            </Link>
          </div>
          <div className="h-0.5 w-8 bg-[#B3121B] mt-2 rounded-full" />
        </div>

        <div className="flex flex-col divide-y divide-border/40">
          {items.map((a, i) => (
            <Link
              key={a.id || a.slug || `art-${i}`}
              href={a.slug ? `/news/${a.slug}` : href}
              className="group flex gap-3 py-3 hover:bg-muted/10 transition-colors"
            >
              <div className="relative h-[68px] w-[84px] shrink-0 overflow-hidden rounded-lg bg-muted border border-border/20">
                <Image
                  src={a.img}
                  alt={a.titleGu}
                  fill
                  sizes="84px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
                <h4 className="text-[12.5px] md:text-[13px] font-black text-foreground leading-snug line-clamp-2 group-hover:text-[#B3121B] transition-colors">
                  <AutoTranslateString text={a.titleGu || a.title} language={language} />
                </h4>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-semibold select-none">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>{a.age}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Link
        href={href}
        className="mt-4 w-full border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 text-[#B3121B] font-extrabold text-[12.5px] md:text-[13px] py-2.5 rounded-lg text-center hover:bg-[#B3121B] hover:text-white transition-all block select-none"
      >
        {language === 'gu' ? btnTextGu : btnTextEn}
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 mt-8 py-10 flex justify-center items-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-[#B3121B] mr-2" />
        <span>લોડ થઈ રહ્યું છે...</span>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-8">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-6">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu'
            ? 'હેલ્થ   •   મનોરંજન   •   ટેકનોલોજી'
            : language === 'hi'
              ? 'स्वास्थ्य   •   मनोरंजन   •   टेक्नोलॉजी'
              : 'Health   •   Entertainment   •   Technology'}
        </span>
      </div>

      {/* Dynamic 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, catIdx) => {
          const catArticles = categoryArticlesMap[cat.slug] || [];
          const items = catArticles.map((art) => ({
            id: art.id,
            slug: art.slug,
            img: art.image || '/assets/demo/2.jpg',
            title: art.title,
            titleGu: art.titleGu || art.title,
            age: formatTime(art.publishedAt),
          }));

          return (
            <div key={cat.id || cat.slug || `cat-col-${catIdx}`}>
              {col(
                cat.nameGu || cat.name,
                cat.name,
                `/category/${cat.slug}`,
                items,
                `વધુ ${cat.nameGu || cat.name} સમાચાર જુઓ`,
                `More ${cat.name} News`,
                getCategoryIcon(cat.slug)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --- Photo Gallery Section ------------------------------------------------- */
const GALLERY_DATA = [
  {
    id: 'gal1',
    src: '/assets/demo/6.jpg',
    titleGu: 'નવરાત્રિની રંગીન તૈયારીઓ! તસવીરોમાં જુઓ ધમાલ',
    title: 'Navratri colourful preparations! See the fun in photos',
    count: 12,
  },
  {
    id: 'gal2',
    src: '/assets/demo/3.jpg',
    titleGu: 'ગિરનાર લીલી પરિક્રમા: ભક્તિનો મહાસાગર ઉમટ્યો',
    title: 'Girnar Lili Parikrama: A sea of devotion gathered',
    count: 68,
  },
  {
    id: 'gal3',
    src: '/assets/demo/2.jpg',
    titleGu: 'અમદાવાદ ક્લાવર શો 2025ની અદ્ભૂત ઝલક',
    title: 'A wonderful glimpse of Ahmedabad Clover Show 2025',
    count: 34,
  },
];

function PhotoGallerySection({ language }: { language: Language }) {
  const CATS_GU = ['ગુજરાત', 'સંસ્કૃતિ', 'ધર્મ', 'પ્રવાસ', 'ખેલ', 'ઉત્સવ', 'શહેર', 'પ્રકૃતિ', 'ઐતિહાસ'];
  const CATS_EN = ['Gujarat', 'Culture', 'Religion', 'Travel', 'Sports', 'Festival', 'City', 'Nature', 'Heritage'];

  const [photos, setPhotos] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  useEffect(() => {
    getPublicGallery().then((res) => {
      let items = res && res.length > 0 ? [...res] : [...PHOTOS];
      if (items.length < 5) {
        const existingIds = new Set(items.map((p: any) => p.id || p.src));
        for (const defPhoto of PHOTOS) {
          if (items.length >= 5) break;
          if (!existingIds.has(defPhoto.id) && !existingIds.has(defPhoto.src)) {
            items.push(defPhoto);
          }
        }
      }
      setPhotos(items.slice(0, 5));
    });
  }, []);

  const galleryList = photos.length > 0 ? photos.slice(0, 5) : PHOTOS.slice(0, 5);

  // Duplicate galleryList 3 times to create a seamless infinite scroll strip
  const repeatedGallery = [
    ...galleryList,
    ...galleryList,
    ...galleryList,
  ];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.style.scrollBehavior = 'auto';
    const SPEED = 72; // px per second (~1.2px/frame)
    lastTimeRef.current = performance.now();

    let animId: number;
    const scrollStep = (now: number) => {
      const dt = Math.min(now - lastTimeRef.current, 50);
      lastTimeRef.current = now;

      const singleSetWidth = el.scrollWidth / 3;

      if (!isPausedRef.current && singleSetWidth > 0) {
        scrollPosRef.current += (SPEED * dt) / 1000;
        if (scrollPosRef.current >= singleSetWidth) {
          scrollPosRef.current = scrollPosRef.current % singleSetWidth;
        }
        el.scrollLeft = scrollPosRef.current;
      }
      animId = requestAnimationFrame(scrollStep);
    };

    animId = requestAnimationFrame(scrollStep);

    const handleNativeScroll = () => {
      if (el) scrollPosRef.current = el.scrollLeft;
    };

    el.addEventListener('scroll', handleNativeScroll, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('scroll', handleNativeScroll);
    };
  }, [photos]);

  return (
    <>
      <section className="py-6 bg-background select-none">
        <div className="mx-auto max-w-screen-xl px-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-6">
            <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
              {language === 'gu' ? 'ફોટો   ગેલેરી' : language === 'hi' ? 'फोटो   गैलरी' : 'Photo   Gallery'}
            </span>
            <Link
              href="/photos"
              className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
            >
              {language === 'gu' ? 'વધુ ફોટો ગેલેરી →' : 'More Photo Gallery →'}
            </Link>
          </div>

          {/* Scrollable Magazine Flex Strip */}
          <div
            ref={scrollRef}
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; lastTimeRef.current = performance.now(); }}
            className="flex gap-4 overflow-x-auto scrollbar-hide py-2"
          >
            {repeatedGallery.map((item, index) => {
              const cat = item.category || (language === 'gu' ? CATS_GU[index % CATS_GU.length] : CATS_EN[index % CATS_EN.length]);
              const title = getLocalized(language, { en: item.caption || item.alt, gu: item.captionGu || item.caption || item.alt, hi: item.captionHi || item.caption || item.alt });

              return (
                <Link
                  key={item.id + '-' + index}
                  href={`/photos/${item.id}`}
                  className="group relative flex flex-shrink-0 w-[85vw] sm:w-[48vw] md:w-[350px] h-[280px] md:h-[350px] overflow-hidden rounded-2xl shadow-lg"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {/* Image */}
                  <Image
                    src={item.src}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, 330px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                  />

                  {/* Top gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

                  {/* Bottom strong gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-100" style={{ opacity: 0.85 }} />

                  {/* Category chip */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-[#B3121B] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-lg">
                      {cat}
                    </span>
                  </div>

                  {/* Caption */}
                  <div className="absolute inset-x-0 bottom-0 z-10 p-4 translate-y-0 group-hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-white font-bold leading-snug line-clamp-2 drop-shadow-lg text-[14px] md:text-[16px]">
                      <AutoTranslateString text={title} language={language} />
                    </p>

                    {/* View Photos — on hover */}
                    <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="h-[1.5px] w-7 bg-[#B3121B] rounded-full" />
                      <span className="text-white/75 text-[11px] font-semibold tracking-wider uppercase">
                        {language === 'gu' ? 'ફોટો જુઓ' : 'View Photos'}
                      </span>
                      <svg className="h-3 w-3 text-[#B3121B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Red border glow on hover */}
                  <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ boxShadow: 'inset 0 0 0 2px #B3121B' }} />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Short Videos Section — Placed right after Photo Gallery */}
      <YouTubeShorts />
    </>
  );
}


/* --- Trending News Section ------------------------------------------------- */
function TrendingNewsSection({ articles, language }: { articles: Article[]; language: Language }) {
  if (!articles || !articles.length) return null;

  return (
    <section className="py-4 bg-background">
      <div className="mx-auto max-w-screen-xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span className="bg-[#e02020] text-white text-[13px] font-extrabold px-3 py-1 rounded-sm select-none">
            {language === 'gu' ? 'ટ્રેન્ડિંગ ન્યૂઝ' : 'Trending News'}
          </span>
        </div>
        {/* Underline */}
        <div className="h-[2.5px] w-full bg-foreground/80 mb-5" />

        {/* Grid layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {articles.slice(0, 5).map((article, index) => (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className="group relative block w-full overflow-hidden rounded-xl border border-border/10 bg-muted shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
              style={{ aspectRatio: '4/3' }}
            >
              <Image
                src={
                  article.image && !article.image.includes('photo-1599930113854') && !article.image.includes('photo-1589308078059')
                    ? article.image
                    : [
                      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=80',
                    ][index % 10]
                }
                alt={getArticleTitle(article, language)}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

              {/* Trending Rank Number Circle */}
              <div
                className={`absolute top-3 left-3 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white shadow-sm ${index < 3 ? 'bg-[#e02020]' : 'bg-black/60'
                  }`}
              >
                {index + 1}
              </div>

              {/* Title at bottom */}
              <div className="absolute bottom-0 inset-x-0 p-3">
                <p className="text-white text-[12.5px] font-extrabold leading-snug line-clamp-2 drop-shadow">
                  {getArticleTitle(article, language)}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-white/85">
                  <Clock className="h-2.5 w-2.5" />
                  <span>
                    {language === 'gu'
                      ? (article.relativeTimeGu || formatDate(article.publishedAt))
                      : language === 'hi'
                        ? (article.relativeTimeHi || formatDate(article.publishedAt))
                        : (article.relativeTime || formatDate(article.publishedAt))}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


