import type { Metadata } from "next";
import { PHOTOS } from "@/data";
import PhotosClient from "./PhotosClient";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description: "Browse the latest Gujarat news photo gallery on Gujarat Post.",
};

export default async function PhotosPage() {
  return <PhotosClient initialPhotos={PHOTOS} />;
}
