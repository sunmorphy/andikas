"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Code } from "iconoir-react";
import { Project, Tag, PaginatedMeta } from "@andikas/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion";

interface ProjectsClientProps {
    initialProjects: Project[];
    initialMeta?: PaginatedMeta;
    initialTags: Tag[];
    initialSearch: string;
    initialTagId?: number;
    lang: string;
    dict: any;
}

function ScrollAnimatedRow({
    children,
    className,
    onMouseEnter
}: {
    children: React.ReactNode;
    className?: string;
    onMouseEnter: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // Animate opacity, vertical offset, and scale dynamically as the row travels through the viewport
    const opacity = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0, 1, 1, 0]);
    const y = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [40, 0, 0, -40]);
    const scale = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0.97, 1, 1, 0.97]);

    return (
        <motion.div
            ref={ref}
            layout
            style={{ opacity, y, scale }}
            className={className}
            onMouseEnter={onMouseEnter}
        >
            {children}
        </motion.div>
    );
}

export default function ProjectsClient({
    initialProjects,
    initialTags,
    initialSearch,
    initialTagId,
    lang,
    dict
}: ProjectsClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [isPending, startTransition] = React.useTransition();

    // Hover state for the list view
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [isRightHalf, setIsRightHalf] = useState(false);

    // Mouse tracking for floating preview
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 30, stiffness: 220, mass: 0.5 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    const handleMouseMove = (e: React.MouseEvent) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
        setIsRightHalf(e.clientX > window.innerWidth / 2);
    };

    const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        startTransition(() => {
            router.push(href);
        });
    };

    const updateUrl = (params: { search?: string; tag?: number | null }) => {
        const url = new URLSearchParams();

        let newSearch = params.search !== undefined ? params.search : initialSearch;
        let newTag = params.tag !== undefined ? params.tag : initialTagId;

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
    }, [searchQuery, initialSearch]);

    const projects = initialProjects;

    return (
        <div className="w-4/5 mx-auto px-6 pt-24 pb-32 flex flex-col items-center">
            <div className="w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div>
                        <h1 className="text-6xl font-bold tracking-tight uppercase text-neutral-900 leading-none">
                            PROJECTS<span className="text-brand-900">.</span>
                        </h1>
                    </div>
                </div>

                <div className="flex flex-col gap-6 mb-16 w-full">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 pl-11 pr-4 rounded-none border border-neutral-200 bg-neutral-100/50 focus:outline-none focus:border-brand-900 text-sm placeholder:text-neutral-400"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pb-6">
                        <button
                            onClick={() => updateUrl({ tag: null })}
                            className={cn(
                                "px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
                                !initialTagId
                                    ? "bg-brand-900 text-neutral-50"
                                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                            )}
                        >
                            {dict.projects.allWorks}
                        </button>
                        {initialTags.map(t => (
                            <button
                                key={t.id}
                                onClick={() => updateUrl({ tag: t.id })}
                                className={cn(
                                    "px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
                                    initialTagId === t.id
                                        ? "bg-brand-900 text-neutral-50"
                                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                )}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>

                {projects.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-neutral-500">{dict.projects.noProjects}</div>
                ) : (
                    <div
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setActiveProject(null)}
                        className="flex flex-col w-full mb-20 select-none relative"
                    >
                        <AnimatePresence mode="popLayout">
                            {projects.map((project, idx) => {
                                return (
                                    <ScrollAnimatedRow
                                        key={project.id}
                                        className="relative group/row"
                                        onMouseEnter={() => setActiveProject(project)}
                                    >
                                        <Link
                                            onClick={(e) => handleNavigate(e, `/${lang}/projects/${project.slug}`)}
                                            href={`/${lang}/projects/${project.slug}`}
                                            className="grid grid-cols-12 items-center py-8 md:py-10 px-2 cursor-pointer w-full group transition-colors duration-300 hover:border-brand-900"
                                        >
                                            <div className="col-span-full md:hidden mb-4 relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
                                                {project.coverImage ? (
                                                    <Image
                                                        src={project.coverImage}
                                                        alt={project.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="100vw"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-neutral-200" />
                                                )}
                                            </div>

                                            <div className="col-span-2 md:col-span-1 font-mono text-xs text-neutral-400 font-bold group-hover:text-brand-900 transition-colors">
                                                {idx + 1}.
                                            </div>

                                            <div className="col-span-10 md:col-span-5 pr-4">
                                                <h3 className="text-xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900 group-hover:text-brand-900 transition-colors duration-300 leading-none">
                                                    {project.title}
                                                </h3>
                                            </div>

                                            <div className="col-span-9 md:col-span-4 mt-2 md:mt-0 font-sans text-[10px] md:text-xs font-bold uppercase tracking-wider text-neutral-500 group-hover:text-brand-900/80 transition-colors duration-300 truncate pr-2">
                                                {project.projectTags?.map(pt => pt.tag.name).join(" / ") || "Project"}
                                            </div>

                                            <div className="col-span-3 md:col-span-2 mt-2 md:mt-0 flex items-center justify-between font-mono text-xs text-neutral-400 group-hover:text-brand-900 transition-colors duration-300">
                                                <span className="font-bold">{project.year || "N/A"}</span>
                                                <div className="transform transition-transform duration-300">
                                                    <svg width="1.5em" height="1.5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-neutral-800 group-hover:text-brand-900 transition-colors">
                                                        <line x1="7" y1="17" x2="17" y2="7"></line>
                                                        <polyline points="7 7 17 7 17 17"></polyline>
                                                    </svg>
                                                </div>
                                            </div>
                                        </Link>
                                    </ScrollAnimatedRow>
                                );
                            })}
                        </AnimatePresence>

                        <motion.div
                            style={{
                                left: cursorX,
                                top: cursorY,
                                x: isRightHalf ? "-105%" : "15px",
                                y: "-50%",
                                pointerEvents: "none",
                                position: "fixed",
                            }}
                            className="z-50 hidden md:block w-80 h-52 overflow-hidden pointer-events-none rounded-none shadow-2xl bg-neutral-900 border border-neutral-300"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: activeProject ? 1 : 0,
                                scale: activeProject ? 1 : 0.8,
                                transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
                            }}
                        >
                            <div className="w-full h-full relative">
                                {activeProject && activeProject.coverImage ? (
                                    <Image
                                        src={activeProject.coverImage}
                                        alt={activeProject.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-xs text-neutral-500 font-bold uppercase tracking-wider">
                                        No Preview
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>

            {isPending && (
                <div className="fixed inset-0 z-[100] bg-surface flex items-center justify-center">
                    <div className="relative flex flex-col items-center gap-3">
                        <div className="relative bg-brand-900 w-12 h-12 flex items-center justify-center">
                            <Code className="w-6 h-6 text-neutral-50 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">LOADING...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
