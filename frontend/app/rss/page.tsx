import { Metadata } from 'next';
import { getPublicCategories } from '@/lib/api';
import RssDirectoryClient from './RssDirectoryClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'RSS Feeds Directory | ગુજરાત સમાચાર RSS ફીડ્સ | Gujarat Post',
  description:
    'Subscribe to Gujarat Post RSS 2.0 feeds for all breaking news, state politics, Gujarat cities, sports, entertainment, business, and crime coverage.',
  alternates: {
    canonical: '/rss',
    types: {
      'application/rss+xml': '/rss.xml',
    },
  },
  openGraph: {
    title: 'Gujarat Post RSS Feeds Directory | ગુજરાત સમાચાર RSS ફીડ્સ',
    description:
      'Subscribe to Gujarat Post RSS 2.0 feeds for breaking news, state, national, cities, and special desks.',
    url: '/rss',
    type: 'website',
  },
};

export default async function RssPage() {
  const rawCategories = await getPublicCategories().catch(() => []);
  const dbCategories = (Array.isArray(rawCategories) ? rawCategories : [])
    .filter((cat: any) => cat.isActive !== false)
    .map((cat: any) => ({
      id: cat.id || cat.slug,
      name: cat.name,
      nameGu: cat.nameGu || cat.name,
      slug: cat.slug,
      descriptionGu: cat.descriptionGu || '',
    }));

  const ESSENTIAL_FEEDS = [
    { id: 'feed-home', slug: 'home', name: 'Home News', nameGu: 'મુખ્ય સમાચાર', descriptionGu: 'તાજા અને મહત્વપૂર્ણ સમાચારોની સંપૂર્ણ ફીડ' },
    { id: 'feed-gujarat', slug: 'gujarat', name: 'Gujarat', nameGu: 'ગુજરાત', descriptionGu: 'સમગ્ર ગુજરાતના તાજા સમાચારો' },
    { id: 'feed-politics', slug: 'politics', name: 'Politics', nameGu: 'રાજનીતિ', descriptionGu: 'રાજકીય ઘટનાક્રમ અને ચૂંટણી વિશ્લેષણ' },
    { id: 'feed-national', slug: 'national', name: 'National', nameGu: 'ભારત', descriptionGu: 'દેશભરના મુખ્ય સમાચારો' },
    { id: 'feed-world', slug: 'world', name: 'World', nameGu: 'વિશ્વ', descriptionGu: 'આંતરરાષ્ટ્રીય સમાચારો' },
    { id: 'feed-gandhinagar', slug: 'gandhinagar', name: 'Gandhinagar', nameGu: 'ગાંધીનગર', descriptionGu: 'પાટનગર ગાંધીનગરના સમાચારો' },
    { id: 'feed-ahmedabad', slug: 'ahmedabad', name: 'Ahmedabad', nameGu: 'અમદાવાદ', descriptionGu: 'અમદાવાદ મહાનગરના સમાચારો' },
    { id: 'feed-surat', slug: 'surat', name: 'Surat', nameGu: 'સુરત', descriptionGu: 'હીરાનગરી સુરતના સમાચારો' },
    { id: 'feed-vadodara', slug: 'vadodara', name: 'Vadodara', nameGu: 'વડોદરા', descriptionGu: 'સંસ્કારી નગરી વડોદરાના સમાચારો' },
    { id: 'feed-rajkot', slug: 'rajkot', name: 'Rajkot', nameGu: 'રાજકોટ', descriptionGu: 'રંગીલા રાજકોટના સમાચારો' },
    { id: 'feed-other-cities', slug: 'other-cities', name: 'Other Cities', nameGu: 'અન્ય શહેરો', descriptionGu: 'ગુજરાતના અન્ય શહેરો અને ગામડાંના સમાચારો' },
    { id: 'feed-crime', slug: 'crime', name: 'Crime', nameGu: 'ક્રાઇમ', descriptionGu: 'પોલીસ અને ક્રાઈમ સમાચારો' },
    { id: 'feed-health', slug: 'health', name: 'Health', nameGu: 'આરોગ્ય & હેલ્થ', descriptionGu: 'સ્વાસ્થ્ય, યોગ અને આહાર અંગેના સમાચારો' },
    { id: 'feed-technology', slug: 'technology', name: 'Technology', nameGu: 'ટેકનોલોજી', descriptionGu: 'સ્માર્ટફોન, ગેજેટ્સ અને ડિજિટલ સમાચાર' },
    { id: 'feed-entertainment', slug: 'entertainment-life-style', name: 'Entertainment & Lifestyle', nameGu: 'મનોરંજન & લાઇફસ્ટાઇલ', descriptionGu: 'બોલીવુડ, ટીવી અને લાઇફસ્ટાઇલ' },
    { id: 'feed-trending', slug: 'trending', name: 'Trending', nameGu: 'ટ્રેન્ડિંગ', descriptionGu: 'વાયરલ અને લોકપ્રિય સ્ટોરીઝ' },
    { id: 'feed-fact-check', slug: 'fact-check', name: 'Fact Check', nameGu: 'ફેક્ટ ચેક', descriptionGu: 'સત્ય તપાસ અને વાયરલ દાવાઓનું સત્ય' },
    { id: 'feed-photos', slug: 'photos', name: 'Photo Gallery', nameGu: 'ફોટો ગેલેરી', descriptionGu: 'તસવીરોમાં સમાચાર અને ફોટો આલ્બમ' },
    { id: 'feed-videos', slug: 'videos', name: 'Videos', nameGu: 'વીડિયો', descriptionGu: 'વીડિયો રિપોર્ટ અને સ્પેશિયલ સ્ટોરીઝ' },
    { id: 'feed-instagram', slug: 'instagram', name: 'Instagram Reels', nameGu: 'ઇન્સ્ટાગ્રામ રીલ્સ', descriptionGu: 'સોશિયલ મીડિયા અને ઇન્સ્ટાગ્રામ વિઝ્યુઅલ સ્ટોરીઝ' },
  ];

  // Merge unique by slug
  const knownSlugs = new Set(ESSENTIAL_FEEDS.map((f) => f.slug));
  const mergedCategories = [
    ...ESSENTIAL_FEEDS,
    ...dbCategories.filter((c: any) => !knownSlugs.has(c.slug)),
  ];

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://gujaratpost.in' : 'http://localhost:3000');

  return <RssDirectoryClient categories={mergedCategories} siteUrl={siteUrl} />;
}

