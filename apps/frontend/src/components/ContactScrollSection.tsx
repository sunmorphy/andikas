"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Download } from "iconoir-react";
import { userConfig } from "@/lib/userConfig";

interface Props {
    dict: any;
}

export default function ContactScrollSection({ dict }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Animate title parts converging
    const xLeft = useTransform(scrollYProgress, [0, 0.45], ["-30%", "0%"]);
    const xRight = useTransform(scrollYProgress, [0, 0.45], ["30%", "0%"]);

    // Scale the red period massively, then fade it out
    const dotScale = useTransform(scrollYProgress, [0.45, 0.65, 0.8], [1, 120, 0]);
    const dotOpacity = useTransform(scrollYProgress, [0.75, 0.8], [1, 0]);

    // Fade and translate the contact details grid
    const detailsOpacity = useTransform(scrollYProgress, [0.65, 0.8], [0, 1]);
    const detailsY = useTransform(scrollYProgress, [0.65, 0.8], [60, 0]);

    return (
        <div ref={containerRef} id="contact" className="w-full h-[150vh] relative">
            <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden">
                <div className="w-4/5 mx-auto px-6 relative flex flex-col justify-center min-h-[500px]">
                    <div className="relative mb-16 select-none z-10">
                        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.85] text-neutral-900">
                            <motion.span style={{ x: xLeft }} className="block" transition={{ ease: "linear" }}>
                                LET'S BUILD
                            </motion.span>
                            <motion.span style={{ x: xRight }} className="block" transition={{ ease: "linear" }}>
                                SOMETHING
                                <motion.span
                                    style={{ scale: dotScale, opacity: dotOpacity, transformOrigin: "center" }}
                                    className="inline-block text-brand-900 origin-center"
                                >
                                    .
                                </motion.span>
                            </motion.span>
                        </h2>
                    </div>
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-12 gap-10 items-end w-full relative z-20"
                        style={{ opacity: detailsOpacity, y: detailsY }}
                        transition={{ ease: "linear" }}
                    >
                        <div className="md:col-span-6">
                            <p className="text-neutral-500 mb-10 leading-relaxed text-xl md:text-base max-w-sm">
                                {dict.home.freelance}
                            </p>

                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-base md:text-xs font-bold tracking-widest text-neutral-900 uppercase">
                                {userConfig.socialMedias.map((social, idx) => {
                                    const parts = social.split("|");
                                    const url = parts.length > 1 ? parts[1] : parts[0] || "";
                                    const username = url.split("/").filter(Boolean).pop();
                                    const platform = url.split("/").filter(Boolean)[1] || "Social";

                                    return (
                                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="hover:text-brand-900 transition-colors">
                                            <span>{platform}/{username}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="md:col-span-6 flex flex-col items-start md:items-end gap-6 w-full">
                            <a href={`mailto:${userConfig.email}`} className="text-2xl md:text-4xl font-bold uppercase tracking-tighter text-neutral-900 hover:text-brand-900 transition-colors border-b-2 border-neutral-900 pb-1">
                                {userConfig.email.toUpperCase()}
                            </a>

                            {userConfig.resume && (
                                <a href={userConfig.resume} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-base md:text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors">
                                    <span>{dict.home.downloadResume}</span>
                                    <Download className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
