import { NextResponse } from "next/server";
import { AppError, TooManyRequestsError } from "./errors";

// ---------------------------------------------------------------------------
// Success
// ---------------------------------------------------------------------------
export function ApiSuccess<T>(
  data: T,
  message = "Success",
  status = 200
): NextResponse {
  return NextResponse.json({ success: true, message, data }, { status });
}

// ---------------------------------------------------------------------------
// Created
// ---------------------------------------------------------------------------
export function ApiCreated<T>(data: T, message = "Created"): NextResponse {
  return ApiSuccess(data, message, 201);
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------
export function ApiError(
  error: unknown,
  defaultMessage = "An unexpected error occurred"
): NextResponse {
  if (error instanceof TooManyRequestsError) {
    return NextResponse.json(
      { success: false, code: error.code, message: error.message },
      {
        status: 429,
        headers: { "Retry-After": String(error.retryAfter) },
      }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        code: error.code,
        message: error.message,
        ...(((error as unknown as { details?: unknown }).details !== undefined) && {
          details: (error as unknown as { details: unknown }).details,
        }),
      },
      { status: error.statusCode }
    );
  }

  console.error("[ApiError] Unhandled:", error);
  return NextResponse.json(
    { success: false, code: "INTERNAL_ERROR", message: defaultMessage },
    { status: 500 }
  );
}

// ---------------------------------------------------------------------------
// Paginated
// ---------------------------------------------------------------------------
export function ApiPaginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data: items,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
