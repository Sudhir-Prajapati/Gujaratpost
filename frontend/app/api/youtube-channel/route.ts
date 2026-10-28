import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CHANNEL_HANDLE = '@Gujaratpostnews';
const CHANNEL_URL = `https://www.youtube.com/${CHANNEL_HANDLE}`;

const DEFAULT_CHANNEL_DATA = {
  handle: '@Gujaratpostnews',
  title: 'Gujarat Post',
  subscribers: '2.57K',
  subscribersCount: 2570,
  videosCount: '554',
  videosCountNum: 554,
  avatar: 'https://yt3.googleusercontent.com/qzwNL3_hxc_KE_Y1WjMB4mUraPhWool5jeSwNndMqHK3NoFSKYjcIij-BU1xVXmyz5SNX6jYmA=s900',
  banner: '',
  description: 'Gujarat Post – Real Stories. Real Gujarat. Your digital hub for Gujarat news, Indian politics, entertainment, lifestyle, national & international updates, and sharp geopolitical insights.',
  channelUrl: CHANNEL_URL,
  verified: true,
};

let cachedChannelData: { timestamp: number; data: typeof DEFAULT_CHANNEL_DATA } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
let inFlightRequest: Promise<typeof DEFAULT_CHANNEL_DATA> | null = null;

async function scrapeChannelInfo(): Promise<typeof DEFAULT_CHANNEL_DATA> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(CHANNEL_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`YouTube HTTP ${res.status}`);
    }

    const html = await res.text();
    const result = { ...DEFAULT_CHANNEL_DATA };

    const ytDataMatch = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
    if (ytDataMatch) {
      try {
        const data = JSON.parse(ytDataMatch[1]);
        const vm = data.header?.pageHeaderRenderer?.content?.pageHeaderViewModel;
        if (vm) {
          if (vm.title?.dynamicTextViewModel?.text?.content) {
            result.title = vm.title.dynamicTextViewModel.text.content;
          }

          const rows = vm.metadata?.contentMetadataViewModel?.metadataRows || [];
          for (const row of rows) {
            for (const part of (row.metadataParts || [])) {
              const text = part.text?.content || '';
              if (text.startsWith('@')) {
                result.handle = text;
              } else if (/subscriber/i.test(text)) {
                const subStr = text.replace(/\s*subscribers?/i, '').trim();
                result.subscribers = subStr;
                const clean = subStr.toLowerCase();
                if (clean.includes('k')) {
                  result.subscribersCount = Math.round(parseFloat(clean) * 1000);
                } else if (clean.includes('m')) {
                  result.subscribersCount = Math.round(parseFloat(clean) * 1000000);
                } else {
                  result.subscribersCount = parseInt(clean.replace(/,/g, '')) || result.subscribersCount;
                }
              } else if (/video/i.test(text)) {
                const vidStr = text.replace(/\s*videos?/i, '').trim();
                result.videosCount = vidStr;
                result.videosCountNum = parseInt(vidStr.replace(/,/g, '')) || result.videosCountNum;
              }
            }
          }

          const avatarSources = vm.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources;
          if (avatarSources && avatarSources.length > 0) {
            result.avatar = avatarSources[avatarSources.length - 1].url;
          }

          const bannerSources = data.header?.pageHeaderRenderer?.banner?.imageBannerViewModel?.image?.sources;
          if (bannerSources && bannerSources.length > 0) {
            result.banner = bannerSources[0].url;
          }
        }

        if (data.metadata?.channelMetadataRenderer?.description) {
          result.description = data.metadata.channelMetadataRenderer.description;
        }
      } catch (err) {
        console.warn('Error parsing ytInitialData in youtube-channel route:', err);
      }
    }

    cachedChannelData = { timestamp: Date.now(), data: result };
    return result;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  if (cachedChannelData && Date.now() - cachedChannelData.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      data: cachedChannelData.data,
      cached: true,
    });
  }

  if (inFlightRequest) {
    try {
      const data = await inFlightRequest;
      return NextResponse.json({ success: true, data });
    } catch {
      return NextResponse.json({
        success: true,
        data: cachedChannelData?.data || DEFAULT_CHANNEL_DATA,
        fallback: true,
      });
    }
  }

  inFlightRequest = scrapeChannelInfo().finally(() => {
    inFlightRequest = null;
  });

  try {
    const data = await inFlightRequest;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.warn('Failed to scrape channel, returning default channel data:', err?.message || err);
    return NextResponse.json({
      success: true,
      data: cachedChannelData?.data || DEFAULT_CHANNEL_DATA,
      fallback: true,
    });
  }
}
