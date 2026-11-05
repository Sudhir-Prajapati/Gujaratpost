'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save, Globe, Settings2, BarChart2, AlertCircle, CheckCircle2, Upload, UploadCloud, Link as LinkIcon, Sparkles, Quote, List, Heading, Type, Copy, Plus, Trash2, Image as ImageIcon, Video, Eye, X, ExternalLink, Search, Filter, Check, Layers, ChevronDown, ChevronUp, RotateCcw, BookOpen, FileText, PenLine, Users, Lock, Unlock } from 'lucide-react';
import { getBackendApiUrl, authFetch, getPublicArticles, clearApiCache } from '@/lib/api';
import { sanitizeImageUrl } from '@/lib/media';
import { translateOnFly } from '@/lib/translate';
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect';
import RichTextArea from '@/components/ui/RichTextArea';
import ArticlePdfPagesViewer from './ArticlePdfPagesViewer';
import ArticleSocialPreview from './ArticleSocialPreview';
import { buildArticleEmbedHtml, getSavedArticleEmbedInput } from '@/lib/article-embed-input';

interface ArticleFormProps {
  articleId?: string; // If present, we are in Edit mode
}

interface CategoryData {
  id: string;
  name: string;
  nameGu?: string;
  nameHi?: string;
  slug?: string;
  headerType?: string;
  displayOrder?: number;
  isActive?: boolean;
  showInArticle?: boolean;
  status?: string;
}

interface AuthorData {
  id: string;
  name: string;
}

// Ordered City / Location options: 0. None / Not Selected, 1. National, 2. Gujarat State, 3. All Gujarat Cities, 4. Other States & Metros, 5. International
const LOCATION_OPTIONS = [
  // 0. None / Not Selected
  { value: '', label: 'None / Not Selected (કોઈ નહીં)', sublabel: 'સામાન્ય / કોઈ ચોક્કસ શહેર નહીં' },

  // 1. National
  { value: 'National', label: 'National', sublabel: 'દેશ' },

  // 2. Gujarat State
  { value: 'Gujarat', label: 'Gujarat', sublabel: 'ગુજરાત' },

  // 3. All Gujarat Cities & Districts
  { value: 'Ahmedabad', label: 'Ahmedabad', sublabel: 'અમદાવાદ' },
  { value: 'Gandhinagar', label: 'Gandhinagar', sublabel: 'ગાંધીનગર' },
  { value: 'Surat', label: 'Surat', sublabel: 'સુરત' },
  { value: 'Vadodara', label: 'Vadodara', sublabel: 'વડોદરા' },
  { value: 'Rajkot', label: 'Rajkot', sublabel: 'રાજકોટ' },
  { value: 'Bhavnagar', label: 'Bhavnagar', sublabel: 'ભાવનગર' },
  { value: 'Jamnagar', label: 'Jamnagar', sublabel: 'જામનગર' },
  { value: 'Junagadh', label: 'Junagadh', sublabel: 'જૂનાગઢ' },
  { value: 'Kutch', label: 'Kutch / Bhuj', sublabel: 'કચ્છ' },
  { value: 'Anand', label: 'Anand', sublabel: 'આણંદ' },
  { value: 'Mehsana', label: 'Mehsana', sublabel: 'મહેસાણા' },
  { value: 'Morbi', label: 'Morbi', sublabel: 'મોરબી' },
  { value: 'Bharuch', label: 'Bharuch', sublabel: 'ભરૂચ' },
  { value: 'Navsari', label: 'Navsari', sublabel: 'નવસારી' },
  { value: 'Valsad', label: 'Valsad', sublabel: 'વલસાડ' },
  { value: 'Amreli', label: 'Amreli', sublabel: 'અમરેલી' },
  { value: 'Banaskantha', label: 'Banaskantha', sublabel: 'બનાસકાંઠા' },
  { value: 'Dahod', label: 'Dahod', sublabel: 'દાહોદ' },
  { value: 'Kheda', label: 'Kheda', sublabel: 'ખેડા' },
  { value: 'Narmada', label: 'Narmada', sublabel: 'નર્મદા' },
  { value: 'Panchmahal', label: 'Panchmahal', sublabel: 'પંચમહાલ' },
  { value: 'Patan', label: 'Patan', sublabel: 'પાટણ' },
  { value: 'Porbandar', label: 'Porbandar', sublabel: 'પોરબંદર' },
  { value: 'Sabarkantha', label: 'Sabarkantha', sublabel: 'સાબરકાંઠા' },
  { value: 'Surendranagar', label: 'Surendranagar', sublabel: 'સુરેન્દ્રનગર' },
  { value: 'Tapi', label: 'Tapi', sublabel: 'તાપી' },
  { value: 'Gir Somnath', label: 'Gir Somnath', sublabel: 'ગીર સોમનાથ' },
  { value: 'Botad', label: 'Botad', sublabel: 'બોટાદ' },
  { value: 'Aravalli', label: 'Aravalli', sublabel: 'અરવલ્લી' },
  { value: 'Chhota Udepur', label: 'Chhota Udepur', sublabel: 'છોટાઉદેપુર' },
  { value: 'Devbhoomi Dwarka', label: 'Devbhoomi Dwarka', sublabel: 'દેવભૂમિ દ્વારકા' },
  { value: 'Mahisagar', label: 'Mahisagar', sublabel: 'મહીસાગર' },

  // 4. Other Indian Metro Cities & States
  { value: 'Delhi', label: 'New Delhi', sublabel: 'નવી દિલ્હી' },
  { value: 'Mumbai', label: 'Mumbai', sublabel: 'મુંબઈ' },
  { value: 'Kolkata', label: 'Kolkata', sublabel: 'કોલકાતા' },
  { value: 'Chennai', label: 'Chennai', sublabel: 'ચેન્નઈ' },
  { value: 'Bangalore', label: 'Bangalore', sublabel: 'બેંગ્લોર' },
  { value: 'Hyderabad', label: 'Hyderabad', sublabel: 'હૈદ્રાબાદ' },
  { value: 'Pune', label: 'Pune', sublabel: 'પૂણે' },
  { value: 'Jaipur', label: 'Jaipur', sublabel: 'જયપુર' },
  { value: 'Maharashtra', label: 'Maharashtra', sublabel: 'મહારાષ્ટ્ર' },
  { value: 'Rajasthan', label: 'Rajasthan', sublabel: 'રાજસ્થાન' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh', sublabel: 'ઉત્તર પ્રદેશ' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh', sublabel: 'મધ્ય પ્રદેશ' },

  // 5. International Locations
  { value: 'International', label: 'International', sublabel: 'વિદેશ' },
  { value: 'USA', label: 'USA', sublabel: 'અમેરિકા' },
  { value: 'UK', label: 'UK', sublabel: 'બ્રિટન' },
  { value: 'Canada', label: 'Canada', sublabel: 'કેનેડા' },
  { value: 'Australia', label: 'Australia', sublabel: 'ઓસ્ટ્રેલિયા' },
  { value: 'UAE', label: 'UAE / Dubai', sublabel: 'દુબઈ' },
  { value: 'China', label: 'China', sublabel: 'ચીન' },
];

// Helper to filter out display-only sections (Instagram, YouTube Shorts, Web Stories, Podcasts) from article category choices
export const isDisplayOnlySectionCategory = (cat: any): boolean => {
  if (!cat) return false;
  const slug = (cat.slug || '').toLowerCase().trim();
  const name = (cat.name || '').toLowerCase().trim();
  const nameGu = (cat.nameGu || '').toLowerCase().trim();
  const nameHi = (cat.nameHi || '').toLowerCase().trim();

  const excludedTerms = [
    'instagram', 'insta', 'reel', 'reels', 'insta-reels', 'instagram-stories',
    'shorts', 'short', 'short-video', 'short-videos', 'youtube-shorts', 'youtube-short-video', 'videos', 'video', 'youtube',
    'webstory', 'webstories', 'web-story', 'web-stories',
    'podcast', 'podcasts'
  ];

  return excludedTerms.some(term =>
    slug === term ||
    slug.includes(term) ||
    name === term ||
    name.includes(term) ||
    nameGu.includes(term) ||
    nameHi.includes(term)
  );
};

// Helper functions to categorize categories
export const isGujaratCat = (c: CategoryData): boolean => {
  if (!c) return false;
  const slug = (c.slug || '').toLowerCase().trim();
  const name = (c.name || '').toLowerCase().trim();
  const nameGu = (c.nameGu || '').trim();
  return slug === 'gujarat' || name === 'gujarat' || nameGu === 'ગુજરાત' || nameGu.includes('ગુજરાત');
};

export const isGujaratDistrictCat = (c: CategoryData): boolean => {
  if (!c || isGujaratCat(c)) return false;
  const slug = (c.slug || '').toLowerCase().trim();
  const name = (c.name || '').toLowerCase().trim();
  const cityList = [
    'ahmedabad', 'gandhinagar', 'surat', 'vadodara', 'rajkot', 'other-cities',
    'bhavnagar', 'jamnagar', 'junagadh', 'kutch', 'anand', 'mehsana', 'morbi',
    'bharuch', 'navsari', 'valsad', 'amreli', 'banaskantha', 'dahod', 'kheda',
    'narmada', 'panchmahal', 'patan', 'porbandar', 'sabarkantha', 'surendranagar',
    'tapi', 'gir somnath', 'botad', 'aravalli', 'chhota udepur', 'devbhoomi dwarka', 'mahisagar'
  ];
  return c.headerType === 'GUJARAT' || cityList.includes(slug) || cityList.some(ct => name === ct || name.includes(ct));
};

export const isElectionCat = (c: CategoryData): boolean => {
  if (!c || isGujaratCat(c) || isGujaratDistrictCat(c)) return false;
  const slug = (c.slug || '').toLowerCase();
  const name = (c.name || '').toLowerCase();
  return slug.includes('election') || name.includes('election') || slug.includes('poll') || name.includes('poll');
};

// Map categories to location group
const NATIONAL_CATEGORY_NAMES = ['national', 'india', 'politics', 'crime', 'education', 'health', 'sports', 'fact check', 'lifestyle', 'technology', 'weather', 'business', 'entertainment', 'defense', 'railway', 'election'];
const INTERNATIONAL_CATEGORY_NAMES = ['world', 'international', 'global', 'foreign'];
const GUJARAT_CATEGORY_NAMES = ['gujarat', 'ahmedabad', 'surat', 'vadodara', 'rajkot', 'gandhinagar', 'bhavnagar', 'jamnagar', 'kutch', 'junagadh', 'morbi', 'mehsana', 'anand'];

// Clean formatting for English News Name / Slug
export function formatEnglishTitleToSlug(text: string): string {
  if (!text || !text.trim()) return '';
  return text
    .trim()
    .replace(/['’"]/g, '')
    .replace(/[,\/|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-:]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to convert English title, or fallback for Indic title, into a clean English slug
function generateEnglishSlug(text: string): string {
  if (!text || !text.trim()) return '';
  const trimmed = text.trim();

  // If already English / Latin characters
  if (!/[\u0900-\u0D7F]/.test(trimmed)) {
    return formatEnglishTitleToSlug(trimmed);
  }

  // Common vocabulary replacement for instant synchronous slug preview
  let str = trimmed;
  const wordMap: Record<string, string> = {
    'ડ્રગ્સને': 'drugs',
    'ડ્રગ્સ': 'drugs',
    'ઓપરેશન': 'operation',
    'મોટું': 'major',
    'લઇને': 'regarding',
    'ક્રાઇમ': 'crime',
    'બ્રાન્ચે': 'branches',
    'બ્રાન્ચ': 'branch',
    'કરોડ': 'crore',
    'રૂપિયાનું': 'worth-rs',
    'રૂપિયા': 'rupees',
    'ઝડપી પાડ્યું': 'seize',
    'ઝડપાયા': 'arrested',
    'ધરપકડ': 'arrest',
    'ગુજરાતમાં': 'gujarat',
    'ગુજરાત': 'gujarat',
    'અમદાવાદમાં': 'ahmedabad',
    'અમદાવાદ': 'ahmedabad',
    'સુરતમાં': 'surat',
    'સુરત': 'surat',
    'વડોદરામાં': 'vadodara',
    'વડોદરા': 'vadodara',
    'રાજકોટમાં': 'rajkot',
    'રાજકોટ': 'rajkot',
    'ગાંધીનગરમાં': 'gandhinagar',
    'ગાંધીનગર': 'gandhinagar',
    'ભાવનગરમાં': 'bhavnagar',
    'ભાવનગર': 'bhavnagar',
    'જામનગરમાં': 'jamnagar',
    'જામનગર': 'jamnagar',
    'જૂનાગઢમાં': 'junagadh',
    'જૂનાગઢ': 'junagadh',
    'કચ્છમાં': 'kutch',
    'કચ્છ': 'kutch',
    'આણંદમાં': 'anand',
    'આણંદ': 'anand',
    'મહેસાણામાં': 'mehsana',
    'મહેસાણા': 'mehsana',
    'મોરબીમાં': 'morbi',
    'મોરબી': 'morbi',
    'દિલ્હીમાં': 'delhi',
    'દિલ્હી': 'delhi',
    'મુંબઈમાં': 'mumbai',
    'મુંબઈ': 'mumbai',
    'ભારતમાં': 'india',
    'ભારત': 'india',
    'અને': 'and',
    'સાથે': 'with',
    'પોલીસ': 'police',
    'હત્યા': 'murder',
    'અકસ્માત': 'accident',
    'મોત': 'deaths',
    'વરસાદ': 'rain',
    'પૂર': 'flood',
  };

  for (const [key, val] of Object.entries(wordMap)) {
    str = str.replace(new RegExp(key, 'gi'), ` ${val} `);
  }

  // Strip remaining non-latin characters so broken phonetic transliteration NEVER happens
  return formatEnglishTitleToSlug(str);
}

export default function ArticleForm({ articleId }: ArticleFormProps) {
  const router = useRouter();
  const isEditMode = !!articleId;

  // Loaders & Errors
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [translatingLanguage, setTranslatingLanguage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selector choices
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [authors, setAuthors] = useState<AuthorData[]>([]);

  // Form tab selection
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'seo'>('content');
  const [contentLang, setContentLang] = useState<'en' | 'gu' | 'hi'>('gu');

  // Form Fields State
  const [slug, setSlug] = useState('');
  const [articleNumber, setArticleNumber] = useState<number | ''>('');
  const slugTimerRef = useRef<NodeJS.Timeout | null>(null);
  const slugRequestRef = useRef(0);
  const slugInputRef = useRef<HTMLInputElement | null>(null);
  const hasManuallyEditedSlug = useRef<boolean>(isEditMode);
  const hasAutoGeneratedSlugOnce = useRef<boolean>(isEditMode);
  const [isSlugBlocked, setIsSlugBlocked] = useState<boolean>(isEditMode);

  // Real-time asynchronous translation to produce fluent, accurate English slug
  const autoGenerateEnglishSlug = useCallback(async (rawText: string) => {
    if (!rawText || !rawText.trim()) return;
    if (hasManuallyEditedSlug.current || hasAutoGeneratedSlugOnce.current) return;
    const request = ++slugRequestRef.current;
    const commitSlug = (generated: string) => {
      if (!generated || request !== slugRequestRef.current || hasManuallyEditedSlug.current || hasAutoGeneratedSlugOnce.current) return;
      setSlug(generated);
      hasAutoGeneratedSlugOnce.current = true;
      setIsSlugBlocked(true);
    };

    const trimmed = rawText.trim();

    // If pure English / Latin characters, convert words to hyphens directly
    if (!/[\u0900-\u0D7F]/.test(trimmed)) {
      const generated = formatEnglishTitleToSlug(trimmed);
      commitSlug(generated);
      return;
    }

    try {
      const englishTranslation = await translateOnFly(trimmed, 'en');
      if (englishTranslation && !/[\u0900-\u0D7F]/.test(englishTranslation)) {
        const generated = formatEnglishTitleToSlug(englishTranslation);
        commitSlug(generated);
      }
    } catch (err) {
      console.warn('Real-time slug translation error:', err);
    }
  }, []);

  const cancelSlugGeneration = () => {
    ++slugRequestRef.current;
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
  };
  const lockSlug = () => {
    cancelSlugGeneration();
    hasAutoGeneratedSlugOnce.current = true;
    setIsSlugBlocked(true);
  };
  const unblockSlug = () => {
    cancelSlugGeneration();
    hasManuallyEditedSlug.current = false;
    hasAutoGeneratedSlugOnce.current = false;
    setIsSlugBlocked(false);
  };

  useEffect(() => () => {
    ++slugRequestRef.current;
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
  }, []);

  // Article Primary Language ('gu' | 'en' | 'hi')
  const [articleLanguage, setArticleLanguage] = useState<'gu' | 'en' | 'hi'>('gu');

  // Multilingual Text
  const [title, setTitle] = useState('');
  const [titleGu, setTitleGu] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [excerptGu, setExcerptGu] = useState('');
  const [excerptHi, setExcerptHi] = useState('');

  // Structured Article Sections (Matching Screenshot 2 layout)
  const [highlights, setHighlights] = useState('');
  const [highlightsGu, setHighlightsGu] = useState('');
  const [highlightsHi, setHighlightsHi] = useState('');

  const [desc1, setDesc1] = useState('');
  const [desc1Gu, setDesc1Gu] = useState('');
  const [desc1Hi, setDesc1Hi] = useState('');

  const [quoteText, setQuoteText] = useState('');
  const [quoteTextGu, setQuoteTextGu] = useState('');
  const [quoteTextHi, setQuoteTextHi] = useState('');

  const [quoteCite, setQuoteCite] = useState('');
  const [quoteCiteGu, setQuoteCiteGu] = useState('');
  const [quoteCiteHi, setQuoteCiteHi] = useState('');

  const [fieldErrors, setFieldErrors] = useState<{ slug?: boolean; title?: boolean; category?: boolean; author?: boolean; scheduledAt?: boolean }>({});
  const [scheduledAtError, setScheduledAtError] = useState<string | null>(null);

  interface StorySectionSlot {
    id: string;
    descEn: string;
    descGu: string;
    descHi: string;
    imageUrl: string;
    imageMode: 'upload' | 'url';
    imageUploading: boolean;
    showImageAfterDesc?: boolean;
  }

  // Paired story continuation sections (Section 2 to Section 10: Description N & Image N together)
  // Index 0 represents Section 2 (Description 2 & Image 2).
  const [storySections, setStorySections] = useState<StorySectionSlot[]>([
    { id: 'section-2', descEn: '', descGu: '', descHi: '', imageUrl: '', imageMode: 'upload', imageUploading: false },
  ]);

  const handleAddStorySection = () => {
    if (storySections.length >= 9) return; // Up to 9 continuation sections = Section 2 to 10
    const nextNum = storySections.length + 2;
    setStorySections((prev) => [
      ...prev,
      {
        id: `section-${nextNum}-${Date.now()}`,
        descEn: '',
        descGu: '',
        descHi: '',
        imageUrl: '',
        imageMode: 'upload',
        imageUploading: false,
      },
    ]);
  };

  const handleRemoveStorySection = (index: number) => {
    if (index === 0) return; // Section 2 is always retained
    setStorySections((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStorySection = (index: number, updates: Partial<StorySectionSlot>) => {
    if (updates.imageUrl) {
      updates.imageUrl = sanitizeImageUrl(updates.imageUrl);
    }
    setStorySections((prev) => {
      const updated = [...prev];
      if (!updated[index]) {
        updated[index] = {
          id: `section-${index + 2}`,
          descEn: '',
          descGu: '',
          descHi: '',
          imageUrl: '',
          imageMode: 'upload',
          imageUploading: false,
        };
      }
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const updateStorySectionDesc = (index: number, val: string) => {
    setStorySections((prev) => {
      const updated = [...prev];
      if (!updated[index]) {
        updated[index] = {
          id: `section-${index + 2}`,
          descEn: '',
          descGu: '',
          descHi: '',
          imageUrl: '',
          imageMode: 'upload',
          imageUploading: false,
        };
      }
      const slot = { ...updated[index] };
      if (contentLang === 'en') slot.descEn = val;
      else if (contentLang === 'gu') slot.descGu = val;
      else if (contentLang === 'hi') slot.descHi = val;
      updated[index] = slot;
      return updated;
    });
  };

  // Fallback unified content strings
  const [content, setContent] = useState('');
  const [contentGu, setContentGu] = useState('');
  const [contentHi, setContentHi] = useState('');

  // Settings (Primary Media & Categories)
  const [featuredImage, setFeaturedImage] = useState('');
  const [primaryMediaList, setPrimaryMediaList] = useState<string[]>([]);
  const [primaryUrlInput, setPrimaryUrlInput] = useState('');
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [uploadingImage, setUploadingImage] = useState(false);

  const addPrimaryMediaUrl = (inputVal: string) => {
    if (!inputVal.trim()) return;
    const splitUrls = inputVal
      .split(/[\n,]+/)
      .map((u) => sanitizeImageUrl(u.trim()))
      .filter(Boolean);
    if (splitUrls.length === 0) return;

    setPrimaryMediaList((prev) => {
      const updated = Array.from(new Set([...prev, ...splitUrls]));
      if (updated[0]) setFeaturedImage(updated[0]);
      return updated;
    });
    setPrimaryUrlInput('');
  };

  const removePrimaryMedia = (index: number) => {
    setPrimaryMediaList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setFeaturedImage(updated[0] || '');
      return updated;
    });
  };

  const setPrimaryAsMain = (index: number) => {
    setPrimaryMediaList((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const target = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      const updated = [target, ...remaining];
      setFeaturedImage(updated[0] || '');
      return updated;
    });
  };
  const [categoryId, setCategoryId] = useState('');
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryFilterTab, setCategoryFilterTab] = useState<'all' | 'gujarat' | 'news' | 'elections' | 'selected'>('all');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    gujarat: false,
    news: false,
    elections: false,
  });
  const [location, setLocation] = useState('');
  const [customLocations, setCustomLocations] = useState<SelectOption[]>([]);
  const [showCustomLocModal, setShowCustomLocModal] = useState(false);
  const [customLocInputName, setCustomLocInputName] = useState('');
  const [customLocInputSublabel, setCustomLocInputSublabel] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [authorInputMode, setAuthorInputMode] = useState<'select' | 'custom'>('select');
  const [customAuthorName, setCustomAuthorName] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'>('DRAFT');
  const [scheduledAt, setScheduledAt] = useState('');
  const [priority, setPriority] = useState(0);
  const [readingTime, setReadingTime] = useState(3);

  // Social Media & Video / PDF Embeds
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [showPdfPages, setShowPdfPages] = useState(false);
  const [pdfPosition, setPdfPosition] = useState<string>('end');
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Helper: Format YouTube URL or embed code to Embed URL or ID
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    const iframeSrc = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeSrc && iframeSrc[1]) {
      return iframeSrc[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return `https://www.youtube.com/embed/${trimmed}`;
    }
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return trimmed;
  };

  // Helper: Format Instagram URL or embed code to Embed iframe URL
  const getInstagramEmbedUrl = (raw: string): string => {
    if (!raw) return '';
    const trimmed = raw.trim();
    // 1. Extract src if user pasted an iframe
    const iframeSrcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      return iframeSrcMatch[1];
    }
    // 2. Extract permalink from blockquote embed
    const permalinkMatch = trimmed.match(/data-instgrm-permalink=["']([^"']+)["']/i);
    if (permalinkMatch && permalinkMatch[1]) {
      return getInstagramEmbedUrl(permalinkMatch[1]);
    }
    // 3. Match post, reel or tv URL
    const igMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i);
    if (igMatch && igMatch[1]) {
      const isReel = trimmed.includes('/reel/') || trimmed.includes('/reels/');
      return `https://www.instagram.com/${isReel ? 'reel' : 'p'}/${igMatch[1]}/embed/`;
    }
    if (trimmed.includes('instagram.com') && trimmed.includes('/embed')) {
      return trimmed;
    }
    return trimmed;
  };

  // Helper: Format Facebook URL or embed code to Embed iframe URL
  const getFacebookEmbedUrl = (raw: string): string => {
    if (!raw) return '';
    const trimmed = raw.trim();
    // 1. Extract src if user pasted an iframe
    const iframeSrcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      return iframeSrcMatch[1].replace(/&amp;/g, '&');
    }
    // 2. Check if already a plugin URL
    if (trimmed.includes('facebook.com/plugins/post.php') || trimmed.includes('facebook.com/plugins/video.php')) {
      return trimmed.replace(/&amp;/g, '&');
    }
    // 3. Match video/watch/reel vs regular post
    const isVideo = /watch|video|reel|fb\.watch/i.test(trimmed);
    const endpoint = isVideo ? 'https://www.facebook.com/plugins/video.php' : 'https://www.facebook.com/plugins/post.php';
    return `${endpoint}?href=${encodeURIComponent(trimmed)}&show_text=true&width=500`;
  };

  // Upload PDF document attachment
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadingPdf(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Failed to upload PDF document.');

      setPdfUrl(json.url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload PDF file.');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Flags
  const [isTrending, setIsTrending] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  const handleToggleTrendingStory = useCallback((explicitValue?: boolean) => {
    setIsTrending((prev) => (explicitValue !== undefined ? explicitValue : !prev));
  }, []);

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [metaRobots, setMetaRobots] = useState('index, follow');

  // Tags (Stored as comma separated string in client, sent as object array to backend)
  const [tagsString, setTagsString] = useState('');

  // Live dynamic current local date-time string (YYYY-MM-DDTHH:mm)
  const getCurrentLocalMinDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  // Default future local date-time (1 hour from now)
  const getFutureDefaultIso = () => {
    const nextHour = new Date(Date.now() + 3600000);
    return new Date(nextHour.getTime() - nextHour.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  // Validate scheduled publish date & time against current time
  const validateScheduledTime = (dateTimeString: string): string | null => {
    if (!dateTimeString || !dateTimeString.trim()) return null;
    const selectedTimestamp = new Date(dateTimeString).getTime();
    if (isNaN(selectedTimestamp)) {
      return 'Invalid date and time format.';
    }
    const now = new Date();
    // Check if the selected time is before or equal to current time (5s buffer for interaction)
    if (selectedTimestamp <= now.getTime() - 5000) {
      const formattedNow = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const isToday = new Date(dateTimeString).toDateString() === now.toDateString();
      if (isToday) {
        return `Selected time is before the current time (${formattedNow}). Scheduled time must be set in the future.`;
      }
      return 'Scheduled publish date & time cannot be in the past. Please select a future date and time.';
    }
    return null;
  };

  // Live Article Preview Toggle State
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Lock background body and html scroll when preview modal is open
  useEffect(() => {
    if (showLivePreview) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [showLivePreview]);

  // Helper to insert formatting snippets into current content body
  const insertFormatting = (type: 'highlights' | 'fullTemplate' | 'quote' | 'heading' | 'subheading' | 'bold' | 'bullet') => {
    let snippet = '';
    if (type === 'highlights') {
      if (contentLang === 'gu') {
        snippet = '\n\n## 📌 એક નજરમાં (KEY HIGHLIGHTS)\n--------------------------------------------------\n• નરેન્દ્ર મોદી સ્ટેડિયમમાં આજે મહામુકાબલો, ટિકિટ માટે પડાપડી, મેદાન પર શાનદાર પ્રદર્શન.\n• ગુજરાત પોસ્ટની ખાસ રિપોર્ટ પ્રમાણે આ નિર્ણયથી સ્થાનિક લોકો, વેપાર અને વહીવટી વ્યવસ્થામાં સીધી અસર પડશે.\n• સ્થાનિક અધિકારીઓએ જણાવ્યું કે તાજેતરના નિર્ણય બાદ વિસ્તૃત આયોજન શરૂ કરી દેવામાં આવ્યું છે.\n--------------------------------------------------\n\n';
      } else if (contentLang === 'hi') {
        snippet = '\n\n## 📌 एक नजर में (KEY HIGHLIGHTS)\n--------------------------------------------------\n• नरेंद्र मोदी स्टेडियम में आज महामुकाबला, टिकटों के लिए मची मारामारी, मैदान पर शानदार प्रदर्शन।\n• गुजरात पोस्ट की विशेष रिपोर्ट के अनुसार इस फैसले से स्थानीय लोगों, कारोबार और प्रशासन पर सीधा असर पड़ेगा।\n• स्थानीय अधिकारियों ने बताया कि ताजा फैसले के बाद विस्तृत योजना पर काम शुरू कर दिया गया है।\n--------------------------------------------------\n\n';
      } else {
        snippet = '\n\n## 📌 AT A GLANCE (KEY HIGHLIGHTS)\n--------------------------------------------------\n• High-stakes match at Narendra Modi Stadium today, ticket rush, spectacular performance on field.\n• Gujarat Post special report explains how the decision impacts local residents, trade, and administration.\n• Officials confirm detailed planning and digital monitoring deployed following latest announcement.\n--------------------------------------------------\n\n';
      }
    } else if (type === 'fullTemplate') {
      if (contentLang === 'gu') {
        snippet = '## 📌 એક નજરમાં (KEY HIGHLIGHTS)\n--------------------------------------------------\n• નરેન્દ્ર મોદી સ્ટેડિયમમાં આજે મહામુકાબલો, ટિકિટ માટે પડાપડી, મેદાન પર શાનદાર પ્રદર્શન.\n• ગુજરાત પોસ્ટની ખાસ રિપોર્ટ પ્રમાણે આ નિર્ણયથી સ્થાનિક લોકો, વેપાર અને વહીવટી વ્યવસ્થામાં સીધી અસર પડશે.\n• સ્થાનિક અધિકારીઓએ જણાવ્યું કે તાજેતરના નિર્ણય બાદ વિસ્તૃત આયોજન શરૂ કરી દેવામાં આવ્યું છે.\n--------------------------------------------------\n\nસ્થાનિક અધિકારીઓએ જણાવ્યું કે તાજેતરના નિર્ણય બાદ વિસ્તૃત આયોજન શરૂ કરી દેવામાં આવ્યું છે. લોકો સુધી જરૂરી માહિતી ઝડપથી પહોંચે તે માટે અલગ ટીમો કાર્યરત છે.\n\n## 📌 વહીવટી આયોજન અને સુરક્ષા વ્યવસ્થા\n\nવિભાગો વચ્ચે સંકલન વધારવા માટે કંટ્રોલ રૂમ અને ડિજિટલ મોનિટરિંગ વ્યવસ્થા તૈયાર કરવામાં આવી છે. નાગરિકોને સત્તાવાર સૂચનાઓનું પાલન કરવામાં આવી રહ્યું છે.\n\n> "આ નિર્ણયથી ગુજરાતના વિકાસ, સુરક્ષા અને નાગરિક સુવિધાઓ માટે મહત્વપૂર્ણ પરિણામો મળશે."\n> — પોલીસ કમિશનર, અમદાવાદ\n\nવિશ્લેષકોના મતે આ પગલું લાંબા ગાળે ગુજરાતના વિકાસ, સુરક્ષા અને નાગરિક સુવિધાઓ માટે મહત્વપૂર્ણ સાબિત થઈ શકે છે.\n';
      } else if (contentLang === 'hi') {
        snippet = '## 📌 एक नजर में (KEY HIGHLIGHTS)\n--------------------------------------------------\n• नरेंद्र मोदी स्टेडियम में आज महामुकाबला, टिकटों के लिए मची मारामारी, मैदान पर शानदार प्रदर्शन।\n• गुजरात पोस्ट की विशेष रिपोर्ट के अनुसार इस फैसले से स्थानीय लोगों, कारोबार और प्रशासन पर सीधा असर पड़ेगा।\n• स्थानीय अधिकारियों ने बताया कि ताजा फैसले के बाद विस्तृत योजना पर काम शुरू कर दिया गया है।\n--------------------------------------------------\n\nस्थानीय अधिकारियों ने बताया कि ताजा फैसले के बाद विस्तृत योजना पर काम शुरू कर दिया गया है। लोगों तक जरूरी जानकारी तेजी से पहुंचाने के लिए अलग टीमें सक्रिय हैं.\n\n## 📌 प्रशासनिक योजना और सुरक्षा व्यवस्था\n\nविभागों के बीच समन्वय बढ़ाने के लिए नियंत्रण कक्ष और डिजिटल निगरानी व्यवस्था तैयार की गई है। नागरिकों से आधिकारिक निर्देशों का पालन करने का अनुरोध किया जा रहा है।\n\n> "इस निर्णय से गुजरात के विकास, सुरक्षा और नागरिक सुविधाओं पर दूरगामी प्रभाव पड़ेगा।"\n> — पुलिस आयुक्त, अहमदाबाद\n\nविश्लेषकों के अनुसार यह कदम लंबे समय में गुजरात के विकास, सुरक्षा और नागरिक सुविधाओं के लिए महत्वपूर्ण साबित हो सकता है।\n';
      } else {
        snippet = '## 📌 AT A GLANCE (KEY HIGHLIGHTS)\n--------------------------------------------------\n• High-stakes match at Narendra Modi Stadium today, ticket rush, spectacular performance on field.\n• Gujarat Post special report explains how the decision impacts local residents, trade, and administration.\n• Officials confirm detailed planning and digital monitoring deployed following latest announcement.\n--------------------------------------------------\n\nOfficials said detailed planning began soon after the latest decision. Dedicated teams are working to ensure timely public updates and smooth coordination between departments.\n\n## 📌 Key Coordination & Administrative Directives\n\nControl rooms and digital monitoring systems have been set up to enhance department coordination. Citizens are requested to follow official advisories.\n\n> "This decision will bring pivotal long-term benefits for infrastructure and civic growth."\n> — Police Commissioner, Ahmedabad\n\nAnalysts believe this move will prove crucial for Gujarat’s long-term growth, safety, and civic infrastructure.\n';
      }
    } else if (type === 'quote') {
      if (contentLang === 'gu') {
        snippet = '\n\n> "આ નિર્ણયથી ગુજરાતના વિકાસ, સુરક્ષા અને નાગરિક સુવિધાઓ માટે મહત્વપૂર્ણ પરિણામો મળશે."\n> — પોલીસ કમિશનર, અમદાવાદ\n\n';
      } else if (contentLang === 'hi') {
        snippet = '\n\n> "इस निर्णय से गुजरात के विकास, सुरक्षा और नागरिक सुविधाओं पर दूरगामी प्रभाव पड़ेगा।"\n> — पुलिस आयुक्त, अहमदाबाद\n\n';
      } else {
        snippet = '\n\n> "This decision will bring pivotal long-term benefits for infrastructure and civic growth."\n> — Police Commissioner, Ahmedabad\n\n';
      }
    } else if (type === 'heading') {
      snippet = '\n\n## 📌 ' + (contentLang === 'gu' ? 'મુખ્ય સંકલન અને નિયંત્રણ વ્યવસ્થા' : contentLang === 'hi' ? 'मुख्य समन्वय और नियंत्रण व्यवस्था' : 'Key Coordination & Control System') + '\n\n';
    } else if (type === 'subheading') {
      snippet = '\n\n### 🔹 ' + (contentLang === 'gu' ? 'વિભાગો વચ્ચે ડિજિટલ મોનિટરિંગ' : contentLang === 'hi' ? 'विभागों के बीच डिजिटल निगरानी' : 'Digital Monitoring Across Departments') + '\n\n';
    } else if (type === 'bold') {
      snippet = ' **' + (contentLang === 'gu' ? 'મહત્વપૂર્ણ મુદ્દો' : contentLang === 'hi' ? 'महत्वपूर्ण बिंदु' : 'Important Note') + '** ';
    } else if (type === 'bullet') {
      snippet = '\n• ' + (contentLang === 'gu' ? 'નાગરિકો માટે સત્તાવાર સૂચનાઓનું પાલન કરવું આવશ્યક' : contentLang === 'hi' ? 'नागरिकों के लिए आधिकारिक निर्देशों का पालन आवश्यक' : 'Compliance with official notifications mandatory') + '\n• ' + (contentLang === 'gu' ? 'કંટ્રોલ રૂમ દ્વારા સતત પરિસ્થિતિ પર નજર' : contentLang === 'hi' ? 'नियंत्रण कक्ष द्वारा निरंतर स्थिति पर नजर' : 'Control room monitoring situation continuously') + '\n';
    }

    if (contentLang === 'en') setContent((prev) => prev + snippet);
    else if (contentLang === 'gu') setContentGu((prev) => prev + snippet);
    else if (contentLang === 'hi') setContentHi((prev) => prev + snippet);
  };

  // Helper to thoroughly purge any lingering PDF HTML markup and artifacts from description text
  const purgePdfFromText = (text: string) => {
    if (!text) return '';
    return text
      // 1. Remove complete or nested gp-pdf-card blocks ending in </a></div>
      .replace(/<div[^>]*class=["'][^"']*(?:gp-pdf-card|gp-pdf-card-v2)[^"']*["'][\s\S]*?<\/a>\s*<\/div>/gi, '')
      // 2. Remove gp-pdf-pages-viewer
      .replace(/<div[^>]*class=["'][^"']*(?:gp-pdf-pages-viewer)[^"']*["'][\s\S]*?<\/div>/gi, '')
      // 3. Remove data-pdf-url containers
      .replace(/<div[^>]*data-pdf-url=["'][^"']*["'][\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*data-show-pages=["'][^"']*["'][\s\S]*?<\/div>/gi, '')
      // 4. Remove lingering sub-components of gp-pdf-card (e.g. inner, text, icon-wrap, btn)
      .replace(/<div[^>]*class=["'][^"']*(?:gp-pdf-inner|gp-pdf-text|gp-pdf-icon-wrap)[^"']*["'][\s\S]*?<\/div>/gi, '')
      .replace(/<a[^>]*class=["'][^"']*gp-pdf-btn[^"']*["'][\s\S]*?<\/a>/gi, '')
      // 5. Remove any residual text blocks resembling the PDF card
      .replace(/(?:<div[^>]*>\s*)*(?:<span[^>]*>\s*)*(?:સંદર્ભિત\s+(?:સત્તાવાર|સમાચાર)\s+PDF\s+દસ્તાવેજ|Attached Official Document \(PDF\)|संलग्न आधिकारिक पीडीएफ दस्तावेज़)[\s\S]*?(?:ડાઉનલોડ PDF|Download PDF|डाउनलोड पीडीएफ)(?:\s*<\/span>)*(?:\s*<\/a>)*(?:\s*<\/div>)*/gi, '')
      // 6. Remove any remaining lines with 'ડાઉનલોડ PDF' or 'Download PDF'
      .replace(/<p[^>]*>\s*<a[^>]*download[^>]*>[\s\S]*?<\/a>\s*<\/p>/gi, '')
      // 7. Clean dangling empty tags leftover from stripped wrappers
      .replace(/^[\s\r\n]*(?:<\/(?:div|p|span)>\s*)+/gi, '')
      .replace(/(?:<\/(?:div|p|span)>\s*)+$/gi, '')
      .replace(/<div[^>]*>\s*<\/div>/gi, '')
      .trim();
  };

  // Helper to thoroughly purge any embedded social media figures, cards, blockquotes, and iframes from description text
  const purgeEmbedsFromText = (text: string) => {
    if (!text) return '';
    // Preserve all inline user embeds (Twitter, YouTube, Instagram, Facebook, figures, blockquotes, iframes) inside descriptions
    return text
      .replace(/<div[^>]*class=["'][^"']*(?:gp-x-card)[^"']*["']>[\s\S]*?<\/div>/gi, '')
      .trim();
  };

  // Helper to compile separate section fields into full article body
  const compileStructuredContent = (
    hl: string,
    d1Str: string,
    qT: string,
    qC: string,
    pairedSections: { desc: string; imageUrl: string; showImageAfterDesc?: boolean }[],
    lang: 'en' | 'gu' | 'hi'
  ) => {
    const parts: string[] = [];
    if (hl.trim()) {
      const header = lang === 'gu' ? '## 📌 એક નજરમાં (KEY HIGHLIGHTS)' : lang === 'hi' ? '## 📌 એક નજર મેં (KEY HIGHLIGHTS)' : '## 📌 AT A GLANCE (KEY HIGHLIGHTS)';
      parts.push(`${header}\n--------------------------------------------------\n${hl.trim()}\n--------------------------------------------------`);
    }

    // Build the compiled PDF card & viewer slot block if attached
    let pdfBlockHtml = '';
    if (pdfUrl && pdfUrl.trim()) {
      const cleanPdf = pdfUrl.trim();
      const showPagesAttr = showPdfPages ? 'data-show-pages="true"' : 'data-show-pages="false"';
      const posAttr = `data-pdf-position="${pdfPosition || 'end'}"`;
      const pdfTitle = lang === 'gu'
        ? 'સંદર્ભિત સત્તાવાર PDF દસ્તાવેજ'
        : lang === 'hi'
          ? 'संलग्न आधिकारिक पीडीएफ दस्तावेज़'
          : 'Attached Official Document (PDF)';
      const pdfSub = lang === 'gu'
        ? 'ચકાસાયેલ સત્તાવાર સરકારી / પ્રેસ દસ્તાવેજ'
        : lang === 'hi'
          ? 'सत्यापित आधिकारिक दस्तावेज़'
          : 'Verified Official Document';
      const pdfBtn = lang === 'gu' ? 'ડાઉનલોડ PDF' : lang === 'hi' ? 'डाउनलोड पीडीएफ' : 'Download PDF';

      const cardHtml = `<div class="gp-pdf-card" ${showPagesAttr} ${posAttr} data-pdf-url="${cleanPdf}"><div class="gp-pdf-inner"><div class="gp-pdf-icon-wrap"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div><div class="gp-pdf-text"><span class="gp-pdf-title">${pdfTitle}</span><span class="gp-pdf-sub">${pdfSub}</span></div></div><a href="${cleanPdf}" target="_blank" rel="noopener noreferrer" download class="gp-pdf-btn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>${pdfBtn}</span></a></div>`;

      if (showPdfPages) {
        pdfBlockHtml = `<div class="gp-pdf-pages-viewer" ${showPagesAttr} ${posAttr} data-pdf-url="${cleanPdf}"></div>`;
      } else {
        pdfBlockHtml = cardHtml;
      }
    }

    let pdfPlaced = false;

    // Description 1
    let cleanD1 = purgeEmbedsFromText(purgePdfFromText(d1Str))
      .replace(/^[\s\r\n]*[-*—_]{3,}[\s\r\n]*/, '')
      .replace(/[\s\r\n]*[-*—_]{3,}[\s\r\n]*$/, '')
      .trim();

    if (pdfBlockHtml && /\[PDF_DOCUMENT\]/i.test(cleanD1)) {
      cleanD1 = cleanD1.replace(/\[PDF_DOCUMENT\]/gi, `\n\n${pdfBlockHtml}\n\n`);
      pdfPlaced = true;
    }

    if (cleanD1) {
      parts.push(cleanD1);
    }

    if (!pdfPlaced && pdfBlockHtml && pdfPosition === 'after_desc_1') {
      parts.push(pdfBlockHtml);
      pdfPlaced = true;
    }

    // Story continuation sections: Description N then Image N
    pairedSections.forEach((sec, idx) => {
      const sectionNum = idx + 2;
      let cleanDesc = purgeEmbedsFromText(purgePdfFromText(sec.desc))
        .replace(/^[\s\r\n]*[-*—_]{3,}[\s\r\n]*/, '')
        .replace(/[\s\r\n]*[-*—_]{3,}[\s\r\n]*$/, '')
        .trim();

      if (pdfBlockHtml && !pdfPlaced && /\[PDF_DOCUMENT\]/i.test(cleanDesc)) {
        cleanDesc = cleanDesc.replace(/\[PDF_DOCUMENT\]/gi, `\n\n${pdfBlockHtml}\n\n`);
        pdfPlaced = true;
      }

      if (cleanDesc || (sec.imageUrl && sec.imageUrl.trim())) {
        parts.push(`<!-- gp-section-${sectionNum} -->`);
      }
      if (cleanDesc) {
        parts.push(cleanDesc);
      }
      if (sec.imageUrl && sec.imageUrl.trim()) {
        if (sec.showImageAfterDesc === false) {
          parts.push(`<!-- gp-section-${sectionNum}-hidden-image: ${sec.imageUrl.trim()} -->`);
        } else {
          parts.push(`![Gallery Image ${sectionNum}](${sec.imageUrl.trim()})`);
        }
      }

      if (!pdfPlaced && pdfBlockHtml && pdfPosition === `after_desc_${sectionNum}`) {
        parts.push(pdfBlockHtml);
        pdfPlaced = true;
      }
    });

    if (qT.trim()) {
      const citeStr = qC.trim() ? `\n> — ${qC.trim()}` : '';
      parts.push(`> "${qT.trim()}"${citeStr}`);
    }

    // Append social media embeds if provided in form
    if (youtubeUrl && youtubeUrl.trim()) parts.push(buildArticleEmbedHtml(youtubeUrl.trim(), 'youtube'));
    if (twitterUrl && twitterUrl.trim()) parts.push(buildArticleEmbedHtml(twitterUrl.trim(), 'twitter'));
    if (instagramUrl && instagramUrl.trim()) parts.push(buildArticleEmbedHtml(instagramUrl.trim(), 'instagram'));
    if (facebookUrl && facebookUrl.trim()) parts.push(buildArticleEmbedHtml(facebookUrl.trim(), 'facebook'));

    // If PDF was not placed after description 1 or continuation sections, append it at the end (Default)
    if (!pdfPlaced && pdfBlockHtml) {
      parts.push(pdfBlockHtml);
      pdfPlaced = true;
    }

    return parts.join('\n\n');
  };

  // Helper to copy English draft into empty Gujarati and Hindi fields across all sections
  const copyDraftToTranslations = () => {
    if (!titleGu.trim()) setTitleGu(title);
    if (!titleHi.trim()) setTitleHi(title);
    if (!excerptGu.trim()) setExcerptGu(excerpt);
    if (!excerptHi.trim()) setExcerptHi(excerpt);

    if (!highlightsGu.trim()) setHighlightsGu(highlights);
    if (!highlightsHi.trim()) setHighlightsHi(highlights);

    if (!desc1Gu.trim()) setDesc1Gu(desc1);
    if (!desc1Hi.trim()) setDesc1Hi(desc1);

    if (!quoteTextGu.trim()) setQuoteTextGu(quoteText);
    if (!quoteTextHi.trim()) setQuoteTextHi(quoteText);

    if (!quoteCiteGu.trim()) setQuoteCiteGu(quoteCite);
    if (!quoteCiteHi.trim()) setQuoteCiteHi(quoteCite);

    setStorySections((prev) =>
      prev.map((slot) => ({
        ...slot,
        descGu: slot.descGu.trim() ? slot.descGu : slot.descEn,
        descHi: slot.descHi.trim() ? slot.descHi : slot.descEn,
      }))
    );

    if (!contentGu.trim()) setContentGu(content);
    if (!contentHi.trim()) setContentHi(content);
  };

  const pickSourceForTranslation = (
    target: 'en' | 'gu' | 'hi',
    values: { en?: string; gu?: string; hi?: string }
  ) => {
    const orderedSources =
      target === 'hi'
        ? [values.gu, values.en]
        : target === 'gu'
          ? [values.hi, values.en]
          : [values.gu, values.hi];

    return orderedSources.find((value) => value && value.trim())?.trim() || '';
  };

  const translateDraftToSelectedLanguage = async () => {
    const target = articleLanguage;
    const targetLabel = target === 'hi' ? 'Hindi' : target === 'gu' ? 'Gujarati' : 'English';

    const sourceTitle = pickSourceForTranslation(target, { en: title, gu: titleGu, hi: titleHi });
    const sourceExcerpt = pickSourceForTranslation(target, { en: excerpt, gu: excerptGu, hi: excerptHi });
    const sourceHighlights = pickSourceForTranslation(target, { en: highlights, gu: highlightsGu, hi: highlightsHi });
    const sourceDesc1 = pickSourceForTranslation(target, { en: desc1, gu: desc1Gu, hi: desc1Hi });
    const sourceQuoteText = pickSourceForTranslation(target, { en: quoteText, gu: quoteTextGu, hi: quoteTextHi });
    const sourceQuoteCite = pickSourceForTranslation(target, { en: quoteCite, gu: quoteCiteGu, hi: quoteCiteHi });
    const sourceContent = pickSourceForTranslation(target, { en: content, gu: contentGu, hi: contentHi });

    if (!sourceTitle && !sourceExcerpt && !sourceHighlights && !sourceDesc1 && !sourceQuoteText && !sourceQuoteCite && !sourceContent) {
      setError(`Add content in another language before translating to ${targetLabel}.`);
      return;
    }

    setError(null);
    setTranslatingLanguage(true);

    try {
      const translateField = async (value: string) => {
        if (!value.trim()) return '';
        return translateOnFly(value, target);
      };

      const [
        translatedTitle,
        translatedExcerpt,
        translatedHighlights,
        translatedDesc1,
        translatedQuoteText,
        translatedQuoteCite,
        translatedContent,
      ] = await Promise.all([
        translateField(sourceTitle),
        translateField(sourceExcerpt),
        translateField(sourceHighlights),
        translateField(sourceDesc1),
        translateField(sourceQuoteText),
        translateField(sourceQuoteCite),
        translateField(sourceContent),
      ]);

      const translatedStorySections = await Promise.all(
        storySections.map(async (slot) => {
          const source = pickSourceForTranslation(target, { en: slot.descEn, gu: slot.descGu, hi: slot.descHi });
          if (!source) return slot;
          const translated = await translateOnFly(source, target);
          if (target === 'hi') return { ...slot, descHi: translated };
          if (target === 'gu') return { ...slot, descGu: translated };
          return { ...slot, descEn: translated };
        })
      );

      if (target === 'hi') {
        if (translatedTitle) setTitleHi(translatedTitle);
        if (translatedExcerpt) setExcerptHi(translatedExcerpt);
        if (translatedHighlights) setHighlightsHi(translatedHighlights);
        if (translatedDesc1) setDesc1Hi(translatedDesc1);
        if (translatedQuoteText) setQuoteTextHi(translatedQuoteText);
        if (translatedQuoteCite) setQuoteCiteHi(translatedQuoteCite);
        if (translatedContent) setContentHi(translatedContent);
      } else if (target === 'gu') {
        if (translatedTitle) setTitleGu(translatedTitle);
        if (translatedExcerpt) setExcerptGu(translatedExcerpt);
        if (translatedHighlights) setHighlightsGu(translatedHighlights);
        if (translatedDesc1) setDesc1Gu(translatedDesc1);
        if (translatedQuoteText) setQuoteTextGu(translatedQuoteText);
        if (translatedQuoteCite) setQuoteCiteGu(translatedQuoteCite);
        if (translatedContent) setContentGu(translatedContent);
      } else {
        if (translatedTitle) setTitle(translatedTitle);
        if (translatedExcerpt) setExcerpt(translatedExcerpt);
        if (translatedHighlights) setHighlights(translatedHighlights);
        if (translatedDesc1) setDesc1(translatedDesc1);
        if (translatedQuoteText) setQuoteText(translatedQuoteText);
        if (translatedQuoteCite) setQuoteCite(translatedQuoteCite);
        if (translatedContent) setContent(translatedContent);
      }

      setStorySections(translatedStorySections);
      setContentLang(target);
    } catch (err: any) {
      console.error('Language translation failed:', err);
      setError(err?.message || `Failed to translate article content to ${targetLabel}.`);
    } finally {
      setTranslatingLanguage(false);
    }
  };


  // Logged-in user state
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userAuthorId, setUserAuthorId] = useState<string | null>(null);
  const [userAuthorName, setUserAuthorName] = useState<string | null>(null);

  // Load initial choices (categories, authors, locations & auth profile)
  useEffect(() => {
    // 1. Immediately hydrate custom locations from localStorage
    try {
      const savedLocal = localStorage.getItem('gp_custom_locations');
      if (savedLocal) {
        const parsed: SelectOption[] = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomLocations(parsed);
        }
      }
    } catch (e) {
      // ignore
    }

    async function loadSelectors() {
      try {
        const [catRes, autRes, meRes, locRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/authors'),
          fetch('/api/auth/me'),
          fetch('/api/admin/articles/locations').catch(() => null),
        ]);
        const catJson = await catRes.json();
        const autJson = await autRes.json();
        const meJson = await meRes.json();

        // Merge custom locations and used locations from database
        if (locRes && locRes.ok) {
          try {
            const locJson = await locRes.json();
            const backendCustom: Array<{ id?: string; name: string; sublabel?: string | null }> = locJson.data?.customLocations || [];
            const backendUsed: string[] = locJson.data?.usedLocations || [];

            const standardSet = new Set(LOCATION_OPTIONS.map((o) => o.value.toLowerCase()));
            const serverOptions: SelectOption[] = [];

            for (const item of backendCustom) {
              const val = item.name?.trim();
              if (val && !standardSet.has(val.toLowerCase())) {
                serverOptions.push({
                  value: val,
                  label: val,
                  sublabel: item.sublabel?.trim() || 'Custom',
                });
              }
            }

            for (const locStr of backendUsed) {
              const val = locStr?.trim();
              if (val && !standardSet.has(val.toLowerCase()) && !serverOptions.some((o) => o.value.toLowerCase() === val.toLowerCase())) {
                serverOptions.push({
                  value: val,
                  label: val,
                  sublabel: 'Custom',
                });
              }
            }

            setCustomLocations((prev) => {
              const map = new Map<string, SelectOption>();
              for (const item of prev) {
                map.set(item.value.toLowerCase(), item);
              }
              for (const item of serverOptions) {
                if (!map.has(item.value.toLowerCase())) {
                  map.set(item.value.toLowerCase(), item);
                }
              }
              const merged = Array.from(map.values());
              try {
                localStorage.setItem('gp_custom_locations', JSON.stringify(merged));
              } catch { }
              return merged;
            });
          } catch (locErr) {
            console.warn('Could not parse backend locations:', locErr);
          }
        }

        if (catRes.ok) {
          const rawCats: any[] = catJson.data?.categories || catJson.data || [];
          const filtered = rawCats.filter((c) => !isDisplayOnlySectionCategory(c));
          setCategories(filtered);
          // Do not auto-select Gujarat or any category by default. Admin must choose explicitly.
          // Do not auto-set location to Gujarat by default.
        }
        if (autRes.ok) setAuthors(autJson.data?.authors || autJson.data || []);

        if (meRes.ok && meJson.data?.user) {
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

    const handleCategoriesUpdated = () => {
      fetch('/api/admin/categories')
        .then((res) => res.json())
        .then((catJson) => {
          const rawCats: any[] = catJson.data?.categories || catJson.data || [];
          const filtered = rawCats.filter((c) => !isDisplayOnlySectionCategory(c));
          setCategories(filtered);
        })
        .catch(() => {});
    };
    window.addEventListener('gp-categories-updated', handleCategoriesUpdated);
    return () => {
      window.removeEventListener('gp-categories-updated', handleCategoriesUpdated);
    };
  }, []);

  // Parse body string into distinct sections (Highlights, Desc1, Story Sections, Quote, Embeds)
  const parseBodyToSections = (raw: string) => {
    let hl = '';
    let d1Str = '';
    let qT = '';
    let qC = '';
    let extractedYt = '';
    let extractedTw = '';
    let extractedIg = '';
    let extractedFb = '';
    let extractedPdfUrl = '';
    let hasPdfPages = false;
    let extractedPdfPosition = 'end';
    const extractedImgs: { index: number; url: string; showImageAfterDesc?: boolean }[] = [];
    const extractedDescsMap: { index: number; text: string }[] = [];

    if (!raw) return { hl, d1Str, qT, qC, extractedDescsMap, extractedImgs, extractedYt, extractedTw, extractedIg, extractedFb, extractedPdfUrl, hasPdfPages, extractedPdfPosition };

    const pdfMatch =
      raw.match(/data-pdf-url=["']([^"']+)["']/i) ||
      raw.match(/class=["'][^"']*(?:gp-pdf-card|gp-pdf-pages-viewer)[^"']*["'][^>]*data-pdf-url=["']([^"']+)["']/i) ||
      raw.match(/gp-pdf-card[\s\S]*?href=["']([^"']+)["']/i) ||
      raw.match(/href=["']([^"']+\.pdf(?:\?[^"']*)?|\/uploads\/[^"']+\.pdf(?:\?[^"']*)?)["']/i) ||
      raw.match(/href=["']([^"']+)["'][^>]*download/i) ||
      raw.match(/download[^>]*href=["']([^"']+)["']/i) ||
      raw.match(/src=["']([^"']+\.pdf(?:\?[^"']*)?)["']/i) ||
      raw.match(/(https?:\/\/[^\s"'<>]+\.pdf(?:\?[^\s"'<>]*)?|\/uploads\/[^\s"'<>]+\.pdf(?:\?[^\s"'<>]*)?)/i);
    if (pdfMatch && pdfMatch[1]) extractedPdfUrl = pdfMatch[1];

    if (raw.includes('data-show-pages="true"') || raw.includes('gp-pdf-pages-viewer')) {
      hasPdfPages = true;
    }

    extractedPdfPosition = 'end';
    const posAttrMatch = raw.match(/data-pdf-position=["']([^"']+)["']/i);
    if (posAttrMatch && posAttrMatch[1]) {
      extractedPdfPosition = posAttrMatch[1];
    } else if (/\[PDF_DOCUMENT\]/i.test(raw)) {
      extractedPdfPosition = 'custom';
    } else if (extractedPdfUrl) {
      const pdfIdx = raw.search(/class=["'][^"']*(?:gp-pdf-card|gp-pdf-pages-viewer)[^"']*["']/i);
      if (pdfIdx !== -1) {
        const secMatches = [...raw.matchAll(/<!--\s*gp-section-(\d+)\s*-->/gi)];
        if (secMatches.length > 0) {
          if (pdfIdx < secMatches[0].index) {
            extractedPdfPosition = 'after_desc_1';
          } else {
            for (let i = 0; i < secMatches.length; i++) {
              const currentSecNum = parseInt(secMatches[i][1], 10);
              const nextSecIdx = i < secMatches.length - 1 ? secMatches[i + 1].index : Infinity;
              if (pdfIdx > secMatches[i].index && pdfIdx < nextSecIdx) {
                extractedPdfPosition = `after_desc_${currentSecNum}`;
                break;
              }
            }
          }
        }
      }
    }

    // Extract all gallery images with their numbers (e.g. ![Gallery Image 2](...))
    const galleryRegex = /!\[Gallery Image (\d+)\]\((https?:\/\/[^\s)]+|\/uploads\/[^\s)]+|\/assets\/[^\s)]+)\)/gi;
    let gMatch: RegExpExecArray | null;
    while ((gMatch = galleryRegex.exec(raw)) !== null) {
      if (gMatch[2]) {
        const num = parseInt(gMatch[1], 10) || 2;
        extractedImgs.push({ index: num, url: gMatch[2], showImageAfterDesc: true });
      }

        // Extract hidden section images (showImageAfterDesc = false)
        const hiddenImgRegex = /<!--\s*gp-section-(\d+)-hidden-image:\s*([^\s>]+)\s*-->/gi;
        let hMatch: RegExpExecArray | null;
        while ((hMatch = hiddenImgRegex.exec(raw)) !== null) {
          if (hMatch[2]) {
            const num = parseInt(hMatch[1], 10) || 2;
            extractedImgs.push({ index: num, url: hMatch[2], showImageAfterDesc: false });
          }
        }
    }

    // Purge PDF markup from working string
    let workingRaw = purgePdfFromText(raw).trim();

    // Strip and extract ONLY trailing standalone embeds from the very end of the content.
    // In-body embeds (inside Description 1 or continuation sections) are preserved untouched.
    const trailingEmbedPattern = /(?:<p[^>]*>\s*(?:<br\s*\/?>)?\s*<\/p>\s*)*(?:<figure\b[^>]*(?:data-article-social-platform|data-social-platform)=["']([^"']+)["'][^>]*>(?:(?!<\/figure>)[\s\S])*<\/figure>|<div[^>]*class=["'][^"']*(?:gp-twitter-embed-wrap|gp-x-card|gp-x-link)[^"']*["']>(?:(?!<\/div>)[\s\S])*<\/div>|<blockquote[^>]*class=["'][^"']*twitter-tweet[^"']*["'][\s\S]*?<\/blockquote>(?:\s*<script[^>]*widgets\.js[^>]*><\/script>)?|<div[^>]*aspect-video[^>]*>[\s\S]*?<\/iframe>\s*<\/div>|<div[^>]*max-w-\[540px\][^"']*["']>[\s\S]*?<\/iframe>\s*<\/div>)(?:\s*<p[^>]*>\s*(?:<br\s*\/?>)?\s*<\/p>)*\s*$/i;

    while (true) {
      const match = workingRaw.match(trailingEmbedPattern);
      if (!match) break;
      const platMatch = match[0].match(/(?:data-article-social-platform|data-social-platform)=["']([^"']+)["']/i);
      const urlMatch =
        match[0].match(/(?:data-article-social-url|data-social-url|data-tweet-url)=["']([^"']+)["']/i) ||
        match[0].match(/href=["']([^"']+)["']/i);
      const plat = platMatch ? platMatch[1].toLowerCase() : '';
      const u = urlMatch ? urlMatch[1] : '';
      if (plat === 'twitter' || (!plat && (match[0].includes('twitter') || match[0].includes('x.com') || match[0].includes('gp-x')))) {
        if (!extractedTw) extractedTw = u;
      } else if (plat === 'youtube' || (!plat && match[0].includes('youtube'))) {
        if (!extractedYt) extractedYt = u;
      } else if (plat === 'instagram' || (!plat && match[0].includes('instagram'))) {
        if (!extractedIg) extractedIg = u;
      } else if (plat === 'facebook' || (!plat && match[0].includes('facebook'))) {
        if (!extractedFb) extractedFb = u;
      }
      workingRaw = workingRaw.slice(0, match.index).trim();
    }

    // Extract quote block
    const quoteRegex = /(?:^|\n)(>[^\n]*(?:\n>[^\n]*)*)/;
    const qMatch = workingRaw.match(quoteRegex);
    if (qMatch) {
      const qBlock = qMatch[1];
      const lines = qBlock.split('\n');
      const quoteLines = lines.filter((l) => l.startsWith('> "') || l.startsWith('>"') || (l.startsWith('> ') && !l.startsWith('> —') && !l.startsWith('> -')));
      const citeLine = lines.find((l) => l.includes('> —') || l.includes('> -'));
      qT = quoteLines.map((l) => l.replace(/^>\s*"?/, '').replace(/"?$/, '')).join('\n');
      if (citeLine) {
        qC = citeLine.replace(/^>\s*—\s*/, '').replace(/^>\s*-\s*/, '').trim();
      }
      workingRaw = workingRaw.replace(qBlock, '');
    }

    // Extract highlights block: handles ## header, dashed block, HTML wrappers, and plain text highlights
    const hlHeaderRegex = /(?:^|\n)\s*(?:<p[^>]*>)?\s*(?:##\s*)?📌?\s*(?:એક નજરમાં|एक नजर में|AT A GLANCE|KEY HIGHLIGHTS|HIGHLIGHTS)[^\n<]*(?:<\/p>)?/i;
    const hlMatch = workingRaw.match(hlHeaderRegex);

    if (hlMatch && hlMatch.index !== undefined) {
      const startIndex = hlMatch.index;
      const matchLen = hlMatch[0].length;
      const afterHeader = workingRaw.slice(startIndex + matchLen);
      const lines = afterHeader.split('\n');
      const collectedLines: string[] = [];
      let consumedLineCount = 0;
      let seenOpeningDashes = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Check dashed divider (e.g. ---------------------- or <p>----</p>)
        const isDashes = /^[-*—_]{3,}$/.test(trimmed) || /^(?:<p[^>]*>)?\s*[-*—_]{3,}\s*(?:<\/p>)?$/i.test(trimmed);
        if (isDashes) {
          if (!seenOpeningDashes && collectedLines.length === 0) {
            seenOpeningDashes = true;
            consumedLineCount = i + 1;
            continue;
          } else {
            // Closing dashes reached
            consumedLineCount = i + 1;
            break;
          }
        }

        // Check if we reached another section or media block
        if (
          trimmed.startsWith('<!-- gp-section') ||
          trimmed.startsWith('## ') ||
          trimmed.startsWith('![Gallery Image') ||
          trimmed.startsWith('> "') ||
          trimmed.startsWith('>"')
        ) {
          break;
        }

        // If seen opening dashes and we hit a standard HTML tag that is NOT a bullet point or paragraph
        if (seenOpeningDashes && (trimmed.startsWith('<div') || trimmed.startsWith('<figure') || (trimmed.startsWith('<span') && !trimmed.includes('•')))) {
          break;
        }

        // If no dashes were used, an empty line marks end of header highlights block
        if (!seenOpeningDashes && !trimmed && collectedLines.length > 0) {
          consumedLineCount = i + 1;
          break;
        }

        if (trimmed) {
          const cleanText = trimmed
            .replace(/<[^>]*>/g, '')
            .replace(/^[•*\-#\s]+/, '')
            .trim();
          if (
            cleanText &&
            !/^[-*—_]{3,}$/.test(cleanText) &&
            !cleanText.includes('HIGHLIGHTS') &&
            !cleanText.includes('એક નજરમાં') &&
            !cleanText.includes('एक नजर में') &&
            !cleanText.includes('AT A GLANCE')
          ) {
            collectedLines.push(`• ${cleanText}`);
          }
          consumedLineCount = i + 1;
        } else {
          if (collectedLines.length > 0) {
            consumedLineCount = i + 1;
          }
        }
      }

      if (collectedLines.length > 0) {
        hl = collectedLines.join('\n').trim();
        const consumedChars = lines.slice(0, consumedLineCount).join('\n').length;
        workingRaw = workingRaw.slice(0, startIndex) + workingRaw.slice(startIndex + matchLen + consumedChars);
      }
    } else {
      // 2. Dashed line block at the beginning without header: ----- text -----
      const dashedRegex = /^[\s\r\n]*[-*—_]{3,}[\s\r\n]+([\s\S]*?)[\s\r\n]+[-*—_]{3,}[\s\r\n]*/;
      const dashedMatch = workingRaw.match(dashedRegex);
      if (dashedMatch) {
        const lines = dashedMatch[1]
          .split('\n')
          .map((l) => l.replace(/<[^>]*>/g, '').replace(/^[•*\-#\s]+/, '').trim())
          .filter((l) => l && !l.startsWith('#') && !/^[-*—_]{3,}$/.test(l));
        if (lines.length > 0) {
          hl = lines.map(l => `• ${l}`).join('\n');
          workingRaw = workingRaw.replace(dashedMatch[0], '');
        }
      } else {
        // 3. Plain text / HTML heading fallback
        const plainHlRegex = /^(?:<p[^>]*>)?\s*(?:📌|##)?\s*(?:એક નજરમાં|एक नजर में|AT A GLANCE|KEY HIGHLIGHTS|HIGHLIGHTS)[^<\n]*\s*(?:<\/p>)?[\s\r\n]*[-*—_]*[\s\r\n]*([\s\S]*?)(?:[-*—_]{3,}|(?=<h[1-6]|<p|<div|<!-- gp-section)|$)/i;
        const plainHlMatch = workingRaw.match(plainHlRegex);
        if (plainHlMatch) {
          const cleanLines = plainHlMatch[1]
            .replace(/<[^>]*>/g, '\n')
            .split('\n')
            .map((l) => l.replace(/^[•*\-#\s]+/, '').trim())
            .filter((l) => l && !/^[-*—_]{3,}$/.test(l) && !l.includes('HIGHLIGHTS') && !l.includes('એક નજરમાં') && !l.includes('एक नजर में') && !l.includes('AT A GLANCE'));
          if (cleanLines.length > 0) {
            hl = cleanLines.map((l) => `• ${l}`).join('\n');
          }
          workingRaw = workingRaw.replace(plainHlMatch[0], '');
        }
      }
    }

    // Check if new structured section delimiters <!-- gp-section-N --> exist
    if (/<!--\s*gp-section-\d+\s*-->/.test(workingRaw)) {
      const parts = workingRaw.split(/<!--\s*gp-section-(\d+)\s*-->/);
      d1Str = purgePdfFromText(parts[0].replace(/!\[Gallery Image \d+\]\([^\s)]+\)/gi, '').replace(/<!--\s*gp-section-\d+-hidden-image:[^>]*-->/gi, '').trim())
        .replace(/^[\s\r\n]*[-*—_]{3,}[\s\r\n]*/, '')
        .replace(/[\s\r\n]*[-*—_]{3,}[\s\r\n]*$/, '')
        .trim();
      for (let i = 1; i < parts.length; i += 2) {
        const secNum = parseInt(parts[i], 10);
        const secContent = parts[i + 1] || '';
        const cleanSecText = purgePdfFromText(secContent.replace(/!\[Gallery Image \d+\]\([^\s)]+\)/gi, '').replace(/<!--\s*gp-section-\d+-hidden-image:[^>]*-->/gi, '').trim())
          .replace(/^[\s\r\n]*[-*—_]{3,}[\s\r\n]*/, '')
          .replace(/[\s\r\n]*[-*—_]{3,}[\s\r\n]*$/, '')
          .trim();
        extractedDescsMap.push({ index: secNum, text: cleanSecText });
      }
    } else {
      // Backward compatibility: parse legacy markdown body
      workingRaw = workingRaw.replace(/!\[Gallery Image 2\]\([^\s)]+\)/gi, '\n\n__GP_DELIM_IMG2__\n\n');
      workingRaw = workingRaw.replace(/!\[Gallery Image \d+\]\([^\s)]+\)/gi, '\n\n');
      const paragraphs = workingRaw.split(/\n\n+/);
      const d1Paras: string[] = [];
      const d2Paras: string[] = [];
      let pastImg2 = false;

      for (const p of paragraphs) {
        const trimmed = p.trim();
        if (!trimmed) continue;
        if (trimmed === '__GP_DELIM_IMG2__' || trimmed.includes('__GP_DELIM_IMG2__')) {
          pastImg2 = true;
          continue;
        }
        if (!trimmed.startsWith('---') && !trimmed.startsWith('***')) {
          const cleanP = purgePdfFromText(trimmed.replace(/__GP_DELIM_IMG2__/g, ''))
            .replace(/^[\s\r\n]*[-*—_]{3,}[\s\r\n]*/, '')
            .replace(/[\s\r\n]*[-*—_]{3,}[\s\r\n]*$/, '')
            .trim();
          if (cleanP) {
            if (!pastImg2) d1Paras.push(cleanP);
            else d2Paras.push(cleanP);
          }
        }
      }
      d1Str = d1Paras.join('\n\n').trim();
      if (d2Paras.length > 0) {
        extractedDescsMap.push({ index: 2, text: d2Paras.join('\n\n').trim() });
      }
    }

    if (!d1Str && !hl && !qT && extractedDescsMap.length === 0) {
      d1Str = purgePdfFromText(raw.trim())
        .replace(/^[\s\r\n]*[-*—_]{3,}[\s\r\n]*/, '')
        .replace(/[\s\r\n]*[-*—_]{3,}[\s\r\n]*$/, '')
        .trim();
    }

    return {
      hl,
      d1Str,
      qT,
      qC,
      extractedDescsMap,
      extractedImgs,
      extractedYt,
      extractedTw,
      extractedIg,
      extractedFb,
      extractedPdfUrl,
      hasPdfPages,
      extractedPdfPosition,
    };
  };

  // Load article values if in edit mode
  useEffect(() => {
    if (!isEditMode || !articleId) return;

    async function loadArticle() {
      try {
        setFetching(true);
        const res = await authFetch(getBackendApiUrl(`/api/admin/articles/${articleId}`));
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load article.');

        const art = json.data?.article || json.data;

        // Enforce reporter permissions: they can only edit their own articles
        if (userRole === 'REPORTER' && userAuthorId && art.authorId !== userAuthorId) {
          setError('Forbidden: You are not authorized to edit other authors\' articles.');
          setFetching(false);
          return;
        }

        const lang = (art.language as 'gu' | 'en' | 'hi') || 'gu';
        setArticleLanguage(lang);
        setContentLang(lang);

        let primaryTitle = '';
        let primaryExcerpt = '';
        let primaryContent = '';

        if (lang === 'gu') {
          primaryTitle = art.titleGu || art.title || '';
          primaryExcerpt = art.excerptGu || art.excerpt || '';
          primaryContent = art.contentGu || art.content || '';
        } else if (lang === 'en') {
          primaryTitle = art.title || art.titleGu || '';
          primaryExcerpt = art.excerpt || art.excerptGu || '';
          primaryContent = art.content || art.contentGu || '';
        } else if (lang === 'hi') {
          primaryTitle = art.titleHi || art.title || '';
          primaryExcerpt = art.excerptHi || art.excerpt || '';
          primaryContent = art.contentHi || art.content || '';
        }

        setSlug(art.slug || '');
        if (art.slug) {
          hasManuallyEditedSlug.current = true;
          hasAutoGeneratedSlugOnce.current = true;
          setIsSlugBlocked(true);
        }
        setArticleNumber(art.articleNumber ?? '');
        setTitle(primaryTitle);
        setTitleGu(art.titleGu || primaryTitle);
        setTitleHi(art.titleHi || primaryTitle);

        setExcerpt(primaryExcerpt);
        setExcerptGu(art.excerptGu || primaryExcerpt);
        setExcerptHi(art.excerptHi || primaryExcerpt);

        setContent(primaryContent);
        setContentGu(art.contentGu || primaryContent);
        setContentHi(art.contentHi || primaryContent);

        // Auto select language tab if article was authored in Gujarati or Hindi
        if (art.titleGu && !art.title) {
          setContentLang('gu');
        } else if (art.titleHi && !art.title) {
          setContentLang('hi');
        }

        // Parse content into distinct section fields
        const parsedEn = parseBodyToSections(art.content || primaryContent);
        const parsedGu = parseBodyToSections(art.contentGu || primaryContent);
        const parsedHi = parseBodyToSections(art.contentHi || primaryContent);

        // Helper to format highlights into clean bullet points
        const formatHlBullets = (rawHl: string) => {
          if (!rawHl) return '';
          return rawHl
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l) => (l.startsWith('•') ? l : `• ${l}`))
            .join('\n');
        };

        const cleanGistText = (s: string) => {
          return (s || '')
            .replace(/<[^>]*>/g, '')
            .replace(/^[•*\-#\d\.\s📌]+/, '')
            .replace(/[📌]/gi, '')
            .replace(/#+/g, '')
            .replace(/\(KEY HIGHLIGHTS\)/gi, '')
            .replace(/એક નજરમાં/gi, '')
            .replace(/एक नजर में/gi, '')
            .replace(/AT A GLANCE/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        };

        const excerptGuClean = cleanGistText(art.excerptGu || art.excerpt || '');
        const excerptEnClean = cleanGistText(art.excerpt || art.excerptGu || '');
        const excerptHiClean = cleanGistText(art.excerptHi || art.excerpt || '');

        let rawHlGu = art.highlightsGu || parsedGu.hl || '';
        let rawHlEn = art.highlights || parsedEn.hl || '';
        let rawHlHi = art.highlightsHi || parsedHi.hl || '';

        // If parsed highlight was just an auto-injected copy of the excerpt from the old fallback bug, treat as empty
        if (cleanGistText(rawHlGu) && cleanGistText(rawHlGu) === excerptGuClean) {
          rawHlGu = '';
        }
        if (cleanGistText(rawHlEn) && cleanGistText(rawHlEn) === excerptEnClean) {
          rawHlEn = '';
        }
        if (cleanGistText(rawHlHi) && cleanGistText(rawHlHi) === excerptHiClean) {
          rawHlHi = '';
        }

        const hlGu = formatHlBullets(rawHlGu);
        const hlEn = formatHlBullets(rawHlEn);
        const hlHi = formatHlBullets(rawHlHi);

        setHighlights(hlEn);
        setDesc1(parsedEn.d1Str || '');
        setQuoteText(parsedEn.qT || '');
        setQuoteCite(parsedEn.qC || '');

        setHighlightsGu(hlGu);
        setDesc1Gu(parsedGu.d1Str || parsedEn.d1Str || '');
        setQuoteTextGu(parsedGu.qT || parsedEn.qT || '');
        setQuoteCiteGu(parsedGu.qC || parsedEn.qC || '');

        setHighlightsHi(hlHi);
        setDesc1Hi(parsedHi.d1Str || parsedEn.d1Str || '');
        setQuoteTextHi(parsedHi.qT || parsedEn.qT || '');
        setQuoteCiteHi(parsedHi.qC || parsedEn.qC || '');

        // Assemble paired story continuation sections (Section 2 to Section 10)
        const artImages: { index: number; url: string }[] = [
          { index: 2, url: art.image2 || art.galleryImage2 || art.secondaryImage || '' },
          { index: 3, url: art.image3 || '' },
          { index: 4, url: art.image4 || '' },
          { index: 5, url: art.image5 || '' },
          { index: 6, url: art.image6 || '' },
          { index: 7, url: art.image7 || '' },
          { index: 8, url: art.image8 || '' },
          { index: 9, url: art.image9 || '' },
          { index: 10, url: art.image10 || '' },
        ].filter((item) => item.url && item.url !== art.featuredImage);

        if (Array.isArray(art.galleryImages)) {
          art.galleryImages.forEach((url: string, i: number) => {
            const secIdx = i + 2;
            if (secIdx <= 10 && url && !artImages.some((x) => x.index === secIdx)) {
              artImages.push({ index: secIdx, url });
            }
          });
        }

        const allParsedImgs = [
          ...(parsedEn.extractedImgs || []),
          ...(parsedGu.extractedImgs || []),
          ...(parsedHi.extractedImgs || []),
        ];

        const allParsedDescsEn = parsedEn.extractedDescsMap || [];
        const allParsedDescsGu = parsedGu.extractedDescsMap || [];
        const allParsedDescsHi = parsedHi.extractedDescsMap || [];

        const indices = [
          2,
          ...artImages.map((x) => x.index),
          ...allParsedImgs.map((x) => x.index),
          ...allParsedDescsEn.map((x) => x.index),
          ...allParsedDescsGu.map((x) => x.index),
          ...allParsedDescsHi.map((x) => x.index),
        ];
        const maxSectionNum = Math.min(Math.max(...indices), 10);

        const loadedStorySections: StorySectionSlot[] = [];
        for (let num = 2; num <= maxSectionNum; num++) {
          const descEn = allParsedDescsEn.find((d) => d.index === num)?.text || (num === 2 ? art.desc2 || '' : '');
          const descGu = allParsedDescsGu.find((d) => d.index === num)?.text || (num === 2 ? art.desc2Gu || descEn : descEn);
          const descHi = allParsedDescsHi.find((d) => d.index === num)?.text || (num === 2 ? art.desc2Hi || descEn : descEn);

          const foundImg =
            artImages.find((img) => img.index === num)?.url ||
            allParsedImgs.find((img) => img.index === num)?.url ||
            '';
          const sanitizedImg = sanitizeImageUrl(foundImg);

          loadedStorySections.push({
            id: `section-${num}`,
            descEn,
            descGu,
            descHi,
            imageUrl: sanitizedImg,
            imageMode: sanitizedImg.startsWith('http://') || sanitizedImg.startsWith('https://') ? 'url' : 'upload',
            imageUploading: false,
          });
        }

        if (loadedStorySections.length === 0) {
          loadedStorySections.push({
            id: 'section-2',
            descEn: art.desc2 || '',
            descGu: art.desc2Gu || art.desc2 || '',
            descHi: art.desc2Hi || art.desc2 || '',
            imageUrl: sanitizeImageUrl(art.image2 || ''),
            imageMode: 'upload',
            imageUploading: false,
          });
        }
        setStorySections(loadedStorySections);

        const cleanFeat = sanitizeImageUrl(art.featuredImage || '');
        setFeaturedImage(cleanFeat);
        const initialPrimary = cleanFeat ? [cleanFeat] : [];
        if (Array.isArray(art.galleryImages)) {
          art.galleryImages.forEach((img: string) => {
            if (img && typeof img === 'string' && img.trim()) {
              const clean = sanitizeImageUrl(img);
              if (!initialPrimary.includes(clean)) initialPrimary.push(clean);
            }
          });
        }
        setPrimaryMediaList(initialPrimary);
        if (cleanFeat && (cleanFeat.startsWith('http://') || cleanFeat.startsWith('https://'))) {
          setImageMode('url');
        } else {
          setImageMode('upload');
        }
        const rawCombinedContent = [art.content, art.contentGu, art.contentHi, primaryContent].filter(Boolean).join('\n\n');

        const resolvedYt =
          getSavedArticleEmbedInput(rawCombinedContent, 'youtube') ||
          parsedGu.extractedYt ||
          parsedEn.extractedYt ||
          parsedHi.extractedYt ||
          art.youtubeUrl ||
          art.youtube ||
          '';
        const resolvedTw =
          getSavedArticleEmbedInput(rawCombinedContent, 'twitter') ||
          parsedGu.extractedTw ||
          parsedEn.extractedTw ||
          parsedHi.extractedTw ||
          art.twitterUrl ||
          art.twitter ||
          '';
        const resolvedIg =
          getSavedArticleEmbedInput(rawCombinedContent, 'instagram') ||
          parsedGu.extractedIg ||
          parsedEn.extractedIg ||
          parsedHi.extractedIg ||
          art.instagramUrl ||
          art.instagram ||
          '';
        const resolvedFb =
          getSavedArticleEmbedInput(rawCombinedContent, 'facebook') ||
          parsedGu.extractedFb ||
          parsedEn.extractedFb ||
          parsedHi.extractedFb ||
          art.facebookUrl ||
          art.facebook ||
          '';

        setYoutubeUrl(resolvedYt);
        setTwitterUrl(resolvedTw);
        setInstagramUrl(resolvedIg);
        setFacebookUrl(resolvedFb);
        const fallbackPdfMatch =
          rawCombinedContent.match(/data-pdf-url=["']([^"']+)["']/i) ||
          rawCombinedContent.match(/class=["'][^"']*(?:gp-pdf-card|gp-pdf-pages-viewer)[^"']*["'][^>]*data-pdf-url=["']([^"']+)["']/i) ||
          rawCombinedContent.match(/gp-pdf-card[\s\S]*?href=["']([^"']+)["']/i) ||
          rawCombinedContent.match(/href=["']([^"']+\.pdf(?:\?[^"']*)?|\/uploads\/[^"']+\.pdf(?:\?[^"']*)?)["']/i) ||
          rawCombinedContent.match(/href=["']([^"']+)["'][^>]*download/i) ||
          rawCombinedContent.match(/download[^>]*href=["']([^"']+)["']/i) ||
          rawCombinedContent.match(/src=["']([^"']+\.pdf(?:\?[^"']*)?)["']/i) ||
          rawCombinedContent.match(/(https?:\/\/[^\s"'<>]+\.pdf(?:\?[^\s"'<>]*)?|\/uploads\/[^\s"'<>]+\.pdf(?:\?[^\s"'<>]*)?)/i);
        const fallbackPdfUrl = fallbackPdfMatch ? fallbackPdfMatch[1] : '';

        const resolvedPdfUrl =
          art.pdfUrl ||
          art.pdf ||
          parsedGu.extractedPdfUrl ||
          parsedEn.extractedPdfUrl ||
          parsedHi.extractedPdfUrl ||
          fallbackPdfUrl ||
          '';

        setPdfUrl(resolvedPdfUrl);

        const fallbackHasPdfPages = Boolean(
          rawCombinedContent.includes('data-show-pages="true"') ||
          rawCombinedContent.includes('gp-pdf-pages-viewer')
        );

        setShowPdfPages(
          Boolean(
            (art as any).showPdfPages ||
            parsedGu.hasPdfPages ||
            parsedEn.hasPdfPages ||
            parsedHi.hasPdfPages ||
            fallbackHasPdfPages
          )
        );

        const fallbackPdfPosition =
          rawCombinedContent.match(/data-pdf-position=["']([^"']+)["']/i)?.[1] ||
          (/[PDF_DOCUMENT]/i.test(rawCombinedContent) ? 'custom' : 'end');

        setPdfPosition(
          (art as any).pdfPosition ||
          parsedGu.extractedPdfPosition ||
          parsedEn.extractedPdfPosition ||
          parsedHi.extractedPdfPosition ||
          fallbackPdfPosition ||
          'end'
        );
        setCategoryId(art.categoryId || art.category?.id || '');
        setLocation(art.location || '');
        const loadedAuthorId = art.authorId || art.author?.id || '';
        setAuthorId(loadedAuthorId);
        if (art.author?.name) {
          setCustomAuthorName(art.author.name);
          const authorExistsInList = authors.some((a) => a.id === loadedAuthorId || a.name === art.author.name);
          if (!authorExistsInList && loadedAuthorId) {
            setAuthorInputMode('custom');
          }
        }
        setStatus(art.status || 'PUBLISHED');
        const rawSched = art.scheduledAt || (art.status === 'SCHEDULED' ? art.publishedAt : null);
        if (rawSched) {
          const d = new Date(rawSched);
          if (!isNaN(d.getTime())) {
            const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            setScheduledAt(localIso);
          } else {
            setScheduledAt('');
          }
        } else {
          setScheduledAt('');
        }
        setPriority(art.priority || 0);
        const primaryCatId = art.categoryId || art.category?.id || '';
        let loadedAddCats: string[] = [];

        if (art.categories && Array.isArray(art.categories) && art.categories.length > 0) {
          loadedAddCats = art.categories
            .map((pc: any) => pc.categoryId || pc.category?.id || pc.id)
            .filter((id: string) => id && id !== primaryCatId);
        }

        setIsTrending(Boolean(art.isTrending));
        setIsBreaking(art.isBreaking || false);
        setIsFeatured(art.isFeatured || false);

        setSeoTitle(art.seoTitle || '');
        setSeoDescription(art.seoDescription || '');
        setSeoKeywords(art.seoKeywords || '');
        setCanonicalUrl(art.canonicalUrl || '');
        setMetaRobots(art.metaRobots || 'index, follow');

        if (art.tags && art.tags.length > 0) {
          const names = art.tags
            .map((t: any) => (t.tag?.name || t.name || '').trim())
            .filter((name: string) => name.length > 0);
          setTagsString(names.join(', '));
        } else {
          setTagsString('');
        }
        // Only set additional categories explicitly saved on the article (no auto-matching from tag names)
        setAdditionalCategoryIds(Array.from(new Set(loadedAddCats)));
      } catch (err: any) {
        console.error('Error loading article in edit mode:', err);
        setError(err.message);
      } finally {
        setFetching(false);
      }
    }
    loadArticle();
  }, [articleId, isEditMode, userRole, userAuthorId]);

  // Auto-fetch next available article number when creating a new article
  useEffect(() => {
    if (isEditMode) return;
    getPublicArticles({ limit: 1 })
      .then((res) => {
        if (res?.articles && res.articles.length > 0) {
          const topArt = res.articles[0];
          const nextNum = (topArt.articleNumber ?? 0) + 1;
          setArticleNumber(nextNum);
        } else {
          setArticleNumber(1001);
        }
      })
      .catch(() => {
        setArticleNumber(1001);
      });
  }, [isEditMode]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    setUploadingImage(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || json.message || `Failed to upload ${file.name}.`);

        const mediaUrl = json.url || json.data?.url || (json.file ? json.file.url : '');
        if (mediaUrl) {
          uploadedUrls.push(sanitizeImageUrl(mediaUrl));
        }
      }

      if (uploadedUrls.length > 0) {
        setPrimaryMediaList((prev) => {
          const updated = Array.from(new Set([...prev, ...uploadedUrls]));
          if (updated[0]) setFeaturedImage(updated[0]);
          return updated;
        });
        if (!featuredImage && uploadedUrls[0]) {
          setFeaturedImage(uploadedUrls[0]);
        }

        // If multiple images were selected, also populate Story Continuation Sections (Section 2, 3...)
        if (uploadedUrls.length > 1) {
          setStorySections((prevSections) => {
            const nextSections = [...prevSections];
            for (let i = 1; i < uploadedUrls.length; i++) {
              const secIdx = i - 1; // index 0 is Section 2
              if (secIdx < 9) {
                if (!nextSections[secIdx]) {
                  nextSections[secIdx] = {
                    id: `section-${secIdx + 2}-${Date.now()}-${i}`,
                    descEn: '',
                    descGu: '',
                    descHi: '',
                    imageUrl: uploadedUrls[i],
                    imageMode: 'upload',
                    imageUploading: false,
                  };
                } else if (!nextSections[secIdx].imageUrl) {
                  nextSections[secIdx] = {
                    ...nextSections[secIdx],
                    imageUrl: uploadedUrls[i],
                  };
                }
              }
            }
            return nextSections;
          });
        }
      } else {
        throw new Error('No media URL returned by server.');
      }
    } catch (err: any) {
      console.error('Media upload error:', err);
      setError(err.message || 'Failed to upload media file(s) from your computer.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent, requestedStatus: 'DRAFT' | 'PUBLISHED' = 'DRAFT') => {
    e.preventDefault();
    if (loading) return;
    const effectiveStatus = userRole === 'REPORTER' || requestedStatus === 'DRAFT'
      ? 'DRAFT'
      : status === 'ARCHIVED' ? 'ARCHIVED'
      : scheduledAt.trim() ? 'SCHEDULED' : 'PUBLISHED';
    setStatus(effectiveStatus);
    setError(null);
    setLoading(true);

    const safeTitle = (title || '').trim();
    const safeTitleGu = (titleGu || '').trim();
    const safeTitleHi = (titleHi || '').trim();
    const safeSlug = (slug || '').trim();
    const safeCategory = (categoryId || '').trim();
    const safeAuthor = (authorId || '').trim();
    const safeCustomAuthor = (customAuthorName || '').trim();
    const hasAuthor = authorInputMode === 'select' ? Boolean(safeAuthor) : Boolean(safeCustomAuthor);
    const safeFeaturedImage = (featuredImage || '').trim();

    const effectiveTitle = safeTitle || safeTitleGu || safeTitleHi;
    const effectiveExcerpt = (excerpt || excerptGu || excerptHi || 'Gujarat Post news flash.').trim();
    const finalFeaturedImage = safeFeaturedImage || '/assets/demo/1.jpg';

    const effectiveHighlights = (highlights || highlightsGu || highlightsHi || '').trim();
    const effectiveD1 = (desc1 || desc1Gu || desc1Hi || content || '').trim();
    const effectiveQuoteText = (quoteText || quoteTextGu || quoteTextHi || '').trim();
    const effectiveQuoteCite = (quoteCite || quoteCiteGu || quoteCiteHi || '').trim();
    const effectiveD2 = storySections.length > 0 ? (storySections[0].descEn || storySections[0].descGu || storySections[0].descHi || '').trim() : '';

    // Granular Validation with explicit field names and red border highlighting
    const missingFields: string[] = [];
    const errors: { slug?: boolean; title?: boolean; category?: boolean; author?: boolean } = {};

    if (!safeSlug) {
      missingFields.push('News Name (Slug)');
      errors.slug = true;
    }
    if (!effectiveTitle) {
      missingFields.push('Title');
      errors.title = true;
    }
    if (!safeCategory) {
      missingFields.push('Category (Topic)');
      errors.category = true;
    }
    if (!hasAuthor && userRole !== 'REPORTER') {
      missingFields.push('Publish By (Author)');
      errors.author = true;
    }

    setFieldErrors(errors);

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields before saving: ${missingFields.join(', ')}.`);
      setLoading(false);

      setTimeout(() => {
        const targetEl = document.getElementById('error-banner') || document.getElementById('field-slug') || document.getElementById('field-title') || document.getElementById('field-author');
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    if (effectiveStatus === 'SCHEDULED') {
      if (!scheduledAt || !scheduledAt.trim()) {
        const msg = 'Please select a Scheduled Publish Date & Time.';
        setError(msg);
        setScheduledAtError(msg);
        setFieldErrors((prev) => ({ ...prev, scheduledAt: true }));
        setLoading(false);
        setTimeout(() => {
          document.getElementById('field-scheduledAt')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        return;
      }
      const timeErr = validateScheduledTime(scheduledAt);
      if (timeErr) {
        setError(timeErr);
        setScheduledAtError(timeErr);
        setFieldErrors((prev) => ({ ...prev, scheduledAt: true }));
        setLoading(false);
        setTimeout(() => {
          document.getElementById('field-scheduledAt')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        return;
      }
    }

    // Compile distinct input sections into complete article content strings
    const sectionsEn = storySections.map((s) => ({ desc: s.descEn, imageUrl: s.imageUrl, showImageAfterDesc: s.showImageAfterDesc }));
    const sectionsGu = storySections.map((s) => ({ desc: s.descGu || s.descEn, imageUrl: s.imageUrl, showImageAfterDesc: s.showImageAfterDesc }));
    const sectionsHi = storySections.map((s) => ({ desc: s.descHi || s.descEn, imageUrl: s.imageUrl, showImageAfterDesc: s.showImageAfterDesc }));

    // Language-specific highlights: do NOT inject highlights if the admin left them blank!
    // If the primary language has no highlights, NO language gets highlights.
    const primaryHl = articleLanguage === 'gu' ? highlightsGu.trim() : articleLanguage === 'hi' ? highlightsHi.trim() : highlights.trim();

    const finalHlEn = primaryHl ? (highlights.trim() || primaryHl) : "";
    const finalHlGu = primaryHl ? (highlightsGu.trim() || primaryHl) : "";
    const finalHlHi = primaryHl ? (highlightsHi.trim() || primaryHl) : "";

    const compiledEn = compileStructuredContent(finalHlEn, desc1.trim() || effectiveD1, quoteText.trim() || effectiveQuoteText, quoteCite.trim() || effectiveQuoteCite, sectionsEn, 'en');
    const compiledGu = compileStructuredContent(finalHlGu, desc1Gu.trim() || effectiveD1, quoteTextGu.trim() || effectiveQuoteText, quoteCiteGu.trim() || effectiveQuoteCite, sectionsGu, 'gu');
    const compiledHi = compileStructuredContent(finalHlHi, desc1Hi.trim() || effectiveD1, quoteTextHi.trim() || effectiveQuoteText, quoteCiteHi.trim() || effectiveQuoteCite, sectionsHi, 'hi');

    const extraPrimary = primaryMediaList.slice(1).map((u) => u.trim()).filter(Boolean);
    const storySectionImgs = storySections.map((slot) => slot.imageUrl.trim()).filter(Boolean);
    const galleryPayload = Array.from(new Set([...extraPrimary, ...storySectionImgs]));


    // Combine explicit tagsString tags and additional category names as tags
    const additionalCatNames = additionalCategoryIds
      .map((id) => categories.find((c) => c.id === id)?.name)
      .filter((n): n is string => Boolean(n));

    const combinedTagNames = Array.from(
      new Set([
        ...tagsString.split(',').map((t) => t.trim()).filter((t) => t.length > 0),
        ...additionalCatNames,
      ])
    );

    const tags = combinedTagNames.map((name) => ({ name }));

    const finalPrimaryImage = (primaryMediaList[0] || featuredImage || safeFeaturedImage || '').trim() || '/assets/demo/1.jpg';

    let finalTitleEn = safeTitle;
    if (!finalTitleEn || /[\u0900-\u0D7F]/.test(finalTitleEn)) {
      try {
        const autoEn = await translateOnFly(effectiveTitle, 'en');
        if (autoEn && !/[\u0900-\u0D7F]/.test(autoEn)) {
          finalTitleEn = autoEn;
        }
      } catch (err) {
        console.warn('Auto translate titleEn error:', err);
      }
    }
    if (!finalTitleEn) finalTitleEn = effectiveTitle;

    const payload = {
      language: articleLanguage,
      slug: safeSlug,
      articleNumber: isEditMode && articleNumber !== '' ? Number(articleNumber) : undefined,
      title: finalTitleEn,
      titleGu: safeTitleGu || effectiveTitle,
      titleHi: safeTitleHi || effectiveTitle,
      excerpt: (excerpt || '').trim() || effectiveExcerpt,
      excerptGu: (excerptGu || '').trim() || effectiveExcerpt,
      excerptHi: (excerptHi || '').trim() || effectiveExcerpt,
      content: compiledEn,
      contentGu: compiledGu,
      contentHi: compiledHi,
      featuredImage: finalPrimaryImage,
      thumbnail: finalPrimaryImage,
      image2: storySections[0]?.imageUrl?.trim() || extraPrimary[0] || '',
      image3: storySections[1]?.imageUrl?.trim() || extraPrimary[1] || '',
      image4: storySections[2]?.imageUrl?.trim() || extraPrimary[2] || '',
      image5: storySections[3]?.imageUrl?.trim() || extraPrimary[3] || '',
      image6: storySections[4]?.imageUrl?.trim() || extraPrimary[4] || '',
      image7: storySections[5]?.imageUrl?.trim() || extraPrimary[5] || '',
      image8: storySections[6]?.imageUrl?.trim() || extraPrimary[6] || '',
      image9: storySections[7]?.imageUrl?.trim() || extraPrimary[7] || '',
      image10: storySections[8]?.imageUrl?.trim() || extraPrimary[8] || '',
      desc2: storySections[0]?.descEn?.trim() || undefined,
      desc2Gu: storySections[0]?.descGu?.trim() || undefined,
      desc2Hi: storySections[0]?.descHi?.trim() || undefined,
      galleryImages: galleryPayload,
      categoryId: (categoryId || '').trim(),
      additionalCategoryIds: additionalCategoryIds.filter((id) => id && id.trim() !== '' && id !== categoryId),
      categoryIds: Array.from(
        new Set([
          categoryId,
          ...additionalCategoryIds.filter((id) => id && id.trim() !== '' && id !== categoryId),
        ].filter(Boolean))
      ),
      youtubeUrl: youtubeUrl.trim() || undefined,
      twitterUrl: twitterUrl.trim() || undefined,
      instagramUrl: instagramUrl.trim() || undefined,
      facebookUrl: facebookUrl.trim() || undefined,
      pdfUrl: pdfUrl.trim() || undefined,
      showPdfPages: Boolean(pdfUrl.trim() && showPdfPages),
      pdfPosition: pdfUrl.trim() ? pdfPosition : undefined,
      location: location || null,
      authorId: authorInputMode === 'select' ? safeAuthor : (authors.find(a => a.name.toLowerCase() === safeCustomAuthor.toLowerCase())?.id || authors[0]?.id || safeAuthor || ''),
      authorName: authorInputMode === 'custom' ? safeCustomAuthor : (authors.find(a => a.id === safeAuthor)?.name || safeCustomAuthor || undefined),
      status: effectiveStatus,
      scheduledAt: effectiveStatus === 'SCHEDULED' ? new Date(scheduledAt).toISOString() : null,
      priority: Number(priority),
      readingTime: Number(readingTime),
      isTrending,
      isBreaking,
      isFeatured,
      isPublished: effectiveStatus === 'PUBLISHED',
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      seoKeywords: seoKeywords.trim() || undefined,
      canonicalUrl: canonicalUrl.trim() || undefined,
      metaRobots: metaRobots.trim() || undefined,
      tags,
    };

    try {
      const url = isEditMode ? getBackendApiUrl(`/api/admin/articles/${articleId}`) : getBackendApiUrl('/api/admin/articles');
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to save article.');

      clearApiCache();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gp-articles-updated'));
      }
      fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/', slug: result.article?.slug || result.slug || slug }),
        keepalive: true,
      }).catch(() => { });

      // Route cleanly back to list with full fresh stylesheet & state
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/articles';
      } else {
        router.push('/admin/articles');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Gujarati & English stop-words to exclude from raw tag & keyword extraction
  const SEO_STOP_WORDS = new Set([
    'અને', 'કે', 'પણ', 'છે', 'હતા', 'હતી', 'હતું', 'માટે', 'પર', 'થી', 'ને', 'માં', 'એક',
    'જેટલા', 'જેવા', 'સાથે', 'કરી', 'કરવામાં', 'આવ્યા', 'આવી', 'આવ્યો', 'હવે', 'સુધી',
    'બાદ', 'વચ્ચે', 'અંગે', 'આપવામાં', 'લેવામાં', 'નાખ્યા', 'નાખ્યું', 'સામે', 'કર્યા',
    'અહીં', 'ત્યાં', 'ત્યારબાદ', 'તમામ', 'અલગ', 'જવા', 'તરીકે', 'અગાઉ', 'ધ્વારા', 'દ્વારા',
    'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'about', 'into',
    'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'the', 'a', 'an', 'this', 'that'
  ]);

  // Topic dictionary mapping news keywords in Gujarati / Hindi / English to high-traffic tags & keywords
  const SEO_TOPIC_DICTIONARY: Array<{ patterns: RegExp[]; tags: string[]; keywords: string[] }> = [
    {
      patterns: [/હત્યા/i, /મર્ડર/i, /છરી/i, /તલવાર/i, /ખાતમો/i, /murder/i, /homicide/i, /stab/i, /killed/i],
      tags: ['murder', 'crime', 'police', 'હત્યા', 'મર્ડર', 'ક્રાઇમ'],
      keywords: ['murder news', 'crime news', 'police investigation', 'homicide case']
    },
    {
      patterns: [/પોલીસ/i, /ધડપકડ/i, /હુમલો/i, /હુમલાખોરો/i, /ગુનો/i, /police/i, /arrest/i, /attack/i, /crime/i],
      tags: ['police', 'crime', 'arrest', 'પોલીસ', 'ધડપકડ', 'હુમલો'],
      keywords: ['police action', 'crime report', 'police investigation', 'crime update']
    },
    {
      patterns: [/વરસાદ/i, /પૂર/i, /પાણી/i, /મેઘરાજા/i, /ઝાપટાં/i, /rain/i, /flood/i, /monsoon/i, /rainfall/i],
      tags: ['monsoon', 'rain', 'flood', 'weather', 'વરસાદ', 'પૂર'],
      keywords: ['monsoon update', 'heavy rainfall', 'weather forecast', 'flood alert']
    },
    {
      patterns: [/અકસ્માત/i, /મોત/i, /ઈજા/i, /accident/i, /crash/i, /collision/i, /dead/i],
      tags: ['accident', 'road accident', 'police', 'અકસ્માત', 'મોત'],
      keywords: ['road accident news', 'fatal crash', 'accident report']
    },
    {
      patterns: [/ચૂંટણી/i, /રાજકારણ/i, /ભાજપ/i, /કોંગ્રેસ/i, /આપ/i, /election/i, /politics/i, /bjp/i, /congress/i],
      tags: ['politics', 'election', 'bjp', 'congress', 'રાજકારણ', 'ચૂંટણી'],
      keywords: ['political news', 'election updates', 'gujarat politics', 'political statement']
    },
    {
      patterns: [/સોનું/i, /ચાંદી/i, /બજાર/i, /શેરબજાર/i, /gold/i, /silver/i, /market/i, /sensex/i, /business/i],
      tags: ['business', 'gold price', 'market', 'શેરબજાર', 'સોનું-ચાંદી', 'બિઝનેસ'],
      keywords: ['gold rate today', 'stock market news', 'business update', 'financial news']
    },
    {
      patterns: [/શાળા/i, /કોલેજ/i, /પરીક્ષા/i, /પરિણામ/i, /school/i, /college/i, /exam/i, /result/i, /education/i],
      tags: ['education', 'exam', 'result', 'પરીક્ષા', 'શાળા-કોલેજ', 'શિક્ષણ'],
      keywords: ['education news', 'exam results', 'board exam update', 'gujarat education']
    },
  ];

  // Auto-generate SEO fields (SEO Title, SEO Description, SEO Keywords, Article Tags) based on Title, Category, and Location
  const autoGenerateSeoDetails = (
    overrideTitle?: string,
    overrideCatId?: string,
    overrideLoc?: string,
    forceOverwrite = false
  ) => {
    const activeTitle = (overrideTitle !== undefined ? overrideTitle : (title || titleGu || titleHi)).trim();
    const activeTitleGu = (titleGu || '').trim();
    const activeCatId = overrideCatId !== undefined ? overrideCatId : categoryId;
    const activeLoc = overrideLoc !== undefined ? overrideLoc : location;

    if (!activeTitle && !activeTitleGu) return;

    const selectedCat = categories.find((c) => c.id === activeCatId);
    const catName = selectedCat?.name || '';
    const catNameGu = selectedCat?.nameGu || '';
    const brandSuffix = 'gujaratpost news';

    // 1. SEO Title (Bilingual: Gujarati | English | gujaratpost news)
    let genTitle = '';
    if (activeTitleGu && activeTitle && activeTitleGu !== activeTitle) {
      genTitle = `${activeTitleGu} | ${activeTitle} | ${brandSuffix}`;
    } else {
      genTitle = `${activeTitleGu || activeTitle} | ${brandSuffix}`;
    }

    // 2. SEO Description (Bilingual: Gujarati summary. English summary)
    let genDesc = '';
    if (activeTitleGu && activeTitle && activeTitleGu !== activeTitle) {
      genDesc = `${activeTitleGu}. ${activeTitle} in ${activeLoc || 'Gujarat'}. Latest news on ${brandSuffix}.`;
    } else {
      genDesc = `${activeTitleGu || activeTitle} in ${activeLoc || 'Gujarat'}. Latest news on ${brandSuffix}.`;
    }

    // 3. Dynamic Keyword & Tag Extraction with Topic Dictionary & Stop Words Removal
    const keywordSet = new Set<string>();
    const tagSet = new Set<string>();

    // Add bilingual core keywords
    keywordSet.add('gujarat news');
    keywordSet.add('gujaratpost news');
    keywordSet.add('gujarat post');
    keywordSet.add('ગુજરાત સમાચાર');
    keywordSet.add('ગુજરાત ન્યૂઝ');

    tagSet.add('gujarat');
    tagSet.add('gujaratpost');
    tagSet.add('ગુજરાત');
    tagSet.add('સમાચાર');

    // Analyze Title against Topic Dictionary
    SEO_TOPIC_DICTIONARY.forEach((topic) => {
      const match = topic.patterns.some((pattern) => pattern.test(activeTitle) || pattern.test(activeTitleGu));
      if (match) {
        topic.tags.forEach((t) => tagSet.add(t));
        topic.keywords.forEach((k) => {
          if (activeLoc) keywordSet.add(`${activeLoc.toLowerCase()} ${k}`);
          keywordSet.add(k);
        });
      }
    });

    // Process English & Gujarati Words
    const rawWords = `${activeTitle} ${activeTitleGu}`
      .replace(/[^\w\s\u0A80-\u0AFF\u0900-\u097F]/gi, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2 && !SEO_STOP_WORDS.has(w.toLowerCase()));

    if (rawWords.length > 0) {
      const mainKeywordsPhrase = rawWords.slice(0, 5).join(' ');
      if (mainKeywordsPhrase) keywordSet.add(mainKeywordsPhrase);

      rawWords.slice(0, 5).forEach((w) => {
        tagSet.add(w);
      });
    }

    // Add Location & Category context
    if (activeLoc) {
      const locLower = activeLoc.toLowerCase();
      keywordSet.add(`${locLower} news`);
      keywordSet.add(activeLoc);
      keywordSet.add(`${activeLoc} સમાચાર`);
      tagSet.add(locLower);
      tagSet.add(activeLoc);
    }

    if (catName) {
      const catLower = catName.toLowerCase();
      keywordSet.add(`${catLower} news`);
      keywordSet.add(catName);
      tagSet.add(catLower);
    }
    if (catNameGu) {
      keywordSet.add(catNameGu);
      tagSet.add(catNameGu);
    }

    const genKeywords = Array.from(keywordSet).join(', ');
    const genTags = Array.from(tagSet).join(', ');

    if (forceOverwrite || !seoTitle.trim()) {
      setSeoTitle(genTitle);
    }
    if (forceOverwrite || !seoDescription.trim()) {
      setSeoDescription(genDesc);
    }
    if (forceOverwrite || !seoKeywords.trim()) {
      setSeoKeywords(genKeywords);
    }
    if (forceOverwrite || !tagsString.trim()) {
      setTagsString(genTags);
    }
  };

  const [loadingAiSeo, setLoadingAiSeo] = useState(false);
  const [seoSource, setSeoSource] = useState<'gemini' | 'local' | null>(null);

  // Generate high-traffic SEO details strictly using Google Gemini AI (100% FREE AI Engine)
  const generateSeoWithGeminiAI = async (
    overrideTitle?: string,
    overrideCatId?: string,
    overrideLoc?: string,
    isAutoTrigger = false
  ) => {
    const activeTitle = (overrideTitle !== undefined ? overrideTitle : (title || titleGu || titleHi)).trim();
    const activeTitleGu = (titleGu || '').trim();
    const activeTitleHi = (titleHi || '').trim();
    if (!activeTitle && !activeTitleGu) {
      if (!isAutoTrigger) {
        alert('Please enter an article title first before generating SEO details with Gemini AI.');
      }
      return;
    }

    const activeCatId = overrideCatId !== undefined ? overrideCatId : categoryId;
    const activeLoc = overrideLoc !== undefined ? overrideLoc : location;

    setLoadingAiSeo(true);
    const selectedCat = categories.find((c) => c.id === activeCatId);

    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/ai/generate-seo'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeTitle,
          titleGu: activeTitleGu,
          titleHi: activeTitleHi,
          categoryName: selectedCat?.name || '',
          categoryNameGu: selectedCat?.nameGu || '',
          location: activeLoc || '',
          content: desc1 || excerpt || '',
          contentGu: desc1Gu || excerptGu || '',
        }),
      });

      const rawText = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(rawText);
      } catch (pErr) {
        throw new Error(`Server status ${res.status}: ${rawText.slice(0, 80)}`);
      }

      if (!res.ok) throw new Error(json.error || json.message || 'Failed to generate SEO metadata with Gemini AI.');

      if (json.data) {
        if (json.data.seoTitle) setSeoTitle(json.data.seoTitle);
        if (json.data.seoDescription) setSeoDescription(json.data.seoDescription);
        if (json.data.seoKeywords) setSeoKeywords(json.data.seoKeywords);
        if (json.data.tags) setTagsString(json.data.tags);
        // SEO responses must never overwrite the independently generated or manually locked slug.
        setSeoSource('gemini');
      }
    } catch (err: any) {
      console.error('[Gemini AI SEO API Error]:', err?.message);
      setSeoSource(null);
      if (!isAutoTrigger) {
        alert(`Gemini AI Error: ${err?.message || 'Failed to generate SEO details with Gemini AI API.'}`);
      }
    } finally {
      setLoadingAiSeo(false);
    }
  };

  const handleCategorySelect = (val: string) => {
    setCategoryId(val);
    setAdditionalCategoryIds((prev) => prev.filter((id) => id !== val));
    const currentTitle = title || titleGu || titleHi;
    generateSeoWithGeminiAI(currentTitle, val, location, true);
  };

  // Combine base LOCATION_OPTIONS and custom user-created locations with None option at top
  const allLocationOptions = useMemo(() => {
    const noneOption: SelectOption = {
      value: '',
      label: 'None / Not Selected (કોઈ નહીં)',
      sublabel: 'સામાન્ય / કોઈ ચોક્કસ શહેર નહીં',
    };
    const standardSet = new Set(LOCATION_OPTIONS.map((o) => o.value.toLowerCase()));
    const validCustom = customLocations.filter((c) => !standardSet.has(c.value.toLowerCase()));

    // If active article location is not in standard or custom, ensure it is included
    if (
      location &&
      !standardSet.has(location.toLowerCase()) &&
      !validCustom.some((c) => c.value.toLowerCase() === location.toLowerCase())
    ) {
      validCustom.push({
        value: location,
        label: location,
        sublabel: 'Custom',
      });
    }

    const restStandard = LOCATION_OPTIONS.filter((o) => o.value !== '');
    return [noneOption, ...restStandard, ...validCustom];
  }, [customLocations, location]);

  // Create, persist, and select a custom city / location
  const handleCreateCustomLocation = useCallback(
    async (rawName: string, sublabel?: string) => {
      if (!rawName || !rawName.trim()) return;
      const trimmed = rawName.trim();

      // Format name with proper capitalization
      const formattedName = trimmed
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const formattedSublabel = sublabel?.trim() || 'Custom';

      const newOption: SelectOption = {
        value: formattedName,
        label: formattedName,
        sublabel: formattedSublabel,
      };

      // 1. Update state & localStorage
      setCustomLocations((prev) => {
        const exists = prev.some((o) => o.value.toLowerCase() === formattedName.toLowerCase());
        const updated = exists ? prev : [...prev, newOption];
        try {
          localStorage.setItem('gp_custom_locations', JSON.stringify(updated));
        } catch (e) {
          console.warn('Could not save custom location to localStorage', e);
        }
        return updated;
      });

      // 2. Immediately select for this article
      setLocation(formattedName);
      const currentTitle = title || titleGu || titleHi;
      autoGenerateSeoDetails(currentTitle, categoryId, formattedName, false);

      // 3. Persist to backend database asynchronously
      try {
        await authFetch(getBackendApiUrl('/api/admin/articles/locations'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formattedName,
            sublabel: formattedSublabel !== 'Custom' ? formattedSublabel : null,
          }),
        });
      } catch (err) {
        console.warn('Backend custom location sync notice:', err);
      }
    },
    [title, titleGu, titleHi, categoryId, autoGenerateSeoDetails]
  );

  const sortedCategories = useMemo(() => {
    // Show only active categories (if category is not active, then do not show)
    const isSelected = (c: CategoryData) => c.id === categoryId || additionalCategoryIds.includes(c.id);
    const valid = categories.filter((c) => {
      if (isDisplayOnlySectionCategory(c)) return false;
      const isActive = c.isActive !== false && (c as any).status !== 'inactive' && (c as any).status !== 'disabled';
      const showInArticle = c.showInArticle !== false;
      return (isActive && showInArticle) || isSelected(c);
    });

    // 1. Gujarat State (Always #1)
    const gujaratCats = valid.filter(isGujaratCat);

    // 2. All State Cities / Districts of Gujarat (Ordered logically: Ahmedabad, Gandhinagar, Surat, Vadodara, Rajkot, Other Cities, etc.)
    const districtOrder = [
      'ahmedabad', 'gandhinagar', 'surat', 'vadodara', 'rajkot', 'other-cities',
      'bhavnagar', 'jamnagar', 'junagadh', 'kutch', 'anand', 'mehsana', 'morbi'
    ];
    const districtCats = valid.filter(isGujaratDistrictCat).sort((a, b) => {
      const slugA = (a.slug || a.name || '').toLowerCase().trim();
      const slugB = (b.slug || b.name || '').toLowerCase().trim();
      const idxA = districtOrder.indexOf(slugA);
      const idxB = districtOrder.indexOf(slugB);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    // 3. Main News Topics
    const newsPriority = [
      'national', 'world', 'politics', 'crime', 'business', 'sports',
      'health', 'entertainment', 'technology', 'education', 'weather',
      'varsad', 'rainfall', 'lifestyle', 'fact-check', 'editorial',
      'trending', 'latest-news', 'breaking-news', 'jobs', 'gold-silver'
    ];
    const mainNewsCats = valid.filter(c => !isGujaratCat(c) && !isGujaratDistrictCat(c) && !isElectionCat(c)).sort((a, b) => {
      const slugA = (a.slug || a.name || '').toLowerCase().trim();
      const slugB = (b.slug || b.name || '').toLowerCase().trim();
      const idxA = newsPriority.indexOf(slugA);
      const idxB = newsPriority.indexOf(slugB);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    // 4. Election & Special Categories
    const electionCats = valid.filter(isElectionCat).sort((a, b) => a.name.localeCompare(b.name));

    return {
      gujaratGroup: [...gujaratCats, ...districtCats],
      gujaratOnly: gujaratCats,
      districtsOnly: districtCats,
      mainNewsGroup: mainNewsCats,
      electionGroup: electionCats,
      allSorted: [...gujaratCats, ...districtCats, ...mainNewsCats, ...electionCats],
    };
  }, [categories, categoryId, additionalCategoryIds]);

  const categoryOptions = useMemo(() => {
    return sortedCategories.allSorted.map((cat) => ({
      value: cat.id,
      label: cat.nameGu && cat.nameGu !== cat.name ? `${cat.name} (${cat.nameGu})` : cat.name,
    }));
  }, [sortedCategories]);

  // Bulletproof Selected Category IDs & Count
  const selectedCatIds = useMemo(() => {
    return Array.from(
      new Set([
        ...(categoryId ? [categoryId] : []),
        ...additionalCategoryIds.filter(Boolean),
      ])
    );
  }, [categoryId, additionalCategoryIds]);

  const selectedCount = selectedCatIds.length;
  const totalSelectedCount = selectedCount + (isFeatured ? 1 : 0) + (isBreaking ? 1 : 0) + (isTrending ? 1 : 0);

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mt-2 text-sm">Loading article details...</span>
      </div>
    );
  }

  const renderLivePreviewPdf = () => {
    if (!pdfUrl || !pdfUrl.trim()) return null;
    return showPdfPages ? (
      <ArticlePdfPagesViewer
        pdfUrl={pdfUrl}
        title="Attached Official Document (Live Preview)"
        language={articleLanguage}
      />
    ) : (
      <div className="gp-pdf-card my-4">
        <div className="gp-pdf-inner">
          <div className="gp-pdf-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
          </div>
          <div className="gp-pdf-text">
            <span className="gp-pdf-title">Attached Official Document (PDF)</span>
            <span className="gp-pdf-sub">Verified Official Document</span>
          </div>
        </div>
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download className="gp-pdf-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          <span>Download PDF</span>
        </a>
      </div>
    );
  };

  const renderFormattedPreviewContent = (rawText: string) => {
    if (!rawText || !rawText.trim()) return null;
    let formatted = rawText
      // Convert markdown images ![alt](url) to HTML <img>
      .replace(/!\[(.*?)\]\((https?:\/\/[^\s)]+|\/uploads\/[^\s)]+|\/assets\/[^\s)]+)\)/gi, (match, alt, url) => {
        return `<figure class="my-4 space-y-1"><div class="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black/5 dark:bg-black/40 shadow-sm"><img src="${url}" alt="${alt || 'Article Image'}" class="w-full h-full object-cover" /></div>${alt ? `<figcaption class="text-xs text-center text-zinc-500 italic">${alt}</figcaption>` : ''}</figure>`;
      })
      // Clean up multiple nested blockquotes created by browser formatting
      .replace(/(<blockquote[^>]*>\s*)+/gi, '<blockquote class="my-4 border-l-[3px] border-[#B3121B] pl-4 font-sans font-bold text-zinc-900 dark:text-white">')
      .replace(/(\s*<\/blockquote>)+/gi, '</blockquote>')
      // Convert plain URLs (not inside href="...") into clickable hyperlinks
      .replace(/(^|[\s>(])(https?:\/\/[^\s<"']+)/g, (match, prefix, url) => {
        return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 font-bold underline hover:text-blue-800 break-all">${url}</a>`;
      });

    return (
      <div
        className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 font-medium [&_img]:rounded-xl [&_a]:text-blue-600 [&_a]:underline [&_a]:font-bold [&_figure]:my-4 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#B3121B] [&_blockquote]:pl-4 [&_blockquote]:my-3 [&_blockquote]:font-bold [&_blockquote]:not-italic [&_blockquote]:text-zinc-900 dark:[&_blockquote]:text-white [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:list-item [&_li]:my-1"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-gray-400 pb-4 dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/admin/articles');
              }
            }}
            className="rounded-lg border border-gray-400 p-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-950/40 cursor-pointer"
            title="Back to Articles"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditMode ? 'Edit Article' : 'New Article'}
            </h1>
          </div>
        </div>

      </div>

      {/* Error Alert Banner */}
      {error && (
        <div id="error-banner" className="flex items-start gap-3.5 rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-600 dark:bg-red-950/70 dark:text-red-200 shadow-md transition-all">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="space-y-0.5">
            <p className="font-black text-sm uppercase tracking-wider text-red-800 dark:text-red-300">⚠️ Form Validation Failed</p>
            <p className="text-xs font-semibold leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Form Content Panel - Line-by-Line Flow */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-400 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 space-y-6">


        {/* LINE 1: News Name (In English / Slug) */}
        <div id="field-slug">
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
            <label className={`block text-sm font-semibold ${fieldErrors.slug ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-zinc-100'}`}>
              News Name (In English) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {/* Unblock / Lock Slug Button */}
              <button
                type="button"
                onClick={() => {
                  if (isSlugBlocked) {
                    unblockSlug();
                  } else {
                    lockSlug();
                  }
                }}
                className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer select-none py-1 px-2.5 rounded-lg border shadow-2xs ${isSlugBlocked
                    ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  }`}
                title={isSlugBlocked ? 'Slug is blocked from auto-updating. Click to unblock for editing' : 'Slug is unblocked. Click to lock'}
              >
                {isSlugBlocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Unblock Slug</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Lock Slug</span>
                  </>
                )}
              </button>

              {/* Explicitly regenerate the English slug from the current title. */}
              <button
                type="button"
                onClick={() => {
                  const currentTitle = (contentLang === 'gu' ? titleGu : contentLang === 'hi' ? titleHi : title) || titleGu || titleHi || title;
                  if (!currentTitle.trim()) return;
                  unblockSlug();
                  void autoGenerateEnglishSlug(currentTitle);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B3121B] hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors cursor-pointer select-none py-1 px-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200"
                title="Auto-translate the current title into an English slug and lock it again"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Translate English Slug</span>
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              ref={slugInputRef}
              type="text"
              value={slug || ''}
              readOnly={isSlugBlocked}
              onChange={(e) => {
                cancelSlugGeneration();
                hasManuallyEditedSlug.current = true;
                hasAutoGeneratedSlugOnce.current = true;
                setSlug(e.target.value.replace(/[^a-zA-Z0-9-:]/g, '-').replace(/-+/g, '-'));
                if (fieldErrors.slug) setFieldErrors((prev) => ({ ...prev, slug: false }));
              }}
              onBlur={() => {
                if (hasManuallyEditedSlug.current && slug && slug.trim()) {
                  lockSlug();
                }
              }}
              placeholder="e.g. Major-operation-regarding-drugs:-Ahmedabad-and-Surat-Crime-Branches-seize-drugs-worth-Rs-25-crore"
              className={`w-full rounded-xl border px-4 py-3 pr-11 text-base font-mono placeholder:text-gray-500 focus:outline-none transition-all ${isSlugBlocked
                  ? 'bg-zinc-100/90 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 cursor-not-allowed border-gray-300 dark:border-zinc-700 select-none'
                  : 'border-gray-400 bg-zinc-50/50 text-gray-900 focus:border-primary dark:border-zinc-600 dark:bg-zinc-950/20 dark:text-zinc-100'
                } ${fieldErrors.slug
                  ? 'border-2 border-red-500 bg-red-50/80 text-red-900 ring-2 ring-red-500/20 dark:border-red-600 dark:bg-red-950/40 dark:text-red-200'
                  : ''
                }`}
              required
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {isSlugBlocked ? (
                <button
                  type="button"
                  onClick={() => {
                    unblockSlug();
                  }}
                  className="text-amber-600 hover:text-amber-700 dark:text-amber-400 p-1 cursor-pointer"
                  title="Slug is blocked. Click to unblock and edit"
                >
                  <Lock className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={lockSlug}
                  className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 p-1 cursor-pointer"
                  title="Slug is unblocked. Click to lock"
                >
                  <Unlock className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {fieldErrors.slug ? (
            <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> News Name (Slug) is required.
            </p>
          ) : isSlugBlocked ? (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Slug is blocked from auto-updating. Click <strong>Unblock Slug</strong>, then change the Title to regenerate once and lock again.</span>
            </p>
          ) : (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1.5 font-medium">
              <Unlock className="w-3.5 h-3.5 shrink-0" />
              <span>Change the Title or click Auto-Translate English Slug to generate a new slug once. The slug will lock again.</span>
            </p>
          )}
        </div>

        {/* LINE 2: Title (*) / Headline */}
        <div id="field-title">
          <label className={`block text-sm font-semibold mb-1.5 ${fieldErrors.title ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-zinc-100'}`}>
            Title (*) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={(contentLang === 'gu' ? titleGu : contentLang === 'hi' ? titleHi : title) || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (contentLang === 'en') setTitle(val);
              else if (contentLang === 'gu') setTitleGu(val);
              else if (contentLang === 'hi') setTitleHi(val);

              // Only auto-generate slug for the FIRST TIME when slug is not blocked and not manually edited
              if (!isSlugBlocked && !hasManuallyEditedSlug.current && !hasAutoGeneratedSlugOnce.current) {
                cancelSlugGeneration();
                const quickSlug = generateEnglishSlug(val);
                if (quickSlug) {
                  setSlug(quickSlug);
                }

                // Real-time asynchronous translation to fluent, accurate English slug
                if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
                slugTimerRef.current = setTimeout(() => {
                  if (!isSlugBlocked && !hasManuallyEditedSlug.current && !hasAutoGeneratedSlugOnce.current) {
                    autoGenerateEnglishSlug(val);
                  }
                }, 300);
              }

              if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: false }));
              generateSeoWithGeminiAI(val, categoryId, location, true);
            }}
            onBlur={(e) => {
              const val = e.target.value;
              // On blur of Title: finalize first-time slug and block auto-generate
              if (!isSlugBlocked && !hasManuallyEditedSlug.current && !hasAutoGeneratedSlugOnce.current) {
                if (val && val.trim()) {
                  cancelSlugGeneration();
                  autoGenerateEnglishSlug(val);
                }
              }
              generateSeoWithGeminiAI(val, categoryId, location, true);
            }}
            placeholder={
              contentLang === 'gu'
                ? 'ગુજરાતમાં પૂરનો કહેર: બે દિવસમાં 30 લોકોનાં મોત, અમદાવાદમાં 20 વર્ષમાં સૌથી વધુ વરસાદ નોંધાયો'
                : contentLang === 'hi'
                  ? 'गुजरात में बाढ़ का कहर: दो दिनों में 30 लोगों की मौत, अहमदाबाद में 20 वर्षों में सबसे अधिक बारिश'
                  : 'Enter main news article title...'
            }
            className={`w-full rounded-xl border px-4 py-3 text-base font-bold placeholder:text-gray-500 focus:outline-none transition-all ${fieldErrors.title
                ? 'border-2 border-red-500 bg-red-50/80 text-red-900 ring-2 ring-red-500/20 dark:border-red-600 dark:bg-red-950/40 dark:text-red-200'
                : 'border-gray-400 bg-zinc-50/50 text-gray-900 focus:border-primary dark:border-zinc-600 dark:bg-zinc-950/20 dark:text-white'
              }`}
            required
          />
          {fieldErrors.title && (
            <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Title is required.</p>
          )}
        </div>

        {/* LINE 3: Category (Topic), City / Location, & Publish By (Author) */}
        <div className="grid gap-4 md:grid-cols-3 items-start">
          {/* Column 1: Category */}
          <div id="field-category" className="flex flex-col justify-start">
            <div className="flex items-center justify-between min-h-[28px] mb-1.5">
              <label className={`text-sm font-semibold truncate ${fieldErrors.category ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-zinc-100'}`}>
                Category (Topic) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0">Primary</span>
            </div>
            <CustomSelect
              value={categoryId || ''}
              onChange={(val) => {
                handleCategorySelect(val);
                if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: false }));
              }}
              options={categoryOptions}
              placeholder="[Choose category]"
              error={Boolean(fieldErrors.category)}
              required
              searchable
            />
            <div className="mt-1 min-h-[18px]">
              {fieldErrors.category ? (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Please select a Category.
                </p>
              ) : (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Main section topic for this story</p>
              )}
            </div>
          </div>

          {/* Column 2: City / Location */}
          <div className="flex flex-col justify-start">
            <div className="flex items-center justify-between min-h-[28px] mb-1.5">
              <label className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate mr-1.5">
                City / Location
              </label>
              <div className="flex items-center gap-1.5 shrink-0">
                {(() => {
                  const selectedCat = categories.find((c) => c.id === categoryId);
                  const catSlugOrName = (selectedCat?.slug || selectedCat?.name || '').trim().toLowerCase();
                  if (['world', 'international', 'global'].includes(catSlugOrName)) {
                    return <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 shrink-0">🌍 International</span>;
                  } else if (['national', 'india', 'bharat'].includes(catSlugOrName)) {
                    return <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800 shrink-0">🇮🇳 National</span>;
                  } else if (catSlugOrName === 'gujarat') {
                    return <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">🏙️ Gujarat</span>;
                  }
                  return null;
                })()}
                {location && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocation('');
                      const currentTitle = title || titleGu || titleHi;
                      autoGenerateSeoDetails(currentTitle, categoryId, '', false);
                    }}
                    className="text-[10px] text-zinc-400 hover:text-red-500 font-semibold transition-colors cursor-pointer ml-1"
                    title="Clear location"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>
            <CustomSelect
              value={location || ''}
              onChange={(val) => {
                setLocation(val);
                const currentTitle = title || titleGu || titleHi;
                autoGenerateSeoDetails(currentTitle, categoryId, val, false);
              }}
              options={allLocationOptions}
              placeholder="[Select City / Region]"
              searchable
              onCreateCustom={(query) => handleCreateCustomLocation(query)}
              customButtonLabel="Create custom location"
            />
            <div className="mt-1 min-h-[18px]">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Target city or regional coverage</p>
            </div>
          </div>

          {/* Column 3: Publish By (Author) */}
          <div id="field-author" className="flex flex-col justify-start">
            <div className="flex items-center justify-between min-h-[28px] mb-1.5">
              <label className={`text-sm font-semibold truncate mr-2 ${fieldErrors.author ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-zinc-100'}`}>
                Publish By (Author) <span className="text-red-500">*</span>
              </label>
              {userRole !== 'REPORTER' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthorInputMode(authorInputMode === 'select' ? 'custom' : 'select');
                    if (fieldErrors.author) setFieldErrors((prev) => ({ ...prev, author: false }));
                  }}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${authorInputMode === 'select'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
                    }`}
                  title={authorInputMode === 'select' ? 'Switch to manual author name entry' : 'Switch to select from existing author list'}
                >
                  {authorInputMode === 'select' ? (
                    <>
                      <PenLine className="h-3 w-3" />
                      <span>+ Enter Name</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-3 w-3" />
                      <span>Select List</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {userRole === 'REPORTER' ? (
              <div className="w-full rounded-xl border border-gray-400 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-950/40 px-4 py-3 text-base font-semibold text-gray-900 dark:text-zinc-200 shadow-sm">
                {userAuthorName || 'Your Author Profile'}
              </div>
            ) : authorInputMode === 'custom' ? (
              <div className="relative w-full">
                <input
                  type="text"
                  value={customAuthorName}
                  onChange={(e) => {
                    setCustomAuthorName(e.target.value);
                    if (fieldErrors.author) setFieldErrors((prev) => ({ ...prev, author: false }));
                  }}
                  placeholder="Type Author / Reporter Name (e.g. Ramesh Patel)..."
                  className={`w-full rounded-xl border px-4 py-3 pr-10 text-base font-semibold shadow-sm transition-all duration-200 outline-none ${fieldErrors.author
                      ? 'border-2 border-red-500 bg-red-50/80 text-red-900 ring-2 ring-red-500/20 dark:border-red-600 dark:bg-red-950/40 dark:text-red-200'
                      : 'border-gray-400 bg-white text-gray-900 placeholder:text-gray-400 hover:border-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-600 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-900/60'
                    }`}
                  autoFocus
                />
                {customAuthorName ? (
                  <button
                    type="button"
                    onClick={() => setCustomAuthorName('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                    title="Clear"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ) : (
              <CustomSelect
                value={authorId || ''}
                onChange={(val) => {
                  setAuthorId(val);
                  const found = authors.find((a) => a.id === val);
                  if (found) setCustomAuthorName(found.name);
                  if (fieldErrors.author) setFieldErrors((prev) => ({ ...prev, author: false }));
                }}
                options={authors.map((aut) => ({ value: aut.id, label: aut.name }))}
                placeholder="Select Author / Reporter"
                error={Boolean(fieldErrors.author)}
                required
                searchable
              />
            )}

            <div className="mt-1 min-h-[18px]">
              {fieldErrors.author ? (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Please {authorInputMode === 'custom' ? 'enter author name' : 'select an author'}.
                </p>
              ) : authorInputMode === 'custom' ? (
                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="truncate">✍️ Custom author name saved</span>
                  <button
                    type="button"
                    onClick={() => setAuthorInputMode('select')}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer shrink-0 ml-1.5"
                  >
                    Switch to list
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="truncate">Verified author profile</span>
                  <button
                    type="button"
                    onClick={() => setAuthorInputMode('custom')}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer shrink-0 ml-1.5"
                  >
                    + Type custom name
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🏷️ MULTIPLE CATEGORY SELECTOR (Modern UI/UX with Active Preview Tray, Accordions & Polished Cards) */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden transition-all">
          {/* 1. Header Bar: Title, Status Badge, Explanatory Hint & Quick Actions */}
          <div className="border-b border-zinc-100 bg-gradient-to-r from-emerald-50/80 via-teal-50/30 to-white px-5 py-4 dark:border-zinc-800 dark:from-emerald-950/20 dark:via-zinc-900 dark:to-zinc-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                    <Layers className="h-4 w-4" />
                  </div>
                  <label className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Publish Categories & News Sections
                  </label>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    (સમાચાર વિભાગો અને શ્રેણીઓ)
                  </span>
                  <span className="text-red-500 font-bold">*</span>
                  {totalSelectedCount === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800">
                      <AlertCircle className="h-3 w-3" /> Select at least 1 section
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-black text-white shadow-xs">
                      <Check className="h-3.5 w-3.5" />
                      {totalSelectedCount} {totalSelectedCount === 1 ? 'Section' : 'Sections'} Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  The <span className="font-semibold text-emerald-700 dark:text-emerald-400">Primary (Main)</span> category sets your article's canonical URL & main section. Extra checked sections cross-publish this article across multiple topic feeds.
                </p>
              </div>

              {/* Quick Helper Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const guj = categories.find(isGujaratCat);
                    if (guj) {
                      handleCategorySelect(guj.id);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/70"
                  title="Quickly set Gujarat as the Primary Category"
                >
                  <span>📍 Quick: Gujarat</span>
                </button>
                {additionalCategoryIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAdditionalCategoryIds([])}
                    className="text-xs font-semibold text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 px-2 py-1.5 transition-colors cursor-pointer"
                    title="Remove all additional cross-post categories"
                  >
                    Clear Extras
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Active Selections Quick Tray (Visible whenever at least 1 category is checked) */}
          {totalSelectedCount > 0 && (
            <div className="bg-emerald-50/40 dark:bg-emerald-950/15 border-b border-zinc-100 dark:border-zinc-800/80 px-5 py-3">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-zinc-600 dark:text-zinc-400 shrink-0 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Active Selections:
                </span>

                {/* Primary Category Chip */}
                {(() => {
                  const primaryCat = categories.find((c) => c.id === categoryId);
                  if (!primaryCat) return null;
                  return (
                    <span
                      key={primaryCat.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 text-white font-bold px-3 py-1 shadow-xs"
                      title="Primary Category (Sets Article URL)"
                    >
                      <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-1.5 py-0.2 rounded">Primary</span>
                      <span>{primaryCat.name}</span>
                      {primaryCat.nameGu && primaryCat.nameGu !== primaryCat.name && (
                        <span className="text-[11px] opacity-85 font-normal">({primaryCat.nameGu})</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const cleanRemaining = additionalCategoryIds.filter((id) => id !== primaryCat.id);
                          if (cleanRemaining.length > 0) {
                            const nextPrimary = cleanRemaining[0];
                            setCategoryId(nextPrimary);
                            setAdditionalCategoryIds(cleanRemaining.filter((id) => id !== nextPrimary));
                          } else {
                            setCategoryId('');
                            setAdditionalCategoryIds([]);
                          }
                        }}
                        className="text-white/80 hover:text-white transition-colors cursor-pointer p-0.5 rounded-full hover:bg-white/20 ml-0.5"
                        title="Remove primary category"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })()}

                {/* Additional Category Chips */}
                {additionalCategoryIds.map((addId) => {
                  const addCat = categories.find((c) => c.id === addId);
                  if (!addCat || addCat.id === categoryId) return null;
                  return (
                    <span
                      key={addCat.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-emerald-300 dark:border-zinc-700 font-semibold text-zinc-800 dark:text-zinc-200 px-2.5 py-1 shadow-2xs"
                    >
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">+Extra</span>
                      <span>{addCat.name}</span>
                      <button
                        type="button"
                        onClick={() => setAdditionalCategoryIds((prev) => prev.filter((id) => id !== addId))}
                        className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer p-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        title="Remove category"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}

                {/* Home / Hero Grid Chip */}
                {isFeatured && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 text-white font-bold px-2.5 py-1 shadow-2xs text-xs"
                    title="Promoted to Home / News (Main Hero Grid)"
                  >
                    <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-1 rounded">⭐ Home / News</span>
                    <span>Main Hero Grid</span>
                    <button
                      type="button"
                      onClick={() => setIsFeatured(false)}
                      className="text-white/80 hover:text-white transition-colors cursor-pointer p-0.5 rounded-full hover:bg-white/20"
                      title="Remove from Home / News (Main Hero Grid)"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {/* Breaking News Chip */}
                {isBreaking && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 text-white font-bold px-2.5 py-1 shadow-2xs text-xs"
                    title="Promoted to Breaking News Ticker"
                  >
                    <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-1 rounded">⚡ Flash</span>
                    <span>Breaking News</span>
                    <button
                      type="button"
                      onClick={() => setIsBreaking(false)}
                      className="text-white/80 hover:text-white transition-colors cursor-pointer p-0.5 rounded-full hover:bg-white/20"
                      title="Remove Breaking News promotion"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {/* Trending Story Chip */}
                {isTrending && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 text-white font-bold px-2.5 py-1 shadow-2xs text-xs"
                    title="Promoted to Trending Sidebar & List"
                  >
                    <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-1 rounded">🔥 Trending</span>
                    <span>Trending Story</span>
                    <button
                      type="button"
                      onClick={() => handleToggleTrendingStory(false)}
                      className="text-white/80 hover:text-white transition-colors cursor-pointer p-0.5 rounded-full hover:bg-white/20"
                      title="Remove Trending Story promotion"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 3. Search Bar & Quick Filter Tabs Toolbar */}
          <div className="p-4 sm:p-5 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
              {/* Live Search Input with generous width */}
              <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search category (e.g. Gujarat, Surat, Politics, Crime, Sports, અમદાવાદ)..."
                  className="w-full h-10.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 pl-10 pr-9 text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-300 cursor-pointer transition-colors"
                    title="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Quick Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setCategoryFilterTab('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${categoryFilterTab === 'all'
                      ? 'bg-zinc-900 text-white shadow-xs dark:bg-white dark:text-zinc-900'
                      : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-750'
                    }`}
                >
                  <span>All</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${categoryFilterTab === 'all'
                      ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                    }`}>
                    {sortedCategories.allSorted.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategoryFilterTab('gujarat')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${categoryFilterTab === 'gujarat'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white border border-zinc-200 text-emerald-800 hover:bg-emerald-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-emerald-400 dark:hover:bg-zinc-750'
                    }`}
                >
                  <span>📍 Gujarat & Cities</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${categoryFilterTab === 'gujarat' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                    {sortedCategories.gujaratGroup.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategoryFilterTab('news')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${categoryFilterTab === 'news'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-750'
                    }`}
                >
                  <span>📰 Main News</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${categoryFilterTab === 'news' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                    }`}>
                    {sortedCategories.mainNewsGroup.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategoryFilterTab('elections')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${categoryFilterTab === 'elections'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-750'
                    }`}
                >
                  <span>🗳️ Elections</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${categoryFilterTab === 'elections' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                    }`}>
                    {sortedCategories.electionGroup.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategoryFilterTab('selected')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${categoryFilterTab === 'selected'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50/70 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                    }`}
                >
                  <span>✓ Selected</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${categoryFilterTab === 'selected'
                      ? 'bg-white text-emerald-700'
                      : 'bg-emerald-600 text-white'
                    }`}>
                    {selectedCount}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Category Grid Content */}
          <div className="p-4 sm:p-5">
            {(() => {
              const matchesSearch = (cat: CategoryData) => {
                if (!categorySearch.trim()) return true;
                const q = categorySearch.trim().toLowerCase();
                const name = (cat.name || '').toLowerCase();
                const nameGu = (cat.nameGu || '').toLowerCase();
                const nameHi = (cat.nameHi || '').toLowerCase();
                const slug = (cat.slug || '').toLowerCase();
                return name.includes(q) || nameGu.includes(q) || nameHi.includes(q) || slug.includes(q);
              };

              const isSelected = (cat: CategoryData) => cat.id === categoryId || additionalCategoryIds.includes(cat.id);

              const gujaratList = sortedCategories.gujaratGroup
                .filter(matchesSearch)
                .filter((c) => categoryFilterTab === 'all' || categoryFilterTab === 'gujarat' || (categoryFilterTab === 'selected' && isSelected(c)));

              const mainNewsList = sortedCategories.mainNewsGroup
                .filter(matchesSearch)
                .filter((c) => categoryFilterTab === 'all' || categoryFilterTab === 'news' || (categoryFilterTab === 'selected' && isSelected(c)));

              const electionList = sortedCategories.electionGroup
                .filter(matchesSearch)
                .filter((c) => categoryFilterTab === 'all' || categoryFilterTab === 'elections' || (categoryFilterTab === 'selected' && isSelected(c)));

              const totalMatches = gujaratList.length + mainNewsList.length + electionList.length;

              if (totalMatches === 0) {
                return (
                  <div className="py-12 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                    {categoryFilterTab === 'selected' ? (
                      <div className="space-y-2">
                        <div className="h-10 w-10 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-400">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No categories selected yet</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                          Please check at least one category to assign where your article appears on the website.
                        </p>
                        <button
                          type="button"
                          onClick={() => { setCategorySearch(''); setCategoryFilterTab('all'); }}
                          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                        >
                          Browse All Categories
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="h-10 w-10 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-400">
                          <Search className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                          No categories found matching &quot;{categorySearch}&quot;
                        </p>
                        <button
                          type="button"
                          onClick={() => { setCategorySearch(''); setCategoryFilterTab('all'); }}
                          className="mt-2 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400 cursor-pointer"
                        >
                          Clear search and show all categories
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // Card Renderer with Sleek Design, Custom Check Indicator, and Clear Typography
              const renderCategoryCard = (cat: CategoryData, isSpecialGujaratState = false) => {
                const isPrimary = cat.id === categoryId;
                const isChecked = isPrimary || additionalCategoryIds.includes(cat.id);

                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      if (!isChecked) {
                        if (!categoryId) {
                          handleCategorySelect(cat.id);
                        } else {
                          setAdditionalCategoryIds((prev) => Array.from(new Set([...prev, cat.id])));
                        }
                      } else {
                        // Unchecking
                        const cleanRemaining = additionalCategoryIds.filter((id) => id !== cat.id);
                        if (isPrimary) {
                          if (cleanRemaining.length > 0) {
                            const nextPrimary = cleanRemaining[0];
                            setCategoryId(nextPrimary);
                            setAdditionalCategoryIds(cleanRemaining.filter((id) => id !== nextPrimary));
                          } else {
                            setCategoryId('');
                            setAdditionalCategoryIds([]);
                          }
                        } else {
                          setAdditionalCategoryIds(cleanRemaining);
                        }
                      }
                    }}
                    className={`group relative flex items-start gap-3 rounded-xl border p-3 transition-all duration-150 cursor-pointer select-none ${isPrimary
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100 shadow-xs ring-1 ring-emerald-500/30'
                        : isChecked
                          ? 'border-blue-400 bg-blue-50/70 text-blue-950 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-100 shadow-xs ring-1 ring-blue-400/30'
                          : isSpecialGujaratState
                            ? 'border-emerald-200/90 bg-emerald-50/30 text-zinc-900 hover:border-emerald-400 hover:bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-emerald-700 shadow-2xs'
                            : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-850 shadow-2xs'
                      }`}
                  >
                    {/* Custom Styled Check Indicator */}
                    <div className="pt-0.5 shrink-0">
                      <div
                        className={`h-4.5 w-4.5 rounded-md flex items-center justify-center transition-all ${isPrimary
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : isChecked
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 group-hover:border-emerald-500'
                          }`}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Category Name & Badges */}
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-start justify-between gap-1.5">
                        <span
                          className={`min-w-0 flex-1 text-[13.5px] font-bold leading-snug break-words ${isPrimary
                              ? 'text-emerald-900 dark:text-emerald-200'
                              : isChecked
                                ? 'text-blue-900 dark:text-blue-200'
                                : 'text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
                            }`}
                        >
                          {cat.name}
                        </span>

                        {/* Badges */}
                        <div className="shrink-0 flex items-center gap-1">
                          {isPrimary ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                              ★ Primary
                            </span>
                          ) : isChecked ? null : isSpecialGujaratState ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded shadow-2xs">
                              State
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Secondary selected categories can become the primary category */}
                      {isChecked && !isPrimary && (
                        <div className="mt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (categoryId && categoryId !== cat.id) {
                                setAdditionalCategoryIds((prev) => Array.from(new Set([...prev.filter((id) => id !== cat.id), categoryId])));
                              }
                              setCategoryId(cat.id);
                            }}
                            className="text-[9px] font-bold uppercase tracking-wider bg-white hover:bg-emerald-600 hover:text-white text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
                            title="Set as the Primary Canonical Category"
                          >
                            Set Main
                          </button>
                        </div>
                      )}

                      {/* Gujarati Script Subtitle */}
                      {cat.nameGu && cat.nameGu !== cat.name && (
                        <span className="block text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                          {cat.nameGu}
                        </span>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <div className="space-y-6">
                  {/* SECTION 1: GUJARAT & CITIES / DISTRICTS */}
                  {gujaratList.length > 0 && (
                    <div className="space-y-3">
                      <div
                        onClick={() => setCollapsedSections((p) => ({ ...p, gujarat: !p.gujarat }))}
                        className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-800 cursor-pointer select-none group/sec"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
                            📍
                          </div>
                          <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 group-hover/sec:text-emerald-700 dark:group-hover/sec:text-emerald-300 transition-colors">
                            Gujarat & State Cities / Districts (ગુજરાત અને શહેરો / જિલ્લાઓ)
                          </span>
                          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                            {gujaratList.length + 1}
                          </span>
                          {(gujaratList.some(isSelected) || isFeatured) && (
                            <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                              ✓ {gujaratList.filter(isSelected).length + (isFeatured ? 1 : 0)} selected
                            </span>
                          )}
                        </div>
                        <div className="text-zinc-400 group-hover/sec:text-zinc-700 dark:group-hover/sec:text-zinc-200">
                          {collapsedSections.gujarat ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </div>
                      </div>

                      {!collapsedSections.gujarat && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {/* 0. HOME / NEWS / MAIN HERO GRID CARD (Show in Home / News) */}
                          {(() => {
                            const q = categorySearch.trim().toLowerCase();
                            const matchesHome = !q || 'home'.includes(q) || 'news'.includes(q) || 'hero'.includes(q) || 'મુખ્ય'.includes(q) || 'હોમ'.includes(q) || 'સમાચાર'.includes(q) || 'featured'.includes(q);
                            const matchesTab = categoryFilterTab === 'all' || categoryFilterTab === 'gujarat' || (categoryFilterTab === 'selected' && isFeatured);

                            if (!matchesHome || !matchesTab) return null;

                            return (
                              <div
                                key="__home_hero_card__"
                                onClick={() => setIsFeatured(!isFeatured)}
                                className={`group relative flex items-start gap-3 rounded-xl border p-3 transition-all duration-150 cursor-pointer select-none ${
                                  isFeatured
                                    ? 'border-amber-500 bg-amber-50/80 text-amber-950 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-100 shadow-xs ring-1 ring-amber-500/30'
                                    : 'border-zinc-200 bg-white text-zinc-900 hover:border-amber-400 hover:bg-amber-50/30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-amber-700/60 shadow-2xs'
                                }`}
                              >
                                {/* Custom Styled Check Indicator */}
                                <div className="pt-0.5 shrink-0">
                                  <div
                                    className={`h-4.5 w-4.5 rounded-md flex items-center justify-center transition-all ${
                                      isFeatured
                                        ? 'bg-amber-500 text-white shadow-2xs'
                                        : 'border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 group-hover:border-amber-500'
                                    }`}
                                  >
                                    {isFeatured && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                  </div>
                                </div>

                                {/* Category Name & Badges */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex min-w-0 items-start justify-between gap-1.5">
                                    <span
                                      className={`min-w-0 flex-1 text-[13.5px] font-bold leading-snug break-words ${
                                        isFeatured
                                          ? 'text-amber-900 dark:text-amber-200'
                                          : 'text-zinc-900 dark:text-zinc-100 group-hover:text-amber-700 dark:group-hover:text-amber-300'
                                      }`}
                                    >
                                      Home / News
                                    </span>

                                    {/* Badges */}
                                    <div className="shrink-0 flex items-center gap-1">
                                      {isFeatured ? (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                                          ⭐ Featured
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded shadow-2xs">
                                          Hero Grid
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Gujarati Script Subtitle */}
                                  <span className="block text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                                    મુખ્ય હોમ પેજ / સમાચાર (Show in Home / News)
                                  </span>
                                  <span className="inline-block text-[9.5px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-1.5 py-0.2 rounded mt-1.5">
                                    📍 Main Hero Grid
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {gujaratList.map((cat) => renderCategoryCard(cat, isGujaratCat(cat)))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION 2: MAIN NEWS SECTIONS */}
                  {mainNewsList.length > 0 && (
                    <div className="space-y-3">
                      <div
                        onClick={() => setCollapsedSections((p) => ({ ...p, news: !p.news }))}
                        className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-800 cursor-pointer select-none group/sec"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold">
                            📰
                          </div>
                          <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 group-hover/sec:text-blue-700 dark:group-hover/sec:text-blue-300 transition-colors">
                            Main News Sections (મુખ્ય સમાચાર વિભાગો)
                          </span>
                          <span className="text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            {mainNewsList.length + 2}
                          </span>
                          {(mainNewsList.some(isSelected) || isBreaking || isTrending) && (
                            <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                              ✓ {mainNewsList.filter(isSelected).length + (isBreaking ? 1 : 0) + (isTrending ? 1 : 0)} selected
                            </span>
                          )}
                        </div>
                        <div className="text-zinc-400 group-hover/sec:text-zinc-700 dark:group-hover/sec:text-zinc-200">
                          {collapsedSections.news ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </div>
                      </div>

                      {!collapsedSections.news && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {/* 1. TOP BREAKING NEWS CARD (Before National) */}
                          {(() => {
                            const q = categorySearch.trim().toLowerCase();
                            const matchesBreaking = !q || 'breaking'.includes(q) || 'બ્રેકિંગ'.includes(q) || 'તાજા'.includes(q) || 'ticker'.includes(q) || 'flash'.includes(q);
                            const matchesTab = categoryFilterTab === 'all' || categoryFilterTab === 'news' || (categoryFilterTab === 'selected' && isBreaking);

                            if (!matchesBreaking || !matchesTab) return null;

                            return (
                              <div
                                key="__breaking_news_card__"
                                onClick={() => setIsBreaking(!isBreaking)}
                                className={`group relative flex items-start gap-3 rounded-xl border p-3 transition-all duration-150 cursor-pointer select-none ${
                                  isBreaking
                                    ? 'border-orange-500 bg-orange-50/80 text-orange-950 dark:border-orange-500 dark:bg-orange-950/40 dark:text-orange-100 shadow-xs ring-1 ring-orange-500/30'
                                    : 'border-zinc-200 bg-white text-zinc-900 hover:border-orange-400 hover:bg-orange-50/30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-orange-700/60 shadow-2xs'
                                }`}
                              >
                                {/* Custom Styled Check Indicator */}
                                <div className="pt-0.5 shrink-0">
                                  <div
                                    className={`h-4.5 w-4.5 rounded-md flex items-center justify-center transition-all ${
                                      isBreaking
                                        ? 'bg-orange-500 text-white shadow-2xs'
                                        : 'border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 group-hover:border-orange-500'
                                    }`}
                                  >
                                    {isBreaking && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                  </div>
                                </div>

                                {/* Card Content */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex min-w-0 items-start justify-between gap-1.5">
                                    <span
                                      className={`min-w-0 flex-1 text-[13.5px] font-bold leading-snug break-words ${
                                        isBreaking
                                          ? 'text-orange-900 dark:text-orange-200'
                                          : 'text-zinc-900 dark:text-zinc-100 group-hover:text-orange-700 dark:group-hover:text-orange-300'
                                      }`}
                                    >
                                      Breaking News
                                    </span>

                                    {/* Badges */}
                                    <div className="shrink-0 flex items-center gap-1">
                                      {isBreaking ? (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-orange-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                                          ⚡ Flash
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 px-1.5 py-0.5 rounded shadow-2xs">
                                          Ticker Bar
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Gujarati Script Subtitle */}
                                  <span className="block text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                                    ટોપ બ્રેકિંગ ન્યૂઝ (Top Breaking)
                                  </span>
                                  <span className="inline-block text-[9.5px] font-bold text-orange-700 dark:text-orange-400 bg-orange-100/70 dark:bg-orange-950/60 px-1.5 py-0.2 rounded mt-1.5">
                                    📍 Header & Top Flashes
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* 2. TRENDING STORY CARD (Before National) */}
                          {(() => {
                            const q = categorySearch.trim().toLowerCase();
                            const matchesTrending = !q || 'trending'.includes(q) || 'ટ્રેન્ડિંગ'.includes(q) || 'વાઈરલ'.includes(q) || 'sidebar'.includes(q);
                            const matchesTab = categoryFilterTab === 'all' || categoryFilterTab === 'news' || (categoryFilterTab === 'selected' && isTrending);

                            if (!matchesTrending || !matchesTab) return null;

                            return (
                              <div
                                key="__trending_story_card__"
                                onClick={() => handleToggleTrendingStory()}
                                className={`group relative flex items-start gap-3 rounded-xl border p-3 transition-all duration-150 cursor-pointer select-none ${
                                  isTrending
                                    ? 'border-blue-500 bg-blue-50/80 text-blue-950 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-100 shadow-xs ring-1 ring-blue-500/30'
                                    : 'border-zinc-200 bg-white text-zinc-900 hover:border-blue-400 hover:bg-blue-50/30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-blue-700/60 shadow-2xs'
                                }`}
                              >
                                {/* Custom Styled Check Indicator */}
                                <div className="pt-0.5 shrink-0">
                                  <div
                                    className={`h-4.5 w-4.5 rounded-md flex items-center justify-center transition-all ${
                                      isTrending
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 group-hover:border-blue-500'
                                    }`}
                                  >
                                    {isTrending && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                  </div>
                                </div>

                                {/* Card Content */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex min-w-0 items-start justify-between gap-1.5">
                                    <span
                                      className={`min-w-0 flex-1 text-[13.5px] font-bold leading-snug break-words ${
                                        isTrending
                                          ? 'text-blue-900 dark:text-blue-200'
                                          : 'text-zinc-900 dark:text-zinc-100 group-hover:text-blue-700 dark:group-hover:text-blue-300'
                                      }`}
                                    >
                                      Trending Story
                                    </span>

                                    {/* Badges */}
                                    <div className="shrink-0 flex items-center gap-1">
                                      {isTrending ? (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                                          🔥 Trending
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded shadow-2xs">
                                          Sidebar
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Gujarati Script Subtitle */}
                                  <span className="block text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                                    ટ્રેન્ડિંગ સમાચાર (Sidebar & List)
                                  </span>
                                  <span className="inline-block text-[9.5px] font-bold text-blue-700 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/60 px-1.5 py-0.2 rounded mt-1.5">
                                    📍 Right Sidebar & Feed
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {mainNewsList.map((cat) => renderCategoryCard(cat, false))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION 3: ELECTIONS & SPECIAL TOPICS */}
                  {electionList.length > 0 && (
                    <div className="space-y-3">
                      <div
                        onClick={() => setCollapsedSections((p) => ({ ...p, elections: !p.elections }))}
                        className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-800 cursor-pointer select-none group/sec"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-xs font-bold">
                            🗳️
                          </div>
                          <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 group-hover/sec:text-purple-700 dark:group-hover/sec:text-purple-300 transition-colors">
                            Elections & Special Topics (ચૂંટણી અને વિશેષ વિષયો)
                          </span>
                          <span className="text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded-full">
                            {electionList.length}
                          </span>
                          {electionList.some(isSelected) && (
                            <span className="text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.2 rounded-full">
                              ✓ {electionList.filter(isSelected).length} selected
                            </span>
                          )}
                        </div>
                        <div className="text-zinc-400 group-hover/sec:text-zinc-700 dark:group-hover/sec:text-zinc-200">
                          {collapsedSections.elections ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </div>
                      </div>

                      {!collapsedSections.elections && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {electionList.map((cat) => renderCategoryCard(cat, false))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Placement Badges & Website Location Info */}
        <div className="space-y-3 rounded-2xl border border-gray-400 bg-zinc-50/70 p-4 dark:border-zinc-700 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between border-b border-gray-400 pb-2 dark:border-zinc-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Article Display Placement & Badges (તમારું આર્ટીકલ ક્યાં દેખાશે)</span>
            </span>
            <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">Select where this article should appear on Gujarat Post homepage</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {/* BREAKING NEWS */}
            <label className={`flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${isBreaking
                ? 'border-amber-400 bg-amber-50/80 dark:border-amber-800/80 dark:bg-amber-950/30 shadow-sm'
                : 'border-gray-400 bg-white hover:border-gray-500 dark:border-zinc-600 dark:bg-zinc-900'
              }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bg-amber-500 text-white font-black px-2 py-0.5 rounded text-[10px] tracking-wide shadow-sm">
                    ⚡ BREAKING NEWS
                  </span>
                  <input
                    type="checkbox"
                    checked={isBreaking}
                    onChange={(e) => setIsBreaking(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Top Breaking Ticker Bar</p>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 leading-snug">
                    Shows in red ticker bar at the top of homepage and adds urgent "તાજા સમાચાર" tag.
                  </p>
                </div>
              </div>
              <span className="mt-2 text-[10px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded w-fit">
                📍 Location: Header & Top Flashes
              </span>
            </label>

            {/* TRENDING STORY */}
            <label className={`flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${isTrending
                ? 'border-blue-400 bg-blue-50/80 dark:border-blue-800/80 dark:bg-blue-950/30 shadow-sm'
                : 'border-gray-400 bg-white hover:border-gray-500 dark:border-zinc-600 dark:bg-zinc-900'
              }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-600 text-white font-black px-2 py-0.5 rounded text-[10px] tracking-wide shadow-sm">
                    🔥 TRENDING STORY
                  </span>
                  <input
                    type="checkbox"
                    checked={isTrending}
                    onChange={(e) => handleToggleTrendingStory(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-400 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Trending Sidebar & List</p>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 leading-snug">
                    Appears in "ટ્રેન્ડિંગ સમાચાર" sidebar widget and top read news lists across pages.
                  </p>
                </div>
              </div>
              <span className="mt-2 text-[10px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/60 px-2 py-0.5 rounded w-fit">
                📍 Location: Right Sidebar & Feed
              </span>
            </label>

            {/* FEATURED COVERAGE */}
            <label className={`flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${isFeatured
                ? 'border-emerald-400 bg-emerald-50/80 dark:border-emerald-800/80 dark:bg-emerald-950/30 shadow-sm'
                : 'border-gray-400 bg-white hover:border-gray-500 dark:border-zinc-600 dark:bg-zinc-900'
              }`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-600 text-white font-black px-2 py-0.5 rounded text-[10px] tracking-wide shadow-sm">
                    ⭐ FEATURED COVERAGE
                  </span>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Main Hero Grid Banner</p>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 leading-snug">
                    Promotes article to main homepage Hero Big Banner cards and category top feature spots.
                  </p>
                </div>
              </div>
              <span className="mt-2 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded w-fit">
                📍 Location: Main Hero Grid
              </span>
            </label>
          </div>
        </div>
        <div>
          <RichTextArea
            label="Short Description / Subtitle Excerpt"
            value={(contentLang === 'gu' ? excerptGu : contentLang === 'hi' ? excerptHi : excerpt) || ''}
            onChange={(val) => {
              if (contentLang === 'en') setExcerpt(val);
              else if (contentLang === 'gu') setExcerptGu(val);
              else if (contentLang === 'hi') setExcerptHi(val);
            }}
            placeholder="Brief news hook overview summary..."
            rows={3}
            hideEmbed={true}
          />
        </div>

        {/* 📌 DISTINCT SECTION 1: Highlights ("એક નજરમાં") / Key Points Box */}
        <div className="space-y-2 rounded-2xl border border-gray-400 bg-red-50/30 p-4 dark:border-zinc-700 dark:bg-red-950/10">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-red-800 dark:text-red-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-red-500" />
              <span>Highlights ("એક નજરમાં") / Key Points Box</span>
            </label>
            <button
              type="button"
              onClick={() => {
                const sample = contentLang === 'gu'
                  ? '• નરેન્દ્ર મોદી સ્ટેડિયમમાં આજે મહામુકાબલો, ટિકિટ માટે પડાપડી\n• ગુજરાત પોસ્ટ ખાસ રિપોર્ટ: સ્થાનિક લોકો અને વેપાર પર સીધી અસર\n• સ્થાનિક અધિકારીઓએ જણાવ્યું કે તાજેતરના નિર્ણય બાદ આયોજન શરૂ'
                  : contentLang === 'hi'
                    ? '• नरेंद्र मोदी स्टेडियम में आज महामुकाबला, टिकटों के लिए मची मारामारी\n• गुजरात पोस्ट विशेष रिपोर्ट: स्थानीय लोगों और कारोबार पर सीधा असर\n• अधिकारियों ने बताया कि ताजा फैसले के बाद योजना पर काम शुरू'
                    : '• High-stakes match at Narendra Modi Stadium today, ticket rush\n• Gujarat Post special report: Direct impact on local business and civic movement\n• Officials confirm detailed planning and digital monitoring initiated';
                if (contentLang === 'en') setHighlights(sample);
                else if (contentLang === 'gu') setHighlightsGu(sample);
                else if (contentLang === 'hi') setHighlightsHi(sample);
              }}
              className="text-xs font-bold text-red-600 hover:text-red-800 underline"
            >
              + Insert Sample Highlights
            </button>
          </div>
          <textarea
            value={(contentLang === 'gu' ? highlightsGu : contentLang === 'hi' ? highlightsHi : highlights) || ''}
            onChange={(e) => {
              if (contentLang === 'en') setHighlights(e.target.value);
              else if (contentLang === 'gu') setHighlightsGu(e.target.value);
              else if (contentLang === 'hi') setHighlightsHi(e.target.value);
            }}
            placeholder="• Enter bullet point 1 line by line&#10;• Enter bullet point 2&#10;• Enter bullet point 3"
            rows={4}
            className="w-full rounded-xl border border-gray-400 bg-white px-4 py-3 text-base placeholder:text-gray-500 focus:border-red-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 font-medium text-gray-900 dark:text-zinc-100 leading-relaxed"
          />
        </div>

        {/* 🖼️ DISTINCT SECTION 2: Upload Primary Featured Media (Photo / Video - Multiple Allowed) [Size: 1280px X 720px (16:9)] */}
        <div className="space-y-4 rounded-2xl border border-gray-400 bg-zinc-50/50 p-5 dark:border-zinc-700 dark:bg-zinc-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-400 pb-3 dark:border-zinc-700 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5 flex-wrap">
                <Video className="h-4 w-4 text-red-600 shrink-0" />
                <span>Upload Primary Media (Featured Photo or Video)</span>
                <span className="rounded-md border border-emerald-400 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-black text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-2xs flex items-center gap-1">
                  ⭐ Perfect Size: 1280 × 720 px (16:9 Ratio)
                </span>
                <span className="rounded-md border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  PNG / JPG / WEBP • Max 10 MB
                </span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                Upload multiple Photos or Videos directly from your device, or paste direct media URLs. (Select multiple images at once)
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {primaryMediaList.length > 0 && (
                <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/50">
                  {primaryMediaList.length} Media Selected
                </span>
              )}
              <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800 shrink-0 w-fit">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`text-xs font-extrabold px-3 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${imageMode === 'upload'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload from Device</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`text-xs font-extrabold px-3 py-1.5 rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${imageMode === 'url'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>Media URL</span>
                </button>
              </div>
            </div>
          </div>

          {/* 🌟 Prominent Guidance Banner for Perfect Image Size */}
          <div className="flex items-start gap-3 rounded-xl border-2 border-emerald-400/80 bg-emerald-50/90 p-3.5 text-emerald-950 dark:border-emerald-700/80 dark:bg-emerald-950/40 dark:text-emerald-200 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-xs shadow-xs">
              16:9
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-[13px] text-emerald-900 dark:text-emerald-100">
                  પરફેક્ટ ઇમેજ સાઇઝ: <span className="underline decoration-emerald-500 font-black">1280 × 720 px</span> (16:9 Aspect Ratio)
                </span>
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                  Perfect Fit Everywhere
                </span>
              </div>
              <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                આ <strong>1280 × 720 px (16:9)</strong> સાઇઝ વેબસાઇટમાં બધે જ (હોમપેજ હેડલાઇન, કેટેગરી ગ્રીડ, આર્ટિકલ ડિટેલ પેજ અને WhatsApp / Facebook / Twitter શેરિંગ) કોઈપણ કટિંગ કે બ્લેક બોર્ડર વગર 100% પરફેક્ટ ફિટ થશે. (FHD: <strong>1920 × 1080 px</strong> પણ વાપરી શકો છો).
              </p>
            </div>
          </div>

          {imageMode === 'upload' ? (
            <div className="space-y-3">
              <div className="relative rounded-2xl border-2 border-dashed border-gray-400 bg-white p-6 dark:border-zinc-600 dark:bg-zinc-900/60 text-center transition-all hover:border-red-500 hover:bg-red-50/20 dark:hover:border-red-500">
                <input
                  type="file"
                  id="primary-media-file-input"
                  multiple
                  accept="image/*,video/*,.mp4,.webm,.mov,.m4v,.avi,.jpg,.jpeg,.png,.webp,.gif"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                />
                <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                      <span className="text-xs font-bold text-red-600">Uploading multiple media from device to server...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                          Click to browse or drag & drop multiple Images or Videos from your computer
                        </p>
                        <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 mt-1 flex items-center justify-center gap-1.5 flex-wrap">
                          <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 border border-emerald-300 dark:border-emerald-700">
                            ⭐ Recommended Perfect Size: 1280 × 720 px (16:9 Ratio)
                          </span>
                          <span>(Best fit for Homepage, Category & Article detail)</span>
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                          Photos (JPG, PNG, WebP) up to 10MB • Videos (MP4, WebM, MOV) up to 200MB
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs">
                        <UploadCloud className="h-4 w-4" />
                        <span>Choose Multiple Photos or Videos from Device</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={primaryUrlInput}
                  onChange={(e) => setPrimaryUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPrimaryMediaUrl(primaryUrlInput);
                    }
                  }}
                  placeholder="Paste direct Image URL (https://...) or multiple URLs separated by commas"
                  className="w-full rounded-xl border border-gray-400 bg-white px-4 py-3 text-base placeholder:text-gray-500 text-gray-900 focus:border-red-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => addPrimaryMediaUrl(primaryUrlInput)}
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 shrink-0 cursor-pointer shadow-xs transition-colors"
                >
                  + Add URL
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-zinc-400">
                You can paste direct web links to photos or MP4/WebM videos (separate multiple URLs with commas or newlines).
              </p>
            </div>
          )}

          {primaryMediaList.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-gray-400 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-red-600" />
                  <span>📸 Primary Gallery Media ({primaryMediaList.length} {primaryMediaList.length === 1 ? 'item' : 'items'})</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPrimaryMediaList([]);
                    setFeaturedImage('');
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All Primary Media</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {primaryMediaList.map((mediaUrl, idx) => (
                  <div
                    key={`${mediaUrl}-${idx}`}
                    className={`relative rounded-xl border p-2 bg-white dark:bg-zinc-900 space-y-2 shadow-2xs transition-all ${idx === 0
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : 'border-gray-300 dark:border-zinc-700'
                      }`}
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-black">
                      {mediaUrl.match(/\.(mp4|webm|mov|m4v|avi)(\?.*)?$/i) || mediaUrl.includes('/video/upload/') ? (
                        <video src={mediaUrl} controls className="h-full w-full object-contain" />
                      ) : (
                        <img
                          src={sanitizeImageUrl(mediaUrl)}
                          alt={`Primary media ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 left-2 z-10">
                        {idx === 0 ? (
                          <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                            ⭐ #1 Main Featured
                          </span>
                        ) : (
                          <span className="rounded-md bg-black/75 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            #{idx + 1} Slide
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                      <span className="font-mono text-[11px] text-gray-500 dark:text-zinc-400 truncate max-w-[140px]">
                        {mediaUrl}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => setPrimaryAsMain(idx)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline cursor-pointer"
                            title="Set as Main Headline Photo"
                          >
                            Set Main
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removePrimaryMedia(idx)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          title="Remove media"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 📰 DISTINCT SECTION 3: Description 1 (*) / Main Content Body */}
        <div>
          {pdfUrl && pdfUrl.trim() && (
            <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                📄 PDF Attachment Ready:
              </span>
              <button
                type="button"
                onClick={() => setPdfPosition(pdfPosition === 'after_desc_1' ? 'end' : 'after_desc_1')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  pdfPosition === 'after_desc_1'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{pdfPosition === 'after_desc_1' ? '✓ PDF Placed After Description 1' : 'Place PDF After Description 1 (વર્ણન ૧ પછી)'}</span>
              </button>
            </div>
          )}
          <RichTextArea
            label="Description 1 (*) / Main Content Body"
            required
            value={(contentLang === 'gu' ? desc1Gu : contentLang === 'hi' ? desc1Hi : desc1) || ''}
            onChange={(val) => {
              if (contentLang === 'en') setDesc1(val);
              else if (contentLang === 'gu') setDesc1Gu(val);
              else if (contentLang === 'hi') setDesc1Hi(val);
            }}
            placeholder="Write main story lead paragraphs..."
            rows={8}
          />
        </div>

        {/* 📖 STORY CONTINUATION SECTIONS (Description N & Image N Paired Together) */}
        <div className="space-y-6">
          {storySections.map((slot, idx) => {
            const sectionNum = idx + 2; // Section 2 to Section 10
            const currentDesc = contentLang === 'gu' ? slot.descGu : contentLang === 'hi' ? slot.descHi : slot.descEn;
            const photoNum = sectionNum;
            const labelSuffix = photoNum === 2 ? '2nd' : photoNum === 3 ? '3rd' : `${photoNum}th`;
            const guSectionTitle = sectionNum === 2 ? 'દ્વિતીય વર્ણન (Second Description)' : `વિભાગ ${sectionNum} વર્ણન (Section ${sectionNum})`;

            return (
              <div
                key={slot.id || idx}
                className="space-y-4 rounded-2xl border border-gray-400 bg-zinc-50/50 p-5 dark:border-zinc-700 dark:bg-zinc-950/20 shadow-xs"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-gray-400 pb-3 dark:border-zinc-700">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                      {sectionNum}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <Type className="h-4 w-4 text-blue-600" />
                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                          Description {sectionNum} & Image {sectionNum} ({labelSuffix} Story Block)
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                        Write story continuation and attach corresponding story image for block #{sectionNum}.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {pdfUrl && pdfUrl.trim() && (
                      <button
                        type="button"
                        onClick={() => setPdfPosition(pdfPosition === `after_desc_${sectionNum}` ? 'end' : `after_desc_${sectionNum}`)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          pdfPosition === `after_desc_${sectionNum}`
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        <FileText className="h-3 w-3" />
                        <span>{pdfPosition === `after_desc_${sectionNum}` ? `✓ PDF Placed After Desc ${sectionNum}` : `Place PDF After Desc ${sectionNum}`}</span>
                      </button>
                    )}
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/50">
                      {guSectionTitle}
                    </span>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStorySection(idx)}
                        className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer"
                        title={`Remove Section ${sectionNum}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove Section {sectionNum}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Part 1: Description N */}
                <div>
                  <RichTextArea
                    label={`Description ${sectionNum} (Optional Additional Story Paragraphs & Details)`}
                    value={currentDesc || ''}
                    onChange={(val) => updateStorySectionDesc(idx, val)}
                    placeholder={
                      sectionNum === 2
                        ? 'Write second story paragraphs, continuing analysis, or subheadings...'
                        : `Write section ${sectionNum} story paragraphs, continuing analysis, or subheadings...`
                    }
                    rows={5}
                  />
                </div>

                {/* Part 2: Image N */}
                <div className="rounded-xl border border-gray-400 bg-white p-4 dark:border-zinc-600 dark:bg-zinc-900 space-y-3 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 dark:border-zinc-700/60 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4 text-red-600" />
                        <span>Image {sectionNum} ({labelSuffix} Story Media)</span>
                      </span>
                      <span className="rounded-md border border-emerald-400 bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-2xs">
                        ⭐ Perfect Size: 1280 × 720 px (16:9)
                      </span>
                      <span className="rounded-md border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 text-[10.5px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                        PNG / JPG / WebP • Max 10 MB
                      </span>
                    </div>

                    <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
                      <button
                        type="button"
                        onClick={() => updateStorySection(idx, { imageMode: 'upload' })}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all ${slot.imageMode === 'upload'
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStorySection(idx, { imageMode: 'url' })}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all ${slot.imageMode === 'url'
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                      >
                        Image URL
                      </button>
                    </div>
                  </div>

                  {slot.imageMode === 'upload' ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*,video/*,.mp4,.webm,.mov,.m4v,.avi,.jpg,.jpeg,.png,.webp,.gif"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          updateStorySection(idx, { imageUploading: true });
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
                              method: 'POST',
                              body: formData,
                            });
                            const json = await res.json();
                            const mediaUrl = json.url || json.data?.url || (json.file ? json.file.url : '');
                            if (res.ok && mediaUrl) updateStorySection(idx, { imageUrl: mediaUrl });
                          } catch (err) {
                            console.error(err);
                          } finally {
                            updateStorySection(idx, { imageUploading: false });
                            e.target.value = '';
                          }
                        }}
                        disabled={slot.imageUploading}
                        className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-100 file:text-zinc-800 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-200 cursor-pointer"
                      />
                      {slot.imageUploading && <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />}
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={slot.imageUrl || ''}
                      onChange={(e) => updateStorySection(idx, { imageUrl: e.target.value })}
                      placeholder={`Paste direct Image URL for Image ${sectionNum} (https://...)`}
                      className="w-full rounded-xl border border-gray-400 bg-white px-4 py-2.5 text-base placeholder:text-gray-500 text-gray-900 focus:border-primary focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/20 dark:text-zinc-100"
                    />
                  )}

                  {slot.imageUrl && (
                    <>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-300 dark:border-zinc-700/60">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-24 overflow-hidden rounded-lg border border-gray-400 bg-black shrink-0">
                          {slot.imageUrl.match(/\.(mp4|webm|mov|m4v|avi)(\?.*)?$/i) ||
                            slot.imageUrl.includes('/video/upload/') ? (
                            <video src={slot.imageUrl} controls className="h-full w-full object-cover" />
                          ) : (
                            <img
                              src={sanitizeImageUrl(slot.imageUrl)}
                              alt={`Media ${photoNum} preview`}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <span className="text-xs font-mono text-gray-600 dark:text-zinc-400 truncate max-w-xs">
                          {slot.imageUrl}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateStorySection(idx, { imageUrl: '' })}
                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Clear Image {sectionNum}
                      </button>
                    </div>

                    {/* Toggle: Show Image After Description N in Article */}
                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-dashed border-gray-300 dark:border-zinc-700/60 bg-gray-50/80 dark:bg-zinc-800/40 px-3.5 py-2.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                          {sectionNum === 2
                            ? 'વર્ણન ૨ પછી આર્ટિકલમાં આ ફોટો દર્શાવો (Show Image After Description 2)'
                            : `વિભાગ ${sectionNum} (વર્ણન ${sectionNum}) પછી આ ફોટો દર્શાવો (Show Image After Desc ${sectionNum})`}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={slot.showImageAfterDesc !== false}
                          onChange={(e) => updateStorySection(idx, { showImageAfterDesc: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-600"></div>
                        <span className="ml-2.5 text-xs font-extrabold text-gray-700 dark:text-zinc-300 min-w-[55px]">
                          {slot.showImageAfterDesc !== false ? '✓ હા (Show)' : '✕ ના (Hide)'}
                        </span>
                      </label>
                    </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Paired Story Section Button */}
          {storySections.length < 9 && (
            <button
              type="button"
              onClick={handleAddStorySection}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-400 py-4 text-sm font-bold text-gray-800 transition-all hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-blue-400 dark:hover:bg-blue-950/20"
            >
              <Plus className="h-5 w-5" />
              <span>
                + Add Section (Description {storySections.length + 2} & Image {storySections.length + 2})
              </span>
            </button>
          )}
        </div>

        {/* 💬 DISTINCT SECTION 4: Quote Callout Box (Optional) */}
        <div className="space-y-3 rounded-2xl border border-gray-400 bg-amber-50/30 p-4 dark:border-zinc-700 dark:bg-amber-950/10">
          <label className="block text-sm font-semibold text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
            <Quote className="h-4 w-4 text-amber-600" />
            <span>Quote Callout Box (Optional)</span>
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={(contentLang === 'gu' ? quoteTextGu : contentLang === 'hi' ? quoteTextHi : quoteText) || ''}
                onChange={(e) => {
                  if (contentLang === 'en') setQuoteText(e.target.value);
                  else if (contentLang === 'gu') setQuoteTextGu(e.target.value);
                  else if (contentLang === 'hi') setQuoteTextHi(e.target.value);
                }}
                placeholder={contentLang === 'gu' ? 'ગુજરાતના વિકાસ અને સુરક્ષા માટે મહત્વપૂર્ણ નિર્ણય...' : 'Quote statement text...'}
                className="w-full rounded-xl border border-gray-400 bg-white px-4 py-3 text-base placeholder:text-gray-500 text-gray-900 focus:border-amber-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 font-semibold"
              />
            </div>
            <div>
              <input
                type="text"
                value={(contentLang === 'gu' ? quoteCiteGu : contentLang === 'hi' ? quoteCiteHi : quoteCite) || ''}
                onChange={(e) => {
                  if (contentLang === 'en') setQuoteCite(e.target.value);
                  else if (contentLang === 'gu') setQuoteCiteGu(e.target.value);
                  else if (contentLang === 'hi') setQuoteCiteHi(e.target.value);
                }}
                placeholder="— Police Commissioner, Ahmedabad"
                className="w-full rounded-xl border border-gray-400 bg-white px-4 py-3 text-base placeholder:text-gray-500 text-gray-900 focus:border-amber-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 🎥 SOCIAL MEDIA, VIDEO & DOCUMENT EMBEDS (YouTube, Twitter / X, PDF) */}
        <div className="rounded-2xl border border-gray-400 bg-white p-5 shadow-xs dark:border-zinc-700 dark:bg-zinc-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-400 pb-3 dark:border-zinc-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 font-extrabold text-sm">
              🎥
            </span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Video, Social Media & PDF Document Embeds
              </h3>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                Add YouTube videos, X (Twitter) tweets, Instagram reels/posts, Facebook posts/videos, or official PDF attachments to your news article.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* YouTube Video URL / Embed ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1.5 flex items-center gap-1.5">
                <span className="text-red-600">▶</span> YouTube Video URL / ID
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Ex: https://www.youtube.com/watch?v=... or embed code"
                className="w-full rounded-xl border border-gray-400 bg-zinc-50/50 px-4 py-3 text-base font-medium placeholder:text-gray-500 text-gray-900 focus:border-red-600 focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/20 dark:text-zinc-100"
              />
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Paste YouTube URL or iframe embed code.</p>
            </div>

            {/* Twitter / X Post URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1.5 flex items-center gap-1.5">
                <span className="text-sky-500 font-bold">𝕏</span> Twitter / X Post URL
              </label>
              <input
                type="text"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="Ex: https://x.com/.../status/... or embed code"
                className="w-full rounded-xl border border-gray-400 bg-zinc-50/50 px-4 py-3 text-base font-medium placeholder:text-gray-500 text-gray-900 focus:border-sky-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/20 dark:text-zinc-100"
              />
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Paste tweet URL or embed code to display post card.</p>
            </div>

            {/* Instagram Post / Reel URL / Embed */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1.5 flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white text-[10px]">📸</span> Instagram Post / Reel URL / Embed
              </label>
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="Ex: https://www.instagram.com/p/... or /reel/... or embed code"
                className="w-full rounded-xl border border-gray-400 bg-zinc-50/50 px-4 py-3 text-base font-medium placeholder:text-gray-500 text-gray-900 focus:border-pink-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/20 dark:text-zinc-100"
              />
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Paste Instagram post/reel link or iframe embed code.</p>
            </div>

            {/* Facebook Post / Video URL / Embed */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1.5 flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-[#1877F2] text-white text-[10px] font-bold">f</span> Facebook Post / Video URL / Embed
              </label>
              <input
                type="text"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="Ex: https://www.facebook.com/... or watch link or embed code"
                className="w-full rounded-xl border border-gray-400 bg-zinc-50/50 px-4 py-3 text-base font-medium placeholder:text-gray-500 text-gray-900 focus:border-blue-600 focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/20 dark:text-zinc-100"
              />
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Paste Facebook post, video link, or iframe embed code.</p>
            </div>
          </div>

          {/* PDF File / Attachment */}
          <div className="pt-2 border-t border-gray-300 dark:border-zinc-800">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1.5 flex items-center gap-1.5">
                <span className="text-red-500">📄</span> PDF Document File / URL
              </label>

              {pdfUrl && pdfUrl.trim() ? (
                <div className="flex items-center justify-between gap-2.5 rounded-xl border border-emerald-500/50 bg-emerald-50/70 dark:border-emerald-800/60 dark:bg-emerald-950/20 px-3.5 py-2.5 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                      <FileText className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 truncate font-mono" title={pdfUrl}>
                        {pdfUrl.split('/').pop()?.split('?')[0] || 'document.pdf'}
                      </p>
                      <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Attached & Ready</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <label
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 px-2.5 py-1.5 text-xs font-bold cursor-pointer transition-all shadow-xs"
                      title="Replace PDF file"
                    >
                      {uploadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      <span>{uploadingPdf ? '...' : 'Change'}</span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                        disabled={uploadingPdf}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setPdfUrl('');
                        setShowPdfPages(false);
                        setDesc1((p) => purgePdfFromText(p));
                        setDesc1Gu((p) => purgePdfFromText(p));
                        setDesc1Hi((p) => purgePdfFromText(p));
                        setStorySections((prev) =>
                          prev.map((item) => ({
                            ...item,
                            descEn: purgePdfFromText(item.descEn),
                            descGu: purgePdfFromText(item.descGu),
                            descHi: purgePdfFromText(item.descHi),
                          }))
                        );
                      }}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Remove PDF document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 rounded-xl border border-gray-400 bg-zinc-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer shadow-2xs shrink-0">
                      {uploadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      <span>{uploadingPdf ? 'Uploading...' : 'Choose PDF'}</span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                        disabled={uploadingPdf}
                      />
                    </label>
                    <input
                      type="text"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      placeholder="https://.../document.pdf or /uploads/..."
                      className="w-full rounded-xl border border-gray-400 bg-zinc-50/50 px-3 py-2.5 text-base font-medium placeholder:text-gray-500 text-gray-900 focus:border-red-600 focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/20 dark:text-zinc-100"
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Upload PDF file from computer or enter URL.</p>
                </div>
              )}
            </div>
          </div>

          {/* Full-Width PDF Page-by-Page Document Reader Toggle Banner */}
          {pdfUrl && pdfUrl.trim() && (
            <>
              <div className={`rounded-xl border p-3.5 sm:p-4 transition-all duration-200 shadow-xs ${showPdfPages
                  ? 'border-blue-300 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 dark:border-blue-800/80 dark:from-blue-950/40 dark:via-zinc-900 dark:to-blue-950/40 ring-1 ring-blue-500/20'
                  : 'border-gray-300 bg-zinc-50/70 dark:border-zinc-700/80 dark:bg-zinc-950/40'
                }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors shadow-xs ${showPdfPages
                        ? 'bg-blue-600 text-white shadow-blue-600/30'
                        : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                      <BookOpen className="h-5 w-5 stroke-[2.2]" />
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Show Full PDF Page-by-Page in Article
                        </span>
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                          {pdfPosition === 'after_desc_1'
                            ? '(વર્ણન ૧ પછી આખું PDF પાનાવાર દર્શાવો)'
                            : pdfPosition === 'after_desc_2'
                            ? '(વર્ણન ૨ પછી આખું PDF પાનાવાર દર્શાવો)'
                            : pdfPosition.startsWith('after_desc_')
                            ? `(વિભાગ ${pdfPosition.replace('after_desc_', '')} પછી આખું PDF પાનાવાર દર્શાવો)`
                            : pdfPosition === 'custom'
                            ? '(કસ્ટમ સ્થાને આખું PDF પાનાવાર દર્શાવો)'
                            : '(આર્ટિકલના અંતે આખું PDF પાનાવાર દર્શાવો)'}
                        </span>
                        {showPdfPages && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                            ✓ Reader Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Displays every page of the document sequentially like images at the selected position, allowing readers to read the full document directly without downloading.
                      </p>
                    </div>
                  </div>

                  {/* Modern Switch Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 self-end sm:self-center">
                    <input
                      type="checkbox"
                      checked={showPdfPages}
                      onChange={(e) => setShowPdfPages(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6.5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                  </label>
                </div>
              </div>

              {/* PDF Position Selector inside Article */}
              <div className="rounded-xl border border-gray-300 bg-white p-3.5 sm:p-4 dark:border-zinc-700/80 dark:bg-zinc-900/60 shadow-xs space-y-2 mt-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <span>આર્ટિકલમાં PDF નું સ્થાન (PDF Position in Article)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      પસંદ કરો કે આર્ટિકલમાં PDF ક્યાં દર્શાવવું છે (વર્ણન ૧ પછી, વર્ણન ૨ પછી, અથવા આર્ટિકલના અંતે).
                    </p>
                  </div>
                  <div className="w-full sm:w-72 shrink-0">
                    <select
                      value={pdfPosition}
                      onChange={(e) => setPdfPosition(e.target.value)}
                      className="w-full rounded-xl border-2 border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 shadow-xs focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 transition-all cursor-pointer"
                    >
                      <option value="end">આર્ટિકલના અંતે (At the End of Article) — Default</option>
                      <option value="after_desc_1">વર્ણન ૧ પછી (After Description 1)</option>
                      {storySections.map((sec, idx) => {
                        const secNum = idx + 2;
                        const label = secNum === 2
                          ? 'બીજું વર્ણન (વર્ણન ૨) પછી (After Description 2)'
                          : `વિભાગ ${secNum} (વર્ણન ${secNum}) પછી (After Description ${secNum})`;
                        return (
                          <option key={`pdf-pos-${secNum}`} value={`after_desc_${secNum}`}>
                            {label}
                          </option>
                        );
                      })}
                      <option value="custom">કસ્ટમ સ્થાન (Inside Description via [PDF_DOCUMENT])</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* LINE 7: SEO Details & Publication Status */}
        <div className="space-y-4 border-t border-gray-400 pt-5 dark:border-zinc-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 uppercase tracking-wider">
                SEO & Publication Settings
              </h3>
              {seoSource === 'gemini' && (
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  🤖 Generated by Google Gemini AI (FREE Engine)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => generateSeoWithGeminiAI(undefined, undefined, undefined, false)}
              disabled={loadingAiSeo}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400 bg-emerald-50 px-3.5 py-1.5 text-xs font-black text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="Use Google Gemini AI to generate high-ranking bilingual SEO metadata"
            >
              {loadingAiSeo ? <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" /> : <Sparkles className="h-3.5 w-3.5 text-emerald-600" />}
              <span>{loadingAiSeo ? 'Gemini AI Generating...' : '🤖 Gemini AI Auto-Fill'}</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1.5">
                Article No. (#)
              </label>
              <div className="w-full rounded-xl border border-gray-400 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900/50 px-4 py-3 text-base font-bold text-gray-900 dark:text-zinc-200 flex items-center justify-between">
                <span>{articleNumber ? `#${articleNumber}` : 'Auto-generated on save'}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-200/80 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  Auto Sequence
                </span>
              </div>
            </div>

            {userRole !== 'REPORTER' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-zinc-100">
                  Status
                </label>
                <CustomSelect
                  value={status === 'SCHEDULED' || status === 'ARCHIVED' ? status : ''}
                  onChange={(value) => {
                    if (value !== 'SCHEDULED' && value !== 'ARCHIVED') return;
                    setStatus(value);
                    if (value === 'SCHEDULED' && !scheduledAt) setScheduledAt(getFutureDefaultIso());
                    if (value === 'ARCHIVED') setScheduledAt('');
                    setScheduledAtError(null);
                    setFieldErrors((previous) => ({ ...previous, scheduledAt: false }));
                  }}
                  options={[
                    { value: 'SCHEDULED', label: 'Scheduled' },
                    { value: 'ARCHIVED', label: 'Archived' },
                  ]}
                  placeholder="Select Scheduled or Archived"
                  searchable={false}
                />
              </div>
            )}

            {userRole !== 'REPORTER' && (
              <div id="field-scheduledAt">
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-sm font-semibold ${scheduledAtError || fieldErrors.scheduledAt
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-900 dark:text-zinc-100'
                    }`}>
                    Scheduled Publish Date & Time ⏰
                  </label>
                  {scheduledAt && (
                    <button
                      type="button"
                      onClick={() => {
                        setScheduledAt('');
                        setScheduledAtError(null);
                        setFieldErrors((prev) => ({ ...prev, scheduledAt: false }));
                        if (status === 'SCHEDULED') setStatus('DRAFT');
                      }}
                      className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="datetime-local"
                  suppressHydrationWarning
                  min={getCurrentLocalMinDateTime()}
                  value={scheduledAt}
                  onChange={(e) => {
                    const val = e.target.value;
                    setScheduledAt(val);
                    const err = validateScheduledTime(val);
                    setScheduledAtError(err);
                    setFieldErrors((prev) => ({ ...prev, scheduledAt: Boolean(err) }));
                    if (val && status !== 'SCHEDULED' && !err) {
                      setStatus('SCHEDULED');
                    }
                  }}
                  onBlur={(e) => {
                    const err = validateScheduledTime(e.target.value);
                    setScheduledAtError(err);
                    setFieldErrors((prev) => ({ ...prev, scheduledAt: Boolean(err) }));
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-base font-mono focus:outline-none transition-all ${scheduledAtError || fieldErrors.scheduledAt
                      ? 'border-2 border-red-500 bg-red-50/80 text-red-900 ring-2 ring-red-500/20 dark:border-red-600 dark:bg-red-950/40 dark:text-red-200'
                      : 'border-gray-400 bg-zinc-50/50 text-gray-900 focus:border-primary dark:border-zinc-600 dark:bg-zinc-950/20 dark:text-white'
                    }`}
                />
                {scheduledAtError || fieldErrors.scheduledAt ? (
                  <div className="mt-2 rounded-lg border border-red-400 bg-red-50 p-2.5 dark:border-red-900/60 dark:bg-red-950/30 text-xs font-bold text-red-600 dark:text-red-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p>{scheduledAtError || 'Scheduled publish date & time must be in the future.'}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const futureIso = getFutureDefaultIso();
                          setScheduledAt(futureIso);
                          setScheduledAtError(null);
                          setFieldErrors((prev) => ({ ...prev, scheduledAt: false }));
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 underline hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                      >
                        ⚡ Set to 1 hour from now
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                    Article will automatically become visible on the public website when this time arrives.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1.5">
                Reading Time (Minutes)
              </label>
              <input
                type="number"
                value={readingTime || 3}
                onChange={(e) => setReadingTime(Number(e.target.value))}
                min={1}
                className="w-full rounded-xl border border-gray-400 bg-zinc-50/50 px-4 py-3 text-base text-gray-900 focus:border-primary focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/20 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1.5">
              SEO Title
            </label>
            <input
              type="text"
              value={seoTitle || ''}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Flood havoc in Gujarat 30 deaths in two days Ahmedabad records highest rainfall in 20 years gujaratpost news"
              className="w-full rounded-xl border border-gray-400 bg-zinc-50/50 px-4 py-3 text-base placeholder:text-gray-500 text-gray-900 focus:border-primary focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1.5">
              SEO Description
            </label>
            <textarea
              value={seoDescription || ''}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Flood havoc in Gujarat 30 deaths in two days Ahmedabad records highest rainfall in 20 years gujaratpost news"
              rows={2}
              className="w-full rounded-xl border border-gray-400 bg-zinc-50/50 px-4 py-3 text-base placeholder:text-gray-500 text-gray-900 focus:border-primary focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1.5">
              SEO Keywords (comma separated)
            </label>
            <input
              type="text"
              value={seoKeywords || ''}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="Flood havoc in Gujarat, Ahmedabad rainfall, Gujarat post news"
              className="w-full rounded-xl border border-gray-400 bg-zinc-50/50 px-4 py-3 text-base placeholder:text-gray-500 text-gray-900 focus:border-primary focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/20"
            />
          </div>
          {/* Article Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1.5">
              Article Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsString || ''}
              onChange={(e) => setTagsString(e.target.value)}
              placeholder="Gujarat, Ahmedabad, rain, weather"
              className="w-full rounded-xl border border-gray-400 bg-zinc-50/50 px-4 py-3 text-base placeholder:text-gray-500 text-gray-900 focus:border-primary focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/20"
            />
            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
              Enter words separated by commas.
            </p>
          </div>
        </div>

        {/* 🚀 BOTTOM STICKY ACTION BAR (Save Article, Preview Article, Cancel) */}
        <div className="sticky bottom-3 z-20 grid grid-cols-1 gap-3 rounded-2xl border border-gray-300 bg-white p-4 shadow-xl dark:border-zinc-600 dark:bg-zinc-900 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:p-5" style={{ fontSize: 14, fontWeight: 700 }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/admin/articles');
              }
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-300 bg-zinc-100 px-5 py-3 text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 cursor-pointer"
          >
            Cancel & Exit
          </button>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap">
            <button type="button" disabled={loading} onClick={(event) => handleSubmit(event, 'DRAFT')}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-zinc-900 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-500 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700">
              {loading && status === 'DRAFT' ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Save className="h-4 w-4 shrink-0" />}
              <span>{loading && status === 'DRAFT' ? 'Saving Draft...' : 'Save Draft'}</span>
            </button>
            <button type="button" disabled={loading} onClick={() => setShowLivePreview(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 text-blue-800 transition hover:bg-blue-100 disabled:opacity-50 dark:border-blue-600 dark:bg-blue-950 dark:text-blue-100 dark:hover:bg-blue-900">
              <Eye className="h-4 w-4 shrink-0" /><span>Preview Article</span>
            </button>
            {userRole !== 'REPORTER' && (
              <button type="button" disabled={loading} onClick={(event) => handleSubmit(event, 'PUBLISHED')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-600 bg-red-600 px-5 py-3 text-white shadow-md transition hover:bg-red-700 disabled:opacity-50 min-[420px]:col-span-2">
                {loading && status !== 'DRAFT' ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <UploadCloud className="h-4 w-4 shrink-0" />}
                <span>{loading && status !== 'DRAFT' ? 'Saving Article...' : status === 'ARCHIVED' ? 'Archive Article' : scheduledAt.trim() ? 'Schedule Article' : 'Publish Article'}</span>
              </button>
            )}
          </div>
        </div>

      </form>

      {/* 👁️ LIVE ARTICLE PREVIEW MODAL OVERLAY */}
      {showLivePreview && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLivePreview(false);
          }}
        >
          <div
            className="relative w-full max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 md:p-8 shadow-2xl dark:bg-zinc-900 border border-gray-400 dark:border-zinc-700 space-y-6 overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-400 pb-4 dark:border-zinc-700">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Eye className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                    <span>Live Article Reader Preview</span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-300 dark:border-blue-900/40">
                      Live Preview Mode
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">This is how your news article will appear to readers on the website.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLivePreview(false)}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview Content Body */}
            <div className="space-y-6">

              {/* Category & Location Badges */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="bg-red-600 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider text-[11px]">
                  {categories.find((c) => c.id === categoryId)?.name || 'News Category'}
                </span>
                {location && (
                  <span className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 font-bold px-3 py-1 rounded-full text-[11px] flex items-center gap-1">
                    📍 {location}
                  </span>
                )}
                <span className="text-zinc-400 text-[11px] ml-auto">
                  ⏱️ {readingTime || 3} min read
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white leading-tight">
                {(contentLang === 'gu' ? titleGu : contentLang === 'hi' ? titleHi : title) || 'Article Title Preview'}
              </h1>

              {/* Subtitle / Excerpt */}
              {((contentLang === 'gu' ? excerptGu : contentLang === 'hi' ? excerptHi : excerpt) || '').trim() && (
                <div className="border-l-4 border-red-600 pl-4 py-0.5 text-base text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                  {renderFormattedPreviewContent(contentLang === 'gu' ? excerptGu : contentLang === 'hi' ? excerptHi : excerpt)}
                </div>
              )}

              {/* Featured Media / Primary Media Gallery Preview */}
              {primaryMediaList.length > 0 ? (
                <div className="space-y-2">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-gray-400 dark:border-zinc-700 bg-black shadow-md">
                    {primaryMediaList[0].match(/\.(mp4|webm|mov|m4v|avi)(\?.*)?$/i) ? (
                      <video src={primaryMediaList[0]} controls className="h-full w-full object-cover" />
                    ) : (
                      <img src={sanitizeImageUrl(primaryMediaList[0])} alt="Featured Media" className="h-full w-full object-cover" />
                    )}
                    {primaryMediaList.length > 1 && (
                      <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded shadow">
                        1 / {primaryMediaList.length} Photos
                      </div>
                    )}
                  </div>
                  {primaryMediaList.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {primaryMediaList.map((url, i) => (
                        <div key={i} className="relative aspect-[16/9] overflow-hidden rounded-lg border border-gray-300 dark:border-zinc-700 bg-black">
                          <img src={sanitizeImageUrl(url)} alt={`Slide ${i + 1}`} className="h-full w-full object-cover" />
                          <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white font-bold px-1 rounded">#{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : featuredImage && (
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-gray-400 dark:border-zinc-700 bg-black shadow-md">
                  {featuredImage.match(/\.(mp4|webm|mov|m4v|avi)(\?.*)?$/i) ? (
                    <video src={featuredImage} controls className="h-full w-full object-cover" />
                  ) : (
                    <img src={sanitizeImageUrl(featuredImage)} alt="Featured Media" className="h-full w-full object-cover" />
                  )}
                </div>
              )}

              {/* Highlights Box */}
              {((contentLang === 'gu' ? highlightsGu : contentLang === 'hi' ? highlightsHi : highlights) || '').trim() && (
                <div className="rounded-2xl border border-red-400 bg-red-50/50 p-4 dark:border-red-950/40 dark:bg-red-950/20 space-y-2">
                  <h4 className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-red-500" />
                    <span>📌 એક નજરમાં (KEY HIGHLIGHTS)</span>
                  </h4>
                  <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                    {renderFormattedPreviewContent(contentLang === 'gu' ? highlightsGu : contentLang === 'hi' ? highlightsHi : highlights)}
                  </div>
                </div>
              )}

              {/* Main Content (Desc 1) */}
              {((contentLang === 'gu' ? desc1Gu : contentLang === 'hi' ? desc1Hi : desc1) || '').trim() && (
                renderFormattedPreviewContent(contentLang === 'gu' ? desc1Gu : contentLang === 'hi' ? desc1Hi : desc1)
              )}

              {/* PDF Preview after Desc 1 */}
              {pdfPosition === 'after_desc_1' && renderLivePreviewPdf()}

              {/* Quote Box Preview */}
              {((contentLang === 'gu' ? quoteTextGu : contentLang === 'hi' ? quoteTextHi : quoteText) || '').trim() && (
                <blockquote className="my-6 border-l-[3px] border-red-600 pl-4 py-1 font-sans">
                  <p className="text-lg md:text-[20px] font-bold text-zinc-900 dark:text-white leading-snug">
                    "{(contentLang === 'gu' ? quoteTextGu : contentLang === 'hi' ? quoteTextHi : quoteText).replace(/^"/, '').replace(/"$/, '')}"
                  </p>
                  {((contentLang === 'gu' ? quoteCiteGu : contentLang === 'hi' ? quoteCiteHi : quoteCite) || '').trim() && (
                    <footer className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      — {(contentLang === 'gu' ? quoteCiteGu : contentLang === 'hi' ? quoteCiteHi : quoteCite)}
                    </footer>
                  )}
                </blockquote>
              )}

              {/* Story Continuation Sections Preview (Sequential Description N & Image N) */}
              {storySections.map((sec, idx) => {
                const descVal = (contentLang === 'gu' ? sec.descGu : contentLang === 'hi' ? sec.descHi : sec.descEn) || '';
                const hasDesc = Boolean(descVal.trim());
                const hasImg = Boolean(sec.imageUrl && sec.imageUrl.trim());
                if (!hasDesc && !hasImg) return null;

                return (
                  <div key={sec.id || idx} className="space-y-4 pt-2">
                    {hasDesc && (
                      <div className="border-t border-gray-300 pt-4 dark:border-zinc-700">
                        {renderFormattedPreviewContent(descVal)}
                      </div>
                    )}
                    {hasImg && sec.showImageAfterDesc !== false && (
                      <div className="relative aspect-[16/9] w-full max-w-xl overflow-hidden rounded-xl border border-gray-400 bg-black dark:border-zinc-700 shadow-sm mx-auto">
                        <img
                          src={sanitizeImageUrl(sec.imageUrl)}
                          alt={`Story section ${idx + 2} preview`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    {/* PDF Preview after this Story Section */}
                    {pdfPosition === `after_desc_${idx + 2}` && renderLivePreviewPdf()}
                  </div>
                );
              })}

              <ArticleSocialPreview input={youtubeUrl} platform="youtube" />
              <ArticleSocialPreview input={twitterUrl} platform="twitter" />
              <ArticleSocialPreview input={instagramUrl} platform="instagram" />
              <ArticleSocialPreview input={facebookUrl} platform="facebook" />

              {/* PDF Document Attachment Preview (At End of Article) */}
              {(pdfPosition === 'end' || !pdfPosition) && renderLivePreviewPdf()}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-gray-400 pt-4 dark:border-zinc-700">
              <span className="text-xs font-mono text-zinc-400">Slug: /{slug || 'preview-news'}</span>
              <button
                type="button"
                onClick={() => setShowLivePreview(false)}
                className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Custom City / Location Creation Modal */}
      {showCustomLocModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50 duration-150">
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100">Add Custom City / Location</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Saved permanently for all future articles</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomLocModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customLocInputName.trim()) return;
                handleCreateCustomLocation(customLocInputName, customLocInputSublabel);
                setShowCustomLocModal(false);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  City / Location Name (In English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={customLocInputName}
                  onChange={(e) => setCustomLocInputName(e.target.value)}
                  placeholder="e.g. Patan, Deesa, Mandvi, Sydney"
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm font-medium text-gray-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Regional / Gujarati Label <span className="text-xs text-zinc-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={customLocInputSublabel}
                  onChange={(e) => setCustomLocInputSublabel(e.target.value)}
                  placeholder="e.g. પાટણ, ડીસા"
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm font-medium text-gray-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomLocModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customLocInputName.trim()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add & Select Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
