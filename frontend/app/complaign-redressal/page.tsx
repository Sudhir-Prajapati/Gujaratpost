import { Metadata } from 'next';
import FeedbackClient from '../feedback/FeedbackClient';
import { getPublicContact } from '@/lib/api';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'તકરાર નિવારણ (Complaint & Grievance Redressal) | Gujarat Post',
  description:
    'ડિજિટલ મીડિયા એથિક્સ કોડ નિયમો અનુસાર ગુજરાત પોસ્ટ તકરાર નિવારણ પોર્ટલ. સમાચારમાં તથ્યદોષ કે ફરિયાદ સત્તાવાર રીતે નોંધાવો.',
  openGraph: {
    title: 'તકરાર નિવારણ (Grievance Redressal) | Gujarat Post',
    url: 'https://gujaratpost.in/complaign-redressal',
    type: 'website',
  },
};

export default async function ComplaignRedressalPage() {
  const contactData = await getPublicContact().catch(() => null);
  return <FeedbackClient initialType="COMPLAINT" initialData={contactData} />;
}
