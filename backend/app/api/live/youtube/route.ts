
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

// Fallback data matching the look of the channel
const FALLBACK_VIDEOS: VideoItem[] = [
  {
    id: 'sA6BrUmBXiA',
    title: 'ધી સાબરકાંઠા જિલ્લા સહકારી ખરીદ વેચાણ સંઘ બન્યો ભ્રષ્ટાચારનો અડ્ડો ! આવી રીતે થાય છે લાખોની ઉચાપત',
    publishedAt: '2026-06-10T05:34:27.000Z',
    thumbnail: 'https://i.ytimg.com/vi/sA6BrUmBXiA/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=sA6BrUmBXiA',
  },
  {
    id: 'rQHoqCTiQvI',
    title: 'કપડવંજ TDO કચેરીમાં ભ્રષ્ટાચારનો સડો, સાંભળો- વિસ્તરણ અધિકારીએ ગરીબોને લૂંટવા વચેટિયાને આપ્યો  આદેશ',
    publishedAt: '2026-06-10T05:34:27.000Z',
    thumbnail: 'https://i.ytimg.com/vi/rQHoqCTiQvI/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=rQHoqCTiQvI',
  },
  {
    id: 'WF2Kuec5HV0',
    title: 'વડોદરાના AAP નેતાનું પાપ, ચાર વર્ષ સુધી પક્ષની મહિલા સાથે દુષ્કર્મ આચર્યું, અશ્લિલ વીડિયો બનાવ્યાં',
    publishedAt: '2026-06-03T05:34:27.000Z',
    thumbnail: 'https://i.ytimg.com/vi/WF2Kuec5HV0/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=WF2Kuec5HV0',
  },
  {
    id: 'LDDtOMwdJ_0',
    title: 'રાજકોટમાં IPS એ પત્રકારની ગુદામાં પ્રવેશ કર્યો ? આ સિનિયર પત્રકારે સંઘવીને કેમ નિષ્ફળ કહ્યાં !',
    publishedAt: '2026-04-01T05:34:27.000Z',
    thumbnail: 'https://i.ytimg.com/vi/LDDtOMwdJ_0/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=LDDtOMwdJ_0',
  },
  {
    id: '-iXZuFoHqiw',
    title: 'સંમેલન SPG નું કે ભાજપનું ? નીતિન પટેલે ભાજપની વાહવાહી કરી, કોઇએ કહ્યું  કે મોદી ભક્તોના મગજ બંધ છે',
    publishedAt: '2026-04-01T05:34:27.000Z',
    thumbnail: 'https://i.ytimg.com/vi/-iXZuFoHqiw/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=-iXZuFoHqiw',
  },
  {
    id: 'uJalvs-jgFc',
    title: 'ભાજપ સરકારના ભુક્કા કાઢી નાખ્યાં, સાણંદ દારુ પાર્ટી મુદ્દે શંકરસિંહ વાઘેલા તો સરકાર સામે બગડ્યાં',
    publishedAt: '2026-03-01T05:34:27.000Z',
    thumbnail: 'https://i.ytimg.com/vi/uJalvs-jgFc/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=uJalvs-jgFc',
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
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
          'Accept': 'application/json',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
        signal: AbortSignal.timeout(4000), // Timeout quickly to switch instance if one is slow or down
      });

      if (!res.ok) {
        console.warn(`Invidious instance ${instance} returned status ${res.status}`);
        continue;
      }

      const data = await res.json();
      
      if (data && Array.isArray(data.videos)) {
        const videos: VideoItem[] = (data.videos as InvidiousVideo[])
          .filter((v) => v && v.videoId && v.title && (v.lengthSeconds === undefined || v.lengthSeconds > 60 || v.liveNow) && !v.title.includes('#'))
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
          console.log(`Successfully fetched ${videos.length} videos from Invidious instance: ${instance}`);
          return videos;
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch from Invidious instance ${instance}:`, err instanceof Error ? err.message : err);
    }
  }
  return null;
}

// Helper function to pad videos list with unique fallback videos up to the target limit
function padVideos(fetched: VideoItem[], fallbackList: VideoItem[], limit = 6): VideoItem[] {
  const result = [...fetched];
  const seenIds = new Set(result.map(v => v.id));
  
  for (const item of fallbackList) {
    if (result.length >= limit) break;
    if (!seenIds.has(item.id)) {
      result.push(item);
      seenIds.add(item.id);
    }
  }
  
  return result.slice(0, limit);
}

export async function GET() {
  // 1. Try RSS feed first (more reliable, direct from YouTube, and highly up-to-date)
  try {
    const res = await fetch(RSS_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      throw new Error(`YouTube RSS returned status ${res.status}`);
    }

    const xml = await res.text();
    
    // Parse using regex to avoid external dependency issues
    const entryMatches = xml.match(/<entry>([\s\S]*?)<\/entry>/g);
    
    if (!entryMatches || entryMatches.length === 0) {
      throw new Error('No entries found in YouTube RSS XML');
    }

    const videos: VideoItem[] = [];

    for (const entry of entryMatches) {
      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
      const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
      const thumbnailMatch = entry.match(/<media:thumbnail\s+[^>]*url="([^"]+)"/);

      // We need at least video ID and Title to make a card
      if (videoIdMatch && titleMatch) {
        const videoId = videoIdMatch[1].trim();
        const title = titleMatch[1].trim();
        
        // Filter out YouTube Shorts / Reels (they always have hashtags like #shorts or similar)
        if (title.includes('#')) {
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

    if (videos.length === 0) {
      throw new Error('Failed to parse any videos from YouTube RSS XML');
    }

    const padded = padVideos(videos, FALLBACK_VIDEOS, 6);
    return Response.json({ videos: padded, source: 'youtube_rss' });
  } catch (error) {
    console.error('Error fetching YouTube RSS feed, falling back to Invidious:', error);
  }

  // 2. Fall back to Invidious
  try {
    const invidiousVideos = await fetchFromInvidious(CHANNEL_ID);
    if (invidiousVideos && invidiousVideos.length > 0) {
      const padded = padVideos(invidiousVideos, FALLBACK_VIDEOS, 6);
      return Response.json({ 
        videos: padded, 
        source: 'invidious' 
      });
    }
  } catch (invidiousError) {
    console.error('Invidious fetch failed:', invidiousError);
  }

  // 3. Complete fallback
  return Response.json({ 
    videos: FALLBACK_VIDEOS, 
    source: 'fallback_error'
  });
}

// Basic helper to clean XML entities in title
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
