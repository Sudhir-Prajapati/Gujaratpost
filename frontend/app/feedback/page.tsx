import { Metadata } from 'next';
import FeedbackClient from './FeedbackClient';
import { getPublicContact } from '@/lib/api';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'પ્રતિસાદ અને તકરાર નિવારણ (Feedback & Complaint Redressal) | Gujarat Post',
  description:
    'ગુજરાત પોસ્ટ વાચક પ્રતિસાદ, સૂચનો અને તકરાર નિવારણ (Grievance Redressal). કોઈપણ સમાચાર સંબંધિત સુધારો કે ફરિયાદ સત્તાવાર રીતે નોંધાવો.',
  openGraph: {
    title: 'પ્રતિસાદ અને તકરાર નિવારણ | Gujarat Post',
    description: 'ગુજરાત પોસ્ટ વાચક પ્રતિસાદ અને ડિજિટલ મીડિયા તકરાર નિવારણ પોર્ટલ.',
    url: 'https://gujaratpost.in/feedback',
    type: 'website',
  },
};

export default async function FeedbackPage() {
  const contactData = await getPublicContact().catch(() => null);
  return <FeedbackClient initialType="FEEDBACK" initialData={contactData} />;
}
