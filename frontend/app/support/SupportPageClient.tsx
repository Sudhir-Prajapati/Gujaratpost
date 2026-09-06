'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, QrCode, Building2, Copy, Check, ShieldCheck, Newspaper, Award, Users, Loader2 } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getBackendApiUrl, getPublicSupportDetails } from '@/lib/api';

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

export default function SupportPageClient() {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<'upi' | 'bank'>('upi');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [data, setData] = useState<SupportDetails>(DEFAULT_SUPPORT_DETAILS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        console.warn('Error fetching support details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupport();
  }, []);

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

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 text-foreground">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Hero Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider">
            <Heart className="h-4 w-4 fill-current animate-pulse" />
            <span>{language === 'gu' ? 'સ્વતંત્ર પત્રકારત્વ' : language === 'hi' ? 'स्वतंत्र पत्रकारिता' : 'Independent Journalism'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {language === 'gu'
              ? 'ગુજરાત પોસ્ટને સપોર્ટ કરો'
              : language === 'hi'
              ? 'गुजरात पोस्ट को सपोर्ट करें'
              : 'Support Gujarat Post'}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {language === 'gu'
              ? 'અમારો હેતુ નિષ્પક્ષ, સચોટ અને ભયમુક્ત પત્રકારત્વ દરેક વાચક સુધી પહોંચાડવાનો છે. તમારો સપોર્ટ અમારા ન્યૂઝરૂમને મજબૂત બનાવે છે.'
              : language === 'hi'
              ? 'हमारा उद्देश्य निष्पक्ष, सटीक और भयमुक्त पत्रकारिता हर पाठक तक पहुंचाना है। आपका सपोर्ट हमारे न्यूज़रूम को मजबूत बनाता है।'
              : 'Our mission is to deliver truthful, unbiased, and independent reporting. Your contribution empowers our newsroom to stand for real stories.'}
          </p>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-600 dark:text-red-400">
              <Newspaper className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-base">
              {language === 'gu' ? '૧૦૦% નિષ્પક્ષ રિપોર્ટિંગ' : language === 'hi' ? '100% निष्पक्ष रिपोर्टिंग' : '100% Unbiased Reporting'}
            </h3>
            <p className="text-xs text-muted-foreground leading-normal">
              {language === 'gu' ? 'કોઈપણ કોર્પોરેટ અથવા રાજકીય દબાણ વગર માત્ર સત્ય સમાચારો.' : language === 'hi' ? 'किसी भी कॉरपोरेट या राजनीतिक दबाव के बिना सिर्फ सच्चे समाचार।' : 'Pure facts delivered without corporate or political pressure.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-base">
              {language === 'gu' ? 'ગ્રાઉન્ડ ઇન્વેસ્ટિગેશન' : language === 'hi' ? 'ग्राउंड इन्वेस्टिगेशन' : 'Ground Investigation'}
            </h3>
            <p className="text-xs text-muted-foreground leading-normal">
              {language === 'gu' ? 'ગુજરાતના દરેક ખૂણેથી ગ્રાઉન્ડ રિપોર્ટિંગ અને ઊંડાણપૂર્વક તપાસ.' : language === 'hi' ? 'गुजरात के हर कोने से ग्राउंड रिपोर्टिंग और गहन जांच।' : 'Deep-dive investigative reporting straight from Gujarat communities.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-base">
              {language === 'gu' ? 'જનતાનો અવાજ' : language === 'hi' ? 'जनता की आवाज' : 'People Powered'}
            </h3>
            <p className="text-xs text-muted-foreground leading-normal">
              {language === 'gu' ? 'વાચકોના સપોર્ટથી જનતાના મહત્વના પ્રશ્નો વાચા આપીએ છીએ.' : language === 'hi' ? 'पाठकों के सपोर्ट से जनता के महत्वपूर्ण प्रश्नों को उठाते हैं।' : 'Powered directly by readers like you to bring public interest to light.'}
            </p>
          </div>
        </div>

        {/* Dynamic Support Container */}
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-10 shadow-xl max-w-xl mx-auto space-y-6">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-red-600" />
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-muted border border-border/80">
                <button
                  type="button"
                  onClick={() => setActiveTab('upi')}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'upi'
                      ? 'bg-card text-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  <span>{language === 'gu' ? 'UPI / QR કોડ' : language === 'hi' ? 'UPI / QR कोड' : 'UPI / QR Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bank')}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'bank'
                      ? 'bg-card text-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>{language === 'gu' ? 'બેંક વિગતો' : language === 'hi' ? 'बैंक विवरण' : 'Bank Details'}</span>
                </button>
              </div>

              {/* UPI & QR Code */}
              {activeTab === 'upi' && (
                <div className="p-6 rounded-2xl bg-muted/40 border border-border/80 text-center space-y-5">
                  <div className="inline-block p-4 rounded-3xl bg-white shadow-lg border border-zinc-200">
                    {data.qrCodeImage ? (
                      <img
                        src={data.qrCodeImage.startsWith('http') || data.qrCodeImage.startsWith('data:') ? data.qrCodeImage : getBackendApiUrl(data.qrCodeImage)}
                        alt="Official Support QR Code"
                        className="w-56 h-56 sm:w-64 sm:h-64 mx-auto object-contain rounded-xl"
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
                        className="w-56 h-56 sm:w-64 sm:h-64 mx-auto object-contain rounded-xl"
                      />
                    ) : (
                      <svg className="w-56 h-56 sm:w-64 sm:h-64 text-zinc-900 mx-auto" viewBox="0 0 100 100" fill="currentColor">
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

                  {data.upiId && (
                    <div className="flex items-center justify-center gap-2.5">
                      <span className="text-xs sm:text-sm font-bold text-muted-foreground">UPI ID:</span>
                      <code className="text-sm sm:text-base font-black bg-card px-4 py-1.5 rounded-xl border border-border tracking-wider text-foreground">
                        {data.upiId}
                      </code>
                      <button
                        type="button"
                        onClick={copyUpiId}
                        className="p-2 rounded-xl bg-card hover:bg-secondary border border-border text-foreground transition active:scale-95 cursor-pointer shadow-xs"
                      >
                        {copiedUpi ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {getNote()}
                  </p>
                </div>
              )}

              {/* Bank Account Details */}
              {activeTab === 'bank' && (
                <div className="p-6 rounded-2xl bg-muted/40 border border-border/80 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <span className="text-xs sm:text-sm font-black text-foreground uppercase tracking-wider">
                      {language === 'gu' ? 'બેંક એકાઉન્ટ વિગતો' : language === 'hi' ? 'बैंक खाता विवरण' : 'Bank Account Details'}
                    </span>
                    <button
                      type="button"
                      onClick={copyBankDetails}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card hover:bg-secondary border border-border text-xs font-bold text-foreground cursor-pointer transition active:scale-95"
                    >
                      {copiedBank ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedBank ? 'Copied' : 'Copy Details'}</span>
                    </button>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm font-sans text-muted-foreground">
                    {data.accountName && (
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="font-bold text-foreground">Account Name:</span>
                        <span className="font-extrabold text-foreground">{data.accountName}</span>
                      </div>
                    )}
                    {data.accountNumber && (
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="font-bold text-foreground">Account Number:</span>
                        <span className="font-extrabold text-foreground font-mono">{data.accountNumber}</span>
                      </div>
                    )}
                    {data.ifscCode && (
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="font-bold text-foreground">IFSC Code:</span>
                        <span className="font-extrabold text-foreground font-mono">{data.ifscCode}</span>
                      </div>
                    )}
                    {data.bankName && (
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="font-bold text-foreground">Bank Name:</span>
                        <span className="font-extrabold text-foreground">{data.bankName}</span>
                      </div>
                    )}
                    {data.branchName && (
                      <div className="flex justify-between pb-1">
                        <span className="font-bold text-foreground">Branch & Address:</span>
                        <span className="font-semibold text-foreground text-right">{data.branchName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground text-center pt-2 border-t border-border">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>{language === 'gu' ? '૧૦૦% સુરક્ષિત સહયોગ • સ્વતંત્ર મીડિયા' : language === 'hi' ? '100% सुरक्षित सहयोग • स्वतंत्र मीडिया' : '100% Secure Support • Independent Journalism'}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
