import { NextRequest } from "next/server";
import { AuthorService } from "@/server/services/author.service";
import { ApiSuccess, ApiError } from "@/server/utils/response";

export async function GET(req: NextRequest) {
  try {
    const authors = await AuthorService.getActiveAuthors();
    return ApiSuccess(authors, "Authors fetched successfully");
  } catch (err) {
    return ApiError(err);
  }
}
