"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Printer, ArrowLeft, Check } from "iconoir-react";
import { useRouter } from "next/navigation";
import { Project, User } from "@andikas/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const CheckDoubleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 12l5 5L15 9" />
        <path d="M9 12l5 5L22 9" />
    </svg>
);

const XmarkIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface PdfCustomizerElegantProps {
    projects: Project[];
    user: User | null;
    lang: string;
}

export default function PdfCustomizerElegant({ projects, user, lang }: PdfCustomizerElegantProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

    // Initialize all projects as selected on mount
    useEffect(() => {
        const initialMap: Record<string, boolean> = {};
        projects.forEach((p) => {
            initialMap[p.id] = true;
        });
        setSelectedIds(initialMap);

        // Auto trigger native print after components stabilize
        const timer = setTimeout(() => {
            window.print();
        }, 1500);
        return () => clearTimeout(timer);
    }, [projects]);

    const toggleProject = (id: string) => {
        setSelectedIds((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const selectAll = () => {
        const updated: Record<string, boolean> = {};
        projects.forEach((p) => {
            updated[p.id] = true;
        });
        setSelectedIds(updated);
    };

    const deselectAll = () => {
        const updated: Record<string, boolean> = {};
        projects.forEach((p) => {
            updated[p.id] = false;
        });
        setSelectedIds(updated);
    };

    const activeProjects = projects.filter((p) => selectedIds[p.id]);

    return (
        <div className="flex flex-col gap-12 print:gap-0 bg-white">
            {/* INTERACTIVE CUSTOMIZATION TOOLBAR (Hidden in Print) */}
            <div className="no-print w-full bg-[#FAF8F5] border-[0.5px] border-neutral-900/80 rounded-none p-6 md:p-8 flex flex-col gap-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-4 border-b border-neutral-900/10">
                    <div>
                        <h2 className="text-lg font-black tracking-wider text-neutral-900 uppercase">
                            ⚙️ PDF COMPILATION (SWISS EDITORIAL THEME)
                        </h2>
                        <p className="text-xs text-neutral-550 font-sans tracking-wide mt-1">
                            Choose which projects you want to compile and export in your landscape editorial sheet.
                        </p>
                        {/* Style / Layout Switcher */}
                        <div className="flex items-center gap-2 mt-3">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                Layout Theme:
                            </span>
                            <button
                                onClick={() => router.push("?template=neobrutalist")}
                                className="bg-transparent hover:bg-neutral-100 text-neutral-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-neutral-350"
                            >
                                Swiss Poster
                            </button>
                            <button
                                onClick={() => router.push("?template=elegant")}
                                className="bg-neutral-900 text-neutral-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-neutral-900"
                            >
                                Swiss Editorial (Active)
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 bg-white hover:bg-neutral-55 text-neutral-800 rounded-none px-4 py-2 font-medium text-xs tracking-wider uppercase border-[0.5px] border-neutral-900/30 transition-all cursor-pointer shadow-sm"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-50 rounded-none px-5 py-2.5 font-medium text-xs tracking-wider uppercase border-[0.5px] border-neutral-950 transition-all cursor-pointer shadow-sm"
                            disabled={activeProjects.length === 0}
                        >
                            <Printer className="w-4 h-4" /> Print PDF ({activeProjects.length})
                        </button>
                    </div>
                </div>

                {/* Selection checkboxes row */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                            Filter Projects ({activeProjects.length} of {projects.length} selected)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={selectAll}
                                className="flex items-center gap-1 text-[10px] font-bold uppercase bg-white border border-neutral-300 hover:bg-neutral-50 px-3 py-1 rounded-none text-neutral-600 cursor-pointer"
                            >
                                <CheckDoubleIcon className="w-3 h-3" /> Select All
                            </button>
                            <button
                                onClick={deselectAll}
                                className="flex items-center gap-1 text-[10px] font-bold uppercase bg-white border border-neutral-300 hover:bg-neutral-50 px-3 py-1 rounded-none text-neutral-600 cursor-pointer"
                            >
                                <XmarkIcon className="w-3 h-3" /> Clear All
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {projects.map((project) => {
                            const isSelected = !!selectedIds[project.id];
                            return (
                                <button
                                    key={project.id}
                                    onClick={() => toggleProject(project.id)}
                                    className={cn(
                                        "w-full text-left px-5 py-3 border-[0.5px] rounded-none transition-all flex items-center justify-between gap-3 cursor-pointer shadow-sm",
                                        isSelected
                                            ? "border-neutral-900 bg-neutral-900 text-white"
                                            : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                                    )}
                                >
                                    <span className="font-medium text-xs uppercase tracking-wider truncate">
                                        {project.title}
                                    </span>
                                    <div
                                        className={cn(
                                            "w-4 h-4 rounded-none flex items-center justify-center shrink-0 border",
                                            isSelected ? "bg-white border-white text-neutral-900" : "border-neutral-300 bg-neutral-50"
                                        )}
                                    >
                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* PRINT SHEETS OUTPUT */}
            <div className="flex flex-col gap-0 bg-white">
                {/* 🎨 COVER SLIDE (Always Page 1) */}
                <div className="print-break-after-page flex flex-col justify-center items-center p-6 print:h-[100vh] print:p-[15mm] w-full bg-white">
                    <div className="border-[0.5px] border-neutral-900 bg-[#FAF8F5] w-full max-w-4xl print:max-w-none flex flex-col justify-between items-stretch select-none h-[500px] print:h-full overflow-hidden relative shadow-sm py-6">
                        {/* Top bar */}
                        <div className="flex justify-between items-center border-b-[0.5px] border-neutral-900/10 pb-4 px-8 w-full shrink-0">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-900 uppercase">
                                {user?.name || "ANDIKA SULTANRAFLI"}
                            </span>
                            <span className="text-[10px] font-mono tracking-widest text-neutral-400">
                                ©{new Date().getFullYear()}
                            </span>
                            <div className="w-6 h-3 bg-neutral-900" />
                        </div>

                        {/* Three column body layout */}
                        <div className="flex flex-row items-stretch grow overflow-hidden h-full">
                            {/* Column 1: Left Rotated Brand Mark */}
                            <div className="flex flex-col justify-between items-center h-full border-r-[0.5px] border-neutral-900/10 py-6 shrink-0 w-20">
                                <span className="text-[10px] tracking-widest text-neutral-400 font-mono">|||</span>
                                <span className="text-3xl font-black tracking-tighter text-neutral-300 uppercase select-none whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                                    DESIGN.
                                </span>
                                <span className="text-[8px] font-bold tracking-widest text-neutral-500 uppercase select-none whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                                    P/N COVER
                                </span>
                            </div>

                            {/* Column 2: Center Profile Image */}
                            <div className="flex-1 flex items-center justify-center px-8 border-r-[0.5px] border-neutral-900/10 h-full py-4">
                                {user?.profilePhoto ? (
                                    <div className="relative w-full max-w-[210px] aspect-[3/4] bg-[#FAF8F5] border-[0.5px] border-neutral-900/50 p-2 shadow-sm shrink-0 rounded-none">
                                        <img
                                            src={user.profilePhoto}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                            loading="eager"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full max-w-[210px] aspect-[3/4] bg-neutral-50 border-[0.5px] border-neutral-900/30 flex items-center justify-center text-[10px] text-neutral-400 uppercase font-mono tracking-widest rounded-none">
                                        NO PHOTO
                                    </div>
                                )}
                            </div>

                            {/* Column 3: Right Text Block */}
                            <div className="w-[300px] flex flex-col justify-between items-stretch p-8 h-full">
                                {/* Large stacked title */}
                                <div className="flex flex-col gap-1.5 mt-4">
                                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-neutral-900 leading-[0.85] uppercase">
                                        PORTFO-
                                    </h2>
                                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-neutral-900 leading-[0.85] uppercase">
                                        LIO
                                    </h2>
                                    <span className="text-[8px] font-bold tracking-[0.3em] text-brand-900 uppercase mt-4 block">
                                        AESTHETIC & CREATIVE
                                    </span>
                                </div>

                                {/* Dynamic Studio details */}
                                <div className="flex flex-col gap-2 mt-auto">
                                    <span className="text-[8px] font-bold tracking-widest text-neutral-400 uppercase">
                                        STUDIO INFO:
                                    </span>
                                    <div className="text-[9px] font-medium text-neutral-500 leading-normal uppercase tracking-wider flex flex-col gap-0.5">
                                        {user?.location && <span>{user.location}</span>}
                                        {user?.email && <span>{user.email}</span>}
                                        {user?.phone && <span>{user.phone}</span>}
                                        <span>www.andikas.dev</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SELECTED PROJECTS */}
                {activeProjects.map((project, idx) => {
                    const projectDetailUrl = `https://www.andikas.dev/en/projects/${project.slug}`;
                    const displayIndex = String(idx + 1).padStart(2, "0");

                    return (
                        <React.Fragment key={project.id}>
                            {/* PAGE 1: OVERVIEW & CHALLENGE */}
                            <div className="print-break-after-page flex flex-col justify-center items-center p-6 print:h-[100vh] print:p-[15mm] w-full bg-white">
                                <div className="border-[0.5px] border-neutral-900 bg-[#FAF8F5] flex flex-col gap-4 w-full h-[500px] print:h-full justify-between overflow-hidden relative shadow-sm py-5 rounded-none">
                                    {/* Page 1 Header */}
                                    <div className="flex justify-between items-center border-b-[0.5px] border-neutral-900/10 pb-3 px-8 w-full shrink-0">
                                        <span className="text-[9px] font-bold tracking-[0.2em] text-neutral-900 uppercase">
                                            {project.title} <span className="text-neutral-400 font-medium ml-3">— {project.type === 'group' ? 'group project' : 'personal project'}</span>
                                        </span>
                                        <span className="text-[9px] font-mono tracking-widest text-neutral-400">
                                            ©{new Date().getFullYear()}
                                        </span>
                                        <span className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase">
                                            P.{displayIndex}.A
                                        </span>
                                    </div>

                                    {/* Page 1 Content Layout */}
                                    <div className="flex flex-row grow items-stretch overflow-hidden px-8 w-full h-full pb-2 gap-8">
                                        {/* Left Column: Texts and Link */}
                                        <div className="flex-1 flex flex-col justify-between overflow-hidden pr-4 border-r-[0.5px] border-neutral-900/10 h-full">
                                            <div className="flex flex-col overflow-hidden grow gap-3">
                                                <h3 className="text-2xl font-black tracking-tighter text-neutral-900 uppercase shrink-0">
                                                    OVERVIEW.
                                                </h3>
                                                {/* Metadata table with thin borders */}
                                                <div className="flex flex-col border-t-[0.5px] border-b-[0.5px] border-neutral-900/15 py-2 shrink-0 text-[9px] tracking-wider uppercase text-neutral-600 gap-1.5">
                                                    <div className="flex justify-between">
                                                        <span className="text-neutral-400 font-bold">Year</span>
                                                        <span className="font-bold text-neutral-900">{project.year || "N/A"}</span>
                                                    </div>
                                                    <div className="flex justify-between border-t-[0.5px] border-neutral-900/10 pt-1.5 gap-4">
                                                        <span className="text-neutral-400 font-bold shrink-0">Case Study</span>
                                                        <a href={projectDetailUrl} target="_blank" rel="noreferrer" className="underline text-neutral-950 font-bold break-all text-right">
                                                            {projectDetailUrl}
                                                        </a>
                                                    </div>
                                                    <div className="flex justify-between border-t-[0.5px] border-neutral-900/10 pt-1.5 gap-4">
                                                        <span className="text-neutral-400 font-bold shrink-0">Github</span>
                                                        {project.githubUrl ? (
                                                            <a href={project.githubUrl} target="_blank" rel="noreferrer" className="underline text-neutral-950 font-bold break-all text-right">
                                                                {project.githubUrl}
                                                            </a>
                                                        ) : (
                                                            <span className="font-bold text-neutral-900">N/A</span>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between border-t-[0.5px] border-neutral-900/10 pt-1.5 gap-4">
                                                        <span className="text-neutral-400 font-bold shrink-0">Live URL</span>
                                                        {project.liveUrl ? (
                                                            <a href={project.liveUrl} target="_blank" rel="noreferrer" className="underline text-neutral-950 font-bold break-all text-right">
                                                                {project.liveUrl}
                                                            </a>
                                                        ) : (
                                                            <span className="font-bold text-neutral-900">N/A</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Project Content */}
                                                {project.content && (
                                                    <div className="flex flex-col gap-1.5 grow overflow-hidden">
                                                        <span className="text-[8px] font-bold tracking-widest text-neutral-400 uppercase">PROJECT CONTENT</span>
                                                        <div className="prose prose-neutral prose-xs max-w-none text-neutral-600 leading-relaxed overflow-y-auto grow font-sans">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.content}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Column: Visuals Gallery & Description */}
                                        <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
                                            {/* Visuals Container */}
                                            <div className="flex flex-col gap-3 shrink-0">
                                                {project.coverImage ? (
                                                    <div className="relative w-full aspect-[16/7] bg-[#FAF8F5] border-[0.5px] border-neutral-900/30 overflow-hidden shrink-0 rounded-none">
                                                        <img
                                                            src={project.coverImage}
                                                            alt={project.title}
                                                            className="w-full h-full object-cover"
                                                            loading="eager"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-full aspect-[16/7] bg-neutral-100 border-[0.5px] border-neutral-900/30 flex items-center justify-center text-[10px] text-neutral-400 uppercase font-mono rounded-none">
                                                        No Cover Image
                                                    </div>
                                                )}

                                                {/* Content Images (Secondary screen captures / mockups placed below) */}
                                                {project.contentImages && project.contentImages.length > 0 && (
                                                    <div className="grid grid-cols-2 gap-3 shrink-0">
                                                        {project.contentImages.slice(0, 2).map((img, imgIdx) => (
                                                            <div key={imgIdx} className="relative w-full aspect-[16/10] bg-[#FAF8F5] border-[0.5px] border-neutral-900/30 overflow-hidden shrink-0 rounded-none">
                                                                <img
                                                                    src={img}
                                                                    alt={`${project.title} screenshot ${imgIdx + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                    loading="eager"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                             {/* Description summary positioned below the images */}
                                             <div className="p-3 border-l-[3px] border-neutral-900 text-neutral-650 text-[10px] leading-relaxed rounded-none uppercase font-bold tracking-tight h-auto bg-transparent">
                                                 {project.description}
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </React.Fragment>
                    );
                })}

                {/* 🏁 CLOSING COVER SLIDE */}
                <div className="flex flex-col justify-center items-center p-6 print:h-[100vh] print:p-[15mm] w-full bg-white">
                    <div className="border-[0.5px] border-neutral-900 bg-[#FAF8F5] w-full max-w-4xl print:max-w-none flex flex-col justify-between items-stretch select-none h-[500px] print:h-full overflow-hidden relative shadow-sm py-6">
                        {/* Top bar */}
                        <div className="flex justify-between items-center border-b-[0.5px] border-neutral-900/10 pb-4 px-8 w-full shrink-0">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-900 uppercase">
                                {user?.name || "ANDIKA SULTANRAFLI"}
                            </span>
                            <span className="text-[10px] font-mono tracking-widest text-neutral-400">
                                ©{new Date().getFullYear()}
                            </span>
                            <div className="w-6 h-3 bg-neutral-900" />
                        </div>

                        {/* Three column body layout */}
                        <div className="flex flex-row items-stretch grow overflow-hidden h-full">
                            {/* Column 1: Left Rotated Brand Mark */}
                            <div className="flex flex-col justify-between items-center h-full border-r-[0.5px] border-neutral-900/10 py-6 shrink-0 w-20">
                                <span className="text-[10px] tracking-widest text-neutral-400 font-mono">|||</span>
                                <span className="text-3xl font-black tracking-tighter text-neutral-300 uppercase select-none whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                                    FINISH.
                                </span>
                                <span className="text-[8px] font-bold tracking-widest text-neutral-500 uppercase select-none whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                                    P/N BACK
                                </span>
                            </div>

                            {/* Column 2: Center Giant Typography */}
                            <div className="flex-1 flex flex-col justify-center items-center px-12 border-r-[0.5px] border-neutral-900/10 h-full py-4 relative">
                                <div className="text-left w-full max-w-md flex flex-col justify-center gap-1.5">
                                    <h1 className="text-7xl font-black tracking-tighter leading-[0.8] text-neutral-900 uppercase">
                                        THANK
                                    </h1>
                                    <h1 className="text-7xl font-black tracking-tighter leading-[0.8] text-neutral-900 uppercase">
                                        YOU.
                                    </h1>
                                </div>
                            </div>

                            {/* Column 3: Right Text Block */}
                            <div className="w-[300px] flex flex-col justify-between items-stretch p-8 h-full">
                                {/* Large stacked title */}
                                <div className="flex flex-col gap-1.5 mt-4">
                                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-neutral-900 leading-[0.85] uppercase">
                                        END-
                                    </h2>
                                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-neutral-900 leading-[0.85] uppercase">
                                        NOTE
                                    </h2>
                                    <span className="text-[8px] font-bold tracking-[0.3em] text-brand-900 uppercase mt-4 block">
                                        PORTFOLIO COMPILATION
                                    </span>
                                </div>

                                {/* Dynamic Studio details */}
                                <div className="flex flex-col gap-2 mt-auto">
                                    <span className="text-[8px] font-bold tracking-widest text-neutral-400 uppercase">
                                        CHANNELS:
                                    </span>
                                    <div className="text-[9px] font-medium text-neutral-500 leading-normal uppercase tracking-wider flex flex-col gap-0.5">
                                        <a href="https://www.andikas.dev" target="_blank" rel="noreferrer" className="underline hover:text-neutral-900 transition-colors">
                                            WWW.ANDIKAS.DEV
                                        </a>
                                        <span>© {new Date().getFullYear()} ALL RIGHTS RESERVED</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
