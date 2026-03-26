import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const session = request.cookies.get("session");
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ["/login"];

    // Check if current path is public
    const isPublicRoute = publicRoutes.some(route => pathname === route);

    // Root path - redirect to login if not authenticated, dashboard if authenticated
    if (pathname === "/") {
        if (session) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        } else {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // If trying to access a protected route without session
    if (!session && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // If logged in and trying to access login page, redirect to dashboard
    if (session && pathname === "/login") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico
         * - public files (svg, png, jpg, etc.)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)",
    ],
};
