import { Project } from "@andikas/types";
import { SectionHeading } from "./ui/SectionHeading";
import { ProjectCard } from "./ui/ProjectCard";

interface Props {
  projects: Project[];
  lang: string;
  title?: string;
  seeAllText?: string;
  noImageText?: string;
}

export function WorksSection({
  projects,
  lang,
  title = "works",
  seeAllText = "see all →",
  noImageText = "no image",
}: Props) {
  return (
    <section id="works" className="w-full max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
      <SectionHeading
        title={title}
        action={{
          label: seeAllText,
          href: lang === "en" ? "/projects" : `/projects?lang=${lang}`,
        }}
        className="mb-12 md:mb-16"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 items-end">
        {projects.map((project, idx) => {
          const isCenter = idx === 2;
          return (
            <ProjectCard
              key={project.id}
              project={project}
              lang={lang}
              imageClassName={isCenter ? "aspect-[4/5]" : "aspect-square"}
              noImageText={noImageText}
            />
          );
        })}
      </div>
    </section>
  );
}
