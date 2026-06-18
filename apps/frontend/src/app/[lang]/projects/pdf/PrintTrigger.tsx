"use client";

import React, { useEffect } from "react";
import { Printer, ArrowLeft } from "iconoir-react";
import { useRouter } from "next/navigation";

export default function PrintTrigger({ lang }: { lang: string }) {
    const router = useRouter();

    useEffect(() => {
        // Wait for all rendering, web fonts, and images to stabilize before triggering native print
        const timer = setTimeout(() => {
            window.print();
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2 no-print">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-none px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors border border-neutral-350 cursor-pointer"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
            </button>
            <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-brand-900 hover:bg-neutral-900 text-neutral-50 rounded-none px-5 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
                <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
        </div>
    );
}
