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
