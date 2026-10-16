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
  const categories = (Array.isArray(rawCategories) ? rawCategories : [])
    .filter((cat: any) => cat.isActive !== false)
    .map((cat: any) => ({
      id: cat.id || cat.slug,
      name: cat.name,
      nameGu: cat.nameGu || cat.name,
      slug: cat.slug,
      descriptionGu: cat.descriptionGu || '',
    }));

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://gujaratpost.in' : 'http://localhost:3000');

  return <RssDirectoryClient categories={categories} siteUrl={siteUrl} />;
}
