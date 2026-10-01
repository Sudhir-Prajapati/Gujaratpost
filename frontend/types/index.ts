export interface Author {
  id: string;
  name: string;
  nameGu?: string;
  nameHi?: string;
  image?: string;
  designation?: string;
  designationGu?: string;
  designationHi?: string;
  bio?: string;
  bioGu?: string;
  bioHi?: string;
}

export interface Article {
  id: string;
  slug: string;
  articleNumber?: number;
  title: string;
  titleGu?: string;
  titleHi?: string;
  excerpt: string;
  excerptGu?: string;
  excerptHi?: string;
  content: string;
  contentGu?: string;
  contentHi?: string;
  image: string;
  category: string;
  categorySlug?: string;
  categoryGu?: string;
  categoryHi?: string;
  location?: string;
  tags: string[];
  tagsGu?: string[];
  tagsHi?: string[];
  author: Author;
  publishedAt: string;
  createdAt?: string;
  updatedAt: string;
  readingTime?: number;
  isTrending?: boolean;
  isBreaking?: boolean;
  isFeatured?: boolean;
  views: number;
  isLive?: boolean;
  relativeTime?: string;
  relativeTimeGu?: string;
  relativeTimeHi?: string;
}

export interface Video {
  id: string;
  title: string;
  titleGu: string;
  titleHi: string;
  thumbnail: string;
  youtubeId: string;
  duration: string;
  type: 'video' | 'short' | 'podcast' | 'interview';
  publishedAt: string;
  views: number;
  description?: string;
  category?: string;
  isFeatured?: boolean;
}

export interface Photo {
  id: string;
  src: string;
  alt: string;
  caption: string;
  captionGu: string;
  captionHi: string;
}

export type Language = 'gu' | 'en' | 'hi';
export type Theme = 'light' | 'dark';

export interface NavItem {
  label: string;
  labelGu: string;
  labelHi: string;
  href: string;
  children?: NavItem[];
}
