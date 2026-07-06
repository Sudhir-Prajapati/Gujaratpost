import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PHOTOS, ARTICLES } from "@/data";
import PhotoDetailClient from "./PhotoDetailClient";

export async function generateStaticParams() {
  return PHOTOS.map((photo) => ({ id: photo.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const photo = PHOTOS.find((p) => p.id === id);
  if (!photo) return {};

  return {
    title: `${photo.caption} - Photo Gallery`,
    description: `View ${photo.caption} and other latest news photos on Gujarat Post.`,
    openGraph: {
      title: `${photo.caption} - Photo Gallery`,
      description: `View ${photo.caption} and other latest news photos on Gujarat Post.`,
      images: [{ url: photo.src, alt: photo.caption }],
    },
  };
}

export default async function PhotoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Fetch photo details from mock data
  const photo = PHOTOS.find((p) => p.id === id);
  if (!photo) notFound();

  // 2. Use all photos for carousel navigation list
  const allPhotos = PHOTOS;

  // 3. Fetch trending articles from mock data
  const trending = ARTICLES.filter((a) => a.isTrending).slice(0, 6);

  return (
    <PhotoDetailClient
      activeId={id}
      photo={photo}
      allPhotos={allPhotos}
      trending={trending}
    />
  );
}
