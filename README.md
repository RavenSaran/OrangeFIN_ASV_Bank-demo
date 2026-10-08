# OrangeFIN signature verification

One system for the whole company. Staff sign in once and work in the modules their role covers. Each module is a use case of Automated Signature Verification (ASV).

Open `index.html` (double-click). It goes to the sign-in page. Password for every account: `Orange@2026`.
Front-end demonstration only: data stays in the browser and the signature score comes from a demonstration engine. The signatures in this public demo are generated drawings; no real people's signatures are included.

## What is inside

| Module | What it handles | Specific to it |
|---|---|---|
| Corporate payment | Company payment instructions | Signing mandates, duplicate payment check, 3 approval levels |
| Fixed deposit | Counter withdrawals and rollovers | Identity check, joint accounts, payout estimate, minimum balance, 2 approval levels |
| TT and remittance | Cross-border transfers | BIC check, beneficiary screening, same-day cut-off, 3 approval levels |

All three share: the sign-in, the staff directory, the customer and specimen register, the case list, the audit trail and the approval rules.

## Staff and module access

| ID | Name | Position | Modules |
|---|---|---|---|
| `PO-1042`, `PO-1057` | Aisha Rahman, Daniel Lee | Payments Operations Officer | Corporate payment |
| `CS-1042`, `CS-1060` | Nurul Huda Zainal, Kevin Tan | Customer Service Officer | Fixed deposit |
| `RO-1042`, `RO-1057` | Lim Jia Hui, Arjun Pillai | Remittance Officer | TT and remittance |
| `FR-3004`, `FR-3011` | Farid Hakim, Marcus Tan Wei Lun | Fraud and Compliance Analyst (two, so a second analyst can clear) | All |
| `SO-2011` | Priya Nair | Senior Operations Officer (approves Level 1) | All |
| `BM-4001` | Hafiz Ismail | Branch Manager (approves Level 2) | All |
| `HO-5001` | Catherine Wong | Head of Operations (approves Level 3) | All |
| `IA-6002` | Ravi Chandran | Internal Auditor (read only) | All |

Approval levels belong to the module, so the same amount can need a different approver in each. For example MYR 150,000 is Level 2 in payments and fixed deposit, and Level 1 in remittance.
Nobody approves a case they registered or cleared. Module access is enforced in the rules, not just hidden in the menus.

## Settings (thresholds)

**Governance > Settings** holds every threshold in five pages, plus a change history. The Branch Manager and Head of Operations can edit. The Internal Auditor can read. Everyone else has no access.

| Page | What it sets |
|---|---|
| Score and risk | Pass score (bank-wide, per module, per signatory, stricter for large amounts), the score below which a signature is high risk (likely forgery), look-alike check |
| Amounts and approval | Approval levels per module, lowest level after a cleared flag, where ASV is required, where an analyst reviews clean matches, where two analysts must clear, signatures needed by amount, currency rates and unknown-currency rule |
| Capture quality | Good and Fair grades, what takes points off, size limits, whether a Poor capture forces review |
| Process and limits | Service targets, minimum note length, callback reference, idle sign-out, sign-in lock, duplicate window, specimen age warning |
| Modules | Fixed deposit minimum balance and interest kept, TT cut-off time, watchlist and match rule |

Each change needs a written reason, is checked before saving (for example, high risk must be below the pass score), and is written to the audit trail with the old and new value. Each page can be reset to the shipped values. The Policy page shows the values in force.

## How to explain it

1. Sign in as `BM-4001`. **Home** shows one tile per module with your queue counts, your next few cases, and **My work** in the menu for everything waiting for you across modules. Click a tile to enter a module.
2. Each module is split into sections, one page each, on the coloured bar:
   - **Dashboard**: the full picture. Headline numbers, cases by stage, approvals waiting at each level, verification results, service times and activity. No case list.
   - **Work waiting for you**: your queue in that module, most urgent first, with a What to do column and Overdue and Due soon filters. (The auditor sees **Needs attention** instead.)
   - **All cases**: every case in the module, with search and filters.
   - **Register** (makers): register a new instruction.
   - **Process**: what goes in, who does each step (the ASV steps are highlighted), and what comes out.
3. Open any case. The bar at the top says where it is, who is next and what the output will be.

## Folders

| Path | Contents |
|---|---|
| `index.html`, `login.html`, `*.html` | The pages: home, my work, module dashboard (`module.html`), module work list (`work.html`), cases, register, case file, specimens, audit, policy, process |
| `js/app/data.js` | Staff, roles, modules (the shared core) |
| `js/app/accounts.js` | Customer account master with signing mandates and specimens |
| `js/app/modules/` | One file per module (its form, limits, process, extra checks) plus its starting cases |
| `js/app/rules.js` | Statuses, who may do what, approval levels, four-eyes checks |
| `js/app/settings.js`, `settings-spec.js`, `page-settings.js` | The thresholds: values and rules, the wording shown, and the Settings page |
| `js/engine.js`, `js/verify.js`, `js/sigsynth.js` | Signature extraction and comparison, and the signature generator for demo data |
| `sample-documents/` | Scans to upload, and a demo script |
| `archive-v1`, `archive-v2-combined`, `archive-v3-separate` | Earlier versions, kept as they were |

To change a module's wording, limits or checks, edit its file in `js/app/modules/`. To change who works where, edit `js/app/data.js`.
