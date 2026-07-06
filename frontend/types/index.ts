export interface Author {
  id: string;
  name: string;
  nameGu: string;
  nameHi: string;
  image: string;
  designation: string;
  designationGu: string;
  designationHi: string;
  bio: string;
  bioGu: string;
  bioHi: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  titleGu: string;
  titleHi: string;
  excerpt: string;
  excerptGu: string;
  excerptHi: string;
  content: string;
  contentGu: string;
  contentHi: string;
  image: string;
  category: string;
  categoryGu: string;
  categoryHi: string;
  tags: string[];
  tagsGu: string[];
  tagsHi: string[];
  author: Author;
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  isTrending: boolean;
  isBreaking: boolean;
  isFeatured: boolean;
  views: number;
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
