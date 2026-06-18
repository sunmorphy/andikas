import { notFound } from "next/navigation";

// Catch-all for any unmatched path under /[lang]/projects/[slug]/*
export default function CatchAll() {
    notFound();
}
