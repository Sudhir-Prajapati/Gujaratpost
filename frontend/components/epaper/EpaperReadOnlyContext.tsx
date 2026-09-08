'use client';

import React, { createContext, useContext } from 'react';

const GLOBAL_KEY = Symbol.for('__GUJARAT_POST_EPAPER_READONLY_CTX__');
const globalStore = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {}) as any;

if (!globalStore[GLOBAL_KEY]) {
  globalStore[GLOBAL_KEY] = createContext<boolean>(false);
}

export const EpaperReadOnlyContext: React.Context<boolean> = globalStore[GLOBAL_KEY];
export const EpaperReadOnlyProvider = EpaperReadOnlyContext.Provider;
export const useEpaperReadOnly = () => useContext(EpaperReadOnlyContext);

