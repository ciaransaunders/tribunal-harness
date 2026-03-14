import { redirect } from "next/navigation";

// ISSUE-2 FIX: Redirect /analysis → /analysis-engine
// External links, pitch decks, and documentation may reference /analysis.
export default function AnalysisRedirectPage() {
    redirect("/analysis-engine");
}
