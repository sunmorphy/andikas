import Link from "next/link";
import { getDictionary } from "@/get-dictionary";
import { Locale } from "@/i18n-config";

export default async function Footer({ lang }: { lang: Locale }) {
    const dict = await getDictionary(lang);

    return (
        <footer className="w-full mt-32">
            <div className="w-full px-6 py-12 flex flex-col gap-12">
                <div className="w-full text-start pb-12">
                    <span className="text-[8.5vw] font-extrabold tracking-tighter leading-none text-neutral-900 uppercase block select-none">
                        ANDIKA—
                    </span>
                    <span className="text-[8.5vw] font-extrabold tracking-tighter leading-none text-neutral-900 uppercase block select-none">
                        SULTANRAFLI
                    </span>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <Link href={`/${lang}`} className="text-neutral-900 hover:text-brand-900 transition-colors">
                            andikas.dev
                        </Link>
                    </div>

                    <span>© {new Date().getFullYear()} {dict.footer.rights}</span>
                </div>
            </div>
        </footer>
    );
}
