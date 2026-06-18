"use client";

import Link, { LinkProps } from "next/link";
import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";

interface ScrollLinkProps extends LinkProps {
    children: ReactNode;
    className?: string;
    targetId: string;
}

export const ScrollLink = ({ children, className, targetId, ...props }: ScrollLinkProps) => {
    const pathname = usePathname();

    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        // Only intercept if we are already on the localized home page where the anchors live
        // e.g. /en, /id, /de, /ja, /nl
        const isHomePage = pathname === `/${pathname.split("/")[1]}`;

        if (isHomePage) {
            e.preventDefault();
            const target = document.getElementById(targetId);
            if (!target) return;

            // Temporarily disable native smooth scroll CSS if present
            const originalScrollBehavior = document.documentElement.style.scrollBehavior;
            document.documentElement.style.scrollBehavior = 'auto';

            const targetPosition = target.getBoundingClientRect().top + window.scrollY;
            const startPosition = window.scrollY;
            const distance = targetPosition - startPosition;
            const duration = 1200; // 1.2s luxurious scroll duration
            let start: number | null = null;

            const animation = (currentTime: number) => {
                if (start === null) start = currentTime;
                const timeElapsed = currentTime - start;
                const progress = Math.min(timeElapsed / duration, 1);

                // easeInOutExpo for a premium snapping feel
                const ease = progress === 0 ? 0 : progress === 1 ? 1 : progress < 0.5
                    ? Math.pow(2, 20 * progress - 10) / 2
                    : (2 - Math.pow(2, -20 * progress + 10)) / 2;

                window.scrollTo(0, startPosition + distance * ease);

                if (timeElapsed < duration) {
                    requestAnimationFrame(animation);
                } else {
                    document.documentElement.style.scrollBehavior = originalScrollBehavior;
                    window.history.pushState(null, "", `${pathname}#${targetId}`);
                }
            };

            requestAnimationFrame(animation);
        }
    };

    return (
        <Link {...props} className={className} onClick={handleScroll}>
            {children}
        </Link>
    );
};
