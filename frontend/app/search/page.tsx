import type { Metadata } from 'next';
import SearchResultsClient from './SearchResultsClient';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search Gujarat Post news, categories and reports.',
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] ?? '' : params.q ?? '';
  return <SearchResultsClient initialQuery={query} />;
}
