import Link from "next/link";
import { Locale } from "@/i18n-config";

export default function Footer({
  lang,
  dict,
}: {
  lang: Locale;
  dict?: { rights?: string };
}) {
  const currentYear = new Date().getFullYear();
  const rightsText = dict?.rights || "andikas. all rights reserved.";

  return (
    <footer className="w-full mt-32 pb-12 pt-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-ink lowercase select-none">
        <Link
          href={`/${lang}`}
          className="hover:text-brand-900 transition-colors underline underline-offset-4 decoration-1"
        >
          andikas.dev
        </Link>
        <span>© {currentYear} {rightsText.toLowerCase()}</span>
      </div>
    </footer>
  );
}
