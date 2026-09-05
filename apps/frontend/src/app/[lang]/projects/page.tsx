import { Metadata } from "next";
import { fetchProjects, fetchTags } from "@/lib/api";
import ProjectsClient from "./ProjectsClient";

import { getDictionary } from "@/get-dictionary";
import { Locale } from "@/i18n-config";
import { siteConfig } from "@/lib/siteConfig";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale);
    const title = `${dict.projects?.allWorks || "Works"} - Andika Sultanrafli`;
    const description = "A curated collection of work by me.";
    const url = `${siteConfig.url}/${lang}/projects`;

    return {
        title,
        description,
        alternates: {
            canonical: `/${lang}/projects`,
            languages: {
                en: "/en/projects",
                id: "/id/projects",
                de: "/de/projects",
                ja: "/ja/projects",
                nl: "/nl/projects",
                "x-default": "/en/projects",
            },
        },
        openGraph: {
            title,
            description,
            url,
            type: "website",
        },
    };
}

export default async function ProjectsPage({
    params,
    searchParams
}: {
    params: Promise<{ lang: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await params;
    const lang = resolvedParams.lang as Locale;
    const resolvedSearchParams = await searchParams;

    const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined;
    const tag = Number(resolvedSearchParams.tag) || undefined;

    const projectsRes = await fetchProjects(undefined, { limit: 100, search, tag }, lang);
    const allTags = await fetchTags();
    const dict = await getDictionary(lang);

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": dict.nav?.home || "Home",
                        "item": `${siteConfig.url}/${lang}`,
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": dict.projects?.allWorks || "Works",
                        "item": `${siteConfig.url}/${lang}/projects`,
                    },
                ],
            },
            {
                "@type": "CollectionPage",
                "name": `${dict.projects?.allWorks || "Works"} - Andika Sultanrafli`,
                "url": `${siteConfig.url}/${lang}/projects`,
                "description": "A curated collection of work by me.",
                "inLanguage": lang,
                "mainEntity": {
                    "@type": "ItemList",
                    "numberOfItems": projectsRes.data.length,
                    "itemListElement": projectsRes.data.map((project, index) => ({
                        "@type": "ListItem",
                        "position": index + 1,
                        "url": `${siteConfig.url}/${lang}/projects/${project.slug}`,
                        "name": project.title,
                      })),
                },
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <ProjectsClient
                initialProjects={projectsRes.data}
                initialTags={allTags}
                initialSearch={search || ""}
                initialTagId={tag}
                lang={lang}
                dict={dict}
            />
        </>
    );
}
