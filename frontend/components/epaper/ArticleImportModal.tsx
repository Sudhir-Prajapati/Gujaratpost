'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, FileText, ArrowRight, Loader2, Check, RefreshCw, Filter, Calendar } from 'lucide-react';
import { fetchPublishedArticles, extractParagraphs, stripHtml } from '@/lib/epaperAutoFill';

interface ArticleItem {
  id: string;
  title: string;
  titleGu?: string;
  excerpt?: string;
  excerptGu?: string;
  content?: string;
  contentGu?: string;
  featuredImage?: string;
  image?: string;
  category?: string | { nameGu?: string; name?: string };
  categoryGu?: string;
  categorySlug?: string;
  location?: string;
  createdAt?: string;
  publishedAt?: string;
}

interface ArticleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (article: {
    headline: string;
    subheadline?: string;
    articleBody: string;
    paragraph1?: string;
    paragraph2?: string;
    paragraph3?: string;
    image: string;
    category: string;
    location?: string;
  }) => void;
  targetSlotLabel?: string;
}

const CATEGORY_TABS = [
  { label: 'તમામ', slug: '' },
  { label: 'ગુજરાત', slug: 'gujarat' },
  { label: 'ભારત', slug: 'national' },
  { label: 'વિશ્વ', slug: 'world' },
  { label: 'રાજનીતિ', slug: 'politics' },
  { label: 'બિઝનેસ', slug: 'business' },
  { label: 'સ્પોર્ટ્સ', slug: 'sports' },
  { label: 'મનોરંજન', slug: 'entertainment' },
  { label: 'ક્રાઇમ', slug: 'crime' },
  { label: 'ટેકનોલોજી', slug: 'technology' },
];

export const ArticleImportModal: React.FC<ArticleImportModalProps> = ({
  isOpen,
  onClose,
  onSelectArticle,
  targetSlotLabel = 'પસંદ કરેલ સ્લોટ',
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
  const [posts, setPosts] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadArticles(query, selectedCategorySlug);
    }
  }, [isOpen, selectedCategorySlug]);

  const loadArticles = async (searchStr: string, catSlug: string) => {
    setLoading(true);
    try {
      const articles = await fetchPublishedArticles({
        query: searchStr.trim() || undefined,
        categorySlug: catSlug || undefined,
        limit: 30,
      });
      setPosts(articles);
    } catch (err) {
      console.error('Failed to load published articles for e-paper import:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadArticles(query, selectedCategorySlug);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-900/40 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>વેબસાઇટ આર્ટિકલમાંથી ઇમ્પોર્ટ કરો</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Live Articles
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ટાર્ગેટ સ્લોટ: <span className="font-bold text-amber-400">{targetSlotLabel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="બંધ કરો"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/50 space-y-2.5">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="સમાચારનું શિર્ષક અથવા કીવર્ડ શોધો..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-red-500/50 focus:border-red-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition cursor-pointer shadow-sm shadow-red-900/30 flex items-center gap-1.5 shrink-0"
            >
              <span>શોધો</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                loadArticles('', selectedCategorySlug);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl font-semibold transition cursor-pointer shrink-0"
              title="રીફ્રેશ કરો"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3 text-slate-500" /> કેટેગરી:
            </span>
            {CATEGORY_TABS.map((tab) => {
              const isActive = selectedCategorySlug === tab.slug;
              return (
                <button
                  key={tab.slug}
                  type="button"
                  onClick={() => setSelectedCategorySlug(tab.slug)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-red-600 text-white border-red-500 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Articles List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 divide-y divide-slate-800/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              <span className="text-xs font-bold text-slate-400">વેબસાઇટ પરથી સમાચાર લોડ થઈ રહ્યા છે...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs space-y-2">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-bold">કોઈ આર્ટિકલ મળ્યા નથી.</p>
              <p className="text-[11px] text-slate-500">કૃપા કરીને અન્ય કીવર્ડ અથવા કેટેગરી પસંદ કરો.</p>
            </div>
          ) : (
            posts.map((post) => {
              const headline = post.titleGu || post.title || '';
              const subheadline = stripHtml(post.excerptGu || post.excerpt || '');
              const rawBody = post.contentGu || post.content || post.excerptGu || post.excerpt || '';
              const { paragraph1, paragraph2, paragraph3, body } = extractParagraphs(rawBody, 500, 400, 350);
              const img = post.featuredImage || post.image || '';
              const cat =
                post.categoryGu ||
                (typeof post.category === 'object'
                  ? post.category?.nameGu || post.category?.name
                  : post.category) ||
                'સમાચાર';
              const location = post.location || '';
              const dateDisplay = post.publishedAt || post.createdAt;

              return (
                <div
                  key={post.id}
                  onClick={() => {
                    onSelectArticle({
                      headline,
                      subheadline,
                      articleBody: body,
                      paragraph1,
                      paragraph2,
                      paragraph3,
                      image: img,
                      category: cat,
                      location,
                    });
                    onClose();
                  }}
                  className="group pt-2.5 first:pt-0 flex gap-3 p-3 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-all border border-transparent hover:border-slate-700 items-start"
                >
                  {img ? (
                    <div className="w-24 h-20 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                      <img
                        src={img}
                        alt={headline}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-20 rounded-lg border border-slate-800 bg-slate-950/80 flex items-center justify-center text-slate-600 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black px-2 py-0.5 rounded-md">
                        {cat}
                      </span>
                      {location && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          📍 {location}
                        </span>
                      )}
                      {dateDisplay && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(dateDisplay).toLocaleDateString('gu-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-red-400 line-clamp-2 leading-snug">
                      {headline}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {subheadline || paragraph1}
                    </p>
                  </div>

                  <div className="shrink-0 self-center">
                    <span className="inline-flex items-center gap-1 bg-slate-800 group-hover:bg-red-600 text-slate-300 group-hover:text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition shadow-xs">
                      <span>ઇમ્પોર્ટ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
          <span>આર્ટિકલ પસંદ કરવાથી સ્લોટમાં હેડલાઇન, ઇમેજ અને પેરાગ્રાફ્સ આપમેળે ફિટ થઈ જશે.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            રદ કરો
          </button>
        </div>
      </div>
    </div>
  );
};
