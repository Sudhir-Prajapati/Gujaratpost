import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL } from "@/data";
import { getPublicGallery, getPublicGalleryPhoto, getPublicArticles } from "@/lib/api";
import PhotoDetailClient from "./PhotoDetailClient";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const photos = await getPublicGallery({ limit: 30 });
    return (photos || []).map((photo) => ({ id: photo.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const photo = await getPublicGalleryPhoto(id);
    if (!photo) return {};

    const caption = photo.captionGu || photo.caption || photo.alt || "Photo Gallery";
    return {
      title: `${caption} - Photo Gallery`,
      description: `View ${caption} and other latest news photos on Gujarat Post.`,
      openGraph: {
        title: `${caption} - Photo Gallery`,
        description: `View ${caption} and other latest news photos on Gujarat Post.`,
        images: [{ url: photo.src, alt: caption }],
      },
    };
  } catch {
    return {};
  }
}

export default async function PhotoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Fetch photo details from backend API (by ID first, with gallery pool fallback)
  const [photoById, allPhotos, trendingRes] = await Promise.all([
    getPublicGalleryPhoto(id),
    getPublicGallery({ limit: 30 }),
    getPublicArticles({ isTrending: true, limit: 6 }).catch(() => ({ articles: [] })),
  ]);

  const photo = photoById || allPhotos.find((p) => p.id === id) || allPhotos[0];
  if (!photo) notFound();

  const trending = trendingRes?.articles || [];
  const photoUrl = `${SITE_URL}/photos/${photo.id}`;

  return (
    <PhotoDetailClient
      activeId={id}
      photo={photo}
      allPhotos={allPhotos}
      trending={trending}
      photoUrl={photoUrl}
    />
  );
}
