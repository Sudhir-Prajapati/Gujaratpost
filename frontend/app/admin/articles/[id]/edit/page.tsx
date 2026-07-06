'use client';

import { use } from 'react';
import ArticleForm from '@/components/sections/ArticleForm';

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = use(params);
  return <ArticleForm articleId={id} />;
}
