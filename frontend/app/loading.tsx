'use client';

import { useIsApk } from '@/lib/useIsApk';
import ApkHomeSkeleton from '@/components/apk/ApkHomeSkeleton';

export default function Loading() {
  const { isApk } = useIsApk();

  // DEDICATED ANDROID APK FEED SKELETON:
  // Shows clean native skeleton loading state when navigating to Home inside APK
  if (isApk) {
    return <ApkHomeSkeleton />;
  }

  // STANDARD WEB & MOBILE BROWSER (100% UNTOUCHED):
  return null;
}

