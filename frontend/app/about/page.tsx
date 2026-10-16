import { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';
import { getPublicAbout } from '@/lib/api';

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPublicAbout().catch(() => null);
  const title = (data?.title || data?.titleGu || data?.titleEn || 'About Us') + ' | Gujarat Post';
  const description =
    data?.description ||
    data?.descriptionGu ||
    data?.descriptionEn ||
    'ગુજરાત પોસ્ટ વિશે - સત્ય, સચોટતા અને વિશ્વસનીય પત્રકારત્વનું અગ્રણી ડિજિટલ માધ્યમ';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: data?.heroImage || data?.bannerImage ? [{ url: data.heroImage || data.bannerImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: data?.heroImage || data?.bannerImage ? [data.heroImage || data.bannerImage] : undefined,
    },
  };
}

export default async function AboutPage() {
  const aboutData = await getPublicAbout().catch(() => null);
  return <AboutPageClient initialData={aboutData} />;
}
