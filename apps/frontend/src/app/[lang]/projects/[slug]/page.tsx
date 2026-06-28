import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProjectBySlug, fetchProjects } from "@/lib/api";
import { getDictionary } from "@/get-dictionary";
import { Locale, i18n } from "@/i18n-config";
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
    const url = `https://andikas.dev/projects/${slug}`;

    return {
        title,
        description,
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
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: project.coverImage ? [project.coverImage] : undefined,
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

    return (
        <ProjectDetailClient
            project={project}
            dict={dict}
            lang={lang}
        />
    );
}
