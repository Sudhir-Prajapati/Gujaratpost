'use client';

import { useState } from 'react';
import { ArrowUpRight, Bell, CalendarClock, Radio, Tv } from 'lucide-react';
import { getLocalized } from '@/data';
import { useApp } from '@/components/AppProvider';
import { SocialIcon } from '@/components/ui/SocialLinks';

const CHANNEL_URL = 'https://www.youtube.com/@Gujaratpostnews';
const CHANNEL_ID = 'UCqQ8YbFSZ4j8J4iVJOHurTw';
const LATEST_VIDEO_ID = 'A_5vL-ngK4M';

const schedule = [
  ['07:00 AM', 'Morning News Bulletin', 'સવારનું ન્યૂઝ બુલેટિન', 'सुबह का न्यूज़ बुलेटिन'],
  ['09:00 AM', 'Gujarat Today', 'ગુજરાત આજ', 'गुजरात आज'],
  ['12:00 PM', 'Afternoon Headlines', 'બપોરના મુખ્ય સમાચાર', 'दोपहर की मुख्य खबरें'],
  ['06:00 PM', 'Prime Time', 'પ્રાઇમ ટાઇમ', 'प्राइम टाइम'],
  ['08:00 PM', 'The Big Debate', 'મહાચર્ચા', 'बड़ी बहस'],
];

export default function LiveTVSection() {
  const { language } = useApp();
  const [mode, setMode] = useState<'latest' | 'live'>('latest');
  const embedUrl = mode === 'live'
    ? `https://www.youtube.com/embed/live_stream?channel=${CHANNEL_ID}&autoplay=1&mute=1&rel=0`
    : `https://www.youtube.com/embed/${LATEST_VIDEO_ID}?rel=0&modestbranding=1`;

  return (
    <section className="relative overflow-hidden bg-[#070d18] py-10 text-white md:py-14">
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-screen-xl px-4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
              <span className="live-badge h-2 w-2 rounded-full bg-red-500" /> Gujarat Post Broadcast
            </div>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              {getLocalized(language, { en: 'Watch Gujarat Post', gu: 'ગુજરાત પોસ્ટ જુઓ', hi: 'गुजरात पोस्ट देखें' })}
            </h2>
            <p className="mt-2 max-w-xl text-sm font-medium text-white/48">
              {getLocalized(language, {
                en: 'Live coverage, breaking reports and the latest video stories from across Gujarat.',
                gu: 'સમગ્ર ગુજરાતમાંથી લાઇવ કવરેજ, બ્રેકિંગ રિપોર્ટ્સ અને તાજા વીડિયો સમાચાર.',
                hi: 'पूरे गुजरात से लाइव कवरेज, ब्रेकिंग रिपोर्ट और नवीनतम वीडियो समाचार।',
              })}
            </p>
          </div>
          <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="group inline-flex h-11 items-center justify-center gap-2 self-start rounded-full bg-[#ff0000] px-5 text-sm font-black shadow-lg shadow-red-950/40 transition hover:-translate-y-0.5 hover:bg-red-600 sm:self-auto">
            <SocialIcon platform="youtube" className="h-5 w-5" /> Visit channel <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/30">
          <div className="grid lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-8">
              <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3">
                <div className="flex rounded-full bg-white/[0.07] p-1">
                  <button type="button" onClick={() => setMode('latest')} className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${mode === 'latest' ? 'bg-white text-slate-950 shadow' : 'text-white/55 hover:text-white'}`}>
                    Latest broadcast
                  </button>
                  <button type="button" onClick={() => setMode('live')} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition ${mode === 'live' ? 'bg-accent text-white shadow' : 'text-white/55 hover:text-white'}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Live channel
                  </button>
                </div>
                <span className="hidden text-[10px] font-bold text-white/35 sm:block">Official Gujarat Post YouTube</span>
              </div>

              <div className="relative aspect-video overflow-hidden bg-black">
                <iframe
                  key={mode}
                  className="absolute inset-0 h-full w-full"
                  src={embedUrl}
                  title={mode === 'live' ? 'Gujarat Post live stream' : 'Latest Gujarat Post broadcast'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 bg-black/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-xs font-black">GP</span>
                  <div><p className="text-sm font-black">Gujarat Post</p><p className="text-[10px] font-semibold text-white/40">Real stories. Real Gujarat.</p></div>
                </div>
                <a href={`${CHANNEL_URL}?sub_confirmation=1`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black transition hover:bg-white hover:text-slate-950">
                  <Bell className="h-3.5 w-3.5" /> Subscribe on YouTube
                </a>
              </div>
            </div>

            <aside className="flex flex-col border-t border-white/10 lg:col-span-4 lg:border-l lg:border-t-0">
              <div className="border-b border-white/10 px-5 py-5">
                <div className="flex items-center justify-between">
                  <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-400">Today on GP</p><h3 className="mt-1 text-xl font-black">Broadcast schedule</h3></div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.07] text-red-400"><CalendarClock className="h-5 w-5" /></span>
                </div>
              </div>

              <div className="flex-1 px-5 py-2">
                {schedule.map(([time, en, gu, hi], index) => (
                  <div key={time} className="group relative flex gap-4 border-b border-white/[0.07] py-4 last:border-0">
                    <div className="relative flex w-3 shrink-0 justify-center">
                      <span className={`relative z-10 mt-1.5 h-2 w-2 rounded-full ${index === 0 ? 'bg-red-500 ring-4 ring-red-500/15' : 'bg-white/20 group-hover:bg-white/50'}`} />
                      {index < schedule.length - 1 && <span className="absolute bottom-[-1rem] top-3 w-px bg-white/10" />}
                    </div>
                    <div className="min-w-0 flex-1"><p className="font-mono text-[10px] font-bold text-red-300">{time}</p><p className="mt-1 truncate text-sm font-black text-white/78 transition group-hover:text-white">{getLocalized(language, { en, gu, hi })}</p></div>
                    {index === 0 && <span className="self-center rounded-full bg-white/[0.07] px-2 py-1 text-[8px] font-black uppercase text-white/45">Morning</span>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4">
                <div className="rounded-xl bg-white/[0.055] p-3"><Radio className="mb-2 h-4 w-4 text-red-400" /><p className="text-xs font-black">Live updates</p><p className="mt-0.5 text-[9px] text-white/35">Breaking coverage</p></div>
                <div className="rounded-xl bg-white/[0.055] p-3"><Tv className="mb-2 h-4 w-4 text-red-400" /><p className="text-xs font-black">Video first</p><p className="mt-0.5 text-[9px] text-white/35">Reports & explainers</p></div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
