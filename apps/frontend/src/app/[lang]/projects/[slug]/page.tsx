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

    return {
        title: `${project.title} - Andika Sultanrafli`,
        description: project.description,
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
