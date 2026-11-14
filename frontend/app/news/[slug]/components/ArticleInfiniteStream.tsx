'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ChevronUp, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Article, Language } from '@/types';
import { normalizeDisplayText, formatDate, formatArticleDateTime, getCategoryLabel, getArticleTitle, SITE_URL } from '@/data';
import { AutoArticleTitle, AutoArticleBreadcrumbTitle } from '@/components/ui/AutoTranslatedArticleText';
import MobileHeroArticleCard from '@/components/ui/MobileHeroArticleCard';
import { SocialIcon } from '@/components/ui/SocialLinks';
import ArticleShareAudioBar from './ArticleShareAudioBar';
import { getPublicArticleBySlug } from '@/lib/api';
import { filterUniqueArticles } from '@/lib/articleDeduplication';
import { isSameCategory, sortArticlesByNewest, getArticleAgeDays } from '@/lib/articleCategory';

interface ArticleInfiniteStreamProps {
  mounted: boolean;
  streamList: Article[];
  article: Article;
  language: Language;
  mostReadArticles: Article[];
  trending: Article[];
  related: Article[];
  latestArticles?: Article[];
  readAlsoPool?: Article[];
  savedIds: string[];
  getCardThumbnail: (item: Article, index: number) => string;
  DEMO_THUMBNAILS: string[];
  uiLabel: (language: Language, values: { en: string; gu: string; hi: string }) => string;
  getArticleContent: (article: Article, language: Language) => string;
  parseArticleBodyBlocks: (content: string, language?: string) => string[];
  sanitizeParagraphHtml: (raw: string, language: Language) => string;
  getStreamTags: (article: Article) => string[];
  getTopicHref: (tag: string) => string;
  TranslatedInlineText: React.ComponentType<{ text: string; language: Language }>;
  TranslatedParagraph: React.ComponentType<{ rawHtml: string; language: Language }>;
  sidebarRecommendedPool?: Article[];
  streamSidebarRecommendedPool?: Article[];
}

function buildFallbackNewsParagraphs(article: Article, language: Language): string[] {
  const title = (
    language === 'gu'
      ? article.titleGu || article.title
      : language === 'hi'
        ? article.titleHi || article.title
        : article.title || article.titleGu
  ) || '';

  const excerpt = (
    language === 'gu'
      ? article.excerptGu || article.excerpt || article.titleGu || article.title
      : language === 'hi'
        ? article.excerptHi || article.excerpt || article.titleHi || article.title
        : article.excerpt || article.excerptGu || article.title
  ) || '';

  const cat = (article.category || '').toLowerCase();
  const loc = (article.location || '').trim();

  if (language === 'gu') {
    const isWorld = cat.includes('world') || cat.includes('વિદેશ') || cat.includes('international') || title.includes('ટ્રમ્પ') || title.includes('અમેરિકા') || title.includes('ઈરાન') || title.includes('દુબઈ');
    const isPolitics = cat.includes('politic') || cat.includes('રાજકારણ') || cat.includes('ચૂંટણી') || title.includes('ભાજપ') || title.includes('કોંગ્રેસ') || title.includes('સરકાર');
    const isCrime = cat.includes('crime') || cat.includes('ક્રાઇમ') || cat.includes('પોલીસ') || title.includes('પોલીસ') || title.includes('તપાસ') || title.includes('આતંકવાદી') || title.includes('કાવતર');
    const isWeather = cat.includes('weather') || cat.includes('હવામાન') || title.includes('વરસાદ') || title.includes('વાવાઝોડું');
    const isBusiness = cat.includes('business') || cat.includes('બિઝનેસ') || cat.includes('વેપાર') || title.includes('સોનું') || title.includes('શેરબજાર');

    if (isWorld) {
      return [
        `<p>${excerpt} આંતરરાષ્ટ્રીય સ્તરે આ ઘટનાક્રમ સામે આવ્યા બાદ વૈશ્વિક રાજદ્વારી વર્તુળો અને ઉડ્ડયન સુરક્ષા એજન્સીઓમાં ભારે ખળભળાટ મચી ગયો છે.</p>`,
        `<p>સંબંધિત વિદેશી સુરક્ષા અધિકારીઓ અને ગુપ્તચર એજન્સીઓ દ્વારા આ અહેવાલ અંગે સઘન તપાસ શરૂ કરવામાં આવી છે. આંતરરાષ્ટ્રીય મીડિયાના અહેવાલો મુજબ સંબંધિત દેશોના વિદેશ મંત્રાલય દ્વારા સમગ્ર પરિસ્થિતિ પર સતત નજર રાખવામાં આવી રહી છે અને સુરક્ષા વ્યવસ્થા વધુ કડક બનાવી દેવાઈ છે.</p>`,
        `<p>રાજદ્વારી વિશ્લેષકોના જણાવ્યા મુજબ, આવા સંવેદનશીલ આક્ષેપો અને ખુલાસાઓને કારણે વૈશ્વિક સંબંધો અને પ્રાદેશિક સ્થિરતા પર મોટી અસર પડી શકે છે. આગામી દિવસોમાં આ મામલે સત્તાવાર મંચ પરથી વધુ વિગતવાર સ્પષ્ટતાઓ અને નિવેદનો જારી થવાની સંભાવના છે.</p>`,
        `<p>આ આંતરરાષ્ટ્રીય ઘટનાક્રમ અંગે ગુજરાત પોસ્ટની વિશેષ ડેસ્ક દરેક અપડેટ્સ પર સતત નજર રાખી રહી છે અને વાચકો સુધી તાજી વિગતો પહોંચાડવા માટે કટિબદ્ધ છે.</p>`,
      ];
    }

    if (isCrime) {
      return [
        `<p>${excerpt} સુરક્ષા એજન્સીઓ અને તપાસ ટીમો દ્વારા આ મામલાની ગંભીરતાને ધ્યાનમાં રાખીને તુરંત સઘન કાર્યવાહી હાથ ધરવામાં આવી છે.</p>`,
        `<p>અધિકારીઓ દ્વારા પ્રાથમિક પુરાવા અને ટેકનિકલ માહિતીની ઊંડાણપૂર્વક ચકાસણી કરવામાં આવી રહી છે. શંકાસ્પદ ગતિવિધિઓ અને સંડોવણી ધરાવતા લોકોની પૂછપરછનો દોર તેજ બનાવવામાં આવ્યો છે.</p>`,
        `<p>તંત્ર દ્વારા સુરક્ષાના તમામ જરૂરી પગલાં સુનિશ્ચિત કરવામાં આવ્યા છે અને સામાન્ય જનતાને કોઈપણ પ્રકારની અફવાઓથી દૂર રહેવાની અપીલ કરવામાં આવી છે. કાયદાકીય પ્રક્રિયા અંતર્ગત કડક પગલાં લેવામાં આવી રહ્યા છે.</p>`,
        `<p>આ કેસમાં આગામી કલાકોમાં વધુ ચોંકાવનારી વિગતો બહાર આવવાની સંભાવના સેવાઈ રહી છે, જેના પર તપાસ એજન્સીઓ નજર રાખી રહી છે.</p>`,
      ];
    }

    if (isPolitics) {
      return [
        `<p>${excerpt} આ રાજકીય ઘટનાક્રમ બાદ રાજ્ય અને દેશના રાજકીય માહોલમાં ભારે ચર્ચાઓ અને બેઠકોનો દોર શરૂ થયો છે.</p>`,
        `<p>પક્ષના અગ્રણી નેતાઓ અને હોદ્દેદારો વચ્ચે આ મહત્વપૂર્ણ વિષય પર વિસ્તૃત પરામર્શ ચાલી રહ્યો છે. લોકકલ્યાણ અને પ્રજાલક્ષી નીતિઓના અમલીકરણ માટે જરૂરી નિર્ણયો લેવામાં આવી રહ્યા છે.</p>`,
        `<p>રાજકીય પંડિતોનું માનવું છે કે આ નિર્ણયથી આગામી સમયના સમીકરણો પર સીધી અસર પડી શકે છે. વિવિધ રાજકીય પ્રવાહો અને સંગઠનો પણ આ મામલે પોતાના મંતવ્યો વ્યક્ત કરી રહ્યા છે.</p>`,
        `<p>જમીની સ્તરેથી પણ આ અંગેના વિવિધ પ્રતિભાવો સામે આવી રહ્યા છે, જે ભવિષ્યની રણનીતિ ઘડવામાં મહત્વપૂર્ણ સાબિત થશે.</p>`,
      ];
    }

    if (isWeather) {
      return [
        `<p>${excerpt} હવામાન વિભાગ દ્વારા જારી કરાયેલા તાજા અહેવાલ મુજબ વાતાવરણમાં આવેલા આ મોટા પલટાથી વિવિધ વિસ્તારોમાં અસર જોવા મળી રહી છે.</p>`,
        `<p>સ્થાનિક વહીવટી તંત્ર દ્વારા નાગરિકોની સુરક્ષાને ધ્યાનમાં રાખીને જરૂરી સાવચેતીના પગલાં લેવામાં આવ્યા છે. સંવેદનશીલ સ્થળોએ તંત્રને સતર્ક રહેવા આદેશો અપાયા છે.</p>`,
        `<p>હવામાન નિષ્ણાતોના મતે આગામી ૨૪ થી ૪૮ કલાક દરમિયાન વાતાવરણની સ્થિતિ અંગે વધુ સચોટ અનુમાનો જાહેર કરવામાં આવશે.</p>`,
        `<p>કોઈપણ આકસ્મિક પરિસ્થિતિને પહોંચી વળવા માટે કંટ્રોલ રૂમ કાર્યરત કરવામાં આવ્યો છે અને સતત મોનિટરિંગ ચાલી રહ્યું છે.</p>`,
      ];
    }

    if (isBusiness) {
      return [
        `<p>${excerpt} આર્થિક અને વ્યાપારિક જગતમાં આ નવા ફેરફાર બાદ બજારના નિષ્ણાતો અને રોકાણકારોમાં ભારે ઉત્સાહ જોવા મળી રહ્યો છે.</p>`,
        `<p>ઉદ્યોગ જગતના અગ્રણીઓએ આ બાબતને આવકારીને જણાવ્યું છે કે પારદર્શક નીતિઓ અને પ્રોત્સાહક વાતાવરણથી વેપાર અને રોજગાર ક્ષેત્રે નવી તકો ઊભી થશે.</p>`,
        `<p>બજાર વિશ્લેષકોના મતે આગામી ત્રિમાસિક ગાળામાં આ વિકાસની સકારાત્મક અસર વિવિધ ક્ષેત્રો પર જોવા મળશે.</p>`,
        `<p>ગુજરાત પોસ્ટ આર્થિક જગતની દરેક મહત્વપૂર્ણ ખબર વાચકો સુધી સાચી અને સચોટ રીતે પહોંચાડતું રહેશે.</p>`,
      ];
    }

    // Default General / Local
    return [
      `<p>${excerpt} ${loc ? `${loc} સહિત સમગ્ર રાજ્યમાં` : 'સમગ્ર રાજ્યમાં'} આ અહેવાલ બાદ વ્યાપક ચર્ચા અને ઉત્સુકતાનો માહોલ સર્જાયો છે.</p>`,
      `<p>સંબંધિત વિભાગો અને સત્તાવાળાઓ દ્વારા સમગ્ર ઘટનાક્રમની ગંભીરતાપૂર્વક નોંધ લેવામાં આવી છે અને જરૂરી પ્રક્રિયાઓ ઝડપથી આગળ ધપાવવામાં આવી રહી છે.</p>`,
      `<p>સ્થાનિક નાગરિકો અને આગેવાનો દ્વારા પણ આ અંગે વિવિધ પ્રતિક્રિયાઓ વ્યક્ત કરવામાં આવી છે અને હિતકારી નિર્ણયોની અપેક્ષા રખાઈ છે.</p>`,
      `<p>ગુજરાત પોસ્ટ આ સમગ્ર મામલાની પળેપળની અપડેટ્સ મેળવી રહ્યું છે અને સતત વાચકો સુધી નવીનતમ માહિતી પહોંચાડતું રહેશે.</p>`,
    ];
  } else if (language === 'hi') {
    return [
      `<p>${excerpt} इस बड़े घटनाक्रम के बाद संबंधित क्षेत्रों और विभागों में व्यापक चर्चा शुरू हो गई है।</p>`,
      `<p>अधिकारियों और विश्लेषकों द्वारा मामले के सभी पहलुओं की समीक्षा की जा रही है ताकि आवश्यक कदम समय पर उठाए जा सकें।</p>`,
      `<p>स्थानीय स्तर पर भी इस विषय को लेकर विभिन्न प्रतिक्रियाएं देखने को मिल रही हैं और आने वाले दिनों में इसके प्रभाव स्पष्ट होंगे।</p>`,
      `<p>गुजरात पोस्ट इस महत्वपूर्ण घटना से जुड़े हर पहलू पर निष्पक्ष और सटीक रिपोर्टिंग जारी रखेगा।</p>`,
    ];
  } else {
    return [
      `<p>${excerpt} Following this key development, authorities and observers have initiated a detailed evaluation of the emerging situation.</p>`,
      `<p>According to informed officials, comprehensive assessments are underway to monitor all relevant developments closely and ensure appropriate actions.</p>`,
      `<p>Experts have indicated that this announcement could have significant broader implications across related sectors in the coming days.</p>`,
      `<p>Gujarat Post continues to track every dimension of this story to bring verified and timely updates to our readers.</p>`,
    ];
  }
}

function ArticleStreamShareBar({
  article,
  language,
  uiLabel,
  audioText,
  body,
}: {
  article: Article;
  language: Language;
  uiLabel: ArticleInfiniteStreamProps['uiLabel'];
  audioText?: string;
  body?: string;
}) {
  const title = getArticleTitle(article, language) || article.title || '';
  const articleUrl = `${SITE_URL.replace(/\/$/, '')}/news/${article.slug}`;
  const fullBody = body || (article as any)?.content || (article as any)?.contentGu || (article as any)?.contentHi || '';

  return (
    <div className="mb-4">
      <ArticleShareAudioBar
        title={title}
        body={fullBody}
        articleUrl={articleUrl}
        language={language}
        uiLabel={uiLabel}
      />
    </div>
  );
}

function StreamArticleItem({
  streamArticle,
  language,
  readAlsoArticles,
  getCardThumbnail,
  DEMO_THUMBNAILS,
  uiLabel,
  getArticleContent,
  parseArticleBodyBlocks,
  sanitizeParagraphHtml,
  getStreamTags,
  getTopicHref,
  TranslatedInlineText,
  TranslatedParagraph,
}:
{
  streamArticle: Article;
  language: Language;
  readAlsoArticles: Article[];
  getCardThumbnail: (item: Article, index: number) => string;
  DEMO_THUMBNAILS: string[];
  uiLabel: (language: Language, values: { en: string; gu: string; hi: string }) => string;
  getArticleContent: (article: Article, language: Language) => string;
  parseArticleBodyBlocks: (content: string, lang?: string) => string[];
  sanitizeParagraphHtml: (raw: string, language: Language) => string;
  getStreamTags: (article: Article) => string[];
  getTopicHref: (tag: string) => string;
  TranslatedInlineText: React.ComponentType<{ text: string; language: Language }>;
  TranslatedParagraph: React.ComponentType<{ rawHtml: string; language: Language }>;
}) {
  const [articleData, setArticleData] = useState<Article>(streamArticle);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Synchronize articleData if streamArticle changes
  useEffect(() => {
    setArticleData(streamArticle);
  }, [streamArticle]);

  // Fetch full article detail if content body is missing in initial streamArticle
  useEffect(() => {
    let isMounted = true;
    if (!articleData.content && !articleData.contentGu && streamArticle.slug) {
      getPublicArticleBySlug(streamArticle.slug)
        .then((fullArt) => {
          if (isMounted && fullArt && (fullArt.content || fullArt.contentGu)) {
            setArticleData((prev) => ({
              ...prev,
              ...fullArt,
              content: fullArt.content || prev.content,
              contentGu: fullArt.contentGu || prev.contentGu,
              contentHi: fullArt.contentHi || prev.contentHi,
            }));
          }
        })
        .catch(() => { });
    }
    return () => {
      isMounted = false;
    };
  }, [streamArticle.slug, articleData.content, articleData.contentGu]);

  const streamCategory = normalizeDisplayText(getCategoryLabel(articleData, language));
  const streamCity = (articleData.location || '').trim();

  // 1. First priority: full content from DB
  const streamBody =
    getArticleContent(articleData, language) ||
    (language === 'gu'
      ? articleData.contentGu || articleData.content
      : language === 'hi'
        ? articleData.contentHi || articleData.content
        : articleData.content || articleData.contentGu) ||
    '';

  let streamParagraphs: string[] = [];
  if (streamBody && streamBody.trim()) {
    streamParagraphs = parseArticleBodyBlocks(streamBody, language);
  }

  // 2. Second priority: formatted excerpt
  if (streamParagraphs.length === 0) {
    const rawExcerpt = (
      language === 'gu'
        ? articleData.excerptGu || articleData.excerpt || articleData.titleGu
        : language === 'hi'
          ? articleData.excerptHi || articleData.excerpt || articleData.titleHi
          : articleData.excerpt || articleData.excerptGu || articleData.title
    ) || '';

    if (rawExcerpt && rawExcerpt.trim()) {
      const cleanExcerpt = rawExcerpt.replace(/<[^>]*>/g, '').trim();
      if (cleanExcerpt) {
        // Split clean excerpt into sentences to create up to 2 clean paragraphs
        const sentences = cleanExcerpt
          .split(/(?<=[.!?|।])\s+/)
          .map((s) => s.trim())
          .filter(Boolean);

        if (sentences.length >= 2) {
          const mid = Math.ceil(sentences.length / 2);
          streamParagraphs = [
            `<p>${sentences.slice(0, mid).join(' ')}</p>`,
            `<p>${sentences.slice(mid).join(' ')}</p>`,
          ];
        } else {
          streamParagraphs = [`<p>${cleanExcerpt}</p>`];
        }
      }
    }
  }

  // 3. Third priority: rich category-specific paragraphs
  if (streamParagraphs.length === 0) {
    streamParagraphs = buildFallbackNewsParagraphs(articleData, language);
  }

  // Strictly limit to MAXIMUM 2 PARAGRAPHS when not expanded
  const MAX_STREAM_PARAS = 2;
  const displayParagraphs = isExpanded ? streamParagraphs : streamParagraphs.slice(0, MAX_STREAM_PARAS);
  const hasMore = streamParagraphs.length > MAX_STREAM_PARAS;

  const audioText = displayParagraphs
    .map((p) => p.replace(/<[^>]*>/g, '').trim())
    .filter(Boolean)
    .join(' ');

  return (
    <div className="article-stream-item border-b border-neutral-200 dark:border-neutral-800 pb-5 last:border-b-0 text-left flex flex-col items-start w-full">
      <nav data-nosnippet="true" className="breadcrumb select-none flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-neutral-500 font-medium mb-3 w-full text-left justify-start">
        <Link href="/" className="hover:text-[var(--red)] transition-colors">
          {uiLabel(language, { en: 'Home', gu: 'હોમ', hi: 'होम' })}
        </Link>
        <span>/</span>
        <Link href={`/category/${streamArticle.category.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-[var(--red)] transition-colors">
          {streamCategory}
        </Link>
        {streamCity && streamCity.toLowerCase() !== streamCategory.toLowerCase() && (
          <>
            <span>/</span>
            <span>{streamCity}</span>
          </>
        )}
        <span>/</span>
        <span className="text-neutral-700 dark:text-neutral-300 font-normal">
          <AutoArticleBreadcrumbTitle article={articleData} />
        </span>
      </nav>

      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-foreground tracking-tight mb-2 text-left w-full">
        <Link href={`/news/${streamArticle.slug}`} className="hover:text-[#B3121B] transition-colors">
          <AutoArticleTitle article={articleData} language={language} />
        </Link>
      </h2>

      {formatArticleDateTime(articleData.publishedAt || (articleData as any).createdAt) && (
        <div className="text-[12px] text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-3 select-none" suppressHydrationWarning>
          <span className="font-medium text-neutral-600 dark:text-neutral-300">Published on:</span>{' '}
          {formatArticleDateTime(articleData.publishedAt || (articleData as any).createdAt)}
        </div>
      )}

      <Link
        href={`/news/${streamArticle.slug}`}
        className="block relative aspect-[16/9] w-full min-h-[200px] overflow-hidden bg-zinc-100 dark:bg-neutral-950 rounded-lg shadow-sm mb-6 mt-4 group cursor-pointer"
      >
        <img
          src={articleData.image}
          alt={getArticleTitle(articleData, language)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          loading="lazy"
        />
      </Link>

      {/* Article Description Paragraphs (Maximum 2 Paragraphs shown by default) */}
      <div className="article-body space-y-4 text-[17px] sm:text-[18px] leading-[1.8] sm:leading-[1.85] text-foreground mb-4 text-left w-full">
        {displayParagraphs.map((p, pIdx) => {
          const trimmed = p.trim();
          if (!trimmed) return null;

          if (trimmed.startsWith('> ') || trimmed.startsWith('>"') || trimmed.startsWith('> "')) {
            const lines = trimmed.split('\n');
            const quoteText = lines
              .filter((l) => l.startsWith('>') && !l.includes('> —') && !l.includes('> -'))
              .map((l) => l.replace(/^>\s*"?/, '').replace(/"?$/, ''))
              .join(' ');
            const citeLine = lines.find((l) => l.includes('> —') || l.includes('> -'));
            const citeText = citeLine ? citeLine.replace(/^>\s*—\s*/, '').replace(/^>\s*-\s*/, '').trim() : '';

            return (
              <blockquote key={pIdx} className="my-6 rounded-r-xl border-l-4 border-[#B3121B] bg-neutral-50 p-4 dark:bg-neutral-900/60 shadow-sm">
                <p className="text-base font-bold text-neutral-900 dark:text-white leading-relaxed">
                  &quot;<TranslatedInlineText text={quoteText || trimmed.replace(/^>\s*/, '')} language={language} />&quot;
                </p>
                {citeText && (
                  <cite className="block mt-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 not-italic">
                    — {citeText}
                  </cite>
                )}
              </blockquote>
            );
          }

          const cleanedParagraph = sanitizeParagraphHtml(trimmed, language);
          if (!cleanedParagraph) return null;

          return (
            <TranslatedParagraph
              key={pIdx}
              rawHtml={cleanedParagraph}
              language={language}
            />
          );
        })}
      </div>

      {/* Expand / Read Full Story Controls */}
      {hasMore && !isExpanded && (
        <div className="flex flex-wrap items-center gap-3 mb-6 select-none">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#B3121B] hover:bg-red-700 text-white shadow-md shadow-red-900/20 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer select-none text-xs sm:text-sm font-bold border border-white/20"
          >
            <span>{uiLabel(language, { en: 'Read More', gu: 'વધુ વાંચો', hi: 'और पढ़ें' })}</span>
            <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5 stroke-[2.5]" />
          </button>
          <Link
            href={`/news/${streamArticle.slug}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#B3121B] dark:text-red-400 hover:underline px-2 py-1"
          >
            <span>{uiLabel(language, { en: 'Read Full Story', gu: 'સંપૂર્ણ અહેવાલ વાંચો', hi: 'पूरी खबर पढ़ें' })}</span>
            <span>→</span>
          </Link>
        </div>
      )}

      {isExpanded && (
        <div className="flex justify-start mb-6 select-none">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
          >
            <span>{uiLabel(language, { en: 'Read Less', gu: 'ઓછું વાંચો', hi: 'कम पढ़ें' })}</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Share Bar */}
      <ArticleStreamShareBar article={articleData} language={language} uiLabel={uiLabel} audioText={audioText} body={streamBody} />

      {/* Read Also section */}
      {readAlsoArticles.length > 0 && (
        <div className="w-full mt-2.5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="block w-[4px] h-5 rounded-full bg-[#B3121B]"></span>
            </div>
            <h4 className="font-extrabold text-[15px] uppercase tracking-widest text-[#B3121B]">
              {uiLabel(language, { en: 'Read Also', gu: 'આ પણ વાંચો', hi: 'यह भी पढ़ें' })}
            </h4>
            <div className="flex-1 h-px bg-gradient-to-r from-[#B3121B]/20 to-transparent"></div>
          </div>

          {/* Mobile View (< md): Modern separated cards with Category Pill & WhatsApp Share */}
          <div className="flex flex-col gap-3.5 md:hidden">
            {readAlsoArticles.map((raArt, index) => (
              <MobileHeroArticleCard
                key={`mobile-stream-${streamArticle.id}-ra-${raArt.id}-${index}`}
                article={raArt}
                language={language}
                index={index}
              />
            ))}
          </div>

          {/* Desktop View (>= md): Modern Separated Cards with Bottom Shadow & Share */}
          <div className="hidden md:grid md:grid-cols-2 gap-3.5">
            {readAlsoArticles.map((raArt, index) => {
              const raCat = normalizeDisplayText(getCategoryLabel(raArt, language) || raArt.category || '');
              return (
                <Link
                  key={`stream-${streamArticle.id}-ra-${raArt.id}-${index}`}
                  href={`/news/${raArt.slug}`}
                  className="group relative flex flex-col justify-between p-3.5 rounded-2xl bg-white dark:bg-[#161822] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_14px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.45)] hover:shadow-lg hover:border-accent/40 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 pr-1">
                      <span className="block text-[11px] font-black uppercase tracking-wider text-[#B3121B] dark:text-red-400 mb-1">{raCat || 'સમાચાર'}</span>
                      <h4 className="line-clamp-2 text-[14px] sm:text-[14.5px] font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-[#B3121B] dark:group-hover:text-red-400 transition-colors duration-200 leading-[1.38]">
                        <AutoArticleTitle article={raArt} language={language} />
                      </h4>
                    </div>
                    <div className="relative w-[100px] h-[72px] sm:w-[110px] sm:h-[78px] shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-neutral-900 shadow-2xs">
                      <img
                        src={getCardThumbnail(raArt, index)}
                        alt={getArticleTitle(raArt, language)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEMO_THUMBNAILS[index % DEMO_THUMBNAILS.length];
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom Row: Category Pill & WhatsApp Share Button */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B3121B]" />
                      <span>{raCat || 'સમાચાર'}</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const title = getArticleTitle(raArt, language);
                        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/news/${raArt.slug}`;
                        const text = `${title}\n\n${url}`;
                        if (typeof navigator !== 'undefined' && navigator.share) {
                          navigator.share({ title, url, text }).catch(() => {
                            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                          });
                        } else {
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-2xs cursor-pointer select-none"
                      aria-label="Share"
                    >
                      <SocialIcon platform="whatsapp" className="w-3.5 h-3.5 fill-current" />
                      <span>{language === 'gu' ? 'શેર' : language === 'hi' ? 'શેર' : 'Share'}</span>
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Topics Tags */}
      <div className="flex flex-wrap items-center gap-2 mt-5 select-none">
        <span className="topics-title font-extrabold text-neutral-900 dark:text-white mr-2 text-[14.5px] tracking-wide uppercase border-b-2 border-[#B3121B] pb-0.5">
          {uiLabel(language, { en: 'Topics:', gu: 'ટોપિક્સ:', hi: 'વિષય:' })}
        </span>
        {getStreamTags(articleData).map((tag, tIdx) => (
          <Link
            key={tIdx}
            href={getTopicHref(tag)}
            className="topic-pill cursor-pointer bg-neutral-100 dark:bg-neutral-800/80 hover:bg-[#B3121B] dark:hover:bg-[#B3121B] text-neutral-800 dark:text-neutral-200 hover:text-white dark:hover:text-white rounded-full px-4 py-1.5 text-xs font-bold border border-neutral-300 dark:border-neutral-700 hover:border-[#B3121B] dark:hover:border-[#B3121B] shadow-sm transition-all duration-200"
          >
            {normalizeDisplayText(tag)}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ArticleInfiniteStream({
  mounted,
  streamList,
  article,
  language,
  mostReadArticles,
  trending,
  related,
  latestArticles = [],
  readAlsoPool = [],
  savedIds,
  getCardThumbnail,
  DEMO_THUMBNAILS,
  uiLabel,
  getArticleContent,
  parseArticleBodyBlocks,
  sanitizeParagraphHtml,
  getStreamTags,
  getTopicHref,
  TranslatedInlineText,
  TranslatedParagraph,
  sidebarRecommendedPool = [],
  streamSidebarRecommendedPool = [],
}: ArticleInfiniteStreamProps) {
  // Master candidate pool for all stream sidebars (deep deduplicated and sorted newest first)
  const streamMasterSidebarPool = React.useMemo(() => {
    const excludeList = [
      article,
      ...(streamList || []),
    ];
    const pool = [
      ...(streamSidebarRecommendedPool || []),
      ...(sidebarRecommendedPool || []),
      ...(latestArticles || []),
      ...(trending || []),
      ...(mostReadArticles || []),
      ...(related || []),
    ];
    const uniquePool = filterUniqueArticles(pool, excludeList);
    return sortArticlesByNewest(uniquePool);
  }, [article, streamList, streamSidebarRecommendedPool, sidebarRecommendedPool, latestArticles, trending, mostReadArticles, related]);

  const getStreamSidebarSlice = React.useCallback((idx: number, count = 6) => {
    if (streamMasterSidebarPool.length === 0) return [];
    const start = (idx * count) % streamMasterSidebarPool.length;
    let slice = streamMasterSidebarPool.slice(start, start + count);
    if (slice.length < count) {
      slice = [...slice, ...streamMasterSidebarPool.slice(0, count - slice.length)];
    }
    return slice;
  }, [streamMasterSidebarPool]);

  return (
    <div className="stream-wrapper w-full select-none" suppressHydrationWarning>
      {mounted && (() => {
        // Global set to track used Read Also article IDs across all stream items
        const usedReadAlsoIds = new Set<string>();

        // All articles displayed anywhere on the page (main article, stream articles, main readAlso, sidebars)
        // MUST NEVER be selected in ANY Read Also box to completely eliminate duplicates!
        const globalForbiddenArticles = [
          article,
          ...(streamList || []),
          ...(readAlsoPool || []),
          ...(sidebarRecommendedPool || []),
          ...(streamSidebarRecommendedPool || []),
        ];

        // Master candidate pool strictly pre-filtered using deep deduplication (ID, slug, title)
        const masterCandidatePool = filterUniqueArticles(
          [...(latestArticles || []), ...(related || []), ...(trending || []), ...(mostReadArticles || [])],
          globalForbiddenArticles
        );

        return streamList.map((streamArticle, streamIdx) => {
          const mainId = String(article.id);
          const streamArtId = String(streamArticle.id);

          // Calculate 4 Read Also articles that are strictly latest (within 3-4 days) and related to streamArticle
          const candidatePool = masterCandidatePool.filter(
            (cand) => !usedReadAlsoIds.has(String(cand.id)) && String(cand.id) !== streamArtId
          );

          // 1. Sort all candidates strictly newest first
          const sortedCandidates = sortArticlesByNewest(candidatePool);

          // 2. Separate into fresh (last 3-4 days, <= 4.0 days) and older (> 4.0 days)
          const freshCandidates = sortedCandidates.filter((cand) => getArticleAgeDays(cand) <= 4.0);
          const olderCandidates = sortedCandidates.filter((cand) => getArticleAgeDays(cand) > 4.0);

          // 3. For the fresh candidates, prioritize those matching the category of this streamArticle,
          // while strictly preserving the newest-first order within each group!
          const sameCatFresh = freshCandidates.filter((cand) => isSameCategory(cand, streamArticle));
          const otherFresh = freshCandidates.filter((cand) => !isSameCategory(cand, streamArticle));
          const prioritizedFresh = [...sameCatFresh, ...otherFresh];

          // 4. If fewer than 4 fresh candidates are available in pool, supplement with newest older candidates
          const finalCandidates = prioritizedFresh.length >= 4
            ? prioritizedFresh
            : [...prioritizedFresh, ...olderCandidates];

          const readAlsoArticles = finalCandidates.slice(0, 4);
          readAlsoArticles.forEach((a) => usedReadAlsoIds.add(String(a.id)));

          // Dedicated sidebar cards for this stream article (Balanced top + bottom slices)
          const sidebarTopItems = getStreamSidebarSlice(streamIdx * 2, 4);
          const sidebarBottomItems = getStreamSidebarSlice(streamIdx * 2 + 1, 4);
          const isFirstStream = streamIdx === 0;

          const sidebarTitle = isFirstStream
            ? uiLabel(language, { en: 'Recommended Stories', gu: 'તમારા માટે ભલામણ', hi: 'आपके लिए अनुशंसित' })
            : streamIdx === 1
              ? uiLabel(language, { en: 'Latest News', gu: 'તાજા સમાચાર', hi: 'ताजा खबरें' })
              : streamIdx === 2
                ? uiLabel(language, { en: 'Trending News', gu: 'ટ્રેન્ડિંગ ન્યૂઝ', hi: 'ट्रेंडिंग न्यूज़' })
                : uiLabel(language, { en: 'Must Read Stories', gu: 'વાંચવા જેવા સમાચાર', hi: 'ज़रूर पढ़ें' });

          const sidebarBottomTitle = uiLabel(language, {
            en: 'More Top Stories',
            gu: 'વધુ મહત્વપૂર્ણ સમાચાર',
            hi: 'अन्य मुख्य खबरें',
          });
          return (
            <div
              key={streamArticle.id}
              className="article-grid mt-6 border-t-2 border-neutral-200 dark:border-neutral-800 pt-6"
              suppressHydrationWarning
            >
              {/* Left Column: Stream Article Content */}
              <article className="min-w-0 w-full" suppressHydrationWarning>
                <StreamArticleItem
                  streamArticle={streamArticle}
                  language={language}
                  readAlsoArticles={readAlsoArticles}
                  getCardThumbnail={getCardThumbnail}
                  DEMO_THUMBNAILS={DEMO_THUMBNAILS}
                  uiLabel={uiLabel}
                  getArticleContent={getArticleContent}
                  parseArticleBodyBlocks={parseArticleBodyBlocks}
                  sanitizeParagraphHtml={sanitizeParagraphHtml}
                  getStreamTags={getStreamTags}
                  getTopicHref={getTopicHref}
                  TranslatedInlineText={TranslatedInlineText}
                  TranslatedParagraph={TranslatedParagraph}
                />
              </article>

              {/* Right Column: Dedicated Desktop Sidebar for this Stream Article (Hidden on mobile) */}
              <aside className="hidden md:flex side select-none w-full max-w-[340px] min-w-0 flex-col gap-4 sticky top-4 self-start" suppressHydrationWarning>
                {/* 1. Top Section */}
                <div className="wtitle mb-1">
                  <span className="d"></span>
                  <span>{sidebarTitle}</span>
                </div>

                {/* Separated Cards with Category Pill & WhatsApp Share */}
                <div className="flex flex-col gap-3">
                  {sidebarTopItems.map((item, index) => {
                    const itemCategory = normalizeDisplayText(getCategoryLabel(item, language));
                    return (
                      <Link
                        key={`stream-${streamIdx}-top-${item.id || index}`}
                        href={`/news/${item.slug}`}
                        className="group flex flex-col p-3 rounded-2xl bg-white dark:bg-[#161822] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_14px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.45)] hover:shadow-lg transition-all text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 pr-1">
                            <span className="block text-[11px] font-black uppercase tracking-wide text-[#B3121B] dark:text-red-500 mb-1">
                              {itemCategory}
                            </span>
                            <h3 className="text-[13.5px] sm:text-[14px] font-bold leading-snug tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-[#B3121B] dark:group-hover:text-red-400 transition-colors line-clamp-2">
                              <AutoArticleTitle article={item} language={language} />
                            </h3>
                          </div>
                          <div className="relative w-[100px] h-[68px] shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-neutral-900 shadow-2xs">
                            <img
                              src={getCardThumbnail(item, index)}
                              alt={item.title || ''}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                        </div>

                        {/* Bottom Row with Category Pill & WhatsApp Share */}
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-[10.5px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B3121B]" />
                            <span>{itemCategory || 'સમાચાર'}</span>
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const title = getArticleTitle(item, language);
                              const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/news/${item.slug}`;
                              const text = `${title}\n\n${url}`;
                              if (typeof navigator !== 'undefined' && navigator.share) {
                                navigator.share({ title, url, text }).catch(() => {
                                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                });
                              } else {
                                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-extrabold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-2xs cursor-pointer select-none"
                            aria-label="Share"
                          >
                            <SocialIcon platform="whatsapp" className="w-3 h-3 fill-current" />
                            <span>{language === 'gu' ? 'શેર' : language === 'hi' ? 'શેર' : 'Share'}</span>
                          </button>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* 2. WhatsApp Channel Widget (Always shown on every stream article to eliminate sidebar whitespace) */}
                <div className="relative w-full overflow-hidden rounded-2xl border-2 border-emerald-400/80 dark:border-emerald-600/60 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-[0_8px_24px_rgba(37,211,102,0.12)] hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-[0_8px_28px_rgba(37,211,102,0.2)] transition-all border-t-[3px] border-t-[#25D366] my-1">
                  <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-[#25D366]/10 blur-2xl" />
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-md shadow-emerald-500/25 ring-4 ring-[#25D366]/10">
                      <SocialIcon platform="whatsapp" className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-black text-[16px] text-slate-900 dark:text-white tracking-tight leading-snug">
                          {language === 'gu' ? 'WhatsApp ચેનલ' : language === 'hi' ? 'व्हाट्सएप चैनल' : 'WhatsApp Channel'}
                        </h3>
                        <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0 fill-[#25D366] text-white" />
                      </div>
                      <span className="text-[13px] md:text-[11.5px] font-bold text-emerald-700 dark:text-emerald-400">
                        {language === 'gu' ? 'સત્તાવાર ન્યૂઝ અપડેટ્સ' : language === 'hi' ? 'આधिकारिक સમાચાર અપડેટ' : 'Official News Updates'}
                      </span>
                    </div>
                  </div>
                  <p className="relative z-10 text-[14px] md:text-[12.5px] text-slate-600 dark:text-slate-300 leading-relaxed my-3 font-medium">
                    {language === 'gu'
                      ? 'તમારા શહેરના તાજા અને મહત્વના સમાચાર સૌથી પહેલા સીધા તમારા ફોન પર મેળવો.'
                      : language === 'hi'
                        ? 'अपने शहर के ताजा और महत्वपूर्ण समाचार सबसे पहले सीधे अपने फोन पर पाएं।'
                        : 'Get breaking news and vital updates of your city first, directly on your phone.'}
                  </p>
                  <a
                    href="https://www.whatsapp.com/channel/0029VaFFh7KIiRojqynnOX2N"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#25D366] via-[#1fad53] to-[#128C7E] hover:from-[#20bd5a] hover:to-[#0f7a6d] text-white font-black text-[15px] md:text-[13.5px] py-2.5 px-4 rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] transition-all cursor-pointer group/btn select-none"
                  >
                    <SocialIcon platform="whatsapp" className="h-4.5 w-4.5 text-white shrink-0" />
                    <span>{language === 'gu' ? 'ચેનલ ફોલો કરો' : language === 'hi' ? 'ચैनल फॉलो करें' : 'Follow Channel'}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1 shrink-0" />
                  </a>
                </div>

                {/* 3. Bottom Section (Additional Cards to guarantee complete vertical coverage) */}
                {sidebarBottomItems.length > 0 && (
                  <div className="flex flex-col gap-3 mt-1">
                    <div className="wtitle mb-1">
                      <span className="d"></span>
                      <span>{sidebarBottomTitle}</span>
                    </div>
                    {sidebarBottomItems.map((item, index) => {
                      const itemCategory = normalizeDisplayText(getCategoryLabel(item, language));
                      return (
                        <Link
                          key={`stream-${streamIdx}-bottom-${item.id || index}`}
                          href={`/news/${item.slug}`}
                          className="group flex flex-col p-3 rounded-2xl bg-white dark:bg-[#161822] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_14px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.45)] hover:shadow-lg transition-all text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 pr-1">
                              <span className="block text-[11px] font-black uppercase tracking-wide text-[#B3121B] dark:text-red-500 mb-1">
                                {itemCategory}
                              </span>
                              <h3 className="text-[13.5px] sm:text-[14px] font-bold leading-snug tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-[#B3121B] dark:group-hover:text-red-400 transition-colors line-clamp-2">
                                <AutoArticleTitle article={item} language={language} />
                              </h3>
                            </div>
                            <div className="relative w-[100px] h-[68px] shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-neutral-900 shadow-2xs">
                              <img
                                src={getCardThumbnail(item, index)}
                                alt={item.title || ''}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            </div>
                          </div>

                          {/* Bottom Row with Category Pill & WhatsApp Share */}
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-[10.5px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#B3121B]" />
                              <span>{itemCategory || 'સમાચાર'}</span>
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const title = getArticleTitle(item, language);
                                const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/news/${item.slug}`;
                                const text = `${title}\n\n${url}`;
                                if (typeof navigator !== 'undefined' && navigator.share) {
                                  navigator.share({ title, url, text }).catch(() => {
                                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                  });
                                } else {
                                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-extrabold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-2xs cursor-pointer select-none"
                              aria-label="Share"
                            >
                              <SocialIcon platform="whatsapp" className="w-3 h-3 fill-current" />
                              <span>{language === 'gu' ? 'શેર' : language === 'hi' ? 'શેર' : 'Share'}</span>
                            </button>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </aside>
            </div>
          );
        });
      })()}
    </div>
  );
}
