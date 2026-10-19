import { Metadata } from 'next';
import LegalPageClient from '@/components/legal/LegalPageClient';
import { getPublicLegalPage } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Cookie Policy | Gujarat Post',
  description:
    'Read the official Cookie Policy of Gujarat Post. Learn about essential storage, reader preferences, analytics, third-party embeds, and your privacy rights under DPDPA 2023.',
};

export default async function CookiePolicyPage() {
  let pageData = null;
  try {
    pageData = await getPublicLegalPage('cookie-policy');
  } catch (error) {
    console.error('Error fetching Cookie Policy page:', error);
  }

  return <LegalPageClient initialData={pageData} defaultTitle="Cookie Policy" />;
}

