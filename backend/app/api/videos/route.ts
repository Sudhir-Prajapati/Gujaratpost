import { NextRequest, NextResponse } from "next/server";
import { VIDEOS } from "@/data";
import { ApiError } from "@/server/utils/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const type = searchParams.get("type") || undefined; // video | short | podcast | interview

    const skip = (page - 1) * limit;

    let filteredVideos = VIDEOS;
    if (type) {
      filteredVideos = VIDEOS.filter((v) => v.type === type);
    }

    const videos = filteredVideos.slice(skip, skip + limit);
    const total = filteredVideos.length;

    return NextResponse.json({
      success: true,
      data: {
        videos,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return ApiError(err);
  }
}
