import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-super-secret-key-at-least-32-characters-long"
);

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// Map roles to their permitted admin path prefixes
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["/admin"], // Super admin can access all admin routes
  EDITOR: ["/admin/articles", "/admin/categories", "/admin/gallery", "/admin/videos", "/admin/stats"],
  REPORTER: ["/admin/articles"],
  SEO: ["/admin/seo"],
  ADVERTISEMENT: ["/admin/ads"],
  PHOTOGRAPHER: ["/admin/gallery"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run middleware on /admin routes and /api/admin routes
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;

  // If token is missing, redirect to login (or return 401 for API routes)
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication token missing" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userPayload = payload as unknown as TokenPayload;

    const userRole = userPayload.role;

    // Check permissions
    if (userRole === "SUPER_ADMIN") {
      return NextResponse.next();
    }

    // Allow read-only (GET) access to categories and authors for all authenticated admin dashboard users
    const isReadOnlySelector = 
      request.method === "GET" && 
      (pathname === "/api/admin/categories" || pathname === "/api/admin/authors");

    // Allow authenticated users to upload files
    const isUploadPath = pathname === "/api/admin/upload";

    if (isReadOnlySelector || isUploadPath) {
      return NextResponse.next();
    }

    // Redirect non-super-admins to their first permitted page if they request the root admin path
    if ((pathname === "/admin" || pathname === "/admin/") && userRole !== "EDITOR") {
      const permittedPaths = ROLE_PERMISSIONS[userRole] || [];
      if (permittedPaths.length > 0) {
        return NextResponse.redirect(new URL(permittedPaths[0], request.url));
      }
    }

    const permittedPaths = ROLE_PERMISSIONS[userRole] || [];
    
    // Normalize path by removing the "/api" prefix for route authorization checks
    const checkPath = pathname.startsWith("/api") ? pathname.slice(4) : pathname;

    // Check if the normalized pathname is allowed or matches a permitted prefix
    let isPermitted = permittedPaths.some(
      (path) => checkPath === path || checkPath.startsWith(path + "/")
    );

    // Allow EDITOR to access root dashboard path
    if (!isPermitted && (checkPath === "/admin" || checkPath === "/admin/")) {
      if (userRole === "EDITOR") {
        isPermitted = true;
      }
    }

    if (!isPermitted) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Set custom headers to propagate user metadata to downstream routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", userPayload.userId);
    requestHeaders.set("x-user-email", userPayload.email);
    requestHeaders.set("x-user-role", userPayload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error("Middleware JWT verification failed:", error);
    
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("access_token");
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
