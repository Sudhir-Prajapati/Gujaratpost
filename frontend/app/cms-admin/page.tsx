import { Suspense } from 'react';
import LoginPage from '../login/page';

export const metadata = {
  title: 'CMS Portal - Gujarat Post',
  description: 'Administrative portal for Gujarat Post staff and editorial team.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CmsAdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">Loading CMS Portal...</div>}>
      <LoginPage />
    </Suspense>
  );
}
