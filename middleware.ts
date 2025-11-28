import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "ADMIN";
    const isTeacher = token?.role === "TEACHER";
    const isWali = token?.role === "WALI";
    const isSantri = token?.role === "SANTRI";
    const mustChangePassword = token?.mustChangePassword;

    const pathname = req.nextUrl.pathname;

    // Force password change - redirect to change password page
    // Skip if already on change password page or API routes
    if (
      mustChangePassword &&
      !pathname.startsWith("/auth/change-password") &&
      !pathname.startsWith("/api/")
    ) {
      return NextResponse.redirect(new URL("/auth/change-password", req.url));
    }

    // Admin routes
    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Teacher routes
    if (pathname.startsWith("/teacher") && !isTeacher && !isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Wali routes
    if (pathname.startsWith("/wali") && !isWali && !isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Santri routes
    if (pathname.startsWith("/santri") && !isSantri && !isAdmin && !isTeacher) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/wali/:path*",
    "/santri/:path*",
    "/dashboard/:path*",
    "/auth/change-password",
  ],
};
