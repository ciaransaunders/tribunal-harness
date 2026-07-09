import type { NextRequest } from "next/server";

/**
 * Shared in-memory rate limiter for the LLM-backed API routes.
 *
 * DEMO / single-instance only: state lives in a per-process Map, so it resets on
 * cold start and is NOT shared across serverless instances. Before any real
 * production launch, move to a shared store (Vercel KV / Upstash Redis).
 *
 * Extracted here so /api/analyse and /api/debate share ONE implementation
 * (with the F-20 hardening) instead of drifting copies.
 */

/**
 * F-20: derive the rate-limit key from the trusted proxy hop only.
 *
 * `X-Forwarded-For` is `client, proxy1, proxy2, …` — every entry EXCEPT the last
 * is attacker-controllable (a client can send any header it likes). A single
 * trusted reverse proxy in front of the app (e.g. Vercel) appends the real peer
 * address as the FINAL entry, so that is the only hop we can trust. Keying on it
 * stops a client from evading the limit by spoofing rotating XFF values.
 *
 * Trusted-proxy assumption: exactly one trusted proxy sits in front of the route
 * and always appends the true client address as the last XFF entry. If the
 * deployment topology changes, revisit this.
 */
export function clientKeyFromRequest(request: NextRequest): string {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
        const hops = xff.split(",").map((h) => h.trim()).filter(Boolean);
        if (hops.length > 0) return hops[hops.length - 1];
    }
    return "unknown-ip";
}

export interface RateLimiter {
    /** True if the request is within the limit; false if it should be 429'd. */
    check(key: string): boolean;
}

/**
 * Create an independent fixed-window rate limiter. Each call returns its own
 * bounded Map, so distinct routes keep SEPARATE buckets (a user's /api/analyse
 * calls do not consume their /api/debate allowance).
 */
export function createRateLimiter(opts: {
    windowMs: number;
    maxRequests: number;
}): RateLimiter {
    const { windowMs, maxRequests } = opts;
    const map = new Map<string, number[]>();

    return {
        check(key: string): boolean {
            const now = Date.now();

            // F-20: bound the Map — evict every entry whose window has fully
            // elapsed so it can never grow without limit under distinct keys.
            for (const [k, timestamps] of map) {
                if (
                    timestamps.length === 0 ||
                    timestamps[timestamps.length - 1] <= now - windowMs
                ) {
                    map.delete(k);
                }
            }

            const recent = (map.get(key) ?? []).filter(
                (ts) => now - ts < windowMs
            );

            if (recent.length >= maxRequests) {
                map.set(key, recent);
                return false;
            }

            recent.push(now);
            map.set(key, recent);
            return true;
        },
    };
}
