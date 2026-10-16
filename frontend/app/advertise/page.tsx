import { Metadata } from 'next';
import AdvertisePageClient from './AdvertisePageClient';
import { getPublicAdvertise } from '@/lib/api';

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPublicAdvertise().catch(() => null);
  const title = (data?.pageTitle || 'Advertise With Us') + ' | Gujarat Post';
  const description =
    data?.description ||
    data?.pageSubtitle ||
    'Partner with Gujarat Post. Reach millions of Gujarati readers across digital web, e-paper, and social media channels with high-impact advertising.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'https://gujaratpost.in/advertise',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function AdvertisePage() {
  const advertiseData = await getPublicAdvertise().catch(() => null);
  return <AdvertisePageClient initialData={advertiseData} />;
}
