import type { Metadata } from "next";
import { ERA_2025_TRACKER } from "@/lib/constants";

export const metadata: Metadata = {
    title: "ERA 2025 Tracker | Tribunal Harness",
    description: "Employment Rights Act 2025 commencement tracker — all provisions, dates, and status.",
};

// ISSUE-3 FIX: Standalone /era-2025 page for external links and pitch decks.
// Data sourced from constants.ts (single source of truth).
export default function ERA2025Page() {
    return (
        <div style={{ paddingTop: "10rem" }}>
            <div className="page-section">
                <span className="text-subhead">LEGISLATIVE CHANGE</span>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>
                    ERA 2025 Implementation Tracker
                </h1>
                <p className="text-lead" style={{ marginBottom: "1.5rem" }}>
                    The Employment Rights Act 2025 is the most significant overhaul of UK employment law in decades.
                    This tracker shows every provision, its commencement date, and current status.
                </p>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: "3rem", fontSize: "0.85rem", fontFamily: "var(--font-mono)" }}>
                    Provisions marked &quot;SI awaited&quot; have no confirmed commencement date. Do not rely on estimated dates for these provisions.
                </p>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                                {["Provision", "Old Position", "New Position", "Commencement", "Status"].map((h) => (
                                    <th key={h} style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ERA_2025_TRACKER.map((row, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                                    <td style={{ padding: "0.75rem", fontWeight: 500 }}>{row.provision}</td>
                                    <td style={{ padding: "0.75rem", color: "var(--color-text-secondary)" }}>{row.old_position}</td>
                                    <td style={{ padding: "0.75rem", color: "var(--color-text-secondary)" }}>{row.new_position}</td>
                                    <td style={{ padding: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>{row.commencement}</td>
                                    <td style={{ padding: "0.75rem" }}>
                                        <span style={{
                                            fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 600, padding: "2px 6px", borderRadius: "4px",
                                            color: row.status === "in_force" ? "#2dd4bf" : row.status === "upcoming" ? "var(--color-accent-purple)" : "#fbbf24",
                                            background: row.status === "in_force" ? "rgba(45,212,191,0.1)" : row.status === "upcoming" ? "rgba(123,107,245,0.1)" : "rgba(251,191,36,0.1)",
                                        }}>
                                            {row.status === "in_force" ? "IN FORCE" : row.status === "upcoming" ? "UPCOMING" : "AWAITING SI"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: "3rem", padding: "1rem", borderTop: "1px solid var(--color-border-subtle)", textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", opacity: 0.6 }}>
                        This tool provides legal information, not legal advice. Timelines and dates should be verified against official sources and current Statutory Instruments.
                    </p>
                </div>
            </div>
        </div>
    );
}
