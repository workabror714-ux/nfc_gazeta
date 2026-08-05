import {
    NextRequest,
    NextResponse,
  } from "next/server";
  
  import { ACCESS_COOKIE_NAME } from "@/lib/server/auth-cookies";
  
  const protectedRoutes = [
    "/dashboard",
    "/nashrlar",
    "/maqolalar",
    "/analitika",
    "/tizim",
  ];
  
  export function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
  
    const accessToken = request.cookies.get(
      ACCESS_COOKIE_NAME,
    )?.value;
  
    const isLoginPage = pathname === "/login";
  
    const isProtectedRoute = protectedRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(`${route}/`),
    );
  
    if (isProtectedRoute && !accessToken) {
      const loginUrl = new URL("/login", request.url);
  
      loginUrl.searchParams.set(
        "next",
        `${pathname}${request.nextUrl.search}`,
      );
  
      return NextResponse.redirect(loginUrl);
    }
  
    if (isLoginPage && accessToken) {
      return NextResponse.redirect(
        new URL("/dashboard", request.url),
      );
    }
  
    return NextResponse.next();
  }
  
  export const config = {
    matcher: [
      "/login",
      "/dashboard/:path*",
      "/nashrlar/:path*",
      "/maqolalar/:path*",
      "/analitika/:path*",
      "/tizim/:path*",
    ],
  };