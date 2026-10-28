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
  // Strictly the categories that appear in the Navigation Bar + Gujarat Cities (District Bar)
  const NAVBAR_AND_CITY_FEEDS = [
    // ── Main Navbar Categories ──
    { id: 'feed-home', slug: 'home', name: 'Home News', nameGu: 'મુખ્ય સમાચાર', descriptionGu: 'તાજા અને મહત્વપૂર્ણ સમાચારોની સંપૂર્ણ ફીડ' },
    { id: 'feed-videos', slug: 'videos', name: 'Videos', nameGu: 'વીડિયો', descriptionGu: 'વીડિયો રિપોર્ટ અને સ્પેશિયલ સ્ટોરીઝ' },
    { id: 'feed-gujarat', slug: 'gujarat', name: 'Gujarat', nameGu: 'ગુજરાત', descriptionGu: 'સમગ્ર ગુજરાત રાજ્યના તાજા સમાચારો' },
    { id: 'feed-national', slug: 'national', name: 'National', nameGu: 'ભારત', descriptionGu: 'દેશભરના મુખ્ય સમાચારો' },
    { id: 'feed-world', slug: 'world', name: 'World', nameGu: 'વિશ્વ', descriptionGu: 'આંતરરાષ્ટ્રીય સમાચારો' },
    { id: 'feed-politics', slug: 'politics', name: 'Politics', nameGu: 'રાજનીતિ', descriptionGu: 'રાજકીય ઘટનાક્રમ અને ચૂંટણી વિશ્લેષણ' },
    { id: 'feed-crime', slug: 'crime', name: 'Crime', nameGu: 'ક્રાઇમ', descriptionGu: 'પોલીસ અને ક્રાઈમ સમાચારો' },
    { id: 'feed-health', slug: 'health', name: 'Health', nameGu: 'હેલ્થ', descriptionGu: 'સ્વાસ્થ્ય, ફિટનેસ અને આહાર અંગેના સમાચારો' },
    { id: 'feed-entertainment', slug: 'entertainment-life-style', name: 'Entertainment', nameGu: 'મનોરંજન', descriptionGu: 'બોલીવુડ, સિનેમા અને લાઇફસ્ટાઇલ' },
    { id: 'feed-technology', slug: 'technology', name: 'Technology', nameGu: 'ટેકનોલોજી', descriptionGu: 'સ્માર્ટફોન, ગેજેટ્સ અને ડિજિટલ સમાચાર' },
    { id: 'feed-photos', slug: 'photos', name: 'Photo Gallery', nameGu: 'ફોટો ગેલેરી', descriptionGu: 'તસવીરોમાં સમાચાર અને ફોટો આલ્બમ' },
    { id: 'feed-fact-check', slug: 'fact-check', name: 'Fact Check', nameGu: 'ફેક્ટ ચેક', descriptionGu: 'સત્ય તપાસ અને વાયરલ દાવાઓનું સત્ય' },
    { id: 'feed-trending', slug: 'trending', name: 'Trending', nameGu: 'ટ્રેન્ડિંગ', descriptionGu: 'વાયરલ અને લોકપ્રિય સ્ટોરીઝ' },
    { id: 'feed-instagram', slug: 'instagram', name: 'Instagram Reels', nameGu: 'ઇન્સ્ટાગ્રામ', descriptionGu: 'સોશિયલ મીડિયા અને ઇન્સ્ટાગ્રામ વિઝ્યુઅલ સ્ટોરીઝ' },
    { id: 'feed-shorts', slug: 'shorts', name: 'Shorts', nameGu: 'શોર્ટ્સ', descriptionGu: 'ટૂંકા વીડિયો અને શોર્ટ્સ સમાચારો' },

    // ── Gujarat Cities / District Bar ──
    { id: 'feed-ahmedabad', slug: 'ahmedabad', name: 'Ahmedabad', nameGu: 'અમદાવાદ', descriptionGu: 'અમદાવાદ મહાનગરના સમાચારો' },
    { id: 'feed-surat', slug: 'surat', name: 'Surat', nameGu: 'સુરત', descriptionGu: 'હીરાનગરી સુરતના સમાચારો' },
    { id: 'feed-rajkot', slug: 'rajkot', name: 'Rajkot', nameGu: 'રાજકોટ', descriptionGu: 'રંગીલા રાજકોટના સમાચારો' },
    { id: 'feed-vadodara', slug: 'vadodara', name: 'Vadodara', nameGu: 'વડોદરા', descriptionGu: 'સંસ્કારી નગરી વડોદરાના સમાચારો' },
    { id: 'feed-gandhinagar', slug: 'gandhinagar', name: 'Gandhinagar', nameGu: 'ગાંધીનગર', descriptionGu: 'પાટનગર ગાંધીનગરના સમાચારો' },
    { id: 'feed-other-cities', slug: 'other-cities', name: 'Other Cities', nameGu: 'અન્ય શહેરો', descriptionGu: 'ગુજરાતના અન્ય શહેરો અને ગામડાંના સમાચારો' },
  ];

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://gujaratpost.in' : 'http://localhost:3000');

  return <RssDirectoryClient categories={NAVBAR_AND_CITY_FEEDS} siteUrl={siteUrl} />;
}

