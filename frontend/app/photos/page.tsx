import type { Metadata } from "next";
import { getPublicGallery } from "@/lib/api";
import PhotosClient from "./PhotosClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Photo Gallery",
  description: "Browse the latest Gujarat news photo gallery on Gujarat Post.",
};

export default async function PhotosPage() {
  const photos = await getPublicGallery();
  return <PhotosClient initialPhotos={photos} />;
}
