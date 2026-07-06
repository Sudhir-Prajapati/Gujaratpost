import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_META, getArticlesByCategory } from "@/data";
import { ApiError } from "@/server/utils/response";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params;
    const { searchParams } = new URL(req.url);
    const slug = params.slug || searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Category slug is required" },
        { status: 400 }
      );
    }

    // 1. Fetch category from static metadata
    const meta = CATEGORY_META[slug as keyof typeof CATEGORY_META];

    if (!meta) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    const category = {
      id: slug,
      slug,
      name: meta.name,
      nameGu: meta.gu,
      nameHi: meta.hi,
      isActive: true,
    };

    // 2. Fetch paginated articles from static data
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;

    const allArticles = getArticlesByCategory(meta.name);
    const total = allArticles.length;
    const articles = allArticles.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: {
        category,
        articles,
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
