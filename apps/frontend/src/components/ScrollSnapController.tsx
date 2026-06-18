"use client";

import { useEffect } from "react";

export default function ScrollSnapController() {
    useEffect(() => {
        // Apply snap-scroller class to html element when on homepage
        document.documentElement.classList.add("snap-scroller");
        return () => {
            document.documentElement.classList.remove("snap-scroller");
        };
    }, []);

    return null;
}
