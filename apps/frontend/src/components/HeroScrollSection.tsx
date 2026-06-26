"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

interface Props {
    description: string;
    role: string;
    profilePhoto: string | null;
    name: string;
    location: string;
}

export default function HeroScrollSection({ description, role, profilePhoto, name, location }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const isGif = profilePhoto ? profilePhoto.split("?")[0].toLowerCase().endsWith(".gif") : false;

    // Map scroll progress to horizontal translation and opacity for the title split
    const xLeft = useTransform(scrollYProgress, [0, 0.4], ["0%", "-100%"]);
    const xRight = useTransform(scrollYProgress, [0, 0.4], ["0%", "100%"]);
    const titleOpacity = useTransform(scrollYProgress, [0.25, 0.4], [1, 0]);

    // Map scroll progress to opacity and vertical offset for the description details grid
    const detailsOpacity = useTransform(scrollYProgress, [0.35, 0.55, 0.8, 0.95], [0, 1, 1, 0]);
    const detailsY = useTransform(scrollYProgress, [0.35, 0.55], [100, 0]);

    return (
        <div ref={containerRef} className="w-full h-[200vh] relative">
            <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden">
                <div className="w-[90%] md:w-4/5 mx-auto px-6 flex flex-col items-start relative">
                    <h1 className="text-[clamp(2.5rem,8.5vw,9rem)] font-bold tracking-tighter leading-[0.85] uppercase text-neutral-900 w-full overflow-hidden py-2 select-none">
                        <motion.span
                            className="block"
                            style={{ x: xLeft, opacity: titleOpacity }}
                            transition={{ ease: "linear" }}
                        >
                            ANDIKA
                        </motion.span>
                        <motion.span
                            className="block"
                            style={{ x: xRight, opacity: titleOpacity }}
                            transition={{ ease: "linear" }}
                        >
                            SULTANRAFLI<span className="text-brand-900">.</span>
                        </motion.span>
                    </h1>

                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-4 md:gap-10 items-start mt-6 md:mt-12 w-full absolute left-6 right-6 top-0 md:top-auto md:relative"
                        style={{ opacity: detailsOpacity, y: detailsY }}
                        transition={{ ease: "linear" }}
                    >
                        <div className="col-span-2 md:col-span-5 pr-4">
                            <p className="text-[1.625rem] md:text-xl text-neutral-600 font-normal leading-relaxed">
                                {description}
                            </p>
                        </div>

                        <div className="col-span-1 md:col-span-3 flex flex-col gap-4 text-[10px] font-bold uppercase tracking-wider text-neutral-500 pl-0 md:pl-6 h-full min-h-0 md:min-h-[140px]">
                            <div>
                                <span className="text-neutral-400 block mb-0.5">Role</span>
                                <span className="text-neutral-900">{role}</span>
                            </div>
                            <div>
                                <span className="text-neutral-400 block mb-0.5">Location</span>
                                <span className="text-neutral-900">{location}</span>
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-4 flex justify-end">
                            {profilePhoto && (
                                <div className="relative w-full aspect-square max-w-[240px] md:max-w-[360px]">
                                    <Image
                                        src={profilePhoto}
                                        alt={name || "Profile"}
                                        fill
                                        className="object-cover transition-all duration-350"
                                        priority
                                        sizes="(max-width: 768px) 240px, 360px"
                                        unoptimized={isGif}
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
