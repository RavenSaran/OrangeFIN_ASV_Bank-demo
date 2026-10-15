# Sample documents and demo script

Scanned instructions to attach when you register a case (Register, then Upload a scan). They use made-up customers and generated signature drawings. Fill in the form to match what is printed on each scan; every typed field is required (the scan does not print the fixed deposit credit account, so type any account such as Current 8800-14-2210).
Password for every account: `Orange@2026`.

## Which account to choose

| Folder | Account | Signing mandate |
|---|---|---|
| `corporate-payment` | 8001-2345-6789, ABC Sdn. Bhd. | Any 2 of 3 |
| `fixed-deposit` | FD-5521-009876, Lim Chee Keong and Lim Mei Ling | Both holders |
| `tt-remittance` | 7002-8891-4402, Borneo Marine Supplies | Any 2 of 3 |

Each folder has `genuine` (likely match), `forged` (flagged for review) and `mandate-not-met` (genuine signatures, but too few or the same person twice). `reference-specimens` holds the specimens on file for each signatory .

The registration screen also has a Generate button that makes a practice scan for any account and any amount. Use it when no sample matches, for example to reach Level 3.

## The four banking use cases

| Folder | Module | Account | What it shows |
|---|---|---|---|
| `branch-loi` | Branch transactions and LOI | 8001-2345-6789 | Letters of instruction: a major change needs 2 signatures, a routine request needs 1 |
| `mandate-updates` | Account opening and mandate updates | 8001-2345-6789 | Existing authorised signatories sign a change to the mandate |
| `trade-finance` | Trade finance | 8001-2345-6789 | A letter of credit or guarantee: every required signatory must sign |

Each has `genuine`, `forged`, `mandate-not-met` and `chop-missing` (genuine signatures, but no company chop). They use the specimens in `reference-specimens/corporate-payment`, because they are all on account 8001. Fill in the form to match what is printed on each scan. For the transfer use case, use TT and remittance with Generate (see step 12 below).

## Demo script (about 12 minutes)

1. **One company, three modules.** Sign in as `BM-4001`. Home shows a tile per module with queue counts and your next few cases. Open a module and walk its sections: Dashboard (the numbers), Work waiting for you (the list), then Process (Input, Process and Output).
2. **Payment, clean pass.** Sign in as `PO-1042`. Register payment on 8001-2345-6789, 50,000 MYR, payee Supplier X Trading, reference INV-2026-00418, purpose Supplier invoice settlement, attach `corporate-payment/genuine/01`. Run verification and submit. Sign in as `SO-2011` (Level 1) and approve. The officer who registered it could not.
3. **Payment, forged signature.** As `PO-1042`, register `corporate-payment/forged/01` with the same details as step 2 (same payee and invoice, so a duplicate warning also appears). ASV flags the second signature. Refer it. As `FR-3004`, clear it with a note and a callback reference. `SO-2011` is now blocked because a cleared case needs Level 2. `BM-4001` approves.
4. **Fixed deposit.** Sign in as `CS-1042`. Register upliftment on FD-5521-009876, 100,000 MYR, Early withdrawal, credit account Current 8800-14-2210, tick the identity check, attach `fixed-deposit/genuine/01`. Note the payout estimate. Try 98,000 to see the minimum-balance block. `SO-2011` approves at Level 1.
5. **Fixed deposit, joint account rule.** Register `fixed-deposit/mandate-not-met/01` (same details, 100,000 MYR): one holder signed on a both-holders account, so the case returns to the customer. `forged/01` has only one signature, so the analyst cannot clear it.
6. **Remittance.** Sign in as `RO-1042`. Register transfer on 7002-8891-4402, 100,000 USD, Pacific Parts Co. Ltd, DBS Singapore, BIC DBSSSGSG, Singapore, details of payment Import of spare parts, attach `tt-remittance/genuine/01`. About MYR 445,000, which is Level 2 in remittance, so `SO-2011` is blocked and `BM-4001` approves.
7. **Remittance, screening.** Register on 7010-2201-7743 with beneficiary Ashgar Trading LLC, bank Mashreq Bank, BIC BOMLAEAD, United Arab Emirates, details Electronic components, using Generate. The signatures match but the screening hit blocks submission: refer it, then clear or reject as `FR-3004`.
8. **Thresholds.** Sign in as `BM-4001` and open Governance > Settings. Raise the pass score to 80, or set High risk below to 45, with a reason, and save. A bad value (high risk above the pass score) is refused. Register `corporate-payment/forged/01` again: the far-below signature now shows as High risk, likely forgery. The change appears in Change history and in the audit trail. `IA-6002` sees the same page read-only.
9. **Module access.** Sign in as `PO-1042` and try the Remittance module or a remittance case URL: access is refused and recorded.
10. **Audit.** Sign in as `IA-6002`. The Audit trail covers every module with a module filter, and exports to CSV.

## Demo script: the four use cases (about 15 minutes)

11. **Branch transactions and LOI.** Sign in as `LO-1042`. Register on 8001-2345-6789, type "Change of registered address", purpose Office relocation, details New address Level 12 Menara Selatan, attach `branch-loi/genuine/01`. The side panel says it is a major change: 2 signatures, Level 2. Run verification: the company chop is found. Submit. Sign in as `BM-4001` (Level 2) and approve. Then register `branch-loi/chop-missing/01`: the signatures match, but ASV flags that the company chop was not found and the case goes to review.
12. **Over-the-counter transfer.** Sign in as `RO-1042`. Register on 7002-8891-4402, USD 120,000 (about MYR 534,000), Singapore, and use Generate. The panel warns that today's transfers are above the account's daily limit of MYR 500,000. Verify and submit: although the signatures match, the case goes to an analyst for a callback first, then to approval at Level 2 or above. Try destination Myanmar to see the high-risk jurisdiction screening hit, and cash of 80,000 to see the cash reporting note.
13. **Account opening and mandate updates.** Sign in as `AO-1042`. Register on 8001-2345-6789, type "Add a signatory", resolution date a few days ago, signatory name Lim Zhi Hao, ID 900412-14-5521, signing limit 200,000, tick the three confirmations, attach `mandate-updates/genuine/01`. A resolution older than 90 days, or dated in the future, is refused. Approval is never below Level 2, and a signing limit above MYR 1,000,000 needs Level 3.
14. **Trade finance.** Sign in as `TF-1042`. Register on 8004-7781-2290, Bank guarantee, USD 400,000, risk Medium, a future expiry date, and use Generate. The panel shows a facility of MYR 8,000,000 with MYR 650,000 left, and says the instrument is above the headroom. Verify and submit: it goes to an analyst, then needs Level 3. Try risk High, or beneficiary Northgate Metals Trading, for the other review triggers.
15. **Why ASV is mandatory.** On any new module open Process: the "At a glance" block shows the example, the key information, the five-step flow and why ASV is mandatory, as in the source infographic.
16. **Settings.** As `BM-4001` open Settings. Turn off "Check for the company chop" (Process and limits) with a reason, or change the TT daily limit (Modules), and repeat step 11 or 12.
