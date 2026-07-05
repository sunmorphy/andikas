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
    const [isFreeScroll, setIsFreeScroll] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsFreeScroll(document.documentElement.classList.contains("free-scroll"));

            const observer = new MutationObserver(() => {
                setIsFreeScroll(document.documentElement.classList.contains("free-scroll"));
            });

            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ["class"],
            });

            return () => observer.disconnect();
        }
    }, []);

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
        offset: isFreeScroll ? ["start end", "end start"] : ["start start", "end end"],
    });

    // Translate the horizontal gallery from left to right as the user scrolls
    const x = useTransform(scrollYProgress, [0.05, 0.95], [0, -maxTranslate]);

    // If free scroll mode is on, we fade the section in as it enters, and out as it leaves the viewport.
    const worksOpacity = useTransform(
        scrollYProgress,
        isFreeScroll ? [0.15, 0.35, 0.75, 0.95] : [0, 1],
        isFreeScroll ? [0, 1, 1, 0] : [1, 1]
    );

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
            <motion.div
                id="works-scroll-inner"
                className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden"
                style={isFreeScroll ? undefined : { opacity: worksOpacity }}
                initial={isFreeScroll ? { opacity: 0, y: 30 } : undefined}
                whileInView={isFreeScroll ? { opacity: 1, y: 0 } : undefined}
                viewport={isFreeScroll ? { once: true, margin: "-100px" } : undefined}
                transition={isFreeScroll ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] } : undefined}
            >
                <div className="w-4/5 mx-auto px-6 flex flex-col items-start w-full">
                    <h2 className="text-3xl md:text-5xl font-bold mb-16 tracking-tight uppercase text-neutral-900">
                        {title}<span className="inline-block w-[0.16em] h-[0.16em] bg-brand-900 ml-[0.05em] align-baseline"></span>
                    </h2>

                    <div className={`w-full mb-12 relative ${isFreeScroll ? "overflow-x-auto pointer-events-auto" : "overflow-hidden"}`}>
                        <motion.div
                            ref={rowRef}
                            className="flex flex-row flex-nowrap gap-6 md:gap-16 pb-8 items-end select-none"
                            style={isFreeScroll ? undefined : { x }}
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
            </motion.div>
        </div>
    );
}
