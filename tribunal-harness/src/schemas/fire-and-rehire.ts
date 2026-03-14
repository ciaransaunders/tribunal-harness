import type { ClaimSchema } from "./types";
import { ERA_2025 } from "@/lib/constants";

export const fireAndRehireSchema: ClaimSchema = {
    id: "fire_and_rehire",
    label: "Fire and Rehire",
    statute: "ERA 2025",
    description: "Automatically unfair dismissal where an employer dismisses an employee to impose changes to restricted contractual terms.",
    legalTest: [
        "Was the employee dismissed?",
        "Was the purpose of the dismissal to impose a variation to a restricted term?",
        "Is the restricted term one of: pay, hours, pensions, holidays, or shift patterns?",
        "Does the employer claim severe financial distress?",
        "Were there no reasonable alternatives to dismissal?",
    ],
    keyAuthorities: [
        "This is a new statutory provision — case law will develop from 2027",
    ],
    era2025Changes: [
        "Entirely new claim type created by ERA 2025 (from January 2027)",
        "Dismissals to impose restricted variations are automatically unfair",
        "Limited defence: employer must prove severe financial distress AND no alternative",
    ],
    fields: [
        {
            id: "effective_date_of_termination", label: "Date of Dismissal", type: "date", required: true,
            era2025: {
                isNew: true, commencementDate: ERA_2025.FIRE_AND_REHIRE_AUTO_UNFAIR, status: "upcoming",
                note: "This claim type is only available for dismissals on or after 1 January 2027.",
            },
        },
        {
            id: "restricted_variation", label: "Which Restricted Term Was Changed?", type: "select", required: true,
            options: [
                { value: "pay", label: "Pay" }, { value: "hours", label: "Hours" },
                { value: "pensions", label: "Pensions" }, { value: "holidays", label: "Holidays" },
                { value: "shift_patterns", label: "Shift patterns" }, { value: "multiple", label: "Multiple terms" },
            ],
        },
        { id: "offered_new_contract", label: "Were You Offered New Terms?", type: "boolean", required: true },
        {
            id: "financial_distress_defence", label: "Employer Claims Financial Distress?", type: "boolean", required: false,
            helpText: "The employer must demonstrate severe financial distress to rely on this defence.",
        },
        { id: "no_alternative_defence", label: "Employer Claims No Alternative?", type: "boolean", required: false },
        {
            id: "fire_and_replace", label: "Replaced with Contractor/Agency Worker?", type: "boolean", required: false,
            helpText: "Were you replaced with a contractor or agency worker doing the same role?",
        },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};

export const zeroHoursRightsSchema: ClaimSchema = {
    id: "zero_hours_rights",
    label: "Zero-Hours Contract Rights",
    statute: "ERA 2025",
    description: "New rights for zero-hours and low-hours workers to guaranteed hours, shift notice, and cancellation payment.",
    legalTest: [
        "Is the worker on a zero-hours or low-hours contract?",
        "Has the reference period of 12 weeks been met?",
        "Was the worker denied guaranteed hours reflecting regular hours worked?",
        "Was reasonable notice of shifts provided?",
        "Was compensation paid for short-notice cancellation?",
    ],
    keyAuthorities: [
        "This is a new statutory provision — case law will develop from 2027",
    ],
    era2025Changes: [
        "Entirely new set of rights created by ERA 2025 (from 2027)",
        "Rights extend to agency workers",
    ],
    fields: [
        {
            id: "contract_type", label: "Contract Type", type: "select", required: true,
            options: [
                { value: "zero_hours", label: "Zero-hours contract" },
                { value: "low_hours", label: "Low-hours contract" },
                { value: "agency", label: "Agency worker" },
            ],
            era2025: {
                isNew: true, commencementDate: ERA_2025.ZERO_HOURS_PROTECTIONS ?? "TBC (SI awaited)", status: "awaiting_si",
                note: "Exact commencement date to be confirmed by Statutory Instrument.",
            },
        },
        {
            id: "regular_hours", label: "Regular Hours Worked (per week)", type: "number", required: true,
            helpText: "Average hours worked over a 12-week reference period.",
        },
        { id: "guaranteed_hours_offered", label: "Were Guaranteed Hours Offered?", type: "boolean", required: true },
        { id: "shift_notice", label: "Was Reasonable Shift Notice Given?", type: "boolean", required: true },
        {
            id: "cancellation_payment", label: "Was Cancellation Payment Made?", type: "boolean", required: false,
            helpText: "Payment for shifts cancelled at short notice.",
        },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};
