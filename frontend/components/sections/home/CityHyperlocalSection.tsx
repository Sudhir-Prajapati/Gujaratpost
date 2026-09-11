'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, ChevronRight, ChevronLeft, MapPin, Sparkles, TrendingUp, Flame, Radio } from 'lucide-react';
import type { Article, Language } from '@/types';
import { formatTime, getLocalized } from '@/data';
import { getTrendingTopicHref } from '@/lib/utils';
import SidebarAdBanner from '@/components/ads/SidebarAdBanner';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import { stripHtmlTags, getLocalizedTrendingTags } from './homeHelpers';

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
export default function CityHyperlocalSection({
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
            enableTributeSlides={false}
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
export { CityHyperlocalSection };

