import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { createRateLimiter, clientKeyFromRequest } from "./rate-limit";

describe("createRateLimiter", () => {
    afterEach(() => vi.useRealTimers());

    it("allows up to maxRequests then blocks the next", () => {
        const rl = createRateLimiter({ windowMs: 1000, maxRequests: 3 });
        expect(rl.check("a")).toBe(true);
        expect(rl.check("a")).toBe(true);
        expect(rl.check("a")).toBe(true);
        expect(rl.check("a")).toBe(false); // 4th over the limit
    });

    it("keeps separate buckets per key", () => {
        const rl = createRateLimiter({ windowMs: 1000, maxRequests: 1 });
        expect(rl.check("a")).toBe(true);
        expect(rl.check("a")).toBe(false);
        expect(rl.check("b")).toBe(true); // a different key is unaffected
    });

    it("gives each limiter instance independent state (separate buckets per route)", () => {
        const rl1 = createRateLimiter({ windowMs: 1000, maxRequests: 1 });
        const rl2 = createRateLimiter({ windowMs: 1000, maxRequests: 1 });
        expect(rl1.check("a")).toBe(true);
        expect(rl1.check("a")).toBe(false);
        expect(rl2.check("a")).toBe(true); // rl2 unaffected by rl1's usage
    });

    it("frees the allowance once the window has fully elapsed", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
        const rl = createRateLimiter({ windowMs: 1000, maxRequests: 1 });
        expect(rl.check("a")).toBe(true);
        expect(rl.check("a")).toBe(false);
        vi.advanceTimersByTime(1001);
        expect(rl.check("a")).toBe(true); // window passed → allowed again
    });
});

describe("clientKeyFromRequest (F-20 trusted-hop)", () => {
    const req = (xff?: string) =>
        new NextRequest("http://localhost/x", {
            headers: xff ? { "x-forwarded-for": xff } : {},
        });

    it("uses the LAST hop of x-forwarded-for (the only non-spoofable one)", () => {
        // A client spoofing leading entries cannot change the trusted last hop.
        expect(clientKeyFromRequest(req("1.1.1.1, 2.2.2.2, 3.3.3.3"))).toBe("3.3.3.3");
    });

    it("returns the single value when there is only one hop", () => {
        expect(clientKeyFromRequest(req("9.9.9.9"))).toBe("9.9.9.9");
    });

    it("falls back to unknown-ip when the header is absent", () => {
        expect(clientKeyFromRequest(req())).toBe("unknown-ip");
    });
});
