"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface Props {
    skills: { id: string; name: string }[];
    title: string;
}

export default function SkillsScrollSection({ skills, title }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFreeScroll, setIsFreeScroll] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
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

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    // Translate the giant outline text across the background
    const marqueeXRaw = useTransform(scrollYProgress, [0, 1], ["10%", "-50%"]);
    const marqueeX = isFreeScroll ? "10%" : marqueeXRaw;

    // Fade in the actual content and skills grid
    // If free scroll mode is on, we fade out when scrolling off-screen.
    const contentOpacity = useTransform(
        scrollYProgress,
        isFreeScroll ? [0.15, 0.35, 0.75, 0.95] : [0.2, 0.4, 0.8, 0.95],
        [0, 1, 1, 0]
    );
    const contentYRaw = useTransform(scrollYProgress, [0.2, 0.4], [50, 0]);
    const contentY = isFreeScroll ? 0 : contentYRaw;

    return (
        <div ref={containerRef} id="skills" className="w-full h-[150vh] relative">
            <div id="skills-scroll-inner" className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden">
                <motion.div
                    className="absolute inset-x-0 w-[200%] whitespace-nowrap text-[8rem] md:text-[16rem] font-bold text-stroke-outlined select-none pointer-events-none opacity-10 leading-none uppercase"
                    style={{ x: marqueeX }}
                >
                    SKILLS / SKILLS / SKILLS / SKILLS
                </motion.div>

                <motion.div
                    className="w-[90%] md:w-4/5 mx-auto px-4 md:px-6 relative z-10"
                    style={isFreeScroll ? undefined : { opacity: contentOpacity, y: contentY }}
                    initial={isFreeScroll ? { opacity: 0, y: 30 } : undefined}
                    whileInView={isFreeScroll ? { opacity: 1, y: 0 } : undefined}
                    viewport={isFreeScroll ? { once: true, margin: "-100px" } : undefined}
                    transition={isFreeScroll ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] } : { ease: "linear" }}
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 md:mb-16 tracking-tight uppercase text-neutral-900">
                        {title}<span className="text-brand-900">.</span>
                    </h2>

                    <div className="w-full py-4 md:py-10">
                        <div className="flex flex-wrap gap-x-4 md:gap-x-8 gap-y-2 md:gap-y-4 text-lg sm:text-xl md:text-4xl font-bold uppercase tracking-tighter text-neutral-900 leading-relaxed max-w-4xl">
                            {skills.map((skill, sIdx) => (
                                <span key={skill.id} className="inline-flex items-center gap-2 md:gap-3">
                                    {skill.name}
                                    {sIdx < skills.length - 1 && <span className="text-brand-900 font-normal">/</span>}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
