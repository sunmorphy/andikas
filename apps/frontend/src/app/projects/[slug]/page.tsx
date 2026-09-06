import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProjectBySlug, fetchProjects } from "@/lib/api";
import { getDictionary } from "@/get-dictionary";
import { siteConfig } from "@/lib/siteConfig";
import { userConfig } from "@/lib/userConfig";
import { getMediaUrl } from "@/lib/media";
import ProjectDetailClient from "@/components/ProjectDetailClient";
import { resolveLocale } from "@/lib/locale";

export async function generateStaticParams() {
  const projectsRes = await fetchProjects(undefined, { limit: 100 }, "en");
  return projectsRes.data.map((project) => ({
    slug: project.slug,
  }));
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lang = await resolveLocale(searchParams);
  const [project, dict] = await Promise.all([
    fetchProjectBySlug(slug, undefined, lang),
    getDictionary(lang),
  ]);
  if (!project) return { title: dict.projects?.projectNotFound || "Project Not Found" };

  const title = `${project.title} - Andika Sultanrafli`;
  const description = project.description;
  const url = `${siteConfig.url}/projects/${slug}`;
  const ogImageUrl = project.coverImage
    ? getMediaUrl(project.coverImage)
    : `${siteConfig.url}/og.png`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${siteConfig.url}/projects/${slug}`,
        id: `${siteConfig.url}/projects/${slug}?lang=id`,
        de: `${siteConfig.url}/projects/${slug}?lang=de`,
        ja: `${siteConfig.url}/projects/${slug}?lang=ja`,
        nl: `${siteConfig.url}/projects/${slug}?lang=nl`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const lang = await resolveLocale(searchParams);
  const [project, dict] = await Promise.all([
    fetchProjectBySlug(slug, undefined, lang),
    getDictionary(lang),
  ]);

  if (!project) {
    notFound();
  }

  const ogImageUrl = project.coverImage
    ? getMediaUrl(project.coverImage)
    : `${siteConfig.url}/og.png`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${siteConfig.url}/projects/${slug}#project`,
        name: project.title,
        headline: project.title,
        description: project.description,
        image: [ogImageUrl],
        url: `${siteConfig.url}/projects/${slug}`,
        datePublished: project.createdAt,
        dateModified: project.updatedAt || project.createdAt,
        author: {
          "@type": "Person",
          name: userConfig.name,
          url: siteConfig.url,
        },
        creator: {
          "@type": "Person",
          name: userConfig.name,
          url: siteConfig.url,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${siteConfig.url}/projects/${slug}`,
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
      <ProjectDetailClient project={project} dict={dict} lang={lang} />
    </>
  );
}
