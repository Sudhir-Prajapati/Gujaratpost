'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  WifiOff,
  ShieldCheck,
  UserX,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Email Verification Gate
// ─────────────────────────────────────────────────────────────────────────────
function EmailGateStep({
  onAdminVerified,
  initialEmail,
}: {
  onAdminVerified: (email: string) => void;
  initialEmail: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState(false);

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(false);

    const safeEmail = email.trim().toLowerCase();

    if (!safeEmail) {
      setEmailError(true);
      setError('Please enter your email address to continue.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(safeEmail)) {
      setEmailError(true);
      setError('Please enter a valid email address.');
      return;
    }

    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      setError('📡 Internet connection lost. Please check your network connection and try again.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: safeEmail }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message || result?.error || 'Unable to verify email. Please try again.');
      }

      const { exists, isStaff } = result?.data || result || {};

      if (exists && isStaff) {
        onAdminVerified(safeEmail);
      } else {
        setEmailError(true);
        setError(
          'This email address is not registered as an admin. Access is restricted to authorised staff only.'
        );
      }
    } catch (err: any) {
      if (
        err.name === 'TypeError' ||
        err.message?.includes('fetch') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError')
      ) {
        setError('📡 Network connection error. Unable to reach server. Please check your internet connection.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
      setEmailError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/70 p-8 shadow-2xl backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:bg-zinc-900/80">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <div className="relative mx-auto mb-3 h-10 w-32">
          <Image
            src="/assets/gujarat-post-logo-chip.png"
            alt="Gujarat Post"
            fill
            priority
            className="object-contain"
          />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Admin Portal Login
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Enter your admin email to continue.
        </p>
      </div>

      {/* Access Restricted Badge */}
      <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 dark:border-amber-700/40 dark:bg-amber-900/20">
        <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
          Access is restricted to authorised Gujarat Post staff only.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-start gap-3.5 rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-600 dark:bg-red-950/70 dark:text-red-200 shadow-md transition-all">
          {error.includes('📡') || error.includes('Network') || error.includes('connection') ? (
            <WifiOff className="h-5 w-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          ) : error.includes('not registered') || error.includes('restricted') ? (
            <UserX className="h-5 w-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          )}
          <div className="flex-1 space-y-0.5">
            <p className="font-black text-xs uppercase tracking-wider text-red-800 dark:text-red-300">
              {error.includes('📡') || error.includes('Network') || error.includes('connection')
                ? '📡 Connection Error'
                : error.includes('not registered') || error.includes('restricted')
                ? '🚫 Access Denied'
                : '⚠️ Verification Failed'}
            </p>
            <p className="text-xs font-semibold leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => { setError(null); setEmailError(false); }}
            className="text-red-400 hover:text-red-700 dark:hover:text-red-200 text-xs font-bold transition p-1 cursor-pointer"
            title="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Email Form */}
      <form onSubmit={handleCheckEmail} className="space-y-5">
        <div>
          <label className={`block text-xs uppercase tracking-wider ${emailError ? 'font-black text-red-600 dark:text-red-400' : 'font-semibold text-zinc-600 dark:text-zinc-400'}`}>
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-2">
            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${emailError ? 'text-red-500' : 'text-zinc-400'}`}>
              <Mail className="h-5 w-5" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) { setEmailError(false); setError(null); }
              }}
              disabled={loading}
              placeholder="your@gujaratpost.com"
              autoFocus
              className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm font-semibold transition-all focus:outline-none ${emailError
                ? 'border-2 border-red-500 bg-red-50/80 text-red-900 ring-2 ring-red-500/20 dark:border-red-600 dark:bg-red-950/40 dark:text-red-200'
                : 'border-zinc-200 bg-white/50 text-zinc-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white'
              }`}
              required
            />
          </div>
          {emailError && !error && (
            <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Please enter a valid email address.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying access...</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        <div className="mt-4 pt-4 border-t border-zinc-200/80 dark:border-zinc-800 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 text-red-600" />
            <span>Back to Website</span>
          </Link>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Password Login Form (only shown after admin email is verified)
// ─────────────────────────────────────────────────────────────────────────────
function PasswordLoginStep({
  verifiedEmail,
  onBack,
}: {
  verifiedEmail: string;
  onBack: () => void;
}) {
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState(false);

  const redirectPath = searchParams.get('from') || '/admin';

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized_role') {
      setError('Your account does not have permission to access the admin portal. Please contact your system administrator.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordError(false);

    const safePassword = password.trim();

    if (!safePassword) {
      setPasswordError(true);
      setError('Please enter your password.');
      return;
    }

    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      setError('📡 Internet connection lost. Please check your network connection and try again.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: verifiedEmail,
          password: safePassword,
          rememberMe,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPasswordError(true);

        if (response.status === 401 || response.status === 400) {
          const backendMsg = result?.message || result?.error || '';
          if (backendMsg.toLowerCase().includes('permission') || backendMsg.toLowerCase().includes('access denied')) {
            throw new Error('Your account does not have permission to access the admin portal. Please contact your system administrator.');
          }
          throw new Error('Incorrect password. Please verify your credentials and try again.');
        } else if (response.status === 403) {
          throw new Error('Your account does not have permission to access the admin portal. Please contact your system administrator.');
        } else if (response.status === 429) {
          throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
        } else if (response.status >= 500) {
          throw new Error('Server encountered an issue. Please try again in a few moments.');
        }
        throw new Error(result.error || result.message || 'Invalid credentials. Please check and try again.');
      }

      const token = result.data?.accessToken || result.accessToken;
      if (token) {
        const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60;
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        document.cookie = `access_token=${token}; path=/; max-age=${maxAge}; ${isHttps ? 'Secure;' : ''} SameSite=Lax`;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('access_token', token);
        }
      }

      window.location.replace(redirectPath);
    } catch (err: any) {
      if (
        err.name === 'TypeError' ||
        err.message?.includes('fetch') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError')
      ) {
        setError('📡 Network connection error. Unable to reach server. Please check your internet connection.');
      } else {
        setError(err.message || 'Invalid password. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/70 p-8 shadow-2xl backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:bg-zinc-900/80">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <div className="relative mx-auto mb-3 h-10 w-32">
          <Image
            src="/assets/gujarat-post-logo-chip.png"
            alt="Gujarat Post"
            fill
            priority
            className="object-contain"
          />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Admin Portal Login
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to manage news and portal settings.
        </p>
      </div>

      {/* Verified Email Chip */}
      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-green-200/80 bg-green-50/80 px-4 py-3 dark:border-green-700/40 dark:bg-green-900/20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
          <p className="text-xs font-semibold text-green-800 dark:text-green-300 truncate max-w-[220px]">
            {verifiedEmail}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-bold text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition shrink-0 cursor-pointer"
          title="Change email"
        >
          Change
        </button>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="mb-6 flex items-start gap-3.5 rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-600 dark:bg-red-950/70 dark:text-red-200 shadow-md transition-all">
          {error.includes('📡') || error.includes('Network') || error.includes('connection') ? (
            <WifiOff className="h-5 w-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          )}
          <div className="flex-1 space-y-0.5">
            <p className="font-black text-xs uppercase tracking-wider text-red-800 dark:text-red-300">
              {error.includes('📡') || error.includes('Network') || error.includes('connection') ? '📡 Connection Error' : '⚠️ Login Error'}
            </p>
            <p className="text-xs font-semibold leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-700 dark:hover:text-red-200 text-xs font-bold transition p-1 cursor-pointer"
            title="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Password Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={`block text-xs uppercase tracking-wider ${passwordError ? 'font-black text-red-600 dark:text-red-400' : 'font-semibold text-zinc-600 dark:text-zinc-400'}`}>
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-2">
            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${passwordError ? 'text-red-500' : 'text-zinc-400'}`}>
              <Lock className="h-5 w-5" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(false);
              }}
              disabled={loading}
              placeholder="••••••••"
              autoFocus
              className={`w-full rounded-xl border py-3 pl-10 pr-12 text-sm font-semibold transition-all focus:outline-none ${passwordError
                ? 'border-2 border-red-500 bg-red-50/80 text-red-900 ring-2 ring-red-500/20 dark:border-red-600 dark:bg-red-950/40 dark:text-red-200'
                : 'border-zinc-200 bg-white/50 text-zinc-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white'
              }`}
              required
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {passwordError && !error && (
            <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Please enter your password.
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary/30 dark:border-zinc-800 dark:bg-zinc-950 dark:checked:bg-primary"
            />
            <span>Remember me for 7 days</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        {/* Back to Website Link */}
        <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-zinc-800 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 text-red-600" />
            <span>Back to Website</span>
          </Link>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main LoginForm: orchestrates the two-step flow
// ─────────────────────────────────────────────────────────────────────────────
function LoginForm() {
  const searchParams = useSearchParams();

  // Step: 'email' | 'password'
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  // Pre-fill email from query param (e.g., redirected from user modal)
  const initialEmail = searchParams.get('email') || '';

  const handleAdminVerified = (email: string) => {
    setVerifiedEmail(email);
    setStep('password');
  };

  const handleBack = () => {
    setStep('email');
    setVerifiedEmail('');
  };

  if (step === 'password') {
    return (
      <PasswordLoginStep
        verifiedEmail={verifiedEmail}
        onBack={handleBack}
      />
    );
  }

  return (
    <EmailGateStep
      onAdminVerified={handleAdminVerified}
      initialEmail={initialEmail}
    />
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 px-4 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-850">

      {/* Top Left Floating Back to Website Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 px-4 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 shadow-md backdrop-blur-md hover:bg-white dark:hover:bg-zinc-800 hover:text-red-600 dark:hover:text-red-400 transition active:scale-95"
      >
        <ArrowLeft className="h-4 w-4 text-red-600" />
        <span>Back to Website</span>
      </Link>

      {/* Background ambient lighting effects */}
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-red-500/10 blur-[120px] dark:bg-red-500/5" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px] dark:bg-amber-500/5" />

      {/* Embedded Suspense to support search params hooks */}
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="mt-2 text-sm">Loading login screen...</span>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </main>
  );
}
