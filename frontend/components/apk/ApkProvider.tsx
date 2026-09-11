'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useIsApk } from '@/lib/useIsApk';

interface ApkContextType {
  isApk: boolean;
  isReady: boolean;
}

const ApkContext = createContext<ApkContextType>({ isApk: false, isReady: false });

export function ApkProvider({ children }: { children: ReactNode }) {
  const { isApk, isReady } = useIsApk();
  return (
    <ApkContext.Provider value={{ isApk, isReady }}>
      {children}
    </ApkContext.Provider>
  );
}

export function useApk() {
  return useContext(ApkContext);
}
