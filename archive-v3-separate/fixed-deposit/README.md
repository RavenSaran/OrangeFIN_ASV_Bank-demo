# Fixed deposit upliftment

A standalone system. Open `login.html` (or `index.html`). Password for every account: `Orange@2026`.

## What it covers

A customer comes to the counter to withdraw or roll over a fixed deposit. The officer checks identity, registers the request, ASV compares the signatures with the holders' specimens, and a second person approves the payout.

What is specific to this use case:
- Identity must be sighted before the request can be registered.
- Joint accounts follow their own rule: both holders must sign, or either may sign.
- The payout is worked out before approval. Early withdrawal pays half of the interest earned on the amount uplifted.
- A deposit cannot be left below MYR 5,000, and closed accounts cannot be used.
- A request presented by a representative carries a warning: the holder's authority letter is needed.
- Two approval levels: up to MYR 100,000, and above.

## How to explain it

1. Sign in and open **Process overview**. It shows what goes in, what the system and staff do, what comes out, and who does each numbered step. The teal steps are the ones ASV does.
2. Open any case. The bar at the top shows where it is, who is next and what the output will be. The button help under "Your next step" says what each action does.
3. Follow the demonstration below, switching staff to see each person's part.

## Staff

| ID | Role | Does |
|---|---|---|
| `CS-1042`, `CS-1060` | Customer Service Officer | Sights ID, registers, verifies, submits |
| `FR-3004` | Fraud Review Analyst | Clears with a callback, holds, or confirms forgery |
| `SC-2011` | Senior Customer Service Officer | Approves up to MYR 100,000 |
| `BM-4001` | Branch Manager | Approves above MYR 100,000 and all fraud-cleared requests |
| `IA-6002` | Internal Auditor | Read-only |

## Sample documents (`sample-documents/`)

All scans belong to deposit `FD-5521-009876` (Lim Chee Keong and Lim Mei Ling, both holders must sign, principal MYR 100,000).

| Folder | Result |
|---|---|
| `genuine` | Both holders signed: likely match |
| `forged` | One or both holders' signatures forged: flagged |
| `mandate-not-met` | Only one holder signed: mandate not met |

Key the amount printed on the scan. For `genuine/02` choose Rollover for 12 months.

## Demonstration (about 6 minutes)

1. Sign in as `CS-1042`. Register upliftment: deposit FD-5521-009876, 100,000 MYR, Early withdrawal, tick the identity check, attach `genuine/01`. Note the payout estimate on the right. Run verification and submit. Sign out.
2. Sign in as `SC-2011` and approve.
3. As `CS-1042`, register 60,000 MYR with `forged/03`: the joint holder's signature is flagged. Refer it. As `FR-3004`, clear it with a callback reference. Then `SC-2011` is blocked and `BM-4001` approves, because a cleared case needs a manager.
4. Register with `mandate-not-met/01`: the signature is genuine but the joint account needs both holders, so the case returns to the customer. Likewise `forged/01` has only one signature, so FR-3004 cannot clear it: it can only be held or rejected.
5. Try an amount of 98,000: the system refuses because the deposit would be left below MYR 5,000.
6. Choose deposit FD-5521-013055 (either holder may sign) and use Generate with a genuine scan to see a single signature pass.
