# Telegraphic transfer and remittance

A standalone system. Open `login.html` (or `index.html`). Password for every account: `Orange@2026`.

## What it covers

A company sends a signed transfer application for a cross-border payment. The bank registers it, screens the beneficiary, checks the signatures against the remitter's mandate, and a second person approves it before the same-day cut-off.

What is specific to this use case:
- Beneficiary name, bank, BIC, country, purpose code and charges are captured. The BIC must be valid and agree with the destination country.
- Beneficiary screening runs next to signature verification. A screening hit stops the transfer even when every signature matches. (Demonstration watchlist: Northgate Metals FZE, Volta Shipping Ltd, Ashgar Trading LLC.)
- Same-day cut-off at 15:30. After that the value date moves to the next business day.
- Any currency is converted to MYR. An unknown currency goes to the highest authority.
- Three approval levels: up to MYR 200,000, up to 2,000,000, and above.

## How to explain it

1. Sign in and open **Process overview**. It shows what goes in, what the system and staff do, what comes out, and who does each numbered step. The blue steps are the ones ASV does.
2. Open any case. The bar at the top shows where it is, who is next and what the output will be. The button help under "Your next step" says what each action does.
3. Follow the demonstration below, switching staff to see each person's part.

## Staff

| ID | Role | Does |
|---|---|---|
| `RO-1042`, `RO-1057` | Remittance Officer | Registers, verifies, submits |
| `CF-3004` | Compliance and Fraud Analyst | Reviews flagged signatures and screening hits |
| `SR-2011` | Senior Remittance Officer | Approves up to MYR 200,000 |
| `OM-4001` | Operations Manager | Approves up to MYR 2,000,000 and all cleared overrides |
| `HT-5001` | Head of Treasury Operations | Approves any amount |
| `IA-6002` | Internal Auditor | Read-only |

## Sample documents (`sample-documents/`)

Use account `7002-8891-4402` (Borneo Marine Supplies). The scans print the beneficiary and amount; you add the BIC and country.

| Scan | Beneficiary | BIC | Country |
|---|---|---|---|
| `genuine/01`, `forged/01`, `forged/02` | Pacific Parts Co. Ltd | DBSSSGSG | Singapore |
| `genuine/02` | Rhein Maschinenbau GmbH | DEUTDEFF | Germany |
| `genuine/03` | Sakura Trading KK | BOTKJPJT | Japan |
| `forged/03` | Thames Freight Ltd | BARCGB22 | United Kingdom |

| Folder | Result |
|---|---|
| `genuine` | Likely match |
| `forged` | Flagged for compliance review |
| `mandate-not-met` | One signature: mandate not met |

## Demonstration (about 7 minutes)

1. Sign in as `RO-1042`. Register transfer: account 7002-8891-4402, 100,000 USD, Pacific Parts Co. Ltd, DBS Singapore, DBSSSGSG, Singapore, attach `genuine/01`. Run verification and submit. About MYR 445,000, so it needs the Operations Manager.
2. Sign in as `SR-2011`: blocked, Level 2 required. Sign in as `OM-4001` to approve.
3. Register again on account 7010-2201-7743 with beneficiary Ashgar Trading LLC (BIC BOMLAEAD, United Arab Emirates). Use Generate for the scan so it prints what you keyed. The signatures match, but a screening hit blocks submission. Refer to compliance review, then sign in as `CF-3004` to clear or reject it.
4. Enter a BIC that does not fit the country (for example DBSSSGSG with Germany) to see the warning, and an invalid BIC to see the block.
5. Register 500,000 USD (about MYR 2.2 million, above the Level 2 limit) using Generate to see Level 3: only `HT-5001` can approve.
6. Sign in as `IA-6002` and open Audit trail.
