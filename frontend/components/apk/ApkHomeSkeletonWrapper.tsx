'use client';

import { useIsApk } from '@/lib/useIsApk';
import ApkHomeSkeleton from './ApkHomeSkeleton';
import { HomePageSkeleton } from '@/components/ui/PageSkeleton';

export default function ApkHomeSkeletonWrapper() {
  const { isApk } = useIsApk();

  if (isApk) {
    return <ApkHomeSkeleton />;
  }

  return <HomePageSkeleton />;
}
