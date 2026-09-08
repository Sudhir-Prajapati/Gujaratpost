'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Cake,
  Loader2,
  Check,
  RefreshCw,
  Sparkles,
  Star,
  Flower2,
} from 'lucide-react';

type TemplateType = 'birthday' | 'shradhanjali';

interface GreetingData {
  type: TemplateType;
  name: string;
  nameEn: string;
  info: string;
  message: string;
  photo: string;
  publisherName: string;
  publisherLogo: string;
  date: string;
}

const DEFAULT_LOGO = '/assets/gujarat-post-logo-chip.png';

const DEFAULT_DATA: Record<TemplateType, GreetingData> = {
  birthday: {
    type: 'birthday',
    name: 'નામ લખો',
    nameEn: '',
    info: 'હોદ્દો / વ્યવસાય',
    message: 'જન્મ દિવસની ખૂબ ખૂબ શુભકામનાઓ\nWishing you a very Happy Birthday!',
    photo: '',
    publisherName: 'Gujarat Post',
    publisherLogo: DEFAULT_LOGO,
    date: new Date().toLocaleDateString('gu-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
  },
  shradhanjali: {
    type: 'shradhanjali',
    name: 'નામ લખો',
    nameEn: '',
    info: 'હોદ્દો / ગ્રામ / નિવૃત્તિ',
    message: 'ઈશ્વર આત્માને શાંતિ આપે.\nOm Shanti',
    photo: '',
    publisherName: 'Gujarat Post',
    publisherLogo: DEFAULT_LOGO,
    date: new Date().toLocaleDateString('gu-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
  },
};

const BirthdayCanvas: React.FC<{ data: GreetingData }> = ({ data }) => (
  <div
    id="greeting-canvas"
    style={{
      width: 600, height: 800, position: 'relative', overflow: 'hidden',
      fontFamily: "'Noto Sans Gujarati', 'Noto Sans', sans-serif",
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fff7ed 40%, #fffbeb 100%)',
      flexShrink: 0,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(135deg, #ec4899 0%, #f97316 60%, #eab308 100%)', clipPath: 'ellipse(110% 100% at 50% 0%)' }} />
    {[...Array(18)].map((_, i) => (
      <div key={i} style={{ position: 'absolute', width: 6 + (i % 3) * 4, height: 6 + (i % 3) * 4, borderRadius: '50%', background: ['#fbbf24', '#f472b6', '#818cf8', '#34d399'][i % 4], opacity: 0.45, top: `${8 + (i * 13) % 88}%`, left: `${3 + (i * 17) % 94}%` }} />
    ))}
    <div style={{ position: 'absolute', top: 14, left: 0, right: 0, textAlign: 'center', fontSize: 42, lineHeight: '1' }}>🎂 🎉 🎈</div>
    <div style={{ position: 'absolute', top: 110, left: '50%', transform: 'translateX(-50%)', width: 170, height: 170, borderRadius: '50%', border: '6px solid #fff', boxShadow: '0 0 0 5px #f97316, 0 10px 40px rgba(249,115,22,0.35)', overflow: 'hidden', background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {data.photo ? <img src={data.photo} alt="p" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 70 }}>👤</span>}
    </div>
    <div style={{ position: 'absolute', top: 302, left: 20, right: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#be185d', lineHeight: 1.2 }}>{data.name}</div>
      {data.nameEn && <div style={{ fontSize: 18, fontWeight: 700, color: '#9d174d', marginTop: 3 }}>{data.nameEn}</div>}
    </div>
    <div style={{ position: 'absolute', top: 378, left: 30, right: 30, textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(90deg,#f97316,#ec4899)', borderRadius: 40, padding: '6px 22px', display: 'inline-block', fontSize: 14, fontWeight: 700, color: '#fff', boxShadow: '0 3px 14px rgba(249,115,22,0.30)' }}>{data.info}</div>
    </div>
    <div style={{ position: 'absolute', top: 432, left: 30, right: 30, background: 'rgba(255,255,255,0.85)', borderRadius: 18, padding: '18px 22px', border: '2px solid rgba(249,115,22,0.25)', boxShadow: '0 4px 24px rgba(236,72,153,0.10)' }}>
      <div style={{ fontSize: 15, color: '#7c3aed', fontWeight: 700, lineHeight: 1.7, whiteSpace: 'pre-line', textAlign: 'center' }}>{data.message}</div>
    </div>
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, background: 'linear-gradient(90deg,#be185d 0%,#f97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={data.publisherLogo} alt="logo" style={{ height: 36, objectFit: 'contain', filter: 'brightness(10)' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>{data.publisherName}</span>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{data.date}</span>
    </div>
  </div>
);

const ShradhanjaliCanvas: React.FC<{ data: GreetingData }> = ({ data }) => (
  <div
    id="greeting-canvas"
    style={{
      width: 600, height: 800, position: 'relative', overflow: 'hidden',
      fontFamily: "'Noto Sans Gujarati', 'Noto Sans', sans-serif",
      background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 50%, #e8f5e9 100%)',
      flexShrink: 0,
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 155, background: 'linear-gradient(135deg, #1e293b 0%, #334155 60%, #475569 100%)', clipPath: 'ellipse(110% 100% at 50% 0%)' }} />
    <div style={{ position: 'absolute', top: 16, left: 0, right: 0, textAlign: 'center', fontSize: 36, lineHeight: '1' }}>🙏</div>
    <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: 3 }}>— શ્રદ્ધાંજલિ —</div>
    <div style={{ position: 'absolute', top: 105, left: '50%', transform: 'translateX(-50%)', width: 170, height: 170, borderRadius: '50%', border: '6px solid #fff', boxShadow: '0 0 0 4px #64748b, 0 10px 40px rgba(30,41,59,0.30)', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'grayscale(35%)' }}>
      {data.photo ? <img src={data.photo} alt="p" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 70 }}>👤</span>}
    </div>
    <div style={{ position: 'absolute', top: 298, left: 0, right: 0, textAlign: 'center', fontSize: 22, letterSpacing: 6 }}>🌸 🌼 🌸</div>
    <div style={{ position: 'absolute', top: 338, left: 20, right: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#1e293b', lineHeight: 1.2 }}>{data.name}</div>
      {data.nameEn && <div style={{ fontSize: 18, fontWeight: 600, color: '#475569', marginTop: 3 }}>{data.nameEn}</div>}
    </div>
    <div style={{ position: 'absolute', top: 410, left: 30, right: 30, textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(90deg,#334155,#64748b)', borderRadius: 40, padding: '6px 22px', display: 'inline-block', fontSize: 13, fontWeight: 700, color: '#fff', boxShadow: '0 3px 12px rgba(30,41,59,0.22)' }}>{data.info}</div>
    </div>
    <div style={{ position: 'absolute', top: 462, left: 30, right: 30, background: 'rgba(255,255,255,0.90)', borderRadius: 18, padding: '18px 22px', border: '2px solid rgba(100,116,139,0.20)', boxShadow: '0 4px 24px rgba(30,41,59,0.09)' }}>
      <div style={{ fontSize: 15, color: '#334155', fontWeight: 600, lineHeight: 1.8, whiteSpace: 'pre-line', textAlign: 'center', fontStyle: 'italic' }}>{data.message}</div>
    </div>
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, background: 'linear-gradient(90deg,#1e293b 0%,#334155 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={data.publisherLogo} alt="logo" style={{ height: 36, objectFit: 'contain', filter: 'brightness(10)' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>{data.publisherName}</span>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{data.date}</span>
    </div>
  </div>
);

interface GreetingTemplateBuilderProps {
  onClose: () => void;
}

export const GreetingTemplateBuilder: React.FC<GreetingTemplateBuilderProps> = ({ onClose }) => {
  const [activeType, setActiveType] = useState<TemplateType>('birthday');
  const [data, setData] = useState<GreetingData>(DEFAULT_DATA['birthday']);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const switchType = (type: TemplateType) => {
    setActiveType(type);
    setData({ ...DEFAULT_DATA[type] });
    setDownloaded(false);
  };

  const update = (field: keyof GreetingData, val: string) => setData((prev) => ({ ...prev, [field]: val }));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update('photo', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const el = document.getElementById('greeting-canvas');
      if (!el) return;
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null, logging: false });
      const link = document.createElement('a');
      link.download = `Gujarat-Post-${activeType === 'birthday' ? 'Birthday' : 'Shradhanjali'}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Download failed:', err);
      alert('ડાઉનલોડ failed. Please right-click on the template preview and Save As Image.');
    } finally {
      setDownloading(false);
    }
  };

  const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 outline-none placeholder:text-slate-500';
  const labelCls = 'block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-amber-500 flex items-center justify-center shadow-lg shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">રેડી ટેમ્પ્લેટ (Ready Templates)</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Birthday • શ્રદ્ધાંજલિ — ફોટો, નામ, માહિતી ભરો અને PNG ડાઉનલોડ કરો</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template type tabs */}
        <div className="flex gap-2 px-5 py-3 border-b border-slate-800 shrink-0">
          <button
            onClick={() => switchType('birthday')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${activeType === 'birthday' ? 'bg-gradient-to-r from-pink-600 to-orange-500 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
          >
            <Cake className="w-4 h-4" /> 🎂 જન્મ દિવસ (Birthday)
          </button>
          <button
            onClick={() => switchType('shradhanjali')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${activeType === 'shradhanjali' ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
          >
            <Flower2 className="w-4 h-4" /> 🙏 શ્રદ્ધાંજલિ (Shradhanjali)
          </button>
        </div>

        {/* Main 2-col layout */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT: Editor */}
          <div className="w-72 shrink-0 border-r border-slate-800 overflow-y-auto p-4 space-y-4">

            {/* Photo */}
            <div>
              <label className={labelCls}>📷 ફોટો (Photo)</label>
              <div
                onClick={() => photoInputRef.current?.click()}
                className="w-full h-40 rounded-2xl overflow-hidden border-2 border-dashed border-slate-700 cursor-pointer hover:border-amber-500 transition group bg-slate-900 flex items-center justify-center relative"
              >
                {data.photo
                  ? <img src={data.photo} alt="preview" className="w-full h-full object-cover" />
                  : <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-amber-400 transition">
                      <Upload className="w-7 h-7" />
                      <span className="text-xs font-bold">ફોટો અપલોડ કરો</span>
                      <span className="text-[10px] text-slate-600">JPG / PNG</span>
                    </div>}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition" />
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              {data.photo && (
                <button onClick={() => update('photo', '')} className="mt-1.5 w-full text-xs text-red-400 hover:text-red-300 font-bold py-1 rounded-lg hover:bg-red-950/30 transition cursor-pointer">
                  ✕ ફોટો દૂર કરો
                </button>
              )}
            </div>

            {/* Name Gujarati */}
            <div>
              <label className={labelCls}>👤 નામ (Gujarati)</label>
              <input className={inputCls} placeholder="ગુજરાતી / English નામ..." value={data.name} onChange={(e) => update('name', e.target.value)} />
            </div>

            {/* Name English */}
            <div>
              <label className={labelCls}>🔤 English Name (optional)</label>
              <input className={inputCls} placeholder="English name..." value={data.nameEn} onChange={(e) => update('nameEn', e.target.value)} />
            </div>

            {/* Info */}
            <div>
              <label className={labelCls}>{activeType === 'birthday' ? '🏷️ હોદ્દો / વ્યવસાય' : '🏷️ ઉ.વ. / ગ્રામ / હોદ્દો'}</label>
              <input className={inputCls} placeholder={activeType === 'birthday' ? 'e.g. ડૉ., નગર પ્રમુખ...' : 'e.g. ઉ.વ. ૭૫, ગ્રા. ભાવનગર...'} value={data.info} onChange={(e) => update('info', e.target.value)} />
            </div>

            {/* Message */}
            <div>
              <label className={labelCls}>{activeType === 'birthday' ? '🎉 શુભ સંદેશ' : '🙏 શ્રદ્ધાંજલિ સંદેશ'}</label>
              <textarea className={`${inputCls} resize-none h-24`} placeholder="સંદેશ..." value={data.message} onChange={(e) => update('message', e.target.value)} />
            </div>

            {/* Publisher */}
            <div>
              <label className={labelCls}>🗞️ પ્રકાશક નામ</label>
              <input className={inputCls} placeholder="Gujarat Post" value={data.publisherName} onChange={(e) => update('publisherName', e.target.value)} />
            </div>

            {/* Date */}
            <div>
              <label className={labelCls}>📅 તારીખ</label>
              <input className={inputCls} placeholder="e.g. ૮ સપ્ટેમ્બર ૨૦૨૬" value={data.date} onChange={(e) => update('date', e.target.value)} />
            </div>

            {/* Reset */}
            <button onClick={() => { setData(DEFAULT_DATA[activeType]); setDownloaded(false); }} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl border border-slate-800 transition cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Reset / ડિફૉલ્ટ
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition cursor-pointer shadow-lg disabled:opacity-50 ${activeType === 'birthday' ? 'bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 text-white' : 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white'}`}
            >
              {downloading ? <><Loader2 className="w-4 h-4 animate-spin" /> ડાઉનલોડ...</>
               : downloaded ? <><Check className="w-4 h-4" /> ✅ ડાઉનલોડ થઈ ગયો!</>
               : <><Download className="w-4 h-4" /> PNG ડાઉનલોડ કરો</>}
            </button>
          </div>

          {/* RIGHT: Preview */}
          <div className="flex-1 overflow-auto bg-slate-900/40 flex items-start justify-center p-6 pt-8">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <Star className="w-3 h-3 text-amber-400" /> લાઈવ પ્રીવ્યૂ (Live Preview) <Star className="w-3 h-3 text-amber-400" />
              </div>
              <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', marginBottom: -225 }}>
                {activeType === 'birthday' ? <BirthdayCanvas data={data} /> : <ShradhanjaliCanvas data={data} />}
              </div>
              <p className="text-[10px] text-slate-500 text-center">
                Preview at 72% scale. Downloaded PNG is full 600×800px high quality.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
