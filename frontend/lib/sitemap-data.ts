import { getPublicCategories } from '@/lib/api';
import { isHiddenFromNavbar } from '@/lib/header-navigation';
import { companyLinks } from '@/lib/company-links';

export interface SitemapCategory {
  slug: string;
  name?: string;
  nameGu?: string;
  nameHi?: string;
  nameEn?: string;
  isActive?: boolean;
  headerType?: string;
  headerOrder?: number;
  displayOrder?: number;
  showInHeader?: boolean;
}
export interface SitemapCompanyLink { label: string; href: string; action?: 'cookie-settings' }
export interface SitemapData { categories: SitemapCategory[]; company: SitemapCompanyLink[] }

export function selectHeaderCategories(categories: SitemapCategory[]): SitemapCategory[] {
  const order = (a: SitemapCategory, b: SitemapCategory) => (b.headerOrder ?? b.displayOrder ?? 0) - (a.headerOrder ?? a.displayOrder ?? 0);
  const active = categories.filter((c) => c.isActive !== false && c.showInHeader !== false && c.slug?.trim());
  const main = active.filter((c) => c.headerType !== 'GUJARAT' && !isHiddenFromNavbar(c) && !['home', 'main'].includes(c.slug)).sort(order);
  const cities = active.filter((c) => c.headerType === 'GUJARAT').sort(order);
  cities.sort((a, b) => a.slug === 'ahmedabad' ? -1 : b.slug === 'ahmedabad' ? 1 : 0);
  const seen = new Set<string>();
  return [...main, ...cities].filter((c) => {
    const key = c.slug.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((c) => ({ ...c, slug: c.slug.trim().toLowerCase(), name: c.nameEn || c.name }));
}

export async function getSitemapData(): Promise<SitemapData> {
  const categories = await getPublicCategories({ showInHeader: true });
  return {
    categories: selectHeaderCategories(categories),
    company: [
      ...companyLinks.filter((item) => !['/feedback', '/cookie-policy'].includes(item.href)),
      { label: 'Complaint Redressal', href: '/complaign-redressal' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'Cookie Settings', href: '/cookie-settings', action: 'cookie-settings' },
    ],
  };
}
