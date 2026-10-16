import { Metadata } from 'next';
import LegalPageClient from '@/components/legal/LegalPageClient';
import { getPublicLegalPage } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Privacy Policy | Gujarat Post',
  description:
    'Read the official Privacy Policy of Gujarat Post. Learn how we collect, protect, and respect your personal data and digital privacy.',
};

export default async function PrivacyPage() {
  let pageData = null;
  try {
    pageData = await getPublicLegalPage('privacy-policy');
  } catch (error) {
    console.error('Error fetching Privacy Policy page:', error);
  }

  return <LegalPageClient initialData={pageData} defaultTitle="Privacy Policy" />;
}
