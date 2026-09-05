import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProjectBySlug, fetchProjects } from "@/lib/api";
import { getDictionary } from "@/get-dictionary";
import { Locale, i18n } from "@/i18n-config";
import { siteConfig } from "@/lib/siteConfig";
import ProjectDetailClient from "@/components/ProjectDetailClient";

export async function generateStaticParams() {
  const paths = [];
  for (const lang of i18n.locales) {
    const projectsRes = await fetchProjects(undefined, { limit: 100 }, lang);
    for (const project of projectsRes.data) {
      paths.push({
        lang,
        slug: project.slug,
      });
    }
  }
  return paths;
}

interface Props {
    params: Promise<{ lang: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { lang, slug } = await params;
    const project = await fetchProjectBySlug(slug, undefined, lang);
    if (!project) return { title: "Project Not Found" };

    const title = `${project.title} - Andika Sultanrafli`;
    const description = project.description;
    const url = `${siteConfig.url}/${lang}/projects/${slug}`;

    return {
        title,
        description,
        alternates: {
            canonical: `/${lang}/projects/${slug}`,
            languages: {
                en: `/en/projects/${slug}`,
                id: `/id/projects/${slug}`,
                de: `/de/projects/${slug}`,
                ja: `/ja/projects/${slug}`,
                nl: `/nl/projects/${slug}`,
                "x-default": `/en/projects/${slug}`,
            },
        },
        openGraph: {
            title,
            description,
            url,
            type: "article",
            images: project.coverImage ? [{ 
                url: project.coverImage,
                width: 1200,
                height: 630,
                alt: project.title 
            }] : undefined,
        },
    };
}

export default async function ProjectDetailsPage({ params }: Props) {
    const { lang, slug } = await params;
    const project = await fetchProjectBySlug(slug, undefined, lang);
    const dict = await getDictionary(lang as Locale);

    if (!project) {
        notFound();
    }

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
                        "name": dict.nav?.works || dict.projects?.allWorks || "Works",
                        "item": `${siteConfig.url}/${lang}/projects`,
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": project.title,
                        "item": `${siteConfig.url}/${lang}/projects/${slug}`,
                    },
                ],
            },
            {
                "@type": project.type === "mobile" || project.type === "web" ? "SoftwareApplication" : "CreativeWork",
                "name": project.title,
                "headline": project.title,
                "description": project.description,
                "url": `${siteConfig.url}/${lang}/projects/${slug}`,
                "image": project.coverImage ? [project.coverImage] : undefined,
                "inLanguage": lang,
                "datePublished": project.createdAt,
                "dateModified": project.updatedAt,
                "author": {
                    "@type": "Person",
                    "name": "Andika Sultanrafli",
                    "url": siteConfig.url,
                },
                "keywords": project.projectTags?.map((pt) => pt.tag?.name).filter(Boolean).join(", ") || undefined,
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <ProjectDetailClient
                project={project}
                dict={dict}
                lang={lang}
            />
        </>
    );
}
