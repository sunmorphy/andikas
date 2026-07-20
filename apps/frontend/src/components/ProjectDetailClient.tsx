"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Xmark, ZoomIn, ZoomOut, Refresh } from "iconoir-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Project } from "@andikas/types";
import { Button } from "@/components/ui/Button";

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
        setZoomScale(prev => Math.min(3, +(prev + 0.5).toFixed(1)));
    };

    const handleZoomOut = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setZoomScale(prev => Math.max(1, +(prev - 0.5).toFixed(1)));
    };

    const handleResetZoom = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setZoomScale(1);
    };

    const toggleImageZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoomScale(prev => (prev > 1 ? 1 : 2));
    };

    // Handle mouse wheel zoom
    const handleWheelZoom = (e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY < 0 ? 0.25 : -0.25;
        setZoomScale(prev => {
            const next = +(prev + delta).toFixed(2);
            return Math.min(3, Math.max(1, next));
        });
    };

    // Handle Escape key and disable scrolling when preview is open
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

    // Track scroll progress of the entire article container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 20%", "end end"]
    });

    const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

    const markdownComponents = {
        // Custom renderer for markdown images
        img: ({ ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
            <span
                className="block my-6 cursor-zoom-in overflow-hidden rounded-xl group relative select-none"
                onClick={() => props.src && openPreview(String(props.src), props.alt ? String(props.alt) : undefined)}
            >
                <img
                    {...props}
                    className="w-full h-auto rounded-xl transition-transform duration-500 group-hover:scale-[1.02] shadow-sm"
                    alt={props.alt || "Project detail image"}
                />
                <span className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950/80 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none shadow-sm">
                    Click to enlarge
                </span>
            </span>
        )
    };

    return (
        <article ref={containerRef} className="w-full md:w-4/5 mx-auto px-6 pt-24 pb-32 relative">
            <div className="w-full relative z-10">
                <Link href={`/${lang}/projects`} className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-brand-900 transition-colors mb-12 md:mb-32 uppercase tracking-widest cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" /> {dict.projects.backToProjects}
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 w-full items-start relative pl-6 md:pl-0">
                    <div className="absolute left-2 md:left-[33.33%] top-0 bottom-0 w-[1px] bg-neutral-200 pointer-events-none" />
                    <motion.div
                        className="absolute left-2 md:left-[33.33%] top-0 bottom-0 w-[1.5px] bg-brand-900 origin-top pointer-events-none"
                        style={{ scaleY }}
                    />

                    <aside className="col-span-12 md:col-span-4 md:sticky md:top-28 self-start flex flex-col gap-8 w-full pr-0 md:pr-6 lg:pr-12 pl-0">
                        <div className="flex flex-col gap-5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            <div className="mb-8 pb-6 md:mb-16 md:pb-12 w-full">
                                <div className="overflow-hidden">
                                    <motion.h1
                                        className="text-3xl md:text-[clamp(1.5rem,3vw,3.75rem)] font-black tracking-tighter uppercase text-neutral-900 mb-0"
                                        initial={{ y: "100%" }}
                                        animate={{ y: 0 }}
                                        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        {project.title}<span className="inline-block w-[0.16em] h-[0.16em] bg-brand-900 ml-[0.05em] align-baseline"></span>
                                    </motion.h1>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-neutral-455 block text-[9px]">{dict.projects.type}</span>
                                <span className="text-neutral-900 text-xs font-black">{project.type === 'group' ? dict.projects.groupProject : dict.projects.personalProject}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-t border-neutral-100 pt-3">
                                <span className="text-neutral-455 block text-[9px]">{dict.projects.tags}</span>
                                <span className="text-neutral-900 text-xs font-black">{project.projectTags?.map(t => t.tag.name).join(" / ") || "N/A"}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-t border-neutral-100 pt-3">
                                <span className="text-neutral-455 block text-[9px]">{dict.projects.year}</span>
                                <span className="text-neutral-900 text-xs font-black">{project.year || "N/A"}</span>
                            </div>
                            {(project.githubUrl || project.liveUrl) && (
                                <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
                                    <span className="text-neutral-455 block text-[9px]">LINKS</span>
                                    <div className="flex gap-4">
                                        {project.githubUrl && (
                                            <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-brand-900 hover:underline">
                                                GITHUB
                                            </a>
                                        )}
                                        {project.liveUrl && (
                                            <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-brand-900 hover:underline">
                                                LIVE DEMO
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>

                    <div className="col-span-12 md:col-span-8 flex flex-col gap-16 w-full pl-0 md:pl-12">

                        <motion.div
                            className="text-xl md:text-lg text-neutral-600 font-normal leading-relaxed"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{project.description}</ReactMarkdown>
                        </motion.div>

                        {project.coverImage && (
                            <motion.div
                                initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
                                whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
                                viewport={{ once: true, margin: "-20px" }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                className="relative w-full aspect-[16/9] overflow-hidden rounded-xl cursor-zoom-in group select-none"
                                onClick={() => openPreview(project.coverImage, project.title)}
                            >
                                <motion.div
                                    className="relative w-full h-full"
                                    initial={{ scale: 1.12 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true, margin: "-20px" }}
                                    transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <Image
                                        src={project.coverImage}
                                        fill
                                        alt={project.title}
                                        className="object-cover transition-all duration-500 group-hover:scale-105"
                                        sizes="(max-width: 1024px) 100vw, 1200px"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-neutral-950/0 group-hover:bg-neutral-950/20 transition-colors flex items-end justify-end p-4">
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm pointer-events-none">
                                            Click to enlarge
                                        </span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {project.content && (
                            <motion.section
                                className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed text-xl md:text-lg"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-20px" }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{project.content}</ReactMarkdown>
                            </motion.section>
                        )}


                    </div>
                </div>

                <motion.div
                    className="w-full mt-24 md:mt-48 relative overflow-hidden flex flex-col items-end gap-8"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="flex flex-col gap-2 z-10 text-end">
                        <h3 className="text-5xl font-black uppercase tracking-tight text-neutral-900 leading-none">
                            {dict.projects.interestedTitle}
                        </h3>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 z-10">
                        <Link href={`/${lang}/projects`} className="text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-brand-900 transition-colors">
                            {dict.projects.backToProjects}
                        </Link>
                        <Button asChild size="lg">
                            <Link href={`/${lang}#contact`}>{dict.projects.letsTalk}</Link>
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Image Preview Lightbox Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-neutral-950/90 backdrop-blur-md select-none overflow-hidden"
                        onClick={closePreview}
                        onWheel={handleWheelZoom}
                    >
                        {/* Floating Top Control Toolbar */}
                        <div
                            className="absolute top-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/80 border border-neutral-800 backdrop-blur-md shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={handleZoomOut}
                                disabled={zoomScale <= 1}
                                className="p-2 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                title="Zoom Out"
                                aria-label="Zoom Out"
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>

                            <span className="text-xs font-bold text-neutral-300 min-w-[44px] text-center tracking-wider">
                                {Math.round(zoomScale * 100)}%
                            </span>

                            <button
                                type="button"
                                onClick={handleZoomIn}
                                disabled={zoomScale >= 3}
                                className="p-2 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                title="Zoom In"
                                aria-label="Zoom In"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>

                            {zoomScale > 1 && (
                                <button
                                    type="button"
                                    onClick={handleResetZoom}
                                    className="p-2 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all"
                                    title="Reset Zoom"
                                    aria-label="Reset Zoom"
                                >
                                    <Refresh className="w-4 h-4" />
                                </button>
                            )}

                            <div className="w-[1px] h-4 bg-neutral-800 mx-1" />

                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={closePreview}
                                className="p-2 rounded-full text-neutral-300 hover:text-white hover:bg-brand-900 transition-all"
                                title="Close"
                                aria-label="Close image preview"
                            >
                                <Xmark className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="relative max-w-7xl max-h-[88vh] flex flex-col items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Image Box */}
                            <div className="relative overflow-hidden rounded-xl border border-neutral-800 shadow-2xl bg-neutral-950 max-h-[82vh] flex items-center justify-center">
                                <motion.div
                                    drag={zoomScale > 1}
                                    dragConstraints={{ left: -300 * zoomScale, right: 300 * zoomScale, top: -200 * zoomScale, bottom: 200 * zoomScale }}
                                    dragElastic={0.1}
                                    animate={{ scale: zoomScale }}
                                    transition={{ duration: 0.2 }}
                                    className={`relative transition-cursor ${zoomScale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
                                    onClick={toggleImageZoom}
                                >
                                    <img
                                        src={previewImage.src}
                                        alt={previewImage.alt || "Project detail image preview"}
                                        className="max-h-[82vh] w-auto max-w-full object-contain pointer-events-none select-none"
                                    />
                                </motion.div>
                            </div>

                            {/* Caption / Alt text if available */}
                            {previewImage.alt && (
                                <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="mt-3 text-xs md:text-sm text-neutral-400 font-medium text-center max-w-2xl px-4"
                                >
                                    {previewImage.alt}
                                </motion.p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </article>
    );
}
