import { MetadataRoute } from "next";
import { fetchProjects } from "@/lib/api";
import { siteConfig } from "@/lib/siteConfig";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const sitemaps: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
      alternates: {
        languages: {
          en: baseUrl,
          id: `${baseUrl}?lang=id`,
          de: `${baseUrl}?lang=de`,
          ja: `${baseUrl}?lang=ja`,
          nl: `${baseUrl}?lang=nl`,
        },
      },
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/projects`,
          id: `${baseUrl}/projects?lang=id`,
          de: `${baseUrl}/projects?lang=de`,
          ja: `${baseUrl}/projects?lang=ja`,
          nl: `${baseUrl}/projects?lang=nl`,
        },
      },
    },
  ];

  try {
    const projectsRes = await fetchProjects(undefined, { limit: 100 }, "en");
    for (const project of projectsRes.data) {
      sitemaps.push({
        url: `${baseUrl}/projects/${project.slug}`,
        lastModified: new Date(project.updatedAt || new Date()),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: {
          languages: {
            en: `${baseUrl}/projects/${project.slug}`,
            id: `${baseUrl}/projects/${project.slug}?lang=id`,
            de: `${baseUrl}/projects/${project.slug}?lang=de`,
            ja: `${baseUrl}/projects/${project.slug}?lang=ja`,
            nl: `${baseUrl}/projects/${project.slug}?lang=nl`,
          },
        },
      });
    }
  } catch (e) {
    console.error("Sitemap generation project fetch failed", e);
  }

  return sitemaps;
}
