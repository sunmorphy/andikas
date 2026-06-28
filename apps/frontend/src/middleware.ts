import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { i18n } from './i18n-config'

function getLocale(request: NextRequest): string {
    const acceptLanguage = request.headers.get('accept-language');
    let preferred = i18n.defaultLocale;

    if (acceptLanguage) {
        const langs = acceptLanguage.split(',');
        for (const lang of langs) {
            const parsedLang = lang.split(';')[0].split('-')[0].trim().toLowerCase();
            if ((i18n.locales as readonly string[]).includes(parsedLang)) {
                return parsedLang;
            }
        }
    }
    return preferred;
}

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Check if there is any supported locale in the pathname
    const pathnameIsMissingLocale = i18n.locales.every(
        (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    )

    // Redirect if there is no locale
    if (pathnameIsMissingLocale) {
        const locale = getLocale(request)

        // e.g. incoming request is /projects
        // The new URL is now /en/projects
        return NextResponse.redirect(
            new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
        )
    }
}

export const config = {
    // Matcher ignoring `/api/`, `/_next/`, static files, favicon, robots.txt, and sitemap.xml
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
