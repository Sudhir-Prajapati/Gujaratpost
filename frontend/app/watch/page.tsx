import type { Metadata } from 'next';
import WatchPageClient from './WatchPageClient';

export const metadata: Metadata = {
  title: 'Watch Never Ends',
  description: 'Continuous Gujarat Post video news feed with latest videos, shorts, podcasts and interviews.',
};

export default function WatchPage() {
  return <WatchPageClient />;
}
