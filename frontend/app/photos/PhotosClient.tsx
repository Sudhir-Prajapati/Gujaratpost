'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { PHOTOS, getLocalized } from '@/data';
import { useApp } from '@/components/AppProvider';

const FALLBACK_NEWS_IMAGES = [
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=90',
];

function PhotoCardImage({ src: rawSrc, alt, index }: { src?: string; alt: string; index: number }) {
  const fallback = FALLBACK_NEWS_IMAGES[index % FALLBACK_NEWS_IMAGES.length];
  const [src, setSrc] = useState(rawSrc || fallback);

  useEffect(() => {
    setSrc(rawSrc || fallback);
  }, [rawSrc, fallback]);

  return (
    <Image 
      src={src} 
      alt={alt} 
      fill 
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" 
      className="object-cover transition-all duration-700 ease-out group-hover:scale-[1.08] group-hover:rotate-1" 
      onError={() => setSrc(fallback)}
    />
  );
}

interface PhotosClientProps {
  initialPhotos: any[];
}

export default function PhotosClient({ initialPhotos }: PhotosClientProps) {
  const { language } = useApp();
  let photoList = [...(initialPhotos || [])];
  if (photoList.length < 5) {
    const existingIds = new Set(photoList.map(p => p.id || p.src));
    for (const defPhoto of PHOTOS) {
      if (photoList.length >= 5) break;
      if (!existingIds.has(defPhoto.id) && !existingIds.has(defPhoto.src)) {
        photoList.push(defPhoto);
      }
    }
  }
  const gallery = photoList;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const getGridClasses = (index: number) => {
    const mod = index % 9;
    switch (mod) {
      case 0:
        return 'md:col-span-2 md:h-[240px]';
      case 4:
        return 'md:col-span-2 md:h-[240px]';
      case 8:
        return 'md:col-span-2 md:h-[240px]';
      default:
        return 'md:col-span-1 md:h-[240px]';
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <header className="mb-8 border-b border-border/60 pb-5">
        <h1 className="text-3xl font-black text-foreground tracking-tight">
          {getLocalized(language, { en: 'Photo Gallery', gu: 'ફોટો ગેલેરી', hi: 'फोटो गैलरी' })}
        </h1>
        <p className="text-sm font-semibold text-muted-foreground mt-1.5">
          {getLocalized(language, { 
            en: 'Latest Gujarat news moments in pictures.', 
            gu: 'ગુજરાતના તાજા સમાચારના દૃશ્યો.', 
            hi: 'गुजरात की ताजा खबरों की तस्वीरें.' 
          })}
        </p>
      </header>

      {/* Modern Bento Asymmetrical Grid matching Homepage style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {gallery.map((photo, index) => {
          const mockCount = ((index * 7 + 12) % 35) + 8;
          return (
            <Link 
              key={`${photo.id}-${index}`} 
              href={`/photos/${photo.id}`} 
              className={`group relative block w-full overflow-hidden rounded-2xl shadow-md border border-border/10 bg-card aspect-[16/10.5] md:aspect-auto transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#B3121B]/12 hover:border-[#B3121B]/35 ${getGridClasses(index)}`}
            >
              <PhotoCardImage 
                src={photo.src} 
                alt={photo.alt || 'Gallery Photo'} 
                index={index}
              />
              {/* Soft dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/5" />

              {/* Photo Count Badge */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-red-600/90 text-white backdrop-blur-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-md">
                <Camera className="h-3 w-3" />
                <span>{mockCount} {getLocalized(language, { en: 'Photos', gu: 'ફોટા', hi: 'तस्वीरें' })}</span>
              </div>

              {/* Title overlay */}
              <div className="absolute bottom-0 inset-x-0 p-4 pt-8 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
                <h2 className="text-white text-[14px] md:text-[15px] font-black leading-snug line-clamp-2 drop-shadow select-none transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
                  {getLocalized(language, { en: photo.caption, gu: photo.captionGu, hi: photo.captionHi })}
                </h2>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
