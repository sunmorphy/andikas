import { Suspense } from "react";
import { HeaderNav } from "./HeaderNav";
import { Locale } from "@/i18n-config";

export default function Header({
  lang,
  dict,
}: {
  lang: Locale;
  dict?: { home?: string; works?: string; projects?: string; writings?: string };
}) {
  return (
    <header className="w-full bg-transparent pt-6 pb-2">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-end items-center">
        <Suspense fallback={null}>
          <HeaderNav lang={lang} dict={dict} />
        </Suspense>
      </div>
    </header>
  );
}
