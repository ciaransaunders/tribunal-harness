"use client";

import Link from "next/link";

// global-error.tsx replaces the root layout on fatal errors.
// Must include <html> and <body> tags.
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body style={{ margin: 0, background: "#000", color: "#e8e8e8", fontFamily: "system-ui, sans-serif" }}>
                <div style={{
                    minHeight: "100vh", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", padding: "2rem"
                }}>
                    <div style={{ maxWidth: "500px", textAlign: "center" }}>
                        <p style={{ fontSize: "0.7rem", color: "#8B5CF6", letterSpacing: "0.2em", marginBottom: "1.5rem" }}>
                            CRITICAL ERROR
                        </p>
                        <h1 style={{ fontSize: "2.5rem", fontWeight: 400, marginBottom: "1rem" }}>
                            Application error.
                        </h1>
                        <p style={{ color: "#A0A0A0", marginBottom: "2rem", lineHeight: 1.7 }}>
                            A fatal error occurred. Please try refreshing the page.
                            {error.digest && (
                                <span style={{ display: "block", fontFamily: "monospace", fontSize: "0.7rem", marginTop: "0.5rem", opacity: 0.5 }}>
                                    Reference: {error.digest}
                                </span>
                            )}
                        </p>
                        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                            <button
                                onClick={reset}
                                style={{
                                    padding: "0.75rem 2rem", background: "#8B5CF6", color: "#fff",
                                    border: "none", borderRadius: "100px", cursor: "pointer", fontSize: "0.9rem"
                                }}
                            >
                                Try Again
                            </button>
                            <Link
                                href="/"
                                style={{
                                    padding: "0.75rem 2rem", border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "100px", color: "#A0A0A0", fontSize: "0.9rem", textDecoration: "none"
                                }}
                            >
                                Return to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
