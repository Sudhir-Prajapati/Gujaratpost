'use client';

import React from 'react';
import MobileModernArticleCard, { MobileModernArticleCardProps } from './MobileModernArticleCard';

export type { MobileModernArticleCardProps };

export default function MobileHeroArticleCard(props: MobileModernArticleCardProps) {
  return <MobileModernArticleCard {...props} />;
}
