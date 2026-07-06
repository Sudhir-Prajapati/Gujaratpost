'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Bookmark,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  Printer,
  Volume2,
} from 'lucide-react';
import { Article } from '@/types';
import {
  formatDate,
  formatTime,
  formatViews,
  getArticleContent,
  getArticleExcerpt,
  getArticleTitle,
  getCategoryLabel,
  getLocalized,
} from '@/data';
import { getCategoryColor } from '@/lib/utils';
import { useApp } from '@/components/AppProvider';
import NewsCard from '@/components/ui/NewsCard';
import Advertisement from '@/components/ads/Advertisement';

interface Props {
  article: Article;
  related: Article[];
  trending: Article[];
  articleUrl: string;
}

export default function NewsDetailClient({ article, related, trending, articleUrl }: Props) {
  const { language } = useApp();
  const [progress, setProgress] = useState(0);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const title = getArticleTitle(article, language);
  const excerpt = getArticleExcerpt(article, language);
  const body = getArticleContent(article, language);
  const category = getCategoryLabel(article, language);
  const authorName = getLocalized(language, { en: article.author.name, gu: article.author.nameGu, hi: article.author.nameHi });
  const authorDesignation = getLocalized(language, {
    en: article.author.designation,
    gu: article.author.designationGu,
    hi: article.author.designationHi,
  });
  const authorBio = getLocalized(language, { en: article.author.bio, gu: article.author.bioGu, hi: article.author.bioHi });
  const tags = language === 'en' ? article.tags : language === 'hi' ? article.tagsHi : article.tagsGu;
  const categoryColor = getCategoryColor(article.category);

  const paragraphs = useMemo(() => body.split(/\n\n+/), [body]);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(articleUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const toggleAudio = () => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(`${title}. ${excerpt}`);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN';
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const shareLinks = [
    { 
      label: 'Facebook', 
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
      icon: (className: string) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
      style: 'bg-[#1877f2]/8 text-[#1877f2] border border-[#1877f2]/10 hover:bg-[#1877f2]/15' 
    },
    { 
      label: 'WhatsApp', 
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${articleUrl}`)}`,
      icon: (className: string) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>,
      style: 'bg-[#25d366]/8 text-[#25d366] border border-[#25d366]/10 hover:bg-[#25d366]/15'
    },
    { 
      label: 'X', 
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(articleUrl)}`,
      icon: (className: string) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
      style: 'bg-black/[0.03] dark:bg-white/[0.03] text-foreground border border-foreground/10 hover:bg-black/[0.06] dark:hover:bg-white/[0.06]'
    },
    { 
      label: 'Telegram', 
      href: `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(title)}`,
      icon: (className: string) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.2z" /></svg>,
      style: 'bg-[#229ed9]/8 text-[#229ed9] border border-[#229ed9]/10 hover:bg-[#229ed9]/15'
    },
    { 
      label: 'Google News', 
      href: `https://news.google.com/search?q=Gujarat+Post`,
      icon: (className: string) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 10h-4v-2h4v2zm0-4h-4V6h4v2zm-5 8H5v-2h8v2zm5 0h-4v-2h4v2zM12 6H5v6h7V6z" /></svg>,
      style: 'bg-[#4285f4]/8 text-[#4285f4] border border-[#4285f4]/10 hover:bg-[#4285f4]/15'
    },
  ];

  return (
    <>
      <div className="reading-progress" style={{ width: `${progress}%` }} />
      <div className="mx-auto max-w-screen-xl px-4 py-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <article className="lg:col-span-2">
            <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-accent">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/category/${article.category.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-accent">{article.category}</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="line-clamp-1">{article.title}</span>
            </nav>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="cat-badge" style={{ background: categoryColor }}>{category}</span>
              {article.isBreaking && <span className="live-badge rounded bg-accent px-2 py-1 text-xs font-black text-white">BREAKING</span>}
            </div>

            <h1 className="mb-3 text-3xl font-black leading-tight text-foreground md:text-5xl">{title}</h1>
            <p className="mb-5 text-lg font-semibold leading-8 text-muted-foreground">{excerpt}</p>

            <div className="mb-5 flex flex-wrap items-center gap-4 border-y border-border py-4">
              <Image src={article.author.image} alt={article.author.name} width={44} height={44} className="rounded-full object-cover" />
              <div>
                <p className="text-sm font-black text-foreground">{authorName}</p>
                <p className="text-xs font-semibold text-muted-foreground">{authorDesignation}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="flex items-center gap-1"><Clock className="h-3 w-3" />Published: {formatDate(article.publishedAt)} {formatTime(article.publishedAt)}</p>
                <p>Updated: {formatDate(article.updatedAt)} {formatTime(article.updatedAt)}</p>
              </div>
              <div className="ml-auto flex gap-3 text-xs text-muted-foreground">
                <span>{article.readingTime} min read</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatViews(article.views)}</span>
              </div>
            </div>

            <div className="no-print mb-5 flex flex-wrap gap-2">
              {shareLinks.map(({ label, style, icon: Icon, href }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black transition-all duration-200 ${style}`}>
                  {Icon("h-3.5 w-3.5")}
                  {label}
                </a>
              ))}
              <button type="button" onClick={() => setSaved((value) => !value)} className="inline-flex items-center gap-2 rounded-full bg-muted/60 border border-border/40 px-3 py-2 text-xs font-black text-foreground/80 hover:bg-muted hover:text-foreground transition-all duration-200">
                <Bookmark className="h-3.5 w-3.5" />
                {saved ? 'Saved' : 'Save Story'}
              </button>
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-muted/60 border border-border/40 px-3 py-2 text-xs font-black text-foreground/80 hover:bg-muted hover:text-foreground transition-all duration-200">
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
              <button type="button" onClick={copyUrl} className="inline-flex items-center gap-2 rounded-full bg-muted/60 border border-border/40 px-3 py-2 text-xs font-black text-foreground/80 hover:bg-muted hover:text-foreground transition-all duration-200">
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied' : 'Copy URL'}
              </button>
              <button type="button" onClick={toggleAudio} className="inline-flex items-center gap-2 rounded-full bg-muted/60 border border-border/40 px-3 py-2 text-xs font-black text-foreground/80 hover:bg-muted hover:text-foreground transition-all duration-200">
                <Volume2 className="h-3.5 w-3.5" />
                {speaking ? 'Stop Audio' : 'Audio Story'}
              </button>
            </div>

            <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-lg">
              <Image src={article.image} alt={article.title} fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" loading="eager" />
            </div>

            <div className="space-y-5 text-lg leading-9 text-foreground">
              {paragraphs.map((paragraph, index) => (
                <div key={index}>
                  <p>{paragraph}</p>
                  {index === 1 && (
                    <div className="no-print my-6">
                      <Advertisement position="in-article" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-border pt-5">
              <p className="mb-3 text-xs font-black uppercase tracking-wide text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span key={`${tag}-${index}`} className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-foreground">#{tag}</span>
                ))}
              </div>
            </div>

            <section className="mt-8 rounded-lg border border-border bg-card p-4">
              <div className="flex gap-3">
                <Image src={article.author.image} alt={article.author.name} width={58} height={58} className="h-14 w-14 rounded-full object-cover" />
                <div>
                  <h2 className="font-black text-foreground">{authorName}</h2>
                  <p className="text-xs font-bold text-accent">{authorDesignation}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{authorBio}</p>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="section-heading mb-4 text-xl font-black text-foreground">
                {getLocalized(language, { en: 'Related Stories', gu: 'સંબંધિત સમાચાર', hi: 'संबंधित खबरें' })}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((item) => <NewsCard key={item.id} article={item} variant="horizontal" />)}
              </div>
            </section>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-40 lg:self-start">
            <Advertisement position="sidebar" />
            <section className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="bg-accent px-4 py-3 text-sm font-black text-white">
                {getLocalized(language, { en: 'Trending Stories', gu: 'ટ્રેન્ડિંગ સ્ટોરીઝ', hi: 'ट्रेंडिंग स्टोरीज' })}
              </div>
              <div className="p-3">
                {trending.map((item, index) => (
                  <div key={item.id} className="flex gap-2">
                    <span className="mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-black text-muted-foreground">{index + 1}</span>
                    <NewsCard article={item} variant="compact" />
                  </div>
                ))}
              </div>
            </section>
            <Advertisement position="sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
