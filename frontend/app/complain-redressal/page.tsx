import { Metadata } from 'next';
import FeedbackClient from '../feedback/FeedbackClient';
import { getPublicContact } from '@/lib/api';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'તકરાર નિવારણ (Complaint Redressal) | Gujarat Post',
  description: 'ગુજરાત પોસ્ટ સત્તાવાર ફરિયાદ અને તકરાર નિવારણ પોર્ટલ.',
};

export default async function ComplainRedressalPage() {
  const contactData = await getPublicContact().catch(() => null);
  return <FeedbackClient initialType="COMPLAINT" initialData={contactData} />;
}
