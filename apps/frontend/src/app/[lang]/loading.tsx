import { Code } from "iconoir-react";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] bg-surface flex items-center justify-center">
            <div className="relative flex flex-col items-center gap-3">
                <div className="relative bg-brand-900 w-12 h-12 flex items-center justify-center animate-[spin_3s_linear_infinite]">
                    <Code className="w-6 h-6 text-neutral-50" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-450">LOADING...</span>
            </div>
        </div>
    );
}
