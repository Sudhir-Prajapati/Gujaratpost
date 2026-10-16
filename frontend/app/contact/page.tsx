import { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';
import { getPublicContact } from '@/lib/api';

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPublicContact().catch(() => null);
  const title = (data?.pageTitle || 'સંપર્ક કરો (Contact Us)') + ' | Gujarat Post';
  const description =
    data?.pageSubtitle ||
    'ગુજરાત પોસ્ટ મુખ્ય કાર્યાલય, સંપાદકીય ટીમ, જાહેરાત વિભાગ અને બ્યુરો ઓફિસોનો સંપર્ક કરો. સત્ય અને વિશ્વસનીય પત્રકારત્વ.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'https://gujaratpost.in/contact',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ContactPage() {
  const contactData = await getPublicContact().catch(() => null);
  return <ContactPageClient initialData={contactData} />;
}
