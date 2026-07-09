import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
        // T-0.5 / F-34,F-35 — global env snapshot/restore + ambient-var stripping.
        setupFiles: ["src/test/setup.ts"],
        globals: true,
        pool: "forks",
        coverage: {
            enabled: false,
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
