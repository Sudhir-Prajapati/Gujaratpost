import type { Metadata } from 'next';
import EpaperPageClient from './EpaperPageClient';

export const metadata: Metadata = {
  title: 'E-paper',
  description: 'Read Gujarat Post daily e-paper editions for Ahmedabad, Surat, Rajkot, Vadodara and Gujarat.',
};

export default function EpaperPage() {
  return <EpaperPageClient />;
}
