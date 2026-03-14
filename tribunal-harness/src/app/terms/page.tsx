import type { Metadata } from "next";
import Link from "next/link";

// AUDIT FIX: Created Terms of Use page with legal boundary language
export const metadata: Metadata = {
    title: "Terms of Use | Tribunal Harness",
    description: "Terms governing use of Tribunal Harness, including legal information disclaimers and limitation of liability.",
};

export default function TermsPage() {
    return (
        <div className="page-section" style={{ paddingTop: "10rem", maxWidth: "800px" }}>
            <span className="text-subhead">LEGAL</span>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", marginBottom: "1.5rem" }}>Terms of Use</h1>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "3rem", fontSize: "0.85rem" }}>
                Last updated: 16 February 2026
            </p>

            <div style={{ color: "var(--color-text-secondary)", lineHeight: 1.9, fontSize: "0.95rem" }}>
                {/* Critical disclaimer box */}
                <div style={{ padding: "1.5rem", border: "1px solid var(--color-error-coral)", borderRadius: "var(--radius-card)", background: "rgba(232,93,93,0.03)", marginBottom: "3rem" }}>
                    <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--color-error-coral)", marginBottom: "0.75rem" }}>
                        Important: Legal Information, Not Legal Advice
                    </h3>
                    <p>
                        Tribunal Harness provides <strong>legal information</strong>, not <strong>legal advice</strong>. It does not
                        constitute the provision of reserved legal activities within the meaning of the Legal Services Act 2007.
                        Use of this tool does not create a solicitor-client relationship, a barrister-client relationship,
                        or any other professional advisory relationship.
                    </p>
                    <p style={{ marginTop: "0.75rem" }}>
                        If your claim is complex, involves potential loss of livelihood, or concerns high-value remedies,
                        you should seek advice from a qualified solicitor, barrister, or accredited legal adviser.
                        Free advice may be available from your local Citizens Advice, Law Centre, or ACAS.
                    </p>
                </div>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>1. Service Description</h2>
                    <p>
                        Tribunal Harness is a legal information tool that provides structured analysis of employment tribunal
                        claim types against statutory legal tests. It identifies applicable claim types, surfaces relevant
                        authorities, calculates procedural deadlines, and presents this information in a structured format.
                    </p>
                    <p style={{ marginTop: "0.75rem" }}>
                        The tool does not: file claims on your behalf; make submissions to a tribunal; provide
                        bespoke legal advice about your specific situation; or guarantee any outcome. All output
                        is informational and requires your independent judgement and, where appropriate, professional
                        legal review before reliance.
                    </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>2. Accuracy and Limitations</h2>
                    <p>
                        While we take reasonable steps to ensure the accuracy of the legal information provided — including
                        citation verification, epistemic quarantine of ungrounded claims, and regular updates for legislative
                        changes — we do not warrant that all information is complete, current, or error-free.
                    </p>
                    <p style={{ marginTop: "0.75rem" }}>
                        UK employment law is complex and fact-sensitive. The tool analyses facts against general legal tests
                        but cannot account for all case-specific circumstances, local tribunal practices, or judicial discretion.
                    </p>
                    <p style={{ marginTop: "0.75rem" }}>
                        ERA 2025 provisions are being brought into force on a phased timetable. Some commencement dates
                        are subject to confirmation by Statutory Instrument. Where this is the case, the tool clearly indicates
                        the provisional nature of the date.
                    </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>3. AI-Generated Content</h2>
                    <p>
                        Portions of the analysis output are generated by artificial intelligence (Anthropic Claude). While the
                        system applies verification layers (epistemic quarantine, citation checking, adversarial testing),
                        AI-generated content may contain errors, omissions, or inaccuracies.
                    </p>
                    <p style={{ marginTop: "0.75rem" }}>
                        Trust indicators (VERIFIED, CHECK, QUARANTINED) are provided to help you assess the reliability
                        of each proposition. You should independently verify any legal proposition before relying on it
                        in tribunal proceedings.
                    </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>4. Limitation of Liability</h2>
                    <p>
                        To the fullest extent permitted by law, Tribunal Harness shall not be liable for any loss, damage,
                        or adverse consequence arising from reliance on the tool&apos;s output, including but not limited to:
                        missed tribunal deadlines, unsuccessful claims, adverse costs orders, or any other detriment.
                    </p>
                    <p style={{ marginTop: "0.75rem" }}>
                        Nothing in these terms excludes or limits liability for fraud, death or personal injury caused by
                        negligence, or any other liability that cannot be excluded by law.
                    </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>5. Your Responsibilities</h2>
                    <ul style={{ listStyle: "none", lineHeight: 2.2 }}>
                        <li>• You are responsible for the accuracy of the facts you provide to the tool</li>
                        <li>• You are responsible for verifying the tool&apos;s output before relying on it</li>
                        <li>• You must not use the tool to generate vexatious, fraudulent, or abusive claims</li>
                        <li>• You must comply with tribunal rules and directions regardless of the tool&apos;s output</li>
                        <li>• You acknowledge that time limits are critical in tribunal proceedings and should not rely solely on this tool&apos;s deadline calculations</li>
                    </ul>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>6. Data Protection</h2>
                    <p>
                        Your use of Tribunal Harness is subject to our <Link href="/privacy" style={{ color: "var(--color-accent-purple)" }}>Privacy Policy</Link>,
                        which explains how we collect, use, and protect your personal data, including special category data
                        that may be contained in employment tribunal narratives.
                    </p>
                </section>

                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>7. Governing Law</h2>
                    <p>
                        These terms are governed by and construed in accordance with the laws of England and Wales.
                        Any disputes arising from the use of Tribunal Harness shall be subject to the exclusive
                        jurisdiction of the courts of England and Wales.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "1.2rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>8. Contact</h2>
                    <p>
                        Questions about these terms: <Link href="mailto:hello@tribunalharness.co.uk" style={{ color: "var(--color-accent-purple)" }}>hello@tribunalharness.co.uk</Link>
                    </p>
                </section>
            </div>
        </div>
    );
}
