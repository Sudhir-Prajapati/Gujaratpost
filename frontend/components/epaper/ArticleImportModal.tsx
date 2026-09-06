'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, FileText, ArrowRight, Loader2, Check } from 'lucide-react';
import { getBackendApiUrl, authFetch } from '@/lib/api';

interface ArticleItem {
  id: string;
  title: string;
  titleGu?: string;
  excerpt?: string;
  excerptGu?: string;
  contentGu?: string;
  featuredImage?: string;
  category?: { nameGu?: string; name?: string };
}

interface ArticleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (article: {
    headline: string;
    subheadline?: string;
    articleBody: string;
    image: string;
    category: string;
  }) => void;
  targetSlotLabel?: string;
}

export const ArticleImportModal: React.FC<ArticleImportModalProps> = ({
  isOpen,
  onClose,
  onSelectArticle,
  targetSlotLabel = 'પસંદ કરેલ સ્લોટ',
}) => {
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPosts('');
    }
  }, [isOpen]);

  const fetchPosts = async (searchStr: string) => {
    setLoading(true);
    try {
      const url = getBackendApiUrl(`/api/public/posts?limit=12&search=${encodeURIComponent(searchStr)}`);
      const res = await fetch(url);
      const json = await res.json();
      if (json?.data?.posts && Array.isArray(json.data.posts)) {
        setPosts(json.data.posts);
      } else if (json?.posts && Array.isArray(json.posts)) {
        setPosts(json.posts);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Failed to fetch published posts for import:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(query);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              વેબસાઇટ આર્ટિકલ ઇમ્પોર્ટ કરો (Import Website Article)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ટાર્ગેટ સ્લોટ: <span className="font-semibold text-blue-600">{targetSlotLabel}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="સમાચારનું શિર્ષક શોધો..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors"
            >
              શોધો
            </button>
          </form>
        </div>

        {/* Articles List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <span className="text-xs font-medium">સમાચાર લોડ થઈ રહ્યા છે...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              કોઈ આર્ટિકલ મળ્યા નથી.
            </div>
          ) : (
            posts.map((post) => {
              const headline = post.titleGu || post.title || '';
              const subheadline = post.excerptGu || post.excerpt || '';
              const bodyText = (post.contentGu || '').replace(/<[^>]*>?/gm, '');
              const img = post.featuredImage || '';
              const cat = post.category?.nameGu || post.category?.name || 'સમાચાર';

              return (
                <div
                  key={post.id}
                  onClick={() => {
                    onSelectArticle({
                      headline,
                      subheadline,
                      articleBody: bodyText,
                      image: img,
                      category: cat,
                    });
                    onClose();
                  }}
                  className="group flex gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition-all items-center"
                >
                  {img && (
                    <img
                      src={img}
                      alt={headline}
                      className="w-20 h-16 object-cover rounded border border-slate-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="inline-block bg-slate-100 group-hover:bg-blue-100 text-slate-700 group-hover:text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded mb-1">
                      {cat}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 line-clamp-1">
                      {headline}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {subheadline || bodyText}
                    </p>
                  </div>
                  <button className="bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 p-2 rounded-full transition-colors shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
