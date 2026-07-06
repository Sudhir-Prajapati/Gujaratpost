'use client';

import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6 py-12 text-center transition-colors duration-200">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 mb-6 border border-red-100 dark:border-red-900/30">
        <ShieldAlert className="h-10 w-10 animate-pulse" />
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
        Access Restricted
      </h1>
      
      <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400 max-w-md">
        You do not have the required permissions to access this page. If you believe this is an error, please contact a Super Administrator.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => {
            // First try to go back, otherwise redirect to admin area root
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push('/admin');
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800 focus:outline-none dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Go Back</span>
        </button>

        <a
          href="/login"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Sign in with Another Account
        </a>
      </div>
    </div>
  );
}
