# Corporate payment authorisation

A standalone system. Open `login.html` (or `index.html`). Password for every account: `Orange@2026`.

## What it covers

A company sends a signed payment instruction. The bank registers it, checks the signatures against the company's signing mandate, and a second person approves it. Anything doubtful goes to fraud review first.

What is specific to this use case:
- Signing mandates such as any 2 of 3, both directors, or one signatory up to a limit (Mega Build Sdn. Bhd.).
- A duplicate payment check at registration.
- Three approval levels by MYR equivalent: up to 100,000, up to 1,000,000, and above.

## How to explain it

1. Sign in and open **Process overview**. It shows what goes in, what the system and staff do, what comes out, and who does each numbered step. The orange steps are the ones ASV does.
2. Open any case. The bar at the top shows where it is, who is next and what the output will be. The button help under "Your next step" says what each action does.
3. Follow the demonstration below, switching staff to see each person's part.

## Staff

| ID | Role | Does |
|---|---|---|
| `PO-1042`, `PO-1057` | Payments Operations Officer | Registers, verifies, submits |
| `FR-3004` | Fraud Review Analyst | Clears with a callback, holds, or confirms forgery |
| `SP-2011` | Senior Payments Officer | Approves up to MYR 100,000 |
| `BM-4001` | Branch Manager | Approves up to MYR 1,000,000 and all fraud-cleared payments |
| `HP-5001` | Head of Payments Operations | Approves any amount |
| `IA-6002` | Internal Auditor | Read-only |

## Sample documents (`sample-documents/`)

Use account `8001-2345-6789` (ABC Sdn. Bhd.). Key the payee, reference and amount printed on the scan.

| Folder | Result |
|---|---|
| `genuine` | Likely match |
| `forged` | Flagged for fraud review |
| `mandate-not-met` | One signature, or the same person twice: mandate not met |

## Demonstration (about 6 minutes)

1. Sign in as `PO-1042`. Register payment: account 8001-2345-6789, 50,000 MYR, payee Supplier X Trading, reference INV-2026-00418, attach `genuine/01`. Run verification and submit. Sign out.
2. Sign in as `SP-2011` and approve. Note that the officer who registered the case could not.
3. As `PO-1042`, register again with `forged/01`. It prints the same payee and invoice as step 1, so the duplicate payment warning appears: note it. ASV flags one signature. Refer it. As `FR-3004`, clear it with a note and a callback reference.
4. Sign in as `SP-2011`: the cleared case now needs Level 2. Sign in as `BM-4001` to approve.
5. Register the same payee and reference again to see the duplicate payment warning.
6. Sign in as `IA-6002` and open Audit trail.
