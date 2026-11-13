'use client';

import React from 'react';
import SiteMaintenanceError from '@/components/ui/SiteMaintenanceError';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SiteMaintenanceError error={error} reset={reset} isGlobal={false} />;
}

