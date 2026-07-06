import type { Metadata } from 'next';
import ShortsPageClient from './ShortsPageClient';

export const metadata: Metadata = {
  title: 'Shorts',
  description: 'Swipe-style Gujarat Post short news videos with quick updates, reactions and shares.',
};

export default function ShortsPage() {
  return <ShortsPageClient />;
}
