import Image from "next/image";
import Link from "next/link";
import { Project } from "@andikas/types";
import { getMediaUrl } from "@/lib/media";

interface Props {
  project: Project;
  lang: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  noImageText?: string;
}

export function ProjectCard({
  project,
  lang,
  className = "",
  imageClassName = "",
  priority = false,
  noImageText = "no image",
}: Props) {
  const imageUrl = getMediaUrl(project.coverImage);

  return (
    <Link
      href={`/${lang}/projects/${project.slug}`}
      className={`group flex flex-col items-start block ${className}`}
    >
      <span className="text-xs md:text-sm font-medium text-ink lowercase mb-2.5 truncate max-w-full select-none group-hover:text-brand-900 transition-colors">
        {project.title.toLowerCase()}
      </span>
      <div className={`relative w-full aspect-square bg-neutral-200 overflow-hidden ${imageClassName}`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={project.title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-ink/40 lowercase">
            {noImageText.toLowerCase()}
          </div>
        )}
      </div>
    </Link>
  );
}
