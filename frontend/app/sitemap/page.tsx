import { Metadata } from 'next';
import { getPublicCategories } from '@/lib/api';
import SitemapClient from './SitemapClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Site Map | Gujarat Post - સાઇટમેપ & તમામ શ્રેણીઓ',
  description:
    'Explore the complete sitemap of Gujarat Post. Explore all active news categories, city news desks, multimedia shows, e-paper editions, and company pages.',
};

export default async function SitemapPage() {
  const categories = await getPublicCategories().catch(() => []);
  return <SitemapClient initialCategories={categories} />;
}
