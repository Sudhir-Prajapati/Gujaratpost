export type SocialPlatform = 'instagram' | 'facebook';

export interface SocialEmbed {
  platform: SocialPlatform;
  url: string;
  src: string;
  height: number;
}

function decodeAttribute(value: string) {
  return value.replace(/&amp;|&#38;|&#x26;/gi, '&').replace(/&quot;|&#34;/gi, '"').replace(/&#39;|&apos;/gi, "'");
}

/** Extract only trusted provider URLs; never execute pasted embed HTML or scripts. */
export function getSocialEmbed(input: string, platform: SocialPlatform): SocialEmbed | null {
  const decoded = decodeAttribute(input.trim());
  const candidates = decoded.match(/https?:\/\/[^\s<>"']+/gi) || [];
  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) continue;
      if (platform === 'instagram') {
        if (!['instagram.com', 'www.instagram.com'].includes(parsed.hostname)) continue;
        const match = parsed.pathname.match(/^\/(p|reel|reels|tv)\/([\w-]+)(?:\/|$)/);
        if (!match) continue;
        const type = match[1] === 'reels' ? 'reel' : match[1];
        const url = `https://www.instagram.com/${type}/${match[2]}/`;
        return { platform, url, src: `${url}embed/`, height: 720 };
      }
      if (!['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'].includes(parsed.hostname)) continue;
      // Facebook's iframe code carries the original post in its href parameter.
      if (/^\/plugins\/(?:post|video)\.php$/.test(parsed.pathname)) {
        const original = parsed.searchParams.get('href');
        if (!original) continue;
        const embed = getSocialEmbed(original, platform);
        if (embed) return embed;
        continue;
      }
      const isVideo = /\/(?:videos|reel)\//.test(parsed.pathname) ||
        (/^\/(?:watch\/?|video\.php)$/.test(parsed.pathname) && !!parsed.searchParams.get('v'));
      const isPost = /\/posts\//.test(parsed.pathname) || /^\/(?:permalink|story|photo)\.php$/.test(parsed.pathname) ||
        /^\/photo\//.test(parsed.pathname) || /^\/share\/(?:p|v|r)\//.test(parsed.pathname);
      if (!isVideo && !isPost) continue;
      parsed.hostname = 'www.facebook.com';
      parsed.hash = '';
      for (const key of [...parsed.searchParams.keys()]) {
        if (!['v', 'id', 'story_fbid', 'fbid', 'set'].includes(key)) parsed.searchParams.delete(key);
      }
      const url = parsed.toString();
      const params = new URLSearchParams({ href: url, show_text: 'true', width: '500' });
      return { platform, url, src: `https://www.facebook.com/plugins/${isVideo ? 'video' : 'post'}.php?${params}`, height: 720 };
    } catch { /* Try the next URL in the pasted embed code. */ }
  }
  return null;
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildSocialEmbedHtml(embed: SocialEmbed): string {
  const label = embed.platform === 'instagram' ? 'Instagram' : 'Facebook';
  return `<figure data-social-platform="${embed.platform}" data-social-url="${escapeAttribute(embed.url)}" class="my-6 mx-auto w-full max-w-[540px] overflow-hidden rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white"><iframe src="${escapeAttribute(embed.src)}" title="${label} post" loading="lazy" allow="encrypted-media; picture-in-picture; web-share" allowfullscreen style="display:block;width:100%;height:${embed.height}px;border:0"></iframe><figcaption class="p-3 text-center text-sm"><a href="${escapeAttribute(embed.url)}" target="_blank" rel="noopener noreferrer" class="text-red-600 underline">View original post on ${label}</a></figcaption></figure>`;
}

export function getSavedSocialUrl(body: string, platform: SocialPlatform): string {
  const figures = body.match(/<figure\b[^>]*data-social-platform=["'][^"']+["'][\s\S]*?<\/figure>/gi) || [];
  for (const figure of figures) {
    if (!figure.includes(`data-social-platform="${platform}"`)) continue;
    const url = figure.match(/data-social-url="([^"]+)"/i)?.[1];
    if (url) return getSocialEmbed(decodeAttribute(url), platform)?.url || '';
  }
  return '';
}
