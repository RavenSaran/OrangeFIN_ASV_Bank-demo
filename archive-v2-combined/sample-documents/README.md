# Sample documents for the demonstration

Scanned instructions to attach when you register a case in the console (Register instruction, then Upload a scan).
They use made-up customers and synthetic signatures. The signatories match the account master, so the checks behave as described below.

## Which account to choose

| Folder | Choose this account at registration | Signing mandate |
|---|---|---|
| `1-corporate-payment` | 8001-2345-6789, ABC Sdn. Bhd. | Any 2 of 3 |
| `2-fixed-deposit-upliftment` | FD-5521-009876, Lim Chee Keong and Lim Mei Ling | Both holders |
| `3-tt-remittance` | 7002-8891-4402, Borneo Marine Supplies Sdn. Bhd. | Any 2 of 3 |

Each folder has three kinds of file:

| Subfolder | What it shows | Result in the system |
|---|---|---|
| `genuine` | The authorised signatories signed | Likely match, scores about 80 to 99 |
| `forged` | One or both signatures are forged | Flagged, forged score below 70 |
| `mandate-not-met` | Genuine signatures, but too few or the same person twice | Mandate not met |

`reference-specimens` holds the specimen signature of every signatory, for reference.

## A short demonstration (about 8 minutes)

Every account uses the password `Orange@2026`. The sign-in page lists the staff IDs under Demonstration accounts.

1. **Clean pass.** Sign in as `OP-1042` (Operations Officer). Register a corporate payment on 8001-2345-6789 for 50,000 MYR (the amount printed on the scan), attach `genuine/01`. Run verification, then Submit for approval. Sign out.
2. **Four-eyes approval.** Sign in as `SO-2011` (Senior Operations Officer). Open the case, review the signatures, Approve and release. Notice the officer who registered a case cannot approve it.
3. **Forged signature.** As `OP-1042`, register the same account with `forged/01`. ASV flags the second signature. Refer to fraud review. Sign in as `FR-3004` (Fraud Review Analyst) and clear it with a note and a callback reference.
4. **Higher authority.** Sign in as `SO-2011` again. The cleared case now needs Level 2, so the checker cannot approve it. Sign in as `BM-4001` (Branch Manager) to approve.
5. **Mandate not met.** As `OP-1042`, attach `mandate-not-met/02` (same person signed twice). The system verifies the signatures but reports the mandate is not met, and the case returns to the customer.
6. **Any currency and higher authority.** Register a telegraphic transfer on 7002-8891-4402 and attach `3-tt-remittance/genuine/01`, which prints USD 100,000. That is about MYR 445,000, so it needs Level 2 (Branch Manager). For Level 3, key 250,000 USD and use Generate instead of a file: the training scan prints the amount you enter, and the MYR equivalent is above 1,000,000, so only `HO-5001` (Head of Operations) can approve. Try IDR or a made-up currency code to see how an unknown exchange rate is routed.
7. **Audit.** Sign in as `IA-6002` (Internal Auditor) or `BM-4001` and open Audit trail. Every sign-in, failed attempt and case action is listed and can be exported.

## Notes

- Key the account, amount and currency exactly as printed on the scan. Each file prints its own account number, which matches the account named above.
- The registration screen also has a Generate button that builds a training scan for any account and any amount, including accounts not covered by these files.
- If extraction splits one signature into pieces, tick them and press Merge selected into one signature.
- Documents are checked by the demonstration engine in your browser. A production model replaces it without changing the screens.
