const CHANNEL_ID = 'UCqQ8YbFSZ4j8J4iVJOHurTw';

export async function GET() {
  let isLive = false;
  let error: string | null = null;

  try {
    // YouTube live stream embed returns a redirect or an error page when not live.
    // We check the channel's live page for the presence of a live video.
    const res = await fetch(
      `https://www.youtube.com/channel/${CHANNEL_ID}/live`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        next: { revalidate: 60 }, // cache for 1 minute
        signal: AbortSignal.timeout(5000),
      }
    );

    if (res.ok) {
      const html = await res.text();
      // YouTube sets "isLive":true or "liveBroadcastContent":"live" in the page JSON
      isLive =
        html.includes('"isLive":true') ||
        html.includes('"liveBroadcastContent":"live"');
    } else {
      error = `YouTube returned status ${res.status}`;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return Response.json(
    { isLive, error, checkedAt: new Date().toISOString() },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  );
}
