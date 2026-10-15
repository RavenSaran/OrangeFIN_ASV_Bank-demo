/* Starting cases for the branch transactions and letter of instruction module. Each entry becomes one case with its history. */
(function () {
  const G = (p, js, sc) => [p, "genuine", js || 3, sc], F = (p, js) => [p, "forged", js || 3];
  const MAJOR = ["Change of registered address", "Standing instruction or auto-debit", "Account closure"];
  const f = (requestType, purpose, details) => ({ requestType, purpose, details });
  const x = (t) => ({ reqClass: MAJOR.includes(t) ? "major" : "routine" });
  const ADDR = "Change of registered address", CONTACT = "Change of contact details", SI = "Standing instruction or auto-debit", CHQ = "Cheque book or statement request", CLOSE = "Account closure", PAY = "Payment by letter";
  window.APP.SEEDS = (window.APP.SEEDS || []).concat([
    // closed
    { type: "loi", acct: "8001-2345-6789", amount: 0, cur: "MYR", status: "approved", maker: "LO-1042", age: 40, level: 2, fields: f(ADDR, "Office relocation", "New registered address: Level 12, Menara Selatan, Kuala Lumpur"), sigs: [G("p1", 3), G("p2", 8)], extra: x(ADDR),
      trail: [[0.3, "LO-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."], [3, "BM-4001", "Approved and released", "Address matches the company search."]], approved: ["BM-4001", 36, "Address matches the company search."] },
    { type: "loi", acct: "8004-7781-2290", amount: 0, cur: "MYR", status: "approved", maker: "LO-1057", age: 22, level: 1, fields: f(CHQ, "Replacement cheque book", "Two books of 50 leaves, collect at the branch"), sigs: [G("p3", 4)], extra: x(CHQ),
      trail: [[0.3, "LO-1057", "Submitted for approval", "Level 1 authority required (Senior Operations Officer)."], [1, "SO-2011", "Approved and released", ""]], approved: ["SO-2011", 21, ""] },
    { type: "loi", acct: "8005-9930-1178", amount: 0, cur: "MYR", status: "rejected", maker: "LO-1057", age: 55, fields: f(SI, "Monthly transfer to a new account", "Auto-debit of MYR 40,000 on the 1st of each month"), sigs: [G("p1", 5), F("p3", 9)], extra: x(SI),
      trail: [[0.4, "LO-1057", "Referred for review", "ASV flagged one or more signatures."], [3, "FR-3004", "Compliance review: forgery confirmed", "The second signature does not resemble the specimen; the director confirmed by phone he did not sign."]],
      fraud: { decision: "forgery", by: "FR-3004", hAgo: 52, note: "The second signature does not resemble the specimen; the director confirmed by phone he did not sign." }, closeAgo: 52 },
    { type: "loi", acct: "8003-1120-5534", amount: 0, cur: "MYR", status: "returned", maker: "LO-1042", age: 30, fields: f(CLOSE, "Company winding down", "Close the account and transfer the balance to the director's account"), sigs: [G("p1", 7)], extra: x(CLOSE), closeAgo: 29,
      closeNote: "The mandate needs both directors for an account closure. Customer asked to resubmit with the second director's signature." },
    // in flight: approvers
    { type: "loi", acct: "7002-8891-4402", amount: 0, cur: "MYR", status: "pending_approval", maker: "LO-1042", age: 2, level: 2, fields: f(ADDR, "Change of business address", "New address: Lot 22, Jalan Kuching Industrial Park"), sigs: [G("p1", 3), G("p2", 8)], extra: x(ADDR),
      trail: [[0.3, "LO-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."]] },
    { type: "loi", acct: "8001-2345-6789", amount: 0, cur: "MYR", status: "pending_approval", maker: "LO-1057", age: 1.2, level: 1, fields: f(CONTACT, "New finance contact", "Finance contact is now Rajesh Kumar, +60 12 880 2210"), sigs: [G("p1", 5)], extra: x(CONTACT),
      trail: [[0.3, "LO-1057", "Submitted for approval", "Level 1 authority required (Senior Operations Officer)."]] },
    { type: "loi", acct: "8004-7781-2290", amount: 120000, cur: "MYR", status: "fraud_review", maker: "LO-1042", age: 4, fields: f(PAY, "Contractor payment by letter", "Pay Ipoh Concrete Works MYR 120,000 against invoice INV-7701"), sigs: [G("p1", 5), G("p2", 9)], noChop: true, extra: x(PAY),
      trail: [[0.4, "LO-1042", "Referred for review", "The signatures match, but the company chop was not found on the scan."]] },
    // maker queue
    { type: "loi", acct: "7010-2201-7743", amount: 0, cur: "MYR", status: "asv_flag", maker: "LO-1042", age: 1, fields: f(SI, "Quarterly insurance premium", "Auto-debit of MYR 18,500 each quarter"), sigs: [G("p1", 4), G("p2", 8)], noChop: true, extra: x(SI) },
    { type: "loi", acct: "8005-9930-1178", amount: 180000, cur: "MYR", status: "asv_pass", maker: "LO-1057", age: 0.8, fields: f(PAY, "Supplier payment by letter", "Pay Perak Agro Supplies MYR 180,000 against invoice INV-6702"), sigs: [G("p2", 4), G("p4", 9)], extra: x(PAY) },
    { type: "loi", acct: "8001-2345-6789", amount: 0, cur: "MYR", status: "registered", maker: "LO-1042", age: 0.3, fields: f(CONTACT, "Updated phone number", "Main line is now +60 3 2288 7710"), sigs: [G("p2", 3)], extra: x(CONTACT) },
    { type: "loi", acct: "7011-6650-1908", amount: 0, cur: "MYR", status: "reopened", maker: "LO-1057", age: 6, fields: f(ADDR, "Warehouse move", "New address: Lot 8, Jalan Pelabuhan, Kuching"), sigs: [G("p1", 6), G("p2", 10)], extra: x(ADDR),
      trail: [[0.3, "LO-1057", "Submitted for approval", "Level 2 authority required (Branch Manager)."], [2, "BM-4001", "Returned for correction", "The postcode on the letter does not match the company search. Please confirm with the customer."]],
      returnNote: "The postcode on the letter does not match the company search. Please confirm with the customer." },
  ]);
})();
