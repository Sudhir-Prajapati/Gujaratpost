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

    let speechText = text;
    const isGujaratiScript = /[\u0A80-\u0AFF]/.test(speechText);
    const isDevanagariScript = /[\u0900-\u097F]/.test(speechText);

    // Safeguard against mixed-up voices:
    // If requested voice is Hindi ('hi') but text is in Gujarati script, translate to Hindi
    if (lang === 'hi' && isGujaratiScript) {
      try {
        const trUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=gu&tl=hi&dt=t&q=${encodeURIComponent(
          speechText.slice(0, 300)
        )}`;
        const trRes = await fetch(trUrl, { cache: 'force-cache' });
        if (trRes.ok) {
          const trData = await trRes.json();
          if (trData && trData[0] && Array.isArray(trData[0])) {
            const translated = trData[0].map((c: any) => c[0] || '').join('');
            if (translated && /[\u0900-\u097F]/.test(translated)) {
              speechText = translated;
            }
          }
        }
      } catch {}
    } else if (lang === 'gu' && isDevanagariScript && !isGujaratiScript) {
      // If requested voice is Gujarati ('gu') but text is in Devanagari script, translate to Gujarati
      try {
        const trUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=hi&tl=gu&dt=t&q=${encodeURIComponent(
          speechText.slice(0, 300)
        )}`;
        const trRes = await fetch(trUrl, { cache: 'force-cache' });
        if (trRes.ok) {
          const trData = await trRes.json();
          if (trData && trData[0] && Array.isArray(trData[0])) {
            const translated = trData[0].map((c: any) => c[0] || '').join('');
            if (translated && /[\u0A80-\u0AFF]/.test(translated)) {
              speechText = translated;
            }
          }
        }
      } catch {}
    }

    // Determine target voice language code
    // If text is still Gujarati after all checks, use 'gu' to guarantee clear pronunciation
    let langCode = lang === 'hi' ? 'hi' : lang === 'en' ? 'en-IN' : 'gu';
    if (lang === 'hi' && /[\u0A80-\u0AFF]/.test(speechText) && !/[\u0900-\u097F]/.test(speechText)) {
      langCode = 'gu';
    } else if (lang === 'gu' && /[\u0900-\u097F]/.test(speechText) && !/[\u0A80-\u0AFF]/.test(speechText)) {
      langCode = 'hi';
    }

    // Google Translate TTS URL (max 200 chars per chunk)
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
      langCode
    )}&q=${encodeURIComponent(speechText.slice(0, 200))}`;

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
