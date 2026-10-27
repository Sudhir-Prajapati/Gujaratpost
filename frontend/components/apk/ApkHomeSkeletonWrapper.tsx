'use client';

import { useIsApk } from '@/lib/useIsApk';
import ApkHomeSkeleton from './ApkHomeSkeleton';

export default function ApkHomeSkeletonWrapper() {
  const { isApk } = useIsApk();

  if (isApk) {
    return <ApkHomeSkeleton />;
  }

  return null;
}
