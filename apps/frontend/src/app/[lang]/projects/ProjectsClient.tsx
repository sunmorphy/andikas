"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "iconoir-react";
import { Project, Tag, PaginatedMeta } from "@andikas/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { SlashList } from "@/components/ui/SlashList";

interface ProjectsClientProps {
  initialProjects: Project[];
  initialMeta?: PaginatedMeta;
  initialTags: Tag[];
  initialSearch: string;
  initialTagId?: number;
  lang: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any;
}

export default function ProjectsClient({
  initialProjects,
  initialTags,
  initialSearch,
  initialTagId,
  lang,
  dict,
}: ProjectsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const updateUrl = (params: { search?: string; tag?: number | null }) => {
    const url = new URLSearchParams();

    const newSearch =
      params.search !== undefined ? params.search : initialSearch;
    const newTag = params.tag !== undefined ? params.tag : initialTagId;

    if (newSearch) url.set("search", newSearch);
    if (newTag) url.set("tag", newTag.toString());

    router.push(`${pathname}?${url.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== initialSearch) {
        updateUrl({ search: searchQuery });
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, initialSearch]);

  const filterItems = [
    {
      label: (dict.projects?.all || "all").toLowerCase(),
      onClick: () => updateUrl({ tag: null }),
      active: !initialTagId,
    },
    ...initialTags.map((t) => ({
      label: t.name,
      onClick: () => updateUrl({ tag: t.id }),
      active: initialTagId === t.id,
    })),
  ];

  const backToHomeLabel = `← ${(dict.projects?.backToHome || dict.notFound?.goHome || "back to home").toLowerCase()}`;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-8 md:pt-16 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
        <SectionHeading
          title={dict.projects?.allWorks || "works"}
          action={{
            label: backToHomeLabel,
            href: `/${lang}`,
          }}
        />

        <div className="relative w-full md:w-72">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/50" />
          <input
            type="text"
            placeholder={(dict.projects?.searchPlaceholder || "search projects...").toLowerCase()}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-7 pr-3 bg-transparent border-b border-ink/30 focus:border-brand-900 focus:outline-none text-xs md:text-sm font-medium text-ink placeholder:text-ink/40 lowercase transition-colors"
          />
        </div>
      </div>

      <div className="mb-12 md:mb-16">
        <SlashList
          items={filterItems}
          itemClassName="text-sm md:text-base font-bold"
          slashClassName="text-sm md:text-base"
        />
      </div>

      {initialProjects.length === 0 ? (
        <div className="py-24 text-center text-sm text-ink/60 lowercase select-none">
          {(dict.projects?.noProjects || "no projects match your search criteria.").toLowerCase()}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
          {initialProjects.map((project, idx) => (
            <ProjectCard
              key={project.id}
              project={project}
              lang={lang}
              priority={idx < 4}
              imageClassName="aspect-square"
              noImageText={dict.common?.noImage || "no image"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
