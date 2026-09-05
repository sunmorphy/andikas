import { HeaderNav } from "./HeaderNav";
import { Locale } from "@/i18n-config";

export default function Header({
  lang,
  dict,
}: {
  lang: Locale;
  dict?: { home?: string; works?: string; projects?: string };
}) {
  return (
    <header className="w-full bg-transparent pt-6 pb-2">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-end items-center">
        <HeaderNav lang={lang} dict={dict} />
      </div>
    </header>
  );
}
