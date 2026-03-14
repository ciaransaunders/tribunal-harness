"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/ui-utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
        const baseStyles =
            "inline-flex items-center justify-center font-sans font-semibold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] disabled:opacity-50 disabled:pointer-events-none rounded-md uppercase";

        const variants = {
            primary:
                "bg-[var(--color-accent-purple)] text-white hover:brightness-110 active:scale-[0.98] shadow-[0_0_20px_rgba(139,92,246,0.2)]",
            secondary:
                "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.08)] border border-[var(--color-border-subtle)]",
            outline:
                "bg-transparent border border-[var(--color-accent-purple)] text-[var(--color-accent-purple)] hover:bg-[rgba(139,92,246,0.1)]",
            ghost:
                "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.05)]",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-6 text-sm",
            lg: "h-12 px-8 text-base",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export { Button };
