import type { Metadata } from "next";
import { getPublicGallery } from "@/lib/api";
import PhotosClient from "./PhotosClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Latest News Photos | Photo Gallery News | Photo Stories | Gujarat Post",
  description: "Find latest news photos and galleries based on latest news, Bollywood, sports, lifestyle, politics and more on Gujarat Post.",
  keywords: [
    "Latest News Photos",
    "Photo Gallery News",
    "Photos of the Day",
    "News Photo Gallery",
    "ફોટો ગેલેરી",
    "Photo Stories",
    "Visual News",
    "Gujarat Post"
  ],
  alternates: {
    canonical: "https://www.gujaratpost.in/photos",
  },
  openGraph: {
    title: "Latest News Photos | Photo Gallery News | Photo Stories | Gujarat Post",
    description: "Find latest news photos and galleries based on latest news, Bollywood, sports, lifestyle, politics and more on Gujarat Post.",
    url: "https://www.gujaratpost.in/photos",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Latest News Photos | Photo Gallery News | Gujarat Post",
    description: "Find latest news photos and galleries based on latest news, Bollywood, sports, lifestyle, politics and more on Gujarat Post.",
  },
};

export default async function PhotosPage() {
  const photos = await getPublicGallery({ limit: 60 });
  return <PhotosClient initialPhotos={photos} />;
}
