import { Metadata } from 'next';
import SitemapClient from './SitemapClient';
import { getSitemapData } from '@/lib/sitemap-data';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Site Map | Gujarat Post - સાઇટમેપ & તમામ શ્રેણીઓ',
  description:
    'Browse Gujarat Post categories and company pages.',
};

export default async function SitemapPage() {
  return <SitemapClient initialData={await getSitemapData()} />;
}
