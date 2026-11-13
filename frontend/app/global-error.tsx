'use client';

import React from 'react';
import SiteMaintenanceError from '@/components/ui/SiteMaintenanceError';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="gu">
      <head>
        <title>અમે ટૂંક સમયમાં પાછા આવીશું | Gujarat Post</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="m-0 p-0 antialiased bg-white dark:bg-[#0d0f17]">
        <SiteMaintenanceError error={error} reset={reset} isGlobal={true} />
      </body>
    </html>
  );
}

