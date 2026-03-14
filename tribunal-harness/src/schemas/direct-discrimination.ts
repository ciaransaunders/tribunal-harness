import type { ClaimSchema } from "./types";

export const directDiscriminationSchema: ClaimSchema = {
    id: "direct_discrimination",
    label: "Direct Discrimination",
    statute: "EA 2010 s13",
    description: "Less favourable treatment because of a protected characteristic.",
    legalTest: [
        "Does the claimant have/is perceived to have/is associated with a protected characteristic?",
        "Was the claimant treated less favourably than an actual or hypothetical comparator?",
        "Was the less favourable treatment because of the protected characteristic?",
    ],
    keyAuthorities: [
        "Igen Ltd v Wong [2005] ICR 931",
        "Madarassy v Nomura [2007] ICR 867",
        "Nagarajan v London Regional Transport [2000] 1 AC 501",
        "Shamoon v Chief Constable of the RUC [2003] ICR 337",
    ],
    fields: [
        {
            id: "protected_characteristic", label: "Protected Characteristic", type: "select", required: true,
            options: [
                { value: "age", label: "Age" }, { value: "disability", label: "Disability" },
                { value: "gender_reassignment", label: "Gender reassignment" }, { value: "race", label: "Race" },
                { value: "religion", label: "Religion or belief" }, { value: "sex", label: "Sex" },
                { value: "sexual_orientation", label: "Sexual orientation" },
                { value: "pregnancy", label: "Pregnancy and maternity" },
                { value: "marriage", label: "Marriage and civil partnership" },
            ],
        },
        {
            id: "comparator_type", label: "Comparator", type: "select", required: true,
            options: [
                { value: "actual", label: "Actual comparator (named individual)" },
                { value: "hypothetical", label: "Hypothetical comparator" },
            ],
        },
        { id: "comparator_details", label: "Comparator Details", type: "textarea", required: false },
        { id: "less_favourable_treatment", label: "Less Favourable Treatment", type: "textarea", required: true },
        { id: "date_of_last_act", label: "Date of Last Act", type: "date", required: true },
        {
            id: "continuing_act", label: "Continuing Act / Course of Conduct", type: "boolean", required: false,
            helpText: "Was this part of a continuing course of conduct (EA 2010 s123(3)(a))?",
        },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};

export const indirectDiscriminationSchema: ClaimSchema = {
    id: "indirect_discrimination",
    label: "Indirect Discrimination",
    statute: "EA 2010 s19",
    description: "A provision, criterion or practice (PCP) that puts persons sharing a protected characteristic at a particular disadvantage.",
    legalTest: [
        "Did the employer apply a PCP?",
        "Does the PCP put persons sharing the claimant's protected characteristic at a particular disadvantage compared to those who do not share it?",
        "Does the PCP put the claimant at that disadvantage?",
        "Can the employer show the PCP is a proportionate means of achieving a legitimate aim?",
    ],
    keyAuthorities: [
        "Essop v Home Office [2017] UKSC 27",
        "Homer v Chief Constable of West Yorkshire [2012] ICR 704",
        "Bilka-Kaufhaus v Weber von Hartz [1987] ICR 110",
    ],
    fields: [
        {
            id: "protected_characteristic", label: "Protected Characteristic", type: "select", required: true,
            options: [
                { value: "age", label: "Age" }, { value: "disability", label: "Disability" },
                { value: "gender_reassignment", label: "Gender reassignment" }, { value: "race", label: "Race" },
                { value: "religion", label: "Religion or belief" }, { value: "sex", label: "Sex" },
                { value: "sexual_orientation", label: "Sexual orientation" },
                { value: "marriage", label: "Marriage and civil partnership" },
            ],
        },
        { id: "pcp", label: "Provision, Criterion or Practice (PCP)", type: "textarea", required: true },
        { id: "group_disadvantage", label: "How Does the PCP Disadvantage the Group?", type: "textarea", required: true },
        { id: "individual_disadvantage", label: "How Are You Personally Disadvantaged?", type: "textarea", required: true },
        { id: "date_of_last_act", label: "Date of Last Act", type: "date", required: true },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};

export const victimisationSchema: ClaimSchema = {
    id: "victimisation",
    label: "Victimisation",
    statute: "EA 2010 s27",
    description: "Subjecting a person to a detriment because they have done, or may do, a protected act.",
    legalTest: [
        "Did the claimant do a protected act (or did the employer believe they had/might)?",
        "Was the claimant subjected to a detriment?",
        "Was the detriment because of the protected act?",
    ],
    keyAuthorities: [
        "Derbyshire v St Helens Metropolitan Borough Council [2007] ICR 841",
        "Woodhouse v West North West Homes Leeds Ltd [2013] IRLR 773",
    ],
    fields: [
        {
            id: "protected_act", label: "Protected Act", type: "select", required: true,
            options: [
                { value: "proceedings", label: "Bringing proceedings under the EA 2010" },
                { value: "evidence", label: "Giving evidence or information in connection with proceedings" },
                { value: "allegation", label: "Making an allegation of discrimination" },
                { value: "anything_else", label: "Doing anything else for purposes of the EA 2010" },
            ],
        },
        { id: "protected_act_details", label: "Details of Protected Act", type: "textarea", required: true },
        { id: "detriment", label: "Detriment Suffered", type: "textarea", required: true },
        { id: "date_of_detriment", label: "Date of Detriment", type: "date", required: true },
        { id: "narrative", label: "Full Account", type: "textarea", required: false },
    ],
};

export default { directDiscriminationSchema, indirectDiscriminationSchema, victimisationSchema };
