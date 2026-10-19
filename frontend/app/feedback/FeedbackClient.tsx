'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  Shield,
  FileText,
  Mail,
  Phone,
  PhoneCall,
  MapPin,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Info,
  Check,
  Copy,
  RotateCcw,
  Building2,
  ShieldCheck,
  User,
  AlertCircle,
  MessageCircle,
  Newspaper,
  BookOpen,
} from 'lucide-react';
import { submitFeedback } from '@/lib/api';

const FEEDBACK_CATEGORIES = [
  { id: 'Content Quality', labelGu: 'સમાચાર ગુણવત્તા', labelEn: 'Content Quality' },
  { id: 'Suggestion & Idea', labelGu: 'સૂચન અને વિચાર', labelEn: 'Suggestions' },
  { id: 'Website & App', labelGu: 'વેબસાઇટ / ઍપ', labelEn: 'Technical' },
  { id: 'Editorial Praise', labelGu: 'સંપાદકીય પ્રશંસા', labelEn: 'Appreciation' },
  { id: 'General', labelGu: 'સામાન્ય પ્રતિસાદ', labelEn: 'General' },
];

const COMPLAINT_CATEGORIES = [
  { id: 'Factual Error', labelGu: 'તથ્યદોષ / ખોટી વિગત', labelEn: 'Factual Error' },
  { id: 'Misleading Headline', labelGu: 'ગેરમાર્ગે દોરતી હેડલાઇન', labelEn: 'Headline' },
  { id: 'Defamation & Privacy', labelGu: 'માનહાનિ / ગોપનીયતા', labelEn: 'Defamation' },
  { id: 'Copyright Infringement', labelGu: 'કૉપિરાઇટ ઉલ્લંઘન', labelEn: 'Copyright' },
  { id: 'Ethics Violation', labelGu: 'આચારસંહિતા ભંગ', labelEn: 'Ethics Violation' },
  { id: 'Other Grievance', labelGu: 'અન્ય ફરિયાદ', labelEn: 'Other' },
];

interface FeedbackClientProps {
  initialType?: 'FEEDBACK' | 'COMPLAINT';
  initialData?: any;
}

export default function FeedbackClient({
  initialType = 'FEEDBACK',
  initialData = {},
}: FeedbackClientProps) {
  const data = initialData || {};

  const grievanceName = data.grievanceName || 'મહેશ પટેલ (Mahesh Patel)';
  const grievanceDesignation =
    data.grievanceDesignation || 'તકરાર નિવારણ અધિકારી (Grievance Redressal Officer)';
  const grievanceEmail = data.grievanceEmail || 'grievance@gujaratpost.in';
  const grievanceAddress =
    data.grievanceAddress || 'ગુજરાત પોસ્ટ ભવન, એસ.જી. હાઈવે, પ્રહલાદ નગર, અમદાવાદ - 380015, ગુજરાત.';
  const primaryPhone = data.primaryPhone || '+91 99099 07237';
  const rawWhatsApp = data.whatsappNumber || '+91 99099 07237';
  const whatsAppUrl =
    'https://api.whatsapp.com/send/?phone=919909907237&text&type=phone_number&app_absent=0';

  const [submissionType, setSubmissionType] = useState<'FEEDBACK' | 'COMPLAINT'>(initialType);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: initialType === 'COMPLAINT' ? COMPLAINT_CATEGORIES[0].id : FEEDBACK_CATEGORIES[0].id,
    subject: '',
    message: '',
    articleUrl: '',
    declaration: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string>('');
  const [serverSuccessMsg, setServerSuccessMsg] = useState<string>('');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTypeChange = (newType: 'FEEDBACK' | 'COMPLAINT') => {
    setSubmissionType(newType);
    setFormError(null);
    setFormData((prev) => ({
      ...prev,
      category: newType === 'COMPLAINT' ? COMPLAINT_CATEGORIES[0].id : FEEDBACK_CATEGORIES[0].id,
    }));
  };

  const validateField = (field: string, value: string): string => {
    const trimmed = (value || '').trim();
    switch (field) {
      case 'name':
        if (!trimmed) return 'કૃપા કરીને પૂરું નામ લખો (Full Name required).';
        if (trimmed.length < 2) return 'નામ ઓછામાં ઓછું 2 અક્ષરનું હોવું જોઈએ.';
        return '';
      case 'email':
        if (!trimmed) return 'કૃપા કરીને ઇમેઇલ લખો (Email required).';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return 'માન્ય ઇમેઇલ એડ્રેસ લખો (Valid email required).';
        }
        return '';
      case 'phone':
        if (trimmed) {
          const digits = trimmed.replace(/\D/g, '');
          if (digits.length < 10 || digits.length > 15) {
            return 'માન્ય 10 થી 15 અંકનો ફોન નંબર લખો.';
          }
        }
        return '';
      case 'subject':
        if (!trimmed) return 'કૃપા કરીને વિષય લખો (Subject required).';
        if (trimmed.length < 3) return 'વિષય ઓછામાં ઓછો 3 અક્ષરનો હોવો જોઈએ.';
        return '';
      case 'message':
        if (!trimmed) return 'કૃપા કરીને વિગતવાર સંદેશ લખો (Message required).';
        if (trimmed.length < 10) return 'સંદેશ ઓછામાં ઓછો 10 અક્ષરનો હોવો જોઈએ.';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, (formData as any)[field]) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const newErrors: Record<string, string> = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      subject: validateField('subject', formData.subject),
      message: validateField('message', formData.message),
    };

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true,
    });

    const hasErrors = Object.values(newErrors).some((msg) => !!msg);
    if (hasErrors) {
      setFormError('કૃપા કરીને ફોર્મમાં જરૂરી વિગતો યોગ્ય રીતે ભરો.');
      return;
    }

    if (submissionType === 'COMPLAINT' && !formData.declaration) {
      setFormError('ફરિયાદ નોંધાવવા માટે આપેલી વિગત સાચી હોવાની બાંયધરી આપવી ફરજિયાત છે.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitFeedback({
        type: submissionType,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        category: formData.category,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        articleUrl: formData.articleUrl.trim() || undefined,
      });

      setReferenceId(res?.data?.referenceId || res?.data?.id?.slice(0, 8)?.toUpperCase() || 'GP-REF');
      setServerSuccessMsg(res?.message || 'તમારો સંદેશ સફળતાપૂર્વક મળ્યો છે.');
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: submissionType === 'COMPLAINT' ? COMPLAINT_CATEGORIES[0].id : FEEDBACK_CATEGORIES[0].id,
        subject: '',
        message: '',
        articleUrl: '',
        declaration: false,
      });
      setErrors({});
      setTouched({});
    } catch (err: any) {
      setFormError(err?.message || 'સંદેશ મોકલવામાં સમસ્યા આવી. કૃપા કરીને થોડીવાર પછી ફરી પ્રયાસ કરો.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeCategories = submissionType === 'COMPLAINT' ? COMPLAINT_CATEGORIES : FEEDBACK_CATEGORIES;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0A] text-neutral-900 dark:text-neutral-100 pb-16">
      
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
            <Link href="/contact" className="hover:text-red-600 dark:hover:text-red-400 transition">
              સંપર્ક
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-red-600 dark:text-red-400 font-bold">
              {submissionType === 'COMPLAINT' ? 'તકરાર નિવારણ' : 'પ્રતિસાદ અને તકરાર નિવારણ'}
            </span>
          </nav>

          <div className="max-w-3xl text-center mx-auto space-y-3">
            {/* Live Indicator Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
              </span>
              <span>વાચક અવાજ & તકરાર નિવારણ પોર્ટલ</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
              પ્રતિસાદ અને તકરાર નિવારણ
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed max-w-2xl mx-auto">
              ગુજરાત પોસ્ટને આપનો વિશ્વાસ અને સચોટ માહિતી પ્રાથમિકતા છે. સમાચાર અંગેનો અભિપ્રાય, સુધારો કે ફરિયાદ સીધી સંપાદકીય ટીમ અને તકરાર નિવારણ અધિકારી સુધી પહોંચાડો.
            </p>

            {/* Mode Switch Tabs Pill Bar */}
            <div className="pt-2">
              <div className="inline-flex p-1 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleTypeChange('FEEDBACK')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                    submissionType === 'FEEDBACK'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>વાચક પ્રતિસાદ (Feedback)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('COMPLAINT')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                    submissionType === 'COMPLAINT'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>તકરાર / ફરિયાદ (Complaint Redressal)</span>
                </button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <a
                href={`tel:${primaryPhone}`}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 hover:border-red-600 text-neutral-800 dark:text-neutral-200 font-bold text-xs shadow-2xs transition active:scale-95"
              >
                <PhoneCall className="h-3.5 w-3.5 text-red-600" />
                <span>હેલ્પલાઇન: {primaryPhone}</span>
              </a>

              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-600 text-neutral-800 dark:text-neutral-200 font-bold text-xs shadow-2xs transition active:scale-95"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>WhatsApp ડેસ્ક</span>
              </a>

              <a
                href={`mailto:${grievanceEmail}`}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 hover:border-red-600 text-neutral-800 dark:text-neutral-200 font-bold text-xs shadow-2xs transition active:scale-95"
              >
                <Mail className="h-3.5 w-3.5 text-red-600" />
                <span>તકરાર ઈમેલ: {grievanceEmail}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Main Content Grid: Perfectly Balanced & Aligned Columns ── */}
      <section className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Grievance Desk, Timeline & Contact Info (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            
            {/* Card 1: Official Grievance Redressal Officer */}
            <div className="rounded-2xl border border-red-200/90 bg-white p-5 shadow-sm dark:border-red-900/40 dark:bg-zinc-900 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />

              <div className="flex items-center gap-3 mb-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-600 dark:bg-red-600/20 dark:text-red-400 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white leading-tight">
                    તકરાર નિવારણ અધિકારી
                  </h3>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Grievance Redressal Officer
                  </span>
                </div>
              </div>

              <p className="text-[11.5px] text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed font-medium">
                ડિજિટલ મીડિયા આચારસંહિતા નિયમો, 2021 હેઠળ વાચકોના હક્કો અને સચોટ પત્રકારત્વ માટે સત્તાવાર નિવારણ વ્યવસ્થા.
              </p>

              <div className="space-y-2.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                {/* Officer Name & Designation */}
                <div className="flex items-start gap-2">
                  <User className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-white text-xs block leading-tight">{grievanceName}</span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{grievanceDesignation}</span>
                  </div>
                </div>

                {/* Email with copy */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="h-3.5 w-3.5 text-red-600 shrink-0" />
                    <a
                      href={`mailto:${grievanceEmail}`}
                      className="text-xs font-bold text-red-600 hover:underline truncate"
                    >
                      {grievanceEmail}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(grievanceEmail, 'grievanceEmail')}
                    className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-zinc-700 hover:text-neutral-700 transition cursor-pointer"
                    title="કોપી કરો"
                  >
                    {copiedKey === 'grievanceEmail' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-neutral-600 dark:text-neutral-400 text-[11.5px] leading-relaxed">
                    {grievanceAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Response Timeline & Redressal Process */}
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-sm dark:border-neutral-800 dark:bg-zinc-900 space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>નિવારણ પ્રક્રિયા અને સમયમર્યાદા (Timeline)</span>
              </h3>

              <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex items-start gap-2 p-2 rounded-xl bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-100 dark:border-neutral-800">
                  <span className="font-black text-red-600 text-xs mt-0.5">1.</span>
                  <p className="text-[11.5px] leading-relaxed">
                    <strong className="text-neutral-900 dark:text-white">સ્વીકૃતિ (24 કલાક):</strong> ફરિયાદ મળ્યાના 24 કલાકમાં ઇમેઇલ દ્વારા સ્વીકૃતિ પહોંચ અને સંદર્ભ નંબર મોકલાય છે.
                  </p>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-xl bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-100 dark:border-neutral-800">
                  <span className="font-black text-red-600 text-xs mt-0.5">2.</span>
                  <p className="text-[11.5px] leading-relaxed">
                    <strong className="text-neutral-900 dark:text-white">તપાસ & ચકાસણી:</strong> સંબંધિત પત્રકાર અને સંપાદકીય ટીમ સાથે તથ્યોની પુષ્ટિ કરવામાં આવે છે.
                  </p>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-xl bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-100 dark:border-neutral-800">
                  <span className="font-black text-red-600 text-xs mt-0.5">3.</span>
                  <p className="text-[11.5px] leading-relaxed">
                    <strong className="text-neutral-900 dark:text-white">નિર્ણય (15 દિવસ):</strong> 15 દિવસની અંદર સુધારો (Correction) અથવા લેખિત ખુલાસો અપાય છે.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Quick Desk & Contact Link (Cleanly finishes at the exact bottom) */}
            <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-zinc-900 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-neutral-900 dark:text-white">
                  મુખ્ય સંપર્ક પેજ (Contact Us)
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  હેડ ઓફિસ સરનામું, સંપાદકીય અને બ્યુરો ડેસ્ક
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs shrink-0 ml-2"
              >
                <span>જુઓ</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

          </div>

          {/* Right Column: Interactive Form Card (7 cols - Matches left side height) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-zinc-900 h-full flex flex-col justify-between">
              
              <div>
                {/* Card Header with Icon */}
                <div className="flex items-center gap-3 mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-600 dark:bg-red-600/20 dark:text-red-400 shrink-0">
                    {submissionType === 'COMPLAINT' ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white leading-tight">
                      {submissionType === 'COMPLAINT'
                        ? 'સત્તાવાર તકરાર / ફરિયાદ નોંધાવો (Submit Complaint)'
                        : 'વાચક પ્રતિસાદ અથવા સૂચન મોકલો (Submit Feedback)'}
                    </h2>
                    <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {submissionType === 'COMPLAINT'
                        ? 'ડિજિટલ મીડિયા આચારસંહિતા હેઠળ આપની ફરિયાદ તકરાર નિવારણ અધિકારીને પહોંચશે.'
                        : 'આપનો અભિપ્રાય અને મૂલ્યવાન સૂચનો સંપાદકીય ટીમ સુધી પહોંચશે.'}
                    </p>
                  </div>
                </div>

                {submitted ? (
                  /* Success Confirmation State */
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30 space-y-3.5 my-auto animate-fadeIn">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>

                    <div className="inline-block px-3 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-full text-[11px] font-black tracking-wider uppercase">
                      સંદર્ભ ક્રમાંક (Reference ID): {referenceId}
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-emerald-950 dark:text-emerald-200">
                      {submissionType === 'COMPLAINT'
                        ? 'તમારી ફરિયાદ સફળતાપૂર્વક નોંધાઈ ગઈ છે!'
                        : 'આપનો પ્રતિસાદ સફળતાપૂર્વક મળ્યો છે!'}
                    </h3>

                    <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto leading-relaxed">
                      {serverSuccessMsg}
                    </p>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitted(false);
                          setErrors({});
                          setTouched({});
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>બીજો સંદેશ / ફરિયાદ મોકલો</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* The Compact & Streamlined Form */
                  <form onSubmit={handleSubmit} noValidate className="space-y-3">
                    
                    {/* Server Error */}
                    {formError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* ── Compact Category Pills (Grid) ── */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        કેટેગરી પસંદ કરો (Category) <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {activeCategories.map((cat) => {
                          const isSelected = formData.category === cat.id;
                          return (
                            <button
                              type="button"
                              key={cat.id}
                              onClick={() => setFormData({ ...formData, category: cat.id })}
                              className={`px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-red-600 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200 ring-1 ring-red-500'
                                  : 'border-neutral-200 dark:border-neutral-750 bg-neutral-50/50 dark:bg-zinc-800/40 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11.5px] font-bold truncate">{cat.labelGu}</span>
                                {isSelected && <Check className="h-3 w-3 text-red-600 shrink-0 ml-1" />}
                              </div>
                              <span className="text-[10px] text-neutral-400 block truncate">
                                {cat.labelEn}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Name & Email Inputs (2 Columns) ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                          પૂરું નામ (Full Name) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          onBlur={() => handleBlur('name')}
                          placeholder="દા.ત. રમેશભાઈ પટેલ"
                          className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none dark:bg-zinc-800 dark:text-neutral-100 font-medium transition ${
                            touched.name && errors.name
                              ? 'border-red-500 focus:border-red-600'
                              : 'border-neutral-300 focus:border-red-600 dark:border-neutral-700'
                          }`}
                        />
                        {touched.name && errors.name && (
                          <p className="text-[10.5px] font-bold text-red-600 mt-0.5">{errors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                          ઈમેલ (Email Address) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          onBlur={() => handleBlur('email')}
                          placeholder="yourname@example.com"
                          className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none dark:bg-zinc-800 dark:text-neutral-100 font-medium transition ${
                            touched.email && errors.email
                              ? 'border-red-500 focus:border-red-600'
                              : 'border-neutral-300 focus:border-red-600 dark:border-neutral-700'
                          }`}
                        />
                        {touched.email && errors.email && (
                          <p className="text-[10.5px] font-bold text-red-600 mt-0.5">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* ── Phone & Reference URL (2 Columns) ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                          મોબાઇલ નંબર <span className="text-neutral-400 font-normal">(વૈકલ્પિક)</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          onBlur={() => handleBlur('phone')}
                          placeholder="+91 98765 43210"
                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-red-600 focus:outline-none dark:border-neutral-700 dark:bg-zinc-800 dark:text-neutral-100 font-medium transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                          સંદર્ભ આર્ટિકલ લિંક <span className="text-neutral-400 font-normal">(જો હોય તો)</span>
                        </label>
                        <input
                          type="url"
                          value={formData.articleUrl}
                          onChange={(e) => handleInputChange('articleUrl', e.target.value)}
                          placeholder="https://gujaratpost.in/news/..."
                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-red-600 focus:outline-none dark:border-neutral-700 dark:bg-zinc-800 dark:text-neutral-100 font-medium transition"
                        />
                      </div>
                    </div>

                    {/* ── Subject ── */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        મુખ્ય વિષય (Subject) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        onBlur={() => handleBlur('subject')}
                        placeholder={
                          submissionType === 'COMPLAINT'
                            ? 'દા.ત. સમાચાર અહેવાલમાં નામની ભૂલ અંગે'
                            : 'દા.ત. ન્યૂઝ સેક્શન અંગે સૂચન'
                        }
                        className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none dark:bg-zinc-800 dark:text-neutral-100 font-medium transition ${
                          touched.subject && errors.subject
                            ? 'border-red-500 focus:border-red-600'
                            : 'border-neutral-300 focus:border-red-600 dark:border-neutral-700'
                        }`}
                      />
                      {touched.subject && errors.subject && (
                        <p className="text-[10.5px] font-bold text-red-600 mt-0.5">{errors.subject}</p>
                      )}
                    </div>

                    {/* ── Message Textarea (Strictly limited & resize-none) ── */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          વિગતવાર સંદેશ (Message) <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10.5px] font-mono text-neutral-400">
                          {formData.message.length} / 2000
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={2000}
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        onBlur={() => handleBlur('message')}
                        placeholder={
                          submissionType === 'COMPLAINT'
                            ? 'ફરિયાદની સંપૂર્ણ વિગત અહીં લખો (ખોટી માહિતી શું છે અને સાચી માહિતી શું હોવી જોઈએ તે જણાવો)...'
                            : 'આપનો વિગતવાર પ્રતિસાદ અથવા અભિપ્રાય અહીં લખો...'
                        }
                        className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none dark:bg-zinc-800 dark:text-neutral-100 font-medium leading-relaxed transition h-[105px] max-h-[140px] resize-none overflow-y-auto ${
                          touched.message && errors.message
                            ? 'border-red-500 focus:border-red-600'
                            : 'border-neutral-300 focus:border-red-600 dark:border-neutral-700'
                        }`}
                      />
                      {touched.message && errors.message && (
                        <p className="text-[10.5px] font-bold text-red-600 mt-0.5">{errors.message}</p>
                      )}
                    </div>

                    {/* ── Complaint Declaration Checkbox ── */}
                    {submissionType === 'COMPLAINT' && (
                      <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="complaintDeclaration"
                          checked={formData.declaration}
                          onChange={(e) => setFormData({ ...formData, declaration: e.target.checked })}
                          className="mt-0.5 h-3.5 w-3.5 rounded text-red-600 focus:ring-red-500 border-neutral-300 dark:border-neutral-600 cursor-pointer shrink-0"
                        />
                        <label htmlFor="complaintDeclaration" className="text-[11px] text-neutral-700 dark:text-neutral-300 cursor-pointer leading-tight font-medium">
                          હું ખાતરી આપું છું કે આ ફરિયાદમાં આપેલી માહિતી સાચી છે અને કોઈ ગેરમાર્ગે દોરતી વિગત દર્શાવી નથી.
                        </label>
                      </div>
                    )}

                    {/* ── Submit Button & Confidential Note ── */}
                    <div className="pt-1 space-y-1.5">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm py-2.5 px-4 shadow-md shadow-red-600/20 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? (
                          <>
                            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            <span>મોકલાઈ રહ્યું છે...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>
                              {submissionType === 'COMPLAINT'
                                ? 'ફરિયાદ નોંધાવો (Submit Complaint)'
                                : 'પ્રતિસાદ મોકલો (Submit Feedback)'}
                            </span>
                          </>
                        )}
                      </button>

                      <p className="text-[10.5px] text-center text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1">
                        <Shield className="h-3 w-3 text-neutral-400" />
                        <span>આપની અંગત વિગતો સુરક્ષિત અને ગુપ્ત રાખવામાં આવશે.</span>
                      </p>
                    </div>

                  </form>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
