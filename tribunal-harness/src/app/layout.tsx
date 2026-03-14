import type { Metadata } from "next";
import { Playfair_Display, Outfit, Fira_Code } from "next/font/google";
import NavBar from "@/components/layout/NavBar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const playfair = Playfair_Display({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    style: ["normal", "italic"],
    variable: "--font-serif",
    display: "swap",
});

const outfit = Outfit({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600"],
    variable: "--font-sans",
    display: "swap",
});

const firaCode = Fira_Code({
    subsets: ["latin"],
    weight: ["300", "400", "500", "700"],
    variable: "--font-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Tribunal Harness | Structured Legal Analysis",
    description:
        "Structured case analysis for UK employment tribunal litigants-in-person. Turn complex facts into durable legal arguments.",
    keywords: [
        "employment tribunal",
        "litigant in person",
        "UK employment law",
        "ERA 2025",
        "legal analysis",
        "unfair dismissal",
        "discrimination",
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            className={`${playfair.variable} ${outfit.variable} ${firaCode.variable}`}
        >
            <body>
                <NavBar />
                <main>{children}</main>
                <Footer />
            </body>
        </html>
    );
}
