'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, RefreshCw, Eye, Zap } from 'lucide-react';
import { getPublicAstrology } from '@/lib/api';
import { ZodiacIcon, GUJARAT_ZODIAC_LETTERS } from '@/components/ui/ZodiacIcon';
import ZodiacDetailModal from '@/components/sections/ZodiacDetailModal';

export default function AdminAstrologyPage() {
  const [signs, setSigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZodiac, setSelectedZodiac] = useState<any | null>(null);

  const loadSigns = async () => {
    setLoading(true);
    try {
      const res = await getPublicAstrology();
      setSigns(res || []);
    } catch (err: any) {
      console.error('Failed to load astrology signs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSigns();
  }, []);

  const todayFormatted = new Date().toLocaleDateString('gu-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header Info Banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm uppercase tracking-wider">
              <Zap className="h-4 w-4" />
              100% Automated Public API (સ્વચાલિત પબ્લિક ફીડ)
            </div>
            <h1 className="text-2xl font-black text-foreground">
              Daily Rashifal & Astrology (આજનું રાશિફળ)
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              આ ડેટા દરરોજ રાત્રે 00:00 વાગ્યે પબ્લિક એલ્ગોરિધમિક વૈદિક એન્જિન દ્વારા આપમેળે અપડેટ થાય છે. એડમિન દ્વારા કોઈ મેન્યુઅલ કામની જરૂર નથી.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadSigns}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              રીફ્રેશ લાઈવ ફીડ
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-emerald-500/20 flex flex-wrap items-center gap-6 text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>સ્થિતિ: <strong className="text-foreground">સક્રિય (Live Active)</strong></span>
          </div>
          <div>
            <span>તારીખ: <strong className="text-foreground">{todayFormatted}</strong></span>
          </div>
          <div>
            <span>કુલ રાશિઓ: <strong className="text-foreground">12/12 Live</strong></span>
          </div>
        </div>
      </div>

      {/* Signs Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {signs.map((sign) => (
          <div
            key={sign.id || sign.slug}
            className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-accent transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-400 dark:border-amber-800/40 p-2">
                    <ZodiacIcon id={sign.id || sign.slug} className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">
                      {sign.nameGu} ({sign.name})
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {sign.lettersGu || GUJARAT_ZODIAC_LETTERS[sign.id] || ''}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-black text-amber-600 dark:text-amber-400">
                    શુભ અંક: {sign.luckyNumber || 9}
                  </span>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                    {sign.luckyColorGu || 'લાલ'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-foreground/90 leading-relaxed line-clamp-3 font-medium">
                {sign.predictionGu || sign.prediction}
              </p>
            </div>

            <button
              onClick={() => setSelectedZodiac(sign)}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-muted/70 hover:bg-muted py-2 text-xs font-bold text-foreground transition cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              યુઝર વ્યૂ જુઓ
            </button>
          </div>
        ))}
      </div>

      {selectedZodiac && (
        <ZodiacDetailModal
          sign={selectedZodiac}
          onClose={() => setSelectedZodiac(null)}
          language="gu"
        />
      )}
    </div>
  );
}
