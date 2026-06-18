import { notFound } from "next/navigation";

// Catch-all for any unmatched route under /[lang]/*
// Triggers the [lang]/not-found.tsx page
export default function CatchAll() {
    notFound();
}
