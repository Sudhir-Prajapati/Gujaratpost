import type { Metadata } from 'next';
import InstagramPageClient from './InstagramPageClient';

export const metadata: Metadata = {
  title: 'Instagram Reels — Gujarat Post',
  description: 'Watch latest viral Instagram reels and short video updates from Gujarat Post.',
};

export default function InstagramPage() {
  return <InstagramPageClient />;
}
