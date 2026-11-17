import type { Metadata } from 'next';
import { Suspense } from 'react';
import AqiSkeleton from '@/components/aqi/AqiSkeleton';
import { getPublicArticles, getHeroSettings } from '@/lib/api';
import { getHomeNewsArticles } from '@/lib/articleCategory';
import AqiClient from './AqiClient';

// Next.js ISR cache revalidation interval (30 seconds, matching homepage)
export const revalidate = 30;

export const metadata: Metadata = {
  title: 'લાઈવ AQI | હવા ગુણવત્તા સૂચકાંક | Gujarat Post',
  description: 'અમદાવાદ, સુરત, વડોદરા, રાજકોટ સહિત ગુજરાત અને દેશભરના શહેરોનો લાઈવ એર ક્વોલિટી ઇન્ડેક્સ (AQI) અને પ્રદૂષણ સ્તર જુઓ.',
  alternates: {
    canonical: 'https://gujaratpost.in/aqi',
  },
  openGraph: {
    title: 'લાઈવ AQI | હવા ગુણવત્તા સૂચકાંક | Gujarat Post',
    description: 'અમદાવાદ, સુરત, વડોદરા, રાજકોટ સહિત ગુજરાત અને દેશભરના શહેરોનો લાઈવ એર ક્વોલિટી ઇન્ડેક્સ (AQI) અને પ્રદૂષણ સ્તર જુઓ.',
    url: 'https://gujaratpost.in/aqi',
    siteName: 'Gujarat Post',
    locale: 'gu_IN',
    type: 'website',
  },
};

export default async function AqiPage() {
  const [heroSettings, articlesRes] = await Promise.all([
    getHeroSettings(true).catch(() => null),
    getPublicArticles({ limit: 60, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
  ]);

  const initialNewsArticles = getHomeNewsArticles(articlesRes?.articles || [], heroSettings);

  return (
    <Suspense fallback={<AqiSkeleton />}>
      <AqiClient initialNewsArticles={initialNewsArticles} />
    </Suspense>
  );
}
