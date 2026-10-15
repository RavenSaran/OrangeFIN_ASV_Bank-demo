/* Starting cases for the trade finance module. Each entry becomes one case with its history. */
(function () {
  const A = window.APP, G = (p, js, sc) => [p, "genuine", js || 3, sc], F = (p, js) => [p, "forged", js || 3];
  const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const OK = { hit: false, reasons: [] };
  const LC = "Letter of credit (import)", BG = "Bank guarantee", SBLC = "Standby letter of credit", SG = "Shipping guarantee";
  const f = (instrument, payee, country, expiryDays, risk, purpose) => ({ instrument, payee, country, expiry: day(expiryDays), risk, purpose });
  // the facility picture at registration: the limit and use on file, and what this instrument does to it
  const fac = (no, amount, cur) => { const a = A.ACCOUNTS.find((x) => x.no === no), myr = Rules.toMYR(amount, cur).myr, head = a.tradeFacility.limit - a.tradeFacility.used; return { limit: a.tradeFacility.limit, used: a.tradeFacility.used, headroom: head, after: a.tradeFacility.used + myr, exceeds: myr > head }; };
  const x = (no, amount, cur, more) => Object.assign({ facility: fac(no, amount, cur), minLevel: 2 }, more || {});
  window.APP.SEEDS = (window.APP.SEEDS || []).concat([
    // closed
    { type: "trade", acct: "8001-2345-6789", amount: 120000, cur: "USD", status: "approved", maker: "TF-1042", age: 35, level: 2, screen: OK, fields: f(LC, "Shenzhen Component Co Ltd", "China", 90, "Low", "Electronic components, shipment 14"), sigs: [G("p1", 3), G("p2", 8)], extra: x("8001-2345-6789", 120000, "USD"),
      trail: [[0.3, "TF-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."], [5, "BM-4001", "Approved and released", "Facility headroom and beneficiary checked."]], approved: ["BM-4001", 30, "Facility headroom and beneficiary checked."] },
    { type: "trade", acct: "7002-8891-4402", amount: 600000, cur: "USD", status: "approved", maker: "TF-1057", age: 60, level: 3, screen: OK, fields: f(BG, "Singapore Port Operations Pte Ltd", "Singapore", 200, "Medium", "Performance guarantee for terminal works"), sigs: [G("p1", 3), G("p3", 12)], extra: x("7002-8891-4402", 600000, "USD"),
      trail: [[0.3, "TF-1057", "Submitted for approval", "Level 3 authority required (Head of Operations)."], [6, "HO-5001", "Approved and released", "Confirmed against the construction contract."]], approved: ["HO-5001", 52, "Confirmed against the construction contract."] },
    { type: "trade", acct: "8005-9930-1178", amount: 90000, cur: "USD", status: "rejected", maker: "TF-1057", age: 48, screen: OK, fields: f(SBLC, "Jakarta Grain Importers", "Indonesia", 120, "Low", "Standby for grain imports"), sigs: [G("p1", 5), F("p3", 9)], extra: x("8005-9930-1178", 90000, "USD"),
      trail: [[0.4, "TF-1057", "Referred for review", "ASV flagged one or more signatures."], [3, "FR-3004", "Credit and compliance review: forgery confirmed", "The second signature does not resemble the specimen; the director confirmed by phone he did not sign."]],
      fraud: { decision: "forgery", by: "FR-3004", hAgo: 45, note: "The second signature does not resemble the specimen; the director confirmed by phone he did not sign." }, closeAgo: 45 },
    { type: "trade", acct: "7002-8891-4402", amount: 80000, cur: "USD", status: "returned", maker: "TF-1042", age: 26, screen: OK, fields: f(SG, "Penang Shipping Agency", "Singapore", 60, "Low", "Release of cargo without the bill of lading"), sigs: [G("p1", 7)], extra: x("7002-8891-4402", 80000, "USD"), closeAgo: 25,
      closeNote: "A shipping guarantee needs every signatory the mandate requires. Customer asked to resubmit with the second signature." },
    // in flight: approvers and review
    { type: "trade", acct: "8001-2345-6789", amount: 250000, cur: "USD", status: "pending_approval", maker: "TF-1042", age: 3, level: 2, screen: OK, fields: f(LC, "Hamburg Machinery GmbH", "Germany", 150, "Medium", "Packaging machinery, two lines"), sigs: [G("p1", 5), G("p3", 9)], extra: x("8001-2345-6789", 250000, "USD"),
      trail: [[0.3, "TF-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."]] },
    { type: "trade", acct: "8004-7781-2290", amount: 400000, cur: "USD", status: "fraud_review", maker: "TF-1057", age: 4, screen: OK, fields: f(BG, "Kemaman Marine Terminal", "Thailand", 180, "Medium", "Advance payment guarantee"), sigs: [G("p1", 5), G("p2", 9)],
      extra: x("8004-7781-2290", 400000, "USD", { minLevel: 3, mustReview: "the instrument is above the remaining facility headroom (MYR 650,000).", reviewReason: "enhanced" }),
      trail: [[0.4, "TF-1057", "Referred for enhanced review", "Likely match, but the instrument is above the remaining facility headroom (MYR 650,000). An analyst confirms by callback before approval."]] },
    { type: "trade", acct: "7010-2201-7743", amount: 60000, cur: "USD", status: "pending_approval", maker: "TF-1042", age: 7, level: 3, screen: OK, fields: f(LC, "Dubai Electronics Trading FZE", "United Arab Emirates", 75, "High", "Mobile phone accessories"), sigs: [G("p1", 4), G("p3", 8)],
      extra: x("7010-2201-7743", 60000, "USD", { minLevel: 3, mustReview: "the instrument is above the remaining facility headroom (MYR 100,000) and the counterparty is rated High risk.", reviewReason: "enhanced" }),
      fraud: { decision: "cleared", by: "FR-3011", hAgo: 2, note: "Callback to the finance director confirmed the order. The counterparty is known from earlier trade.", callback: "CB-90412" },
      trail: [[0.4, "TF-1042", "Referred for enhanced review", "Likely match, but the instrument is above the remaining facility headroom (MYR 100,000) and the counterparty is rated High risk. An analyst confirms by callback before approval."], [5, "FR-3011", "Credit and compliance review: match confirmed", "Callback to the finance director confirmed the order. Callback ref CB-90412. Now needs Level 3 approval."]] },
    // maker queue
    { type: "trade", acct: "8005-9930-1178", amount: 80000, cur: "USD", status: "asv_pass", maker: "TF-1057", age: 1.5, screen: { hit: true, reasons: ["Beneficiary name matches a watchlist entry (northgate metals)"] }, fields: f(LC, "Northgate Metals Trading", "Singapore", 100, "Medium", "Copper cathode"), sigs: [G("p2", 4), G("p4", 9)], extra: x("8005-9930-1178", 80000, "USD") },
    { type: "trade", acct: "8001-2345-6789", amount: 150000, cur: "USD", status: "asv_flag", maker: "TF-1042", age: 1.2, screen: OK, fields: f(BG, "Bangkok Logistics Co Ltd", "Thailand", 140, "Low", "Customs guarantee"), sigs: [G("p1", 4), G("p2", 7)], noChop: true, extra: x("8001-2345-6789", 150000, "USD") },
    { type: "trade", acct: "7002-8891-4402", amount: 200000, cur: "USD", status: "registered", maker: "TF-1057", age: 0.3, screen: OK, fields: f(LC, "Osaka Industrial Supply KK", "Japan", 110, "Low", "Machine parts"), sigs: [G("p1", 3), G("p2", 8)], extra: x("7002-8891-4402", 200000, "USD") },
    { type: "trade", acct: "8005-9930-1178", amount: 50000, cur: "USD", status: "asv_pass", maker: "TF-1042", age: 0.8, screen: OK, fields: f(LC, "Mumbai Spice Exports Pvt Ltd", "India", 95, "Low", "Spices for the festive season"), sigs: [G("p1", 5), G("p2", 9)], extra: x("8005-9930-1178", 50000, "USD") },
  ]);
})();
