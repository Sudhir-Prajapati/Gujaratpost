import { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';
import { getPublicCategories } from '@/lib/api';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const title = 'બધા સમાચાર વર્ગો | All News Categories - Gujarat Post';
  const description =
    'ગુજરાત, ભારત, વિશ્વ, રાજનીતિ, સ્પોર્ટ્સ, બિઝનેસ, મનોરંજન, ટેક્નોલોજી, હેલ્થ સહિતના તમામ કેટેગરીના સમાચારો.';
  const canonicalUrl = 'https://www.gujaratpost.in/categories';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'Gujarat Post',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CategoriesPage() {
  const categories = await getPublicCategories().catch(() => []);
  return <CategoriesClient initialCategories={Array.isArray(categories) ? categories : []} />;
}
