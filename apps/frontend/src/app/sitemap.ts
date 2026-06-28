import { MetadataRoute } from "next";
import { fetchProjects } from "@/lib/api";
import { i18n } from "@/i18n-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://andikas.dev";
  const sitemaps: MetadataRoute.Sitemap = [];

  // Add static localized pages
  for (const lang of i18n.locales) {
    sitemaps.push({
      url: `${baseUrl}/${lang}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    });
    sitemaps.push({
      url: `${baseUrl}/${lang}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });

    // Fetch projects for this language to dynamically include project detail pages
    try {
      const projectsRes = await fetchProjects(undefined, { limit: 100 }, lang);
      for (const project of projectsRes.data) {
        sitemaps.push({
          url: `${baseUrl}/${lang}/projects/${project.slug}`,
          lastModified: new Date(project.updatedAt || new Date()),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    } catch (e) {
      console.error(`Sitemap generation project fetch failed for lang: ${lang}`, e);
    }
  }

  return sitemaps;
}
