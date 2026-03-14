"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/ui-utils";
import { ShieldCheck, CircleAlert, XCircle } from "lucide-react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: "verified" | "warning" | "unverified" | "quarantined" | "neutral";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = "neutral", children, ...props }, ref) => {
        const variants = {
            verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
            warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
            unverified: "bg-red-500/10 text-red-400 border-red-500/30",
            quarantined: "bg-red-500/10 text-red-400 border-red-500/30",
            neutral: "bg-[rgba(255,255,255,0.05)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]",
        };

        const icons = {
            verified: <ShieldCheck className="w-3 h-3 mr-1" />,
            warning: <CircleAlert className="w-3 h-3 mr-1" />,
            unverified: <XCircle className="w-3 h-3 mr-1" />,
            quarantined: <XCircle className="w-3 h-3 mr-1" />,
            neutral: null,
        };

        return (
            <span
                ref={ref}
                className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-[var(--font-mono)] uppercase tracking-wider font-bold border",
                    variants[variant],
                    className
                )}
                {...props}
            >
                {icons[variant]}
                {children}
            </span>
        );
    }
);

Badge.displayName = "Badge";

export { Badge };
