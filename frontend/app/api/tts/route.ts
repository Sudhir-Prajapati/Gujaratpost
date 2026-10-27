import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text')?.trim() || '';
    const lang = searchParams.get('lang')?.trim() || 'gu';

    if (!text) {
      return new NextResponse('Missing text parameter', { status: 400 });
    }

    // Map language code to Google TTS language code
    const langCode = lang === 'hi' ? 'hi' : lang === 'en' ? 'en-IN' : 'gu';

    // Google Translate TTS URL
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
      langCode
    )}&q=${encodeURIComponent(text.slice(0, 200))}`;

    const res = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });

    if (!res.ok) {
      return new NextResponse(`Google TTS failed with status ${res.status}`, { status: res.status });
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error: any) {
    console.error('[TTS API Error]:', error);
    return new NextResponse('Internal TTS Error', { status: 500 });
  }
}
