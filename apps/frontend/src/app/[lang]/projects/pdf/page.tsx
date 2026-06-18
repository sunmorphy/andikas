import React from "react";
import { fetchUser, fetchProjects } from "@/lib/api";
import PdfCustomizer from "./PdfCustomizer";
import PdfCustomizerElegant from "./PdfCustomizerElegant";
import { Locale } from "@/i18n-config";

interface Props {
    params: Promise<{ lang: string }>;
    searchParams: Promise<{ template?: string }>;
}

export default async function PortfolioPdfPage({ params, searchParams }: Props) {
    const [resolvedParams, resolvedSearchParams] = await Promise.all([
        params,
        searchParams,
    ]);
    const lang = resolvedParams.lang as Locale;
    const template = resolvedSearchParams.template || "neobrutalist";

    // Fetch user and all projects in English ('en') specifically for standard PDF export
    const [user, projectsRes] = await Promise.all([
        fetchUser(undefined, "en"),
        fetchProjects(undefined, { limit: 100 }, "en")
    ]);

    return (
        <div className="min-h-screen print:min-h-0 print:p-0 print:m-0 bg-white text-neutral-900 p-4 md:p-8 font-sans max-w-6xl print:max-w-none mx-auto selection:bg-neutral-900 selection:text-neutral-50">
            {/* Scoped CSS to hide the website's default sticky navigation header/footer on screen */}
            <style dangerouslySetInnerHTML={{ __html: `
                header.sticky, footer {
                    display: none !important;
                }
                main {
                    min-height: auto !important;
                }
                @media print {
                    @page {
                        size: landscape;
                        margin: 0;
                    }
                    body, main {
                        margin: 0 !important;
                        padding: 0 !important;
                        background-color: white !important;
                        min-height: auto !important;
                    }
                }
            `}} />

            {/* Render the Client Customizer which handles the interactive checkboxes, cover slide, and print output */}
            {template === "neobrutalist" ? (
                <PdfCustomizer
                    projects={projectsRes.data}
                    user={user}
                    lang={lang}
                />
            ) : (
                <PdfCustomizerElegant
                    projects={projectsRes.data}
                    user={user}
                    lang={lang}
                />
            )}
        </div>
    );
}

