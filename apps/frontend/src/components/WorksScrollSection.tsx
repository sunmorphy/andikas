"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "iconoir-react";
import { Project } from "@andikas/types";

interface Props {
    projects: Project[];
    title: string;
    seeAllWorksText: string;
    lang: string;
}

export default function WorksScrollSection({ projects, title, seeAllWorksText, lang }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);
    const [maxTranslate, setMaxTranslate] = useState(0);

    useEffect(() => {
        const updateDimensions = () => {
            if (rowRef.current) {
                const scrollWidth = rowRef.current.scrollWidth;
                const clientWidth = rowRef.current.clientWidth;
                // Translate exactly by the hidden overflow width
                setMaxTranslate(Math.max(0, scrollWidth - clientWidth));
            }
        };

        updateDimensions();
        const timer = setTimeout(updateDimensions, 100); // safety fallback
        window.addEventListener("resize", updateDimensions);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", updateDimensions);
        };
    }, [projects]);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Translate the horizontal gallery from left to right as the user scrolls
    const x = useTransform(scrollYProgress, [0.05, 0.95], [0, -maxTranslate]);

    // Configuration for Swiss asymmetrical layouts
    const projectLayouts = [
        { containerClass: "w-[75vw] md:w-[25vw] shrink-0 flex flex-col md:mb-12", aspectClass: "aspect-[3/4]" },
        { containerClass: "w-[75vw] md:w-[30vw] shrink-0 flex flex-col md:mb-24", aspectClass: "aspect-[4/5]" },
        { containerClass: "w-[75vw] md:w-[35vw] shrink-0 flex flex-col md:mb-0", aspectClass: "aspect-[3/4]" },
        { containerClass: "w-[75vw] md:w-[28vw] shrink-0 flex flex-col md:mb-20", aspectClass: "aspect-[4/5]" },
        { containerClass: "w-[75vw] md:w-[22vw] shrink-0 flex flex-col md:mb-8", aspectClass: "aspect-[3/4]" }
    ];

    return (
        <div ref={containerRef} id="selected-works" className="w-full h-[250vh] relative">
            <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden">
                <div className="w-4/5 mx-auto px-6 flex flex-col items-start w-full">
                    <h2 className="text-3xl md:text-5xl font-bold mb-16 tracking-tight uppercase text-neutral-900">
                        {title}<span className="text-brand-900">.</span>
                    </h2>

                    <div className="w-full overflow-hidden mb-12 relative">
                        <motion.div
                            ref={rowRef}
                            className="flex flex-row flex-nowrap gap-6 md:gap-16 pb-8 items-end select-none"
                            style={{ x }}
                        >
                            {projects.map((project, idx) => {
                                const layout = projectLayouts[idx % projectLayouts.length] || projectLayouts[0]!;

                                return (
                                    <div key={project.id} className={`${layout.containerClass} flex flex-col group`}>
                                        <div className="flex items-center gap-2 mb-3.5">
                                            <Link href={`/${lang}/projects/${project.slug}`}>
                                                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-900 group-hover:text-brand-900 transition-colors">
                                                    {project.title}
                                                </h3>
                                            </Link>
                                        </div>

                                        <Link
                                            href={`/${lang}/projects/${project.slug}`}
                                            className={`block relative w-full ${layout.aspectClass} overflow-hidden bg-neutral-100`}
                                        >
                                            <div className="w-full h-full relative">
                                                {project.coverImage ? (
                                                    <Image
                                                        src={project.coverImage}
                                                        alt={project.title}
                                                        fill
                                                        className="object-cover transition-all duration-500"
                                                        sizes="(max-width: 768px) 75vw, 400px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-xs text-neutral-450 font-bold tracking-wider">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                            {projects.length === 0 && (
                                <div className="py-20 text-center text-neutral-500 w-full">No Projects</div>
                            )}
                        </motion.div>
                    </div>

                    <Link href={`/${lang}/projects`} className="inline-flex self-end items-center gap-2 text-xl md:text-sm font-bold tracking-widest uppercase text-neutral-900 hover:text-brand-900 transition-colors border-b-2 border-neutral-950 pb-1 mt-4 z-10">
                        {seeAllWorksText} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
