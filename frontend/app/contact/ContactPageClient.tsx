'use client';

import LocalizedContent from '@/components/i18n/LocalizedContent';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  Shield,
  Send,
  Building2,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Radio,
  Sparkles,
  HelpCircle,
  Newspaper,
  Megaphone,
  UserCheck,
  AlertCircle,
  User,
  ShieldCheck,
} from 'lucide-react';
import { submitContactMessage } from '@/lib/api';
import { ConsentGate } from '@/components/consent/ConsentGate';

interface SocialLinks {
  whatsapp?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
}

interface ContactPageClientProps {
  initialData: any;
}

export default function ContactPageClient({ initialData }: ContactPageClientProps) {
  const data = initialData || {};

  const pageTitle = data.pageTitle || 'સંપર્ક કરો (Contact Us)';
  const pageSubtitle =
    data.pageSubtitle ||
    'કોઈપણ સમાચાર, પ્રેસ નોટ, જાહેરાત કે માહિતી માટે અમારા પત્રકાર મિત્રો અને સંપાદકીય ટીમનો સંપર્ક સાધો.';
  const headOfficeAddress =
    data.headOfficeAddress ||
    'ગુજરાત પોસ્ટ ભવન, એસ.જી. હાઈવે, પ્રહલાદ નગર, અમદાવાદ - 380015, ગુજરાત.';
  const primaryPhone = data.primaryPhone || '+91 99099 07237';
  const rawWhatsApp = data.whatsappNumber || '+91 99099 07237';
  const primaryEmail = data.primaryEmail || 'contact@gujaratpost.in';
  const workingHours =
    data.workingHours ||
    'સોમવાર - શનિવાર: સવારે 9:00 થી રાત્રે 9:00 | 24x7 ન્યૂઝ ડેસ્ક';
  const rawMapUrl =
    data.mapEmbedUrl ||
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117506.44754760882!2d72.43965561026046!3d23.02015809244018!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e848aba5bd449%3A0x4fcedd11614f6516!2sAhmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin';
  const mapEmbedUrl = (() => {
    if (!rawMapUrl) return '';
    const match = rawMapUrl.match(/src=["'](https?:\/\/[^"']+)["']/i);
    return match && match[1] ? match[1] : rawMapUrl.trim();
  })();

  const editorialEmail = data.editorialEmail || 'editorial@gujaratpost.in';
  const editorialPhone = data.editorialPhone || '+91 99099 07237';
  const adsEmail = data.adsEmail || 'ads@gujaratpost.in';
  const adsPhone = data.adsPhone || '+91 99099 07237';

  const grievanceName = data.grievanceName || 'મહેશ પટેલ (Mahesh Patel)';
  const grievanceDesignation =
    data.grievanceDesignation || 'તકરાર નિવારણ અધિકારી (Grievance Redressal Officer)';
  const grievanceEmail = data.grievanceEmail || 'grievance@gujaratpost.in';
  const grievanceAddress =
    data.grievanceAddress || 'ગુજરાત પોસ્ટ મુખ્ય કાર્યાલય, અમદાવાદ, ગુજરાત - 380015';

  const socialLinks: SocialLinks =
    data.socialLinksJson && typeof data.socialLinksJson === 'object'
      ? data.socialLinksJson
      : {};

  // Website's default WhatsApp link
  const whatsAppUrl =
    'https://api.whatsapp.com/send/?phone=919909907237&text&type=phone_number&app_absent=0';

  // Interactive Form State with Real-Time Validation
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Editorial / News Tip',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize message textarea dynamically with minimum height & strict maximum limit
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const minHeight = 110;
    const maxHeight = 200;
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight >= maxHeight ? 'auto' : 'hidden';
  }, [formState.message]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const validateField = (field: string, value: string): string => {
    const trimmed = (value || '').trim();
    switch (field) {
      case 'name':
        if (!trimmed) return 'Full Name is required.';
        if (trimmed.length < 2) return 'Full Name must be at least 2 characters.';
        return '';
      case 'email':
        if (!trimmed) return 'Email Address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return 'Please enter a valid email address (e.g. name@example.com).';
        }
        return '';
      case 'phone':
        if (trimmed) {
          const digits = trimmed.replace(/\D/g, '');
          if (digits.length < 10 || digits.length > 15) {
            return 'Please enter a valid phone number (10 to 15 digits).';
          }
        }
        return '';
      case 'subject':
        if (!trimmed) return 'Subject is required.';
        if (trimmed.length < 3) return 'Subject must be at least 3 characters.';
        return '';
      case 'message':
        if (!trimmed) return 'Message is required.';
        if (trimmed.length < 10) return 'Message must be at least 10 characters.';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, (formState as any)[field] || '');
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const newErrors: Record<string, string> = {
      name: validateField('name', formState.name),
      email: validateField('email', formState.email),
      phone: validateField('phone', formState.phone),
      subject: validateField('subject', formState.subject),
      message: validateField('message', formState.message),
    };

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true,
    });

    const hasErrors = Object.values(newErrors).some((msg) => Boolean(msg));
    if (hasErrors) {
      setFormError('Please review and fix the highlighted fields below.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactMessage({
        name: formState.name.trim(),
        email: formState.email.trim(),
        phone: formState.phone.trim(),
        department: formState.department,
        subject: formState.subject.trim(),
        message: formState.message.trim(),
      });
      setSubmitted(true);
      setFormState({
        name: '',
        email: '',
        phone: '',
        department: 'Editorial / News Tip',
        subject: '',
        message: '',
      });
      setErrors({});
      setTouched({});
    } catch (err: any) {
      console.error('Submission failed:', err);
      setFormError(err?.message || 'Failed to submit your message. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LocalizedContent>
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0A] text-neutral-900 dark:text-neutral-100 pb-20">
      {/* ── 1. Hero & Breadcrumb ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-950/15 via-[#F8F9FA]/80 dark:via-[#0A0A0A]/80 to-[#F8F9FA] dark:to-[#0A0A0A] -mt-3 sm:-mt-4 pt-4 sm:pt-6 pb-6 sm:pb-8 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(#b3121b_1px,transparent_1px)] [background-size:20px_20px] sm:[background-size:24px_24px] opacity-[0.05] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-4 font-medium">
            <Link href="/" className="hover:text-red-600 dark:hover:text-red-400 transition">
              હોમ
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-red-600 dark:text-red-400 font-bold">સંપર્ક કરો</span>
          </nav>

          <div className="max-w-3xl text-center mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
              </span>
              <span>24x7 હેલ્પલાઇન & સંપર્ક</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
              {pageTitle}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed max-w-2xl mx-auto">
              {pageSubtitle}
            </p>

            {/* Quick Action Buttons for Mobile & Desktop */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
              <a
                href={`tel:${primaryPhone}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 transition active:scale-95"
              >
                <PhoneCall className="h-4 w-4" />
                <span>કૉલ કરો ({primaryPhone})</span>
              </a>

              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp ચેટ</span>
              </a>

              <a
                href={`mailto:${primaryEmail}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-300 dark:border-neutral-700 hover:border-red-600 text-neutral-800 dark:text-neutral-200 font-bold text-xs sm:text-sm transition active:scale-95"
              >
                <Mail className="h-4 w-4 text-red-600" />
                <span>ઈમેલ કરો</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Main Content Grid: Direct Cards + Interactive Form ── */}
      <section className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Direct Contact Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Main Office Card */}
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-zinc-900 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />

              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/10 text-red-600 dark:bg-red-600/20 dark:text-red-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900 dark:text-white">
                    મુખ્ય કાર્યાલય (Head Office)
                  </h3>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">સેન્ટ્રલ ડેસ્ક - અમદાવાદ</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium mb-3">
                {headOfficeAddress}
              </p>

              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <Clock className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <span>{workingHours}</span>
              </div>
            </div>

            {/* Direct Phone & WhatsApp Card */}
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-zinc-900 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                ત્વરિત સંપર્ક માધ્યમ
              </h3>

              {/* Calling Number */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <PhoneCall className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-neutral-400 uppercase">ફોન હેલ્પલાઇન</div>
                    <a
                      href={`tel:${primaryPhone}`}
                      className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white hover:text-red-600 transition truncate block"
                    >
                      {primaryPhone}
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(primaryPhone, 'primaryPhone')}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-zinc-700 hover:text-neutral-700 transition cursor-pointer"
                  title="કોપી કરો"
                >
                  {copiedKey === 'primaryPhone' ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                      સત્તાવાર વોટ્સએપ
                    </div>
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-200 hover:underline truncate block"
                    >
                      {rawWhatsApp}
                    </a>
                  </div>
                </div>

                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm"
                >
                  <span>ચેટ</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Primary Email */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-neutral-400 uppercase">સામાન્ય ઈમેલ</div>
                    <a
                      href={`mailto:${primaryEmail}`}
                      className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white hover:text-red-600 transition truncate block"
                    >
                      {primaryEmail}
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(primaryEmail, 'primaryEmail')}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-zinc-700 hover:text-neutral-700 transition cursor-pointer"
                  title="કોપી કરો"
                >
                  {copiedKey === 'primaryEmail' ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Department Quick Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {/* Editorial Desk */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <Newspaper className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase">
                    સંપાદકીય વિભાગ (Editorial)
                  </h4>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mb-2">
                  પ્રેસ નોટ, સમાચાર અને વિશેષ અહેવાલો મોકલવા માટે:
                </p>
                <div className="space-y-1 text-xs font-bold">
                  <a
                    href={`mailto:${editorialEmail}`}
                    className="flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <Mail className="h-3 w-3" />
                    <span>{editorialEmail}</span>
                  </a>
                  {editorialPhone && (
                    <a
                      href={`tel:${editorialPhone}`}
                      className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-blue-600"
                    >
                      <PhoneCall className="h-3 w-3" />
                      <span>{editorialPhone}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Advertisement Desk */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase">
                    જાહેરાત વિભાગ (Advertisement)
                  </h4>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mb-2">
                  વેબસાઇટ, ઈ-પેપર અને સોશિયલ મીડિયા જાહેરાત માટે:
                </p>
                <div className="space-y-1 text-xs font-bold">
                  <a
                    href={`mailto:${adsEmail}`}
                    className="flex items-center gap-1.5 text-amber-600 hover:underline dark:text-amber-400"
                  >
                    <Mail className="h-3 w-3" />
                    <span>{adsEmail}</span>
                  </a>
                  {adsPhone && (
                    <a
                      href={`tel:${adsPhone}`}
                      className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-amber-600"
                    >
                      <PhoneCall className="h-3 w-3" />
                      <span>{adsPhone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-8 shadow-sm dark:border-neutral-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3 mb-5 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/10 text-red-600 dark:bg-red-600/20 dark:text-red-400 shrink-0">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">
                    Send a Message or News Tip
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Our reporting and editorial team will review your message promptly.
                  </p>
                </div>
              </div>

              {submitted ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30 space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-black text-emerald-950 dark:text-emerald-200">
                    Your Message Has Been Sent Successfully!
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 max-w-md mx-auto leading-relaxed">
                    Thank you for contacting Gujarat Post. Our editorial team will review your message and reach out shortly via email or phone.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setErrors({});
                      setTouched({});
                    }}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition cursor-pointer"
                  >
                    <span>Send Another Message</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {formError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formState.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        onBlur={() => handleBlur('name')}
                        placeholder="e.g. Ramesh Patel"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 transition-colors focus:outline-none focus:ring-2 dark:text-neutral-100 ${
                          touched.name && errors.name
                            ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-red-500/20 dark:bg-red-950/20 dark:border-red-500'
                            : 'border-neutral-300 bg-white focus:border-red-600 focus:ring-red-600/10 dark:border-neutral-700 dark:bg-zinc-800'
                        }`}
                      />
                      {touched.name && errors.name && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] sm:text-xs text-red-600 dark:text-red-400 font-medium">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{errors.name}</span>
                        </p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formState.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        placeholder="youremail@example.com"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 transition-colors focus:outline-none focus:ring-2 dark:text-neutral-100 ${
                          touched.email && errors.email
                            ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-red-500/20 dark:bg-red-950/20 dark:border-red-500'
                            : 'border-neutral-300 bg-white focus:border-red-600 focus:ring-red-600/10 dark:border-neutral-700 dark:bg-zinc-800'
                        }`}
                      />
                      {touched.email && errors.email && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] sm:text-xs text-red-600 dark:text-red-400 font-medium">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{errors.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mobile / Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Mobile / Phone Number <span className="text-neutral-400 text-[11px] font-normal">(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={formState.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        onBlur={() => handleBlur('phone')}
                        placeholder="+91 99099 07237"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 transition-colors focus:outline-none focus:ring-2 dark:text-neutral-100 ${
                          touched.phone && errors.phone
                            ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-red-500/20 dark:bg-red-950/20 dark:border-red-500'
                            : 'border-neutral-300 bg-white focus:border-red-600 focus:ring-red-600/10 dark:border-neutral-700 dark:bg-zinc-800'
                        }`}
                      />
                      {touched.phone && errors.phone && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] sm:text-xs text-red-600 dark:text-red-400 font-medium">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{errors.phone}</span>
                        </p>
                      )}
                    </div>

                    {/* Department / Purpose */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Department / Purpose
                      </label>
                      <select
                        value={formState.department}
                        onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/10 dark:border-neutral-700 dark:bg-zinc-800 dark:text-neutral-100 cursor-pointer"
                      >
                        <option value="Editorial / News Tip">Editorial / News Tip</option>
                        <option value="Advertisement Inquiry">Advertisement Inquiry</option>
                        <option value="E-Paper / Subscription">E-Paper / Subscription</option>
                        <option value="Grievance / Correction">Grievance / Correction</option>
                        <option value="General Inquiry">General Inquiry</option>
                      </select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formState.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      onBlur={() => handleBlur('subject')}
                      placeholder="Enter the main subject of your message..."
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 transition-colors focus:outline-none focus:ring-2 dark:text-neutral-100 ${
                        touched.subject && errors.subject
                          ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-red-500/20 dark:bg-red-950/20 dark:border-red-500'
                          : 'border-neutral-300 bg-white focus:border-red-600 focus:ring-red-600/10 dark:border-neutral-700 dark:bg-zinc-800'
                      }`}
                    />
                    {touched.subject && errors.subject && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] sm:text-xs text-red-600 dark:text-red-400 font-medium">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errors.subject}</span>
                      </p>
                    )}
                  </div>

                  {/* Your Message */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Your Message <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-neutral-400">
                        {formState.message.length} / 2000 characters (min. 10)
                      </span>
                    </div>
                    <textarea
                      ref={textareaRef}
                      rows={4}
                      maxLength={2000}
                      value={formState.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      onBlur={() => handleBlur('message')}
                      placeholder="Write your news tip, inquiry, press note, or question here..."
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 leading-relaxed min-h-[110px] max-h-[200px] resize-none overflow-y-auto transition-[border-color,box-shadow] focus:outline-none focus:ring-2 dark:text-neutral-100 ${
                        touched.message && errors.message
                          ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-red-500/20 dark:bg-red-950/20 dark:border-red-500'
                          : 'border-neutral-300 bg-white focus:border-red-600 focus:ring-red-600/10 dark:border-neutral-700 dark:bg-zinc-800'
                      }`}
                    />
                    {touched.message && errors.message && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] sm:text-xs text-red-600 dark:text-red-400 font-medium">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errors.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-6 py-3 text-xs sm:text-sm font-black text-white shadow-md shadow-red-600/25 transition active:scale-98 disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Submit Message</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-neutral-400 dark:text-neutral-500 pt-1 flex items-center justify-center gap-1.5">
                    <Shield className="h-3 w-3 text-neutral-400" />
                    <span>Your personal information will be kept strictly confidential.</span>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Grievance Redressal Officer Notice (Legal Compliance) ── */}
      <section className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6">
        <div className="rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50/50 to-white p-4 sm:p-5 shadow-xs dark:border-red-900/40 dark:from-red-950/20 dark:to-zinc-900">
          {/* Header */}
          <div className="flex items-start sm:items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-red-100 dark:border-red-900/40">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-red-600 text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="text-xs sm:text-base font-black text-red-950 dark:text-red-200 leading-snug">
                    તકરાર નિવારણ અધિકારી (Grievance Redressal Officer)
                  </h3>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-red-600/10 text-red-700 dark:text-red-300 px-2 py-0.5 rounded border border-red-200/80 dark:border-red-900 shrink-0">
                    નૈતિક આચારસંહિતા
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
                  ઇન્ફોર્મેશન ટેક્નોલોજી (મધ્યસ્થી માર્ગદર્શિકા અને ડિજિટલ મીડિયા આચારસંહિતા) નિયમો, 2021 હેઠળ
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
            કોઈપણ સમાચાર, અહેવાલ કે સામગ્રી સામે વાચકોની ફરિયાદ અથવા વાંધા હોય તો નિયુક્ત તકરાર નિવારણ અધિકારીને લેખિતમાં અથવા ઈમેલ દ્વારા મોકલી શકો છો.
          </p>

          {/* 4 Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
            {/* 1. Officer */}
            <div className="rounded-xl bg-white dark:bg-zinc-800/90 p-2.5 sm:p-3 border border-red-100/70 dark:border-neutral-800 flex items-start gap-2.5 shadow-2xs">
              <div className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">અધિકારી</span>
                <span className="text-xs font-black text-neutral-900 dark:text-white leading-snug mt-0.5 block">
                  {grievanceName}
                </span>
              </div>
            </div>

            {/* 2. Designation */}
            <div className="rounded-xl bg-white dark:bg-zinc-800/90 p-2.5 sm:p-3 border border-red-100/70 dark:border-neutral-800 flex items-start gap-2.5 shadow-2xs">
              <div className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">હોદ્દો</span>
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 leading-snug mt-0.5 block">
                  {grievanceDesignation}
                </span>
              </div>
            </div>

            {/* 3. Email */}
            <div className="rounded-xl bg-white dark:bg-zinc-800/90 p-2.5 sm:p-3 border border-red-100/70 dark:border-neutral-800 flex items-start gap-2.5 shadow-2xs">
              <div className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">ફરિયાદ ઈમેલ</span>
                <a
                  href={`mailto:${grievanceEmail}`}
                  className="text-xs font-bold text-red-600 hover:underline leading-snug mt-0.5 block break-all"
                >
                  {grievanceEmail}
                </a>
              </div>
            </div>

            {/* 4. Address */}
            <div className="rounded-xl bg-white dark:bg-zinc-800/90 p-2.5 sm:p-3 border border-red-100/70 dark:border-neutral-800 flex items-start gap-2.5 shadow-2xs">
              <div className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">સરનામું</span>
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 leading-snug mt-0.5 block">
                  {grievanceAddress}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Embedded Google Map ── */}
      {mapEmbedUrl && (
        <section className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-0">
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-sm dark:border-neutral-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600" />
                <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                  સ્થળ નિર્દેશ (Office Location Map)
                </h3>
              </div>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline"
              >
                <span>ગૂગલ મેપ પર જુઓ</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="overflow-hidden rounded-xl min-h-[240px] sm:min-h-[340px] border border-neutral-200 dark:border-neutral-800 relative bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center">
              <ConsentGate type="map" category="marketing" title="Gujarat Post Office Location" className="w-full h-full min-h-[240px] sm:min-h-[340px]">
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '300px' }}
                  loading="lazy"
                  title="Gujarat Post Office Location"
                  allowFullScreen
                />
              </ConsentGate>
            </div>
          </div>
        </section>
      )}
    </div>
    </LocalizedContent>
  );
}
