import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with conflict resolution.
 * Uses clsx for conditional classes + tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
