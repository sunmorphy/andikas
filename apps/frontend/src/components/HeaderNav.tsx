"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ScrollLink } from "./ScrollLink";

interface Props {
    lang: string;
}

export function HeaderNav({ lang }: Props) {
    const pathname = usePathname();
    const [activeSection, setActiveSection] = useState<"home" | "work" | "about" | "contact" | "index">("home");
    const [isFreeScroll, setIsFreeScroll] = useState(false);

    useEffect(() => {
        // Load initial state on mount
        const saved = localStorage.getItem("free-scroll") === "true";
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsFreeScroll(saved);
        if (saved) {
            document.documentElement.classList.add("free-scroll");
        } else {
            document.documentElement.classList.remove("free-scroll");
        }
    }, []);

    const toggleScrollMode = () => {
        const newValue = !isFreeScroll;
        setIsFreeScroll(newValue);
        if (newValue) {
            localStorage.setItem("free-scroll", "true");
            document.documentElement.classList.add("free-scroll");
        } else {
            localStorage.setItem("free-scroll", "false");
            document.documentElement.classList.remove("free-scroll");
        }
    };

    useEffect(() => {
        // If not on the homepage, index is active for projects path, otherwise fallback to none/home
        if (pathname !== `/${lang}` && pathname !== "/") {
            if (pathname?.includes("/projects")) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setActiveSection("index");
            } else {
                setActiveSection("home");
            }
            return;
        }

        // Homepage scroll spy logic
        const handleScroll = () => {
            const scrollPos = window.scrollY + 250; // offset trigger

            const worksElement = document.getElementById("selected-works");
            const contactElement = document.getElementById("contact");

            if (contactElement && scrollPos >= contactElement.offsetTop) {
                setActiveSection("contact");
            } else if (worksElement && scrollPos >= worksElement.offsetTop) {
                setActiveSection("work");
            } else {
                setActiveSection("home");
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial check

        return () => window.removeEventListener("scroll", handleScroll);
    }, [pathname, lang]);

    return (
        <nav className="flex flex-col items-end gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            <Link 
                href={`/${lang}`} 
                className={`hover:text-neutral-900 transition-colors ${activeSection === "home" ? "text-neutral-900" : ""}`}
            >
                HOME
            </Link>
            <ScrollLink 
                href={`/${lang}#selected-works`} 
                targetId="selected-works" 
                className={`hover:text-neutral-900 transition-colors ${activeSection === "work" ? "text-neutral-900" : ""}`}
            >
                WORK
            </ScrollLink>
            <ScrollLink 
                href={`/${lang}#contact`} 
                targetId="contact" 
                className={`hover:text-neutral-900 transition-colors ${activeSection === "contact" ? "text-neutral-900" : ""}`}
            >
                REACH ME
            </ScrollLink>
            <Link 
                href={`/${lang}/projects`} 
                className={`hover:text-neutral-900 transition-colors ${activeSection === "index" ? "text-neutral-900" : ""}`}
            >
                INDEX
            </Link>
            <button 
                onClick={toggleScrollMode}
                className="hover:text-neutral-900 transition-colors cursor-pointer text-left border-t border-neutral-200 pt-2 mt-2 w-full text-right"
            >
                {isFreeScroll ? "SCROLL: FREE" : "SCROLL: SNAP"}
            </button>
        </nav>
    );
}
