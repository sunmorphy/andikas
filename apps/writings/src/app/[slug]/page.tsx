import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchArticleBySlug } from "@/lib/api";
import { siteConfig } from "@/lib/siteConfig";
import { getDictionary } from "@/get-dictionary";
import { resolveLocale } from "@/lib/locale";
import { getBcp47Locale } from "@/i18n-config";
import { getMediaUrl } from "@/lib/media";

interface Props {
  params: Promise<{ slug: string }>;
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

function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lang = await resolveLocale(searchParams);
  const [article, dict] = await Promise.all([
    fetchArticleBySlug(slug, lang),
    getDictionary(lang),
  ]);

  if (!article) {
    return {
      title: dict.writings?.articleNotFound || dict.notFound?.heading || "Article Not Found",
    };
  }

  const titleStr = getLocalizedText(article.title, lang) || "";
  const descStr = getLocalizedText(article.description, lang);
  const ogImageUrl = article.coverImage
    ? getMediaUrl(article.coverImage)
    : `${siteConfig.url}/og.png`;
  const url = `${siteConfig.url}/${slug}`;

  return {
    title: titleStr,
    description: descStr,
    alternates: {
      canonical: `/${slug}`,
      languages: {
        en: `/${slug}`,
        id: `/${slug}?lang=id`,
        de: `/${slug}?lang=de`,
        ja: `/${slug}?lang=ja`,
        nl: `/${slug}?lang=nl`,
      },
    },
    openGraph: {
      title: `${titleStr} — Andika Sultanrafli`,
      description: descStr,
      url,
      type: "article",
      publishedTime: article.publishedAt || article.createdAt,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: titleStr,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${titleStr} — Andika Sultanrafli`,
      description: descStr,
      images: [ogImageUrl],
    },
  };
}

export default async function ArticlePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const lang = await resolveLocale(searchParams);
  const [article, dict] = await Promise.all([
    fetchArticleBySlug(slug, lang),
    getDictionary(lang),
  ]);

  if (!article) {
    notFound();
  }

  const titleStr = getLocalizedText(article.title, lang) || "Untitled";
  const descStr = getLocalizedText(article.description, lang);
  const contentStr = getLocalizedText(article.content, lang);
  const readMinutes = calculateReadingTime(contentStr || descStr);
  const pubDate = article.publishedAt || article.createdAt;
  const dateFormatted = pubDate
    ? new Date(pubDate).toLocaleDateString(getBcp47Locale(lang), {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const ogImageUrl = article.coverImage
    ? getMediaUrl(article.coverImage)
    : `${siteConfig.url}/og.png`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${siteConfig.url}/${slug}#article`,
        headline: titleStr,
        description: descStr,
        image: [ogImageUrl],
        url: `${siteConfig.url}/${slug}`,
        datePublished: article.publishedAt || article.createdAt,
        dateModified: article.updatedAt,
        author: {
          "@type": "Person",
          name: siteConfig.author,
          url: siteConfig.mainSiteUrl,
        },
        publisher: {
          "@type": "Person",
          name: siteConfig.author,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${siteConfig.url}/${slug}`,
        },
      },
    ],
  };

  const backToWritingsHref = `/${lang === "en" ? "" : `?lang=${lang}`}`;
  const portfolioHref = `${siteConfig.mainSiteUrl}${lang === "en" ? "" : `?lang=${lang}`}`;

  return (
    <article className="w-full max-w-4xl mx-auto px-6 py-8 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Back Link */}
      <div className="mb-10">
        <Link
          href={backToWritingsHref}
          className="text-xs md:text-sm font-medium text-ink lowercase underline underline-offset-4 decoration-1 hover:text-brand-900 hover:decoration-brand-900 transition-colors inline-block"
        >
          ← {(dict.writings?.backToWritings || "back to writings").toLowerCase()}
        </Link>
      </div>

      {/* Header */}
      <header className="mb-12 border-b border-neutral-300 pb-10">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-ink lowercase leading-tight mb-6">
          {titleStr}
        </h1>

        {descStr && (
          <p className="text-base md:text-lg text-ink-muted leading-relaxed mb-6 font-normal">
            {descStr}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs md:text-sm text-ink/60 font-medium tracking-tight select-none">
          <div className="flex items-center gap-2">
            <span>{dateFormatted.toLowerCase()}</span>
            <span>·</span>
            <span>
              {readMinutes} {dict.writings?.minRead || "min read"}
            </span>
          </div>

          {article.articleTags && article.articleTags.length > 0 && (
            <div className="flex items-center gap-2 lowercase">
              {article.articleTags.map((at, idx) => (
                <span key={at.id || at.tag.id} className="text-ink font-bold text-xs md:text-sm">
                  {at.tag?.name}
                  {idx < (article.articleTags?.length ?? 0) - 1 && (
                    <span className="text-brand-900 font-bold ml-2">/</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Cover Image */}
      {article.coverImage && (
        <div className="relative w-full aspect-[16/9] mb-12 overflow-hidden bg-neutral-200">
          <Image
            src={getMediaUrl(article.coverImage)}
            alt={titleStr}
            fill
            priority
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
          />
        </div>
      )}

      {/* Markdown Content */}
      <div className="prose prose-neutral max-w-none text-ink text-sm md:text-base leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {contentStr || (dict.writings?.contentComingSoon ? `*(${dict.writings.contentComingSoon})*` : "")}
        </ReactMarkdown>
      </div>

      {/* Bottom Navigation */}
      <footer className="mt-20 pt-10 border-t border-neutral-300 flex justify-between items-center text-xs font-medium lowercase">
        <Link
          href={backToWritingsHref}
          className="text-ink hover:text-brand-900 underline underline-offset-4 decoration-1 transition-colors"
        >
          ← {(dict.writings?.backToWritings || "back to writings").toLowerCase()}
        </Link>
        <a
          href={portfolioHref}
          className="text-ink-muted hover:text-ink hover:underline underline-offset-4 transition-colors"
        >
          andikas.dev →
        </a>
      </footer>
    </article>
  );
}
