'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save, Globe, Settings2, BarChart2, AlertCircle, Upload } from 'lucide-react';

interface ArticleFormProps {
  articleId?: string; // If present, we are in Edit mode
}

interface CategoryData {
  id: string;
  name: string;
}

interface AuthorData {
  id: string;
  name: string;
}

export default function ArticleForm({ articleId }: ArticleFormProps) {
  const router = useRouter();
  const isEditMode = !!articleId;

  // Loaders & Errors
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);

  // Selector choices
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [authors, setAuthors] = useState<AuthorData[]>([]);

  // Form tab selection
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'seo'>('content');
  const [contentLang, setContentLang] = useState<'en' | 'gu' | 'hi'>('en');

  // Form Fields State
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(!isEditMode);
  
  // Multilingual Text
  const [title, setTitle] = useState('');
  const [titleGu, setTitleGu] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [excerptGu, setExcerptGu] = useState('');
  const [excerptHi, setExcerptHi] = useState('');
  const [content, setContent] = useState('');
  const [contentGu, setContentGu] = useState('');
  const [contentHi, setContentHi] = useState('');

  // Settings
  const [featuredImage, setFeaturedImage] = useState('');
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'>('DRAFT');
  const [priority, setPriority] = useState(0);
  const [readingTime, setReadingTime] = useState(3);
  
  // Flags
  const [isTrending, setIsTrending] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [metaRobots, setMetaRobots] = useState('index, follow');

  // Tags (Stored as comma separated string in client, sent as object array to backend)
  const [tagsString, setTagsString] = useState('');

  // Slug generator helper
  const slugify = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Auto generate slug if enabled and title changes
  useEffect(() => {
    if (autoSlug && !isEditMode) {
      setSlug(slugify(title));
    }
  }, [title, autoSlug, isEditMode]);

  // Logged-in user state
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userAuthorId, setUserAuthorId] = useState<string | null>(null);
  const [userAuthorName, setUserAuthorName] = useState<string | null>(null);

  // Load initial choices (categories, authors & auth profile)
  useEffect(() => {
    async function loadSelectors() {
      try {
        const [catRes, autRes, meRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/authors'),
          fetch('/api/auth/me'),
        ]);
        const catJson = await catRes.json();
        const autJson = await autRes.json();
        const meJson = await meRes.json();
        
        if (catRes.ok) setCategories(catJson.data || []);
        if (autRes.ok) setAuthors(autJson.data || []);

        if (meRes.ok && meJson.data?.authenticated) {
          const user = meJson.data.user;
          setUserRole(user.role);
          setUserAuthorId(user.authorId);
          setUserAuthorName(user.authorName);

          if (user.role === 'REPORTER' && user.authorId) {
            setAuthorId(user.authorId);
            setStatus('DRAFT');
          }
        }
      } catch (err) {
        console.error('Failed to load form selector choices', err);
      }
    }
    loadSelectors();
  }, []);

  // Load article values if in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    if (!userRole) return; // Wait until auth data is loaded

    async function loadArticle() {
      try {
        const res = await fetch(`/api/admin/articles/${articleId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load article.');

        const art = json.data;

        // Enforce reporter permissions: they can only edit their own articles
        if (userRole === 'REPORTER' && userAuthorId && art.authorId !== userAuthorId) {
          setError('Forbidden: You are not authorized to edit other authors\' articles.');
          setFetching(false);
          return;
        }
        setSlug(art.slug);
        setTitle(art.title);
        setTitleGu(art.titleGu);
        setTitleHi(art.titleHi);
        setExcerpt(art.excerpt);
        setExcerptGu(art.excerptGu);
        setExcerptHi(art.excerptHi);
        setContent(art.content);
        setContentGu(art.contentGu);
        setContentHi(art.contentHi);
        setFeaturedImage(art.featuredImage || '');
        if (art.featuredImage && (art.featuredImage.startsWith('http://') || art.featuredImage.startsWith('https://'))) {
          setImageMode('url');
        } else {
          setImageMode('upload');
        }
        setCategoryId(art.categoryId);
        setAuthorId(art.authorId);
        setStatus(art.status);
        setPriority(art.priority || 0);
        setReadingTime(art.readingTime || 3);
        setIsTrending(art.isTrending || false);
        setIsBreaking(art.isBreaking || false);
        setIsFeatured(art.isFeatured || false);
        
        setSeoTitle(art.seoTitle || '');
        setSeoDescription(art.seoDescription || '');
        setSeoKeywords(art.seoKeywords || '');
        setCanonicalUrl(art.canonicalUrl || '');
        setMetaRobots(art.metaRobots || 'index, follow');

        if (art.tags && art.tags.length > 0) {
          setTagsString(art.tags.map((t: any) => t.name).join(', '));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    }
    loadArticle();
  }, [articleId, isEditMode, userRole, userAuthorId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upload image.');

      setFeaturedImage(json.url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload image from computer.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Basic Validation
    if (!title.trim() || !slug.trim() || !categoryId || !authorId || !featuredImage.trim()) {
      setError('Please fill in all required settings (Title, Slug, Category, Author, Image).');
      setLoading(false);
      return;
    }

    // Convert comma-separated tags to object array
    const tags = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    const payload = {
      slug,
      title,
      titleGu: titleGu.trim() || title,
      titleHi: titleHi.trim() || title,
      excerpt: excerpt.trim() || 'Gujarat Post news flash.',
      excerptGu: excerptGu.trim() || excerpt || 'ગુજરાત પોસ્ટ સમાચાર.',
      excerptHi: excerptHi.trim() || excerpt || 'गुजरात पोस्ट समाचार.',
      content: content.trim() || 'Article content details.',
      contentGu: contentGu.trim() || content || 'સમાચાર વિગતો.',
      contentHi: contentHi.trim() || content || 'समाचार विवरण.',
      featuredImage,
      thumbnail: featuredImage,
      categoryId,
      authorId,
      status,
      priority: Number(priority),
      readingTime: Number(readingTime),
      isTrending,
      isBreaking,
      isFeatured,
      isPublished: status === 'PUBLISHED',
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      seoKeywords: seoKeywords.trim() || undefined,
      canonicalUrl: canonicalUrl.trim() || undefined,
      metaRobots: metaRobots.trim() || undefined,
      tags,
    };

    try {
      const url = isEditMode ? `/api/admin/articles/${articleId}` : '/api/admin/articles';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to save article.');

      // Route back to list
      router.push('/admin/articles');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mt-2 text-sm">Loading article details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950/40"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditMode ? 'Edit Article' : 'New Article'}
            </h1>
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{loading ? 'Saving...' : 'Save Article'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-950/20 dark:bg-red-950/10 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Primary Category Panels (Content, Settings, SEO tabs) */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all -mb-[2px] ${
            activeTab === 'content'
              ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Multilingual Content</span>
        </button>
        
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all -mb-[2px] ${
            activeTab === 'settings'
              ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Settings2 className="h-4 w-4" />
          <span>Settings</span>
        </button>

        {userRole !== 'REPORTER' && (
          <button
            onClick={() => setActiveTab('seo')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all -mb-[2px] ${
              activeTab === 'seo'
                ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>SEO Metadata</span>
          </button>
        )}
      </div>

      {/* Form Content Panel */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
        
        {/* ─── TAB 1: CONTENT ─── */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Lang Selection Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-850">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Select target translation tab to write content:
              </span>
              <div className="flex bg-zinc-100 rounded-lg p-0.5 dark:bg-zinc-950">
                {(['en', 'gu', 'hi'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setContentLang(lang)}
                    className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${
                      contentLang === lang
                        ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white'
                        : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'gu' ? 'ગુજરાતી' : 'हिन्दी'}
                  </button>
                ))}
              </div>
            </div>

            {/* Title / Excerpt / Body depending on lang selection */}
            {contentLang === 'en' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    English Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter English Title"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    English Excerpt
                  </label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Brief news hook overview summary..."
                    rows={2}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    English Main Content Body
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write complete article details..."
                    rows={10}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 font-sans"
                  />
                </div>
              </div>
            )}

            {contentLang === 'gu' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Gujarati Title (ગુજરાતી શીર્ષક)
                  </label>
                  <input
                    type="text"
                    value={titleGu}
                    onChange={(e) => setTitleGu(e.target.value)}
                    placeholder="ગુજરાતી હેડલાઇન દાખલ કરો"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Gujarati Excerpt (ગુજરાતી ટૂંકો સાર)
                  </label>
                  <textarea
                    value={excerptGu}
                    onChange={(e) => setExcerptGu(e.target.value)}
                    placeholder="સમાચારનો ટૂંકો અહેવાલ..."
                    rows={2}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Gujarati Main Content Body (ગુજરાતી વિગતવાર સમાચાર)
                  </label>
                  <textarea
                    value={contentGu}
                    onChange={(e) => setContentGu(e.target.value)}
                    placeholder="સંપૂર્ણ સમાચાર વિગતવાર અહિયાં લખો..."
                    rows={10}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                  />
                </div>
              </div>
            )}

            {contentLang === 'hi' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Hindi Title (हिंदी शीर्षक)
                  </label>
                  <input
                    type="text"
                    value={titleHi}
                    onChange={(e) => setTitleHi(e.target.value)}
                    placeholder="हिंदी हेडलाइन दर्ज करें"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Hindi Excerpt (हिंदी संक्षिप्त सारांश)
                  </label>
                  <textarea
                    value={excerptHi}
                    onChange={(e) => setExcerptHi(e.target.value)}
                    placeholder="समाचार का संक्षिप्त विवरण..."
                    rows={2}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Hindi Main Content Body (हिंदी मुख्य समाचार)
                  </label>
                  <textarea
                    value={contentHi}
                    onChange={(e) => setContentHi(e.target.value)}
                    placeholder="विस्तृत समाचार यहाँ लिखें..."
                    rows={10}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: SETTINGS ─── */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            {/* Slug / Auto Generator checkbox */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Article Slug (URL key) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                    setAutoSlug(false);
                  }}
                  placeholder="e.g. dynamic-title-1"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 font-mono"
                  required
                />
              </div>
              <div className="flex items-end pb-3">
                <label className="flex items-center gap-2 text-sm text-zinc-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSlug}
                    onChange={(e) => setAutoSlug(e.target.checked)}
                    disabled={isEditMode}
                    className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary/20"
                  />
                  <span>Auto-generate from English Title</span>
                </label>
              </div>
            </div>

            {/* Category & Author dropdowns */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Category Selection <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                  required
                >
                  <option value="">Choose Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Assigned Author <span className="text-red-500">*</span>
                </label>
                {userRole === 'REPORTER' ? (
                  <div className="w-full rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 mt-2 px-4 py-3 text-sm text-zinc-500 font-semibold">
                    {userAuthorName || 'Your Linked Author Profile'}
                  </div>
                ) : (
                  <select
                    value={authorId}
                    onChange={(e) => setAuthorId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                    required
                  >
                    <option value="">Select Author</option>
                    {authors.map((aut) => (
                      <option key={aut.id} value={aut.id}>
                        {aut.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Image link */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Featured Image <span className="text-red-500">*</span>
              </label>
              
              <div className="mt-2 space-y-3">
                {/* Mode Toggle */}
                <div className="flex gap-2 p-1 bg-zinc-150 dark:bg-zinc-900 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      imageMode === 'upload'
                        ? 'bg-white text-zinc-905 shadow-sm dark:bg-zinc-800 dark:text-white'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      imageMode === 'url'
                        ? 'bg-white text-zinc-905 shadow-sm dark:bg-zinc-800 dark:text-white'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Image URL
                  </button>
                </div>

                {imageMode === 'upload' ? (
                  <div className="relative">
                    {featuredImage ? (
                      <div className="relative group overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 max-w-md">
                        <img
                          src={featuredImage}
                          alt="Featured Preview"
                          className="w-full h-48 object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <button
                            type="button"
                            onClick={() => setFeaturedImage('')}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-all shadow-lg"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 bg-zinc-50/30 dark:bg-zinc-950/10 hover:bg-zinc-50/60 dark:hover:bg-zinc-950/20 transition-all cursor-pointer relative group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={uploadingImage}
                        />
                        {uploadingImage ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                            <span className="text-sm font-medium text-zinc-500">Uploading image...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 mb-3 group-hover:scale-105 transition-all">
                              <Upload className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                              Click to upload or drag & drop
                            </span>
                            <span className="text-xs text-zinc-400 mt-1">
                              PNG, JPG, JPEG or WEBP (Max 5MB)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                    required={imageMode === 'url'}
                  />
                )}
              </div>
            </div>

            {/* Status & Priority & Reading Time */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Status
                </label>
                {userRole === 'REPORTER' ? (
                  <div className="w-full rounded-xl border border-zinc-205 bg-zinc-100 dark:border-zinc-850 dark:bg-zinc-950/40 mt-2 px-4 py-3 text-sm text-zinc-500 font-semibold">
                    Draft (Pending Review)
                  </div>
                ) : (
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Sort Priority
                </label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Reading Time (minutes)
                </label>
                <input
                  type="number"
                  value={readingTime}
                  onChange={(e) => setReadingTime(Number(e.target.value))}
                  placeholder="3"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                />
              </div>
            </div>

            {/* Checkbox Flags */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Placement Flags
              </label>
              <div className="flex flex-wrap gap-5 rounded-xl border border-zinc-150 p-4 dark:border-zinc-800 bg-zinc-50/20">
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary/20"
                  />
                  <span>Featured Article (Slider/Hero)</span>
                </label>

                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTrending}
                    onChange={(e) => setIsTrending(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary/20"
                  />
                  <span>Trending List</span>
                </label>

                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBreaking}
                    onChange={(e) => setIsBreaking(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary/20"
                  />
                  <span>Breaking Alert Ticker</span>
                </label>
              </div>
            </div>

            {/* Tag string */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Article Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsString}
                onChange={(e) => setTagsString(e.target.value)}
                placeholder="Gujarat, Ahmedabad, rain, weather"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Enter words separated by commas. Tag translations will be seeded automatically.
              </p>
            </div>
          </div>
        )}

        {/* ─── TAB 3: SEO METADATA ─── */}
        {activeTab === 'seo' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Custom SEO Meta Title
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="SEO Optimized Page Title"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Custom SEO Meta Description
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Write compelling summary to improve Google CTR..."
                rows={3}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Meta Keywords
              </label>
              <input
                type="text"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="keyword1, keyword2"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Canonical URL
                </label>
                <input
                  type="text"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="https://gujaratpost.com/news/example"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Robots Configuration
                </label>
                <input
                  type="text"
                  value={metaRobots}
                  onChange={(e) => setMetaRobots(e.target.value)}
                  placeholder="index, follow"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 mt-2 px-4 py-3 text-sm focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20"
                />
              </div>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}
