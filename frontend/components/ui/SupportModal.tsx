'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, X, Copy, Check, QrCode, Building2, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getBackendApiUrl, getPublicSupportDetails } from '@/lib/api';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SupportDetails {
  qrCodeImage: string;
  upiId: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  noteGu: string;
  noteEn: string;
  noteHi: string;
}

const DEFAULT_SUPPORT_DETAILS: SupportDetails = {
  qrCodeImage: '',
  upiId: 'gujaratpost@upi',
  accountName: 'Gujarat Post Media Pvt Ltd',
  accountNumber: '9924038640',
  ifscCode: 'HDFC0001234',
  bankName: 'BOB Bank',
  branchName: 'Main Branch, SG Highway, Ahmedabad',
  noteGu: 'GPay, PhonePe, Paytm અથવા કોઈપણ UPI એપ વડે સ્કેન કરી સપોર્ટ આપી શકો છો.',
  noteEn: 'Scan the QR Code via GPay, PhonePe, Paytm or any UPI app to support.',
  noteHi: 'GPay, PhonePe, Paytm या किसी भी UPI ऐप से स्कैन करके सपोर्ट कर सकते हैं।',
};

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<'upi' | 'bank'>('upi');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [data, setData] = useState<SupportDetails>(DEFAULT_SUPPORT_DETAILS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    setLoading(true);

    const fetchSupport = async () => {
      try {
        let resData: any = null;
        try {
          const res = await fetch('/api/public/support?t=' + Date.now(), { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            if (json?.success && json?.data) resData = json.data;
          }
        } catch (e) { }

        if (!resData) {
          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/public';
            const res = await fetch(`${backendUrl}/support?t=${Date.now()}`, { cache: 'no-store' });
            if (res.ok) {
              const json = await res.json();
              if (json?.success && json?.data) resData = json.data;
            }
          } catch (e) { }
        }

        if (resData) {
          setData({
            qrCodeImage: resData.qrCodeImage ?? '',
            upiId: resData.upiId ?? '',
            accountName: resData.accountName ?? '',
            accountNumber: resData.accountNumber ?? '',
            ifscCode: resData.ifscCode ?? '',
            bankName: resData.bankName ?? '',
            branchName: resData.branchName ?? '',
            noteGu: resData.noteGu ?? '',
            noteEn: resData.noteEn ?? '',
            noteHi: resData.noteHi ?? '',
          });
        }
      } catch (err) {
        console.warn('Failed to fetch support details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupport();

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const copyUpiId = () => {
    if (!data.upiId) return;
    navigator.clipboard.writeText(data.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const copyBankDetails = () => {
    const text = `Account Name: ${data.accountName}\nAccount No: ${data.accountNumber}\nIFSC Code: ${data.ifscCode}\nBank: ${data.bankName}, ${data.branchName}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const getNote = () => {
    if (language === 'hi') return data.noteHi || data.noteEn;
    if (language === 'gu') return data.noteGu || data.noteEn;
    return data.noteEn || data.noteGu;
  };

  const title = language === 'gu' ? 'ગુજરાત પોસ્ટને સપોર્ટ કરો' : language === 'hi' ? 'गुजरात पोस्ट को सपोर्ट करें' : 'Support Gujarat Post';
  const subtitle = language === 'gu' ? 'નિષ્પક્ષ અને સ્વતંત્ર પત્રકારત્વને સશક્ત બનાવવામાં તમારો સહયોગ આપો.' : language === 'hi' ? 'निष्पक्ष और स्वतंत्र पत्रकारिता को सशक्त बनाने में अपना सहयोग दें।' : 'Empower unbiased, independent stories and journalism.';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-2xl transition-all duration-300 text-foreground scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header decoration */}
        <div className="h-2 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-t-3xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-5 sm:p-7 space-y-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider">
              <Heart className="h-3.5 w-3.5 fill-current animate-pulse" />
              <span>{language === 'gu' ? 'સહયોગ આપો' : language === 'hi' ? 'सहयोग दें' : 'Give Support'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted border border-border/80">
                <button
                  type="button"
                  onClick={() => setActiveTab('upi')}
                  className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'upi'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>{language === 'gu' ? 'UPI / QR કોડ' : language === 'hi' ? 'UPI / QR कोड' : 'UPI / QR Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('bank')}
                  className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'bank'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{language === 'gu' ? 'બેંક વિગતો' : language === 'hi' ? 'बैंक विवरण' : 'Bank Details'}</span>
                </button>
              </div>

              {/* UPI & QR Code Display */}
              {activeTab === 'upi' && (
                <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 text-center space-y-4">
                  {/* QR Code Container */}
                  <div className="inline-block p-3 rounded-2xl bg-white shadow-md border border-zinc-200">
                    {data.qrCodeImage ? (
                      <img
                        src={data.qrCodeImage.startsWith('http') || data.qrCodeImage.startsWith('data:') ? data.qrCodeImage : getBackendApiUrl(data.qrCodeImage)}
                        alt="Official Support QR Code"
                        className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain rounded-lg"
                        onError={(e) => {
                          if (data.upiId) {
                            (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${data.upiId}&pn=${encodeURIComponent(data.accountName || 'Gujarat Post')}`)}`;
                          }
                        }}
                      />
                    ) : data.upiId ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${data.upiId}&pn=${encodeURIComponent(data.accountName || 'Gujarat Post')}`)}`}
                        alt="Official Support QR Code"
                        className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain rounded-lg"
                      />
                    ) : (
                      /* High Quality Fallback Vector QR */
                      <svg className="w-48 h-48 sm:w-56 sm:h-56 text-zinc-900 mx-auto" viewBox="0 0 100 100" fill="currentColor">
                        <rect x="0" y="0" width="30" height="30" rx="4" />
                        <rect x="4" y="4" width="22" height="22" fill="white" rx="2" />
                        <rect x="8" y="8" width="14" height="14" rx="1" />
                        
                        <rect x="70" y="0" width="30" height="30" rx="4" />
                        <rect x="74" y="4" width="22" height="22" fill="white" rx="2" />
                        <rect x="78" y="8" width="14" height="14" rx="1" />
                        
                        <rect x="0" y="70" width="30" height="30" rx="4" />
                        <rect x="4" y="74" width="22" height="22" fill="white" rx="2" />
                        <rect x="8" y="78" width="14" height="14" rx="1" />

                        <rect x="38" y="10" width="8" height="8" />
                        <rect x="52" y="10" width="8" height="8" />
                        <rect x="38" y="24" width="22" height="8" />
                        <rect x="10" y="38" width="12" height="12" />
                        <rect x="30" y="38" width="10" height="10" />
                        <rect x="46" y="38" width="16" height="16" />
                        <rect x="68" y="38" width="22" height="8" />
                        <rect x="38" y="60" width="8" height="18" />
                        <rect x="52" y="60" width="12" height="8" />
                        <rect x="68" y="52" width="18" height="16" />
                        <rect x="38" y="82" width="22" height="8" />
                        <rect x="68" y="74" width="22" height="16" />
                      </svg>
                    )}
                  </div>

                  {/* UPI ID Row */}
                  {data.upiId && (
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <span className="text-xs font-bold text-muted-foreground">UPI ID:</span>
                      <code className="text-xs sm:text-sm font-black bg-card px-3 py-1.5 rounded-lg border border-border tracking-wide text-foreground">
                        {data.upiId}
                      </code>
                      <button
                        type="button"
                        onClick={copyUpiId}
                        className="p-1.5 rounded-lg bg-card hover:bg-secondary border border-border text-foreground transition active:scale-95 cursor-pointer"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  )}

                  {/* Reader Note */}
                  <p className="text-xs text-muted-foreground leading-relaxed px-2 font-medium">
                    {getNote()}
                  </p>
                </div>
              )}

              {/* Bank Details Display */}
              {activeTab === 'bank' && (
                <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                      {language === 'gu' ? 'બેંક એકાઉન્ટ માહિતી' : language === 'hi' ? 'बैंक खाता जानकारी' : 'Bank Account Information'}
                    </span>
                    <button
                      type="button"
                      onClick={copyBankDetails}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-card hover:bg-secondary border border-border text-[11px] font-bold text-foreground cursor-pointer transition active:scale-95"
                    >
                      {copiedBank ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedBank ? 'Copied' : 'Copy All'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs font-sans text-muted-foreground leading-snug">
                    {data.accountName && (
                      <div className="flex justify-between border-b border-border/50 pb-1.5">
                        <span className="font-bold text-foreground">Account Name:</span>
                        <span className="font-extrabold text-foreground">{data.accountName}</span>
                      </div>
                    )}
                    {data.accountNumber && (
                      <div className="flex justify-between border-b border-border/50 pb-1.5">
                        <span className="font-bold text-foreground">Account Number:</span>
                        <span className="font-extrabold text-foreground font-mono">{data.accountNumber}</span>
                      </div>
                    )}
                    {data.ifscCode && (
                      <div className="flex justify-between border-b border-border/50 pb-1.5">
                        <span className="font-bold text-foreground">IFSC Code:</span>
                        <span className="font-extrabold text-foreground font-mono">{data.ifscCode}</span>
                      </div>
                    )}
                    {data.bankName && (
                      <div className="flex justify-between border-b border-border/50 pb-1.5">
                        <span className="font-bold text-foreground">Bank Name:</span>
                        <span className="font-extrabold text-foreground">{data.bankName}</span>
                      </div>
                    )}
                    {data.branchName && (
                      <div className="flex justify-between pb-0.5">
                        <span className="font-bold text-foreground">Branch:</span>
                        <span className="font-semibold text-foreground text-right">{data.branchName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trust Badge Footer */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-muted-foreground text-center pt-1 border-t border-border">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>{language === 'gu' ? '૧૦૦% સુરક્ષિત સહયોગ • સ્વતંત્ર મીડિયા' : language === 'hi' ? '100% सुरक्षित सहयोग • स्वतंत्र मीडिया' : '100% Secure Support • Independent Journalism'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
