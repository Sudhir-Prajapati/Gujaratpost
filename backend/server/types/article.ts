// ---------------------------------------------------------------------------
// Article DTOs (Data Transfer Objects)
// ---------------------------------------------------------------------------

export interface ArticleCreateDTO {
  title: string;
  titleGu?: string;
  titleHi?: string;
  slug: string;
  excerpt: string;
  content: string;
  image?: string;
  category: string;
  tags?: string[];
  authorId: string;
  isFeatured?: boolean;
  isBreaking?: boolean;
}

export interface ArticleUpdateDTO extends Partial<ArticleCreateDTO> {
  id: string;
}

export interface ArticlePublishDTO {
  id: string;
  publishedAt?: Date;
}
