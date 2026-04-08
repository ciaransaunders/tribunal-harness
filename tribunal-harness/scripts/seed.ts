import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables. Make sure .env.local exists.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface CaseLawEntry {
    id: string;
    citation: string;
    neutral_citation: string;
    case_name: string;
    court: string;
    year: number;
    tier: "binding" | "persuasive" | "statutory" | "guidance";
    summary: string;
    claim_types: string[];
    trust_badge: "VERIFIED" | "CHECK";
    url?: string;
}

const SEED_CASES: CaseLawEntry[] = [
    {
        id: "polkey-v-dayton",
        citation: "[1988] AC 344",
        neutral_citation: "Polkey v AE Dayton Services Ltd",
        case_name: "Polkey v AE Dayton Services Ltd",
        court: "House of Lords",
        year: 1988,
        tier: "binding",
        summary: "Established that procedural failures in dismissal are not automatically irrelevant. The tribunal must consider whether a fair procedure would have made any difference. Gives rise to 'Polkey reduction' of compensation.",
        claim_types: ["unfair_dismissal"],
        trust_badge: "VERIFIED",
        url: "https://www.bailii.org/uk/cases/UKHL/1987/8.html",
    },
    {
        id: "iceland-v-jones",
        citation: "[1983] ICR 17",
        neutral_citation: "Iceland Frozen Foods Ltd v Jones",
        case_name: "Iceland Frozen Foods Ltd v Jones",
        court: "EAT",
        year: 1982,
        tier: "binding",
        summary: "The correct approach to fairness is whether the employer's decision to dismiss fell within the 'band of reasonable responses' which a reasonable employer might have adopted. Tribunals must not substitute their own view.",
        claim_types: ["unfair_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "bca-v-obrien",
        citation: "[1987] IRLR 429",
        neutral_citation: "British Credit Trust Ltd v O'Brien",
        case_name: "British Credit Trust Ltd v O'Brien",
        court: "EAT",
        year: 1987,
        tier: "binding",
        summary: "Provided guidance on the definition of constructive dismissal.",
        claim_types: ["constructive_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "igen-v-wong",
        citation: "[2005] EWCA Civ 142",
        neutral_citation: "Igen Ltd v Wong",
        case_name: "Igen Ltd v Wong",
        court: "Court of Appeal",
        year: 2005,
        tier: "binding",
        summary: "Key case on the shifting burden of proof in discrimination cases.",
        claim_types: ["direct_discrimination"],
        trust_badge: "VERIFIED",
    },
    {
        id: "era-1996-s98",
        citation: "ERA 1996 s.98",
        neutral_citation: "Employment Rights Act 1996, section 98",
        case_name: "Employment Rights Act 1996 — Fair Reasons for Dismissal",
        court: "Statute",
        year: 1996,
        tier: "statutory",
        summary: "Sets out the potentially fair reasons for dismissal (capability, conduct, redundancy, statutory restriction, or some other substantial reason). The tribunal then determines whether the dismissal was fair in all the circumstances.",
        claim_types: ["unfair_dismissal", "constructive_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "ea-2010-s26",
        citation: "EA 2010 s.26",
        neutral_citation: "Equality Act 2010, section 26",
        case_name: "Equality Act 2010 — Harassment",
        court: "Statute",
        year: 2010,
        tier: "statutory",
        summary: "Statutory definition of harassment. Unwanted conduct related to a protected characteristic that has the purpose or effect of violating dignity or creating an intimidating, hostile, degrading, humiliating or offensive environment.",
        claim_types: ["harassment", "direct_discrimination"],
        trust_badge: "VERIFIED",
    },
    {
        id: "era-1996-s43b",
        citation: "ERA 1996 s.43B",
        neutral_citation: "Employment Rights Act 1996, section 43B",
        case_name: "Employment Rights Act 1996 — Protected Disclosures",
        court: "Statute",
        year: 1996,
        tier: "statutory",
        summary: "Definition of a qualifying disclosure for whistleblowing protection. The disclosure must be of information which the worker reasonably believes tends to show one of six categories of wrongdoing (criminal offence, breach of legal obligation, miscarriage of justice, danger to health/safety, environmental damage, or concealment).",
        claim_types: ["whistleblowing"],
        trust_badge: "VERIFIED",
    },
    {
        id: "era-2025-s1",
        citation: "ERA 2025 s.1",
        neutral_citation: "Employment Rights Act 2025, section 1",
        case_name: "Employment Rights Act 2025 — Unfair Dismissal Qualifying Period",
        court: "Statute",
        year: 2025,
        tier: "statutory",
        summary: "Reduces the qualifying period for unfair dismissal from 2 years to 6 months. Commencement: 1 January 2027 (subject to Statutory Instrument). Employees dismissed on or after this date with 6 months' service will have the right not to be unfairly dismissed.",
        claim_types: ["unfair_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "era-2025-fire-rehire",
        citation: "ERA 2025 s.23",
        neutral_citation: "Employment Rights Act 2025, section 23",
        case_name: "Employment Rights Act 2025 — Fire and Rehire",
        court: "Statute",
        year: 2025,
        tier: "statutory",
        summary: "Dismissal for the purpose of rehiring on inferior terms is automatically unfair. No qualifying period required. Commencement: 1 January 2027 (subject to Statutory Instrument). Applies where the employer's reason or principal reason for dismissal is to offer re-engagement on different terms.",
        claim_types: ["fire_and_rehire", "unfair_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "williams-v-compair",
        citation: "[1982] ICR 156",
        neutral_citation: "Williams v Compair Maxam Ltd",
        case_name: "Williams v Compair Maxam Ltd",
        court: "EAT",
        year: 1982,
        tier: "persuasive",
        summary: "Established the principles of fair redundancy selection. The employer should give as much warning as possible, consult with the union or employees, use objective selection criteria, consider alternative employment, and follow a fair procedure.",
        claim_types: ["redundancy"],
        trust_badge: "VERIFIED",
    },
    {
        id: "autoclenz-v-belcher",
        citation: "[2011] UKSC 41",
        neutral_citation: "Autoclenz Ltd v Belcher",
        case_name: "Autoclenz Ltd v Belcher",
        court: "Supreme Court",
        year: 2011,
        tier: "binding",
        summary: "Employment status and sham contracts. Courts will look at the true nature of the relationship, not just the written contract. A clause purporting to deny employment status will be disregarded if it does not reflect the true agreement.",
        claim_types: ["unfair_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "uber-v-aslam",
        citation: "[2021] UKSC 5",
        neutral_citation: "Uber BV v Aslam",
        case_name: "Uber BV v Aslam",
        court: "Supreme Court",
        year: 2021,
        tier: "binding",
        summary: "Gig economy employment status. Uber drivers are workers, not independent contractors. The Supreme Court applied a purposive approach to employment status, looking at the reality of the relationship and the subordination of the drivers to Uber's control.",
        claim_types: ["unfair_dismissal", "whistleblowing"],
        trust_badge: "VERIFIED",
    },
    {
        id: "forstater-v-cgd",
        citation: "[2022] EAT 0105",
        neutral_citation: "Forstater v CGD Europe",
        case_name: "Forstater v CGD Europe",
        court: "EAT",
        year: 2022,
        tier: "persuasive",
        summary: "Gender-critical beliefs are a protected philosophical belief under the Equality Act 2010. The EAT held that the employment tribunal had erred in finding that the claimant's belief did not qualify for protection.",
        claim_types: ["direct_discrimination"],
        trust_badge: "VERIFIED",
    },
    {
        id: "western-excavating-v-sharp",
        citation: "[1978] ICR 221",
        neutral_citation: "Western Excavating (ECC) Ltd v Sharp",
        case_name: "Western Excavating (ECC) Ltd v Sharp",
        court: "Court of Appeal",
        year: 1978,
        tier: "binding",
        summary: "Foundational authority on constructive dismissal. The employer's conduct must amount to a significant breach going to the root of the contract, or show an intention not to be bound by an essential term. The employee must resign in response to the breach and not delay.",
        claim_types: ["constructive_dismissal"],
        trust_badge: "VERIFIED",
    },
    {
        id: "ea-2010-s15",
        citation: "EA 2010 s.15",
        neutral_citation: "Equality Act 2010, section 15",
        case_name: "Equality Act 2010 — Discrimination Arising from Disability",
        court: "Statute",
        year: 2010,
        tier: "statutory",
        summary: "Discrimination arising from disability. An employer discriminates if they treat a disabled person unfavourably because of something arising in consequence of their disability, and cannot show the treatment is a proportionate means of achieving a legitimate aim.",
        claim_types: ["direct_discrimination"],
        trust_badge: "VERIFIED",
    },
    {
        id: "era-1996-s207b",
        citation: "ERA 1996 s.207B",
        neutral_citation: "Employment Rights Act 1996, section 207B",
        case_name: "Employment Rights Act 1996 — ACAS Early Conciliation",
        court: "Statute",
        year: 1996,
        tier: "statutory",
        summary: "ACAS early conciliation clock-stopping. The limitation period is extended by the period of ACAS early conciliation (Day A to Day B). The claimant gets whichever is longer: the extended deadline or 1 calendar month from Day B.",
        claim_types: ["unfair_dismissal", "direct_discrimination", "harassment", "whistleblowing", "redundancy"],
        trust_badge: "VERIFIED",
    },
    {
        id: "zero-hours-era-2025",
        citation: "ERA 2025 s.12",
        neutral_citation: "Employment Rights Act 2025, section 12",
        case_name: "Employment Rights Act 2025 — Zero-Hours Contracts",
        court: "Statute",
        year: 2025,
        tier: "statutory",
        summary: "Right to a guaranteed hours contract for zero-hours workers. Employers must offer a contract reflecting the hours regularly worked. Commencement: 2027 (exact date awaiting Statutory Instrument). Workers cannot be required to work exclusively for one employer.",
        claim_types: ["zero_hours_rights"],
        trust_badge: "CHECK",
    },
];

async function seed() {
    console.log(`Seeding ${SEED_CASES.length} cases...`);

    for (const entry of SEED_CASES) {
        const { error } = await supabase.from('case_law_entries').upsert(entry);
        if (error) {
            console.error(`Failed to seed ${entry.id}:`, error.message);
        } else {
            console.log(`Seeded ${entry.id}`);
        }
    }

    console.log("Seeding complete.");
}

seed().catch(console.error);
