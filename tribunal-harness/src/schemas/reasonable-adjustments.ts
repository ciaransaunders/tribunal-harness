import type { ClaimSchema } from "./types";

export const reasonableAdjustmentsSchema: ClaimSchema = {
    id: "reasonable_adjustments",
    label: "Failure to Make Reasonable Adjustments",
    statute: "EA 2010 ss20-21",
    description: "An employer's failure to make reasonable adjustments for a disabled employee where a PCP, physical feature, or lack of auxiliary aid puts them at a substantial disadvantage.",
    legalTest: [
        "Is the claimant a disabled person within the meaning of EA 2010 s6?",
        "Did a PCP / physical feature / lack of auxiliary aid put the claimant at a substantial disadvantage compared to non-disabled persons?",
        "Did the employer know, or ought they reasonably to have known, about the disability and the disadvantage?",
        "Were there steps that were reasonable for the employer to take to avoid the disadvantage?",
        "Did the employer fail to take those steps?",
    ],
    keyAuthorities: [
        "Environment Agency v Rowan [2008] ICR 218",
        "Archibald v Fife Council [2004] ICR 954",
        "Smith v Churchills Stairlifts Plc [2006] ICR 524",
    ],
    fields: [
        { id: "disability", label: "Disability / Condition", type: "text", required: true },
        {
            id: "employer_knowledge", label: "Did the Employer Know About Your Disability?", type: "select", required: true,
            options: [
                { value: "actual", label: "Yes — informed employer directly" },
                { value: "constructive", label: "Should have known — obvious signs / medical evidence" },
                { value: "denied", label: "Employer denies knowledge" },
            ],
        },
        {
            id: "disadvantage_type", label: "Source of Disadvantage", type: "select", required: true,
            options: [
                { value: "pcp", label: "Provision, criterion or practice" },
                { value: "physical", label: "Physical feature of premises" },
                { value: "auxiliary", label: "Lack of auxiliary aid" },
            ],
        },
        { id: "disadvantage_details", label: "Describe the Substantial Disadvantage", type: "textarea", required: true },
        { id: "adjustments_requested", label: "Adjustments Requested", type: "textarea", required: true },
        { id: "adjustments_provided", label: "Adjustments Actually Provided", type: "textarea", required: false },
        { id: "date_of_last_act", label: "Date of Last Failure to Adjust", type: "date", required: true },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};

export const wrongfulDismissalSchema: ClaimSchema = {
    id: "wrongful_dismissal",
    label: "Wrongful Dismissal",
    statute: "Common Law",
    description: "A breach of contract claim where the employer dismissed without giving proper contractual or statutory notice.",
    legalTest: [
        "Was there a contract of employment?",
        "Was the employee dismissed?",
        "Was the dismissal in breach of the contract (e.g., insufficient notice)?",
        "Did the employee's conduct justify summary dismissal (gross misconduct defence)?",
    ],
    keyAuthorities: [
        "Geys v Société Générale [2013] 1 AC 523",
        "Gunton v Richmond-upon-Thames LBC [1981] Ch 448",
        "Laws v London Chronicle [1959] 1 WLR 698",
    ],
    fields: [
        {
            id: "contractual_notice", label: "Contractual Notice Period", type: "text", required: true,
            helpText: "e.g., '3 months', '1 week per year of service'",
        },
        { id: "notice_given", label: "Notice Actually Given", type: "text", required: true },
        { id: "summary_dismissal", label: "Was It Summary Dismissal (No Notice)?", type: "boolean", required: true },
        { id: "gross_misconduct_alleged", label: "Gross Misconduct Alleged?", type: "boolean", required: false },
        { id: "effective_date_of_termination", label: "Date of Dismissal", type: "date", required: true },
        { id: "pay_in_lieu", label: "Was Payment in Lieu of Notice (PILON) Made?", type: "boolean", required: false },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};
