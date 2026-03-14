import Link from "next/link";

const PLATFORM_LINKS = [
    { href: "/how-it-works", label: "How It Works" },
    { href: "/analysis-engine", label: "Analysis Engine" },
    { href: "/product", label: "Architecture" },
    { href: "/case-law-db", label: "Case Law DB" },
    { href: "/pricing", label: "Pricing" },
];

const COMPANY_LINKS = [
    { href: "/about", label: "About" },
    { href: "/methodology", label: "Methodology" },
    { href: "/ethics", label: "Ethics" },
    { href: "/contact", label: "Contact" },
];

// AUDIT FIX: Added legal document links to footer
const LEGAL_LINKS = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Use" },
    { href: "/security", label: "Security" },
];

export function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-content">
                <div>
                    {/* AUDIT FIX: Changed tagline from "without limits" to "structured" for consistency */}
                    <h2 className="footer-heading" style={{ color: "var(--color-text-dark)" }}>
                        Legal work,
                        <br />
                        structured.
                    </h2>
                    <p style={{ maxWidth: "300px", opacity: 0.7, fontSize: "0.9rem", color: "var(--color-text-dark)" }}>
                        Empowering litigants-in-person to present their best case with structured, verifiable analysis.
                    </p>
                </div>

                <div className="footer-links">
                    <div>
                        <h5 className="footer-col-head" style={{ color: "var(--color-text-dark)" }}>Platform</h5>
                        <ul className="footer-list">
                            {PLATFORM_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} style={{ color: "var(--color-text-dark)" }}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h5 className="footer-col-head" style={{ color: "var(--color-text-dark)" }}>Company</h5>
                        <ul className="footer-list">
                            {COMPANY_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} style={{ color: "var(--color-text-dark)" }}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* AUDIT FIX: Added Legal column with Privacy Policy, Terms of Use, and Security links */}
                    <div>
                        <h5 className="footer-col-head" style={{ color: "var(--color-text-dark)" }}>Legal</h5>
                        <ul className="footer-list">
                            {LEGAL_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} style={{ color: "var(--color-text-dark)" }}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* AUDIT FIX: Added legal information disclaimer in footer bar */}
            <div style={{ padding: "1.5rem 2rem", borderTop: "1px solid rgba(26, 26, 26, 0.15)", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--color-text-dark)", opacity: 0.5, lineHeight: 1.6 }}>
                    Tribunal Harness provides legal information, not legal advice. It does not create a solicitor-client relationship. © {new Date().getFullYear()} Tribunal Harness.
                </p>
            </div>

            <div className="brand-huge" style={{ color: "var(--color-text-dark)", opacity: 0.05 }}>Tribunal Harness</div>
        </footer>
    );
}
