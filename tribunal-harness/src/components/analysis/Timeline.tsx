"use client";

import { type HTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/ui-utils";
import { ChevronDown, ChevronRight, CalendarDays, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AnimatePresence, motion } from "framer-motion";

export interface TimelineStep {
    label: string;
    deadline: Date | string | null;
    description: string;
    status: "overdue" | "upcoming" | "future";
    critical: boolean;
}

export interface TimelineStage {
    level: string;
    abbrev: string;
    steps: TimelineStep[];
    color: string;
}

interface TimelineProps extends HTMLAttributes<HTMLDivElement> {
    stages: TimelineStage[];
}

const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
    ({ className, stages, ...props }, ref) => {
        const [expandedStage, setExpandedStage] = useState<string | null>(
            stages[0]?.level ?? null
        );

        const toggleStage = (stageLevel: string) => {
            setExpandedStage(expandedStage === stageLevel ? null : stageLevel);
        };

        const formatDate = (date: Date | string | null) => {
            if (!date) return "TBC";
            const d = new Date(date);
            if (isNaN(d.getTime())) return "TBC";
            return d.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        };

        return (
            <div ref={ref} className={cn("space-y-4", className)} {...props}>
                {stages.map((stage) => (
                    <Card
                        key={stage.level}
                        variant="wireframe"
                        className={cn(
                            "transition-all duration-300 overflow-hidden",
                            expandedStage === stage.level
                                ? "border-opacity-100 bg-[rgba(255,255,255,0.02)]"
                                : "border-opacity-40 hover:border-opacity-60"
                        )}
                        style={{
                            borderColor:
                                expandedStage === stage.level ? stage.color : undefined,
                        }}
                    >
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleStage(stage.level)}
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-[var(--color-bg-secondary)] border border-[rgba(255,255,255,0.1)]"
                                    style={{ color: stage.color, borderColor: stage.color }}
                                >
                                    {stage.abbrev}
                                </div>
                                <div>
                                    <h3 className="text-lg font-[var(--font-serif)] font-medium text-white">
                                        {stage.level}
                                    </h3>
                                    <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-[var(--font-mono)]">
                                        {stage.steps.length} Steps
                                    </p>
                                </div>
                            </div>
                            <div className="text-[var(--color-text-secondary)]">
                                {expandedStage === stage.level ? (
                                    <ChevronDown size={20} />
                                ) : (
                                    <ChevronRight size={20} />
                                )}
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedStage === stage.level && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mt-6 space-y-6 pl-5 border-l border-[rgba(255,255,255,0.1)] ml-5"
                                >
                                    {stage.steps.map((step, idx) => (
                                        <div key={idx} className="relative pl-6">
                                            {/* Connector dot */}
                                            <div
                                                className={cn(
                                                    "absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 bg-[var(--color-bg-primary)] z-10",
                                                    step.status === "overdue"
                                                        ? "border-red-500 bg-red-500/20"
                                                        : step.status === "upcoming"
                                                            ? "border-[var(--color-accent-purple)] bg-[var(--color-accent-purple-glow)]"
                                                            : "border-[rgba(255,255,255,0.2)] bg-[var(--color-bg-secondary)]"
                                                )}
                                            />

                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                                                <h4
                                                    className={cn(
                                                        "text-sm font-bold font-[var(--font-mono)] uppercase tracking-wide",
                                                        step.critical
                                                            ? "text-white"
                                                            : "text-[var(--color-text-secondary)]"
                                                    )}
                                                >
                                                    {step.label}
                                                </h4>
                                                {step.deadline && (
                                                    <Badge
                                                        variant={
                                                            step.status === "overdue"
                                                                ? "unverified"
                                                                : step.status === "upcoming"
                                                                    ? "warning"
                                                                    : "neutral"
                                                        }
                                                        className="self-start"
                                                    >
                                                        <CalendarDays
                                                            size={10}
                                                            className="mr-1.5"
                                                        />
                                                        {formatDate(step.deadline)}
                                                    </Badge>
                                                )}
                                            </div>

                                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-2">
                                                {step.description}
                                            </p>

                                            {step.critical && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-error-coral)] font-[var(--font-mono)] uppercase tracking-widest mt-2">
                                                    <AlertCircle size={10} />
                                                    Critical Deadline
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                ))}
            </div>
        );
    }
);

Timeline.displayName = "Timeline";

export { Timeline };
