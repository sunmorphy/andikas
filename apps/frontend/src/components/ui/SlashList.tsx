import React from "react";
import Link from "next/link";

export interface SlashItem {
  label: string | number;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

export type SlashListItem = string | number | SlashItem | null | undefined;

interface Props {
  items: SlashListItem[];
  className?: string;
  itemClassName?: string;
  slashClassName?: string;
}

export function SlashList({
  items,
  className = "",
  itemClassName = "",
  slashClassName = "",
}: Props) {
  const validItems = items.filter(
    (item): item is string | number | SlashItem => item != null && item !== ""
  );

  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1.5 leading-relaxed ${className}`}>
      {validItems.map((item, index) => {
        const isObject = typeof item === "object" && item !== null && "label" in item;
        const rawLabel = isObject ? item.label : item;
        const label = String(rawLabel ?? "").toLowerCase();
        const href = isObject ? item.href : undefined;
        const onClick = isObject ? item.onClick : undefined;
        const active = isObject ? item.active : false;

        const baseClass = `font-bold lowercase tracking-tight transition-colors select-none ${
          active
            ? "text-brand-900"
            : "text-ink hover:text-brand-900"
        } ${itemClassName}`;

        let content: React.ReactNode;
        if (href) {
          const isExternal = href.startsWith("http://") || href.startsWith("https://");
          content = (
            <Link
              href={href}
              className={baseClass}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {label}
            </Link>
          );
        } else if (onClick) {
          content = (
            <button type="button" onClick={onClick} className={`${baseClass} cursor-pointer`}>
              {label}
            </button>
          );
        } else {
          content = <span className={baseClass}>{label}</span>;
        }

        return (
          <React.Fragment key={`${label}-${index}`}>
            {content}
            {index < validItems.length - 1 && (
              <span className={`text-brand-900 font-bold select-none ${slashClassName}`}>
                /
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
