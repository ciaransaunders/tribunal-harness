"use client";

import Link from "next/link";

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div style={{
            minHeight: "100vh", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: "2rem",
            background: "var(--color-bg-primary)"
        }}>
            <div style={{ maxWidth: "500px", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-accent-purple)", letterSpacing: "0.2em", marginBottom: "1.5rem" }}>
                    ERROR
                </p>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", marginBottom: "1rem", color: "#fff" }}>
                    Something went wrong.
                </h1>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: "2rem", lineHeight: 1.7 }}>
                    An unexpected error occurred. Your data has not been submitted or stored.
                    {error.digest && (
                        <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.7rem", marginTop: "0.5rem", opacity: 0.5 }}>
                            Reference: {error.digest}
                        </span>
                    )}
                </p>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                        onClick={reset}
                        className="btn-primary"
                        style={{ padding: "0.75rem 2rem" }}
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        style={{
                            padding: "0.75rem 2rem", border: "1px solid var(--color-border-subtle)",
                            borderRadius: "var(--radius-pill)", color: "var(--color-text-secondary)",
                            fontSize: "0.9rem", transition: "border-color 0.2s"
                        }}
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
