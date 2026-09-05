import Link from "next/link";
import React from "react";

interface Props {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

export function UnderlineLink({
  href,
  children,
  className = "",
  external = false,
}: Props) {
  const commonClass = `font-bold lowercase underline underline-offset-4 decoration-1 text-ink hover:text-brand-900 hover:decoration-brand-900 transition-colors ${className}`;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={commonClass}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={commonClass}>
      {children}
    </Link>
  );
}
