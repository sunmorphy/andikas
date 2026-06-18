"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Education, Experience } from "@andikas/types";

type EduItem = { kind: "edu"; yearStart: number; yearEnd: string; title: string; subtitle: string; desc: string; skills: string[] };
type ExpItem = { kind: "exp"; yearStart: number; yearEnd: string; title: string; subtitle: string; desc: string; skills: string[] };
type TimelineItem = EduItem | ExpItem;

interface Props {
    educations: Education[];
    experiences: Experience[];
}

export default function JourneyTimeline({ educations, experiences }: Props) {
    const timelineRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: timelineRef,
        offset: ["start 65%", "end 65%"],
    });

    // Growing red vertical progress line
    const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

    const items: TimelineItem[] = [
        ...educations.map(edu => {
            const yearStr = String(edu.year);
            const start = Number(yearStr.split("-")[0]);
            const end = yearStr.split("-")[1] || String(start);
            return {
                kind: "edu" as const,
                yearStart: start,
                yearEnd: end,
                title: edu.degree || "Education",
                subtitle: edu.institutionName,
                desc: edu.description || "",
                skills: []
            };
        }),
        ...experiences.map(exp => ({
            kind: "exp" as const,
            yearStart: exp.startYear,
            yearEnd: String(exp.endYear || "PRESENT"),
            title: exp.companyName,
            subtitle: exp.location || "",
            desc: exp.description || "",
            skills: exp.experienceSkills?.map(s => s.skill.name) || []
        })),
    ].sort((a, b) => b.yearStart - a.yearStart); // Newest first

    return (
        <div ref={timelineRef} className="w-full relative pl-6 md:pl-0">
            {/* Background Grey Guide Line */}
            <div className="absolute left-2 md:left-[33.33%] top-0 bottom-0 w-[1px] bg-neutral-200" />
            
            {/* Animated Red Progress Line */}
            <motion.div
                className="absolute left-2 md:left-[33.33%] top-0 bottom-0 w-[1.5px] bg-brand-900 origin-top"
                style={{ scaleY }}
            />

            {/* Header row for larger screens */}
            <div className="hidden md:grid grid-cols-12 py-4 text-[10px] font-bold uppercase tracking-wider text-neutral-400 relative z-10">
                <div className="col-span-2">Duration</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-4 pl-4">Role / Degree</div>
                <div className="col-span-4">Description & capabilities</div>
            </div>

            {/* Content rows */}
            {items.map((item, idx) => {
                const duration = `${item.yearStart} — ${item.yearEnd}`;
                return (
                    <motion.div
                        key={idx}
                        className="grid grid-cols-1 md:grid-cols-12 py-8 md:py-10 gap-4 md:gap-0 items-start relative z-10"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Column 1: Duration */}
                        <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-neutral-900">
                            {duration}
                        </div>

                        {/* Column 2: Kind/Type */}
                        <div className="col-span-2 text-[10px] font-semibold uppercase tracking-widest text-brand-900">
                            {item.kind === "edu" ? "EDUCATION" : "EXPERIENCE"}
                        </div>

                        {/* Column 3: Role & Institution */}
                        <div className="col-span-4 flex flex-col gap-1 pr-4 md:pl-4">
                            <h4 className="text-base font-bold uppercase tracking-tight text-neutral-900">
                                {item.title}
                            </h4>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                {item.subtitle}
                            </span>
                        </div>

                        {/* Column 4: Desc & Tags */}
                        <div className="col-span-4 flex flex-col gap-4">
                            {item.desc && (
                                <p className="text-xs text-neutral-500 leading-relaxed font-normal whitespace-pre-wrap">
                                    {item.desc}
                                </p>
                            )}
                            
                            {item.skills.length > 0 && (
                                <div className="flex flex-wrap gap-x-2 gap-y-1">
                                    {item.skills.map((skill, sIdx) => (
                                        <span key={sIdx} className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                                            {skill}{sIdx < item.skills.length - 1 ? " /" : ""}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
