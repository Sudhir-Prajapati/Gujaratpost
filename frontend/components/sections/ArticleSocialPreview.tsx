'use client';

import { parseArticleEmbedInput, type ArticleSocialPlatform } from '@/lib/article-embed-input';

export default function ArticleSocialPreview({ input, platform }: { input: string; platform: ArticleSocialPlatform }) {
  if (!input.trim()) return null;
  const media = parseArticleEmbedInput(input, platform);
  const label = { youtube: 'YouTube', twitter: 'X (Twitter)', instagram: 'Instagram', facebook: 'Facebook' }[platform];
  if (!media) return <p role="alert" className="text-sm text-red-600 dark:text-red-400">Enter a valid {label} post URL or embed code.</p>;
  if (media.mode === 'link') return (
    <div className="py-3"><a href={media.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 font-bold text-white" style={{ color: '#fff' }}>Open on {label} ↗</a></div>
  );
  return (
    <section className="space-y-2 pt-3" aria-label={`${label} embedded preview`}>
      <h4 className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-200">{label} Preview</h4>
      <div className={`mx-auto overflow-hidden rounded-xl border border-neutral-300 bg-white dark:border-neutral-700 ${platform === 'youtube' ? 'aspect-video w-full' : 'w-full max-w-[540px]'}`}>
        <iframe key={media.src || media.document} title={`${label} embedded preview`} src={media.src} srcDoc={media.document}
          sandbox={media.document ? 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox' : undefined}
          className="block w-full border-0" style={{ height: platform === 'youtube' ? '100%' : 720 }}
          allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">If the provider cannot display this post, <a href={media.url} target="_blank" rel="noopener noreferrer" className="underline">open the original on {label}</a>.</p>
    </section>
  );
}
