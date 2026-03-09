import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from 'next-intl/middleware';
import {routing} from '@/i18n/routing';
 
const intlMiddleware = createMiddleware(routing);
type AppLocale = (typeof routing.locales)[number];

function isAppLocale(value: string): value is AppLocale {
  return (routing.locales as readonly string[]).includes(value);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathSegments = pathname.split("/").filter(Boolean);
  const locale = pathSegments[0];
  const isKnownLocale = isAppLocale(locale);
  const normalizedPath = isKnownLocale ? `/${pathSegments.slice(1).join("/")}` : pathname;
  const isLocaleLandingPath = normalizedPath === "/";
  const isDashboardPath = normalizedPath === "/dashboard" || normalizedPath.startsWith("/dashboard/");
  const isLoginPath = normalizedPath === "/login";
  const isAuthenticated = request.cookies.get("auth_session")?.value === "1";

  if (isLocaleLandingPath) {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = `/${isKnownLocale ? locale : routing.defaultLocale}/${isAuthenticated ? "dashboard" : "login"}`;
    targetUrl.search = "";
    return NextResponse.redirect(targetUrl);
  }

  if (isDashboardPath && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${isKnownLocale ? locale : routing.defaultLocale}/login`;
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPath && isAuthenticated) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = `/${isKnownLocale ? locale : routing.defaultLocale}/dashboard`;
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return intlMiddleware(request);
}
 
export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
}