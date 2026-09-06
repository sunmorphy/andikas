import Link from "next/link";

interface Props {
    title: string;
    subtitle?: string;
    action?: {
        label: string;
        href: string;
    };
    className?: string;
}

export function SectionHeading({title, subtitle, action, className = ""}: Props) {
    return (
        <div className={`flex flex-col items-start ${className}`}>
            <h1 className="text-[clamp(3.2rem,6.2vw,6.5rem)] font-bold tracking-tighter leading-[0.9] text-ink lowercase select-none">
                {title.toLowerCase()}
            </h1>

            {(subtitle || action) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 mt-10 md:mt-14 w-full max-w-xl">
                    {subtitle && (
                        <p className="text-xs md:text-sm text-ink leading-relaxed font-normal">
                            {subtitle.toLowerCase()}
                        </p>
                    )}

                    {action && (
                        <div
                            className="flex flex-col items-start gap-2 text-xs md:text-sm font-bold lowercase text-ink">
                            <Link
                                href={action.href}
                                className="text-xs md:text-sm font-medium text-ink lowercase underline underline-offset-4 decoration-1 hover:text-brand-900 hover:decoration-brand-900 transition-colors"
                            >
                                {action.label.toLowerCase()}
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
