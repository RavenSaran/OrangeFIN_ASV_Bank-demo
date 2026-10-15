# OrangeFIN ASV: analysis and plan for the four banking use cases

Prepared as the system analysis for the infographic "Top 4 Banking Use Cases for ASV (Offline Signature Verification), Malaysian Banking" (received 14 Oct 2026). It covers what the source says, how much of it the system already does, what is missing, the decisions taken, and the delivery plan. Status of each phase is tracked at the end.

## 1. What the source says

All four use cases are physical, handwritten instructions where the bank already holds a verified reference signature. Each has the same five steps: complete the form, an authorised signatory signs, the document is scanned and the signature extracted, ASV compares it with the reference signature, and on a match the action proceeds.

| # | Use case | Example | Key information captured | Why ASV is mandatory |
|---|---|---|---|---|
| 1 | Physical branch transactions and Letter of Instruction (LOI) | Company letter to change its address, with joint signatures and the company chop | Company account, request details, request purpose, multiple authorised signatories | Joint signatures (for example any 2 of 3) for major changes. Verification of the company rubber stamp (chop). High-value risk fallback |
| 2 | Corporate account opening and mandate updates | Physical signature card with the corporate stamp | Account details, resolution date, signatory details, signing limits | Direct control of company funds and structure. KYC/KYB compliance. An irreversible legal set-up |
| 3 | Trade finance application forms | Letter of credit, guarantee | LC details, beneficiary, facility limits, counterparty risk | Significant credit exposure to third parties. Legally binding guarantees. Prevents multi-signatory fraud |
| 4 | High-value over-the-counter telegraphic transfer (TT) | Remitter hands in forms and cash | Remittance details, currency, country, daily limit exceeded | Enhanced AML/CFT checks on large sums. High fraud risk in manual processes. Joint verification of authority |

### Points in the source that need a decision

1. Use cases 2 and 3 say "Complete upliftment form". That wording belongs to fixed deposits and looks like a copy-paste slip. Treated as "complete the application form".
2. The step numbers in use cases 2 and 3 skip step 4 (1, 2, 3, 5). Treated as the same five-step backbone.
3. Use case 2 says ASV compares with a "reference signature", but a brand-new signatory has none. Decision in section 4.
4. The "company chop" is named as a verification target in use case 1 but has no defined pass or fail rule. Decision in section 4.
5. "Daily limit exceeded" (use case 4) does not say whose limit. Treated as the customer account's daily over-the-counter limit.

## 2. What the system already does

The system has three modules from the earlier brief: Corporate payment, Fixed deposit and TT and remittance. It already provides the common backbone: register, ASV on the scan against specimens, mandate check (any n of m, tiers by amount), analyst review with callback, approval by level with four-eyes, audit trail, Settings for every threshold, and real signatures.

## 3. Gap analysis

| Use case | Closest today | Covers | Missing |
|---|---|---|---|
| 1. Branch transactions and LOI | Corporate payment | Mandate check, approval, high-value review | A letter-of-instruction case with request types (not only payments), request purpose, a rule that major changes need the full mandate, **company chop check**, optional amount |
| 2. Account opening and mandate updates | None | Backbone only | Whole module: request types, resolution date check, signatory details, signing limits, KYC/KYB checklist, minimum approval level, chop check |
| 3. Trade finance | None | Backbone, beneficiary screening pattern from TT | Whole module: instrument types, LC details, beneficiary, facility limit and headroom, counterparty risk rating, full-mandate rule, chop check |
| 4. High-value OTC TT | TT and remittance | Remittance details, currency, country, screening, cut-off, BIC | **Daily limit exceeded** check, cash tendered with a reporting note, high-risk country rule, over-the-counter wording |

Cross-cutting gaps: no company chop detection in the ASV engine; the number of signatures and the minimum approval level can only depend on the amount, not on the type of request; an analyst review can only be triggered by amount, not by a check; the Process page does not show the "example, key information, why ASV is mandatory" content from the source.

## 4. Decisions

| # | Decision | Reason |
|---|---|---|
| D1 | Keep the three existing modules and add three: **Branch transactions and LOI**, **Account opening and mandate updates**, **Trade finance**. Use case 4 is delivered by extending TT and remittance. The system then has six modules | The earlier brief is not withdrawn. The new use cases are distinct enough to deserve their own forms, checks and process pages |
| D2 | **Company chop check** is a new ASV capability: the engine looks for red stamp ink forming a compact mark of the right size on the scan. A module that requires it flags the case when no chop is found. It is on for the three new modules and off for the others, with one Settings switch | The source names the chop as a verification target. The check detects presence, not authenticity, and the screen says so |
| D3 | The signatures needed can depend on the **type of request**. A routine request follows the normal rule for the amount. A major change needs the account's full requirement | "Joint signatures (any 2 of 3) for major changes" |
| D4 | A request type or a failed check can set a **minimum approval level** and force an **analyst review** before approval. Account opening, mandate changes and trade finance never go below Level 2 | "Irreversible legal setup", "legally binding guarantees" |
| D5 | For mandate updates, ASV verifies the **existing authorised signatories** who sign the request against the specimens on file. A new signatory's specimen is captured on the signature card and becomes a reference only after approval, so it is not compared | There is nothing to compare a new person against. This matches how a bank works |
| D6 | An approved mandate change is **recorded and marked for core banking**; it does not rewrite the account master in this demonstration | Keeps the specimen register stable and avoids a hidden side effect. Listed as a possible next step |
| D7 | Every new threshold goes into **Settings**, editable by the Branch Manager and Head of Operations, with reasons and audit | Same governance as the existing 26 settings |
| D8 | The Process page of every module shows the source's blocks: example, key information, the five-step flow and "why ASV is mandatory" | Directly reflects the infographic for the project manager |

## 5. Requirements

| ID | Requirement | Acceptance test |
|---|---|---|
| R1 | Three new modules appear on Home, in the menu and in the module bar, each with its own register, work list, cases, dashboard and process pages | A person with the module sees it; a person without it is refused |
| R2 | Each module registers its own fields and validates them (section 6) | A bad value shows a plain message and nothing is saved |
| R3 | ASV reports whether the company chop was found. A module that requires it flags the case when it is missing, and the case page shows the result | A scan without a chop is flagged in the three new modules, and passes in a module that does not require it |
| R4 | Signatures required and minimum approval level can follow the request type | A major LOI on an "any 2 of 3" account needs 2 signatures and Level 2 |
| R5 | A check can force an analyst review: daily limit exceeded, facility limit exceeded, high counterparty risk, high-risk country | The case goes to review even when the signatures match |
| R6 | TT shows the daily total against the daily limit, cash tendered, the cash reporting note and country risk | Registering over the limit shows a warning and routes to review |
| R7 | Trade finance shows facility limit, used amount and headroom, and blocks or escalates when the instrument exceeds the headroom | An instrument above headroom is escalated to Level 3 with review |
| R8 | Settings covers the new thresholds | Changes are validated, audited and take effect |
| R9 | New staff, accounts, starting cases, sample scans (genuine, forged, mandate not met, chop missing) and the demo script | A 15-minute demo script runs end to end on the new modules |
| R10 | The Process page shows the source's blocks for all six modules | Visible on every module |
| R11 | Existing behaviour is unchanged: all existing checks and the page sweep still pass | Regression suites green |

## 6. Solution design

### Modules and ownership

| Module | Key | Case prefix | Maker | Request types | Chop | Signatures | Minimum level |
|---|---|---|---|---|---|---|---|
| Branch transactions and LOI | `loi` | LOI | Branch Operations Officer | Change of registered address, change of contact details, standing instruction, cheque book or statement, account closure, payment by letter | Required | Major: full requirement. Routine: normal rule | Major: 2 |
| Account opening and mandate updates | `mnd` | MND | Corporate Banking Officer | Open a new account, add a signatory, remove a signatory, change signing limits, change signing rule | Required | Full requirement | 2 |
| Trade finance | `tf` | TFA | Trade Finance Officer | Letter of credit, bank guarantee, standby letter of credit, shipping guarantee | Required | Full requirement | 2 (3 when facility or risk rule fires) |
| TT and remittance (extended) | `tt` | TTR | Remittance Officer | Unchanged, plus cash tendered | Not required | Normal rule | 2 when daily limit exceeded |

The existing Corporate payment and Fixed deposit modules are unchanged.

### New checks

| Check | Where | Result |
|---|---|---|
| Company chop found | ASV run on the scan | Missing chop on a module that requires it: flagged, reason shown |
| Resolution date | Register, mandate updates | Not in the future and not older than 90 days (setting), else refused |
| KYC and KYB checklist | Register, mandate updates | Three confirmations required |
| Facility headroom | Register, trade finance | Instrument above headroom: Level 3 and analyst review |
| Counterparty risk | Register, trade finance | High: review and Level 3. Medium: Level 2 |
| Beneficiary screening | Register, trade finance | Same watchlist as TT; a hit needs compliance review |
| Daily limit | Register, TT | Account total for the day above the limit: review and Level 2 |
| Cash reporting | Register, TT | Cash tendered at or above the threshold: reporting note shown |
| High-risk country | Register, TT | Screening hit and review |

### New settings

Check for the company chop (on or off); resolution date maximum age; TT daily limit; cash reporting threshold. Approval levels, service targets, ASV-required-from and the other per-module settings extend to the three new modules automatically.

### People and data

Six new staff: two makers per new module. The existing analysts, approvers and the auditor gain access to all six modules. A trade facility (limit and used amount) is added to five current accounts. About eight starting cases per new module cover every status.

## 7. Delivery plan

| Phase | Work | Files | Done when |
|---|---|---|---|
| 1. Foundations | Chop detection in the engine and result in `verify.js`. Rules for request-driven signatures, minimum level and forced review. Account filter per module. Settings entries | `engine.js`, `verify.js`, `rules.js`, `settings.js`, `settings-spec.js`, `sigsynth.js` | Unit checks pass; no change to existing modules |
| 2. Branch transactions and LOI | Module definition, flow, checks, seeds | `modules/loi.js`, `seeds-loi.js`, `data.js` | Register, verify, approve works end to end |
| 3. Account opening and mandate updates | Same | `modules/mandate.js`, `seeds-mandate.js` | Same, plus date and checklist rules |
| 4. Trade finance | Same, plus facility on accounts | `modules/trade.js`, `seeds-trade.js`, `accounts.js` | Same, plus headroom and risk rules |
| 5. OTC TT | Daily limit, cash, country risk on the existing module | `modules/remittance.js` | Existing TT cases and tests unchanged |
| 6. Process pages | "At a glance" block for all six modules | `page-flow.js`, module files | Visible on all six |
| 7. Samples, staff, docs | Staff, sample scans for each new module, demo script, README | `data.js`, `sample-documents/`, README | Demo script runs |
| 8. Verification | Node checks for the new rules and scans, the existing suites, the page sweep for every role, public demo build | check scripts | All green |

### Risks

| Risk | Handling |
|---|---|
| Chop detection gives false results on real scans (colour, lighting) | Detects presence only, says so on screen, is switchable, and a flagged case is reviewed by a person |
| Change touches shared rules used by existing modules | New behaviour is opt-in per module type; existing suites must stay green |
| Real-signature samples need the chop added | Samples are regenerated from the same real signatures with a drawn chop |
| Scope | Phases are independent and committed separately on one branch |

### Out of scope for now

Rewriting the account master when a mandate change is approved; a real image-based chop authenticity model; a live credit-limit or sanctions service.

## 8. Status

| Phase | Status | Evidence |
|---|---|---|
| 1. Foundations | Done | Chop detector: 69 checks, including after JPEG compression. Rules and hooks: 74 checks |
| 2. Branch transactions and LOI | Done | Module, flow, checks, 11 starting cases, 8 sample scans |
| 3. Account opening and mandate updates | Done | Module, resolution date and checklist rules, 11 starting cases, 5 sample scans |
| 4. Trade finance | Done | Module, facility headroom, counterparty risk, screening, 11 starting cases, 5 sample scans |
| 5. OTC TT | Done | Daily limit, cash reporting, high-risk countries; 3 new starting cases |
| 6. Process pages | Done | "At a glance" block on all six modules |
| 7. Samples, staff, docs | Done | 6 new staff, 18 sample scans each read back through the engine, README and a 15-minute demo script |
| 8. Verification | Done | Earlier suites still pass (settings 74, integrity 77, permissions 47, clearing 36), 275 pages opened across 11 sign-ins without a script error, end-to-end runs in a browser |

Decisions D1 to D8 were implemented as written. One refinement from testing: only issued (approved) trade instruments use up a facility, so an application still being checked does not.
