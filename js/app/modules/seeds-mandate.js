/* Starting cases for the account opening and mandate updates module. Each entry becomes one case with its history. */
(function () {
  const G = (p, js, sc) => [p, "genuine", js || 3, sc], F = (p, js) => [p, "forged", js || 3];
  const day = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  const EFFECT = { "Open a new account": "New account opened with the signature card on file.", "Add a signatory": "Signatory added to the mandate; the new specimen becomes a reference.", "Remove a signatory": "Signatory removed from the mandate.", "Change signing limits": "Signing limits changed on the mandate.", "Change signing rule": "Signing rule changed on the mandate." };
  const f = (requestType, ageDays, name, id) => ({ requestType, resolutionDate: day(ageDays), signatoryName: name, signatoryId: id, kyb: "Yes", kyc: "Yes", resolution: "Yes" });
  const x = (t, age) => ({ effect: EFFECT[t], resolutionAge: age });
  const OPEN = "Open a new account", ADD = "Add a signatory", REMOVE = "Remove a signatory", LIMITS = "Change signing limits", RULE = "Change signing rule";
  window.APP.SEEDS = (window.APP.SEEDS || []).concat([
    // closed
    { type: "mandate", acct: "8001-2345-6789", amount: 200000, cur: "MYR", status: "approved", maker: "AO-1042", age: 45, level: 2, fields: f(ADD, 12, "Lim Zhi Hao", "900412-14-5521"), sigs: [G("p1", 3), G("p2", 8)], extra: x(ADD, 12),
      trail: [[0.3, "AO-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."], [5, "BM-4001", "Approved and released", "Resolution and identity documents checked against the file."]], approved: ["BM-4001", 40, "Resolution and identity documents checked against the file."] },
    { type: "mandate", acct: "8004-7781-2290", amount: 750000, cur: "MYR", status: "approved", maker: "AO-1057", age: 28, level: 2, fields: f(LIMITS, 20, "Shalini Menon", "850630-10-6644"), sigs: [G("p1", 5), G("p3", 9)], extra: x(LIMITS, 20),
      trail: [[0.3, "AO-1057", "Submitted for approval", "Level 2 authority required (Branch Manager)."], [4, "BM-4001", "Approved and released", ""]], approved: ["BM-4001", 24, ""] },
    { type: "mandate", acct: "7002-8891-4402", amount: 1500000, cur: "MYR", status: "approved", maker: "AO-1042", age: 70, level: 3, fields: f(OPEN, 30, "Daniel Ong", "780921-12-7733"), sigs: [G("p1", 3), G("p3", 12)], extra: x(OPEN, 30),
      trail: [[0.3, "AO-1042", "Submitted for approval", "Level 3 authority required (Head of Operations)."], [6, "HO-5001", "Approved and released", "Second operating account for the Sabah project."]], approved: ["HO-5001", 62, "Second operating account for the Sabah project."] },
    { type: "mandate", acct: "8005-9930-1178", amount: 300000, cur: "MYR", status: "rejected", maker: "AO-1057", age: 52, fields: f(REMOVE, 9, "Tay Li Ying", "880214-07-5518"), sigs: [G("p1", 5), F("p2", 9)], extra: x(REMOVE, 9),
      trail: [[0.4, "AO-1057", "Referred for review", "ASV flagged one or more signatures."], [3, "FR-3004", "Compliance review: forgery confirmed", "The second signature does not resemble the specimen; the CFO confirmed by phone she did not sign."]],
      fraud: { decision: "forgery", by: "FR-3004", hAgo: 49, note: "The second signature does not resemble the specimen; the CFO confirmed by phone she did not sign." }, closeAgo: 49 },
    { type: "mandate", acct: "8003-1120-5534", amount: 100000, cur: "MYR", status: "returned", maker: "AO-1042", age: 34, fields: f(RULE, 6, "Nadia Binti Karim", "910305-14-6120"), sigs: [G("p1", 7)], extra: x(RULE, 6), closeAgo: 33,
      closeNote: "The current mandate needs both directors to authorise a change. Customer asked to resubmit with the second director's signature." },
    // in flight: approvers
    { type: "mandate", acct: "7010-2201-7743", amount: 300000, cur: "MYR", status: "pending_approval", maker: "AO-1057", age: 3, level: 2, fields: f(ADD, 15, "Teo Wei Jian", "870516-08-5539"), sigs: [G("p1", 3), G("p2", 8)], extra: x(ADD, 15),
      trail: [[0.3, "AO-1057", "Submitted for approval", "Level 2 authority required (Branch Manager)."]] },
    { type: "mandate", acct: "8001-2345-6789", amount: 2500000, cur: "MYR", status: "pending_approval", maker: "AO-1042", age: 2, level: 3, fields: f(LIMITS, 8, "Tan Wei Ming", "820719-14-5001"), sigs: [G("p1", 5), G("p3", 9)], extra: x(LIMITS, 8),
      trail: [[0.3, "AO-1042", "Submitted for approval", "Level 3 authority required (Head of Operations)."]] },
    // review queue
    { type: "mandate", acct: "7011-6650-1908", amount: 150000, cur: "MYR", status: "fraud_review", maker: "AO-1057", age: 5, fields: f(REMOVE, 11, "Rosalind Jinggut", "840921-13-6602"), sigs: [G("p1", 4), G("p2", 8)], noChop: true, extra: x(REMOVE, 11),
      trail: [[0.4, "AO-1057", "Referred for review", "The signatures match, but the company chop was not found on the scan."]] },
    // maker queue
    { type: "mandate", acct: "7012-4488-3302", amount: 80000, cur: "MYR", status: "asv_flag", maker: "AO-1042", age: 1.1, fields: f(ADD, 5, "Chong Mei Yee", "930828-10-5724"), sigs: [G("p1", 4), G("p2", 7)], noChop: true, extra: x(ADD, 5) },
    { type: "mandate", acct: "8005-9930-1178", amount: 400000, cur: "MYR", status: "asv_pass", maker: "AO-1057", age: 0.9, fields: f(RULE, 18, "Farah Diyana", "860112-14-5806"), sigs: [G("p1", 5), G("p2", 9)], extra: x(RULE, 18) },
    { type: "mandate", acct: "8004-7781-2290", amount: 500000, cur: "MYR", status: "registered", maker: "AO-1042", age: 0.3, fields: f(ADD, 3, "Lee Kar Wai", "890430-07-5517"), sigs: [G("p1", 3), G("p2", 6)], extra: x(ADD, 3) },
  ]);
})();
