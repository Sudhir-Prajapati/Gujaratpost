import type { Article } from '@/types';

function cleanStringForComparison(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function cleanSlug(slug: string | undefined | null): string {
  if (!slug) return '';
  try {
    return decodeURIComponent(String(slug)).toLowerCase().trim().replace(/^\/+|\/+$/g, '');
  } catch {
    return String(slug).toLowerCase().trim().replace(/^\/+|\/+$/g, '');
  }
}

/**
 * Returns true if article `a` matches article `b` by ID, MongoDB _id, slug, or title (in English or Gujarati).
 */
export function isSameArticle(a: any, b: any): boolean {
  if (!a || !b) return false;

  const aId = String(a.id || a._id || '').trim();
  const bId = String(b.id || b._id || '').trim();
  if (aId && bId && aId === bId) return true;

  const aSlug = cleanSlug(a.slug);
  const bSlug = cleanSlug(b.slug);
  if (aSlug && bSlug && aSlug === bSlug) return true;

  const aTitleGu = cleanStringForComparison(a.titleGu || a.title);
  const bTitleGu = cleanStringForComparison(b.titleGu || b.title);
  if (aTitleGu && bTitleGu) {
    if (aTitleGu === bTitleGu) return true;
    if (aTitleGu.length > 20 && bTitleGu.length > 20 && (aTitleGu.includes(bTitleGu) || bTitleGu.includes(aTitleGu))) {
      return true;
    }
  }

  const aTitle = cleanStringForComparison(a.title);
  const bTitle = cleanStringForComparison(b.title);
  if (aTitle && bTitle) {
    if (aTitle === bTitle) return true;
    if (aTitle.length > 20 && bTitle.length > 20 && (aTitle.includes(bTitle) || bTitle.includes(aTitle))) {
      return true;
    }
  }

  return false;
}

/**
 * Filter an array of candidate articles to guarantee:
 * 1. None of the candidates match any article in `excludeArticles` (e.g. active article, most read, etc.)
 * 2. No duplicates within the returned list (by ID, slug, or normalized title)
 */
export function filterUniqueArticles(
  candidates: Article[],
  excludeArticles: (Article | null | undefined)[] = []
): Article[] {
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenTitles = new Set<string>();

  for (const ex of excludeArticles) {
    if (!ex) continue;
    const id = String(ex.id || (ex as any)._id || '').trim();
    const slug = cleanSlug(ex.slug);
    const title = cleanStringForComparison(ex.title);
    const titleGu = cleanStringForComparison(ex.titleGu || ex.title);

    if (id) seenIds.add(id);
    if (slug) seenSlugs.add(slug);
    if (title) seenTitles.add(title);
    if (titleGu) seenTitles.add(titleGu);
  }

  const result: Article[] = [];

  for (const cand of candidates) {
    if (!cand) continue;
    const candId = String(cand.id || (cand as any)._id || '').trim();
    const candSlug = cleanSlug(cand.slug);
    const candTitle = cleanStringForComparison(cand.title);
    const candTitleGu = cleanStringForComparison(cand.titleGu || cand.title);

    // Skip if matched against excluded articles or already added to result
    if (candId && seenIds.has(candId)) continue;
    if (candSlug && seenSlugs.has(candSlug)) continue;
    if (candTitle && seenTitles.has(candTitle)) continue;
    if (candTitleGu && seenTitles.has(candTitleGu)) continue;

    // Check substring similarity for long titles (prevents republished duplicates)
    let isDuplicateTitle = false;
    for (const seenT of seenTitles) {
      if (
        (candTitleGu.length > 20 && seenT.length > 20 && (candTitleGu.includes(seenT) || seenT.includes(candTitleGu))) ||
        (candTitle.length > 20 && seenT.length > 20 && (candTitle.includes(seenT) || seenT.includes(candTitle)))
      ) {
        isDuplicateTitle = true;
        break;
      }
    }
    if (isDuplicateTitle) continue;

    if (candId) seenIds.add(candId);
    if (candSlug) seenSlugs.add(candSlug);
    if (candTitle) seenTitles.add(candTitle);
    if (candTitleGu) seenTitles.add(candTitleGu);

    result.push(cand);
  }

  return result;
}

