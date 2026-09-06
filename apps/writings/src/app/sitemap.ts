import { MetadataRoute } from "next";
import { fetchArticles } from "@/lib/api";
import { siteConfig } from "@/lib/siteConfig";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articlesRes = await fetchArticles({ limit: 500 });
  const articles = articlesRes.data;

  const articleEntries: MetadataRoute.Sitemap = articles.map((art) => ({
    url: `${siteConfig.url}/${art.slug}`,
    lastModified: new Date(art.updatedAt || art.createdAt),
    changeFrequency: "weekly",
    priority: 0.8,
    alternates: {
      languages: {
        en: `${siteConfig.url}/${art.slug}`,
        id: `${siteConfig.url}/${art.slug}?lang=id`,
        de: `${siteConfig.url}/${art.slug}?lang=de`,
        ja: `${siteConfig.url}/${art.slug}?lang=ja`,
        nl: `${siteConfig.url}/${art.slug}?lang=nl`,
      },
    },
  }));

  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
      alternates: {
        languages: {
          en: siteConfig.url,
          id: `${siteConfig.url}?lang=id`,
          de: `${siteConfig.url}?lang=de`,
          ja: `${siteConfig.url}?lang=ja`,
          nl: `${siteConfig.url}?lang=nl`,
        },
      },
    },
    ...articleEntries,
  ];
}
