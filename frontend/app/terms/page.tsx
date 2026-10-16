import { Metadata } from 'next';
import LegalPageClient from '@/components/legal/LegalPageClient';
import { getPublicLegalPage } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Terms of Use | Gujarat Post',
  description:
    'Review the Terms of Use for accessing Gujarat Post news, mobile applications, e-paper editions, and digital media services.',
};

export default async function TermsPage() {
  let pageData = null;
  try {
    pageData = await getPublicLegalPage('terms-of-use');
  } catch (error) {
    console.error('Error fetching Terms of Use page:', error);
  }

  return <LegalPageClient initialData={pageData} defaultTitle="Terms of Use" />;
}
