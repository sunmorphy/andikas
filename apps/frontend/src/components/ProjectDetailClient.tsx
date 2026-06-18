"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "iconoir-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, useScroll, useTransform } from "framer-motion";
import { Project } from "@andikas/types";
import { Button } from "@/components/ui/Button";

interface Props {
    project: Project;
    dict: any;
    lang: string;
}

export default function ProjectDetailClient({ project, dict, lang }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Track scroll progress of the entire article container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 20%", "end end"]
    });

    const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

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

                    <aside className="col-span-12 md:col-span-4 md:sticky md:top-28 self-start flex flex-col gap-8 w-full pr-0 md:pr-12 pl-0">
                        <div className="flex flex-col gap-5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            <div className="mb-8 pb-6 md:mb-16 md:pb-12 w-full">
                                <div className="overflow-hidden">
                                    <motion.h1
                                        className="text-3xl md:text-6xl font-black tracking-tighter uppercase text-neutral-900 mb-0"
                                        initial={{ y: "100%" }}
                                        animate={{ y: 0 }}
                                        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        {project.title}<span className="text-brand-900">.</span>
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
                            className="text-lg md:text-xl text-neutral-600 font-normal leading-relaxed"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.description}</ReactMarkdown>
                        </motion.div>

                        {project.coverImage && (
                            <motion.div
                                initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
                                whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                className="relative w-full aspect-[16/9] overflow-hidden"
                            >
                                <motion.div
                                    className="relative w-full h-full"
                                    initial={{ scale: 1.12 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <Image
                                        src={project.coverImage}
                                        fill
                                        alt={project.title}
                                        className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
                                        sizes="(max-width: 1024px) 100vw, 1200px"
                                        priority
                                    />
                                </motion.div>
                            </motion.div>
                        )}

                        {project.content && (
                            <motion.section
                                className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed text-base md:text-lg"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-80px" }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.content}</ReactMarkdown>
                            </motion.section>
                        )}

                        {project.contentImages && project.contentImages.length > 0 && (
                            <div className="flex flex-col gap-8 w-full mt-8">
                                {project.contentImages.map((img, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
                                        whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
                                        viewport={{ once: true, margin: "-80px" }}
                                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                        className="relative w-full aspect-[16/9] overflow-hidden"
                                    >
                                        <motion.div
                                            className="relative w-full h-full"
                                            initial={{ scale: 1.15 }}
                                            whileInView={{ scale: 1 }}
                                            viewport={{ once: true, margin: "-80px" }}
                                            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                                        >
                                            <Image
                                                src={img}
                                                fill
                                                alt={`${project.title} — gallery image ${idx + 1}`}
                                                className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
                                                sizes="(max-width: 1024px) 100vw, 1200px"
                                            />
                                        </motion.div>
                                    </motion.div>
                                ))}
                            </div>
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
        </article>
    );
}
