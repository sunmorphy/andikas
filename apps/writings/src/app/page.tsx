import { Metadata } from "next";
import { fetchArticles, fetchTags } from "@/lib/api";
import { siteConfig } from "@/lib/siteConfig";
import { getDictionary } from "@/get-dictionary";
import { resolveLocale } from "@/lib/locale";
import WritingsClient from "./WritingsClient";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function getLocalizedText(
  val: Record<string, string | undefined> | string | undefined | null,
  lang: string
): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[lang] || val.en || Object.values(val)[0] || "";
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const lang = await resolveLocale(searchParams);
  const dict = await getDictionary(lang);
  const title = `${dict.writings?.title || "Writings"} — Andika Sultanrafli`;
  const description =
    dict.writings?.heroDescription ||
    "My research, blogs, or just sharing my thoughts.";
  const canonicalUrl = siteConfig.url;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function WritingsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const lang = await resolveLocale(resolvedSearchParams);

  const search =
    typeof resolvedSearchParams.search === "string"
      ? resolvedSearchParams.search
      : undefined;
  const tagId = Number(resolvedSearchParams.tag) || undefined;
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);
  const limit = 10;

  const [articlesRes, tags, dict] = await Promise.all([
    fetchArticles({ search, tag: tagId, page, limit }, lang),
    fetchTags("writing"),
    getDictionary(lang),
  ]);

  const articles = articlesRes.data;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${siteConfig.url}/#blog`,
    name: "Writings — Andika Sultanrafli",
    description: siteConfig.description,
    url: siteConfig.url,
    author: {
      "@type": "Person",
      name: siteConfig.author,
      url: siteConfig.mainSiteUrl,
    },
    blogPost: articles.map((art) => ({
      "@type": "BlogPosting",
      headline: getLocalizedText(art.title, lang),
      url: `${siteConfig.url}/${art.slug}${lang === "en" ? "" : `?lang=${lang}`}`,
      datePublished: art.publishedAt || art.createdAt,
      dateModified: art.updatedAt,
      description: getLocalizedText(art.description, lang),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <WritingsClient
        initialArticles={articles}
        initialMeta={articlesRes.meta}
        initialTags={tags}
        initialSearch={search || ""}
        initialTagId={tagId}
        currentPage={page}
        lang={lang}
        dict={dict}
      />
    </>
  );
}
