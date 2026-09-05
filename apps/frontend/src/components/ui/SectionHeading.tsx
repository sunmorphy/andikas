import Link from "next/link";

interface Props {
  title: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function SectionHeading({ title, action, className = "" }: Props) {
  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-ink lowercase select-none">
        {title.toLowerCase()}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="text-base font-medium text-ink lowercase underline underline-offset-4 decoration-1 hover:text-brand-900 hover:decoration-brand-900 transition-colors"
        >
          {action.label.toLowerCase()}
        </Link>
      )}
    </div>
  );
}
