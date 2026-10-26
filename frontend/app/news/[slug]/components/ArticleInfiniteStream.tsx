'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Article, Language } from '@/types';
import { normalizeDisplayText, formatDate, formatArticleDateTime, getCategoryLabel, getArticleTitle, SITE_URL } from '@/data';
import { AutoArticleTitle, AutoArticleBreadcrumbTitle } from '@/components/ui/AutoTranslatedArticleText';
import MobileHeroArticleCard from '@/components/ui/MobileHeroArticleCard';
import ArticleShareAudioBar from './ArticleShareAudioBar';
import { getPublicArticleBySlug } from '@/lib/api';

interface ArticleInfiniteStreamProps {
  mounted: boolean;
  streamList: Article[];
  article: Article;
  language: Language;
  mostReadArticles: Article[];
  trending: Article[];
  related: Article[];
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
  sidebarRecommendedPool: Article[];
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
}: {
  article: Article;
  language: Language;
  uiLabel: ArticleInfiniteStreamProps['uiLabel'];
  audioText?: string;
}) {
  const title = getArticleTitle(article, language) || article.title || '';
  const articleUrl = `${SITE_URL.replace(/\/$/, '')}/news/${article.slug}`;
  const excerpt = article.excerpt || article.excerptGu || '';
  const effectiveAudioText = (audioText || `${title}. ${excerpt}`).replace(/<[^>]*>/g, '').trim();

  return (
    <div className="mb-4">
      <ArticleShareAudioBar
        title={title}
        articleUrl={articleUrl}
        language={language}
        uiLabel={uiLabel}
        audioText={effectiveAudioText}
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
}: {
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
        .catch(() => {});
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
        className="block relative aspect-[16/9] w-full overflow-hidden bg-black rounded-lg shadow-sm mb-6 mt-4 group cursor-pointer"
      >
        <Image
          src={articleData.image}
          alt={getArticleTitle(articleData, language)}
          fill
          sizes="(max-width: 1024px) 100vw, 760px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
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
      <ArticleStreamShareBar article={articleData} language={language} uiLabel={uiLabel} audioText={audioText} />

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

          {/* Mobile View (< md): Hero Section style list */}
          <div className="flex flex-col divide-y divide-border/60 md:hidden">
            {readAlsoArticles.map((raArt, index) => (
              <MobileHeroArticleCard
                key={`mobile-stream-${streamArticle.id}-ra-${raArt.id}-${index}`}
                article={raArt}
                language={language}
                index={index}
              />
            ))}
          </div>

          {/* Desktop View (>= md): existing 2-column card grid */}
          <div className="hidden md:grid md:grid-cols-2 gap-3">
            {readAlsoArticles.map((raArt, index) => {
              const raCat = normalizeDisplayText(getCategoryLabel(raArt, language) || raArt.category || '');
              return (
                <Link
                  key={`stream-${streamArticle.id}-ra-${raArt.id}-${index}`}
                  href={`/news/${raArt.slug}`}
                  className="group flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs hover:border-[#B3121B] hover:shadow-[0_6px_20px_rgba(179,18,27,0.12)] dark:hover:shadow-[0_6px_20px_rgba(179,18,27,0.22)] hover:-translate-y-0.5 transition-all duration-300 text-left"
                >
                  <div className="relative h-[70px] w-[90px] shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 shadow-sm">
                    <Image
                      src={getCardThumbnail(raArt, index)}
                      alt={getArticleTitle(raArt, language)}
                      fill
                      sizes="90px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEMO_THUMBNAILS[index % DEMO_THUMBNAILS.length];
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <span className="block text-[10.5px] font-black uppercase tracking-wider text-[#B3121B] opacity-85">{raCat}</span>
                    <p className="line-clamp-3 text-[13px] font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-[#B3121B] dark:group-hover:text-red-400 transition-colors duration-200 leading-snug">
                      <AutoArticleTitle article={raArt} language={language} />
                    </p>
                  </div>
                  <span className="shrink-0 mt-1 text-neutral-400 group-hover:text-[#B3121B] group-hover:translate-x-1 transition-all duration-200 text-sm font-bold">→</span>
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
  sidebarRecommendedPool,
}: ArticleInfiniteStreamProps) {
  return (
    <div className="article-grid mt-3.5 border-t border-neutral-200 dark:border-neutral-800 !pt-3.5" suppressHydrationWarning>
      <article className="article-stream-container select-none w-full" suppressHydrationWarning>
        <div className="space-y-5" suppressHydrationWarning>
          {mounted && (() => {
            // Global set to track used Read Also article IDs across all stream items
            const usedReadAlsoIds = new Set<string>();

            return streamList.map((streamArticle) => {
              const mainId = String(article.id);
              const streamArtId = String(streamArticle.id);

              // Calculate 4 Read Also articles that are TRULY RELATED to this streamArticle
              const streamCatSlug = (streamArticle.category || '').toLowerCase().replace(/\s+/g, '-');
              const streamCatName = (streamArticle.category || '').toLowerCase().trim();
              const streamLoc = (streamArticle.location || '').toLowerCase().trim();

              const streamGenericTags = new Set([
                'news', 'popular stories', 'popular-stories', 'popularstories',
                'trending', 'breaking', 'breaking news', 'national', 'સમાચાર',
                'ન્યૂઝ', 'લાઇવ', 'વિશેષ', 'ગુજરાત', 'ભારત'
              ]);

              const streamTags = [
                ...(streamArticle.tags || []),
                ...(streamArticle.tagsGu || []),
                ...(streamArticle.tagsHi || []),
              ].map((t) => t?.toLowerCase().trim()).filter(Boolean);

              const streamSlugWords = (streamArticle.slug || '')
                .split('-')
                .filter((w) => w.length > 3 && !['gujaratpost', 'news', 'from', 'with', 'turns', 'into'].includes(w));

              // Combine all available candidate pools: related first, then trending, then mostReadArticles
              const rawPool = [...related, ...trending, ...mostReadArticles].filter(
                (cand, idx, self) =>
                  String(cand.id) !== mainId &&
                  String(cand.id) !== streamArtId &&
                  self.findIndex((t) => String(t.id) === String(cand.id)) === idx
              );

              // Prefer candidates not yet shown in this stream session
              let candidatePool = rawPool.filter((cand) => !usedReadAlsoIds.has(String(cand.id)));
              if (candidatePool.length < 4) {
                candidatePool = rawPool;
              }

              const scoredCandidates = candidatePool.map((cand) => {
                let score = 0;
                const candCatSlug = (cand.category || '').toLowerCase().replace(/\s+/g, '-');
                const candCatName = (cand.category || '').toLowerCase().trim();

                // 1. Same category bonus (primary relevance factor!)
                if (
                  candCatSlug === streamCatSlug ||
                  (streamCatName && candCatName && (streamCatName === candCatName || streamCatName.includes(candCatName) || candCatName.includes(streamCatName)))
                ) {
                  score += 35;
                }

                // 2. Tag overlap (specific tags scored heavily, generic tags minimally)
                const candTags = [
                  ...(cand.tags || []),
                  ...(cand.tagsGu || []),
                  ...(cand.tagsHi || []),
                ].map((t) => t?.toLowerCase().trim()).filter(Boolean);

                candTags.forEach((t) => {
                  if (streamTags.includes(t)) {
                    score += streamGenericTags.has(t) ? 3 : 18;
                  }
                });

                // 3. Title / Slug keyword similarity
                const candSlug = (cand.slug || '').toLowerCase();
                streamSlugWords.forEach((word) => {
                  if (candSlug.includes(word)) {
                    score += 15;
                  }
                });

                // 4. Same location bonus
                const candLoc = (cand.location || '').toLowerCase().trim();
                if (streamLoc && candLoc && streamLoc === candLoc) {
                  score += 20;
                }

                // 5. Prefer unused in this session
                if (!usedReadAlsoIds.has(String(cand.id))) {
                  score += 10;
                }

                // 6. Popularity & recency
                if (cand.isTrending) score += 3;
                if (cand.isFeatured) score += 2;

                return { cand, score };
              });

              scoredCandidates.sort((a, b) => b.score - a.score);

              const readAlsoArticles = scoredCandidates.slice(0, 4).map((entry) => entry.cand);

              readAlsoArticles.forEach((a) => usedReadAlsoIds.add(String(a.id)));

              return (
                <StreamArticleItem
                  key={streamArticle.id}
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
              );
            });
          })()}
        </div>
      </article>

      <aside className="select-none h-fit sticky top-[100px] w-full max-w-[340px] min-w-0 overflow-hidden" suppressHydrationWarning>
        {/* Heading and recommended stories stick together below header */}
        <div className="wtitle mb-3">
          <span className="d"></span>
          <span>{uiLabel(language, { en: 'Recommended Stories', gu: 'તમારા માટે ભલામણ', hi: 'आपके लिए अनुशंसित' })}</span>
        </div>

        {/* Mobile View (< md): Hero Section style list */}
        <div className="flex flex-col divide-y divide-border/60 md:hidden">
          {sidebarRecommendedPool.slice(0, 6).map((item, index) => (
            <MobileHeroArticleCard
              key={`stream-rec-mob-${item.id || index}`}
              article={item}
              language={language}
              index={index}
            />
          ))}
        </div>

        {/* Desktop View (>= md): existing */}
        <div className="hidden md:block space-y-0">
          {sidebarRecommendedPool.slice(0, 6).map((item, index) => {
            const itemCategory = normalizeDisplayText(getCategoryLabel(item, language));
            return (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="group flex items-start gap-3 py-2.5 border-b border-neutral-200/80 dark:border-neutral-800 last:border-b-0 text-left hover:opacity-90 transition-all"
              >
                <div className="min-w-0 flex-1 pr-1">
                  <span className="block text-[11px] font-black uppercase tracking-wide text-[#B3121B] dark:text-red-500 mb-0.5">
                    {itemCategory}
                  </span>
                  <h3 className="text-[13.5px] sm:text-[14px] font-bold leading-snug tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-[#B3121B] dark:group-hover:text-red-400 transition-colors line-clamp-3">
                    <AutoArticleTitle article={item} language={language} />
                  </h3>
                </div>
                <div className="relative w-[108px] sm:w-[114px] h-[72px] sm:h-[76px] shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 shadow-xs self-start">
                  <Image
                    src={getCardThumbnail(item, index)}
                    alt={item.title || ''}
                    fill
                    sizes="114px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
