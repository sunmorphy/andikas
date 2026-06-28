import { Metadata } from "next";
import { fetchProjects, fetchTags } from "@/lib/api";
import ProjectsClient from "./ProjectsClient";

import { getDictionary } from "@/get-dictionary";
import { Locale } from "@/i18n-config";

export const metadata: Metadata = {
    title: "Projects",
    description: "A curated collection of product design, mobile development, and full-stack engineering work by Andika Sultanrafli.",
    openGraph: {
        title: "Projects - Andika Sultanrafli",
        description: "A curated collection of product design, mobile development, and full-stack engineering work by Andika Sultanrafli.",
        url: "https://andikas.dev/projects",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Projects - Andika Sultanrafli",
        description: "A curated collection of product design, mobile development, and full-stack engineering work by Andika Sultanrafli.",
    },
};

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

    return <ProjectsClient
        initialProjects={projectsRes.data}
        initialTags={allTags}
        initialSearch={search || ""}
        initialTagId={tag}
        lang={lang}
        dict={dict}
    />;
}
