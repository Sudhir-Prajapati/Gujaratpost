import { NextRequest, NextResponse } from "next/server";
import { ARTICLES } from "@/data";
import { ApiError } from "@/server/utils/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "6", 10);

    const topArticles = ARTICLES.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        articles: topArticles,
      },
    });
  } catch (err) {
    return ApiError(err);
  }
}
