'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Calendar, ShieldCheck, FileText, AlertTriangle, ArrowLeft } from 'lucide-react';

export interface LegalSection {
  id?: string;
  title: string;
  content: string;
}

export interface LegalPageData {
  id: string;
  slug: string;
  pageTitle: string;
  lastUpdated?: string;
  introText?: string;
  sections?: LegalSection[];
  contentHtml?: string;
}

interface Props {
  initialData: LegalPageData | null;
  defaultTitle?: string;
}

/**
 * Parses bold markdown (**bold**) and bullet lists (• or -) into rich, accessible elements.
 */
export function FormattedLegalText({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const cleanLine = isBullet ? trimmed.replace(/^[•\-\*]\s*/, '') : trimmed;

        // Split by **bold** text segments
        const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);

        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return (
              <strong key={pIdx} className="font-bold text-gray-900 dark:text-white">
                {boldText}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2 sm:pl-4 my-1">
              <span className="text-red-600 dark:text-red-400 font-bold select-none text-base leading-tight mt-0.5">
                •
              </span>
              <div className="flex-1 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300">
                {renderedLine}
              </div>
            </div>
          );
        }

        return (
          <p key={idx} className="text-sm sm:text-base leading-relaxed">
            {renderedLine}
          </p>
        );
      })}
    </div>
  );
}

export default function LegalPageClient({ initialData, defaultTitle = 'Legal Policy' }: Props) {
  const data = initialData || {
    id: '',
    slug: '',
    pageTitle: defaultTitle,
    lastUpdated: '',
    introText: '',
    sections: [],
  };

  const pageTitle = data.pageTitle || defaultTitle;
  const sections = data.sections || [];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* ── Breadcrumb Navigation ── */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Link href="/" className="hover:text-red-600 transition">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-900 dark:text-gray-200 font-semibold">{pageTitle}</span>
        </div>
      </div>

      {/* ── Main Document Container (Sandesh-style clean reading experience) ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <article className="space-y-8 sm:space-y-10">
          {/* Header Section */}
          <header className="border-b border-gray-200 dark:border-gray-800 pb-6 sm:pb-8">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              {pageTitle}
            </h1>

            {data.lastUpdated && (
              <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span>{data.lastUpdated}</span>
              </div>
            )}
          </header>

          {/* Introductory Overview */}
          {data.introText && (
            <div className="prose prose-neutral dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
              <FormattedLegalText text={data.introText} />
            </div>
          )}

          {/* ── Point-by-Point Sections with Dedicated Spacing Between Points ── */}
          {sections.length > 0 && (
            <div className="space-y-8 sm:space-y-10 pt-2">
              {sections.map((section, index) => (
                <section
                  key={section.id || `section-${index}`}
                  className="space-y-3 pt-2 first:pt-0"
                >
                  <h2 className="text-base sm:text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-baseline gap-2">
                    <span>{section.title}</span>
                  </h2>

                  <div className="pl-0 sm:pl-1">
                    <FormattedLegalText text={section.content} />
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Bottom Back Button & Note */}
          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>

            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              © {new Date().getFullYear()} Gujarat Post. All rights reserved.
            </span>
          </div>
        </article>
      </main>
    </div>
  );
}
