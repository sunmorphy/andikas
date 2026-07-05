"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Download } from "iconoir-react";
import { userConfig } from "@/lib/userConfig";

interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dict: any;
}

export default function ContactScrollSection({ dict }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
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

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: isFreeScroll ? ["start end", "end start"] : ["start start", "end end"],
    });

    // Animate title parts converging
    const xLeftRaw = useTransform(scrollYProgress, [0, 0.45], ["-30%", "0%"]);
    const xRightRaw = useTransform(scrollYProgress, [0, 0.45], ["30%", "0%"]);

    const xLeft = isFreeScroll ? "0%" : xLeftRaw;
    const xRight = isFreeScroll ? "0%" : xRightRaw;

    // Scale the red period massively, then fade it out
    const dotScaleRaw = useTransform(scrollYProgress, [0.45, 0.65, 0.8], [1, 120, 0]);
    const dotOpacityRaw = useTransform(scrollYProgress, [0.75, 0.8], [1, 0]);

    const dotScale = isFreeScroll ? 1 : dotScaleRaw;
    const dotOpacity = isFreeScroll ? 1 : dotOpacityRaw;

    // Fade and translate the contact details grid
    const detailsOpacityRaw = useTransform(scrollYProgress, [0.65, 0.8], [0, 1]);
    const detailsYRaw = useTransform(scrollYProgress, [0.65, 0.8], [60, 0]);

    const detailsOpacity = isFreeScroll ? 1 : detailsOpacityRaw;
    const detailsY = isFreeScroll ? 0 : detailsYRaw;

    // In free scroll mode, we fade the entire section in as it enters the viewport.
    const contactOpacity = useTransform(
        scrollYProgress,
        isFreeScroll ? [0.2, 0.45] : [0, 1],
        isFreeScroll ? [0, 1] : [1, 1]
    );

    return (
        <div ref={containerRef} id="contact" className="w-full h-[150vh] relative">
            <motion.div
                id="contact-scroll-inner"
                className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden"
                style={isFreeScroll ? undefined : { opacity: contactOpacity }}
                initial={isFreeScroll ? { opacity: 0, y: 30 } : undefined}
                whileInView={isFreeScroll ? { opacity: 1, y: 0 } : undefined}
                viewport={isFreeScroll ? { once: true, margin: "-100px" } : undefined}
                transition={isFreeScroll ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] } : undefined}
            >
                <div className="w-4/5 mx-auto px-6 relative flex flex-col justify-center min-h-[500px]">
                    <div className="relative mb-16 select-none z-10">
                        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.85] text-neutral-900">
                            <motion.span style={{ x: xLeft }} className="block" transition={{ ease: "linear" }}>
                                LET&apos;S BUILD
                            </motion.span>
                            <motion.span style={{ x: xRight }} className="block" transition={{ ease: "linear" }}>
                                SOMETHING
                                <motion.span
                                    style={{ scale: dotScale, opacity: dotOpacity, transformOrigin: "center" }}
                                    className="inline-block w-[0.16em] h-[0.16em] bg-brand-900 ml-[0.05em] align-baseline origin-center"
                                />
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
            </motion.div>
        </div>
    );
}
