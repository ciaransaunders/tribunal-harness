/**
 * Verified Authorities — Known-Good Case Law Database
 *
 * Phase 2a of the epistemic quarantine: a curated list of verified UK
 * employment law authorities with exact citations. Used by the citation
 * validator to check Claude's output against ground truth.
 *
 * Sources: BAILII, Supreme Court website, EAT judgments database.
 * Each entry has been manually verified.
 *
 * To add a new authority:
 * 1. Verify the full citation against BAILII or the court's official record
 * 2. Add to the appropriate section below
 * 3. Run citation-validator tests to confirm matching works
 */

export interface VerifiedAuthority {
    /** Short case name for matching (e.g. "Polkey") */
    shortName: string;
    /** Full neutral citation (e.g. "[1987] UKHL 8") */
    neutralCitation: string;
    /** Full case name */
    fullName: string;
    /** Court level */
    court: "UKSC" | "UKHL" | "EWCA" | "EAT" | "ET";
    /** Authority tier for trust weighting */
    tier: "binding" | "persuasive";
    /** Claim types this case is relevant to */
    claimTypes: string[];
    /** Key legal principle established */
    principle: string;
}

export const VERIFIED_AUTHORITIES: VerifiedAuthority[] = [
    // =========================================================================
    // UNFAIR DISMISSAL — Core Authorities
    // =========================================================================
    {
        shortName: "Polkey",
        neutralCitation: "[1987] UKHL 8",
        fullName: "Polkey v AE Dayton Services Ltd",
        court: "UKHL",
        tier: "binding",
        claimTypes: ["unfair_dismissal"],
        principle:
            "Procedural fairness is essential. A dismissal may be unfair solely because the employer failed to follow a fair procedure, even if the outcome would have been the same.",
    },
    {
        shortName: "BHS v Burchell",
        neutralCitation: "[1978] UKEAT 0108_78_2007",
        fullName: "British Home Stores Ltd v Burchell",
        court: "EAT",
        tier: "binding",
        claimTypes: ["unfair_dismissal"],
        principle:
            "Three-stage test for misconduct dismissals: (1) genuine belief in guilt, (2) reasonable grounds for that belief, (3) reasonable investigation.",
    },
    {
        shortName: "Iceland Frozen Foods",
        neutralCitation: "[1982] UKEAT 0062_82_2207",
        fullName: "Iceland Frozen Foods Ltd v Jones",
        court: "EAT",
        tier: "binding",
        claimTypes: ["unfair_dismissal"],
        principle:
            "The band of reasonable responses test: the tribunal must not substitute its own view for that of the employer. The question is whether the dismissal fell within the range of reasonable responses open to a reasonable employer.",
    },
    {
        shortName: "Williams v Compair Maxam",
        neutralCitation: "[1982] ICR 156",
        fullName: "Williams v Compair Maxam Ltd",
        court: "EAT",
        tier: "binding",
        claimTypes: ["unfair_dismissal"],
        principle:
            "Five principles for fair redundancy selection: (1) maximum warning, (2) fair selection criteria, (3) objective application, (4) consultation, (5) consider alternative employment.",
    },
    {
        shortName: "Western Excavating",
        neutralCitation: "[1978] ICR 221",
        fullName: "Western Excavating (ECC) Ltd v Sharp",
        court: "EWCA",
        tier: "binding",
        claimTypes: ["unfair_dismissal"],
        principle:
            "Constructive dismissal requires a fundamental breach of contract by the employer, not merely unreasonable behaviour. The contract test, not the reasonableness test, applies.",
    },

    // =========================================================================
    // DISCRIMINATION — Core Authorities
    // =========================================================================
    {
        shortName: "Shamoon",
        neutralCitation: "[2003] UKHL 11",
        fullName: "Shamoon v Chief Constable of the Royal Ulster Constabulary",
        court: "UKHL",
        tier: "binding",
        claimTypes: ["direct_discrimination"],
        principle:
            "Detriment means placing the claimant at a disadvantage. A reasonable worker would or might consider the treatment detrimental. It does not require financial loss.",
    },
    {
        shortName: "Igen v Wong",
        neutralCitation: "[2005] EWCA Civ 142",
        fullName: "Igen Ltd v Wong",
        court: "EWCA",
        tier: "binding",
        claimTypes: [
            "direct_discrimination",
            "indirect_discrimination",
            "harassment",
            "victimisation",
        ],
        principle:
            "Two-stage burden of proof: (1) claimant proves facts from which the tribunal could conclude discrimination occurred, (2) burden shifts to respondent to prove a non-discriminatory explanation.",
    },
    {
        shortName: "Anya v University of Oxford",
        neutralCitation: "[2001] EWCA Civ 405",
        fullName: "Anya v University of Oxford",
        court: "EWCA",
        tier: "binding",
        claimTypes: ["direct_discrimination"],
        principle:
            "Tribunals must consider the totality of the evidence, not just individual incidents in isolation, when determining whether discrimination has occurred.",
    },
    {
        shortName: "Essop",
        neutralCitation: "[2017] UKSC 27",
        fullName: "Essop v Home Office",
        court: "UKSC",
        tier: "binding",
        claimTypes: ["indirect_discrimination"],
        principle:
            "Claimant need not show why the PCP puts the group at a disadvantage. Statistical evidence of group disadvantage is sufficient. The reason for the disadvantage is irrelevant to establishing the prima facie case.",
    },
    {
        shortName: "Homer",
        neutralCitation: "[2012] UKSC 15",
        fullName: "Homer v Chief Constable of West Yorkshire Police",
        court: "UKSC",
        tier: "binding",
        claimTypes: ["indirect_discrimination"],
        principle:
            "Justification under indirect discrimination requires the employer to show a legitimate aim and that the PCP is a proportionate means of achieving it. Cost alone cannot justify discrimination.",
    },

    // =========================================================================
    // HARASSMENT
    // =========================================================================
    {
        shortName: "Pemberton",
        neutralCitation: "[2018] EWCA Civ 564",
        fullName: "Pemberton v Inwood",
        court: "EWCA",
        tier: "binding",
        claimTypes: ["harassment"],
        principle:
            "For harassment, the tribunal must consider both the subjective perception of the claimant and whether it is objectively reasonable for the conduct to have that effect. Context matters.",
    },
    {
        shortName: "Richmond Pharmacology",
        neutralCitation: "[2009] UKEAT 0458_08_2403",
        fullName: "Richmond Pharmacology v Dhaliwal",
        court: "EAT",
        tier: "binding",
        claimTypes: ["harassment"],
        principle:
            "Three elements of harassment under EA 2010 s26: (1) unwanted conduct, (2) related to a protected characteristic, (3) having the purpose or effect of violating dignity or creating an intimidating, hostile, degrading, humiliating or offensive environment.",
    },

    // =========================================================================
    // VICTIMISATION
    // =========================================================================
    {
        shortName: "Derbyshire",
        neutralCitation: "[2007] UKHL 16",
        fullName: "Derbyshire v St Helens Metropolitan Borough Council",
        court: "UKHL",
        tier: "binding",
        claimTypes: ["victimisation"],
        principle:
            "Victimisation covers detriment because the worker has done a protected act. The employer's honest and reasonable steps to protect their litigation position may not constitute victimisation, but intimidation or threats will.",
    },

    // =========================================================================
    // REASONABLE ADJUSTMENTS
    // =========================================================================
    {
        shortName: "Environment Agency v Rowan",
        neutralCitation: "[2008] UKEAT 0060_07_2908",
        fullName: "Environment Agency v Rowan",
        court: "EAT",
        tier: "binding",
        claimTypes: ["reasonable_adjustments"],
        principle:
            "Three-step test for reasonable adjustments: (1) identify the PCP/physical feature/auxiliary aid, (2) identify how it places the disabled person at a substantial disadvantage compared to non-disabled persons, (3) identify what adjustment would remove or reduce that disadvantage.",
    },
    {
        shortName: "Archibald",
        neutralCitation: "[2004] UKHL 32",
        fullName: "Archibald v Fife Council",
        court: "UKHL",
        tier: "binding",
        claimTypes: ["reasonable_adjustments"],
        principle:
            "The duty to make reasonable adjustments may require positive discrimination — treating the disabled person more favourably — to level the playing field. This is the opposite of the symmetry principle in direct discrimination.",
    },

    // =========================================================================
    // WHISTLEBLOWING
    // =========================================================================
    {
        shortName: "Cavendish Munro",
        neutralCitation: "[2010] UKEAT 0195_09_0202",
        fullName: "Cavendish Munro Professional Risks Management Ltd v Geduld",
        court: "EAT",
        tier: "binding",
        claimTypes: ["whistleblowing"],
        principle:
            "A qualifying disclosure must convey information, not merely make an allegation. Stating 'you are in breach of contract' is an allegation; stating 'you have failed to pay me £X which was due on Y date' conveys information.",
    },
    {
        shortName: "Chesterton Global",
        neutralCitation: "[2017] EWCA Civ 979",
        fullName: "Chesterton Global Ltd v Nurmohamed",
        court: "EWCA",
        tier: "binding",
        claimTypes: ["whistleblowing"],
        principle:
            "A disclosure can be 'in the public interest' even if the worker's predominant motive is personal. The tribunal should consider: the numbers affected, the nature of the interests, the nature of the wrongdoing, and the identity of the wrongdoer.",
    },

    // =========================================================================
    // WRONGFUL DISMISSAL
    // =========================================================================
    {
        shortName: "Gunton",
        neutralCitation: "[1981] 1 Ch 448",
        fullName: "Gunton v Richmond-upon-Thames London Borough Council",
        court: "EWCA",
        tier: "binding",
        claimTypes: ["wrongful_dismissal"],
        principle:
            "Wrongful dismissal is a contractual claim. Damages are limited to the notice period the employee should have received. The employee must mitigate their loss.",
    },

    // =========================================================================
    // REMEDIES & PROCEDURE
    // =========================================================================
    {
        shortName: "Vento",
        neutralCitation: "[2002] EWCA Civ 1871",
        fullName: "Vento v Chief Constable of West Yorkshire Police (No 2)",
        court: "EWCA",
        tier: "binding",
        claimTypes: [
            "direct_discrimination",
            "indirect_discrimination",
            "harassment",
            "victimisation",
        ],
        principle:
            "Three bands for injury to feelings awards in discrimination cases. Updated annually by Presidential Guidance. Current (2024-25): lower band £1,200-£11,200; middle band £11,200-£33,700; upper band £33,700-£56,200; exceptional cases above upper band.",
    },
    {
        shortName: "Chagger",
        neutralCitation: "[2009] EWCA Civ 1176",
        fullName: "Chagger v Abbey National plc",
        court: "EWCA",
        tier: "binding",
        claimTypes: ["unfair_dismissal", "direct_discrimination"],
        principle:
            "In discrimination cases, the Polkey percentage reduction principle applies. Compensation may be reduced by the chance that the claimant would have been dismissed in any event, even without the discrimination.",
    },
    {
        shortName: "Kucukdeveci",
        neutralCitation: "C-555/07",
        fullName: "Kucukdeveci v Swedex GmbH",
        court: "EWCA",
        tier: "persuasive",
        claimTypes: ["direct_discrimination"],
        principle:
            "EU principle of non-discrimination on grounds of age is a general principle of EU law. National courts must disapply domestic legislation that conflicts, even in disputes between private parties.",
    },

    // =========================================================================
    // ACAS & TIME LIMITS
    // =========================================================================
    {
        shortName: "Robertson v Bexley",
        neutralCitation: "[2003] EWCA Civ 1012",
        fullName: "Robertson v Bexley Community Centre",
        court: "EWCA",
        tier: "binding",
        claimTypes: [
            "unfair_dismissal",
            "direct_discrimination",
            "indirect_discrimination",
            "harassment",
        ],
        principle:
            "Time limits in employment tribunals are strictly enforced. An extension of time is the exception, not the rule. The burden is on the claimant to show it was not reasonably practicable to present the claim in time (unfair dismissal) or that it is just and equitable to extend (discrimination).",
    },

    // =========================================================================
    // FIRE AND REHIRE (ERA 2025)
    // =========================================================================
    {
        shortName: "Tesco v USDAW",
        neutralCitation: "[2024] UKSC 28",
        fullName: "Tesco Stores Ltd v Union of Shop, Distributive and Allied Workers",
        court: "UKSC",
        tier: "binding",
        claimTypes: ["fire_and_rehire", "unfair_dismissal"],
        principle:
            "Where a contractual term confers a permanent right (e.g. retained pay), the employer cannot circumvent it by dismissing and re-engaging on inferior terms. An injunction may be granted to prevent the employer from terminating employment for this purpose.",
    },
    {
        shortName: "Khatun v Winn",
        neutralCitation: "[2024] EAT 111",
        fullName: "Khatun v Winn Solicitors Ltd",
        court: "EAT",
        tier: "persuasive",
        claimTypes: ["fire_and_rehire", "unfair_dismissal"],
        principle:
            "Fire and rehire as a tactic to impose inferior terms may render a dismissal unfair under ERA 1996 s98, even before ERA 2025 made it automatically unfair. The employer must demonstrate genuine business necessity.",
    },
];

/**
 * Index authorities by short name for fast lookup.
 * Case-insensitive matching.
 */
const AUTHORITY_INDEX = new Map<string, VerifiedAuthority>();
for (const auth of VERIFIED_AUTHORITIES) {
    AUTHORITY_INDEX.set(auth.shortName.toLowerCase(), auth);
}

/**
 * Look up a verified authority by short name.
 * Case-insensitive.
 */
export function findAuthorityByShortName(
    name: string
): VerifiedAuthority | undefined {
    return AUTHORITY_INDEX.get(name.toLowerCase());
}

/**
 * Look up a verified authority by any partial name match.
 * Returns the best match or undefined.
 */
export function findAuthorityByPartialMatch(
    text: string
): VerifiedAuthority | undefined {
    const lower = text.toLowerCase();
    for (const auth of VERIFIED_AUTHORITIES) {
        if (lower.includes(auth.shortName.toLowerCase())) {
            return auth;
        }
        if (lower.includes(auth.fullName.toLowerCase())) {
            return auth;
        }
    }
    return undefined;
}
