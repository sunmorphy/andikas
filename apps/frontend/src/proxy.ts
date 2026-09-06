import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18n, type Locale } from "./i18n-config";

function getPreferredLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && (i18n.locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale;
  }

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const langs = acceptLanguage.split(",");
    for (const lang of langs) {
      const parsed = lang.split(";")[0].split("-")[0].trim().toLowerCase();
      if ((i18n.locales as readonly string[]).includes(parsed)) {
        return parsed as Locale;
      }
    }
  }
  return i18n.defaultLocale;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Redirect legacy path-based locale URLs: e.g. /id/projects -> /projects?lang=id, /en -> /
  for (const locale of i18n.locales) {
    if (pathname === `/${locale}`) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      if (locale !== i18n.defaultLocale) {
        url.searchParams.set("lang", locale);
      }
      const response = NextResponse.redirect(url, 301);
      response.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000 });
      return response;
    }
    if (pathname.startsWith(`/${locale}/`)) {
      const cleanPath = pathname.replace(`/${locale}`, "");
      const url = request.nextUrl.clone();
      url.pathname = cleanPath || "/";
      if (locale !== i18n.defaultLocale) {
        url.searchParams.set("lang", locale);
      }
      const response = NextResponse.redirect(url, 301);
      response.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000 });
      return response;
    }
  }

  // 2. Resolve active locale
  const queryLang = request.nextUrl.searchParams.get("lang");
  let activeLocale: Locale = i18n.defaultLocale;

  if (queryLang && (i18n.locales as readonly string[]).includes(queryLang)) {
    activeLocale = queryLang as Locale;
  } else {
    activeLocale = getPreferredLocale(request);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", activeLocale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (queryLang && (i18n.locales as readonly string[]).includes(queryLang)) {
    response.cookies.set("NEXT_LOCALE", queryLang, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|apple-icon.png|icon0.svg|icon1.png|manifest.json|robots.txt|sitemap.xml).*)"],
};
