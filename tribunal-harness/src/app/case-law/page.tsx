import { redirect } from "next/navigation";

// ISSUE-4 FIX: Redirect /case-law → /case-law-db
// External links may reference the shorter URL.
export default function CaseLawRedirectPage() {
    redirect("/case-law-db");
}
