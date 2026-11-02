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
      if (platform === 'instagram') {
        const document = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}blockquote{margin:0!important;width:100%!important;min-width:0!important}</style></head><body><blockquote class="instagram-media" data-instgrm-permalink="${escapeEmbedAttribute(social.url)}" data-instgrm-version="14"><a href="${escapeEmbedAttribute(social.url)}">View post on Instagram</a></blockquote><script async src="https://www.instagram.com/embed.js"></script></body></html>`;
        return { platform, mode: 'embed', url: social.url, src: social.src, document };
      }
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
        if (!match) continue;
        const link = `https://x.com${match[0]}`;
        const document = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}.twitter-tweet{margin:0 auto!important}</style></head><body><blockquote class="twitter-tweet" data-dnt="true"><a href="${link}">View post on X</a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script><script>(function(){function n(){var t=document.querySelector('.twitter-tweet-rendered')||document.querySelector('.twitter-tweet');var h=t?(t.offsetHeight||t.getBoundingClientRect().height):0;if(!h||h<80){h=document.body.scrollHeight||document.documentElement.scrollHeight||0;}if(h>50){window.parent.postMessage({type:'gp-embed-resize',url:'${link}',height:Math.ceil(h)},'*');}}if(window.ResizeObserver){new ResizeObserver(n).observe(document.body);}if(window.twttr&&window.twttr.events){window.twttr.events.bind('rendered',n);}var c=0;var i=setInterval(function(){c++;n();if(c>35)clearInterval(i);},120);window.addEventListener('load',n);window.addEventListener('resize',n);})();</script></body></html>`;
        return { platform, mode: 'embed', url: link, document };
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
  const link = `<a href="${escapeEmbedAttribute(media.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;padding:12px 20px;border-radius:12px;background:#000;color:white;text-decoration:none;font-weight:700">Open on ${label} ↗</a>`;

  let frameStyle = 'display:block;width:100%;border:0;';
  if (platform === 'twitter') {
    frameStyle += 'max-width:550px;margin:0 auto;height:480px;min-height:220px;aspect-ratio:auto;';
  } else if (platform === 'youtube') {
    frameStyle += 'aspect-ratio:16/9;width:100%;max-width:720px;margin:0 auto;height:auto;min-height:360px;border-radius:12px;';
  } else {
    frameStyle += 'max-width:540px;margin:0 auto;height:650px;aspect-ratio:auto;';
  }

  const frame = media.mode === 'embed'
    ? `<iframe ${media.document ? `srcdoc="${escapeEmbedAttribute(media.document)}" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"` : `src="${escapeEmbedAttribute(media.src || '')}"`} title="${label} embedded post" data-social-platform="${platform}" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="${frameStyle}"></iframe>`
    : '';

  return `<figure data-article-social-platform="${platform}" data-article-social-mode="${media.mode}" data-article-social-url="${escapeEmbedAttribute(media.url)}" class="my-4 flex justify-center w-full overflow-hidden">${frame}${media.mode === 'embed' ? '' : link}</figure>`;
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

  // 3. Fallbacks for legacy article markup without data attributes
  if (platform === 'youtube') {
    const m = body.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{11})/i);
    if (m && m[1]) return `https://www.youtube.com/watch?v=${m[1]}`;
  } else if (platform === 'twitter') {
    const m = body.match(/https?:\/\/(?:twitter\.com|x\.com)\/(?:[^\s"'<>]+\/status|i\/status)\/(\d+)/i);
    if (m) return m[0];
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
