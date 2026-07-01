import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("wassal_session");
  const { pathname } = request.nextUrl;

  // السماح بملفات النظام والصور الثابتة والـ APIs والموقع العام للتتبع دون مصادقة
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") ||
    pathname === "/track"
  ) {
    return NextResponse.next();
  }

  // إذا كان المستخدم مسجل دخول ويحاول الوصول لصفحة تسجيل الدخول أو الصفحة الرئيسية العامة
  if (session && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // إذا كان المستخدم غير مسجل دخول ويحاول الوصول للصفحة الرئيسية العامة، نوجهه لصفحة التتبع العامة
  if (!session && pathname === "/") {
    return NextResponse.redirect(new URL("/track", request.url));
  }

  // إذا كان المستخدم غير مسجل دخول ويحاول الوصول لصفحة محمية
  const isAuthPage = pathname === "/login";
  
  if (!session && !isAuthPage) {
    // توجيه لصفحة تسجيل الدخول
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// تحديد المسارات التي سيتم تطبيق الـ middleware عليها
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
