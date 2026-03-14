export const LEGAL_DATA_GRAPH = {
    statutes: [
        {
            id: "ea2010", name: "Equality Act 2010", sections: [
                { id: "ea2010_s13", ref: "s.13", title: "Direct discrimination", summary: "A person discriminates against another if, because of a protected characteristic, A treats B less favourably than A treats or would treat others." },
                { id: "ea2010_s15", ref: "s.15", title: "Discrimination arising from disability", summary: "A person discriminates against a disabled person if A treats B unfavourably because of something arising in consequence of B's disability, and A cannot show that the treatment is a proportionate means of achieving a legitimate aim." },
                { id: "ea2010_s19", ref: "s.19", title: "Indirect discrimination", summary: "A person discriminates against another if A applies a provision, criterion or practice which is discriminatory in relation to a relevant protected characteristic of B's." },
                { id: "ea2010_s20", ref: "s.20", title: "Duty to make adjustments", summary: "Where a provision, criterion or practice of A's puts a disabled person at a substantial disadvantage, A must take reasonable steps to avoid the disadvantage." },
                { id: "ea2010_s26", ref: "s.26", title: "Harassment", summary: "A person harasses another if A engages in unwanted conduct related to a relevant protected characteristic, and the conduct has the purpose or effect of violating B's dignity or creating an intimidating, hostile, degrading, humiliating or offensive environment." },
                { id: "ea2010_s27", ref: "s.27", title: "Victimisation", summary: "A person victimises another if A subjects B to a detriment because B does a protected act." },
                { id: "ea2010_s123", ref: "s.123", title: "Time limits", summary: "Proceedings must be brought before the end of the period of 3 months starting with the date of the act to which the complaint relates." },
                { id: "ea2010_s136", ref: "s.136", title: "Burden of proof", summary: "If there are facts from which the court could decide that A contravened the provision, the court must hold that the contravention occurred unless A shows it did not." },
            ]
        },
        {
            id: "era1996", name: "Employment Rights Act 1996", sections: [
                { id: "era1996_s94", ref: "s.94", title: "Right not to be unfairly dismissed", summary: "An employee has the right not to be unfairly dismissed by his employer." },
                { id: "era1996_s98", ref: "s.98", title: "General fairness", summary: "In determining whether the dismissal is fair or unfair, it is for the employer to show the reason for dismissal and that it is a potentially fair reason. The tribunal must then consider whether the employer acted reasonably." },
                { id: "era1996_s111", ref: "s.111", title: "Complaint to tribunal", summary: "A complaint may be presented before the end of the period of three months beginning with the effective date of termination." },
                { id: "era1996_s111a", ref: "s.111A", title: "Protected conversations", summary: "Evidence of pre-termination negotiations is inadmissible in unfair dismissal proceedings, subject to exceptions for improper behaviour." },
                { id: "era1996_s43b", ref: "s.43B", title: "Protected disclosures", summary: "A qualifying disclosure is any disclosure of information which, in the reasonable belief of the worker, is made in the public interest and tends to show a relevant failure." },
            ]
        },
        {
            id: "etrp2013", name: "ET Rules of Procedure 2013", sections: [
                { id: "etrp_r21", ref: "Rule 21", title: "Default judgments", summary: "Where a response has not been presented within the time limit, the Tribunal may issue a judgment." },
                { id: "etrp_r29", ref: "Rule 29", title: "Case management orders", summary: "The Tribunal may make a case management order at any stage of the proceedings." },
                { id: "etrp_r31", ref: "Rule 31", title: "Disclosure and inspection", summary: "The Tribunal may order any person to disclose documents or information to a party." },
                { id: "etrp_r37", ref: "Rule 37", title: "Striking out", summary: "A claim or response may be struck out on grounds including that it is scandalous, vexatious or has no reasonable prospect of success." },
                { id: "etrp_r39", ref: "Rule 39", title: "Deposit orders", summary: "Where a specific allegation has little reasonable prospect of success, a deposit order of up to £1,000 may be made." },
                { id: "etrp_r76", ref: "Rule 76", title: "Costs orders", summary: "A costs order may be made where a party has acted vexatiously, abusively, disruptively or otherwise unreasonably, or the claim or response had no reasonable prospect of success." },
            ]
        },
    ],
    judgments: [
        { id: "igen_v_wong", citation: "Igen Ltd v Wong [2005] ICR 931 (CA)", principle: "Burden of proof in discrimination: claimant must establish a prima facie case, then burden shifts to respondent.", court: "Court of Appeal" },
        { id: "bma_v_chhabra", citation: "Chhabra v West London Mental Health NHS Trust [2013] UKSC 80", principle: "Disciplinary procedures must be conducted fairly; departure from contractual procedures may render dismissal unfair.", court: "Supreme Court" },
        { id: "polkey", citation: "Polkey v AE Dayton Services Ltd [1988] AC 344 (HL)", principle: "Procedural unfairness in dismissal cannot be cured by arguing the result would have been the same; but may affect compensation.", court: "House of Lords" },
        { id: "burchell", citation: "British Home Stores Ltd v Burchell [1980] ICR 303 (EAT)", principle: "Three-stage test for misconduct dismissals: genuine belief, reasonable grounds, reasonable investigation.", court: "EAT" },
        { id: "iceland_frozen", citation: "Iceland Frozen Foods Ltd v Jones [1983] ICR 17 (EAT)", principle: "Range of reasonable responses test: tribunal must not substitute its own view for that of the employer.", court: "EAT" },
        { id: "meek_v_birmingham", citation: "Meek v City of Birmingham District Council [1987] IRLR 250 (CA)", principle: "Tribunal reasons must contain sufficient findings of fact and reasoning to enable the parties to understand why they won or lost.", court: "Court of Appeal" },
        { id: "yeboah", citation: "Yeboah v Crofton [2002] IRLR 634 (CA)", principle: "Perversity appeals face a high threshold; the EAT should not interfere with findings of fact unless no reasonable tribunal could have reached that conclusion.", court: "Court of Appeal" },
        { id: "environment_agency", citation: "Environment Agency v Rowan [2008] ICR 218 (EAT)", principle: "For reasonable adjustments: identify the PCP, the disadvantage, and the step that would have been reasonable.", court: "EAT" },
        { id: "shamoon", citation: "Shamoon v Chief Constable of the RUC [2003] ICR 337 (HL)", principle: "Detriment means putting the claimant at a disadvantage; a reasonable worker would or might take the view that they had been disadvantaged.", court: "House of Lords" },
        { id: "jhuti", citation: "Royal Mail Group v Jhuti [2019] UKSC 55", principle: "In whistleblowing dismissal cases, the tribunal can look behind the decision-maker to the real reason for dismissal.", court: "Supreme Court" },
    ],
};

export const TASK_TEMPLATES = [
    { id: "t1", label: "Isolate arguments for Rule 3(10) appeal", leverage: 95, estimatedMins: 90, category: "appeal", description: "Identify and draft the core legal errors for oral renewal hearing. Highest-leverage activity if appealing an ET decision." },
    { id: "t2", label: "Prepare remedy schedule", leverage: 88, estimatedMins: 60, category: "hearing", description: "Calculate and document all heads of loss including injury to feelings (Vento bands), pension loss, and future loss." },
    { id: "t3", label: "Draft skeleton argument sections", leverage: 85, estimatedMins: 120, category: "hearing", description: "Write structured legal submissions for the final hearing, linking facts to legal tests." },
    { id: "t4", label: "Review opponent's skeleton argument", leverage: 80, estimatedMins: 60, category: "hearing", description: "Analyse respondent's skeleton for factual errors, weak authorities, and concessions." },
    { id: "t5", label: "Draft witness statement sections", leverage: 78, estimatedMins: 120, category: "evidence", description: "Write chronological factual account with document references for witness statement." },
    { id: "t6", label: "Review disclosure documents", leverage: 65, estimatedMins: 45, category: "evidence", description: "Review documents disclosed by respondent, flag relevant items, note gaps in disclosure." },
    { id: "t7", label: "Update chronology and cast list", leverage: 55, estimatedMins: 30, category: "admin", description: "Maintain the case chronology and list of key individuals. Foundation document for skeleton argument." },
    { id: "t8", label: "Respond to routine correspondence", leverage: 30, estimatedMins: 30, category: "admin", description: "Reply to non-urgent letters from respondent's solicitors or tribunal." },
    { id: "t9", label: "Organise hearing bundle additions", leverage: 25, estimatedMins: 20, category: "admin", description: "Identify and request additions to the agreed hearing bundle." },
    { id: "t10", label: "File management and indexing", leverage: 15, estimatedMins: 15, category: "admin", description: "Organise digital files, update case index, ensure naming conventions." },
];

export const LEGAL_TEST_SCHEMAS = {
    unfair_dismissal: {
        label: "Unfair Dismissal",
        fields: [
            { id: "employment_start", type: "date", label: "Employment start date", required: true },
            { id: "dismissal_date", type: "date", label: "Date of dismissal", required: true },
            { id: "dismissal_type", type: "select", label: "Type of dismissal", required: true, options: ["Summary dismissal", "Notice given", "Constructive dismissal", "Non-renewal of fixed term"] },
            { id: "reason_given", type: "text_short", label: "Reason given by employer", required: true },
            { id: "two_years_service", type: "boolean", label: "2+ years continuous service?", required: true },
            { id: "procedure_followed", type: "select", label: "Was ACAS Code followed?", required: true, options: ["Fully followed", "Partially followed", "Not followed", "Unknown"] },
            { id: "appeal_offered", type: "boolean", label: "Was right of appeal offered?", required: true },
            { id: "grievance_raised", type: "boolean", label: "Was a grievance raised before dismissal?", required: false },
            { id: "acas_contacted", type: "boolean", label: "Has ACAS Early Conciliation been started?", required: true },
        ],
    },
    discrimination: {
        label: "Discrimination",
        fields: [
            { id: "protected_characteristic", type: "select", label: "Protected characteristic", required: true, options: ["Age", "Disability", "Gender reassignment", "Marriage/civil partnership", "Pregnancy/maternity", "Race", "Religion/belief", "Sex", "Sexual orientation"] },
            { id: "discrimination_type", type: "select", label: "Type of discrimination", required: true, options: ["Direct (s.13)", "Indirect (s.19)", "Arising from disability (s.15)", "Failure to adjust (s.20)", "Harassment (s.26)", "Victimisation (s.27)"] },
            { id: "last_act_date", type: "date", label: "Date of last discriminatory act", required: true },
            { id: "comparator", type: "text_short", label: "Comparator (actual or hypothetical)", required: false },
            { id: "continuing_act", type: "boolean", label: "Is this a continuing act/course of conduct?", required: true },
            { id: "employer_justification", type: "text_short", label: "Has the employer offered justification?", required: false },
        ],
    },
    whistleblowing: {
        label: "Whistleblowing Detriment",
        fields: [
            { id: "disclosure_date", type: "date", label: "Date of protected disclosure", required: true },
            { id: "disclosure_to", type: "select", label: "Disclosure made to", required: true, options: ["Employer", "Legal adviser", "Prescribed person/body", "Other"] },
            { id: "failure_type", type: "select", label: "Type of failure disclosed", required: true, options: ["Criminal offence", "Breach of legal obligation", "Miscarriage of justice", "Health & safety danger", "Environmental damage", "Deliberate concealment"] },
            { id: "public_interest", type: "boolean", label: "Made in the public interest?", required: true },
            { id: "detriment_type", type: "text_short", label: "What detriment was suffered?", required: true },
            { id: "causal_link", type: "text_short", label: "Evidence linking disclosure to detriment", required: true },
        ],
    },
    harassment: {
        label: "Harassment (EA 2010 s26)",
        fields: [
            { id: "protected_characteristic", type: "select", label: "Related protected characteristic", required: true, options: ["Age", "Disability", "Gender reassignment", "Race", "Religion/belief", "Sex", "Sexual orientation"] },
            { id: "unwanted_conduct", type: "text_short", label: "Describe the unwanted conduct", required: true },
            { id: "last_incident_date", type: "date", label: "Date of last incident", required: true },
            { id: "purpose_or_effect", type: "select", label: "Was the conduct purposeful or by effect?", required: true, options: ["Purpose (intentional)", "Effect (unintentional but impactful)", "Both"] },
            { id: "dignity_violated", type: "boolean", label: "Did it violate your dignity?", required: true },
            { id: "hostile_environment", type: "boolean", label: "Did it create a hostile/degrading environment?", required: true },
            { id: "reported_to_employer", type: "boolean", label: "Was the conduct reported to your employer?", required: false },
            { id: "employer_response", type: "text_short", label: "What was the employer's response (if reported)?", required: false },
        ],
    },
    victimisation: {
        label: "Victimisation (EA 2010 s27)",
        fields: [
            { id: "protected_act", type: "select", label: "What protected act was done?", required: true, options: ["Brought ET proceedings", "Gave evidence in ET proceedings", "Did anything under the EA 2010", "Made an allegation of contravention", "Other"] },
            { id: "protected_act_date", type: "date", label: "Date of protected act", required: true },
            { id: "detriment_suffered", type: "text_short", label: "What detriment was suffered?", required: true },
            { id: "detriment_date", type: "date", label: "Date of detriment", required: true },
            { id: "causal_link", type: "text_short", label: "Evidence linking the protected act to the detriment", required: true },
            { id: "employer_knew", type: "boolean", label: "Did the employer know about the protected act?", required: true },
            { id: "continuing_act", type: "boolean", label: "Is this a continuing act/course of conduct?", required: true },
        ],
    },
    reasonable_adjustments: {
        label: "Failure to Make Reasonable Adjustments (EA 2010 ss20-21)",
        fields: [
            { id: "disability_status", type: "select", label: "Is your disability acknowledged?", required: true, options: ["Accepted by employer", "Disputed by employer", "Not yet disclosed"] },
            { id: "pcp_identified", type: "text_short", label: "What provision, criterion or practice (PCP) caused disadvantage?", required: true },
            { id: "substantial_disadvantage", type: "text_short", label: "What substantial disadvantage did it cause?", required: true },
            { id: "adjustments_requested", type: "text_short", label: "What adjustments were requested?", required: true },
            { id: "adjustments_made", type: "boolean", label: "Were any adjustments made?", required: true },
            { id: "employer_knew_disability", type: "boolean", label: "Did the employer know (or ought to have known) about the disability?", required: true },
            { id: "request_date", type: "date", label: "Date adjustments were first requested", required: true },
            { id: "last_failure_date", type: "date", label: "Date of last failure to adjust", required: true },
        ],
    },
    wrongful_dismissal: {
        label: "Wrongful Dismissal (Common Law)",
        fields: [
            { id: "employment_start", type: "date", label: "Employment start date", required: true },
            { id: "dismissal_date", type: "date", label: "Date of dismissal", required: true },
            { id: "notice_period_contractual", type: "text_short", label: "Contractual notice period (e.g. '3 months')", required: true },
            { id: "notice_given", type: "text_short", label: "Notice actually given (e.g. 'none', '1 week')", required: true },
            { id: "summary_dismissal", type: "boolean", label: "Was it a summary dismissal (no notice)?", required: true },
            { id: "gross_misconduct_alleged", type: "boolean", label: "Did the employer allege gross misconduct?", required: true },
            { id: "pay_in_lieu", type: "boolean", label: "Was pay in lieu of notice offered?", required: false },
            { id: "restrictive_covenants", type: "boolean", label: "Are there restrictive covenants in the contract?", required: false },
        ],
    },
};
