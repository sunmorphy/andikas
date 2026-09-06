import { cookies, headers } from "next/headers";
import { i18n, Locale } from "@/i18n-config";

export async function resolveLocale(
  searchParams?: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>
): Promise<Locale> {
  const resolvedSp = searchParams ? (searchParams instanceof Promise ? await searchParams : searchParams) : undefined;
  const langQuery = typeof resolvedSp?.lang === "string" ? resolvedSp.lang : undefined;

  if (langQuery && (i18n.locales as readonly string[]).includes(langQuery)) {
    return langQuery as Locale;
  }

  try {
    const headerList = await headers();
    const headerLang = headerList.get("x-locale");
    if (headerLang && (i18n.locales as readonly string[]).includes(headerLang)) {
      return headerLang as Locale;
    }

    const cookieStore = await cookies();
    const cookieLang = cookieStore.get("NEXT_LOCALE")?.value;
    if (cookieLang && (i18n.locales as readonly string[]).includes(cookieLang)) {
      return cookieLang as Locale;
    }
  } catch {
    // Fallback if called outside request context
  }

  return i18n.defaultLocale;
}
