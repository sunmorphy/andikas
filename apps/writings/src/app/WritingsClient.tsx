"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search } from "iconoir-react";
import { Article, Tag, PaginatedMeta } from "@andikas/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SlashList } from "@/components/ui/SlashList";
import { siteConfig } from "@/lib/siteConfig";
import { getBcp47Locale } from "@/i18n-config";
import { getMediaUrl } from "@/lib/media";

interface WritingsClientProps {
  initialArticles: Article[];
  initialMeta?: PaginatedMeta;
  initialTags: Tag[];
  initialSearch: string;
  initialTagId?: number;
  currentPage?: number;
  lang: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any;
}

function getLocalized(
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

export default function WritingsClient({
  initialArticles,
  initialMeta,
  initialTags,
  initialSearch,
  initialTagId,
  currentPage = 1,
  lang,
  dict,
}: WritingsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const updateUrl = (params: {
    search?: string;
    tag?: number | null;
    page?: number;
  }) => {
    const url = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );

    const newSearch =
      params.search !== undefined ? params.search : initialSearch;
    const newTag = params.tag !== undefined ? params.tag : initialTagId;
    const newPage =
      params.page !== undefined
        ? params.page
        : params.search !== undefined || params.tag !== undefined
        ? 1
        : currentPage;

    if (newSearch) {
      url.set("search", newSearch);
    } else {
      url.delete("search");
    }

    if (newTag) {
      url.set("tag", newTag.toString());
    } else {
      url.delete("tag");
    }

    if (newPage > 1) {
      url.set("page", newPage.toString());
    } else {
      url.delete("page");
    }

    const query = url.toString() ? `?${url.toString()}` : "";
    router.push(`${pathname}${query}`, { scroll: false });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== initialSearch) {
        updateUrl({ search: searchQuery });
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, initialSearch]);

  const filterItems = [
    {
      label: (dict.writings?.all || "all").toLowerCase(),
      onClick: () => updateUrl({ tag: null }),
      active: !initialTagId,
    },
    ...initialTags.map((t) => ({
      label: t.name,
      onClick: () => updateUrl({ tag: t.id }),
      active: initialTagId === t.id,
    })),
  ];

  const mainSiteName = siteConfig.mainSiteDomain;
  const backToHomeLabel = `← ${(
    dict.writings?.backToHome || `back to ${mainSiteName}`
  ).toLowerCase()}`;

  const homeHref = `${siteConfig.mainSiteUrl}${lang === "en" ? "" : `?lang=${lang}`}`;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-8 md:pt-16 pb-32">
      {/* Header Row: Title & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
        <SectionHeading
          title={dict.writings?.title || "writings"}
          subtitle={dict.writings?.subtitle || "yes, i write"}
          action={{
            label: backToHomeLabel,
            href: homeHref,
          }}
        />

        <div className="relative w-full md:w-72">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/50" />
          <input
            type="text"
            placeholder={(
              dict.writings?.searchPlaceholder || "search writings..."
            ).toLowerCase()}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-7 pr-3 bg-transparent border-b border-ink/30 focus:border-brand-900 focus:outline-none text-xs md:text-sm font-medium text-ink placeholder:text-ink/40 lowercase transition-colors"
          />
        </div>
      </div>

      {/* Slashed Tags Row */}
      <div className="mb-12 md:mb-16">
        <SlashList
          items={filterItems}
          itemClassName="text-sm md:text-base font-bold"
          slashClassName="text-sm md:text-base"
        />
      </div>

      {/* Articles Stream */}
      {initialArticles.length === 0 ? (
        <div className="py-24 text-center text-sm text-ink/60 lowercase select-none">
          {(
            dict.writings?.noArticles ||
            "no writings match your search criteria."
          ).toLowerCase()}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-300">
          {initialArticles.map((art, idx) => {
            const titleStr = getLocalized(art.title, lang) || "untitled";
            const descStr = getLocalized(art.description, lang);
            const contentStr = getLocalized(art.content, lang);
            const readMinutes = calculateReadingTime(contentStr || descStr);
            const pubDate = art.publishedAt || art.createdAt;
            const dateFormatted = pubDate
              ? new Date(pubDate).toLocaleDateString(getBcp47Locale(lang), {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "";

            const coverUrl = getMediaUrl(art.coverImage);
            const articleHref = `/${art.slug}${lang === "en" ? "" : `?lang=${lang}`}`;

            return (
              <article key={art.id} className="py-8 group">
                <Link
                  href={articleHref}
                  className="block focus:outline-none"
                >
                  <div className={coverUrl ? "flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-8" : ""}>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-2">
                        <h2 className="text-xl md:text-2xl font-bold tracking-tighter text-ink lowercase group-hover:text-brand-900 transition-colors">
                          {titleStr}
                        </h2>
                        <div className="flex items-center gap-3 text-xs md:text-sm text-ink/60 font-medium tracking-tight shrink-0 select-none">
                          {dateFormatted && <span>{dateFormatted.toLowerCase()}</span>}
                          <span>·</span>
                          <span>
                            {readMinutes} {dict.writings?.minRead || "min read"}
                          </span>
                        </div>
                      </div>

                      {descStr && (
                        <p className="text-xs md:text-sm text-ink/80 leading-relaxed max-w-3xl mb-4 font-normal line-clamp-2">
                          {descStr}
                        </p>
                      )}

                      {art.articleTags && art.articleTags.length > 0 && (
                        <div className="flex items-center gap-2 text-xs font-bold text-ink/60 lowercase select-none">
                          {art.articleTags.map((at, tagIdx) => (
                            <React.Fragment key={at.id || at.tag.id}>
                              <span className="hover:text-ink transition-colors">
                                {at.tag?.name}
                              </span>
                              {tagIdx < (art.articleTags?.length ?? 0) - 1 && (
                                <span className="text-brand-900 font-bold">/</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>

                    {coverUrl && (
                      <div className="relative w-full md:w-56 lg:w-64 aspect-[16/10] overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300 order-first md:order-last">
                        <Image
                          src={coverUrl}
                          alt={titleStr}
                          fill
                          priority={idx < 2}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 224px, 256px"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </div>
                    )}
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {initialMeta && initialMeta.totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-16 pt-8 border-t border-neutral-300 flex items-center justify-between text-xs md:text-sm font-bold lowercase text-ink select-none"
        >
          <div>
            {currentPage > 1 ? (
              <button
                type="button"
                onClick={() => updateUrl({ page: currentPage - 1 })}
                className="hover:text-brand-900 underline underline-offset-4 decoration-1 transition-colors cursor-pointer"
              >
                ← {(dict.writings?.previous || "previous").toLowerCase()}
              </button>
            ) : (
              <span className="text-ink/30 cursor-not-allowed">
                ← {(dict.writings?.previous || "previous").toLowerCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 font-medium text-ink/70">
            <span>
              {(dict.writings?.page || "page").toLowerCase()} {currentPage}{" "}
              {(dict.writings?.of || "of").toLowerCase()} {initialMeta.totalPages}
            </span>
          </div>

          <div>
            {currentPage < initialMeta.totalPages ? (
              <button
                type="button"
                onClick={() => updateUrl({ page: currentPage + 1 })}
                className="hover:text-brand-900 underline underline-offset-4 decoration-1 transition-colors cursor-pointer"
              >
                {(dict.writings?.next || "next").toLowerCase()} →
              </button>
            ) : (
              <span className="text-ink/30 cursor-not-allowed">
                {(dict.writings?.next || "next").toLowerCase()} →
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
