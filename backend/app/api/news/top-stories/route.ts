import { NextRequest, NextResponse } from "next/server";
import { ARTICLES } from "@/data";
import { ApiError } from "@/server/utils/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    const featuredArticles = ARTICLES.filter((art) => art.isFeatured).slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        articles: featuredArticles,
      },
    });
  } catch (err) {
    return ApiError(err);
  }
}
