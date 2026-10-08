/* Starting cases for the fixed deposits module. Each entry becomes one case with its history. */
(function () {
  const G = (p, js, sc) => [p, "genuine", js || 3, sc], F = (p, js) => [p, "forged", js || 3];
  const f = (instruction, credit, presented) => ({ instruction, credit, presented: presented || "Account holder in person", idSighted: "Yes" });
  const E = "Early withdrawal", R = "Rollover for 12 months", M = "Withdrawal at maturity";
  window.APP.SEEDS = (window.APP.SEEDS || []).concat([
    // closed
    { type: "fd", acct: "FD-5521-010442", amount: 250000, cur: "MYR", status: "approved", maker: "CS-1060", age: 52, level: 2, fields: f(E, "Savings 1100-22-3345"), sigs: [G("p1", 4)],
      trail: [[0.3, "CS-1060", "Submitted for approval", "Level 2 authority required (Branch Manager)."], [3, "BM-4001", "Approved and released", "Holder present at branch, ID sighted."]], approved: ["BM-4001", 49, "Holder present at branch, ID sighted."] },
    { type: "fd", acct: "FD-5523-004411", amount: 500000, cur: "MYR", status: "approved", maker: "CS-1042", age: 40, level: 2, fields: f(R, "FD-5523-004411"), sigs: [G("p1", 6)],
      trail: [[0.3, "CS-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."], [2, "BM-4001", "Approved and released", ""]], approved: ["BM-4001", 38, ""] },
    { type: "fd", acct: "FD-5521-009876", amount: 100000, cur: "MYR", status: "rejected", maker: "CS-1042", age: 60, fields: f(E, "Current 8800-14-2210"), sigs: [F("p1", 5), G("p2", 9)],
      trail: [[0.4, "CS-1042", "Referred for review", "ASV flagged one or more signatures."], [3, "FR-3004", "Fraud review: forgery confirmed", "Primary holder's signature does not match; Mr Lim confirmed he did not request this."]],
      fraud: { decision: "forgery", by: "FR-3004", hAgo: 57, note: "Primary holder's signature does not match; Mr Lim confirmed he did not request this." }, closeAgo: 57 },
    { type: "fd", acct: "FD-5521-009876", amount: 90000, cur: "MYR", status: "returned", maker: "CS-1060", age: 30, fields: f(E, "Current 8800-14-2210"), sigs: [G("p1", 7)], closeAgo: 29,
      closeNote: "Joint account needs both holders. Customer asked to return with Lim Mei Ling." },
    { type: "fd", acct: "FD-5521-013055", amount: 80000, cur: "MYR", status: "approved", maker: "CS-1060", age: 26, level: 1, fields: f(M, "Savings 2200-31-4401"), sigs: [G("p1", 4)],
      trail: [[0.3, "CS-1060", "Submitted for approval", "Level 1 authority required (Senior Operations Officer)."], [1, "SO-2011", "Approved and released", ""]], approved: ["SO-2011", 25, ""] },
    { type: "fd", acct: "FD-5523-007788", amount: 150000, cur: "MYR", status: "approved", maker: "CS-1042", age: 44, level: 2, fields: f(E, "Current 8800-55-1203"), sigs: [G("p1", 3), G("p2", 11, 58)],
      trail: [[0.3, "CS-1042", "Referred for review", "ASV flagged one or more signatures."], [2, "FR-3004", "Fraud review: signature cleared", "Joint holder confirmed by call-back on the registered number. Callback ref CB-40218. Now needs Level 2 approval."], [4, "BM-4001", "Approved and released", "Reviewed the callback record."]],
      fraud: { decision: "cleared", by: "FR-3004", hAgo: 42, note: "Joint holder confirmed by call-back on the registered number.", callback: "CB-40218" }, approved: ["BM-4001", 40, "Reviewed the callback record."] },
    // approvers
    { type: "fd", acct: "FD-5521-013055", amount: 40000, cur: "MYR", status: "pending_approval", maker: "CS-1042", age: 2, level: 1, fields: f(E, "Savings 2200-31-4401"), sigs: [G("p2", 5)],
      trail: [[0.3, "CS-1042", "Submitted for approval", "Level 1 authority required (Senior Operations Officer)."]] },
    { type: "fd", acct: "FD-5521-009876", amount: 100000, cur: "MYR", status: "pending_approval", maker: "CS-1042", age: 1.2, level: 1, fields: f(R, "FD-5521-009876"), sigs: [G("p1", 3), G("p2", 8)],
      trail: [[0.3, "CS-1042", "Submitted for approval", "Level 1 authority required (Senior Operations Officer)."]] },
    { type: "fd", acct: "FD-5523-004411", amount: 300000, cur: "MYR", status: "pending_approval", maker: "CS-1060", age: 3, level: 2, fields: f(E, "Current 8800-91-7720", "Authorised representative"), sigs: [G("p1", 7)],
      trail: [[0.3, "CS-1060", "Submitted for approval", "Level 2 authority required (Branch Manager)."]] },
    // fraud review
    { type: "fd", acct: "FD-5521-010442", amount: 100000, cur: "MYR", status: "fraud_review", maker: "CS-1042", age: 5, fields: f(E, "Savings 1100-22-3345"), sigs: [F("p1", 6)],
      trail: [[0.4, "CS-1042", "Referred for review", "ASV flagged one or more signatures."]] },
    { type: "fd", acct: "FD-5522-001208", amount: 30000, cur: "USD", status: "fraud_review", maker: "CS-1060", age: 2, fields: f(E, "FCY 3300-12-0045"), sigs: [F("p1", 5)],
      trail: [[0.4, "CS-1060", "Referred for review", "ASV flagged one or more signatures."]] },
    { type: "fd", acct: "FD-5523-007788", amount: 150000, cur: "MYR", status: "on_hold", maker: "CS-1060", age: 9, fields: f(E, "Current 8800-55-1203"), sigs: [G("p1", 5), G("p2", 6, 52)],
      trail: [[0.4, "CS-1060", "Referred for review", "ASV flagged one or more signatures."], [3, "FR-3004", "Placed on hold for callback", "Joint holder not reachable on the registered number. Retry tomorrow morning."]],
      fraud: { decision: "hold", by: "FR-3004", hAgo: 6, note: "Joint holder not reachable on the registered number. Retry tomorrow morning." } },
    // maker queue
    { type: "fd", acct: "FD-5521-009876", amount: 100000, cur: "MYR", status: "asv_flag", maker: "CS-1042", age: 1.1, fields: f(E, "Current 8800-14-2210"), sigs: [G("p1", 4), F("p2", 12)] },
    { type: "fd", acct: "FD-5523-004411", amount: 200000, cur: "MYR", status: "registered", maker: "CS-1042", age: 0.3, fields: f(E, "Current 8800-91-7720"), sigs: [G("p1", 3)] },
    { type: "fd", acct: "FD-5521-013055", amount: 20000, cur: "MYR", status: "asv_pass", maker: "CS-1060", age: 0.8, fields: f(E, "Savings 2200-31-4401"), sigs: [G("p1", 8)] },
    { type: "fd", acct: "FD-5521-010442", amount: 150000, cur: "MYR", status: "reopened", maker: "CS-1042", age: 5, fields: f(E, "Savings 1100-99-0021"), sigs: [G("p1", 6)],
      trail: [[0.3, "CS-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."], [2, "BM-4001", "Returned for correction", "The credit account on the form is not in the holder's name."]],
      returnNote: "The credit account on the form is not in the holder's name." },
    { type: "fd", acct: "FD-5523-007788", amount: 150000, cur: "MYR", status: "asv_mandate", maker: "CS-1060", age: 0.6, fields: f(E, "Current 8800-55-1203"), sigs: [G("p1", 5)] },
  ]);
})();
