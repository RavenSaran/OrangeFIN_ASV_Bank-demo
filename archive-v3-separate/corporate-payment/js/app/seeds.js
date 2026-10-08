/* Starting cases for the corporate payment demonstration. Each entry becomes one case with its history. */
(function () {
  const G = (p, js, sc) => [p, "genuine", js || 3, sc], F = (p, js) => [p, "forged", js || 3];
  const f = (payee, reference, purpose) => ({ payee, reference, purpose });
  window.APP.SEEDS = [
    // closed
    { type: "payment", acct: "8001-2345-6789", amount: 182000, cur: "MYR", status: "approved", maker: "PO-1042", age: 71, level: 2, fields: f("Mega Steel Trading", "INV-2610-0091", "Steel supply, batch 14"), sigs: [G("p1", 3), G("p2", 8)],
      trail: [[0.3, "PO-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."], [1.5, "BM-4001", "Approved and released", "Release reference issued."]], approved: ["BM-4001", 69.5, ""] },
    { type: "payment", acct: "8005-9930-1178", amount: 64000, cur: "USD", status: "rejected", maker: "PO-1057", age: 60, fields: f("Coastal Packaging Ltd", "INV-8802", "Packaging materials"), sigs: [G("p1", 5), F("p2", 9)],
      trail: [[0.4, "PO-1057", "Referred for review", "ASV flagged one or more signatures."], [3, "FR-3004", "Fraud review: forgery confirmed", "Second signature does not resemble the specimen; the CFO confirmed by phone she did not sign."]],
      fraud: { decision: "forgery", by: "FR-3004", hAgo: 57, note: "Second signature does not resemble the specimen; CFO confirmed she did not sign." }, closeAgo: 57 },
    { type: "payment", acct: "8003-1120-5534", amount: 47500, cur: "SGD", status: "approved", maker: "PO-1042", age: 44, level: 2, fields: f("Straits Cargo Pte Ltd", "INV-5521", "Freight charges"), sigs: [G("p1", 6), G("p2", 11, 61)],
      trail: [[0.3, "PO-1042", "Referred for review", "ASV flagged one or more signatures."], [2, "FR-3004", "Fraud review: signature cleared", "Borderline score; signatory confirmed by call-back on the registered number. Callback ref CB-77310. Now needs Level 2 approval."], [4, "BM-4001", "Approved and released", "Reviewed the callback record."]],
      fraud: { decision: "cleared", by: "FR-3004", hAgo: 42, note: "Borderline score; signatory confirmed by call-back on the registered number.", callback: "CB-77310" }, approved: ["BM-4001", 40, "Reviewed the callback record."] },
    { type: "payment", acct: "8004-7781-2290", amount: 30000, cur: "MYR", status: "approved", maker: "PO-1057", age: 20, level: 1, fields: f("Kemaman Hardware", "INV-0845", "Site consumables"), sigs: [G("p3", 4)],
      trail: [[0.3, "PO-1057", "Submitted for approval", "Level 1 authority required (Senior Payments Officer)."], [1, "SP-2011", "Approved and released", ""]], approved: ["SP-2011", 19, ""] },
    { type: "payment", acct: "7002-8891-4402", amount: 310000, cur: "EUR", status: "approved", maker: "PO-1042", age: 26, level: 3, fields: f("Rhein Maschinenbau GmbH", "INV-DE-4410", "Machinery deposit"), sigs: [G("p2", 7), G("p3", 12)],
      trail: [[0.3, "PO-1042", "Submitted for approval", "Level 3 authority required (Head of Payments Operations)."], [4, "HP-5001", "Approved and released", "Confirmed against purchase contract."]], approved: ["HP-5001", 22, "Confirmed against purchase contract."] },
    { type: "payment", acct: "8003-1120-5534", amount: 90000, cur: "MYR", status: "returned", maker: "PO-1057", age: 30, fields: f("Klang Valley Printing", "INV-3180", "Printing services"), sigs: [G("p1", 7)], closeAgo: 29,
      closeNote: "Mandate needs both directors. Customer asked to resubmit with the second director's signature." },
    // in flight: approvers
    { type: "payment", acct: "8001-2345-6789", amount: 78000, cur: "MYR", status: "pending_approval", maker: "PO-1042", age: 2.5, level: 1, fields: f("Supplier X Trading", "INV-2610-0118", "Supplier invoice settlement"), sigs: [G("p1", 3), G("p2", 8)],
      trail: [[0.3, "PO-1042", "Submitted for approval", "Level 1 authority required (Senior Payments Officer)."]] },
    { type: "payment", acct: "8004-7781-2290", amount: 85000, cur: "MYR", status: "pending_approval", maker: "PO-1057", age: 1.5, level: 1, fields: f("Ipoh Concrete Works", "INV-7720", "Concrete supply"), sigs: [G("p1", 5), G("p3", 9)],
      trail: [[0.3, "PO-1057", "Submitted for approval", "Level 1 authority required (Senior Payments Officer)."]] },
    { type: "payment", acct: "8005-9930-1178", amount: 420000, cur: "MYR", status: "pending_approval", maker: "PO-1042", age: 3, level: 2, fields: f("Perak Agro Supplies", "INV-6620", "Raw material purchase"), sigs: [G("p2", 4), G("p4", 9)],
      trail: [[0.3, "PO-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."]] },
    { type: "payment", acct: "7002-8891-4402", amount: 250000, cur: "USD", status: "pending_approval", maker: "PO-1042", age: 1, level: 3, fields: f("Pacific Parts Co. Ltd", "INV-PP-9931", "Import of spare parts"), sigs: [G("p1", 3), G("p2", 8)],
      trail: [[0.3, "PO-1042", "Submitted for approval", "Level 3 authority required (Head of Payments Operations)."]] },
    // fraud review queue
    { type: "payment", acct: "8001-2345-6789", amount: 45000, cur: "MYR", status: "fraud_review", maker: "PO-1042", age: 6, fields: f("Apex Contractors", "INV-2610-0120", "Progress claim 4"), sigs: [G("p1", 6), F("p2", 10)],
      trail: [[0.4, "PO-1042", "Referred for review", "ASV flagged one or more signatures."]] },
    { type: "payment", acct: "8005-9930-1178", amount: 60000, cur: "SGD", status: "fraud_review", maker: "PO-1057", age: 2, fields: f("Thames Freight Ltd", "INV-TF-221", "Freight settlement"), sigs: [F("p1", 5), G("p3", 9)],
      trail: [[0.4, "PO-1057", "Referred for review", "ASV flagged one or more signatures."]] },
    { type: "payment", acct: "8003-1120-5534", amount: 28000, cur: "MYR", status: "on_hold", maker: "PO-1057", age: 9, fields: f("Selangor Office Fit-out", "INV-0917", "Office renovation"), sigs: [G("p1", 5), G("p2", 6, 52)],
      trail: [[0.4, "PO-1057", "Referred for review", "ASV flagged one or more signatures."], [3, "FR-3004", "Placed on hold for callback", "Director not reachable on the registered number. Retry tomorrow morning."]],
      fraud: { decision: "hold", by: "FR-3004", hAgo: 6, note: "Director not reachable on the registered number. Retry tomorrow morning." } },
    // maker queue
    { type: "payment", acct: "8003-1120-5534", amount: 15000, cur: "MYR", status: "asv_flag", maker: "PO-1042", age: 1.2, fields: f("Klang Valley Printing", "INV-3302", "Printing services"), sigs: [G("p1", 4), F("p2", 12)] },
    { type: "payment", acct: "8001-2345-6789", amount: 22000, cur: "MYR", status: "registered", maker: "PO-1042", age: 0.3, fields: f("Nusantara Office Supplies", "INV-4410", "Office supplies"), sigs: [G("p1", 3), G("p3", 7)] },
    { type: "payment", acct: "7002-8891-4402", amount: 52000, cur: "EUR", status: "asv_pass", maker: "PO-1057", age: 0.8, fields: f("Rhein Maschinenbau GmbH", "INV-DE-4502", "Spare parts"), sigs: [G("p2", 4), G("p3", 8)] },
    { type: "payment", acct: "8004-7781-2290", amount: 120000, cur: "MYR", status: "reopened", maker: "PO-1042", age: 5, fields: f("Ipoh Concrete Works", "INV-7701", "Concrete supply"), sigs: [G("p1", 6), G("p2", 10)],
      trail: [[0.3, "PO-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."], [2, "BM-4001", "Returned for correction", "Payee name on the form differs from the invoice. Please confirm with the customer."]],
      returnNote: "Payee name on the form differs from the invoice. Please confirm with the customer." },
    { type: "payment", acct: "8003-1120-5534", amount: 100000, cur: "MYR", status: "asv_mandate", maker: "PO-1057", age: 0.6, fields: f("Subang Steel Works", "INV-5530", "Steel beams"), sigs: [G("p2", 5)] },
  ];
  window.APP.SEED_LOGINS = [["PO-1042", 7.2], ["PO-1057", 6.9], ["SP-2011", 7.0], ["BM-4001", 6.5], ["FR-3004", 7.1], ["HP-5001", 5.0]];
})();
