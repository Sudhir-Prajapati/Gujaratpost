import { getSocialEmbed } from './social-embeds';

export type ArticleSocialPlatform = 'youtube' | 'twitter' | 'instagram' | 'facebook';
export interface ArticleEmbedInput {
  platform: ArticleSocialPlatform;
  mode: 'link' | 'embed';
  url: string;
  src?: string;
  document?: string;
}

export function escapeEmbedAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Treat regular URLs or embed HTML codes as embedded media whenever supported. */
export function parseArticleEmbedInput(input: string, platform: ArticleSocialPlatform): ArticleEmbedInput | null {
  if (!input || typeof input !== 'string') return null;
  const text = input.trim().replace(/&amp;/gi, '&');
  if (!text) return null;

  if (platform === 'instagram' || platform === 'facebook') {
    const social = getSocialEmbed(text, platform);
    if (social) {
      return { platform, mode: 'embed', url: social.url, src: social.src };
    }
  }

  const urls = text.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  for (const raw of urls) {
    try {
      const url = new URL(raw);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
      const host = url.hostname.replace(/^www\./, '');

      if (platform === 'youtube' && ['youtube.com', 'youtube-nocookie.com', 'youtu.be', 'm.youtube.com'].includes(host)) {
        const id = host === 'youtu.be'
          ? url.pathname.slice(1).split('/')[0]
          : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1];
        if (id && /^[\w-]{11}$/.test(id)) {
          return {
            platform,
            mode: 'embed',
            url: `https://www.youtube.com/watch?v=${id}`,
            src: `https://www.youtube.com/embed/${id}`,
          };
        }
      }

      if (platform === 'twitter' && ['twitter.com', 'x.com', 'mobile.twitter.com'].includes(host)) {
        const match = url.pathname.match(/^\/(?:[^/]+\/status|i\/web\/status|i\/status)\/(\d+)/);
        if (match) {
          const link = `https://x.com${match[0]}`;
          const document = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}.twitter-tweet{margin:0 auto!important}</style></head><body><blockquote class="twitter-tweet" data-dnt="true"><a href="${link}">View post on X</a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script><script>(function(){function n(){var t=document.querySelector('.twitter-tweet-rendered')||document.querySelector('.twitter-tweet');var h=t?(t.offsetHeight||t.getBoundingClientRect().height):0;if(!h||h<80){h=document.body.scrollHeight||document.documentElement.scrollHeight||0;}if(h>50){window.parent.postMessage({type:'gp-embed-resize',url:'${link}',height:Math.ceil(h)},'*');}}if(window.ResizeObserver){new ResizeObserver(n).observe(document.body);}if(window.twttr&&window.twttr.events){window.twttr.events.bind('rendered',n);}var c=0;var i=setInterval(function(){c++;n();if(c>35)clearInterval(i);},120);window.addEventListener('load',n);window.addEventListener('resize',n);})();</script></body></html>`;
          return { platform, mode: 'embed', url: link, document };
        }
        // General Twitter / X link fallback (broadcasts, spaces, live, profile, etc.)
        return {
          platform,
          mode: 'link',
          url: url.toString(),
        };
      }

      if (platform === 'facebook' && ['facebook.com', 'm.facebook.com', 'fb.watch', 'web.facebook.com'].includes(host)) {
        const social = getSocialEmbed(raw, 'facebook');
        if (social) {
          return { platform, mode: 'embed', url: social.url, src: social.src };
        }
        return { platform, mode: 'link', url: url.toString() };
      }
    } catch { /* Ignore invalid URLs */ }
  }

  // Bare 11-char YouTube ID fallback
  if (platform === 'youtube' && /^[\w-]{11}$/.test(text)) {
    return {
      platform,
      mode: 'embed',
      url: `https://www.youtube.com/watch?v=${text}`,
      src: `https://www.youtube.com/embed/${text}`,
    };
  }

  return null;
}

export function buildArticleEmbedHtml(input: string, platform: ArticleSocialPlatform): string {
  const media = parseArticleEmbedInput(input, platform);
  if (!media) return '';
  const label = { youtube: 'YouTube', twitter: 'X (Twitter)', instagram: 'Instagram', facebook: 'Facebook' }[platform];

  if (platform === 'twitter') {
    return `<figure data-article-social-platform="twitter" data-article-social-mode="embed" data-article-social-url="${escapeEmbedAttribute(media.url)}" class="my-6 flex justify-center w-full overflow-hidden"><div class="gp-twitter-embed-wrap my-4 flex justify-center w-full" data-tweet-url="${escapeEmbedAttribute(media.url)}"><blockquote class="twitter-tweet" data-dnt="true" data-theme="light"><a href="${escapeEmbedAttribute(media.url)}">View post on X</a></blockquote></div></figure>`;
  }

  if (platform === 'youtube') {
    return `<figure data-article-social-platform="youtube" data-article-social-mode="embed" data-article-social-url="${escapeEmbedAttribute(media.url)}" class="my-6 flex justify-center w-full overflow-hidden"><div class="my-2 aspect-video w-full max-w-[720px] mx-auto overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-md bg-black"><iframe src="${escapeEmbedAttribute(media.src || '')}" title="YouTube video player" class="h-full w-full border-0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" frameborder="0"></iframe></div></figure>`;
  }

  if (platform === 'instagram') {
    return `<figure data-article-social-platform="instagram" data-article-social-mode="embed" data-article-social-url="${escapeEmbedAttribute(media.url)}" class="my-6 flex justify-center w-full overflow-hidden"><div class="my-2 mx-auto max-w-[540px] w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-md bg-white dark:bg-zinc-900"><iframe src="${escapeEmbedAttribute(media.src || '')}" title="Instagram post" class="w-full min-h-[580px] border-0" allowtransparency="true" allowfullscreen="true" frameborder="0" scrolling="no"></iframe></div></figure>`;
  }

  if (platform === 'facebook') {
    return `<figure data-article-social-platform="facebook" data-article-social-mode="embed" data-article-social-url="${escapeEmbedAttribute(media.url)}" class="my-6 flex justify-center w-full overflow-hidden"><div class="my-2 mx-auto max-w-[500px] w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-md bg-white dark:bg-zinc-900"><iframe src="${escapeEmbedAttribute(media.src || '')}" title="Facebook post" class="w-full min-h-[460px] border-0" allowfullscreen="true" frameborder="0" scrolling="no" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe></div></figure>`;
  }

  return '';
}

export function getSavedArticleEmbedInput(body: string, platform: ArticleSocialPlatform): string {
  if (!body) return '';

  // 1. Direct match on data-article-social-platform
  const tag = (body.match(/<figure\b[^>]*>/gi) || []).find((value) => value.includes(`data-article-social-platform="${platform}"`));
  const url = tag?.match(/data-article-social-url="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&');
  if (url) return url;

  // 2. Direct match on data-social-platform
  const tag2 = (body.match(/<figure\b[^>]*>/gi) || []).find((value) => value.includes(`data-social-platform="${platform}"`));
  const url2 = tag2?.match(/data-social-url="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&');
  if (url2) return url2;

  // 3. Match on data-tweet-url if platform is twitter
  if (platform === 'twitter') {
    const tweetWrap = body.match(/data-tweet-url="([^"]+)"/i);
    if (tweetWrap && tweetWrap[1]) return tweetWrap[1].replace(/&amp;/g, '&');
  }

  // 4. Fallbacks for legacy article markup without data attributes
  if (platform === 'youtube') {
    const m = body.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
    if (m && m[1]) return `https://www.youtube.com/watch?v=${m[1]}`;
  } else if (platform === 'twitter') {
    // Check blockquote link or any twitter/x URL
    const bqMatch = body.match(/<blockquote[^>]*class=["'][^"']*twitter-tweet[\s\S]*?href=["'](https?:\/\/(?:twitter\.com|x\.com)\/[^"']+)["']/i);
    if (bqMatch && bqMatch[1]) return bqMatch[1].replace(/&amp;/g, '&');

    const m = body.match(/https?:\/\/(?:twitter\.com|x\.com)\/(?:[^\s"'<>]+\/status|i\/status)\/(\d+)/i);
    if (m) return m[0];

    const broadcastMatch = body.match(/https?:\/\/(?:twitter\.com|x\.com)\/i\/(?:broadcasts|spaces)\/[^\s"'<>]+/i);
    if (broadcastMatch) return broadcastMatch[0];

    const genericTwMatch = body.match(/https?:\/\/(?:twitter\.com|x\.com)\/[^\s"'<>]+/i);
    if (genericTwMatch && !genericTwMatch[0].includes('widgets.js')) return genericTwMatch[0];
  } else if (platform === 'instagram') {
    const m = body.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([\w-]+)/i);
    if (m) return m[0];
  } else if (platform === 'facebook') {
    const m = body.match(/https?:\/\/(?:www\.)?facebook\.com\/plugins\/(?:post|video)\.php\?href=([^&"'\s<>]+)/i);
    if (m && m[1]) return decodeURIComponent(m[1]);
    const m2 = body.match(/https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>]+/i);
    if (m2) return m2[0];
  }

  return '';
}

/** Thoroughly purge embedded figures, iframes, cards, blockquotes, and widgets for a given social platform (or all). */
export function purgeSocialEmbedFromText(text: string, platform?: ArticleSocialPlatform | 'all'): string {
  if (!text || typeof text !== 'string') return '';
  let out = text;

  const purgeTwitter = !platform || platform === 'all' || platform === 'twitter';
  const purgeYoutube = !platform || platform === 'all' || platform === 'youtube';
  const purgeInstagram = !platform || platform === 'all' || platform === 'instagram';
  const purgeFacebook = !platform || platform === 'all' || platform === 'facebook';

  if (purgeTwitter) {
    out = out
      // 1. Figures with twitter platform or twitter url
      .replace(/<figure\b[^>]*(?:data-article-social-platform|data-social-platform)=["']twitter["'][\s\S]*?<\/figure>/gi, '')
      .replace(/<figure\b[^>]*data-article-social-url=["'][^"']*(?:twitter\.com|x\.com)[^"']*["'][\s\S]*?<\/figure>/gi, '')
      // 2. Custom Twitter embed wrap / card / link
      .replace(/<div[^>]*class=["'][^"']*(?:gp-twitter-embed-wrap|gp-x-card|gp-x-link)[^"']*["']>[\s\S]*?<\/div>/gi, '')
      // 3. Twitter blockquote (with optional widgets.js script)
      .replace(/<blockquote[^>]*class=["'][^"']*twitter-tweet[^"']*["'][\s\S]*?<\/blockquote>(?:\s*<script[^>]*widgets\.js[^>]*><\/script>)?/gi, '')
      // 4. Standalone widgets.js script
      .replace(/<script[^>]*platform\.twitter\.com\/widgets\.js[^>]*><\/script>/gi, '')
      // 5. Iframes with twitter
      .replace(/<iframe[^>]*(?:data-social-platform=["']twitter["']|srcdoc=["'][^"']*twitter-tweet[\s\S]*?["']|src=["'][^"']*(?:twitter\.com|platform\.twitter\.com)[^"']*)[^>]*>[\s\S]*?<\/iframe>/gi, '');
  }

  if (purgeYoutube) {
    out = out
      .replace(/<figure\b[^>]*(?:data-article-social-platform|data-social-platform)=["']youtube["'][\s\S]*?<\/figure>/gi, '')
      .replace(/<figure\b[^>]*data-article-social-url=["'][^"']*(?:youtube\.com|youtu\.be)[^"']*["'][\s\S]*?<\/figure>/gi, '')
      .replace(/<div[^>]*class=["'][^"']*aspect-video[^"']*["']>[\s\S]*?<\/iframe>\s*<\/div>/gi, '')
      .replace(/<iframe[^>]*(?:data-social-platform=["']youtube["']|src=["'][^"']*(?:youtube\.com|youtube-nocookie\.com|youtu\.be)[^"']*)[^>]*>[\s\S]*?<\/iframe>/gi, '');
  }

  if (purgeInstagram) {
    out = out
      .replace(/<figure\b[^>]*(?:data-article-social-platform|data-social-platform)=["']instagram["'][\s\S]*?<\/figure>/gi, '')
      .replace(/<figure\b[^>]*data-article-social-url=["'][^"']*instagram\.com[^"']*["'][\s\S]*?<\/figure>/gi, '')
      .replace(/<blockquote[^>]*class=["'][^"']*instagram-media[^"']*["'][\s\S]*?<\/blockquote>(?:\s*<script[^>]*instagram\.com\/embed\.js[^>]*><\/script>)?/gi, '')
      .replace(/<script[^>]*instagram\.com\/embed\.js[^>]*><\/script>/gi, '')
      .replace(/<iframe[^>]*(?:data-social-platform=["']instagram["']|srcdoc=["'][^"']*instagram-media[\s\S]*?["']|src=["'][^"']*instagram\.com[^"']*)[^>]*>[\s\S]*?<\/iframe>/gi, '');
  }

  if (purgeFacebook) {
    out = out
      .replace(/<figure\b[^>]*(?:data-article-social-platform|data-social-platform)=["']facebook["'][\s\S]*?<\/figure>/gi, '')
      .replace(/<figure\b[^>]*data-article-social-url=["'][^"']*(?:facebook\.com|fb\.watch)[^"']*["'][\s\S]*?<\/figure>/gi, '')
      .replace(/<div[^>]*class=["'][^"']*(?:fb-post|fb-video)[^"']*["']>[\s\S]*?<\/div>/gi, '')
      .replace(/<iframe[^>]*(?:data-social-platform=["']facebook["']|src=["'][^"']*facebook\.com[^"']*)[^>]*>[\s\S]*?<\/iframe>/gi, '');
  }

  // Clean trailing empty wrappers, paragraphs, breaks, and non-breaking spaces
  out = out
    .replace(/(?:<p[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/p>\s*)+$/gi, '')
    .trim();

  return out;
}
