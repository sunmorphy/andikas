"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Xmark, ZoomIn, ZoomOut, Refresh } from "iconoir-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@andikas/types";
import { getMediaUrl, isMediaUrl, replaceMediaUrlsInContent } from "@/lib/media";
import { SlashList, SlashListItem } from "@/components/ui/SlashList";
import { UnderlineLink } from "@/components/ui/UnderlineLink";
import { userConfig } from "@/lib/userConfig";

interface Props {
  project: Project;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any;
  lang: string;
}

export default function ProjectDetailClient({ project, dict, lang }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt?: string } | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  const openPreview = (src: string, alt?: string) => {
    setZoomScale(1);
    setPreviewImage({ src, alt });
  };

  const closePreview = useCallback(() => {
    setPreviewImage(null);
    setZoomScale(1);
  }, []);

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomScale((prev) => Math.min(3, +(prev + 0.5).toFixed(1)));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomScale((prev) => Math.max(1, +(prev - 0.5).toFixed(1)));
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomScale(1);
  };

  const toggleImageZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale((prev) => (prev > 1 ? 1 : 2));
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoomScale((prev) => {
      const next = +(prev + delta).toFixed(2);
      return Math.min(3, Math.max(1, next));
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePreview();
      }
    };
    if (previewImage) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [previewImage, closePreview]);

  const coverImageUrl = getMediaUrl(project.coverImage, 'projects');

  const metadataItems: SlashListItem[] = [
    ...(project.year ? [String(project.year)] : []),
    project.type === "group"
      ? (dict.projects?.groupProject || "group project")
      : (dict.projects?.personalProject || "personal project"),
    ...(project.projectTags?.map((t) => t.tag?.name).filter((n): n is string => Boolean(n)) || []),
    ...(project.skills?.map((s) => s.name).filter((n): n is string => Boolean(n)) || []),
  ];

  const linkItems: SlashListItem[] = [
    ...(project.githubUrl
      ? [{ label: (dict.projects?.github || "github").toLowerCase(), href: project.githubUrl }]
      : []),
    ...(project.liveUrl
      ? [{ label: (dict.projects?.live || "live").toLowerCase(), href: project.liveUrl }]
      : []),
  ];

  const markdownComponents = {
    img: ({ ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
      const resolvedSrc = getMediaUrl(props.src, 'projects');
      return (
        <span
          className="block my-8 cursor-zoom-in overflow-hidden bg-neutral-200/40 group relative select-none"
          onClick={() =>
            resolvedSrc &&
            openPreview(resolvedSrc, props.alt ? String(props.alt) : undefined)
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            {...props}
            src={resolvedSrc}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            alt={props.alt || project.title}
          />
        </span>
      );
    },
    a: ({ ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      const href = props.href || "";
      const isMedia = isMediaUrl(href);
      const resolvedHref = isMedia ? getMediaUrl(href, 'projects') : href;
      const isExternal = isMedia || resolvedHref.startsWith("http");
      return (
        <a
          {...props}
          href={resolvedHref}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-brand-900 underline underline-offset-4 decoration-1 font-bold hover:opacity-80 transition-opacity"
        />
      );
    },
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-ink lowercase mt-12 mb-6 select-none">
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-2xl md:text-4xl font-bold tracking-tighter text-ink lowercase mt-10 mb-4 select-none">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-xl md:text-2xl font-bold tracking-tight text-ink lowercase mt-8 mb-3 select-none">
        {children}
      </h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-sm md:text-base text-ink leading-relaxed my-4">
        {children}
      </p>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-disc list-inside my-4 text-sm md:text-base text-ink space-y-1">
        {children}
      </ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-inside my-4 text-sm md:text-base text-ink space-y-1">
        {children}
      </ol>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-2 border-brand-900 pl-4 my-6 italic text-ink/80">
        {children}
      </blockquote>
    ),
  };

  return (
    <article ref={containerRef} className="w-full max-w-5xl mx-auto px-6 md:px-12 pt-8 md:pt-16 pb-32">
      <div className="mb-8 md:mb-12">
        <Link
          href={lang === "en" ? "/projects" : `/projects?lang=${lang}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-ink hover:text-brand-900 transition-colors lowercase select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {(dict.projects?.backToWorks || dict.projects?.backToProjects || "back to works").toLowerCase()}
        </Link>
      </div>

      <div className="flex flex-col items-start gap-2 mb-10 md:mb-14">
        <h1 className="text-4xl md:text-7xl font-bold tracking-tighter text-ink lowercase leading-[0.95] select-none">
          {project.title.toLowerCase()}
        </h1>

        <SlashList
          items={metadataItems}
          className="mt-2"
          itemClassName="text-xs md:text-sm font-bold"
          slashClassName="text-xs md:text-sm"
        />

        {linkItems.length > 0 && (
          <SlashList
            items={linkItems}
            className="mt-1"
            itemClassName="text-xs md:text-sm font-bold underline underline-offset-4 decoration-ink/40 hover:decoration-brand-900"
            slashClassName="text-xs md:text-sm"
          />
        )}
      </div>

      {project.description && (
        <div className="text-base md:text-lg text-ink leading-relaxed mb-12 max-w-3xl font-normal">
          {project.description}
        </div>
      )}

      {coverImageUrl && (
        <div
          className="relative w-full aspect-[16/9] bg-neutral-200/40 overflow-hidden cursor-zoom-in mb-16 select-none"
          onClick={() => openPreview(coverImageUrl, project.title)}
        >
          <Image
            src={coverImageUrl}
            alt={project.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="object-cover transition-transform duration-500 hover:scale-[1.02]"
          />
        </div>
      )}

      {project.content && (
        <div className="w-full max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {replaceMediaUrlsInContent(project.content)}
          </ReactMarkdown>
        </div>
      )}

      <div className="mt-20 pt-12 border-t border-ink/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <UnderlineLink href={lang === "en" ? "/projects" : `/projects?lang=${lang}`}>
          {`← ${(dict.projects?.backToWorks || dict.projects?.backToProjects || "back to works").toLowerCase()}`}
        </UnderlineLink>
        <UnderlineLink href={`mailto:${userConfig.email || "hello@andikas.dev"}`}>
          {`${(dict.home?.letsTalk || "let's talk").toLowerCase()} →`}
        </UnderlineLink>
      </div>

      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-ink/85 backdrop-blur-sm select-none overflow-hidden"
            onClick={closePreview}
            onWheel={handleWheelZoom}
          >
            <div
              className="absolute top-6 z-50 flex items-center gap-2 px-4 py-2 bg-surface text-ink shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomScale <= 1}
                className="p-1.5 hover:text-brand-900 disabled:opacity-30 transition-colors cursor-pointer"
                title={dict.common?.zoomOut || "Zoom Out"}
                aria-label={dict.common?.zoomOut || "Zoom Out"}
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold min-w-[40px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomScale >= 3}
                className="p-1.5 hover:text-brand-900 disabled:opacity-30 transition-colors cursor-pointer"
                title={dict.common?.zoomIn || "Zoom In"}
                aria-label={dict.common?.zoomIn || "Zoom In"}
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {zoomScale > 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 hover:text-brand-900 transition-colors cursor-pointer"
                  title={dict.common?.resetZoom || "Reset Zoom"}
                  aria-label={dict.common?.resetZoom || "Reset Zoom"}
                >
                  <Refresh className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="w-[1px] h-3.5 bg-ink/20 mx-1" />

              <button
                type="button"
                onClick={closePreview}
                className="p-1.5 hover:text-brand-900 transition-colors cursor-pointer"
                title={dict.common?.close || "Close"}
                aria-label={dict.common?.close || "Close"}
              >
                <Xmark className="w-4 h-4" />
              </button>
            </div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-7xl max-h-[88vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative overflow-hidden max-h-[82vh] flex items-center justify-center">
                <motion.div
                  drag={zoomScale > 1}
                  dragConstraints={{
                    left: -300 * zoomScale,
                    right: 300 * zoomScale,
                    top: -200 * zoomScale,
                    bottom: 200 * zoomScale,
                  }}
                  dragElastic={0.1}
                  animate={{ scale: zoomScale }}
                  transition={{ duration: 0.15 }}
                  className={`relative ${
                    zoomScale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
                  }`}
                  onClick={toggleImageZoom}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewImage.src}
                    alt={previewImage.alt || project.title}
                    className="max-h-[82vh] w-auto max-w-full object-contain pointer-events-none select-none"
                  />
                </motion.div>
              </div>

              {previewImage.alt && (
                <p className="mt-3 text-xs text-surface font-medium text-center max-w-2xl px-4 select-none">
                  {previewImage.alt}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
