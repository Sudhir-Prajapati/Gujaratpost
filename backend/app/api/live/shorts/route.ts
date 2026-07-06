import { NextResponse } from 'next/server';

const CHANNEL_ID = 'UCqQ8YbFSZ4j8J4iVJOHurTw';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

interface VideoItem {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  videoUrl: string;
}

interface InvidiousVideo {
  videoId: string;
  title: string;
  published: number;
  lengthSeconds?: number;
  liveNow?: boolean;
}

// Fallback data for Shorts matching the screenshot
const FALLBACK_SHORTS: VideoItem[] = [
  {
    id: 's1_placeholder',
    title: 'Gujarat Weather Forecast | રાજ્યમાં વરસાદી આગાહી વચ્ચે ગરમી યથાવત',
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=400&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 's2_placeholder',
    title: 'Fake Medicine | નકલી દવાઓ પર રોક લગાવવા સરકારનો નિર્ણય | QR કોડ ફરજીયાત',
    publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 's3_placeholder',
    title: 'Passport Fees Hike | પાસપોર્ટ ફીની અરજીમાં કરાયો વધારો | Passport Office',
    publishedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 's4_placeholder',
    title: 'Morbi | મોરબી જેતપરમાં ઉપવાસનો 9મો દિવસ | Jetpar | Farmer Protest',
    publishedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=400&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 's5_placeholder',
    title: 'Kalol Police | કલોલ બાઈક પર ગાંજો લઈ જતા બે ઝડપાયા | Gujarat News',
    publishedAt: new Date(Date.now() - 3600000 * 45).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  }
];

async function fetchFromInvidious(channelId: string): Promise<VideoItem[] | null> {
  const instances = [
    'https://inv.thepixora.com',
    'https://invidious.nerdvpn.de',
    'https://inv.nadeko.net',
    'https://yt.chocolatemoo53.com',
    'https://invidious.tiekoetter.com',
    'https://invidious.f5.si'
  ];

  for (const instance of instances) {
    try {
      const url = `${instance}/api/v1/channels/${channelId}/videos`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
          'Accept': 'application/json',
        },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      
      if (data && Array.isArray(data.videos)) {
        const videos: VideoItem[] = (data.videos as InvidiousVideo[])
          .filter((v) => v && v.videoId && v.title && ((v.lengthSeconds !== undefined && v.lengthSeconds <= 90) || v.title.includes('#')))
          .map((v) => ({
            id: v.videoId,
            title: decodeHtmlEntities(v.title),
            publishedAt: typeof v.published === 'number' 
              ? new Date(v.published * 1000).toISOString() 
              : new Date().toISOString(),
            thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            videoUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
          }));

        if (videos.length > 0) {
          return videos;
        }
      }
    } catch {
      // ignore and try next
    }
  }
  return null;
}

export async function GET() {
  try {
    // 1. Try Invidious first
    const invidiousVideos = await fetchFromInvidious(CHANNEL_ID);
    if (invidiousVideos && invidiousVideos.length > 0) {
      return NextResponse.json({ videos: invidiousVideos.slice(0, 10) });
    }
  } catch (err) {
    console.error('Shorts invidious fetch error:', err);
  }

  // 2. Fall back to RSS XML (only entries with hashtags)
  try {
    const res = await fetch(RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*',
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const xml = await res.text();
      const entryMatches = xml.match(/<entry>([\s\S]*?)<\/entry>/g);
      
      if (entryMatches) {
        const videos: VideoItem[] = [];
        for (const entry of entryMatches) {
          const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
          const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
          const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
          const thumbnailMatch = entry.match(/<media:thumbnail\s+[^>]*url="([^"]+)"/);

          if (videoIdMatch && titleMatch) {
            const videoId = videoIdMatch[1].trim();
            const title = titleMatch[1].trim();
            
            // Only include Shorts (they have hashtags)
            if (!title.includes('#') && !title.toLowerCase().includes('shorts')) {
              continue;
            }

            const publishedAt = publishedMatch ? publishedMatch[1].trim() : new Date().toISOString();
            const thumbnail = thumbnailMatch ? thumbnailMatch[1].trim() : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            videos.push({
              id: videoId,
              title: decodeHtmlEntities(title),
              publishedAt,
              thumbnail,
              videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            });
          }
        }
        if (videos.length > 0) {
          return NextResponse.json({ videos: videos.slice(0, 10) });
        }
      }
    }
  } catch (error) {
    console.error('Shorts RSS error:', error);
  }

  // 3. Complete fallback
  return NextResponse.json({ videos: FALLBACK_SHORTS });
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
