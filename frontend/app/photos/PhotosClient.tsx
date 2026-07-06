'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PHOTOS, getLocalized } from '@/data';
import { useApp } from '@/components/AppProvider';

interface PhotosClientProps {
  initialPhotos: any[];
}

export default function PhotosClient({ initialPhotos }: PhotosClientProps) {
  const { language } = useApp();
  const gallery = initialPhotos.length > 0 ? initialPhotos : PHOTOS;
  const heights = [220, 170, 290, 210, 190, 260];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-black text-foreground">{getLocalized(language, { en: 'Photo Gallery', gu: 'ફોટો ગેલેરી', hi: 'फोटो गैलरी' })}</h1>
        <p className="text-sm font-semibold text-muted-foreground">{getLocalized(language, { en: 'Latest Gujarat news moments in pictures.', gu: 'ગુજરાતના તાજા સમાચારના દૃશ્યો.', hi: 'गुजरात की ताजा खबरों की तस्वीरें.' })}</p>
      </header>
      <div className="masonry-grid">
        {gallery.map((photo, index) => (
          <Link key={`${photo.id}-${index}`} href={`/photos/${photo.id}`} className="masonry-item news-card group relative block w-full overflow-hidden rounded-lg" style={{ height: heights[index % heights.length] }}>
            <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
            <div className="img-overlay absolute inset-0 opacity-0 transition group-hover:opacity-100" />
            <p className="absolute inset-x-0 bottom-0 translate-y-3 p-3 text-sm font-black text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
              {getLocalized(language, { en: photo.caption, gu: photo.captionGu, hi: photo.captionHi })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
