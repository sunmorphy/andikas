import { Metadata } from "next";
import { fetchProjects, fetchTags } from "@/lib/api";
import ProjectsClient from "./ProjectsClient";

import { getDictionary } from "@/get-dictionary";
import { siteConfig } from "@/lib/siteConfig";
import { resolveLocale } from "@/lib/locale";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const lang = await resolveLocale(searchParams);
  const dict = await getDictionary(lang);
  const title = `${dict.projects?.allWorks || "Works"} - Andika Sultanrafli`;
  const description = dict.projects?.curatedWorksDescription || "A curated collection of work by me.";
  const url = `${siteConfig.url}/projects`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${siteConfig.url}/projects`,
        id: `${siteConfig.url}/projects?lang=id`,
        de: `${siteConfig.url}/projects?lang=de`,
        ja: `${siteConfig.url}/projects?lang=ja`,
        nl: `${siteConfig.url}/projects?lang=nl`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [
        {
          url: `${siteConfig.url}/og.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteConfig.url}/og.png`],
    },
  };
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const lang = await resolveLocale(resolvedSearchParams);

  const search =
    typeof resolvedSearchParams.search === "string"
      ? resolvedSearchParams.search
      : undefined;
  const tag = Number(resolvedSearchParams.tag) || undefined;
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);

  const [projectsRes, allTags, dict] = await Promise.all([
    fetchProjects(undefined, { limit: 12, page, search, tag }, lang),
    fetchTags(undefined, "project"),
    getDictionary(lang),
  ]);

  return (
    <ProjectsClient
      initialProjects={projectsRes.data}
      initialMeta={projectsRes.meta}
      initialTags={allTags}
      initialSearch={search || ""}
      initialTagId={tag}
      currentPage={page}
      lang={lang}
      dict={dict}
    />
  );
}
