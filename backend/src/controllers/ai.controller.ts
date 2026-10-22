import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';

// Helper to convert arrays or strings into clean comma-separated string
function toCommaSeparated(val: any): string {
  if (Array.isArray(val)) {
    return val
      .map((v) => String(v).trim())
      .filter(Boolean)
      .join(', ');
  }
  return typeof val === 'string' ? val.trim() : '';
}

// Helper to generate clean bilingual SEO metadata fallback if AI keys fail or timeout
function generateFallbackSeo(
  title: string,
  titleGu: string,
  categoryName: string,
  categoryNameGu: string,
  location: string
) {
  const promptTitle = title.trim();
  const promptTitleGu = (titleGu || '').trim();
  const promptCat = categoryName ? categoryName.trim() : 'News';
  const promptCatGu = categoryNameGu ? categoryNameGu.trim() : 'સમાચાર';
  const promptLoc = location ? location.trim() : 'Gujarat';
  const brandSuffix = 'gujaratpost news';

  // Symmetrical bilingual Title
  let seoTitle = '';
  if (promptTitleGu && promptTitle && promptTitleGu !== promptTitle) {
    seoTitle = `${promptTitleGu} | ${promptTitle} | ${brandSuffix}`;
  } else {
    seoTitle = `${promptTitleGu || promptTitle} | ${brandSuffix}`;
  }

  // Bilingual Description
  let seoDescription = '';
  if (promptTitleGu && promptTitle && promptTitleGu !== promptTitle) {
    seoDescription = `${promptTitleGu}. ${promptTitle} in ${promptLoc}. Latest updates on ${brandSuffix}.`;
  } else {
    seoDescription = `${promptTitleGu || promptTitle} in ${promptLoc}. Latest updates on ${brandSuffix}.`;
  }

  const keywords = [
    `${promptLoc.toLowerCase()} news`,
    `${promptCat.toLowerCase()} news`,
    'gujarat news',
    'gujaratpost news',
    'ગુજરાત સમાચાર',
    `${promptLoc} સમાચાર`,
    `${promptCatGu}`,
  ];
  if (promptTitleGu) keywords.unshift(promptTitleGu.slice(0, 45));
  if (promptTitle) keywords.unshift(promptTitle.slice(0, 45));

  const tags = [
    promptCat.toLowerCase(),
    promptLoc.toLowerCase(),
    'gujarat',
    'gujaratpost',
    'ગુજરાત',
    'સમાચાર',
  ];
  if (promptCatGu && promptCatGu !== promptCat) tags.push(promptCatGu);
  if (promptLoc) tags.push(promptLoc);

  return {
    seoTitle,
    seoDescription,
    seoKeywords: Array.from(new Set(keywords)).join(', '),
    tags: Array.from(new Set(tags)).join(', '),
  };
}

// Call Google Gemini API with Timeout & Markdown Cleanup
async function callGeminiApi(
  apiKey: string,
  promptTitle: string,
  promptTitleGu: string,
  promptCat: string,
  promptCatGu: string,
  promptLoc: string,
  promptSnippet: string
) {
  const models = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

  const promptText = `You are a professional Bilingual SEO Expert for Gujarat Post (gujaratpost.in), the top Gujarati news portal in India.
Your mission is to generate high-ranking, high-CTR BILINGUAL (both Gujarati and English) SEO metadata for this news story.

Article Title (Gujarati): "${promptTitleGu || promptTitle}"
Article Title (English): "${promptTitle || promptTitleGu}"
Category: "${promptCatGu ? `${promptCat} / ${promptCatGu}` : promptCat}"
Location: "${promptLoc}"
Story Summary: "${promptSnippet}"

CRITICAL INSTRUCTIONS - EVERY FIELD MUST HAVE BOTH GUJARATI AND ENGLISH:
1. "seoTitle": High-CTR headline combining Gujarati keywords and English keywords separated by " | ", ending with "gujaratpost news" (under 90 characters).
   Example: "ગુજરાતમાં પૂરથી 30નાં મોત | Gujarat Flood Rain Havoc | gujaratpost news"
2. "seoDescription": Meta description (130-160 chars) summarizing key story with sentences in BOTH Gujarati and English.
   Example: "ગુજરાતમાં ભારે વરસાદ અને પૂરથી 30નાં મોત. Severe Gujarat flood claims 30 lives following continuous heavy rainfall. Latest updates on Gujarat Post."
3. "seoKeywords": Comma-separated list containing 10-15 keywords with BALANCED Gujarati and English search terms.
   Example: "ગુજરાત પૂર, અમદાવાદ વરસાદ, ભારે વરસાદ, ગુજરાત સમાચાર, Gujarat flood news, Ahmedabad rainfall, Gujarat rain update, Gujarat flood deaths, Gujarat Post news"
4. "tags": Comma-separated list of 8-12 clean tags in BOTH Gujarati and English.
   Example: "Gujarat, Ahmedabad, Flood, Rain, Monsoon, ગુજરાત, અમદાવાદ, પૂર, વરસાદ, ગુજરાત સમાચાર"
5. "slug": Meaningful, accurate English News Name / slug translating the headline with words joined by hyphens (under 90 characters).
   Example for "ડ્રગ્સને લઇને મોટું ઓપરેશન, અમદાવાદ અને સુરત ક્રાઇમ બ્રાન્ચે 25 કરોડ રૂપિયાનું ડ્રગ્સ ઝડપી પાડ્યું": "Major-operation-regarding-drugs:-Ahmedabad-and-Surat-Crime-Branches-seize-drugs-worth-Rs-25-crore"

Return ONLY a valid JSON object with the exact 5 keys: "seoTitle", "seoDescription", "seoKeywords", "tags", "slug".`;

  let lastError: any = null;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text();
        lastError = new Error(`Gemini API Error (${res.status}): ${errText}`);
        continue;
      }

      const json: any = await res.json();
      const parts = json.candidates?.[0]?.content?.parts || [];
      const finalPart = parts.find((p: any) => !p.thought && p.text) || parts[parts.length - 1];
      const textStr = finalPart?.text;
      if (!textStr) continue;

      const cleanText = textStr.replace(/^```json\s*/gi, '').replace(/\s*```$/gi, '').trim();
      const parsed = JSON.parse(cleanText);

      return {
        seoTitle: typeof parsed.seoTitle === 'string' ? parsed.seoTitle.trim() : '',
        seoDescription: typeof parsed.seoDescription === 'string' ? parsed.seoDescription.trim() : '',
        seoKeywords: toCommaSeparated(parsed.seoKeywords),
        tags: toCommaSeparated(parsed.tags),
        slug: typeof parsed.slug === 'string' ? parsed.slug.trim().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') : '',
      };
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate content with Google Gemini API.');
}

export class AiController {
  /**
   * Generate high-ranking bilingual SEO metadata using Google Gemini AI (100% FREE).
   * Guarantees HTTP 200 output with zero socket hang ups.
   */
  static async generateSeo(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, titleGu, titleHi, categoryName, categoryNameGu, location, content, contentGu } = req.body || {};

      const promptTitle = (title || titleGu || '').trim();
      const promptTitleGu = (titleGu || '').trim();
      const promptCat = categoryName ? String(categoryName).trim() : 'News';
      const promptCatGu = categoryNameGu ? String(categoryNameGu).trim() : '';
      const promptLoc = location ? String(location).trim() : 'Gujarat';
      const promptSnippet = (contentGu || content || '').slice(0, 300).trim();

      if (!promptTitle && !promptTitleGu) {
        return sendError(res, 'Article title is required to generate SEO metadata.', 400);
      }

      const geminiApiKey = process.env.GEMINI_API_KEY || '';

      if (!geminiApiKey) {
        const fallbackData = generateFallbackSeo(promptTitle, promptTitleGu, promptCat, promptCatGu, promptLoc);
        return sendSuccess(res, fallbackData, 'SEO details generated successfully.');
      }

      try {
        const parsed = await callGeminiApi(
          geminiApiKey,
          promptTitle,
          promptTitleGu,
          promptCat,
          promptCatGu,
          promptLoc,
          promptSnippet
        );
        return sendSuccess(
          res,
          {
            seoTitle: parsed.seoTitle || generateFallbackSeo(promptTitle, promptTitleGu, promptCat, promptCatGu, promptLoc).seoTitle,
            seoDescription: parsed.seoDescription || generateFallbackSeo(promptTitle, promptTitleGu, promptCat, promptCatGu, promptLoc).seoDescription,
            seoKeywords: parsed.seoKeywords || generateFallbackSeo(promptTitle, promptTitleGu, promptCat, promptCatGu, promptLoc).seoKeywords,
            tags: parsed.tags || generateFallbackSeo(promptTitle, promptTitleGu, promptCat, promptCatGu, promptLoc).tags,
            slug: parsed.slug || '',
            provider: 'Google Gemini AI',
          },
          'AI SEO details generated successfully with Google Gemini AI.'
        );
      } catch (geminiErr: any) {
        console.warn('[Gemini AI Auto-Recovered Notice]:', geminiErr?.message || geminiErr);
        const fallbackData = generateFallbackSeo(promptTitle, promptTitleGu, promptCat, promptCatGu, promptLoc);
        return sendSuccess(res, fallbackData, 'SEO details generated successfully.');
      }
    } catch (error: any) {
      console.warn('[AiController.generateSeo Emergency Catch]:', error?.message || error);
      const { title, titleGu, categoryName, categoryNameGu, location } = req.body || {};
      const fallbackData = generateFallbackSeo(title || 'News', titleGu || '', categoryName || 'News', categoryNameGu || '', location || 'Gujarat');
      return sendSuccess(res, fallbackData, 'SEO details generated successfully.');
    }
  }
}

