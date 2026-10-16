import { Metadata } from 'next';
import LegalPageClient from '@/components/legal/LegalPageClient';
import { getPublicLegalPage } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Disclaimer | Gujarat Post',
  description:
    'Read the official Disclaimer of Gujarat Post regarding fast-breaking news, opinions, financial reports, and journalistic integrity.',
};

export default async function DisclaimerPage() {
  let pageData = null;
  try {
    pageData = await getPublicLegalPage('disclaimer');
  } catch (error) {
    console.error('Error fetching Disclaimer page:', error);
  }

  return <LegalPageClient initialData={pageData} defaultTitle="Disclaimer" />;
}
