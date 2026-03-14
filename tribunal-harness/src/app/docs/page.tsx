import { redirect } from "next/navigation";

// ISSUE-5 FIX: Redirect /docs → /documentation
// External links may reference the shorter URL.
export default function DocsRedirectPage() {
    redirect("/documentation");
}
