import { Metadata } from 'next';
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
    {
      id: 'feed-home',
      slug: 'home',
      name: 'Home News',
      nameGu: 'મુખ્ય સમાચાર',
      nameHi: 'मुख्य समाचार',
      descriptionGu: 'તાજા અને મહત્વપૂર્ણ સમાચારોની સંપૂર્ણ ફીડ',
      descriptionHi: 'ताजा और महत्वपूर्ण समाचारों की संपूर्ण फीड',
      descriptionEn: 'Full feed of breaking and top headlines',
    },
    {
      id: 'feed-videos',
      slug: 'videos',
      name: 'Videos',
      nameGu: 'વીડિયો',
      nameHi: 'वीडियो',
      descriptionGu: 'વીડિયો રિપોર્ટ અને સ્પેશિયલ સ્ટોરીઝ',
      descriptionHi: 'वीडियो रिपोर्ट और स्पेशल स्टोरीज',
      descriptionEn: 'Video reports and special ground stories',
    },
    {
      id: 'feed-gujarat',
      slug: 'gujarat',
      name: 'Gujarat',
      nameGu: 'ગુજરાત',
      nameHi: 'गुजरात',
      descriptionGu: 'સમગ્ર ગુજરાત રાજ્યના તાજા સમાચારો',
      descriptionHi: 'समग्र गुजरात राज्य के ताजा समाचार',
      descriptionEn: 'Latest news across Gujarat state',
    },
    {
      id: 'feed-national',
      slug: 'national',
      name: 'National',
      nameGu: 'ભારત',
      nameHi: 'भारत',
      descriptionGu: 'દેશભરના મુખ્ય સમાચારો',
      descriptionHi: 'देशभर के मुख्य समाचार',
      descriptionEn: 'Top national headlines across India',
    },
    {
      id: 'feed-world',
      slug: 'world',
      name: 'World',
      nameGu: 'વિશ્વ',
      nameHi: 'विदेश',
      descriptionGu: 'આંતરરાષ્ટ્રીય સમાચારો',
      descriptionHi: 'अंतरराष्ट्रीय समाचार',
      descriptionEn: 'Global and international world news',
    },
    {
      id: 'feed-politics',
      slug: 'politics',
      name: 'Politics',
      nameGu: 'રાજનીતિ',
      nameHi: 'राजनीति',
      descriptionGu: 'રાજકીય ઘટનાક્રમ અને ચૂંટણી વિશ્લેષણ',
      descriptionHi: 'राजनीतिक घटनाक्रम और चुनाव विश्लेषण',
      descriptionEn: 'Political updates and election coverage',
    },
    {
      id: 'feed-crime',
      slug: 'crime',
      name: 'Crime',
      nameGu: 'ક્રાઇમ',
      nameHi: 'क्राइम',
      descriptionGu: 'પોલીસ અને ક્રાઈમ સમાચારો',
      descriptionHi: 'पुलिस और क्राइम समाचार',
      descriptionEn: 'Police, investigation and crime reports',
    },
    {
      id: 'feed-health',
      slug: 'health',
      name: 'Health',
      nameGu: 'હેલ્થ',
      nameHi: 'हेल्थ',
      descriptionGu: 'સ્વાસ્થ્ય, ફિટનેસ અને આહાર અંગેના સમાચારો',
      descriptionHi: 'स्वास्थ्य, फिटनेस और आहार संबंधी समाचार',
      descriptionEn: 'Health, wellness, fitness and medical news',
    },
    {
      id: 'feed-entertainment',
      slug: 'entertainment-life-style',
      name: 'Entertainment',
      nameGu: 'મનોરંજન',
      nameHi: 'मनोरंजन',
      descriptionGu: 'બોલીવુડ, સિનેમા અને લાઇફસ્ટાઇલ',
      descriptionHi: 'बॉलीवुड, सिनेमा और लाइफस्टाइल',
      descriptionEn: 'Cinema, Bollywood and lifestyle buzz',
    },
    {
      id: 'feed-technology',
      slug: 'technology',
      name: 'Technology',
      nameGu: 'ટેકનોલોજી',
      nameHi: 'टेक्नोलॉजी',
      descriptionGu: 'સ્માર્ટફોન, ગેજેટ્સ અને ડિજિટલ સમાચાર',
      descriptionHi: 'स्मार्टफोन, गैजेट्स और डिजिटल समाचार',
      descriptionEn: 'Gadgets, smartphones and digital innovations',
    },
    {
      id: 'feed-photos',
      slug: 'photos',
      name: 'Photo Gallery',
      nameGu: 'ફોટો ગેલેરી',
      nameHi: 'फोटो गैलरी',
      descriptionGu: 'તસવીરોમાં સમાચાર અને ફોટો આલ્બમ',
      descriptionHi: 'तस्वीरों में समाचार और फोटो एल्बम',
      descriptionEn: 'Photo galleries and visual news albums',
    },
    {
      id: 'feed-fact-check',
      slug: 'fact-check',
      name: 'Fact Check',
      nameGu: 'ફેક્ટ ચેક',
      nameHi: 'फैक्ट चेक',
      descriptionGu: 'સત્ય તપાસ અને વાયરલ દાવાઓનું સત્ય',
      descriptionHi: 'सत्य जांच और वायरल दावों का सच',
      descriptionEn: 'Truth investigation and viral claim checks',
    },
    {
      id: 'feed-trending',
      slug: 'trending',
      name: 'Trending',
      nameGu: 'ટ્રેન્ડિંગ',
      nameHi: 'ट्रेंडिंग',
      descriptionGu: 'વાયરલ અને લોકપ્રિય સ્ટોરીઝ',
      descriptionHi: 'वायरल और लोकप्रिय स्टोरीज',
      descriptionEn: 'Viral and most trending buzz stories',
    },
    {
      id: 'feed-instagram',
      slug: 'instagram',
      name: 'Instagram Reels',
      nameGu: 'ઇન્સ્ટાગ્રામ',
      nameHi: 'इंस्टाग्राम',
      descriptionGu: 'સોશિયલ મીડિયા અને ઇન્સ્ટાગ્રામ વિઝ્યુઅલ સ્ટોરીઝ',
      descriptionHi: 'सोशल मीडिया और इंस्टाग्राम विजुअल स्टोरीज',
      descriptionEn: 'Social media reels and visual stories',
    },
    {
      id: 'feed-shorts',
      slug: 'shorts',
      name: 'Shorts',
      nameGu: 'શોર્ટ્સ',
      nameHi: 'शॉर्ट्स',
      descriptionGu: 'ટૂંકા વીડિયો અને શોર્ટ્સ સમાચારો',
      descriptionHi: 'छोटे वीडियो और शॉर्ट्स समाचार',
      descriptionEn: 'Short video clips and news byte reels',
    },

    // ── Gujarat Cities / District Bar ──
    {
      id: 'feed-ahmedabad',
      slug: 'ahmedabad',
      name: 'Ahmedabad',
      nameGu: 'અમદાવાદ',
      nameHi: 'अहमदाबाद',
      descriptionGu: 'અમદાવાદ મહાનગરના સમાચારો',
      descriptionHi: 'अहमदाबाद महानगर के समाचार',
      descriptionEn: 'Ahmedabad city updates and local news',
    },
    {
      id: 'feed-surat',
      slug: 'surat',
      name: 'Surat',
      nameGu: 'સુરત',
      nameHi: 'सूरत',
      descriptionGu: 'હીરાનગરી સુરતના સમાચારો',
      descriptionHi: 'हीरानगरी सूरत के समाचार',
      descriptionEn: 'Surat diamond city and South Gujarat news',
    },
    {
      id: 'feed-rajkot',
      slug: 'rajkot',
      name: 'Rajkot',
      nameGu: 'રાજકોટ',
      nameHi: 'राजकोट',
      descriptionGu: 'રંગીલા રાજકોટના સમાચારો',
      descriptionHi: 'रंगीला राजकोट के समाचार',
      descriptionEn: 'Rajkot and Saurashtra regional updates',
    },
    {
      id: 'feed-vadodara',
      slug: 'vadodara',
      name: 'Vadodara',
      nameGu: 'વડોદરા',
      nameHi: 'वडोदरा',
      descriptionGu: 'સંસ્કારી નગરી વડોદરાના સમાચારો',
      descriptionHi: 'संस्कारी नगरी वडोदरा के समाचार',
      descriptionEn: 'Vadodara cultural capital and Central Gujarat',
    },
    {
      id: 'feed-gandhinagar',
      slug: 'gandhinagar',
      name: 'Gandhinagar',
      nameGu: 'ગાંધીનગર',
      nameHi: 'गांधीनगर',
      descriptionGu: 'પાટનગર ગાંધીનગરના સમાચારો',
      descriptionHi: 'राजधानी गांधीनगर के समाचार',
      descriptionEn: 'State capital Gandhinagar & government news',
    },
    {
      id: 'feed-other-cities',
      slug: 'other-cities',
      name: 'Other Cities',
      nameGu: 'અન્ય શહેરો',
      nameHi: 'अन्य शहर',
      descriptionGu: 'ગુજરાતના અન્ય શહેરો અને ગામડાંના સમાચારો',
      descriptionHi: 'गुजरात के अन्य शहरों और गांवों के समाचार',
      descriptionEn: 'Regional cities, towns and rural Gujarat',
    },
  ];

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://gujaratpost.in' : 'http://localhost:3000');

  return <RssDirectoryClient categories={NAVBAR_AND_CITY_FEEDS} siteUrl={siteUrl} />;
}
