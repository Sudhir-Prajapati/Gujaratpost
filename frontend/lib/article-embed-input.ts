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

/** Treat regular URLs as links, and provider embed URLs or HTML as embedded media. */
export function parseArticleEmbedInput(input: string, platform: ArticleSocialPlatform): ArticleEmbedInput | null {
  const text = input.trim().replace(/&amp;/gi, '&');
  const embed = /<(?:iframe|blockquote)\b/i.test(text) || /https?:\/\/[^\s"'<>]+\/(?:embed\/|plugins\/(?:post|video)\.php)/i.test(text);
  const urls = text.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  if (platform === 'instagram' || platform === 'facebook') {
    const social = getSocialEmbed(text, platform);
    if (social) {
      if (platform === 'instagram' && embed) {
        const document = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}blockquote{margin:0!important;width:100%!important;min-width:0!important}</style></head><body><blockquote class="instagram-media" data-instgrm-permalink="${escapeEmbedAttribute(social.url)}" data-instgrm-version="14"><a href="${escapeEmbedAttribute(social.url)}">View post on Instagram</a></blockquote><script async src="https://www.instagram.com/embed.js"></script></body></html>`;
        return { platform, mode: 'embed', url: social.url, document };
      }
      return { platform, mode: embed ? 'embed' : 'link', url: social.url, src: embed ? social.src : undefined };
    }
  }
  for (const raw of urls) {
    try {
      const url = new URL(raw);
      if (url.protocol !== 'https:' || url.username || url.password || url.port) continue;
      const host = url.hostname.replace(/^www\./, '');
      if (platform === 'youtube' && ['youtube.com', 'youtube-nocookie.com', 'youtu.be'].includes(host)) {
        const id = host === 'youtu.be' ? url.pathname.slice(1).split('/')[0] : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1];
        if (id && /^[\w-]{11}$/.test(id)) return { platform, mode: embed ? 'embed' : 'link', url: `https://www.youtube.com/watch?v=${id}`, src: `https://www.youtube.com/embed/${id}` };
      }
      if (platform === 'twitter' && ['twitter.com', 'x.com', 'mobile.twitter.com'].includes(host)) {
        const match = url.pathname.match(/^\/(?:[^/]+\/status|i\/web\/status)\/(\d+)/);
        if (!match) continue;
        const link = `https://x.com${match[0]}`;
        const document = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}.twitter-tweet{margin:0 auto!important}</style></head><body><blockquote class="twitter-tweet" data-dnt="true"><a href="${link}">View post on X</a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script><script>(function(){function n(){var t=document.querySelector('.twitter-tweet-rendered')||document.querySelector('.twitter-tweet');var h=t?(t.offsetHeight||t.getBoundingClientRect().height):0;if(!h||h<80){h=document.body.scrollHeight||document.documentElement.scrollHeight||0;}if(h>50){window.parent.postMessage({type:'gp-embed-resize',url:'${link}',height:Math.ceil(h)},'*');}}if(window.ResizeObserver){new ResizeObserver(n).observe(document.body);}if(window.twttr&&window.twttr.events){window.twttr.events.bind('rendered',n);}var c=0;var i=setInterval(function(){c++;n();if(c>35)clearInterval(i);},120);window.addEventListener('load',n);window.addEventListener('resize',n);})();</script></body></html>`;
        return { platform, mode: embed ? 'embed' : 'link', url: link, document: embed ? document : undefined };
      }
      if (!embed && platform === 'facebook' && ['facebook.com', 'm.facebook.com', 'fb.watch'].includes(host)) return { platform, mode: 'link', url: url.toString() };
    } catch { /* Ignore URLs belonging to scripts or unsupported providers. */ }
  }
  if (platform === 'youtube' && /^[\w-]{11}$/.test(text)) return { platform, mode: 'embed', url: `https://www.youtube.com/watch?v=${text}`, src: `https://www.youtube.com/embed/${text}` };
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
    frameStyle += 'height:420px;';
  } else {
    frameStyle += 'max-width:540px;margin:0 auto;height:650px;aspect-ratio:auto;';
  }

  const frame = media.mode === 'embed'
    ? `<iframe ${media.document ? `srcdoc="${escapeEmbedAttribute(media.document)}" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"` : `src="${escapeEmbedAttribute(media.src || '')}"`} title="${label} embedded post" data-social-platform="${platform}" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="${frameStyle}"></iframe>`
    : '';

  return `<figure data-article-social-platform="${platform}" data-article-social-mode="${media.mode}" data-article-social-url="${escapeEmbedAttribute(media.url)}" class="my-4 flex justify-center w-full overflow-hidden">${frame}${media.mode === 'embed' ? '' : link}</figure>`;
}

export function getSavedArticleEmbedInput(body: string, platform: ArticleSocialPlatform): string {
  const tag = (body.match(/<figure\b[^>]*>/gi) || []).find((value) => value.includes(`data-article-social-platform="${platform}"`));
  const url = tag?.match(/data-article-social-url="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&');
  if (!url) return '';
  return tag?.includes('data-article-social-mode="embed"') ? `<iframe src="${url}"></iframe>` : url;
}
