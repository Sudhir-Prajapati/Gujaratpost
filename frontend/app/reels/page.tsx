import type { Metadata } from 'next';
import InstagramPageClient from '../instagram/InstagramPageClient';

export const metadata: Metadata = {
  title: 'Reels — Gujarat Post',
  description: 'Watch latest viral Instagram reels and short video updates from Gujarat Post.',
};

export default function ReelsPage() {
  return <InstagramPageClient />;
}
