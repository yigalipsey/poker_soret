import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Allow access to login and create pages
  if (
    request.nextUrl.pathname === "/admin/login" ||
    request.nextUrl.pathname === "/admin/create"
  ) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const authCookie = request.cookies.get("admin_session");

    // רק אם יש admin_session - אפשר גישה
    // admin_session נוצר רק דרך /admin/login עם סיסמת מנהל
    if (authCookie && authCookie.value === "true") {
      return NextResponse.next();
    }

    // אם אין admin_session - פנה ל-login
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
