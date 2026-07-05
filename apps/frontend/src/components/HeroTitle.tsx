"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function HeroTitle() {
    const { scrollY } = useScroll();

    // Map scroll position to translation offsets and opacity
    const xLeft = useTransform(scrollY, [0, 500], [0, -120]);
    const xRight = useTransform(scrollY, [0, 500], [0, 120]);
    const opacity = useTransform(scrollY, [0, 400], [1, 0]);

    return (
        <h1 className="text-6xl md:text-[9rem] font-bold tracking-tighter leading-[0.85] uppercase text-neutral-900 mb-24 overflow-hidden py-2 select-none">
            <motion.span
                className="block"
                style={{ x: xLeft, opacity }}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
                ANDIKA
            </motion.span>
            <motion.span
                className="block"
                style={{ x: xRight, opacity }}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
                SULTANRAFLI<span className="inline-block w-[0.16em] h-[0.16em] bg-brand-900 ml-[0.05em] align-baseline"></span>
            </motion.span>
        </h1>
    );
}
