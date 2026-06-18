import Link from "next/link";
import { HeaderNav } from "./HeaderNav";
import { getDictionary } from "@/get-dictionary";
import { Locale } from "@/i18n-config";

export default async function Header({ lang }: { lang: Locale }) {
    const dict = await getDictionary(lang);
    return (
        <header className="w-full bg-transparent pt-12 pb-8">
            <div className="w-4/5 px-6 flex justify-end items-center">
                <HeaderNav lang={lang} />
            </div>
        </header>
    );
}
