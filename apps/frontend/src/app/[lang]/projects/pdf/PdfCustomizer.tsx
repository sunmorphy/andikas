"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Printer, ArrowLeft, Check } from "iconoir-react";
import { useRouter } from "next/navigation";
import { Project, User } from "@andikas/types";
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

interface PdfCustomizerProps {
    projects: Project[];
    user: User | null;
    lang: string;
}

export default function PdfCustomizer({ projects, user, lang }: PdfCustomizerProps) {
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
            <div className="no-print w-full bg-neutral-900 text-neutral-100 rounded-none p-6 md:p-8 flex flex-col gap-6 border border-neutral-850">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-4 border-b border-neutral-800">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 bg-brand-900 rounded-none" />
                            <h2 className="text-lg font-black uppercase tracking-widest text-neutral-50">
                                PDF COMPILATION (SWISS POSTER THEME)
                            </h2>
                        </div>
                        <p className="text-xs text-neutral-400 font-medium tracking-wide">
                            Select the projects to compile and print in your landscape portfolio sheet.
                        </p>
                        {/* Style / Layout Switcher */}
                        <div className="flex items-center gap-2 mt-3">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                Layout Theme:
                            </span>
                            <button
                                onClick={() => router.push("?template=neobrutalist")}
                                className="bg-brand-900 text-neutral-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-brand-900"
                            >
                                Swiss Poster (Active)
                            </button>
                            <button
                                onClick={() => router.push("?template=elegant")}
                                className="bg-transparent hover:bg-neutral-800 text-neutral-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-neutral-700"
                            >
                                Swiss Editorial
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 bg-brand-900 hover:bg-brand-950 text-neutral-50 px-5 py-2.5 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors"
                            disabled={activeProjects.length === 0}
                        >
                            <Printer className="w-4 h-4" /> Print PDF ({activeProjects.length})
                        </button>
                    </div>
                </div>

                {/* Selection checkboxes row */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                            Filter Projects ({activeProjects.length} of {projects.length} selected)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={selectAll}
                                className="flex items-center gap-1 text-[9px] font-bold uppercase bg-neutral-800 hover:bg-neutral-750 px-3 py-1 text-neutral-350 cursor-pointer"
                            >
                                <CheckDoubleIcon className="w-3 h-3" /> Select All
                            </button>
                            <button
                                onClick={deselectAll}
                                className="flex items-center gap-1 text-[9px] font-bold uppercase bg-neutral-800 hover:bg-neutral-750 px-3 py-1 text-neutral-350 cursor-pointer"
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
                                        "w-full text-left px-4 py-3 border rounded-none transition-colors flex items-center justify-between gap-3 cursor-pointer",
                                        isSelected
                                            ? "border-brand-900 bg-brand-900 text-white"
                                            : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
                                    )}
                                >
                                    <span className="font-bold text-xs uppercase tracking-wider truncate">
                                        {project.title}
                                    </span>
                                    <div
                                        className={cn(
                                            "w-4 h-4 rounded-none flex items-center justify-center shrink-0 border",
                                            isSelected ? "bg-white border-white text-neutral-900" : "border-neutral-700 bg-neutral-800"
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
                    <div className="border border-neutral-900 bg-[#FFFFFF] w-full max-w-4xl print:max-w-none flex flex-col justify-between items-stretch select-none h-[500px] print:h-full overflow-hidden relative py-6">
                        {/* Top bar */}
                        <div className="flex justify-between items-center border-b border-neutral-900/10 pb-4 px-8 w-full shrink-0">
                            <span className="text-[10px] font-bold tracking-[0.25em] text-neutral-900 uppercase">
                                ANDIKAS.DEV
                            </span>
                            <span className="text-[10px] font-bold tracking-widest text-brand-900">
                                {new Date().getFullYear()}
                            </span>
                            <div className="w-4 h-4 bg-brand-900" />
                        </div>

                        {/* Three column body layout */}
                        <div className="flex flex-row items-stretch grow overflow-hidden h-full">
                            {/* Column 1: Left Rotated Text */}
                            <div className="flex flex-col justify-between items-center h-full border-r border-neutral-900/10 py-6 shrink-0 w-20">
                                <span className="text-[10px] tracking-widest text-neutral-300 font-bold">● ● ●</span>
                                <span className="text-3xl font-black tracking-tighter text-brand-900 uppercase select-none whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                                    PORTFOLIO.
                                </span>
                                <span className="text-[8px] font-bold tracking-widest text-neutral-400 uppercase select-none whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                                    CODE.
                                </span>
                            </div>

                            {/* Column 2: Center profile photo in rectangular frame */}
                            <div className="flex-1 flex items-center justify-center px-8 border-r border-neutral-900/10 h-full py-4 bg-neutral-50/50">
                                {user?.profilePhoto ? (
                                    <div className="relative w-full max-w-[210px] aspect-[3/4] bg-white border border-neutral-900/10 p-2 shrink-0 rounded-none">
                                        <img
                                            src={user.profilePhoto}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                            loading="eager"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full max-w-[210px] aspect-[3/4] bg-neutral-100 border border-neutral-900/10 flex items-center justify-center text-[10px] text-neutral-400 uppercase font-mono tracking-widest rounded-none">
                                        NO PHOTO
                                    </div>
                                )}
                            </div>

                            {/* Column 3: Right Bold Title Blocks */}
                            <div className="w-[300px] flex flex-col justify-between items-stretch p-8 h-full bg-neutral-900 text-white">
                                <div className="flex flex-col gap-1 mt-4">
                                    <span className="text-[9px] font-bold tracking-[0.25em] text-brand-900 uppercase mb-2">CURATED WORKS OF</span>
                                    {(user?.name || "ANDIKA SULTANRAFLI").split(" ").map((part, pIdx) => (
                                        <h2 key={pIdx} className="text-4xl font-black tracking-tighter leading-[0.85] uppercase text-neutral-50">
                                            {part}
                                        </h2>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-2 mt-auto">
                                    <span className="text-[8px] font-bold tracking-widest text-neutral-400 uppercase">
                                        CONTACT SPECIFICATIONS:
                                    </span>
                                    <div className="text-[9px] font-bold text-neutral-300 leading-normal uppercase tracking-wider flex flex-col gap-0.5">
                                        {user?.location && <span>{user.location}</span>}
                                        {user?.email && <span>{user.email}</span>}
                                        {user?.phone && <span>{user.phone}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SELECTED PROJECTS */}
                {activeProjects.map((project, idx) => {
                    const projectDetailUrl = `https://www.andikas.dev/en/projects/${project.slug}`;

                    return (
                        <React.Fragment key={project.id}>
                            {/* PAGE 1: OVERVIEW & DETAILS */}
                            <div className="print-break-after-page flex flex-col justify-center items-center p-6 print:h-[100vh] print:p-[15mm] w-full bg-white">
                                <div className="border border-neutral-900 bg-white flex flex-col gap-4 w-full h-[500px] print:h-full justify-between overflow-hidden relative py-5">
                                    {/* Page 1 Header */}
                                    <div className="flex justify-between items-center border-b border-neutral-900/10 pb-3 px-8 w-full shrink-0">
                                        <span className="text-[9px] font-bold tracking-[0.2em] text-neutral-900 uppercase">
                                            {project.title} <span className="text-brand-900 font-black ml-3">— {project.type === 'group' ? 'group project' : 'personal project'}</span>
                                        </span>
                                        <span className="text-[9px] font-bold tracking-widest text-brand-900">
                                            PROJECT #{idx + 1}
                                        </span>
                                        <span className="text-[9px] font-mono tracking-widest text-neutral-455 uppercase">
                                            01 - OVERVIEW
                                        </span>
                                    </div>

                                    {/* Page 1 Content Layout */}
                                    <div className="flex flex-row grow items-stretch overflow-hidden px-8 w-full h-full pb-2 gap-8">
                                        {/* Left Column: Texts and Link */}
                                        <div className="flex-1 flex flex-col justify-between overflow-hidden pr-4 border-r border-neutral-900/10 h-full">
                                            <div className="flex flex-col overflow-hidden grow gap-4">
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="w-2 h-2 bg-brand-900 rounded-none" />
                                                    <h3 className="text-xl font-black tracking-tight text-neutral-900 uppercase">
                                                        OVERVIEW.
                                                    </h3>
                                                </div>

                                                {/* Metadata table with thin borders */}
                                                <div className="flex flex-col border-t border-b border-neutral-900/15 py-3 shrink-0 text-[9px] tracking-wider uppercase text-neutral-600 gap-1.5 bg-neutral-50/50 px-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-neutral-400 font-medium">Year</span>
                                                        <span className="font-bold text-neutral-900">{project.year || "-"}</span>
                                                    </div>
                                                    <div className="flex justify-between border-t border-neutral-900/5 pt-1.5 gap-4">
                                                        <span className="text-neutral-400 font-medium shrink-0">Case Study</span>
                                                        <a href={projectDetailUrl} target="_blank" rel="noreferrer" className="underline text-brand-900 font-bold break-all text-right">
                                                            {projectDetailUrl}
                                                        </a>
                                                    </div>
                                                    <div className="flex justify-between border-t border-neutral-900/5 pt-1.5 gap-4">
                                                        <span className="text-neutral-400 font-medium shrink-0">Github</span>
                                                        {project.githubUrl ? (
                                                            <a href={project.githubUrl} target="_blank" rel="noreferrer" className="underline text-brand-900 font-bold break-all text-right">
                                                                {project.githubUrl}
                                                            </a>
                                                        ) : (
                                                            <span className="font-bold text-neutral-900">-</span>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between border-t border-neutral-900/5 pt-1.5 gap-4">
                                                        <span className="text-neutral-400 font-medium shrink-0">Live URL</span>
                                                        {project.liveUrl ? (
                                                            <a href={project.liveUrl} target="_blank" rel="noreferrer" className="underline text-brand-900 font-bold break-all text-right">
                                                                {project.liveUrl}
                                                            </a>
                                                        ) : (
                                                            <span className="font-bold text-neutral-900">-</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Project Content */}
                                                {project.content && (
                                                    <div className="flex flex-col gap-1.5 grow overflow-hidden">
                                                        <span className="text-[8px] font-bold tracking-widest text-neutral-450 uppercase">PROJECT CONTENT</span>
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
                                                    <div className="relative w-full aspect-[4/3] bg-white border border-neutral-900/10 overflow-hidden shrink-0 p-1">
                                                        <img
                                                            src={project.coverImage}
                                                            alt={project.title}
                                                            className="w-full h-full object-cover"
                                                            loading="eager"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-full aspect-[4/3] bg-neutral-100 border border-neutral-900/10 flex items-center justify-center text-[10px] text-neutral-450 uppercase font-bold rounded-none">
                                                        No Cover Image
                                                    </div>
                                                )}

                                                {/* Content Images (Secondary screen captures / mockups placed below) */}
                                                {project.contentImages && project.contentImages.length > 0 && (
                                                    <div className="grid grid-cols-2 gap-3 shrink-0">
                                                        {project.contentImages.slice(0, 2).map((img, imgIdx) => (
                                                            <div key={imgIdx} className="relative w-full aspect-[16/10] bg-white border border-neutral-900/10 overflow-hidden shrink-0 p-1">
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
                                            <div className="p-3 border-l-[3px] border-brand-900 text-neutral-900 text-[10px] leading-relaxed rounded-none uppercase tracking-wide h-auto bg-transparent">
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
                    <div className="border border-neutral-900 bg-[#FFFFFF] w-full max-w-4xl print:max-w-none flex flex-col justify-between items-stretch select-none h-[500px] print:h-full overflow-hidden relative py-6">
                        {/* Top bar */}
                        <div className="flex justify-between items-center border-b border-neutral-900/10 pb-4 px-8 w-full shrink-0">
                            <span className="text-[10px] font-bold tracking-[0.25em] text-neutral-900 uppercase">
                                ANDIKAS.DEV
                            </span>
                            <span className="text-[10px] font-bold tracking-widest text-brand-900">
                                {new Date().getFullYear()}
                            </span>
                            <div className="w-4 h-4 bg-brand-900" />
                        </div>

                        {/* Body layout */}
                        <div className="flex flex-row items-stretch grow overflow-hidden h-full">
                            {/* Column 1: Left Rotated Text */}
                            <div className="flex flex-col justify-between items-center h-full border-r border-neutral-900/10 py-6 shrink-0 w-20">
                                <span className="text-[10px] tracking-widest text-neutral-300 font-bold">● ● ●</span>
                                <span className="text-3xl font-black tracking-tighter text-brand-900 uppercase select-none whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                                    END.
                                </span>
                                <span className="text-[8px] font-bold tracking-widest text-neutral-400 uppercase select-none whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                                    SHEET.
                                </span>
                            </div>

                            {/* Column 2: Center Giant Swiss Red Typography */}
                            <div className="flex-1 flex flex-col justify-center items-center px-12 border-r border-neutral-900/10 h-full py-4 bg-white relative">
                                <div className="text-left w-full max-w-md flex flex-col justify-center gap-1">
                                    <h1 className="text-8xl font-black tracking-tighter leading-[0.8] text-brand-900 uppercase">
                                        THANK
                                    </h1>
                                    <h1 className="text-8xl font-black tracking-tighter leading-[0.8] text-brand-900 uppercase">
                                        YOU.
                                    </h1>
                                </div>
                            </div>

                            {/* Column 3: Right Bold Title Blocks */}
                            <div className="w-[300px] flex flex-col justify-between items-stretch p-8 h-full bg-neutral-900 text-white">
                                <div className="flex flex-col gap-1 mt-4">
                                    <span className="text-[9px] font-bold tracking-[0.25em] text-brand-900 uppercase mb-2">PORTFOLIO OF</span>
                                    {(user?.name || "ANDIKA SULTANRAFLI").split(" ").map((part, pIdx) => (
                                        <h2 key={pIdx} className="text-4xl font-black tracking-tighter leading-[0.85] uppercase text-neutral-50">
                                            {part}
                                        </h2>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-2 mt-auto">
                                    <div className="text-[9px] font-bold text-neutral-300 leading-normal uppercase tracking-wider flex flex-col gap-0.5">
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
