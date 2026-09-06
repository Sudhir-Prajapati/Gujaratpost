import { Metadata } from 'next';
import SupportPageClient from './SupportPageClient';

export const metadata: Metadata = {
  title: 'Support Us | Gujarat Post',
  description: 'Support independent journalism and real stories across Gujarat.',
};

export default function SupportPage() {
  return <SupportPageClient />;
}
