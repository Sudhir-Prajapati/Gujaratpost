'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Users,
  Award,
  Target,
  Eye,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { SocialLinks } from '@/components/ui/SocialLinks';

interface AboutPageClientProps {
  initialData: any;
}

export default function AboutPageClient({ initialData }: AboutPageClientProps) {
  const data = initialData || {};

  // Directly display information from admin without requiring language selection
  const title =
    data.title || data.titleGu || data.titleEn || data.titleHi || 'ગુજરાત પોસ્ટ વિશે';
  const subtitle =
    data.subtitle ||
    data.subtitleGu ||
    data.subtitleEn ||
    data.subtitleHi ||
    'સત્ય, સચોટતા અને વિશ્વસનીય પત્રકારત્વનું અગ્રણી ડિજિટલ માધ્યમ';
  const description =
    data.description ||
    data.descriptionGu ||
    data.descriptionEn ||
    data.descriptionHi ||
    'ગુજરાત પોસ્ટ એ ગુજરાત અને દેશ-વિદેશના તાજા, મહત્વપૂર્ણ અને ગ્રાઉન્ડ લેવલના સમાચારો લોકો સુધી નિષ્પક્ષ રીતે પહોંચાડતું ડિજિટલ ન્યૂઝ પ્લેટફોર્મ છે. રાજનીતિ, અર્થતંત્ર, ગુનાખોરી, રમતગમત, શિક્ષણ, ટેકનોલોજી અને મનોરંજન સહિતના દરેક ક્ષેત્રના વિશ્વસનીય સમાચારો અમારા વાચકો સુધી ક્ષણ-પ્રતિક્ષણ પહોંચાડવા માટે અમારી અનુભવી પત્રકારોની ટીમ સતત કાર્યરત છે.';

  const mission =
    data.mission ||
    data.missionGu ||
    data.missionEn ||
    data.missionHi ||
    'અમારો સંકલ્પ છે કે દરેક નાગરિક સુધી સાચા, નિષ્પક્ષ અને સચોટ સમાચાર સમયસર પહોંચે, જેથી સમાજમાં જાગૃતિ અને લોકશાહી મૂલ્યો સુદ્રઢ બને.';

  const vision =
    data.vision ||
    data.visionGu ||
    data.visionEn ||
    data.visionHi ||
    'ગુજરાત અને ભારતના સૌથી વધુ વિશ્વાસપાત્ર, આધુનિક અને જનહિતલક્ષી ડિજિટલ ન્યૂઝ નેટવર્ક તરીકે અગ્રેસર રહેવું.';

  const stats =
    Array.isArray(data.statsJson) && data.statsJson.length > 0
      ? data.statsJson
      : [
          { value: '10M+', label: 'માસિક વાચકો' },
          { value: '33', label: 'જિલ્લા કવરેજ' },
          { value: '50K+', label: 'પ્રકાશિત સમાચારો' },
        ];

  const values =
    Array.isArray(data.valuesJson) && data.valuesJson.length > 0
      ? data.valuesJson
      : [
          {
            icon: 'ShieldCheck',
            title: 'સત્ય અને પારદર્શિતા',
            desc: 'તથ્યોની પૂરતી ચકાસણી પછી જ સમાચાર પ્રસારિત કરવા એ અમારો મૂળભૂત સિદ્ધાંત છે.',
          },
          {
            icon: 'Zap',
            title: 'ઝડપ અને સચોટતા',
            desc: 'સમાચાર સૌથી પહેલા અને સંપૂર્ણ સાચા પહોંચાડવા માટે અદ્યતન ટેકનોલોજીનો ઉપયોગ.',
          },
          {
            icon: 'Users',
            title: 'જનસામાન્યનો અવાજ',
            desc: 'સામાન્ય નાગરિકોના પાયાના પ્રશ્નો અને સમસ્યાઓને મોખરે લાવી શાસન સુધી પહોંચાડવું.',
          },
          {
            icon: 'Award',
            title: 'પક્ષપાતરહિત પત્રકારત્વ',
            desc: 'કોઈપણ રાજકીય કે આર્થિક દબાણ વગર સંપૂર્ણ સ્વતંત્ર અને સંતુલિત અહેવાલો.',
          },
        ];

  const team = Array.isArray(data.teamJson) && data.teamJson.length > 0 ? data.teamJson : [];

  const getValueIcon = (name?: string) => {
    switch (name) {
      case 'Zap':
        return <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />;
      case 'Users':
        return <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />;
      case 'Award':
        return <Award className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />;
      default:
        return <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />;
    }
  };

  const rulesTitle = data.rulesTitle || 'અમારા અડગ નિયમો';
  const defaultRules = [
    '૧૦૦% તથ્ય ચકાસણી (Fact Checked)',
    'કોઈપણ ફેક ન્યૂઝ સામે શૂન્ય સહિષ્ણુતા',
    'ગ્રાઉન્ડ રિયાલિટી રિપોર્ટિંગ',
    'વાચકોની પ્રાઈવસીનું સંપૂર્ણ સન્માન',
  ];
  const rules =
    Array.isArray(data.rulesJson) && data.rulesJson.length > 0
      ? data.rulesJson.slice(0, 4)
      : defaultRules;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0A] text-neutral-900 dark:text-neutral-100 pb-16 sm:pb-14">
      {/* 1. Cohesive Hero & Key Stats Section (Seamless integration without harsh dividing border) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-950/15 via-[#F8F9FA]/80 dark:via-[#0A0A0A]/80 to-[#F8F9FA] dark:to-[#0A0A0A] -mt-3 sm:-mt-4 pt-3 sm:pt-4 pb-6 sm:pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(#b3121b_1px,transparent_1px)] [background-size:20px_20px] sm:[background-size:24px_24px] opacity-[0.05] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 relative z-10">
          {/* Header intro */}
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-600 dark:text-red-400 text-[11px] sm:text-xs font-black tracking-wide uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
              </span>
              <span>સત્તાવાર પરિચય</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-snug">
              {title}
            </h1>

            <p className="text-xs sm:text-base md:text-lg text-neutral-700 dark:text-neutral-300 font-bold max-w-2xl leading-relaxed px-1 sm:px-0">
              {subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5 sm:pt-1">
              <Link
                href="/epaper"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md shadow-red-600/20 transition active:scale-95"
              >
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>ઈ-પેપર વાંચો</span>
              </Link>
              <Link
                href="/videos"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-300 dark:border-neutral-700 hover:border-red-600 text-neutral-800 dark:text-neutral-200 font-black text-xs transition active:scale-95"
              >
                <span>વીડિયો બુલેટિન</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Hero Banner Image */}
          {data.bannerImage && (
            <div className="mt-4 sm:mt-6 relative w-full h-[180px] sm:h-[300px] md:h-[400px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-neutral-200/80 dark:border-neutral-800">
              <Image
                src={data.bannerImage}
                alt={title}
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 right-3 sm:right-6 flex items-center justify-between text-white">
                <span className="font-black text-xs sm:text-base drop-shadow-md truncate pr-2">
                  Gujarat Post • Truth. Speed. Integrity.
                </span>
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-black/50 backdrop-blur-md border border-white/20 shrink-0">
                  ESTD 2017
                </span>
              </div>
            </div>
          )}

          {/* Key Metrics & Stats - Seamlessly connected right under the banner image */}
          <div className="mt-4 sm:mt-6 flex flex-wrap justify-center items-stretch gap-2.5 sm:gap-4">
            {stats.map((stat: any, idx: number) => {
              const statLabel = stat.label || stat.labelGu || stat.labelEn || stat.labelHi || 'Metric';
              const isThreeBoxes = stats.length === 3;
              const isLastOfThree = isThreeBoxes && idx === 2;

              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-300 text-center ${
                    isThreeBoxes
                      ? isLastOfThree
                        ? 'w-[calc(50%-5px)] sm:w-auto sm:flex-1 sm:max-w-[260px]'
                        : 'w-[calc(50%-5px)] sm:w-auto sm:flex-1 sm:max-w-[260px]'
                      : stats.length === 2
                        ? 'w-[calc(50%-5px)] sm:w-auto sm:flex-1 sm:max-w-[300px]'
                        : stats.length === 1
                          ? 'w-full max-w-[280px]'
                          : 'w-[calc(50%-5px)] sm:w-auto sm:flex-1 sm:min-w-[150px] sm:max-w-[250px]'
                  }`}
                >
                  <span className="text-xl sm:text-3xl md:text-4xl font-black text-red-600 dark:text-red-500 tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-[11px] sm:text-xs md:text-sm font-bold text-neutral-600 dark:text-neutral-400 text-center mt-0.5 sm:mt-1 leading-tight">
                    {statLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Detailed Story & Mission / Vision (Flows naturally without harsh dividing lines) */}
      <section className="py-4 sm:py-6 max-w-6xl mx-auto px-3.5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7 items-start">
          {/* Left Column: Story */}
          <div className="lg:col-span-8 space-y-3.5 sm:space-y-5 bg-white dark:bg-zinc-900 p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 sm:h-6 rounded-full bg-red-600 shrink-0" />
              <h2 className="text-lg sm:text-2xl font-black text-neutral-900 dark:text-white">
                અમારી પત્રકારત્વ યાત્રા
              </h2>
            </div>

            <div className="prose prose-neutral dark:prose-invert max-w-none text-xs sm:text-sm md:text-base leading-relaxed space-y-2.5 sm:space-y-3.5 text-neutral-700 dark:text-neutral-300 font-medium whitespace-pre-line">
              {description}
            </div>

            {/* Editorial Commitments Checklist (Dynamic from Admin, Max 4) */}
            {rules.length > 0 && (
              <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 space-y-2">
                <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                  {rulesTitle}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {rules.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Mission & Vision Cards */}
          <div className="lg:col-span-4 space-y-3 sm:space-y-4">
            {/* Mission Card */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-600/15 space-y-2 sm:space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  અમારું ધ્યેય (Mission)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-red-50 leading-relaxed font-medium">
                {mission}
              </p>
            </div>

            {/* Vision Card */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-2 sm:space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <Eye className="h-4 w-4" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white tracking-tight">
                  અમારો દ્રષ્ટિકોણ (Vision)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
                {vision}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Values & Principles (Clean unified presentation) */}
      <section className="py-5 sm:py-7 max-w-6xl mx-auto px-3.5 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-1 mb-5 sm:mb-7">
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-red-600">
            અમારા સ્તંભો
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-neutral-900 dark:text-white">
            મૂલ્યો અને સિદ્ધાંતો
          </h2>
        </div>

        <div className="flex flex-wrap justify-center items-stretch gap-3 sm:gap-4">
          {values.map((val: any, idx: number) => {
            const valTitle = val.title || val.titleGu || val.titleEn || val.titleHi || 'Value';
            const valDesc = val.desc || val.descGu || val.descEn || val.descHi || '';
            const isThree = values.length === 3;

            return (
              <div
                key={idx}
                className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-red-600/40 hover:shadow-md transition duration-200 space-y-2 sm:space-y-2.5 text-left ${
                  isThree
                    ? 'w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] lg:max-w-[360px]'
                    : values.length === 2
                      ? 'w-full sm:w-[calc(50%-10px)] lg:max-w-[420px]'
                      : values.length === 1
                        ? 'w-full max-w-[480px]'
                        : 'w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-14px)] lg:min-w-[240px] lg:max-w-[280px]'
                }`}
              >
                <div className="p-2 w-fit rounded-xl bg-neutral-100 dark:bg-zinc-800 shadow-2xs border border-neutral-200/60 dark:border-neutral-700">
                  {getValueIcon(val.icon)}
                </div>
                <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white tracking-tight">
                  {valTitle}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
                  {valDesc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Editorial Leadership & Team */}
      {team.length > 0 && (
        <section className="py-5 sm:py-7 max-w-6xl mx-auto px-3.5 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-1 mb-5 sm:mb-7">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-red-600">
              સંપાદકીય નેતૃત્વ
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              અમારી મુખ્ય ટીમ
            </h2>
          </div>

          <div className="flex flex-wrap justify-center items-stretch gap-4 sm:gap-6">
            {team.map((member: any, idx: number) => {
              const memName = member.name || member.nameEn || 'Editor';
              const memRole = member.role || member.roleEn || 'Journalist';

              return (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:shadow-md hover:-translate-y-1 transition duration-300 flex flex-col items-center text-center space-y-2 sm:space-y-2.5 ${
                    team.length === 3
                      ? 'w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] lg:max-w-[340px]'
                      : team.length === 2
                        ? 'w-full sm:w-[calc(50%-12px)] lg:w-[320px]'
                        : team.length === 1
                          ? 'w-full max-w-[340px]'
                          : 'w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] lg:max-w-[340px]'
                  }`}
                >
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-2 border-red-600/30 bg-neutral-100 dark:bg-neutral-800 shadow-md">
                    {member.image ? (
                      <Image src={member.image} alt={memName} fill sizes="96px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-xl text-neutral-400">
                        {memName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">{memName}</h3>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-0.5">{memRole}</p>
                  </div>
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-600 transition"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>{member.email}</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Office, Contact & Connect Section */}
      <section className="py-5 sm:py-7 max-w-6xl mx-auto px-3.5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7 items-start">
          {/* Contact Details */}
          <div className="space-y-3.5 sm:space-y-4 bg-white dark:bg-zinc-900 p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-red-600">
                સંપર્ક કરો
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mt-0.5">
                મુખ્ય કાર્યાલય & સંપર્ક સૂત્ર
              </h2>
            </div>

            <div className="space-y-2.5 sm:space-y-3 pt-1">
              {data.contactAddress && (
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="p-2 rounded-xl bg-red-600/10 text-red-600 shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-xs font-black text-neutral-500 uppercase">
                      સરનામું
                    </h4>
                    <p className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5 leading-relaxed">
                      {data.contactAddress}
                    </p>
                  </div>
                </div>
              )}

              {data.contactEmail && (
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="p-2 rounded-xl bg-red-600/10 text-red-600 shrink-0 mt-0.5">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-xs font-black text-neutral-500 uppercase">Email</h4>
                    <a
                      href={`mailto:${data.contactEmail}`}
                      className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 hover:text-red-600 transition block mt-0.5"
                    >
                      {data.contactEmail}
                    </a>
                  </div>
                </div>
              )}

              {data.contactPhone && (
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="p-2 rounded-xl bg-red-600/10 text-red-600 shrink-0 mt-0.5">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-xs font-black text-neutral-500 uppercase">
                      ફોન નંબર
                    </h4>
                    <a
                      href={`tel:${data.contactPhone.replace(/\s+/g, '')}`}
                      className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 hover:text-red-600 transition block mt-0.5"
                    >
                      {data.contactPhone}
                    </a>
                  </div>
                </div>
              )}

              {data.whatsappNumber && (
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="p-2 rounded-xl bg-[#25D366]/10 text-[#25D366] shrink-0 mt-0.5">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-xs font-black text-neutral-500 uppercase">WhatsApp</h4>
                    <a
                      href="https://api.whatsapp.com/send/?phone=919909907237&text&type=phone_number&app_absent=0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#128C7E] dark:text-[#25D366] hover:underline mt-0.5"
                    >
                      <span>{data.whatsappNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                        Chat Now
                      </span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Network Card */}
          <div className="p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-2.5 sm:space-y-3.5">
            <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
              સોશિયલ મીડિયા પર જોડાઓ
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
              ફેસબુક, ઇન્સ્ટાગ્રામ, એક્સ, યૂટ્યૂબ અને વોટ્સએપ પર ગુજરાત પોસ્ટ સાથે જોડાઈને સૌથી ઝડપી અને વિશ્વસનીય સમાચારો સીધા મેળવો.
            </p>

            <div className="pt-1 sm:pt-2 flex justify-start">
              <SocialLinks size="lg" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
