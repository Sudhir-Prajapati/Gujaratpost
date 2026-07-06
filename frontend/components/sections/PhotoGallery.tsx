'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PHOTOS, getLocalized } from '@/data';
import SectionHeader from '@/components/ui/SectionHeader';
import { useApp } from '@/components/AppProvider';

export default function PhotoGallery() {
  const { language } = useApp();
  const heights = [260, 180, 320, 220, 190, 280];
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/photos?limit=6')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.photos?.length > 0) {
          setPhotos(json.data.photos);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="py-3 animate-pulse">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="mb-4 h-6 w-48 rounded bg-muted/60" />
          <div className="masonry-grid">
            {heights.map((height, index) => (
              <div
                key={index}
                className="masonry-item rounded-xl bg-muted/40 border border-border/60"
                style={{ height }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const gallery = photos.length > 0 ? photos : PHOTOS.slice(0, 6);

  return (
    <section className="py-3">
      <div className="mx-auto max-w-screen-xl px-4">
        <SectionHeader title="Photo Gallery" titleGu="ફોટો ગેલેરી" titleHi="फोटो गैलरी" href="/photos" language={language} />
        <div className="masonry-grid">
          {gallery.map((photo, index) => (
            <Link
              key={photo.id}
              href={`/photos/${photo.id}`}
              className="masonry-item news-card group relative block w-full overflow-hidden rounded-xl"
              style={{ height: heights[index % heights.length] }}
            >
              <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
              <div className="img-overlay absolute inset-0 opacity-0 transition group-hover:opacity-100" />
              <p className="absolute inset-x-0 bottom-0 translate-y-3 p-3 text-sm font-black text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                {getLocalized(language, { en: photo.caption, gu: photo.captionGu, hi: photo.captionHi })}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
