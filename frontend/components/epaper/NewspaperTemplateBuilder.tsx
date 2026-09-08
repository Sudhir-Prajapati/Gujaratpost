'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  Save,
  Send,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Upload,
  Download,
  ArrowLeft,
  Coins,
  Sparkles,
  Layers,
  Compass,
  Tag,
  Image as ImageIcon,
  AlignLeft,
  Type,
  Check,
  Trash2,
  ExternalLink,
  RefreshCw,
  ListOrdered,
  LayoutGrid,
  ChevronRight,
  Info,
  MapPin,
  Plus,
  Trophy,
  Film,
} from 'lucide-react';
import { NewspaperTemplateData, getDefaultTemplateData, NewsStory, Page1Data } from './types';
import { Page1Front, samplePage1Data } from './Page1Front';
import { Page2Gujarat } from './Page2Gujarat';
import { Page3Business } from './Page3Business';
import { Page4Sports } from './Page4Sports';
import { MarketRatesEditor } from './MarketRatesEditor';
import { HoroscopeEditor } from './HoroscopeEditor';
import { WeatherEditor } from './WeatherEditor';
import { HeaderEditor } from './HeaderEditor';
import { fetchLiveCityWeather } from '@/lib/weather';
import { ArticleImportModal } from './ArticleImportModal';
import {
  renderElementToDataUrl,
  buildPdfFromImages,
  uploadPdfBlob,
  uploadImageBlob,
  dataUrlToBlob,
  downloadPdfBlob,
} from './HighResExporter';

interface NewspaperTemplateBuilderProps {
  initialData?: NewspaperTemplateData | null;
  city: string;
  cityGu?: string;
  date: string;
  onSaveDraft: (templateData: NewspaperTemplateData, pageImages: string[]) => Promise<void>;
  onPublish: (
    templateData: NewspaperTemplateData,
    pageImages: string[],
    pdfUrl?: string,
    pdfBlob?: Blob,
    thumbnailUrl?: string
  ) => Promise<void>;
  onBackToDashboard: () => void;
}

const CATEGORY_PRESETS = [
  'મુખ્ય સમાચાર',
  'રાજકીય',
  'શિક્ષણ',
  'ક્રાઇમ',
  'વ્યાપાર',
  'રમત-જગત',
  'હવામાન',
  'મનોરંજન',
  'આરોગ્ય',
];

export const NewspaperTemplateBuilder: React.FC<NewspaperTemplateBuilderProps> = ({
  initialData,
  city,
  cityGu,
  date,
  onSaveDraft,
  onPublish,
  onBackToDashboard,
}) => {
  const [data, setData] = useState<NewspaperTemplateData>(() => {
    const defaults = getDefaultTemplateData(cityGu || city, date);
    if (!initialData || !initialData.page1) return defaults;

    const merged: NewspaperTemplateData = {
      ...defaults,
      ...initialData,
      page1: {
        ...defaults.page1,
        ...initialData.page1,
        sideTopNews: {
          ...defaults.page1.sideTopNews,
          ...(initialData.page1.sideTopNews || {}),
        },
        newsBlocks: Array.isArray(initialData.page1.newsBlocks) && initialData.page1.newsBlocks.length > 0
          ? initialData.page1.newsBlocks
          : defaults.page1.newsBlocks,
        bottomLeftFeature: {
          ...defaults.page1.bottomLeftFeature,
          ...(initialData.page1.bottomLeftFeature || {}),
        },
        bottomMiddleSports: {
          ...defaults.page1.bottomMiddleSports,
          ...(initialData.page1.bottomMiddleSports || {}),
        },
      },
      page2: {
        ...defaults.page2,
        ...(initialData.page2 || {}),
        mainDistrictStory: {
          ...defaults.page2.mainDistrictStory,
          ...(initialData.page2?.mainDistrictStory || {}),
        },
        sideLeadStory: {
          ...defaults.page2.sideLeadStory,
          ...(initialData.page2?.sideLeadStory || {}),
        },
        districtStories: Array.isArray(initialData.page2?.districtStories) && initialData.page2.districtStories.length > 0
          ? initialData.page2.districtStories
          : defaults.page2.districtStories,
        bottomLeftFeature: {
          ...defaults.page2.bottomLeftFeature,
          ...(initialData.page2?.bottomLeftFeature || {}),
        },
        bottomRightFeature: {
          ...defaults.page2.bottomRightFeature,
          ...(initialData.page2?.bottomRightFeature || {}),
        },
      },
      page3: {
        ...defaults.page3,
        ...(initialData.page3 || {}),
        businessStory: {
          ...defaults.page3.businessStory,
          ...(initialData.page3?.businessStory || {}),
        },
        editorial: {
          ...defaults.page3.editorial,
          ...(initialData.page3?.editorial || {}),
        },
        politicsStory: {
          ...defaults.page3.politicsStory,
          ...(initialData.page3?.politicsStory || {}),
        },
        techStory: {
          ...(defaults.page3 as any).techStory,
          ...((initialData.page3 as any)?.techStory || {}),
        },
        bankingStory: {
          ...(defaults.page3 as any).bankingStory,
          ...((initialData.page3 as any)?.bankingStory || {}),
        },
        startupStory: {
          ...(defaults.page3 as any).startupStory,
          ...((initialData.page3 as any)?.startupStory || {}),
        },
        commodityStory: {
          ...(defaults.page3 as any).commodityStory,
          ...((initialData.page3 as any)?.commodityStory || {}),
        },
        corporateBriefs: Array.isArray((initialData.page3 as any)?.corporateBriefs) && (initialData.page3 as any).corporateBriefs.length > 0
          ? (initialData.page3 as any).corporateBriefs
          : (defaults.page3 as any).corporateBriefs,
        marketRates: {
          ...defaults.page3.marketRates,
          ...(initialData.page3?.marketRates || {}),
        },
        advertisement: {
          ...defaults.page3.advertisement,
          ...(initialData.page3?.advertisement || {}),
        },
      },
      page4: {
        ...defaults.page4,
        ...(initialData.page4 || {}),
        mainSportsStory: {
          ...defaults.page4.mainSportsStory,
          ...(initialData.page4?.mainSportsStory || {}),
          keyPoints: initialData.page4?.mainSportsStory?.keyPoints
            ? {
                ...initialData.page4.mainSportsStory.keyPoints,
                points: Array.isArray(initialData.page4.mainSportsStory.keyPoints.points)
                  ? initialData.page4.mainSportsStory.keyPoints.points.slice(0, 3)
                  : (defaults.page4.mainSportsStory.keyPoints?.points || []),
              }
            : defaults.page4.mainSportsStory.keyPoints,
        },
        secondarySportsStory: {
          ...defaults.page4.secondarySportsStory,
          ...(initialData.page4?.secondarySportsStory || {}),
        },
        entertainmentStory: {
          ...defaults.page4.entertainmentStory,
          ...(initialData.page4?.entertainmentStory || {}),
          keyPoints: initialData.page4?.entertainmentStory?.keyPoints
            ? {
                ...initialData.page4.entertainmentStory.keyPoints,
                points: Array.isArray(initialData.page4.entertainmentStory.keyPoints.points)
                  ? initialData.page4.entertainmentStory.keyPoints.points.slice(0, 3)
                  : (defaults.page4.entertainmentStory.keyPoints?.points || []),
              }
            : defaults.page4.entertainmentStory.keyPoints,
        },
        ottLifestyleStory: {
          ...(defaults.page4 as any).ottLifestyleStory,
          ...((initialData.page4 as any)?.ottLifestyleStory || {}),
        },
        sportsBriefs: Array.isArray((initialData.page4 as any)?.sportsBriefs) && (initialData.page4 as any).sportsBriefs.length > 0
          ? (initialData.page4 as any).sportsBriefs
          : (defaults.page4 as any).sportsBriefs,
        bottomStories: Array.isArray((initialData.page4 as any)?.bottomStories) && (initialData.page4 as any).bottomStories.length > 0
          ? (initialData.page4 as any).bottomStories
          : (defaults.page4 as any).bottomStories,
        horoscope: Array.isArray(initialData.page4?.horoscope) && initialData.page4.horoscope.length > 0
          ? initialData.page4.horoscope
          : defaults.page4.horoscope,
      },
    };

    if (merged.page1.leadStory) {
      const defLead = samplePage1Data.mainHeadline;
      if (!merged.page1.leadStory.paragraph1?.trim()) merged.page1.leadStory.paragraph1 = defLead.paragraph1;
      if (!merged.page1.leadStory.paragraph2?.trim()) merged.page1.leadStory.paragraph2 = defLead.paragraph2;
      if (!merged.page1.leadStory.paragraph3?.trim()) merged.page1.leadStory.paragraph3 = defLead.paragraph3;
      if (!merged.page1.leadStory.headline?.trim()) merged.page1.leadStory.headline = defLead.headline;
      if (!merged.page1.leadStory.subheadline?.trim()) merged.page1.leadStory.subheadline = defLead.subheadline;
      if (!merged.page1.leadStory.articleBody?.trim()) merged.page1.leadStory.articleBody = defLead.body;
    }
    if (merged.page1.mainHeadline) {
      const defLead = samplePage1Data.mainHeadline;
      if (!merged.page1.mainHeadline.paragraph1?.trim()) merged.page1.mainHeadline.paragraph1 = defLead.paragraph1;
      if (!merged.page1.mainHeadline.paragraph2?.trim()) merged.page1.mainHeadline.paragraph2 = defLead.paragraph2;
      if (!merged.page1.mainHeadline.paragraph3?.trim()) merged.page1.mainHeadline.paragraph3 = defLead.paragraph3;
      if (!merged.page1.mainHeadline.headline?.trim()) merged.page1.mainHeadline.headline = defLead.headline;
      if (!merged.page1.mainHeadline.subheadline?.trim()) merged.page1.mainHeadline.subheadline = defLead.subheadline;
      if (!merged.page1.mainHeadline.body?.trim()) merged.page1.mainHeadline.body = defLead.body;
    }

    if (merged.page1.sideTopNews) {
      if (!merged.page1.sideTopNews.paragraph1?.trim()) {
        merged.page1.sideTopNews.paragraph1 = defaults.page1.sideTopNews?.paragraph1 || samplePage1Data.sideTopNews.paragraph1;
      }
      if (!merged.page1.sideTopNews.paragraph2?.trim()) {
        merged.page1.sideTopNews.paragraph2 = defaults.page1.sideTopNews?.paragraph2 || samplePage1Data.sideTopNews.paragraph2;
      }
      if (!merged.page1.sideTopNews.headline?.trim()) {
        merged.page1.sideTopNews.headline = samplePage1Data.sideTopNews.headline;
      }
      if (!merged.page1.sideTopNews.subheadline?.trim()) {
        merged.page1.sideTopNews.subheadline = samplePage1Data.sideTopNews.subheadline;
      }
      if (!merged.page1.sideTopNews.articleBody?.trim()) {
        merged.page1.sideTopNews.articleBody = samplePage1Data.sideTopNews.body;
      }
    }

    if (Array.isArray(merged.page1.newsBlocks)) {
      merged.page1.newsBlocks = merged.page1.newsBlocks.map((b, idx) => {
        const sampleB = samplePage1Data.newsBlocks[idx] || {};
        return {
          ...sampleB,
          ...b,
          headline: b.headline?.trim() || sampleB.headline,
          subheadline: b.subheadline?.trim() || sampleB.subheadline,
          paragraph1: b.paragraph1?.trim() || sampleB.paragraph1,
          paragraph2: b.paragraph2?.trim() || sampleB.paragraph2,
          articleBody: b.articleBody?.trim() || (b as any).body?.trim() || sampleB.body,
          body: (b as any).body?.trim() || b.articleBody?.trim() || sampleB.body,
        };
      });
    }

    if (merged.page1.bottomLeftFeature) {
      if (!merged.page1.bottomLeftFeature.paragraph1?.trim()) {
        merged.page1.bottomLeftFeature.paragraph1 = samplePage1Data.bottomLeftFeature.paragraph1;
      }
      if (!merged.page1.bottomLeftFeature.paragraph2?.trim()) {
        merged.page1.bottomLeftFeature.paragraph2 = samplePage1Data.bottomLeftFeature.paragraph2;
      }
      if (!merged.page1.bottomLeftFeature.headline?.trim()) {
        merged.page1.bottomLeftFeature.headline = samplePage1Data.bottomLeftFeature.headline;
      }
      if (!merged.page1.bottomLeftFeature.articleBody?.trim()) {
        merged.page1.bottomLeftFeature.articleBody = samplePage1Data.bottomLeftFeature.body;
      }
    }

    if (merged.page1.bottomMiddleSports && samplePage1Data.bottomMiddleSports) {
      if (!merged.page1.bottomMiddleSports.paragraph1?.trim()) {
        merged.page1.bottomMiddleSports.paragraph1 = samplePage1Data.bottomMiddleSports.paragraph1;
      }
      if (!merged.page1.bottomMiddleSports.paragraph2?.trim()) {
        merged.page1.bottomMiddleSports.paragraph2 = samplePage1Data.bottomMiddleSports.paragraph2;
      }
      if (!merged.page1.bottomMiddleSports.headline?.trim()) {
        merged.page1.bottomMiddleSports.headline = samplePage1Data.bottomMiddleSports.headline;
      }
      if (!merged.page1.bottomMiddleSports.articleBody?.trim()) {
        merged.page1.bottomMiddleSports.articleBody = samplePage1Data.bottomMiddleSports.body;
      }
    }

    // Page 2 stories hydration
    if (merged.page2) {
      if (merged.page2.mainDistrictStory) {
        if (!merged.page2.mainDistrictStory.articleBody?.trim()) {
          merged.page2.mainDistrictStory.articleBody = defaults.page2.mainDistrictStory.articleBody;
        }
        if (!merged.page2.mainDistrictStory.headline?.trim()) {
          merged.page2.mainDistrictStory.headline = defaults.page2.mainDistrictStory.headline;
        }
      }
      if (Array.isArray(merged.page2.districtStories)) {
        merged.page2.districtStories = merged.page2.districtStories.map((d, idx) => {
          const defD = defaults.page2.districtStories[idx] || {};
          return {
            ...defD,
            ...d,
            headline: d.headline?.trim() || defD.headline,
            articleBody: d.articleBody?.trim() || defD.articleBody,
          };
        });
      }
    }

    // Page 3 stories hydration
    if (merged.page3) {
      if (merged.page3.businessStory) {
        if (!merged.page3.businessStory.articleBody?.trim()) {
          merged.page3.businessStory.articleBody = defaults.page3.businessStory.articleBody;
        }
        if (!merged.page3.businessStory.headline?.trim()) {
          merged.page3.businessStory.headline = defaults.page3.businessStory.headline;
        }
      }
      if (merged.page3.politicsStory) {
        if (!merged.page3.politicsStory.articleBody?.trim()) {
          merged.page3.politicsStory.articleBody = defaults.page3.politicsStory.articleBody;
        }
        if (!merged.page3.politicsStory.headline?.trim()) {
          merged.page3.politicsStory.headline = defaults.page3.politicsStory.headline;
        }
      }
      if ((merged.page3 as any).techStory) {
        if (!(merged.page3 as any).techStory.articleBody?.trim()) {
          (merged.page3 as any).techStory.articleBody = (defaults.page3 as any).techStory?.articleBody;
        }
        if (!(merged.page3 as any).techStory.headline?.trim()) {
          (merged.page3 as any).techStory.headline = (defaults.page3 as any).techStory?.headline;
        }
        if ((merged.page3 as any).techStory.keyPoints?.points && Array.isArray((merged.page3 as any).techStory.keyPoints.points) && (merged.page3 as any).techStory.keyPoints.points.length > 2) {
          (merged.page3 as any).techStory.keyPoints.points = (merged.page3 as any).techStory.keyPoints.points.slice(0, 2);
        }
      }
      if ((merged.page3 as any).bankingStory) {
        if (!(merged.page3 as any).bankingStory.articleBody?.trim()) {
          (merged.page3 as any).bankingStory.articleBody = (defaults.page3 as any).bankingStory?.articleBody;
        }
        if (!(merged.page3 as any).bankingStory.headline?.trim()) {
          (merged.page3 as any).bankingStory.headline = (defaults.page3 as any).bankingStory?.headline;
        }
        if ((merged.page3 as any).bankingStory.keyPoints?.points && Array.isArray((merged.page3 as any).bankingStory.keyPoints.points) && (merged.page3 as any).bankingStory.keyPoints.points.length > 2) {
          (merged.page3 as any).bankingStory.keyPoints.points = (merged.page3 as any).bankingStory.keyPoints.points.slice(0, 2);
        }
      }
      if ((merged.page3 as any).startupStory) {
        if (!(merged.page3 as any).startupStory.articleBody?.trim()) {
          (merged.page3 as any).startupStory.articleBody = (defaults.page3 as any).startupStory?.articleBody;
        }
        if (!(merged.page3 as any).startupStory.headline?.trim()) {
          (merged.page3 as any).startupStory.headline = (defaults.page3 as any).startupStory?.headline;
        }
      }
      if ((merged.page3 as any).commodityStory) {
        if (!(merged.page3 as any).commodityStory.articleBody?.trim()) {
          (merged.page3 as any).commodityStory.articleBody = (defaults.page3 as any).commodityStory?.articleBody;
        }
        if (!(merged.page3 as any).commodityStory.headline?.trim()) {
          (merged.page3 as any).commodityStory.headline = (defaults.page3 as any).commodityStory?.headline;
        }
      }
      if (merged.page3.editorial) {
        if (!merged.page3.editorial.editorialText?.trim()) {
          merged.page3.editorial.editorialText = defaults.page3.editorial.editorialText;
        }
        if (!merged.page3.editorial.title?.trim()) {
          merged.page3.editorial.title = defaults.page3.editorial.title;
        }
      }
    }

    // Page 4 stories hydration
    if (merged.page4) {
      if (merged.page4.mainSportsStory) {
        if (!merged.page4.mainSportsStory.articleBody?.trim()) {
          merged.page4.mainSportsStory.articleBody = defaults.page4.mainSportsStory.articleBody;
        }
        if (!merged.page4.mainSportsStory.headline?.trim()) {
          merged.page4.mainSportsStory.headline = defaults.page4.mainSportsStory.headline;
        }
      }
      if (merged.page4.secondarySportsStory) {
        if (!merged.page4.secondarySportsStory.articleBody?.trim()) {
          merged.page4.secondarySportsStory.articleBody = defaults.page4.secondarySportsStory.articleBody;
        }
        if (!merged.page4.secondarySportsStory.headline?.trim()) {
          merged.page4.secondarySportsStory.headline = defaults.page4.secondarySportsStory.headline;
        }
      }
      if (merged.page4.entertainmentStory) {
        if (!merged.page4.entertainmentStory.articleBody?.trim()) {
          merged.page4.entertainmentStory.articleBody = defaults.page4.entertainmentStory.articleBody;
        }
        if (!merged.page4.entertainmentStory.headline?.trim()) {
          merged.page4.entertainmentStory.headline = defaults.page4.entertainmentStory.headline;
        }
      }
      if ((merged.page4 as any).ottLifestyleStory) {
        if (!(merged.page4 as any).ottLifestyleStory.articleBody?.trim()) {
          (merged.page4 as any).ottLifestyleStory.articleBody = (defaults.page4 as any).ottLifestyleStory?.articleBody;
        }
        if (!(merged.page4 as any).ottLifestyleStory.headline?.trim()) {
          (merged.page4 as any).ottLifestyleStory.headline = (defaults.page4 as any).ottLifestyleStory?.headline;
        }
      }
    }

    return merged;
  });

  const [activePage, setActivePage] = useState<1 | 2 | 3 | 4>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const availableWidth = window.innerWidth - 16;
      return Math.min(100, Math.max(25, Math.floor((availableWidth / 1224) * 100)));
    }
    return 50;
  });
  const [mobileViewTab, setMobileViewTab] = useState<'editor' | 'canvas'>('editor');
  const [sidebarTab, setSidebarTab] = useState<'editor' | 'outline'>('editor');
  const [selectedPath, setSelectedPath] = useState<string>('leadStory.headline');
  const [selectedLabel, setSelectedLabel] = useState<string>('મુખ્ય સમાચાર (Lead Story)');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Modals & Drawers
  const [articleImportOpen, setArticleImportOpen] = useState(false);
  const [importTargetSlot, setImportTargetSlot] = useState<{ path: string; label: string }>({
    path: 'leadStory',
    label: 'મુખ્ય સમાચાર (Lead Story)',
  });
  const [horoscopeModalOpen, setHoroscopeModalOpen] = useState(false);
  const [fullPreviewModalOpen, setFullPreviewModalOpen] = useState(false);
  const [previewPage, setPreviewPage] = useState<1 | 2 | 3 | 4>(1);
  const [validationWarningModalOpen, setValidationWarningModalOpen] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [articleSavedMessage, setArticleSavedMessage] = useState<string | null>(null);
  const [imageUploadSuccess, setImageUploadSuccess] = useState<boolean>(false);

  // Refs for active preview & sequential staging capture
  const pageRef = useRef<HTMLDivElement>(null);
  const previewPageRef = useRef<HTMLDivElement>(null);
  const captureContainerRef = useRef<HTMLDivElement>(null);
  const [captureStagePage, setCaptureStagePage] = useState<1 | 2 | 3 | 4 | null>(null);
  const [captureProgressText, setCaptureProgressText] = useState<string>('');

  // Publish success & PDF state
  const [publishSuccessModalOpen, setPublishSuccessModalOpen] = useState(false);
  const [publishedPdfUrl, setPublishedPdfUrl] = useState<string>('');
  const [publishedPdfBlob, setPublishedPdfBlob] = useState<Blob | null>(null);
  const [publishPreviewPage, setPublishPreviewPage] = useState<1 | 2 | 3 | 4>(1);

  // Fullscreen support
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  // Lock body scroll while builder is active and listen for browser fullscreen changes
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleFullscreenChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
    };
  }, []);

  const toggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (_) { }
  };

  // Sync city/date when props change
  useEffect(() => {
    if (city || date) {
      setData((prev) => ({
        ...prev,
        page1: {
          ...prev.page1,
          city: cityGu || city || prev.page1.city,
          date: date || prev.page1.date,
        },
      }));
    }
  }, [city, cityGu, date]);

  // Auto-fetch live weather for edition city from Open-Meteo API
  useEffect(() => {
    const targetCity = cityGu || city || 'અમદાવાદ';
    fetchLiveCityWeather(targetCity)
      .then((w) => {
        setData((prev) => ({
          ...prev,
          page1: {
            ...prev.page1,
            weather: {
              city: w.city,
              high: w.high,
              low: w.low,
              condition: w.condition,
              icon: w.icon,
            },
          },
        }));
      })
      .catch(() => { });
  }, [city, cityGu]);

  // Ensure Page 4 keyPoints are strictly capped to 3 points
  useEffect(() => {
    let changed = false;
    const cloneP4 = { ...data.page4 };
    if (cloneP4.mainSportsStory?.keyPoints?.points && Array.isArray(cloneP4.mainSportsStory.keyPoints.points) && cloneP4.mainSportsStory.keyPoints.points.length > 3) {
      cloneP4.mainSportsStory = {
        ...cloneP4.mainSportsStory,
        keyPoints: {
          ...cloneP4.mainSportsStory.keyPoints,
          points: cloneP4.mainSportsStory.keyPoints.points.slice(0, 3),
        },
      };
      changed = true;
    }
    if (cloneP4.entertainmentStory?.keyPoints?.points && Array.isArray(cloneP4.entertainmentStory.keyPoints.points) && cloneP4.entertainmentStory.keyPoints.points.length > 3) {
      cloneP4.entertainmentStory = {
        ...cloneP4.entertainmentStory,
        keyPoints: {
          ...cloneP4.entertainmentStory.keyPoints,
          points: cloneP4.entertainmentStory.keyPoints.points.slice(0, 3),
        },
      };
      changed = true;
    }
    if (changed) {
      setData((prev) => ({ ...prev, page4: cloneP4 }));
    }
  }, [data.page4?.mainSportsStory?.keyPoints?.points, data.page4?.entertainmentStory?.keyPoints?.points]);

  // Ensure Page 3 techStory and bankingStory keyPoints are strictly capped to 2 points
  useEffect(() => {
    let changed = false;
    const cloneP3 = { ...data.page3 };
    if ((cloneP3 as any).techStory?.keyPoints?.points && Array.isArray((cloneP3 as any).techStory.keyPoints.points) && (cloneP3 as any).techStory.keyPoints.points.length > 2) {
      (cloneP3 as any).techStory = {
        ...(cloneP3 as any).techStory,
        keyPoints: {
          ...(cloneP3 as any).techStory.keyPoints,
          points: (cloneP3 as any).techStory.keyPoints.points.slice(0, 2),
        },
      };
      changed = true;
    }
    if ((cloneP3 as any).bankingStory?.keyPoints?.points && Array.isArray((cloneP3 as any).bankingStory.keyPoints.points) && (cloneP3 as any).bankingStory.keyPoints.points.length > 2) {
      (cloneP3 as any).bankingStory = {
        ...(cloneP3 as any).bankingStory,
        keyPoints: {
          ...(cloneP3 as any).bankingStory.keyPoints,
          points: (cloneP3 as any).bankingStory.keyPoints.points.slice(0, 2),
        },
      };
      changed = true;
    }
    if (changed) {
      setData((prev) => ({ ...prev, page3: cloneP3 }));
    }
  }, [(data.page3 as any)?.techStory?.keyPoints?.points, (data.page3 as any)?.bankingStory?.keyPoints?.points]);


  const handleRefreshWeather = async (customCity?: string) => {
    try {
      const targetCity = customCity || (data.page1 as any)?.weather?.city || cityGu || city || 'અમદાવાદ';
      const w = await fetchLiveCityWeather(targetCity);
      setData((prev) => ({
        ...prev,
        page1: {
          ...prev.page1,
          weather: {
            city: w.city,
            high: w.high,
            low: w.low,
            condition: w.condition,
            icon: w.icon,
          },
        },
      }));
    } catch (e) {
      console.warn('Weather refresh failed:', e);
    }
  };

  // Check if Header Mode is active
  const isHeaderMode = useMemo(() => {
    if (activePage !== 1) return false;
    if (!selectedPath) return false;
    return (
      selectedPath === 'header' ||
      selectedPath.startsWith('masthead') ||
      selectedPath.startsWith('quote') ||
      selectedPath.startsWith('weather') ||
      selectedPath.startsWith('editionBar')
    );
  }, [activePage, selectedPath]);

  // Update Page 1 Header fields seamlessly
  const handleUpdateHeader = (updatedHeader: Partial<Page1Data>) => {
    setData((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      const page1 = clone.page1 || {};

      if (updatedHeader.mastheadTitle !== undefined) {
        page1.mastheadTitle = updatedHeader.mastheadTitle;
      }
      if (updatedHeader.mastheadTagline !== undefined) {
        page1.mastheadTagline = updatedHeader.mastheadTagline;
      }

      if (updatedHeader.quote) {
        page1.quote = {
          ...(page1.quote || {}),
          ...updatedHeader.quote,
        };
      }

      if (updatedHeader.weather) {
        page1.weather = {
          ...(page1.weather || {}),
          ...updatedHeader.weather,
        };
      }

      if (updatedHeader.editionBar) {
        page1.editionBar = {
          ...(page1.editionBar || {}),
          ...updatedHeader.editionBar,
        };
        // Keep top-level mirrors synchronized
        if (updatedHeader.editionBar.city) page1.city = updatedHeader.editionBar.city;
        if (updatedHeader.editionBar.dayDate) page1.date = updatedHeader.editionBar.dayDate;
        if (updatedHeader.editionBar.yearIssue) page1.editionInfo = updatedHeader.editionBar.yearIssue;
        if (updatedHeader.editionBar.price) page1.price = updatedHeader.editionBar.price;
      }

      return { ...clone, page1 };
    });
  };

  // Helper to safely extract nested string value for fallback editor
  const getNestedStringValue = (obj: any, path: string): string => {
    if (!obj || !path) return '';
    const parts = path.split('.');
    let curr = obj;
    for (const p of parts) {
      if (curr === undefined || curr === null) return '';
      curr = curr[p];
    }
    return typeof curr === 'string' ? curr : '';
  };

  // Helper to retrieve canonical default content for any slot across all 4 pages
  const getStoryDefault = (page: number, rootPath: string): any => {
    if (page === 1) {
      if (rootPath === 'leadStory' || rootPath === 'mainHeadline') return samplePage1Data.mainHeadline;
      if (rootPath === 'sideTopNews') return samplePage1Data.sideTopNews;
      if (rootPath === 'bottomLeftFeature') return samplePage1Data.bottomLeftFeature;
      if (rootPath === 'bottomMiddleSports') return samplePage1Data.bottomMiddleSports;
      if (rootPath.startsWith('newsBlocks.')) {
        const idx = Number(rootPath.split('.')[1]) || 0;
        return samplePage1Data.newsBlocks[idx] || samplePage1Data.newsBlocks[0];
      }
      if (rootPath.startsWith('secondaryStories.')) {
        const idx = Number(rootPath.split('.')[1]) || 0;
        return samplePage1Data.newsBlocks[idx] || samplePage1Data.newsBlocks[0];
      }
      if (rootPath.startsWith('bottomStories.')) {
        const idx = Number(rootPath.split('.')[1]) || 0;
        return (samplePage1Data as any).bottomStories?.[idx] || {
          category: 'સમાચાર',
          headline: 'સ્થાનિક સમાચાર વિગત',
          articleBody: 'સ્થાનિક સમાચારની સંપૂર્ણ વિગત...',
        };
      }
    } else if (page === 2) {
      const p2Data = getDefaultTemplateData(cityGu || city, date).page2;
      if (rootPath === 'mainDistrictStory' || rootPath === 'leadStory') return p2Data.mainDistrictStory;
      if (rootPath === 'sideLeadStory' || rootPath === 'sideTopNews') return p2Data.sideLeadStory;
      if (rootPath === 'bottomLeftFeature') return p2Data.bottomLeftFeature;
      if (rootPath === 'bottomRightFeature') return p2Data.bottomRightFeature;
      if (rootPath.startsWith('districtStories.')) {
        const idx = Number(rootPath.split('.')[1]) || 0;
        return p2Data.districtStories[idx] || p2Data.districtStories[0];
      }
    } else if (page === 3) {
      const p3Data = getDefaultTemplateData(cityGu || city, date).page3;
      if (rootPath === 'businessStory') return p3Data.businessStory;
      if (rootPath === 'politicsStory') return p3Data.politicsStory;
      if (rootPath === 'techStory') return (p3Data as any).techStory;
      if (rootPath === 'bankingStory') return (p3Data as any).bankingStory;
      if (rootPath === 'startupStory') return (p3Data as any).startupStory;
      if (rootPath === 'commodityStory') return (p3Data as any).commodityStory;
      if (rootPath.startsWith('corporateBriefs.')) {
        const idx = Number(rootPath.split('.')[1]) || 0;
        return (p3Data as any).corporateBriefs?.[idx] || (p3Data as any).corporateBriefs?.[0];
      }
      if (rootPath === 'editorial') return {
        category: 'સંપાદકીય',
        headline: p3Data.editorial.title,
        title: p3Data.editorial.title,
        articleBody: p3Data.editorial.editorialText,
        body: p3Data.editorial.editorialText,
        editorialText: p3Data.editorial.editorialText,
        image: p3Data.editorial.authorImage,
        authorName: p3Data.editorial.authorName,
        authorRole: p3Data.editorial.authorRole,
      };
    } else if (page === 4) {
      const p4Data = getDefaultTemplateData(cityGu || city, date).page4;
      if (rootPath === 'mainSportsStory') return p4Data.mainSportsStory;
      if (rootPath === 'secondarySportsStory') return p4Data.secondarySportsStory;
      if (rootPath === 'entertainmentStory') return p4Data.entertainmentStory;
      if (rootPath === 'ottLifestyleStory') return (p4Data as any).ottLifestyleStory;
      if (rootPath.startsWith('sportsBriefs.')) {
        const idx = Number(rootPath.split('.')[1]) || 0;
        return (p4Data as any).sportsBriefs?.[idx] || (p4Data as any).sportsBriefs?.[0];
      }
      if (rootPath.startsWith('bottomStories.')) {
        const idx = Number(rootPath.split('.')[1]) || 0;
        return (p4Data as any).bottomStories?.[idx] || (p4Data as any).bottomStories?.[0];
      }
      if (rootPath === 'sportsRoundupTitle') {
        return {
          headline: (p4Data as any).sportsRoundupTitle || '⚡ રમત-ગમત સંક્ષિપ્ત (SPORTS ROUNDUP)',
          category: 'વાયર હેડર',
          articleBody: '',
        };
      }
    }
    return null;
  };

  // Determine the story base path (e.g., 'leadStory', 'secondaryStories.0', 'bottomStories.1', 'mainDistrictStory', etc.)
  const storyRootPath = useMemo(() => {
    if (!selectedPath) {
      if (activePage === 1) return 'leadStory';
      if (activePage === 2) return 'mainDistrictStory';
      if (activePage === 3) return 'businessStory';
      if (activePage === 4) return 'mainSportsStory';
      return 'leadStory';
    }
    const parts = selectedPath.split('.');
    if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
      return `${parts[0]}.${parts[1]}`;
    }
    return parts[0];
  }, [selectedPath, activePage]);

  // Extract the target object for the selected story
  const currentPageData = data[`page${activePage}` as keyof NewspaperTemplateData] as any;

  const isLeadOrMainStory = activePage === 1 && (storyRootPath === 'leadStory' || storyRootPath === 'mainHeadline');

  const currentStoryObj: (NewsStory & { [key: string]: any }) | null = useMemo(() => {
    if (!currentPageData || !storyRootPath) return null;
    const defaultStory = getStoryDefault(activePage, storyRootPath);

    if (isLeadOrMainStory) {
      const base = (currentPageData.leadStory || currentPageData.mainHeadline || {}) as any;
      const def = samplePage1Data.mainHeadline;
      return {
        ...def,
        ...base,
        category: base.category?.trim() || def.category,
        headline: base.headline?.trim() || def.headline,
        subheadline: base.subheadline?.trim() || def.subheadline,
        location: base.location !== undefined ? base.location : def.location,
        paragraph1: base.paragraph1?.trim() || def.paragraph1,
        paragraph2: base.paragraph2?.trim() || def.paragraph2,
        paragraph3: base.paragraph3?.trim() || def.paragraph3,
        articleBody: base.articleBody?.trim() || base.body?.trim() || def.body,
        body: base.body?.trim() || base.articleBody?.trim() || def.body,
        image: base.image !== undefined ? base.image : def.image,
        caption: base.caption || base.imageCaption || def.imageCaption,
        imageCaption: base.imageCaption || base.caption || def.imageCaption,
        keyPoints: base.keyPoints !== undefined ? base.keyPoints : def.keyPoints,
      } as NewsStory;
    }

    const parts = storyRootPath.split('.');
    let obj = currentPageData;
    for (const p of parts) {
      if (obj === undefined || obj === null) {
        obj = null;
        break;
      }
      obj = obj[p];
    }

    if (obj && typeof obj === 'object') {
      if (defaultStory) {
        const merged: any = { ...defaultStory, ...obj };
        if (!merged.headline?.trim() && (defaultStory.headline || defaultStory.title)) {
          merged.headline = defaultStory.headline || defaultStory.title;
        }
        if (!merged.subheadline?.trim() && defaultStory.subheadline) {
          merged.subheadline = defaultStory.subheadline;
        }
        if (!merged.category?.trim() && (defaultStory.category || defaultStory.district)) {
          merged.category = defaultStory.category || defaultStory.district;
        }
        if (merged.location === undefined && (defaultStory.location || defaultStory.district)) {
          merged.location = defaultStory.location || defaultStory.district;
        }
        if (merged.keyPoints === undefined && defaultStory.keyPoints) {
          merged.keyPoints = defaultStory.keyPoints;
        }
        if (activePage === 4 && merged.keyPoints?.points && Array.isArray(merged.keyPoints.points) && merged.keyPoints.points.length > 3) {
          merged.keyPoints = {
            ...merged.keyPoints,
            points: merged.keyPoints.points.slice(0, 3),
          };
        }
        if (activePage === 3 && (storyRootPath === 'techStory' || storyRootPath === 'bankingStory') && merged.keyPoints?.points && Array.isArray(merged.keyPoints.points) && merged.keyPoints.points.length > 2) {
          merged.keyPoints = {
            ...merged.keyPoints,
            points: merged.keyPoints.points.slice(0, 2),
          };
        }
        if (!merged.paragraph1?.trim() && defaultStory.paragraph1) {
          merged.paragraph1 = defaultStory.paragraph1;
        }
        if (!merged.paragraph2?.trim() && defaultStory.paragraph2) {
          merged.paragraph2 = defaultStory.paragraph2;
        }
        if (!merged.paragraph3?.trim() && defaultStory.paragraph3) {
          merged.paragraph3 = defaultStory.paragraph3;
        }
        if (!merged.articleBody?.trim() && (defaultStory.articleBody || defaultStory.body || defaultStory.editorialText)) {
          merged.articleBody = defaultStory.articleBody || defaultStory.body || defaultStory.editorialText;
        }
        if (!merged.body?.trim() && (defaultStory.body || defaultStory.articleBody || defaultStory.editorialText)) {
          merged.body = defaultStory.body || defaultStory.articleBody || defaultStory.editorialText;
        }
        if (merged.image === undefined && defaultStory.image) {
          merged.image = defaultStory.image;
        }
        if (!merged.caption && (defaultStory.caption || defaultStory.imageCaption)) {
          merged.caption = defaultStory.caption || defaultStory.imageCaption;
        }
        if (!merged.imageCaption && (defaultStory.imageCaption || defaultStory.caption)) {
          merged.imageCaption = defaultStory.imageCaption || defaultStory.caption;
        }
        let result = merged;
        if (activePage === 4 && result.keyPoints?.points && Array.isArray(result.keyPoints.points) && result.keyPoints.points.length > 3) {
          result = {
            ...result,
            keyPoints: {
              ...result.keyPoints,
              points: result.keyPoints.points.slice(0, 3),
            },
          };
        }
        if (activePage === 3 && (storyRootPath === 'techStory' || storyRootPath === 'bankingStory') && result.keyPoints?.points && Array.isArray(result.keyPoints.points) && result.keyPoints.points.length > 2) {
          result = {
            ...result,
            keyPoints: {
              ...result.keyPoints,
              points: result.keyPoints.points.slice(0, 2),
            },
          };
        }
        return result as NewsStory;
      }
      let result = obj;
      if (activePage === 4 && result.keyPoints?.points && Array.isArray(result.keyPoints.points) && result.keyPoints.points.length > 3) {
        result = {
          ...result,
          keyPoints: {
            ...result.keyPoints,
            points: result.keyPoints.points.slice(0, 3),
          },
        };
      }
      if (activePage === 3 && (storyRootPath === 'techStory' || storyRootPath === 'bankingStory') && result.keyPoints?.points && Array.isArray(result.keyPoints.points) && result.keyPoints.points.length > 2) {
        result = {
          ...result,
          keyPoints: {
            ...result.keyPoints,
            points: result.keyPoints.points.slice(0, 2),
          },
        };
      }
      return result as NewsStory;
    }

    if (defaultStory) {
      let result = defaultStory;
      if (activePage === 4 && result.keyPoints?.points && Array.isArray(result.keyPoints.points) && result.keyPoints.points.length > 3) {
        result = {
          ...result,
          keyPoints: {
            ...result.keyPoints,
            points: result.keyPoints.points.slice(0, 3),
          },
        };
      }
      if (activePage === 3 && (storyRootPath === 'techStory' || storyRootPath === 'bankingStory') && result.keyPoints?.points && Array.isArray(result.keyPoints.points) && result.keyPoints.points.length > 2) {
        result = {
          ...result,
          keyPoints: {
            ...result.keyPoints,
            points: result.keyPoints.points.slice(0, 2),
          },
        };
      }
      return result as NewsStory;
    }

    return null;
  }, [currentPageData, isLeadOrMainStory, storyRootPath, activePage]);

  // Check if active story has multi-paragraph layout
  const isMultiParagraphStory = Boolean(
    isLeadOrMainStory ||
    storyRootPath === 'sideTopNews' ||
    storyRootPath === 'sideLeadStory' ||
    storyRootPath === 'bottomLeftFeature' ||
    storyRootPath === 'bottomRightFeature' ||
    storyRootPath === 'bottomMiddleSports' ||
    storyRootPath === 'mainDistrictStory' ||
    storyRootPath === 'businessStory' ||
    storyRootPath === 'politicsStory' ||
    storyRootPath === 'techStory' ||
    storyRootPath === 'bankingStory' ||
    storyRootPath === 'startupStory' ||
    storyRootPath === 'commodityStory' ||
    storyRootPath === 'mainSportsStory' ||
    storyRootPath === 'secondarySportsStory' ||
    storyRootPath === 'entertainmentStory' ||
    storyRootPath === 'ottLifestyleStory' ||
    storyRootPath.startsWith('bottomStories') ||
    storyRootPath.startsWith('districtStories') ||
    storyRootPath.startsWith('newsBlocks') ||
    storyRootPath.startsWith('secondaryStories') ||
    Boolean((currentStoryObj as any)?.paragraph1?.trim() && (currentStoryObj as any)?.paragraph2?.trim())
  );

  // Helper to resolve paragraphs for the active story so fields are never empty
  const storyParagraphs = useMemo(() => {
    const defaultStory = getStoryDefault(activePage, storyRootPath) || {};
    const defP1 = defaultStory.paragraph1 || defaultStory.articleBody || defaultStory.body || defaultStory.editorialText || '';
    const defP2 = defaultStory.paragraph2 || '';
    const defP3 = defaultStory.paragraph3 || '';
    const defBody = defaultStory.articleBody || defaultStory.body || defaultStory.editorialText || '';

    if (!currentStoryObj) {
      return { p1: defP1, p2: defP2, p3: defP3, body: defBody };
    }

    let p1 = currentStoryObj.paragraph1?.trim() || '';
    let p2 = (currentStoryObj as any).paragraph2?.trim() || '';
    let p3 = (currentStoryObj as any).paragraph3?.trim() || '';
    let body = (currentStoryObj.articleBody || (currentStoryObj as any).body || (currentStoryObj as any).editorialText || '').trim();

    // If body exists but explicit paragraphs are missing, split body
    if (body && (!p1 || !p2 || (isLeadOrMainStory && !p3))) {
      const parts = body.split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        if (!p1) p1 = parts[0];
        if (!p2) p2 = parts[1];
        if (!p3) p3 = parts.slice(2).join('\n\n');
      } else if (parts.length === 2) {
        if (!p1) p1 = parts[0];
        if (!p2) p2 = parts[1];
        if (!p3) p3 = defP3;
      } else if (parts.length === 1) {
        if (!p1) p1 = parts[0];
        if (!p2) p2 = defP2;
        if (!p3) p3 = defP3;
      }
    }

    // Fall back to default story values if still empty
    if (!p1) p1 = defP1;
    if (!p2) p2 = defP2;
    if (!p3) p3 = defP3;
    if (!body) body = defBody || [p1, p2, p3].filter(Boolean).join('\n\n');

    return {
      p1,
      p2,
      p3,
      body,
    };
  }, [currentStoryObj, isLeadOrMainStory, activePage, storyRootPath]);

  // Update a full story or specific field within active page
  const updateStoryField = (field: keyof NewsStory | 'editorialText' | 'title' | 'district' | 'location' | 'keyPoints' | any, value: any) => {
    const clone = JSON.parse(JSON.stringify(data));
    const pageKey: keyof NewspaperTemplateData = `page${activePage}` as any;
    let target = clone[pageKey];

    const defaultStory = getStoryDefault(activePage, storyRootPath) || {};

    if (isLeadOrMainStory) {
      if (!clone.page1.leadStory) {
        clone.page1.leadStory = {
          headline: clone.page1.mainHeadline?.headline || samplePage1Data.mainHeadline.headline,
          category: clone.page1.mainHeadline?.category || samplePage1Data.mainHeadline.category,
          subheadline: clone.page1.mainHeadline?.subheadline || samplePage1Data.mainHeadline.subheadline,
          location: clone.page1.mainHeadline?.location || samplePage1Data.mainHeadline.location,
          image: clone.page1.mainHeadline?.image || samplePage1Data.mainHeadline.image,
          caption: clone.page1.mainHeadline?.imageCaption || samplePage1Data.mainHeadline.imageCaption,
          imageCaption: clone.page1.mainHeadline?.imageCaption || samplePage1Data.mainHeadline.imageCaption,
          paragraph1: clone.page1.mainHeadline?.paragraph1 || storyParagraphs.p1,
          paragraph2: clone.page1.mainHeadline?.paragraph2 || storyParagraphs.p2,
          paragraph3: clone.page1.mainHeadline?.paragraph3 || storyParagraphs.p3,
          articleBody: clone.page1.mainHeadline?.body || samplePage1Data.mainHeadline.body,
          keyPoints: clone.page1.mainHeadline?.keyPoints || samplePage1Data.mainHeadline.keyPoints,
        };
      }
      if (!clone.page1.mainHeadline) {
        clone.page1.mainHeadline = JSON.parse(JSON.stringify(clone.page1.leadStory));
      }
      target = clone.page1.leadStory;
    } else {
      const parts = storyRootPath.split('.');
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (target[p] === undefined || target[p] === null) {
          const nextIsIndex = i + 1 < parts.length && !isNaN(Number(parts[i + 1]));
          target[p] = i === parts.length - 1 && defaultStory ? JSON.parse(JSON.stringify(defaultStory)) : (nextIsIndex ? [] : {});
        }
        target = target[p];
      }
    }

    if (target) {
      if (activePage === 4 && field === 'keyPoints' && value?.points && Array.isArray(value.points) && value.points.length > 3) {
        value = {
          ...value,
          points: value.points.slice(0, 3),
        };
      }
      if (activePage === 3 && (storyRootPath === 'techStory' || storyRootPath === 'bankingStory') && field === 'keyPoints' && value?.points && Array.isArray(value.points) && value.points.length > 2) {
        value = {
          ...value,
          points: value.points.slice(0, 2),
        };
      }
      target[field] = value;

      // Handle location and district cross-sync
      if (field === 'location') {
        target.location = value;
        if ('district' in target || activePage === 2) {
          target.district = value;
        }
      }
      if (field === 'district') {
        target.district = value;
        target.location = value;
      }

      // Handle caption and imageCaption cross-sync
      if (field === 'caption') {
        target.caption = value;
        target.imageCaption = value;
      }
      if (field === 'imageCaption') {
        target.imageCaption = value;
        target.caption = value;
      }

      // 1. Changing any paragraph automatically updates body and articleBody
      if (field === 'paragraph1' || field === 'paragraph2' || field === 'paragraph3') {
        const p1 = field === 'paragraph1' ? value : (target.paragraph1?.trim() ? target.paragraph1 : storyParagraphs.p1);
        const p2 = field === 'paragraph2' ? value : ((target as any).paragraph2?.trim() ? (target as any).paragraph2 : storyParagraphs.p2);
        const p3 = field === 'paragraph3' ? value : ((target as any).paragraph3?.trim() ? (target as any).paragraph3 : storyParagraphs.p3);
        target.paragraph1 = p1;
        target.paragraph2 = p2;
        target.paragraph3 = p3;
        const combined = [p1, p2, p3].filter(Boolean).join('\n\n');
        target.articleBody = combined;
        target.body = combined;
      }

      // 2. Changing body or articleBody automatically splits and updates paragraphs
      if (field === 'articleBody' || (field as string) === 'body') {
        target.articleBody = value;
        target.body = value;
        const pParts = (value || '').split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean);
        if (pParts.length >= 3) {
          target.paragraph1 = pParts[0];
          target.paragraph2 = pParts[1];
          target.paragraph3 = pParts.slice(2).join('\n\n');
        } else if (pParts.length === 2) {
          target.paragraph1 = pParts[0];
          target.paragraph2 = pParts[1];
          target.paragraph3 = '';
        } else if (pParts.length === 1) {
          target.paragraph1 = pParts[0];
          target.paragraph2 = '';
          target.paragraph3 = '';
        } else {
          target.paragraph1 = '';
          target.paragraph2 = '';
          target.paragraph3 = '';
        }
      }

      // If Page 1 leadStory / mainHeadline is updated, sync both objects seamlessly
      if (isLeadOrMainStory) {
        clone.page1.mainHeadline[field] = value;
        clone.page1.leadStory[field] = value;
        if (field === 'location') {
          clone.page1.mainHeadline.location = value;
          clone.page1.leadStory.location = value;
        }
        if (field === 'keyPoints') {
          clone.page1.mainHeadline.keyPoints = value;
          clone.page1.leadStory.keyPoints = value;
        }
        if (field === 'image') {
          clone.page1.mainHeadline.image = value;
          clone.page1.leadStory.image = value;
        }
        if (field === 'caption' || field === 'imageCaption') {
          clone.page1.mainHeadline.imageCaption = value;
          clone.page1.mainHeadline.caption = value;
          clone.page1.leadStory.caption = value;
          clone.page1.leadStory.imageCaption = value;
        }
        if (field === 'articleBody' || (field as string) === 'body') {
          clone.page1.mainHeadline.body = value;
          clone.page1.mainHeadline.articleBody = value;
          clone.page1.leadStory.body = value;
          clone.page1.leadStory.articleBody = value;
          clone.page1.mainHeadline.paragraph1 = target.paragraph1;
          clone.page1.mainHeadline.paragraph2 = target.paragraph2;
          clone.page1.mainHeadline.paragraph3 = target.paragraph3;
          clone.page1.leadStory.paragraph1 = target.paragraph1;
          clone.page1.leadStory.paragraph2 = target.paragraph2;
          clone.page1.leadStory.paragraph3 = target.paragraph3;
        }
        if (field === 'paragraph1' || field === 'paragraph2' || field === 'paragraph3') {
          clone.page1.mainHeadline.paragraph1 = target.paragraph1;
          clone.page1.mainHeadline.paragraph2 = target.paragraph2;
          clone.page1.mainHeadline.paragraph3 = target.paragraph3;
          clone.page1.mainHeadline.body = target.body;
          clone.page1.mainHeadline.articleBody = target.articleBody;
          clone.page1.leadStory.paragraph1 = target.paragraph1;
          clone.page1.leadStory.paragraph2 = target.paragraph2;
          clone.page1.leadStory.paragraph3 = target.paragraph3;
          clone.page1.leadStory.body = target.body;
          clone.page1.leadStory.articleBody = target.articleBody;
        }
        if (field === 'caption') {
          clone.page1.mainHeadline.imageCaption = value;
        }
        if ((field as string) === 'imageCaption') {
          clone.page1.leadStory.caption = value;
        }
      }

      // Side top news synchronization
      if (activePage === 1 && storyRootPath === 'sideTopNews') {
        if (!clone.page1.sideTopNews) clone.page1.sideTopNews = {};
        clone.page1.sideTopNews[field] = value;
        if (field === 'location') clone.page1.sideTopNews.location = value;
        if (field === 'keyPoints') clone.page1.sideTopNews.keyPoints = value;
        if (field === 'image') clone.page1.sideTopNews.image = value;
        if (field === 'caption' || field === 'imageCaption') {
          clone.page1.sideTopNews.imageCaption = value;
          clone.page1.sideTopNews.caption = value;
        }
        if (field === 'paragraph1' || field === 'paragraph2') {
          const p1 = clone.page1.sideTopNews.paragraph1?.trim() ? clone.page1.sideTopNews.paragraph1 : (storyParagraphs.p1 || samplePage1Data.sideTopNews.paragraph1);
          const p2 = clone.page1.sideTopNews.paragraph2?.trim() ? clone.page1.sideTopNews.paragraph2 : (storyParagraphs.p2 || samplePage1Data.sideTopNews.paragraph2);
          clone.page1.sideTopNews.paragraph1 = p1;
          clone.page1.sideTopNews.paragraph2 = p2;
          clone.page1.sideTopNews.body = p2 ? `${p1}\n\n${p2}` : p1;
          clone.page1.sideTopNews.articleBody = clone.page1.sideTopNews.body;
        }
        if (clone.page1.secondaryStories?.[0]) {
          clone.page1.secondaryStories[0][field] = value;
          clone.page1.secondaryStories[0].paragraph1 = clone.page1.sideTopNews.paragraph1;
          clone.page1.secondaryStories[0].paragraph2 = clone.page1.sideTopNews.paragraph2;
          clone.page1.secondaryStories[0].articleBody = clone.page1.sideTopNews.body;
        }
      }

      // NewsBlocks synchronization
      if (activePage === 1 && storyRootPath.startsWith('newsBlocks.')) {
        const idx = Number(storyRootPath.split('.')[1]) || 0;
        if (!clone.page1.newsBlocks) clone.page1.newsBlocks = JSON.parse(JSON.stringify(samplePage1Data.newsBlocks));
        if (!clone.page1.newsBlocks[idx]) clone.page1.newsBlocks[idx] = JSON.parse(JSON.stringify(samplePage1Data.newsBlocks[idx] || {}));
        clone.page1.newsBlocks[idx][field] = value;
        if (field === 'location') clone.page1.newsBlocks[idx].location = value;
        if (field === 'keyPoints') clone.page1.newsBlocks[idx].keyPoints = value;
        if (field === 'image') clone.page1.newsBlocks[idx].image = value;
        if (field === 'caption' || field === 'imageCaption') {
          clone.page1.newsBlocks[idx].imageCaption = value;
          clone.page1.newsBlocks[idx].caption = value;
        }
        if (field === 'paragraph1' || field === 'paragraph2') {
          const p1 = clone.page1.newsBlocks[idx].paragraph1?.trim() ? clone.page1.newsBlocks[idx].paragraph1 : (storyParagraphs.p1 || samplePage1Data.newsBlocks[idx]?.paragraph1 || '');
          const p2 = clone.page1.newsBlocks[idx].paragraph2?.trim() ? clone.page1.newsBlocks[idx].paragraph2 : (storyParagraphs.p2 || samplePage1Data.newsBlocks[idx]?.paragraph2 || '');
          clone.page1.newsBlocks[idx].paragraph1 = p1;
          clone.page1.newsBlocks[idx].paragraph2 = p2;
          clone.page1.newsBlocks[idx].body = p2 ? `${p1}\n\n${p2}` : p1;
        }
      }

      // Bottom left feature synchronization
      if (activePage === 1 && storyRootPath === 'bottomLeftFeature') {
        if (!clone.page1.bottomLeftFeature) clone.page1.bottomLeftFeature = JSON.parse(JSON.stringify(samplePage1Data.bottomLeftFeature));
        clone.page1.bottomLeftFeature[field] = value;
        if (field === 'location') clone.page1.bottomLeftFeature.location = value;
        if (field === 'keyPoints') clone.page1.bottomLeftFeature.keyPoints = value;
        if (field === 'image') clone.page1.bottomLeftFeature.image = value;
        if (field === 'caption' || field === 'imageCaption') {
          clone.page1.bottomLeftFeature.imageCaption = value;
          clone.page1.bottomLeftFeature.caption = value;
        }
        if (field === 'paragraph1' || field === 'paragraph2') {
          const p1 = clone.page1.bottomLeftFeature.paragraph1?.trim() ? clone.page1.bottomLeftFeature.paragraph1 : (storyParagraphs.p1 || samplePage1Data.bottomLeftFeature.paragraph1);
          const p2 = clone.page1.bottomLeftFeature.paragraph2?.trim() ? clone.page1.bottomLeftFeature.paragraph2 : (storyParagraphs.p2 || samplePage1Data.bottomLeftFeature.paragraph2);
          clone.page1.bottomLeftFeature.paragraph1 = p1;
          clone.page1.bottomLeftFeature.paragraph2 = p2;
          clone.page1.bottomLeftFeature.body = p2 ? `${p1}\n\n${p2}` : p1;
        }
      }

      // Bottom middle sports synchronization
      if (activePage === 1 && storyRootPath === 'bottomMiddleSports') {
        if (!clone.page1.bottomMiddleSports && samplePage1Data.bottomMiddleSports) {
          clone.page1.bottomMiddleSports = JSON.parse(JSON.stringify(samplePage1Data.bottomMiddleSports));
        }
        if (clone.page1.bottomMiddleSports) {
          clone.page1.bottomMiddleSports[field] = value;
          if (field === 'location') clone.page1.bottomMiddleSports.location = value;
          if (field === 'keyPoints') clone.page1.bottomMiddleSports.keyPoints = value;
          if (field === 'image') clone.page1.bottomMiddleSports.image = value;
          if (field === 'caption' || field === 'imageCaption') {
            clone.page1.bottomMiddleSports.imageCaption = value;
            clone.page1.bottomMiddleSports.caption = value;
          }
          if (field === 'paragraph1' || field === 'paragraph2') {
            const defBMS = samplePage1Data.bottomMiddleSports;
            const p1 = clone.page1.bottomMiddleSports.paragraph1?.trim() ? clone.page1.bottomMiddleSports.paragraph1 : (storyParagraphs.p1 || defBMS?.paragraph1 || '');
            const p2 = clone.page1.bottomMiddleSports.paragraph2?.trim() ? clone.page1.bottomMiddleSports.paragraph2 : (storyParagraphs.p2 || defBMS?.paragraph2 || '');
            clone.page1.bottomMiddleSports.paragraph1 = p1;
            clone.page1.bottomMiddleSports.paragraph2 = p2;
            clone.page1.bottomMiddleSports.body = p2 ? `${p1}\n\n${p2}` : p1;
          }
        }
      }

      // Page 2 district synchronization
      if (activePage === 2 && (storyRootPath === 'mainDistrictStory' || storyRootPath.startsWith('districtStories.'))) {
        if (field === 'location') {
          target.district = value;
          target.location = value;
        }
        if (field === 'district') {
          target.district = value;
          target.location = value;
        }
      }

      // Page 3 editorial synchronization
      if (activePage === 3 && storyRootPath === 'editorial') {
        if (field === 'headline' || field === 'title') {
          clone.page3.editorial.title = value;
        }
        if (field === 'articleBody' || (field as string) === 'body' || (field as string) === 'editorialText') {
          clone.page3.editorial.editorialText = value;
          clone.page3.editorial.articleBody = value;
        }
      }

      // Page 4 sportsBriefs, bottomStories, and sportsRoundupTitle synchronization
      if (activePage === 4) {
        if (storyRootPath.startsWith('bottomStories.')) {
          const idx = Number(storyRootPath.split('.')[1]) || 0;
          if (!Array.isArray(clone.page4.bottomStories)) {
            const defData = getDefaultTemplateData(cityGu || city, date).page4;
            clone.page4.bottomStories = JSON.parse(JSON.stringify(defData.bottomStories || []));
          }
          if (!clone.page4.bottomStories[idx]) {
            clone.page4.bottomStories[idx] = {};
          }
          clone.page4.bottomStories[idx][field] = value;
          if (field === 'body' || field === 'articleBody') {
            clone.page4.bottomStories[idx].articleBody = value;
            clone.page4.bottomStories[idx].body = value;
          }
        }
        if (storyRootPath.startsWith('sportsBriefs.')) {
          const idx = Number(storyRootPath.split('.')[1]) || 0;
          if (!Array.isArray(clone.page4.sportsBriefs)) {
            const defData = getDefaultTemplateData(cityGu || city, date).page4;
            clone.page4.sportsBriefs = JSON.parse(JSON.stringify(defData.sportsBriefs || []));
          }
          if (!clone.page4.sportsBriefs[idx]) {
            clone.page4.sportsBriefs[idx] = {};
          }
          clone.page4.sportsBriefs[idx][field] = value;
          if (field === 'body' || field === 'articleBody') {
            clone.page4.sportsBriefs[idx].articleBody = value;
            clone.page4.sportsBriefs[idx].body = value;
          }
        }
        if (storyRootPath === 'sportsRoundupTitle') {
          clone.page4.sportsRoundupTitle = value;
        }
      }

      setData(clone);
    }
  };

  // Generic nested updater
  const updateNestedValue = (path: string, value: any) => {
    const keys = path.split('.');
    const clone = JSON.parse(JSON.stringify(data));
    const pageKey: keyof NewspaperTemplateData = `page${activePage}` as any;
    let current = clone[pageKey];
    for (let i = 0; i < keys.length - 1; i++) {
      const nextIsIndex = !isNaN(Number(keys[i + 1]));
      if (!current[keys[i]]) current[keys[i]] = nextIsIndex ? [] : {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    if (activePage === 4 && path === 'sportsRoundupTitle') {
      clone.page4.sportsRoundupTitle = value;
    }
    setData(clone);
  };

  const handleSelectSlot = (path: string, label: string) => {
    setSelectedPath(path);
    setSelectedLabel(label);
    setSidebarTab('editor');
  };

  const handleOpenImport = (path: string, label: string) => {
    setImportTargetSlot({ path, label });
    setArticleImportOpen(true);
  };

  const handleImportSelectedArticle = (article: {
    headline: string;
    subheadline?: string;
    articleBody: string;
    image: string;
    category: string;
  }) => {
    const { path } = importTargetSlot;
    const pageKey: keyof NewspaperTemplateData = `page${activePage}` as any;
    const clone = JSON.parse(JSON.stringify(data));

    let targetObj = clone[pageKey];
    const keys = path.split('.');
    for (const k of keys) {
      targetObj = targetObj[k];
    }

    if (targetObj) {
      if (article.headline) targetObj.headline = article.headline;
      if (article.subheadline && targetObj.subheadline !== undefined) targetObj.subheadline = article.subheadline;
      if (article.articleBody) {
        targetObj.articleBody = article.articleBody;
        targetObj.body = article.articleBody;
        const pParts = article.articleBody.split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean);
        if (pParts.length >= 3) {
          targetObj.paragraph1 = pParts[0];
          targetObj.paragraph2 = pParts[1];
          targetObj.paragraph3 = pParts.slice(2).join('\n\n');
        } else if (pParts.length === 2) {
          targetObj.paragraph1 = pParts[0];
          targetObj.paragraph2 = pParts[1];
          targetObj.paragraph3 = '';
        } else if (pParts.length === 1) {
          targetObj.paragraph1 = pParts[0];
          targetObj.paragraph2 = '';
          targetObj.paragraph3 = '';
        }
      }
      if (article.image) targetObj.image = article.image;
      if (article.category && targetObj.category !== undefined) targetObj.category = article.category;

      if (activePage === 1 && (path.startsWith('leadStory') || path.startsWith('mainHeadline'))) {
        if (!clone.page1.mainHeadline) clone.page1.mainHeadline = {};
        if (!clone.page1.leadStory) clone.page1.leadStory = {};
        clone.page1.mainHeadline.headline = targetObj.headline;
        clone.page1.mainHeadline.articleBody = targetObj.articleBody;
        clone.page1.mainHeadline.body = targetObj.body;
        clone.page1.mainHeadline.paragraph1 = targetObj.paragraph1;
        clone.page1.mainHeadline.paragraph2 = targetObj.paragraph2;
        clone.page1.mainHeadline.paragraph3 = targetObj.paragraph3;
        clone.page1.leadStory.headline = targetObj.headline;
        clone.page1.leadStory.articleBody = targetObj.articleBody;
        clone.page1.leadStory.body = targetObj.body;
        clone.page1.leadStory.paragraph1 = targetObj.paragraph1;
        clone.page1.leadStory.paragraph2 = targetObj.paragraph2;
        clone.page1.leadStory.paragraph3 = targetObj.paragraph3;
      }
    }

    setData(clone);
  };

  // Validate template before publishing
  const validateTemplate = (): string[] => {
    const warnings: string[] = [];
    if (!data.page1.leadStory.headline?.trim()) {
      warnings.push('પેજ ૧: મુખ્ય સમાચાર હેડલાઇન ખાલી છે.');
    }
    if (!data.page1.leadStory.image) {
      warnings.push('પેજ ૧: મુખ્ય સમાચાર ઈમેજ ખૂટે છે.');
    }
    if (!data.page2.mainDistrictStory.headline?.trim()) {
      warnings.push('પેજ ૨: મુખ્ય જિલ્લા હેડલાઇન ખાલી છે.');
    }
    if (!data.page3.businessStory.headline?.trim()) {
      warnings.push('પેજ ૩: બિઝનેસ સમાચાર હેડલાઇન ખાલી છે.');
    }
    if (!data.page4.mainSportsStory.headline?.trim()) {
      warnings.push('પેજ ૪: સ્પોર્ટ્સ હેડલાઇન ખાલી છે.');
    }
    return warnings;
  };

  // High-res sequential page renderer for all 4 distinct pages
  const captureAllPageImages = async (): Promise<string[]> => {
    const pages: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
    const results: string[] = [];

    try {
      for (const p of pages) {
        setCaptureProgressText(`પૃષ્ઠ ${p} કેપ્ચર કરી રહ્યા છીએ... (${p * 25}%)`);
        setCaptureStagePage(p);
        // Wait for React to mount the target page in the unscaled stage and images to settle
        await new Promise((resolve) => setTimeout(resolve, 320));

        if (captureContainerRef.current) {
          const dataUrl = await renderElementToDataUrl(captureContainerRef.current, 1.25);
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            results.push(dataUrl);
          } else if (pageRef.current && p === activePage) {
            const fallback = await renderElementToDataUrl(pageRef.current, 1.25);
            results.push(fallback || results[0] || '');
          } else {
            results.push(results[0] || '');
          }
        }
      }
    } catch (err) {
      console.warn('Page capture notice:', err);
    } finally {
      setCaptureStagePage(null);
      setCaptureProgressText('');
    }

    // Ensure we have 4 valid page images
    const primary = results.find((r) => r && r.startsWith('data:image/')) || '';
    while (results.length < 4) {
      results.push(primary);
    }

    return results;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const images = await captureAllPageImages();
      await onSaveDraft(data, images);
      setArticleSavedMessage('✓ આર્ટિકલ અને અખબાર ડ્રાફ્ટ સફળતાપૂર્વક સેવ થઈ ગયા છે!');
      setTimeout(() => setArticleSavedMessage(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishClick = () => {
    const warnings = validateTemplate();
    if (warnings.length > 0) {
      setValidationWarnings(warnings);
      setValidationWarningModalOpen(true);
    } else {
      executePublish();
    }
  };

  const executePublish = async () => {
    setValidationWarningModalOpen(false);
    setPublishing(true);
    try {
      const images = await captureAllPageImages();
      const safeCity = (cityGu || city || 'Edition').replace(/[^\w\u0A80-\u0AFF]/g, '_');
      const safeDate = date.replace(/[^\w-]/g, '_');
      const filename = `GujaratPost_${safeCity}_${safeDate}.pdf`;

      let generatedPdfBlob: Blob | null = null;
      let generatedPdfUri = '';
      let uploadedPdfUrl = '';
      let uploadedThumbUrl = '';

      try {
        setCaptureProgressText('PDF દસ્તાવેજ બનાવી રહ્યા છીએ...');
        const compiled = await buildPdfFromImages(images, filename);
        generatedPdfBlob = compiled.pdfBlob;
        generatedPdfUri = compiled.pdfDataUri;

        if (compiled.pdfBlob) {
          setCaptureProgressText('PDF સર્વર પર અપલોડ કરી રહ્યા છીએ...');
          uploadedPdfUrl = await uploadPdfBlob(compiled.pdfBlob, filename);
        }

        // Upload front page image as static thumbnail
        if (images[0] && images[0].startsWith('data:image/')) {
          setCaptureProgressText('થંબનેલ ઇમેજ અપલોડ કરી રહ્યા છીએ...');
          const thumbBlob = await dataUrlToBlob(images[0]);
          if (thumbBlob) {
            uploadedThumbUrl = await uploadImageBlob(thumbBlob, `GujaratPost_Thumb_${safeCity}_${safeDate}.jpg`);
          }
        }
      } catch (pdfErr) {
        console.warn('PDF generation note:', pdfErr);
      } finally {
        setCaptureProgressText('');
      }

      const finalPdfUrl = uploadedPdfUrl || generatedPdfUri || (images[0] || '');
      const finalThumbUrl = uploadedThumbUrl || images[0] || '';
      setPublishedPdfUrl(finalPdfUrl);
      setPublishedPdfBlob(generatedPdfBlob);

      if (onPublish) {
        await onPublish(data, images, finalPdfUrl, generatedPdfBlob || undefined, finalThumbUrl);
      }
      setPublishSuccessModalOpen(true);
    } finally {
      setPublishing(false);
      setCaptureProgressText('');
    }
  };

  // List of all stories and slots on the current page for the "Page Outline" tab
  const pageSlotsList = useMemo(() => {
    const list: Array<{ path: string; label: string; headline?: string; image?: string; type: string }> = [];

    if (activePage === 1) {
      list.push({
        path: 'header',
        label: '🏷️ અખબાર સંપૂર્ણ હેડર (Full Header)',
        headline: `${data.page1.mastheadTitle || 'ગુજરાત પોસ્ટ'} • ${data.page1.quote?.author || 'સુવિચાર'} • ${data.page1.weather?.city || 'હવામાન'} • ${data.page1.editionBar?.price || 'કિંમત'}`,
        type: 'masthead',
      });
      list.push({ path: 'leadStory', label: '⭐ મુખ્ય સમાચાર (Lead Story)', headline: data.page1.leadStory?.headline || samplePage1Data.mainHeadline.headline, image: data.page1.leadStory?.image || samplePage1Data.mainHeadline.image, type: 'story' });
      list.push({ path: 'sideTopNews', label: '⚡ સાઈડ ટોપ ન્યુઝ (Side Lead)', headline: (data.page1 as any).sideTopNews?.headline || samplePage1Data.sideTopNews.headline, image: (data.page1 as any).sideTopNews?.image || samplePage1Data.sideTopNews.image, type: 'story' });

      const nb = (data.page1 as any).newsBlocks || samplePage1Data.newsBlocks;
      nb.forEach((s: any, idx: number) => {
        list.push({ path: `newsBlocks.${idx}`, label: `📌 સમાચાર સ્લોટ ${idx + 1} (${s.headline?.slice(0, 20)}...)`, headline: s.headline, image: s.image, type: 'story' });
      });

      list.push({ path: 'bottomLeftFeature', label: '📌 સંસદ / ફીચર (Bottom Left)', headline: (data.page1 as any).bottomLeftFeature?.headline || samplePage1Data.bottomLeftFeature.headline, image: (data.page1 as any).bottomLeftFeature?.image || samplePage1Data.bottomLeftFeature.image, type: 'story' });
      list.push({ path: 'bottomMiddleSports', label: '🏏 સ્પોર્ટ્સ સમાચાર (Bottom Middle)', headline: (data.page1 as any).bottomMiddleSports?.headline || samplePage1Data.bottomMiddleSports?.headline, image: (data.page1 as any).bottomMiddleSports?.image || samplePage1Data.bottomMiddleSports?.image, type: 'story' });
      list.push({ path: 'advertisement', label: '📢 ફ્રન્ટ પેજ જાહેરાત (Front Ad Box)', headline: 'Front Page Advertisement Box', image: data.page1.advertisement?.image, type: 'ad' });
      (data.page1.bottomStories || []).forEach((s, idx) => {
        list.push({ path: `bottomStories.${idx}`, label: `📰 બોટમ ન્યૂઝ ${idx + 1}`, headline: s.headline, image: s.image, type: 'story' });
      });
    } else if (activePage === 2) {
      list.push({ path: 'mainDistrictStory', label: '⭐ મુખ્ય રાજ્ય અહેવાલ (Lead Story)', headline: data.page2?.mainDistrictStory?.headline, image: data.page2?.mainDistrictStory?.image, type: 'story' });
      list.push({ path: 'sideLeadStory', label: '⚡ સાઈડ લીડ સમાચાર (Side Spotlight)', headline: (data.page2 as any)?.sideLeadStory?.headline, image: (data.page2 as any)?.sideLeadStory?.image, type: 'story' });
      const dStories = data.page2?.districtStories || [];
      dStories.slice(0, 3).forEach((s, idx) => {
        list.push({ path: `districtStories.${idx}`, label: `📌 જિલ્લા સમાચાર ${idx + 1} (${s.district || s.location || idx + 1})`, headline: s.headline, image: s.image, type: 'story' });
      });
      list.push({ path: 'bottomLeftFeature', label: '🌾 બોટમ ફીચર ૧ - કૃષિ/ગ્રામીણ', headline: (data.page2 as any)?.bottomLeftFeature?.headline, image: (data.page2 as any)?.bottomLeftFeature?.image, type: 'story' });
      list.push({ path: 'bottomRightFeature', label: '🎓 બોટમ ફીચર ૨ - શિક્ષણ/વિકાસ', headline: (data.page2 as any)?.bottomRightFeature?.headline, image: (data.page2 as any)?.bottomRightFeature?.image, type: 'story' });
    } else if (activePage === 3) {
      list.push({ path: 'businessStory', label: '⭐ બિઝનેસ મુખ્ય સમાચાર (Business Lead)', headline: data.page3.businessStory.headline, image: data.page3.businessStory.image, type: 'story' });
      list.push({ path: 'editorial', label: '✍️ મુખ્ય તંત્રીલેખ / ઓપિનિયન (Editorial)', headline: data.page3.editorial.title, image: data.page3.editorial.authorImage, type: 'editorial' });
      list.push({ path: 'politicsStory', label: '🏛️ રાષ્ટ્રીય નીતિઓ & અર્થતંત્ર (National Policy)', headline: data.page3.politicsStory.headline, image: data.page3.politicsStory.image, type: 'story' });
      list.push({ path: 'techStory', label: '⚡ ટેકનોલોજી & સેમિકન્ડક્ટર (Tech Feature)', headline: (data.page3 as any)?.techStory?.headline, image: (data.page3 as any)?.techStory?.image, type: 'story' });
      list.push({ path: 'bankingStory', label: '🏦 બેન્કિંગ & ફાઇનાન્સ માર્ગદર્શિકા (Banking Guide)', headline: (data.page3 as any)?.bankingStory?.headline, image: (data.page3 as any)?.bankingStory?.image, type: 'story' });
      list.push({ path: 'startupStory', label: '🚀 ગુજરાત સ્ટાર્ટઅપ હબ (Startup Spotlight)', headline: (data.page3 as any)?.startupStory?.headline, image: (data.page3 as any)?.startupStory?.image, type: 'story' });
      list.push({ path: 'commodityStory', label: '🌾 કોમોડિટી & કૃષિ માર્કેટ (Agri & Bullion)', headline: (data.page3 as any)?.commodityStory?.headline, image: (data.page3 as any)?.commodityStory?.image, type: 'story' });
      const briefs = (data.page3 as any)?.corporateBriefs || [];
      briefs.slice(0, 3).forEach((b: any, bIdx: number) => {
        list.push({ path: `corporateBriefs.${bIdx}`, label: `📋 કોર્પોરેટ ડાયરી ${bIdx + 1} (${b.category || bIdx + 1})`, headline: b.headline, type: 'story' });
      });
      list.push({ path: 'marketRates', label: '💰 લાઇવ બજાર ભાવો (Gold, Silver, Sensex)', headline: 'ગોલ્ડ, સિલ્વર, સેન્સેક્સ, નિફ્ટી', type: 'market' });
      list.push({ path: 'advertisement', label: '📢 કોર્પોરેટ જાહેરાત સ્લોટ (Corporate Ad)', headline: data.page3.advertisement?.title || 'Corporate Partner Ad', image: data.page3.advertisement?.image, type: 'ad' });
    } else if (activePage === 4) {
      list.push({ path: 'mainSportsStory', label: '🏏 સ્પોર્ટ્સ મુખ્ય સમાચાર (Sports Lead)', headline: data.page4.mainSportsStory.headline, image: data.page4.mainSportsStory.image, type: 'story' });
      list.push({ path: 'matchInfo', label: '🏆 લાઈવ સ્કોરકાર્ડ / મેચ સમરી (Match Info)', headline: data.page4.matchInfo, type: 'match' });
      list.push({ path: 'secondarySportsStory', label: '🏃 એથ્લેટિક્સ & ખેલકૂદ વિશેષ (Athletics Feature)', headline: data.page4.secondarySportsStory.headline, image: data.page4.secondarySportsStory.image, type: 'story' });
      const briefs = (data.page4 as any)?.sportsBriefs || [];
      briefs.slice(0, 3).forEach((b: any, bIdx: number) => {
        list.push({ path: `sportsBriefs.${bIdx}`, label: `⚡ રમત સંક્ષિપ્ત વાયર ${bIdx + 1} (${b.category || bIdx + 1})`, headline: b.headline, type: 'story' });
      });
      list.push({ path: 'sportsRoundupTitle', label: '⚡ રમત સંક્ષિપ્ત હેડર & ૩ વાયર (Sports Roundup)', headline: (data.page4 as any)?.sportsRoundupTitle || '⚡ રમત-ગમત સંક્ષિપ્ત (SPORTS ROUNDUP)', type: 'story' });
      list.push({ path: 'entertainmentStory', label: '🎬 બોલીવુડ & સિનેમા વિશેષ (Cinema Lead)', headline: data.page4.entertainmentStory.headline, image: data.page4.entertainmentStory.image, type: 'story' });
      list.push({ path: 'ottLifestyleStory', label: '🍿 ઓટીટી & મનોરંજન ગાઈડ (OTT & Web Series)', headline: (data.page4 as any)?.ottLifestyleStory?.headline, image: (data.page4 as any)?.ottLifestyleStory?.image, type: 'story' });
      list.push({ path: 'horoscope', label: '🔮 આજનું રાશિફળ (૧૨ રાશિ ભવિષ્ય)', headline: 'દૈનિક રાશિફળ', type: 'horoscope' });
      const bStories = (data.page4 as any)?.bottomStories || getDefaultTemplateData(cityGu || city, date).page4.bottomStories || [];
      bStories.slice(0, 3).forEach((s: any, bIdx: number) => {
        list.push({ path: `bottomStories.${bIdx}`, label: `📰 બોટમ ન્યૂઝ ${bIdx + 1} (${s.category || bIdx + 1})`, headline: s.headline, image: s.image, type: 'story' });
      });
    }

    return list;
  }, [activePage, data]);

  const pageTabs = [
    { num: 1, name: 'ફ્રન્ટ પેજ', en: 'Front Page', path: 'leadStory.headline' },
    { num: 2, name: 'ગુજરાત', en: 'Gujarat News', path: 'mainDistrictStory.headline' },
    { num: 3, name: 'બિઝનેસ', en: 'Business', path: 'businessStory.headline' },
    { num: 4, name: 'સ્પોર્ટ્સ', en: 'Sports & Life', path: 'mainSportsStory.headline' },
  ];

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[999] w-screen h-screen min-w-full min-h-full bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden select-none">
      {/* ─── 1. TOP BUILDER TOOLBAR HEADER ─── */}
      <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-2.5 sm:px-4 py-2 flex items-center justify-between z-20 shrink-0 shadow-xl gap-2">
        {/* Left: Back + Branding + Meta */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer border border-slate-800 shadow-xs shrink-0"
            title="ડેશબોર્ડ પર પાછા જાઓ (Back to Dashboard)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">પાછા જાઓ</span>
          </button>

          <div className="h-6 w-px bg-slate-800/80 hidden sm:block" />

          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-red-900/30 shrink-0">
              <Newspaper className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight flex items-center gap-1 sm:gap-1.5 truncate">
                  <span className="hidden sm:inline">ડિજિટલ </span>
                  <span>અખબાર બિલ્ડર</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    લાઈવ
                  </span>
                </h2>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="text-amber-400 font-bold">{cityGu || city} આવૃત્તિ</span>
                <span className="hidden xs:inline text-slate-600">•</span>
                <span className="hidden xs:inline">{date}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Center: Clean Segmented Page Switcher (Desktop) */}
        <div className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 shadow-inner gap-1">
          {pageTabs.map((p) => (
            <button
              key={p.num}
              onClick={() => {
                setActivePage(p.num as 1 | 2 | 3 | 4);
                setSelectedPath(p.path);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activePage === p.num
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/50 ring-1 ring-red-400/30 font-extrabold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              title={`પૃષ્ઠ ${p.num}: ${p.name} (${p.en})`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${activePage === p.num
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-800 text-slate-400'
                  }`}
              >
                {p.num}
              </span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        {/* Right: Zoom & Publishing Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Unified Modern Zoom Widget (Desktop/Tablet) */}
          <div className="hidden md:flex items-center bg-slate-900/90 border border-slate-800/90 rounded-xl p-0.5 text-xs shadow-inner">
            <button
              onClick={() => setZoomLevel((z) => Math.max(30, z - 10))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="ઝૂમ આઉટ (Zoom Out)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <div className="h-3.5 w-px bg-slate-800 mx-0.5" />

            <button
              onClick={() => setZoomLevel(50)}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${zoomLevel === 50
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              title="સ્ક્રીન ફિટ (50% Fit)"
            >
              ફિટ
            </button>

            <button
              onClick={() => setZoomLevel(75)}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${zoomLevel === 75
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              title="૭૫% ઝૂમ"
            >
              ૭૫%
            </button>

            <button
              onClick={() => setZoomLevel(100)}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${zoomLevel === 100
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              title="૧૦૦% ઓરિજિનલ સાઇઝ"
            >
              ૧૦૦%
            </button>

            {zoomLevel !== 50 && zoomLevel !== 75 && zoomLevel !== 100 && (
              <span className="px-1.5 py-0.5 font-mono text-[11px] font-black text-amber-400 bg-slate-800 rounded-md">
                {zoomLevel}%
              </span>
            )}

            <div className="h-3.5 w-px bg-slate-800 mx-0.5" />

            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="ઝૂમ ઇન (Zoom In)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800/80 hidden sm:block mx-0.5" />

          {/* Browser Fullscreen Mode Toggle */}
          <button
            onClick={toggleBrowserFullscreen}
            className="hidden sm:flex p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer border border-slate-800 shadow-xs"
            title={isBrowserFullscreen ? "સામાન્ય સ્ક્રીન (Exit Fullscreen)" : "ફુલ સ્ક્રીન મોડ (Full Screen Mode)"}
          >
            {isBrowserFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-400" />
            )}
          </button>

          {/* Full Preview Modal Button */}
          <button
            onClick={() => {
              setPreviewPage(activePage);
              setFullPreviewModalOpen(true);
            }}
            className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border border-slate-800 shadow-xs hover:border-amber-500/40 hover:text-amber-300 group"
            title="સંપૂર્ણ પેજ પ્રીવ્યુ (Full Screen Preview)"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">પ્રીવ્યુ</span>
          </button>

          {/* Save Draft Button */}
          <button
            onClick={handleSaveDraft}
            disabled={saving || publishing}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer border border-slate-800 shadow-xs hover:border-blue-500/40 hover:text-blue-300 disabled:opacity-50 group shrink-0"
            title="ડ્રાફ્ટ સેવ કરો (Save Draft)"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ) : (
              <Save className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="hidden sm:inline">ડ્રાફ્ટ સેવ</span>
          </button>

          {/* Hero Publish Button */}
          <button
            onClick={handlePublishClick}
            disabled={saving || publishing}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white text-xs px-3 sm:px-4 py-1.5 rounded-xl font-black shadow-md shadow-red-900/40 hover:shadow-red-800/50 transition transform active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            title="અખબાર પબ્લિશ કરો (Publish Edition)"
          >
            {publishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span className="hidden xs:inline">અખબાર </span>
            <span>પબ્લિશ</span>
          </button>
        </div>
      </header>

      {/* ─── MOBILE PAGE TABS BAR (Visible below 1024px) ─── */}
      <div className="lg:hidden bg-slate-950 px-2 sm:px-3 py-1.5 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
        {pageTabs.map((p) => (
          <button
            key={p.num}
            onClick={() => {
              setActivePage(p.num as 1 | 2 | 3 | 4);
              setSelectedPath(p.path);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${activePage === p.num
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
          >
            <span className="text-[10px] opacity-75">{p.num}.</span>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* ─── MOBILE VIEW SWITCHER BAR (Editor / Outline / Canvas) (Visible below 1024px) ─── */}
      <div className="lg:hidden bg-slate-900/95 px-2 sm:px-3 py-1.5 border-b border-slate-800 flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 flex-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setMobileViewTab('editor');
              setSidebarTab('editor');
            }}
            className={`flex-1 py-1.5 px-1.5 sm:px-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${mobileViewTab === 'editor' && sidebarTab === 'editor'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>સ્ટોરી એડિટર</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileViewTab('editor');
              setSidebarTab('outline');
            }}
            className={`flex-1 py-1.5 px-1.5 sm:px-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${mobileViewTab === 'editor' && sidebarTab === 'outline'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>પેજ રૂપરેખા</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileViewTab('canvas');
              if (typeof window !== 'undefined' && window.innerWidth < 768 && zoomLevel > 35) {
                const availableWidth = window.innerWidth - 16;
                const fit = Math.min(100, Math.max(25, Math.floor((availableWidth / 1224) * 100)));
                setZoomLevel(fit);
              }
            }}
            className={`flex-1 py-1.5 px-1.5 sm:px-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${mobileViewTab === 'canvas'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>અખબાર જુઓ</span>
          </button>
        </div>

        {/* Quick Zoom Bar when viewing canvas on mobile */}
        {mobileViewTab === 'canvas' && (
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(25, z - 10))}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  const availableWidth = window.innerWidth - 16;
                  setZoomLevel(Math.min(100, Math.max(25, Math.floor((availableWidth / 1224) * 100))));
                }
              }}
              className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold text-amber-400 hover:text-white cursor-pointer"
              title="Fit"
            >
              ફિટ
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
              title="100%"
            >
              ૧૦૦%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ─── 2. DUAL PANE STUDIO CONTAINER ─── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── LEFT PANEL: SMART STORY & PAGE STUDIO ── */}
        <div className={`bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden shadow-2xl z-10 ${mobileViewTab === 'editor' ? 'w-full lg:w-[380px] flex' : 'hidden lg:flex lg:w-[380px]'
          }`}>
          {/* Studio Tab Switcher: Editor vs Outline (Desktop Only) */}
          <div className="hidden lg:flex p-3 border-b border-slate-800 bg-slate-950/80 gap-1 shrink-0">
            <button
              onClick={() => setSidebarTab('editor')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${sidebarTab === 'editor'
                  ? 'bg-red-600/15 text-red-400 border border-red-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>સ્ટોરી એડિટર (Editor)</span>
            </button>
            <button
              onClick={() => setSidebarTab('outline')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${sidebarTab === 'outline'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>પેજ રૂપરેખા (Outline)</span>
            </button>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 sm:space-y-4">
            {/* ─────── TAB 1: STORY EDITOR ─────── */}
            {sidebarTab === 'editor' && (
              <>
                {/* Page 1 Mode Switcher (Header vs Stories) */}
                {activePage === 1 && (
                  <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 gap-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPath('header');
                        setSelectedLabel('🏷️ સંપૂર્ણ હેડર (Full Header)');
                      }}
                      className={`flex-1 py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${isHeaderMode
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                        }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>🏷️ સંપૂર્ણ હેડર (Header)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPath('leadStory.headline');
                        setSelectedLabel('મુખ્ય સમાચાર (Lead Story)');
                      }}
                      className={`flex-1 py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${!isHeaderMode
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                        }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>📝 સ્ટોરીઝ (Articles)</span>
                    </button>
                  </div>
                )}

                {/* If on Page 1 and Header is selected, render Full Header Editor */}
                {isHeaderMode ? (
                  <HeaderEditor
                    data={data.page1}
                    onChange={handleUpdateHeader}
                    selectedSubfield={selectedPath}
                    onSelectSubfield={(subfield) => {
                      setSelectedPath(subfield);
                    }}
                    defaultCity={cityGu || city}
                    defaultDate={date}
                  />
                ) : (
                  <>
                    {/* Active Article Quick Switcher Card (Switch & edit ANY article on Page 1, 2, 3, 4) */}
                    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 shadow-md space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>આર્ટિકલ પસંદ કરો (Article Switcher)</span>
                        </label>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-red-600/20 text-red-400 px-2.5 py-0.5 rounded-full border border-red-500/30">
                          પેજ {activePage} આર્ટિકલ
                        </span>
                      </div>

                      {/* Dropdown to switch between all articles on the current page */}
                      <select
                        value={storyRootPath}
                        onChange={(e) => {
                          const targetSlot = pageSlotsList.find((s) => s.path === e.target.value);
                          if (targetSlot) {
                            handleSelectSlot(targetSlot.path, targetSlot.label);
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-bold focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 outline-none cursor-pointer"
                      >
                        {pageSlotsList
                          .filter((s) => s.type === 'story')
                          .map((slot) => (
                            <option key={slot.path} value={slot.path} className="bg-slate-950 text-slate-100 py-1">
                              {slot.label} {slot.headline ? `— ${slot.headline.slice(0, 30)}...` : ''}
                            </option>
                          ))}
                      </select>

                      {/* Quick Pills Bar for 1-click article selection */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {pageSlotsList
                          .filter((s) => s.type === 'story')
                          .map((slot) => {
                            const isActive = storyRootPath === slot.path;
                            const shortLabel = slot.label.split('(')[0].replace(/^[^\w\u0A80-\u0AFF]+/, '').trim();
                            return (
                              <button
                                key={slot.path}
                                type="button"
                                onClick={() => handleSelectSlot(slot.path, slot.label)}
                                className={`text-[10.5px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${isActive
                                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-xs'
                                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
                                  }`}
                                title={slot.headline || slot.label}
                              >
                                <span>{shortLabel}</span>
                              </button>
                            );
                          })}
                      </div>

                      {/* Active Slot Label info */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                        <span className="text-slate-500">હાલનો સ્લોટ:</span>
                        <span className="text-amber-300 font-semibold truncate max-w-[200px]">
                          {selectedLabel || selectedPath}
                        </span>
                      </div>
                    </div>

                    {/* Rich Story Form if current selection is a story */}
                    {currentStoryObj ? (
                      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
                        {/* Category Tag Field with Quick Presets */}
                        {'category' in currentStoryObj && (
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1 text-xs font-bold text-slate-300">
                              <Tag className="w-3.5 h-3.5 text-amber-400" />
                              <span>કેટેગરી ટૅગ (Category Badge)</span>
                            </label>
                            <input
                              type="text"
                              value={currentStoryObj.category || ''}
                              onChange={(e) => updateStoryField('category', e.target.value)}
                              placeholder="દા.ત. મુખ્ય સમાચાર, રાજકીય, શિક્ષણ..."
                              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:ring-2 focus:ring-red-500/40 focus:border-red-500 outline-none"
                            />
                            <div className="flex flex-wrap gap-1 pt-1">
                              {CATEGORY_PRESETS.map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => updateStoryField('category', preset)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer ${currentStoryObj.category === preset
                                      ? 'bg-red-600 text-white border-red-500'
                                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                    }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Headline Field */}
                        {'headline' in currentStoryObj && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1 text-xs font-bold text-slate-300">
                                <Type className="w-3.5 h-3.5 text-blue-400" />
                                <span>હેડલાઇન / શિર્ષક (Headline) *</span>
                              </label>
                              <span className="text-[10px] font-mono text-slate-500">
                                {currentStoryObj.headline?.length || 0} chars
                              </span>
                            </div>
                            <textarea
                              rows={3}
                              value={currentStoryObj.headline || ''}
                              onChange={(e) => updateStoryField('headline', e.target.value)}
                              placeholder="અહીં ગુજરાતીમાં મુખ્ય હેડલાઇન લખો..."
                              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 font-black leading-relaxed focus:ring-2 focus:ring-red-500/40 focus:border-red-500 outline-none resize-none"
                            />
                          </div>
                        )}

                        {/* Subheadline Field */}
                        {'subheadline' in currentStoryObj && (
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-1 text-xs font-bold text-slate-300">
                              <AlignLeft className="w-3.5 h-3.5 text-emerald-400" />
                              <span>પેટા-શિર્ષક / સમરી (Subheadline)</span>
                            </label>
                            <input
                              type="text"
                              value={currentStoryObj.subheadline || ''}
                              onChange={(e) => updateStoryField('subheadline', e.target.value)}
                              placeholder="દા.ત. રાજ્યના તમામ મુખ્ય જિલ્લાઓ માટે નવી યોજના..."
                              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:ring-2 focus:ring-red-500/40 focus:border-red-500 outline-none"
                            />
                          </div>
                        )}

                        {/* Location / Dateline Field (સ્થળ / ડેટલાઇન - Before Paragraph 1) */}
                        {(('location' in currentStoryObj) || ('district' in currentStoryObj) || (currentStoryObj as any).location !== undefined || isLeadOrMainStory || activePage === 1 || activePage === 2 || currentStoryObj.headline) && (
                          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1 text-xs font-bold text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-red-400" />
                                <span>સ્થળ / ડેટલાઇન (Location / Dateline)</span>
                              </label>
                              <span className="text-[10px] text-slate-500 font-medium">
                                પેરાગ્રાફ ૧ શરૂ થતાં પહેલાં
                              </span>
                            </div>
                            <input
                              type="text"
                              value={(currentStoryObj as any).location || (currentStoryObj as any).district || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateStoryField('location' as any, val);
                                if ('district' in currentStoryObj || storyRootPath.includes('district') || activePage === 2) {
                                  updateStoryField('district' as any, val);
                                }
                              }}
                              placeholder="દા.ત. ગાંધીનગર, અમદાવાદ, સુરત, વલસાડ, નવી દિલ્હી..."
                              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:ring-2 focus:ring-red-500/40 focus:border-red-500 outline-none"
                            />
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {['ગાંધીનગર', 'અમદાવાદ', 'સુરત', 'રાજકોટ', 'વડોદરા', 'વલસાડ', 'નવી દિલ્હી'].map((cityPreset) => {
                                const currentLoc = (currentStoryObj as any).location || (currentStoryObj as any).district || '';
                                const isActive = currentLoc === cityPreset;
                                return (
                                  <button
                                    key={cityPreset}
                                    type="button"
                                    onClick={() => {
                                      updateStoryField('location' as any, cityPreset);
                                      if ('district' in currentStoryObj || storyRootPath.includes('district') || activePage === 2) {
                                        updateStoryField('district' as any, cityPreset);
                                      }
                                    }}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer ${isActive
                                        ? 'bg-red-600 text-white border-red-500'
                                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                      }`}
                                  >
                                    {cityPreset}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Article Body Field - Only shown for single-paragraph / standard stories */}
                        {!isMultiParagraphStory && ('articleBody' in currentStoryObj || 'body' in (currentStoryObj as any) || 'editorialText' in (currentStoryObj as any)) && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1 text-xs font-bold text-slate-300">
                                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                <span>સમાચાર પેરાગ્રાફ / વિગત (Article Paragraph / Body)</span>
                              </label>
                              <span className="text-[10px] font-mono text-slate-500">
                                {(() => {
                                  const curBody = (currentStoryObj.articleBody || (currentStoryObj as any).body || (currentStoryObj as any).editorialText || '').trim() || storyParagraphs.body;
                                  return curBody.split(/\s+/).filter(Boolean).length;
                                })()} words
                              </span>
                            </div>
                            <textarea
                              rows={5}
                              value={
                                (currentStoryObj.articleBody && currentStoryObj.articleBody.trim())
                                  ? currentStoryObj.articleBody
                                  : ((currentStoryObj as any).body && (currentStoryObj as any).body.trim())
                                    ? (currentStoryObj as any).body
                                    : ((currentStoryObj as any).editorialText && (currentStoryObj as any).editorialText.trim())
                                      ? (currentStoryObj as any).editorialText
                                      : storyParagraphs.body
                              }
                              onChange={(e) => updateStoryField('articleBody', e.target.value)}
                              placeholder="અહીં સમાચારનું વિગતવાર ગુજરાતી લખાણ લખો..."
                              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 leading-relaxed focus:ring-2 focus:ring-red-500/40 focus:border-red-500 outline-none resize-none font-sans"
                            />
                          </div>
                        )}

                        {/* Dedicated paragraph fields for stories with multi-paragraph layout (e.g. Lead Story 3 Paragraphs, Side Lead 2 Paragraphs) */}
                        {isMultiParagraphStory && (
                          <div className="space-y-3 pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1 text-xs font-bold text-slate-300">
                                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                <span>સમાચાર પેરાગ્રાફ (Article Paragraphs)</span>
                              </label>
                              <span className="text-[10px] font-mono text-slate-500">
                                {[
                                  currentStoryObj.paragraph1?.trim() ? currentStoryObj.paragraph1 : storyParagraphs.p1,
                                  (currentStoryObj as any).paragraph2?.trim() ? (currentStoryObj as any).paragraph2 : storyParagraphs.p2,
                                  (isLeadOrMainStory || Boolean((currentStoryObj as any).paragraph3?.trim()))
                                    ? ((currentStoryObj as any).paragraph3?.trim() ? (currentStoryObj as any).paragraph3 : storyParagraphs.p3)
                                    : '',
                                ].filter(Boolean).join(' ').trim().split(/\s+/).filter(Boolean).length} words
                              </span>
                            </div>

                            {/* Paragraph 1 */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                                <span>પેરાગ્રાફ ૧ (Paragraph 1)</span>
                                <span className="text-[10px] text-slate-500 font-normal">
                                  {isLeadOrMainStory ? 'ડાબી કૉલમ / મુખ્ય' : 'પ્રથમ પેરા'}
                                </span>
                              </label>
                              <textarea
                                rows={4}
                                value={currentStoryObj.paragraph1?.trim() ? currentStoryObj.paragraph1 : storyParagraphs.p1}
                                onChange={(e) => updateStoryField('paragraph1', e.target.value)}
                                placeholder="પેરાગ્રાફ ૧ લખાણ..."
                                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 leading-relaxed focus:ring-2 focus:ring-red-500/40 focus:border-red-500 outline-none resize-none font-sans"
                              />
                            </div>

                            {/* Paragraph 2 */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                                <span>પેરાગ્રાફ ૨ (Paragraph 2)</span>
                                <span className="text-[10px] text-slate-500 font-normal">
                                  {isLeadOrMainStory ? 'ફોટો નીચે ડાબે / બીજો પેરા' : 'બીજો પેરા'}
                                </span>
                              </label>
                              <textarea
                                rows={4}
                                value={(currentStoryObj as any).paragraph2?.trim() ? (currentStoryObj as any).paragraph2 : storyParagraphs.p2}
                                onChange={(e) => updateStoryField('paragraph2', e.target.value)}
                                placeholder="પેરાગ્રાફ ૨ લખાણ..."
                                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 leading-relaxed focus:ring-2 focus:ring-red-500/40 focus:border-red-500 outline-none resize-none font-sans"
                              />
                            </div>

                            {/* Paragraph 3 */}
                            {(isLeadOrMainStory || Boolean((currentStoryObj as any).paragraph3?.trim() || storyParagraphs.p3)) && (
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                                  <span>પેરાગ્રાફ ૩ (Paragraph 3)</span>
                                  <span className="text-[10px] text-slate-500 font-normal">
                                    {isLeadOrMainStory ? 'ફોટો નીચે જમણે' : 'ત્રીજો પેરા'}
                                  </span>
                                </label>
                                <textarea
                                  rows={4}
                                  value={(currentStoryObj as any).paragraph3?.trim() ? (currentStoryObj as any).paragraph3 : storyParagraphs.p3}
                                  onChange={(e) => updateStoryField('paragraph3', e.target.value)}
                                  placeholder="પેરાગ્રાફ ૩ લખાણ..."
                                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 leading-relaxed focus:ring-2 focus:ring-red-500/40 focus:border-red-500 outline-none resize-none font-sans"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* ─── Key Points Box Editor (મુખ્ય મુદ્દાઓ - Edit and Delete Only) ─── */}
                        {Boolean((currentStoryObj as any)?.keyPoints) && (
                          <div className="space-y-2.5 pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                                <ListOrdered className="w-3.5 h-3.5" />
                                <span>મુખ્ય મુદ્દાઓ / કી પોઈન્ટ્સ (Key Points Box)</span>
                              </label>
                            </div>

                            <div className="bg-purple-950/20 border border-purple-900/40 rounded-xl p-3 space-y-3">
                              {/* Box Title with Delete Box action */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] text-purple-300 font-bold">બોક્સ શિર્ષક (Box Title):</label>
                                  <button
                                    type="button"
                                    onClick={() => updateStoryField('keyPoints' as any, null)}
                                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5 cursor-pointer font-bold"
                                    title="કી પોઈન્ટ્સ બોક્સ દૂર કરો"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>બોક્સ દૂર કરો</span>
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={(currentStoryObj as any).keyPoints?.title || ''}
                                  onChange={(e) => {
                                    const currentKP = (currentStoryObj as any).keyPoints || { title: '', points: [] };
                                    updateStoryField('keyPoints' as any, {
                                      ...currentKP,
                                      title: e.target.value,
                                    });
                                  }}
                                  placeholder="દા.ત. મુખ્ય મુદ્દાઓ, આગાહી, વિશેષતાઓ..."
                                  className="w-full bg-slate-950 border border-purple-800/60 rounded-lg px-2.5 py-1.5 text-xs text-purple-100 font-bold focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 outline-none"
                                />
                              </div>

                              {/* List of Points (Edit and Delete only) */}
                              {(() => {
                                const rawPts: string[] = (currentStoryObj as any).keyPoints?.points || [];
                                const isPage3Capped = activePage === 3 && (storyRootPath === 'techStory' || storyRootPath === 'bankingStory');
                                const maxPoints = isPage3Capped ? 2 : (activePage === 4 ? 3 : rawPts.length);
                                const ptsToDisplay = rawPts.slice(0, maxPoints);
                                return (
                                  <div className="space-y-2">
                                    <label className="text-[10px] text-slate-400 font-bold block">
                                      મુદ્દાઓની યાદી ({ptsToDisplay.length} મુદ્દા):
                                    </label>
                                    {ptsToDisplay.map((pt: string, idx: number) => (
                                      <div key={idx} className="flex items-start gap-1.5">
                                        <span className="text-[10px] font-bold text-purple-400 bg-purple-900/50 w-5 h-7 rounded flex items-center justify-center shrink-0 mt-0.5">
                                          {idx + 1}
                                        </span>
                                        <textarea
                                          rows={2}
                                          value={pt}
                                          onChange={(e) => {
                                            const currentKP = (currentStoryObj as any).keyPoints || { title: 'મુખ્ય મુદ્દાઓ', points: [] };
                                            const capLimit = isPage3Capped ? 2 : (activePage === 4 ? 3 : (currentKP.points || []).length);
                                            const basePts = (currentKP.points || []).slice(0, capLimit);
                                            const newPoints = [...basePts];
                                            newPoints[idx] = e.target.value;
                                            updateStoryField('keyPoints' as any, {
                                              ...currentKP,
                                              points: isPage3Capped ? newPoints.slice(0, 2) : (activePage === 4 ? newPoints.slice(0, 3) : newPoints),
                                            });
                                          }}
                                          placeholder={`મુદ્દો ${idx + 1}...`}
                                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 resize-none outline-none focus:border-purple-500 font-sans"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const currentKP = (currentStoryObj as any).keyPoints || { title: 'મુખ્ય મુદ્દાઓ', points: [] };
                                            const capLimit = isPage3Capped ? 2 : (activePage === 4 ? 3 : (currentKP.points || []).length);
                                            const basePts = (currentKP.points || []).slice(0, capLimit);
                                            const newPoints = basePts.filter((_: any, i: number) => i !== idx);
                                            updateStoryField('keyPoints' as any, {
                                              ...currentKP,
                                              points: isPage3Capped ? newPoints.slice(0, 2) : (activePage === 4 ? newPoints.slice(0, 3) : newPoints),
                                            });
                                          }}
                                          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition cursor-pointer mt-1"
                                          title="આ મુદ્દો કાઢી નાખો"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {/* ─── 🏏 Page 4 Feature 1: Cricket Match Summary Scorecard ─── */}
                        {activePage === 4 && (storyRootPath === 'mainSportsStory' || (currentStoryObj as any)?.matchScorecard !== undefined) && (
                          <div className="space-y-3 pt-3 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                                <span>🏏 મેચ સમરી સ્કોરકાર્ડ (Match Summary Scorecard)</span>
                              </label>
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                                પેજ ૪ બોક્સ
                              </span>
                            </div>

                            <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3 space-y-2.5">
                              {/* Title & Venue */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-slate-400 font-bold block mb-1">બોક્સ શીર્ષક</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).matchScorecard?.title ?? '🏏 મેચ સમરી સ્કોરકાર્ડ'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).matchScorecard || {};
                                      updateStoryField('matchScorecard', { ...cur, title: e.target.value });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-emerald-300 font-bold outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 font-bold block mb-1">સ્થળ (Venue)</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).matchScorecard?.venue ?? 'અમદાવાદ'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).matchScorecard || {};
                                      updateStoryField('matchScorecard', { ...cur, venue: e.target.value });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-amber-300 font-bold outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>

                              {/* Team 1 Details */}
                              <div className="p-2 bg-slate-950/60 rounded-lg border border-emerald-900/30 space-y-1.5">
                                <span className="text-[10px] text-emerald-400 font-black block">પ્રથમ ટીમ (Team 1)</span>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9.5px] text-slate-400 block mb-0.5">ટીમ ૧ નામ</label>
                                    <input
                                      type="text"
                                      value={(currentStoryObj as any).matchScorecard?.team1Name ?? 'ભારત:'}
                                      onChange={(e) => {
                                        const cur = (currentStoryObj as any).matchScorecard || {};
                                        updateStoryField('matchScorecard', { ...cur, team1Name: e.target.value });
                                      }}
                                      className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white font-bold outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9.5px] text-slate-400 block mb-0.5">ટીમ ૧ સ્કોર</label>
                                    <input
                                      type="text"
                                      value={(currentStoryObj as any).matchScorecard?.team1Score ?? '૩૨૪/૬ (૪૯.૨ ઓવર)'}
                                      onChange={(e) => {
                                        const cur = (currentStoryObj as any).matchScorecard || {};
                                        updateStoryField('matchScorecard', { ...cur, team1Score: e.target.value });
                                      }}
                                      className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white font-bold outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9.5px] text-slate-400 block mb-0.5">બેટ્સમેન સ્કોર વિગત</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).matchScorecard?.team1Details ?? 'વિરાટ ૧૧૪ (૧૨૦), રોહિત ૬૮ (૫૮)'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).matchScorecard || {};
                                      updateStoryField('matchScorecard', { ...cur, team1Details: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-300 outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>

                              {/* Team 2 Details */}
                              <div className="p-2 bg-slate-950/60 rounded-lg border border-emerald-900/30 space-y-1.5">
                                <span className="text-[10px] text-emerald-400 font-black block">બીજી ટીમ (Team 2)</span>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9.5px] text-slate-400 block mb-0.5">ટીમ ૨ નામ</label>
                                    <input
                                      type="text"
                                      value={(currentStoryObj as any).matchScorecard?.team2Name ?? 'ઓસ્ટ્રેલિયા:'}
                                      onChange={(e) => {
                                        const cur = (currentStoryObj as any).matchScorecard || {};
                                        updateStoryField('matchScorecard', { ...cur, team2Name: e.target.value });
                                      }}
                                      className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white font-bold outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9.5px] text-slate-400 block mb-0.5">ટીમ ૨ સ્કોર</label>
                                    <input
                                      type="text"
                                      value={(currentStoryObj as any).matchScorecard?.team2Score ?? '૩૨૦/૯ (૫૦ ઓવર)'}
                                      onChange={(e) => {
                                        const cur = (currentStoryObj as any).matchScorecard || {};
                                        updateStoryField('matchScorecard', { ...cur, team2Score: e.target.value });
                                      }}
                                      className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white font-bold outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9.5px] text-slate-400 block mb-0.5">બોલર્સ / વિકેટ વિગત</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).matchScorecard?.team2Details ?? 'બુમરાહ ૪/૩૩, શમી ૩/૪૨'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).matchScorecard || {};
                                      updateStoryField('matchScorecard', { ...cur, team2Details: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-300 outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ─── 📊 Page 4 Feature 2: Box Office Stats Card ─── */}
                        {activePage === 4 && (storyRootPath === 'entertainmentStory' || (currentStoryObj as any)?.boxOffice !== undefined) && (
                          <div className="space-y-3 pt-3 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                                <Film className="w-3.5 h-3.5 text-purple-400" />
                                <span>📊 બોક્સ ઓફિસ કલેક્શન (Box Office Stats Card)</span>
                              </label>
                              <span className="text-[10px] text-purple-400 font-bold bg-purple-950/80 border border-purple-800/50 px-2 py-0.5 rounded-full">
                                સિનેમા બોક્સ
                              </span>
                            </div>

                            <div className="bg-purple-950/20 border border-purple-800/40 rounded-xl p-3 space-y-2.5">
                              {/* Header & Rating */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-slate-400 font-bold block mb-1">બોક્સ શીર્ષક</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).boxOffice?.title ?? '📊 બોક્સ ઓફિસ કલેક્શન'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).boxOffice || {};
                                      updateStoryField('boxOffice', { ...cur, title: e.target.value });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-purple-300 font-bold outline-none focus:border-purple-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 font-bold block mb-1">રેટિંગ (Rating)</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).boxOffice?.rating ?? '★★★★☆ ૪.૫/૫'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).boxOffice || {};
                                      updateStoryField('boxOffice', { ...cur, rating: e.target.value });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-amber-300 font-bold outline-none focus:border-purple-500"
                                  />
                                </div>
                              </div>

                              {/* 3 Metric Columns */}
                              <div className="grid grid-cols-3 gap-2 p-2 bg-slate-950/60 rounded-lg border border-purple-900/30">
                                <div>
                                  <label className="text-[9px] text-slate-400 block mb-0.5">સ્તંભ ૧ લેબલ</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).boxOffice?.day1Label ?? 'પ્રથમ દિવસ'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).boxOffice || {};
                                      updateStoryField('boxOffice', { ...cur, day1Label: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[11px] text-slate-300 font-medium outline-none focus:border-purple-500 mb-1"
                                  />
                                  <label className="text-[9px] text-slate-400 block mb-0.5">આવક ૧</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).boxOffice?.day1Val ?? '₹૪.૫ કરોડ'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).boxOffice || {};
                                      updateStoryField('boxOffice', { ...cur, day1Val: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-amber-400 font-bold outline-none focus:border-purple-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 block mb-0.5">સ્તંભ ૨ લેબલ</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).boxOffice?.weekendLabel ?? 'વીકેન્ડ'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).boxOffice || {};
                                      updateStoryField('boxOffice', { ...cur, weekendLabel: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[11px] text-slate-300 font-medium outline-none focus:border-purple-500 mb-1"
                                  />
                                  <label className="text-[9px] text-slate-400 block mb-0.5">આવક ૨</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).boxOffice?.weekendVal ?? '₹૧૮ કરોડ'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).boxOffice || {};
                                      updateStoryField('boxOffice', { ...cur, weekendVal: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-amber-400 font-bold outline-none focus:border-purple-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 block mb-0.5">સ્તંભ ૩ લેબલ</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).boxOffice?.totalLabel ?? 'કુલ આવક'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).boxOffice || {};
                                      updateStoryField('boxOffice', { ...cur, totalLabel: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[11px] text-slate-300 font-medium outline-none focus:border-purple-500 mb-1"
                                  />
                                  <label className="text-[9px] text-slate-400 block mb-0.5">કુલ રકમ</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).boxOffice?.totalVal ?? '₹૧૫૦ કરોડ+'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).boxOffice || {};
                                      updateStoryField('boxOffice', { ...cur, totalVal: e.target.value });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-emerald-400 font-bold outline-none focus:border-purple-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ─── 🍿 Page 4 Feature 3: Top 3 OTT Picks ─── */}
                        {activePage === 4 && (storyRootPath === 'ottLifestyleStory' || (currentStoryObj as any)?.ottPicks !== undefined) && (
                          <div className="space-y-3 pt-3 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                                <span>🍿 ટોચના ૩ ઓટીટી પિક્સ (Top 3 OTT Streaming Releases)</span>
                              </label>
                              <span className="text-[10px] text-rose-400 font-bold bg-rose-950/80 border border-rose-800/50 px-2 py-0.5 rounded-full">
                                ઓટીટી બોક્સ
                              </span>
                            </div>

                            <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-3 space-y-2.5">
                              {/* Title & Tagline */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-slate-400 font-bold block mb-1">બોક્સ શીર્ષક</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).ottPicks?.title ?? '🍿 આ સપ્તાહના ટોચના ૩ ઓટીટી પિક્સ'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).ottPicks || {};
                                      updateStoryField('ottPicks', { ...cur, title: e.target.value });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-rose-300 font-bold outline-none focus:border-rose-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 font-bold block mb-1">ટેગલાઇન (Tagline)</label>
                                  <input
                                    type="text"
                                    value={(currentStoryObj as any).ottPicks?.tagline ?? 'સ્ટ્રીમિંગ નાઉ'}
                                    onChange={(e) => {
                                      const cur = (currentStoryObj as any).ottPicks || {};
                                      updateStoryField('ottPicks', { ...cur, tagline: e.target.value });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-amber-300 font-bold outline-none focus:border-rose-500"
                                  />
                                </div>
                              </div>

                              {/* 3 OTT Shows */}
                              <div className="space-y-2">
                                {[
                                  { pKey: 'pick1Platform', tKey: 'pick1Title', defP: 'Netflix', defT: 'ક્રાઇમ ડાયરીઝ', num: 1 },
                                  { pKey: 'pick2Platform', tKey: 'pick2Title', defP: 'Prime', defT: 'પંચાયત સિઝન ૩', num: 2 },
                                  { pKey: 'pick3Platform', tKey: 'pick3Title', defP: 'Hotstar', defT: 'સ્પેશિયલ ઓપ્સ', num: 3 },
                                ].map((item) => (
                                  <div key={item.num} className="grid grid-cols-3 gap-2 p-2 bg-slate-950/60 rounded-lg border border-rose-900/30 items-center">
                                    <div>
                                      <label className="text-[9px] text-slate-400 block mb-0.5">પ્લેટફોર્મ {item.num}</label>
                                      <input
                                        type="text"
                                        value={(currentStoryObj as any).ottPicks?.[item.pKey] ?? item.defP}
                                        onChange={(e) => {
                                          const cur = (currentStoryObj as any).ottPicks || {};
                                          updateStoryField('ottPicks', { ...cur, [item.pKey]: e.target.value });
                                        }}
                                        className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-rose-400 font-bold outline-none focus:border-rose-500"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-[9px] text-slate-400 block mb-0.5">શો / ફિલ્મનું નામ {item.num}</label>
                                      <input
                                        type="text"
                                        value={(currentStoryObj as any).ottPicks?.[item.tKey] ?? item.defT}
                                        onChange={(e) => {
                                          const cur = (currentStoryObj as any).ottPicks || {};
                                          updateStoryField('ottPicks', { ...cur, [item.tKey]: e.target.value });
                                        }}
                                        className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white font-semibold outline-none focus:border-rose-500"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ─── ⚡ Page 4 Feature 4: Sports Wire Roundup & Heading Editor ─── */}
                        {activePage === 4 && (
                          storyRootPath === 'secondarySportsStory' ||
                          storyRootPath === 'sportsRoundupTitle' ||
                          storyRootPath.startsWith('sportsBriefs') ||
                          selectedPath.startsWith('sportsBriefs') ||
                          selectedPath === 'sportsRoundupTitle'
                        ) && (
                          <div className="space-y-3 pt-3 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>⚡ રમત-ગમત સંક્ષિપ્ત વાયર (Sports Wire Roundup & 3 Briefs)</span>
                              </label>
                              <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded-full">
                                હેડર + ૩ વાયર
                              </span>
                            </div>

                            <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3 space-y-3">
                              {/* 1. Main Heading Box */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] text-amber-300 font-black">
                                    બોક્સ મુખ્ય શીર્ષક / હેડર (Roundup Heading):
                                  </label>
                                  <span className="text-[9px] text-slate-500">લાઈવ હેડર</span>
                                </div>
                                <input
                                  type="text"
                                  value={(data.page4 as any)?.sportsRoundupTitle ?? '⚡ રમત-ગમત સંક્ષિપ્ત (SPORTS ROUNDUP)'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setData((prev) => ({
                                      ...prev,
                                      page4: {
                                        ...prev.page4,
                                        sportsRoundupTitle: val,
                                      },
                                    }));
                                  }}
                                  placeholder="દા.ત. ⚡ રમત-ગમત સંક્ષિપ્ત (SPORTS ROUNDUP)"
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-bold outline-none focus:border-amber-500 shadow-inner"
                                />
                              </div>

                              {/* 2. 3 Sports Wire Brief Items */}
                              <div className="space-y-2.5 pt-1 border-t border-amber-900/30">
                                <label className="text-[10px] text-slate-300 font-bold block">
                                  ૩ સંક્ષિપ્ત વાયર સમાચારો (3 Sports Wire Briefs):
                                </label>
                                {[0, 1, 2].map((idx) => {
                                  const defaultBriefs = getDefaultTemplateData(cityGu || city, date).page4.sportsBriefs || [];
                                  const curBriefs = Array.isArray((data.page4 as any)?.sportsBriefs)
                                    ? (data.page4 as any).sportsBriefs
                                    : defaultBriefs;
                                  const item = curBriefs[idx] || defaultBriefs[idx] || { category: 'સ્પોર્ટ્સ', headline: '', articleBody: '' };

                                  const updateBrief = (f: 'category' | 'headline' | 'articleBody', v: string) => {
                                    const clone = JSON.parse(JSON.stringify(data));
                                    if (!Array.isArray(clone.page4.sportsBriefs)) {
                                      clone.page4.sportsBriefs = JSON.parse(JSON.stringify(defaultBriefs));
                                    }
                                    while (clone.page4.sportsBriefs.length <= idx) {
                                      clone.page4.sportsBriefs.push({ category: 'સ્પોર્ટ્સ', headline: '', articleBody: '' });
                                    }
                                    clone.page4.sportsBriefs[idx][f] = v;
                                    setData(clone);
                                  };

                                  return (
                                    <div key={idx} className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                                          વાયર સમાચાર {idx + 1}
                                        </span>
                                        <span className="text-[9.5px] text-slate-400 font-medium">
                                          {idx === 0 ? '૧. બેડમિન્ટન' : idx === 1 ? '૨. ચેસ' : '૩. ખેલ મહાકુંભ'}
                                        </span>
                                      </div>

                                      {/* Category & Headline */}
                                      <div className="grid grid-cols-3 gap-1.5">
                                        <div>
                                          <label className="text-[9px] text-slate-400 block mb-0.5 font-bold">ટૅગ / રમત</label>
                                          <input
                                            type="text"
                                            value={item.category || ''}
                                            onChange={(e) => updateBrief('category', e.target.value)}
                                            placeholder="દા.ત. બેડમિન્ટન"
                                            className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-emerald-400 font-bold outline-none focus:border-amber-500"
                                          />
                                        </div>
                                        <div className="col-span-2">
                                          <label className="text-[9px] text-slate-400 block mb-0.5 font-bold">હેડલાઇન / શીર્ષક</label>
                                          <input
                                            type="text"
                                            value={item.headline || ''}
                                            onChange={(e) => updateBrief('headline', e.target.value)}
                                            placeholder="હેડલાઇન લખો..."
                                            className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white font-bold outline-none focus:border-amber-500"
                                          />
                                        </div>
                                      </div>

                                      {/* Body */}
                                      <div>
                                        <label className="text-[9px] text-slate-400 block mb-0.5 font-bold">સંક્ષિપ્ત વિગત (Wire Detail)</label>
                                        <textarea
                                          rows={2}
                                          value={item.articleBody || ''}
                                          onChange={(e) => updateBrief('articleBody', e.target.value)}
                                          placeholder="સમાચાર વિગત લખો..."
                                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 resize-none font-sans"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ─── Featured Image & Live Preview & Info ─── */}
                        {(('image' in currentStoryObj) || (currentStoryObj as any).image !== undefined || isLeadOrMainStory || currentStoryObj.headline) && !storyRootPath.startsWith('sportsBriefs') && storyRootPath !== 'sportsRoundupTitle' && (
                          <div className="space-y-2.5 pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1 text-xs font-bold text-slate-300">
                                <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
                                <span>{storyRootPath === 'advertisement' ? '📢 જાહેરાત ઈમેજ (Ad Poster / Image)' : 'સ્ટોરી ફોટો (Featured Image)'}</span>
                              </label>
                              {currentStoryObj.image && (
                                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>ઈમેજ સેટ થયેલ છે</span>
                                </span>
                              )}
                            </div>

                            {/* Thumbnail Preview Card with live details */}
                            {currentStoryObj.image ? (
                              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2 space-y-2">
                                <div className="relative h-40 w-full rounded-lg overflow-hidden bg-black/40 flex items-center justify-center group">
                                  <img
                                    src={currentStoryObj.image}
                                    alt="Story Image Preview"
                                    className="w-full h-full object-contain"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateStoryField('image', '');
                                    }}
                                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg opacity-90 group-hover:opacity-100 transition shadow-md cursor-pointer"
                                    title="ઈમેજ દૂર કરો"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Image Info Bar */}
                                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                  <span className="truncate max-w-[200px] font-mono">
                                    {currentStoryObj.image.startsWith('data:')
                                      ? '📁 લોકલ ફાઇલ અપલોડ'
                                      : currentStoryObj.image.length > 30
                                        ? `${currentStoryObj.image.substring(0, 27)}...`
                                        : currentStoryObj.image}
                                  </span>
                                  <span className="text-emerald-400 font-semibold shrink-0">
                                    {currentStoryObj.image.startsWith('data:') ? 'Base64' : 'વેબ URL'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-slate-800 rounded-xl p-4 text-center text-slate-500 text-xs">
                                કોઈ ઈમેજ પસંદ કરેલ નથી. નીચેથી અપલોડ કરો અથવા URL દાખલ કરો.
                              </div>
                            )}

                            {imageUploadSuccess && (
                              <div className="text-[11px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-700/50 p-2 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>✓ નવી ઈમેજ સફળતાપૂર્વક અપલોડ થઈ અને પેપરમાં સેટ થઈ ગઈ છે!</span>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <label className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs py-2 rounded-xl font-bold cursor-pointer text-center flex items-center justify-center gap-1.5 transition">
                                <Upload className="w-3.5 h-3.5 text-blue-400" />
                                <span>નવી ઈમેજ અપલોડ કરો</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        if (ev.target?.result) {
                                          const dataUrl = ev.target.result as string;
                                          updateStoryField('image', dataUrl);
                                          setImageUploadSuccess(true);
                                          setTimeout(() => setImageUploadSuccess(false), 3000);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            <input
                              type="url"
                              value={currentStoryObj.image || ''}
                              onChange={(e) => updateStoryField('image', e.target.value)}
                              placeholder="અથવા https://... ઈમેજ URL લિંક પેસ્ટ કરો"
                              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:ring-2 focus:ring-red-500/40 focus:border-red-500 outline-none"
                            />

                            {/* Photo Caption Field */}
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold block">
                                ફોટો કૅપ્શન (Photo Caption):
                              </label>
                              <input
                                type="text"
                                value={(currentStoryObj as any).caption || (currentStoryObj as any).imageCaption || ''}
                                onChange={(e) => {
                                  updateStoryField('caption', e.target.value);
                                  updateStoryField('imageCaption' as any, e.target.value);
                                }}
                                placeholder="ફોટો નીચે દર્શાવવા માટે કૅપ્શન લખાણ..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:ring-2 focus:ring-red-500/40 focus:border-red-500 outline-none font-sans"
                              />
                            </div>
                          </div>
                        )}

                        {/* Pull Quote Card Editor */}
                        {'pullQuote' in currentStoryObj && currentStoryObj.pullQuote && (
                          <div className="space-y-2.5 pt-3 border-t border-slate-800">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                              <span>💬 વિશેષ અવતરણ (Quote Box)</span>
                            </label>
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-1">અવતરણ લખાણ (Quote Text):</label>
                              <textarea
                                rows={2}
                                value={currentStoryObj.pullQuote.quote || currentStoryObj.pullQuote.text || ''}
                                onChange={(e) => {
                                  const updatedQuote = {
                                    ...currentStoryObj.pullQuote,
                                    quote: e.target.value,
                                    text: e.target.value,
                                  };
                                  updateStoryField('pullQuote' as any, updatedQuote);
                                }}
                                placeholder="અવતરણ લખાણ..."
                                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 resize-none outline-none focus:border-red-500 font-sans"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-1">લેખક / વ્યક્તિનું નામ (Quote Name):</label>
                              <input
                                type="text"
                                value={currentStoryObj.pullQuote.name || currentStoryObj.pullQuote.author || ''}
                                onChange={(e) => {
                                  const updatedQuote = {
                                    ...currentStoryObj.pullQuote,
                                    name: e.target.value,
                                    author: e.target.value,
                                  };
                                  updateStoryField('pullQuote' as any, updatedQuote);
                                }}
                                placeholder="— વ્યક્તિનું નામ, હોદ્દો"
                                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-red-500 font-sans"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-1">અવતરણ ફોટો URL (Quote Image):</label>
                              <input
                                type="url"
                                value={currentStoryObj.pullQuote.image || currentStoryObj.pullQuote.photo || ''}
                                onChange={(e) => {
                                  const updatedQuote = {
                                    ...currentStoryObj.pullQuote,
                                    image: e.target.value,
                                    photo: e.target.value,
                                  };
                                  updateStoryField('pullQuote' as any, updatedQuote);
                                }}
                                placeholder="https://... ફોટો URL"
                                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-red-500 font-sans"
                              />
                            </div>
                          </div>
                        )}

                        {/* ─── Story Actions & Explicit Save Bar ─── */}
                        <div className="pt-4 border-t border-slate-800 space-y-2.5">
                          {/* Live sync & Save status alert */}
                          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                              <span className="text-[11px] font-bold text-slate-300">
                                અખબારમાં લાઈવ લાગુ થયેલ છે
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                              ✓ Auto-Synced Live
                            </span>
                          </div>

                          {articleSavedMessage && (
                            <div className="bg-emerald-950/80 border border-emerald-700/60 rounded-xl p-2.5 flex items-center gap-2 text-xs font-bold text-emerald-300 animate-in fade-in duration-200">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>{articleSavedMessage}</span>
                            </div>
                          )}

                          {/* Primary Save Article & Navigation Buttons */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={async () => {
                                await handleSaveDraft();
                                setArticleSavedMessage('✓ આર્ટિકલ સેવ થઈ ગયું અને અખબારમાં સંગ્રહિત છે!');
                                setTimeout(() => setArticleSavedMessage(null), 3500);
                              }}
                              className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs py-2.5 px-3 rounded-xl font-black shadow-md shadow-red-950/50 flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer disabled:opacity-50"
                            >
                              {saving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                              <span>આ આર્ટિકલ સેવ કરો (Save Article)</span>
                            </button>

                            {/* Next Story button */}
                            <button
                              type="button"
                              onClick={() => {
                                const storySlots = pageSlotsList.filter((s) => s.path !== 'header');
                                const curIdx = storySlots.findIndex((s) => s.path === storyRootPath || selectedPath.startsWith(s.path));
                                const next = curIdx >= 0 && curIdx < storySlots.length - 1 ? storySlots[curIdx + 1] : storySlots[0];
                                if (next) {
                                  handleSelectSlot(next.path, next.label);
                                }
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1 transition cursor-pointer border border-slate-700/80"
                              title="આગળનો સમાચાર સ્લોટ સંપાદિત કરો"
                            >
                              <span>આગળનો સ્લોટ</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Fallback single field editor for masthead/misc elements */
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <label className="block text-xs text-slate-300 font-bold">
                          {selectedLabel || 'સ્લોટ લખાણ સંપાદિત કરો'}
                        </label>
                        <textarea
                          rows={4}
                          value={getNestedStringValue(currentPageData, selectedPath) || (selectedPath === 'sportsRoundupTitle' ? ((currentPageData as any)?.sportsRoundupTitle || '⚡ રમત-ગમત સંક્ષિપ્ત (SPORTS ROUNDUP)') : '')}
                          onChange={(e) => updateNestedValue(selectedPath, e.target.value)}
                          placeholder="લખાણ લખો..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                        />
                      </div>
                    )}
                  </>
                )}

                {activePage === 3 && (
                  <MarketRatesEditor
                    data={data.page3.marketRates}
                    onChange={(newRates) =>
                      setData((prev) => ({
                        ...prev,
                        page3: {
                          ...prev.page3,
                          marketRates: newRates,
                        },
                      }))
                    }
                  />
                )}

                {activePage === 4 && (
                  <HoroscopeEditor
                    horoscope={data.page4.horoscope}
                    onChange={(newHoro) =>
                      setData((prev) => ({
                        ...prev,
                        page4: {
                          ...prev.page4,
                          horoscope: newHoro,
                        },
                      }))
                    }
                  />
                )}
              </>
            )}

            {/* ─────── TAB 2: PAGE STORIES OUTLINE ─────── */}
            {sidebarTab === 'outline' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-xs font-black text-slate-300">
                    પેજ {activePage} ના તમામ સ્લોટ્સ ({pageSlotsList.length})
                  </span>
                  <span className="text-[10px] text-slate-500">ક્લિક કરીને પસંદ કરો</span>
                </div>

                {pageSlotsList.map((slot, idx) => {
                  const isCurrent = selectedPath.startsWith(slot.path) || storyRootPath === slot.path;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        handleSelectSlot(slot.path, slot.label);
                        setSidebarTab('editor');
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${isCurrent
                          ? 'bg-red-600/15 border-red-500/50 shadow-md ring-1 ring-red-500/20'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {slot.image ? (
                          <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                            <img src={slot.image} alt="slot" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-white truncate">{slot.label}</h4>
                          <p className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">
                            {slot.headline || 'ખાલી સ્લોટ (Empty)'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: LIVE NEWSPAPER CANAVAS ── */}
        <div
          className={`flex-1 bg-slate-950 overflow-auto flex-col items-center justify-start p-2 sm:p-4 md:p-8 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] touch-pan-x touch-pan-y ${mobileViewTab === 'canvas' ? 'flex w-full' : 'hidden lg:flex'
            }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Canvas Wrapper */}
          <div
            className="shrink-0 transition-transform duration-150 origin-top mx-auto my-2"
            style={{
              width: `${1224 * (zoomLevel / 100)}px`,
              height: `${1815 * (zoomLevel / 100)}px`,
              minWidth: `${1224 * (zoomLevel / 100)}px`,
              minHeight: `${1815 * (zoomLevel / 100)}px`,
            }}
          >
            <div
              style={{
                width: '1224px',
                height: '1815px',
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top left',
              }}
            >
              <div ref={pageRef} className="rounded-sm overflow-hidden bg-white shadow-2xl border border-slate-700/60 ring-1 ring-black/40">
                {activePage === 1 && (
                  <Page1Front
                    data={data.page1}
                    onChange={(page1) => setData((prev) => ({ ...prev, page1 }))}
                    selectedPath={selectedPath}
                    onSelectSlot={handleSelectSlot}
                    onImportClick={handleOpenImport}
                    onRefreshWeather={handleRefreshWeather}
                  />
                )}
                {activePage === 2 && (
                  <Page2Gujarat
                    data={data.page2}
                    onChange={(page2) => setData((prev) => ({ ...prev, page2 }))}
                    selectedPath={selectedPath}
                    onSelectSlot={handleSelectSlot}
                    onImportClick={handleOpenImport}
                  />
                )}
                {activePage === 3 && (
                  <Page3Business
                    data={data.page3}
                    onChange={(page3) => setData((prev) => ({ ...prev, page3 }))}
                    selectedPath={selectedPath}
                    onSelectSlot={handleSelectSlot}
                    onImportClick={handleOpenImport}
                  />
                )}
                {activePage === 4 && (
                  <Page4Sports
                    data={data.page4}
                    onChange={(page4) => setData((prev) => ({ ...prev, page4 }))}
                    selectedPath={selectedPath}
                    onSelectSlot={handleSelectSlot}
                    onImportClick={handleOpenImport}
                    onOpenHoroscopeEditor={() => setHoroscopeModalOpen(true)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Floating 'Back to Editor' Button on Mobile Canvas View */}
          {mobileViewTab === 'canvas' && (
            <button
              type="button"
              onClick={() => setMobileViewTab('editor')}
              className="lg:hidden fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs px-4 py-2.5 rounded-full shadow-2xl border border-red-400/40 active:scale-95 transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>એડિટ સ્ટોરી</span>
            </button>
          )}
        </div>
      </div>

      {/* ── ARTICLE IMPORT MODAL ── */}
      <ArticleImportModal
        isOpen={articleImportOpen}
        onClose={() => setArticleImportOpen(false)}
        onSelectArticle={handleImportSelectedArticle}
        targetSlotLabel={importTargetSlot.label}
      />

      {/* ── FULL 4-PAGE PREVIEW MODAL ── */}
      {fullPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-3 sm:p-6 overflow-hidden animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center font-black">
                <Newspaper className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black leading-none">
                  ગુજરાત પોસ્ટ — {cityGu || city} આવૃત્તિ ({date}) • ફૂલ પ્રીવ્યુ
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  અખબાર પબ્લિશ થયા બાદ વાચકોને આ રીતે જોવા મળશે
                </p>
              </div>
            </div>

            {/* Page Selectors in Preview */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {([1, 2, 3, 4] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreviewPage(p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${previewPage === p ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  પૃષ્ઠ {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFullPreviewModalOpen(false)}
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview Canvas */}
          <div className="flex-1 overflow-auto flex justify-center items-start p-6">
            <div
              className="shrink-0 shadow-2xl bg-white rounded-sm overflow-hidden origin-top my-2"
              ref={previewPageRef}
              style={{
                transform: 'scale(0.50)',
                marginBottom: `-${Math.round(1815 * 0.50)}px`,
              }}
            >
              {previewPage === 1 && <Page1Front data={data.page1} onChange={() => { }} />}
              {previewPage === 2 && <Page2Gujarat data={data.page2} onChange={() => { }} />}
              {previewPage === 3 && <Page3Business data={data.page3} onChange={() => { }} />}
              {previewPage === 4 && <Page4Sports data={data.page4} onChange={() => { }} />}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span>પૃષ્ઠ {previewPage} of ૪</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFullPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
              >
                સંપાદન ચાલુ રાખો (Back to Edit)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFullPreviewModalOpen(false);
                  handlePublishClick();
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black shadow-md cursor-pointer"
              >
                અખબાર પબ્લિશ કરો (Publish)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VALIDATION WARNING MODAL ── */}
      {validationWarningModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400 font-black text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>પબ્લિશ કરતા પહેલા ધ્યાન આપો (Validation Notice)</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950 p-3.5 rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
              {validationWarnings.map((warn, idx) => (
                <div key={idx} className="flex items-start gap-2 text-amber-200">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{warn}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              તમે આ ખૂટતી વિગતો ભરી શકો છો અથવા તો અત્યારે જ પબ્લિશ કરી શકો છો.
            </p>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                onClick={() => setValidationWarningModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                સુધારો કરવા પાછા જાઓ
              </button>
              <button
                onClick={executePublish}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                છતાં પણ પબ્લિશ કરો
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PUBLISH SUCCESS & PDF VIEWER MODAL ── */}
      {publishSuccessModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in zoom-in-95 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPublishSuccessModalOpen(false);
              onBackToDashboard();
            }
          }}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl space-y-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with celebration */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-950/50">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>🎉 અખબાર સફળતાપૂર્વક પબ્લિશ થઈ ગયું!</span>
                    <span className="text-[10px] uppercase font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Live Published
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    {cityGu || city} આવૃત્તિ • {date} • ૪ પૃષ્ઠ અખબાર PDF તૈયાર છે
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPublishSuccessModalOpen(false);
                    onBackToDashboard();
                  }}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                  title="બંધ કરો અને ઈ-પેપર લિસ્ટમાં જાઓ (Close & Go to E-Paper List)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Action Bar */}
            <div className="bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                {/* Download PDF button */}
                <button
                  type="button"
                  onClick={() => {
                    const safeCity = (cityGu || city || 'Edition').replace(/[^\w\u0A80-\u0AFF]/g, '_');
                    const safeDate = date.replace(/[^\w-]/g, '_');
                    const filename = `GujaratPost_${safeCity}_${safeDate}.pdf`;
                    if (publishedPdfBlob) {
                      downloadPdfBlob(publishedPdfBlob, filename);
                    } else if (publishedPdfUrl) {
                      window.open(publishedPdfUrl, '_blank');
                    }
                  }}
                  className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl font-black shadow-md shadow-red-950/60 flex items-center gap-2 cursor-pointer transition active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF ડાઉનલોડ કરો (Download PDF)</span>
                </button>

                {/* View PDF in new tab */}
                <button
                  type="button"
                  onClick={() => {
                    if (publishedPdfBlob) {
                      const blobUrl = URL.createObjectURL(publishedPdfBlob);
                      window.open(blobUrl, '_blank');
                    } else if (publishedPdfUrl) {
                      window.open(publishedPdfUrl, '_blank');
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>નવા ટેબમાં PDF ખોલો</span>
                </button>
              </div>

              {/* View on Public E-Paper button */}
              <Link
                href={`/epaper?city=${encodeURIComponent(city)}&date=${encodeURIComponent(date)}`}
                target="_blank"
                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs sm:text-sm px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>લાઈવ ઈ-પેપર પર જુઓ (View Live E-Paper)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Page preview selector */}
            <div className="flex items-center justify-between text-xs pt-1 shrink-0">
              <span className="font-bold text-slate-400">પબ્લિશ થયેલ અખબાર પ્રીવ્યૂ:</span>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                {[1, 2, 3, 4].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPublishPreviewPage(p as 1 | 2 | 3 | 4)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${publishPreviewPage === p ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    પૃષ્ઠ {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Canvas Preview Box */}
            <div className="flex-1 overflow-auto bg-slate-950/70 border border-slate-800/80 rounded-2xl flex justify-center items-start p-4 min-h-[350px]">
              <div
                className="shrink-0 shadow-2xl bg-white rounded-sm overflow-hidden origin-top my-1"
                style={{
                  transform: 'scale(0.40)',
                  marginBottom: `-${Math.round(1815 * 0.60)}px`,
                }}
              >
                {publishPreviewPage === 1 && <Page1Front data={data.page1} onChange={() => { }} />}
                {publishPreviewPage === 2 && <Page2Gujarat data={data.page2} onChange={() => { }} />}
                {publishPreviewPage === 3 && <Page3Business data={data.page3} onChange={() => { }} />}
                {publishPreviewPage === 4 && <Page4Sports data={data.page4} onChange={() => { }} />}
              </div>
            </div>

            {/* Footer button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setPublishSuccessModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                ← બિલ્ડરમાં રહો (Stay in Builder)
              </button>

              <button
                type="button"
                onClick={() => {
                  setPublishSuccessModalOpen(false);
                  onBackToDashboard();
                }}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-red-950/50 flex items-center gap-2"
              >
                <span>ઈ-પેપર લિસ્ટ પર જાઓ (Go to E-Paper List)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Off-screen staging container at full 1224x1815 broadsheet scale for sequential high-res capture */}
      {captureStagePage !== null && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '1224px',
            height: '1815px',
            zIndex: 40,
            pointerEvents: 'none',
            opacity: 1,
            visibility: 'visible',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
          }}
        >
          <div ref={captureContainerRef} style={{ width: '1224px', height: '1815px', backgroundColor: '#ffffff' }}>
            {captureStagePage === 1 && <Page1Front data={data.page1} onChange={() => { }} />}
            {captureStagePage === 2 && <Page2Gujarat data={data.page2} onChange={() => { }} />}
            {captureStagePage === 3 && <Page3Business data={data.page3} onChange={() => { }} />}
            {captureStagePage === 4 && <Page4Sports data={data.page4} onChange={() => { }} />}
          </div>
        </div>
      )}

      {/* Publishing Progress Overlay */}
      {publishing && (
        <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-red-600/20 border border-red-500/40 flex items-center justify-center animate-pulse shadow-2xl">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white">અખબાર પબ્લિશ થઈ રહ્યું છે...</h3>
            <p className="text-sm font-bold text-red-400">
              {captureProgressText || 'તમામ પૃષ્ઠોનું હાઇ-રિઝોલ્યુશન કેપ્ચર અને PDF જનરેશન ચાલુ છે...'}
            </p>
          </div>
          <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-600 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      )}
    </div>
  );
};
