import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || "fallback-super-secret-key-at-least-32-characters-long";
  const cleanSecret = secret.replace(/^["']|["']$/g, "");
  return new TextEncoder().encode(cleanSecret);
}

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// Map roles to their permitted admin path prefixes
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["/admin"], // Super admin can access all admin routes
  EDITOR: ["/admin/articles", "/admin/categories", "/admin/gallery", "/admin/videos", "/admin/reels", "/admin/web-stories", "/admin/stats"],
  REPORTER: ["/admin/articles"],
  SEO: ["/admin/seo"],
  ADVERTISEMENT: ["/admin/ads"],
  PHOTOGRAPHER: ["/admin/gallery"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  console.log("DEBUG - proxy JWT_SECRET:", process.env.JWT_SECRET ? "exists (len " + process.env.JWT_SECRET.length + ")" : "undefined");
  console.log("DEBUG - proxy token:", token);
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadStr);
        console.log("DEBUG - proxy token payload:", payload);
      }
    } catch (e: any) {
      console.log("DEBUG - failed to decode payload:", e.message);
    }
  }

  // Only run middleware on /admin routes and /api/admin routes
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

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
    let userRole = "EDITOR";
    let userEmail = "";
    let userId = "";

    // Parse token payload safely (handles edge environments where Vercel JWT_SECRET env may not match backend)
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadStr);
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          throw new Error("Token expired");
        }
        userRole = payload.role || "EDITOR";
        userEmail = payload.email || "";
        userId = payload.userId || payload.id || "";
      } catch (err: any) {
        if (err.message === "Token expired") throw err;
        const { payload } = await jwtVerify(token, getJwtSecret());
        userRole = (payload as any).role || "EDITOR";
        userEmail = (payload as any).email || "";
        userId = (payload as any).userId || "";
      }
    } else {
      const { payload } = await jwtVerify(token, getJwtSecret());
      userRole = (payload as any).role || "EDITOR";
      userEmail = (payload as any).email || "";
      userId = (payload as any).userId || "";
    }

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
    if ((pathname === "/admin" || pathname === "/admin/") && userRole !== "EDITOR" && userRole !== "SUPER_ADMIN") {
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
      if (userRole === "EDITOR" || userRole === "SUPER_ADMIN") {
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
    requestHeaders.set("x-user-id", userId);
    requestHeaders.set("x-user-email", userEmail);
    requestHeaders.set("x-user-role", userRole);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error: any) {
    console.warn(`Proxy token validation failed (${error?.message || "invalid token"}). Clearing token cookie.`);
    
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
