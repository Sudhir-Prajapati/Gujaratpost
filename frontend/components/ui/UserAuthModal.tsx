'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, User, Mail, ArrowRight, CheckCircle2, LogOut, AlertCircle, Loader2, KeyRound, Edit2, RefreshCw, Clock } from 'lucide-react';
import { SocialIcon } from './SocialLinks';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
}

export default function UserAuthModal({ isOpen, onClose, language = 'gu' }: UserAuthModalProps) {
  const router = useRouter();

  // Modal Step: 'email' | 'otp' | 'already_logged_in'
  const [step, setStep] = useState<'email' | 'otp' | 'already_logged_in'>('email');

  // Input states & refs
  const [email, setEmail] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const [otp, setOtp] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // OTP Timers: 5-minute validity, 60-second resend cooldown
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState<number>(60); // 60 seconds resend cooldown

  // Statuses
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto focus input on step change & sync input values
  useEffect(() => {
    if (isOpen) {
      if (step === 'email') {
        if (emailInputRef.current) {
          if (email) {
            emailInputRef.current.value = email;
            setCanSubmit(email.trim().length > 0);
          }
          setTimeout(() => emailInputRef.current?.focus(), 60);
        }
      } else if (step === 'otp') {
        setTimeout(() => otpInputRef.current?.focus(), 60);
      }
    }
  }, [isOpen, step, email]);

  // OTP Expiry & Resend Countdown Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp') {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  // Format seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Check if user is already verified & logged in on modal open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMessage(null);
      if (typeof window !== 'undefined') {
        const savedEmail = localStorage.getItem('gp_user_email');
        const isVerified = localStorage.getItem('gp_user_verified') === 'true';
        if (savedEmail && isVerified) {
          setUserEmail(savedEmail);
          setStep('already_logged_in');
        } else {
          setStep('email');
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Validate Email Format
  const isValidEmail = (emailStr: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr.trim());
  };

  // STEP 1: Submit Email & Trigger OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = (emailInputRef.current?.value || email).trim();
    setEmail(cleanEmail);

    // 1. Email format validation
    if (!cleanEmail) {
      setError(
        language === 'gu'
          ? 'ઇમેઇલ દાખલ કરવો ફરજિયાત છે.'
          : language === 'hi'
          ? 'ईमेल दर्ज करना अनिवार्य है।'
          : 'Email address is required.'
      );
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError(
        language === 'gu'
          ? 'કૃપા કરીને યોગ્ય ઇમેઇલ સરનામું દાખલ કરો (દા.ત. user@example.com).'
          : language === 'hi'
          ? 'कृपया एक वैध ईमेल पता दर्ज करें (उदा. user@example.com)।'
          : 'Please enter a valid email address (e.g. user@example.com).'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Generate & send OTP (single ultra-fast API call, background email delivery)
      const resOtp = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const jsonOtp = await resOtp.json();

      if (!resOtp.ok) {
        throw new Error(jsonOtp.message || 'Failed to send OTP.');
      }

      // Check if staff member was detected -> Redirect to Admin Login page with pre-filled email
      if (jsonOtp.data?.isStaff) {
        onClose();
        router.push(`/login?email=${encodeURIComponent(cleanEmail)}&from=%2Fadmin`);
        return;
      }

      // Reset timers (5 mins validity, 60s resend cooldown)
      setTimeLeft(300);
      setResendCooldown(60);
      setStep('otp');
      setSuccessMessage(
        language === 'gu'
          ? `${cleanEmail} પર ઓટીપી કોડ મોકલાયો છે.`
          : `OTP code sent to ${cleanEmail}`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error triggering OTP verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Verify OTP -> Store in DB upon verification!
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (timeLeft === 0) {
      setError(
        language === 'gu'
          ? 'ઓટીપીનો સમય સમાપ્ત થઈ ગયો છે. કૃપા કરીને નવો ઓટીપી મોકલો.'
          : 'OTP has expired. Please request a new OTP.'
      );
      return;
    }

    const cleanEmail = (emailInputRef.current?.value || email).trim();
    const cleanOtp = (otpInputRef.current?.value || otp).trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      setError(
        language === 'gu'
          ? 'કૃપા કરીને 6-અંકનો ઓટીપી દાખલ કરો.'
          : language === 'hi'
          ? 'कृपया 6-अंकों का ओटीपी दर्ज करें।'
          : 'Please enter the 6-digit OTP.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Send to backend endpoint for verification & DB storage
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message ||
            (language === 'gu' ? 'અમાન્ય ઓટીપી. ઇમેઇલ ડીબીમાં સ્ટોર થયું નથી.' : 'Invalid OTP code. Email was NOT stored in database.')
        );
      }

      // Successful Verification & DB Storage!
      localStorage.setItem('gp_user_email', cleanEmail);
      localStorage.setItem('gp_user_verified', 'true');
      setUserEmail(cleanEmail);

      setSuccessMessage(
        language === 'gu'
          ? 'ઇમેઇલ ચકાસાયેલ છે અને ડીબીમાં સફળતાપૂર્વક સંગ્રહિત થયું છે!'
          : 'Email verified & stored in database successfully!'
      );

      setTimeout(() => {
        setSuccessMessage(null);
        setStep('already_logged_in');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Email not stored.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const cleanEmail = (emailInputRef.current?.value || email).trim();
      const resOtp = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const jsonOtp = await resOtp.json();
      if (!resOtp.ok) {
        throw new Error(jsonOtp.message || 'Failed to resend OTP.');
      }
      setTimeLeft(300);
      setResendCooldown(60);
      setSuccessMessage(
        language === 'gu' ? 'તમારા ઇમેઇલ પર નવો ઓટીપી મોકલ્યો છે.' : 'New OTP sent to your email.'
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign Out Handler
  const handleSignOut = () => {
    localStorage.removeItem('gp_user_email');
    localStorage.removeItem('gp_user_verified');
    setUserEmail(null);
    setEmail('');
    setCanSubmit(false);
    if (emailInputRef.current) emailInputRef.current.value = '';
    setOtp('');
    setStep('email');
  };

  // Language text dictionaries
  const texts = {
    signIn: language === 'gu' ? 'સાઇન ઇન' : language === 'hi' ? 'साइन इन' : 'Sign In',
    googleSignIn: language === 'gu' ? 'Google વડે સાઇન ઇન કરો' : language === 'hi' ? 'Google से साइन इन करें' : 'Sign in with Google',
    enterEmail: language === 'gu' ? 'ઇમેઇલ એડ્રેસ દાખલ કરો' : language === 'hi' ? 'ईमेल पता दर्ज करें' : 'Enter email address',
    continue: language === 'gu' ? 'આગળ વધો' : language === 'hi' ? 'आगे बढ़ें' : 'Continue',
    termsText: language === 'gu' 
      ? 'સાઇન ઇન કરીને અથવા એકાઉન્ટ બનાવીને, તમે ગુજરાત પોસ્ટના નિયમો અને શરતો અને ગોપનીયતા નીતિ સાથે સંમત થાઓ છો.'
      : language === 'hi'
      ? 'साइन इन करके या खाता बनाकर, आप गुजरात पोस्ट के नियमों और शर्तों और गोपनीयता नीति से सहमत होते हैं।'
      : "By signing in or creating an account, you agree to Associated Broadcasting Company's Terms & Conditions and Privacy Policy.",
    subscribeWhatsapp: language === 'gu' ? 'વોટ્સએપ ચેનલ સબ્સ્ક્રાઇબ કરો' : language === 'hi' ? 'व्हाट्सएप चैनल सब्सक्राइब करें' : 'Subscribe Whatsapp Channel',
    loggedInTitle: language === 'gu' ? 'તમે લૉગ ઇન થયેલ છો' : language === 'hi' ? 'आप पहले से लॉग इन हैं' : 'You are already logged in',
    adminLogin: language === 'gu' ? 'એડમિન / રિપોર્ટર લોગિન' : language === 'hi' ? 'एडमिन / रिपोर्टर लॉगिन' : 'CMS Admin / Staff Login',
    signOut: language === 'gu' ? 'સાઇન આઉટ' : language === 'hi' ? 'साइन आउट' : 'Sign Out',
    otpTitle: language === 'gu' ? 'ઓટીપી ચકાસણી' : language === 'hi' ? 'ओटीपी सत्यापन' : 'OTP Verification',
    verifyOtp: language === 'gu' ? 'ઓટીપી ચકાસો અને સાઇન ઇન કરો' : language === 'hi' ? 'ओटीपी सत्यापित करें और साइन इन करें' : 'Verify OTP & Sign In',
    resendOtp: language === 'gu' ? 'ફરીથી ઓટીપી મોકલો' : language === 'hi' ? 'ओटीपी पुनः भेजें' : 'Resend OTP',
    changeEmail: language === 'gu' ? 'ઇમેઇલ બદલો' : language === 'hi' ? 'ईमेल बदलें' : 'Change Email',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:justify-end sm:pt-14 sm:pr-8 bg-black/60 backdrop-blur-xs">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-[360px] rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 z-10 flex flex-col items-center text-center overflow-hidden">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition active:scale-95 cursor-pointer z-20"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Network Static Normal Logo */}
        <div className="mb-4 flex flex-col items-center">
          <div className="relative h-11 w-44 flex items-center justify-center">
            <img
              src="/assets/gujarat-post-logo-chip.png"
              alt="Gujarat Post"
              className="h-full w-auto object-contain"
            />
          </div>
        </div>

        {/* User Icon Silhouette Circle */}
        <div className="relative w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-2.5 shadow-inner text-zinc-400 dark:text-zinc-500">
          <User className="w-8 h-8" fill="currentColor" />
          {step === 'already_logged_in' && (
            <span className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1 border-2 border-white dark:border-zinc-900">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-extrabold text-zinc-900 dark:text-white mb-3 tracking-tight">
          {step === 'already_logged_in' ? texts.loggedInTitle : step === 'otp' ? texts.otpTitle : texts.signIn}
        </h3>

        {/* Error Alert */}
        {error && (
          <div className="w-full mb-3 p-2.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 text-xs font-semibold flex items-start gap-2 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="w-full mb-3 p-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ── STEP 1: ENTER EMAIL ── */}
        {step === 'email' && (
          <div className="w-full space-y-3.5 mb-4">
            
            {/* Email Input Form */}
            <form onSubmit={handleSendOtp} className="space-y-2.5">
              <div className="relative w-full">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none z-10" />
                <input
                  ref={emailInputRef}
                  id="gp-user-email-input"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  defaultValue={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    const hasVal = val.trim().length > 0;
                    if (hasVal !== canSubmit) {
                      setCanSubmit(hasVal);
                    }
                    if (error) setError(null);
                  }}
                  placeholder={texts.enterEmail}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 py-3 pl-10 pr-4 text-xs md:text-sm font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B3121B]/30 focus:border-[#B3121B] shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="w-full py-3 px-4 rounded-xl bg-[#B3121B] hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>{texts.continue}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex py-0.5 items-center">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">or</span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs transition cursor-default opacity-85"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{texts.googleSignIn}</span>
            </button>

            {/* CMS Admin Link */}
            <div className="pt-0.5">
              <Link
                href="/login"
                onClick={onClose}
                className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 underline underline-offset-2 transition"
              >
                {texts.adminLogin}
              </Link>
            </div>
          </div>
        )}

        {/* ── STEP 2: OTP VERIFICATION STEP ── */}
        {step === 'otp' && (
          <div className="w-full space-y-3 mb-4 animate-in fade-in">
            {/* Target Email Badge */}
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
              <div className="truncate font-semibold text-zinc-700 dark:text-zinc-300 pr-2">
                <span className="text-[10px] text-zinc-400 block font-normal">Sent OTP to:</span>
                <span className="font-bold text-zinc-900 dark:text-white truncate">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" /> {texts.changeEmail}
              </button>
            </div>

            {/* Prominent Centered OTP Expiration Timer */}
            <div className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center gap-2 text-center text-sm font-extrabold text-zinc-800 dark:text-zinc-100 shadow-xs">
              <Clock className="w-4 h-4 text-[#B3121B] shrink-0" />
              <span>{language === 'gu' ? 'ઓટીપી સમય:' : 'OTP Expiry:'}</span>
              <span className={`font-mono text-base tracking-wider ${timeLeft < 60 ? 'text-red-600 dark:text-red-400 animate-pulse font-black' : 'text-[#B3121B]'}`}>
                {formatTimer(timeLeft)}
              </span>
              {timeLeft === 0 && (
                <span className="text-xs font-black text-red-600 dark:text-red-400 ml-1">
                  ({language === 'gu' ? 'સમય સમાપ્ત' : 'Expired'})
                </span>
              )}
            </div>

            {/* OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-3 pt-1">
              <div className="relative w-full">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none z-10" />
                <input
                  ref={otpInputRef}
                  id="gp-user-otp-input"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  defaultValue={otp}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    e.target.value = cleaned;
                    setOtp(cleaned);
                    if (error) setError(null);
                  }}
                  placeholder="------"
                  disabled={timeLeft === 0}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 py-3 pl-10 pr-4 text-center font-mono text-lg font-black tracking-[0.4em] text-zinc-900 dark:text-white placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#B3121B]/30 focus:border-[#B3121B] shadow-xs disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length < 4 || timeLeft === 0}
                className="w-full py-3 px-4 rounded-xl bg-[#B3121B] hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>{texts.verifyOtp}</span>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[11px] pt-1">
              <span className="text-zinc-400">Didn&apos;t receive code?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSubmitting || resendCooldown > 0}
                className="font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? (
                  <span>{texts.resendOtp} ({resendCooldown}s)</span>
                ) : (
                  <span>{texts.resendOtp}</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: RETURN VISIT / ALREADY LOGGED IN VIEW ── */}
        {step === 'already_logged_in' && userEmail && (
          <div className="w-full space-y-3.5 mb-5 animate-in fade-in">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs font-medium text-zinc-700 dark:text-zinc-300 break-all text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                ✓ Verified Account
              </span>
              <span className="font-extrabold text-sm block text-zinc-900 dark:text-white">{userEmail}</span>
            </div>

            <div>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3 px-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>{texts.signOut}</span>
              </button>
            </div>
          </div>
        )}

        {/* Terms & Conditions Notice */}
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal mb-4 px-1">
          {texts.termsText}{' '}
          <Link href="/terms" onClick={onClose} className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
            Terms & Conditions
          </Link>{' '}
          and{' '}
          <Link href="/privacy" onClick={onClose} className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
            Privacy Policy
          </Link>.
        </p>

        {/* WhatsApp Channel CTA Button */}
        <a
          href="https://whatsapp.com/channel/0029Va9y6Xn9RZAY5m4f8V1a"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:opacity-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition transform active:scale-98 cursor-pointer"
        >
          <span>{texts.subscribeWhatsapp}</span>
          <SocialIcon platform="whatsapp" className="w-4 h-4 text-white" />
        </a>

      </div>
    </div>
  );
}
