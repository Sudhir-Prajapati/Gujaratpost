import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL } from "@/data";
import { getPublicGallery, getPublicGalleryPhoto, getPublicArticles } from "@/lib/api";
import { getOpenGraphImageUrl } from "@/lib/facebookShare";
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
    const imageUrl = getOpenGraphImageUrl(photo.src || (photo.images && photo.images[0]) || '');
    const canonicalUrl = `https://gujaratpost.in/photos/${photo.id || id}`;
    const cleanDesc = `View ${caption} and other latest news photos on Gujarat Post.`;

    return {
      title: `${caption} - Photo Gallery`,
      description: cleanDesc,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: `${caption} - Photo Gallery`,
        description: cleanDesc,
        url: canonicalUrl,
        siteName: "Gujarat Post",
        locale: "gu_IN",
        type: "article",
        images: [
          {
            url: imageUrl,
            secureUrl: imageUrl,
            width: 1200,
            height: 630,
            type: "image/jpeg",
            alt: caption,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        site: "@gujaratpostin",
        creator: "@gujaratpostin",
        title: `${caption} - Photo Gallery`,
        description: cleanDesc,
        images: [imageUrl],
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
    getPublicGallery({ limit: 50 }),
    getPublicArticles({ limit: 8, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 0 })),
  ]);

  const photo = photoById || (allPhotos || []).find((p: any) => p.id === id || p._id === id) || (allPhotos && allPhotos[0]);
  if (!photo) notFound();

  const trending = trendingRes?.articles || [];
  const photoUrl = `${SITE_URL}/photos/${photo.id || photo._id || id}`;

  return (
    <PhotoDetailClient
      activeId={id}
      photo={photo}
      allPhotos={allPhotos || []}
      trending={trending}
      photoUrl={photoUrl}
    />
  );
}
