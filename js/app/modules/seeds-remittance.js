/* Starting cases for the remittance module. Each entry becomes one case with its history. */
(function () {
  const G = (p, js, sc) => [p, "genuine", js || 3, sc], F = (p, js) => [p, "forged", js || 3];
  const f = (payee, bank, bic, country, purposeCode, purpose, charges) => ({ payee, bank, bic, country, purposeCode, charges: charges || "SHA, shared", purpose });
  const OK = { hit: false, reasons: [] };
  window.APP.SEEDS = (window.APP.SEEDS || []).concat([
    // closed
    { type: "tt", acct: "7002-8891-4402", amount: 450000, cur: "EUR", status: "approved", maker: "RO-1042", age: 26, level: 3, screen: OK, fields: f("Rhein Maschinenbau GmbH", "Deutsche Bank", "DEUTDEFF", "Germany", "Trade payment", "Machinery deposit"), sigs: [G("p2", 7), G("p3", 12)],
      trail: [[0.3, "RO-1042", "Submitted for approval", "Level 3 authority required (Head of Operations)."], [4, "HO-5001", "Approved and released", "Confirmed against purchase contract."]], approved: ["HO-5001", 22, "Confirmed against purchase contract."] },
    { type: "tt", acct: "8005-9930-1178", amount: 64000, cur: "USD", status: "rejected", maker: "RO-1057", age: 60, screen: OK, fields: f("Coastal Packaging Ltd", "OCBC Singapore", "OCBCSGSG", "Singapore", "Trade payment", "Packaging materials"), sigs: [G("p1", 5), F("p2", 9)],
      trail: [[0.4, "RO-1057", "Referred for review", "ASV flagged one or more signatures."], [3, "FR-3004", "Compliance review: forgery confirmed", "Second signature does not resemble the CFO's specimen; she confirmed by phone she did not sign."]],
      fraud: { decision: "forgery", by: "FR-3004", hAgo: 57, note: "Second signature does not resemble the CFO's specimen; she confirmed by phone she did not sign." }, closeAgo: 57 },
    { type: "tt", acct: "7010-2201-7743", amount: 80000, cur: "USD", status: "approved", maker: "RO-1042", age: 44, level: 2, screen: OK, fields: f("Shenzhen Components Co Ltd", "Bank of China HK", "BKCHHKHH", "Hong Kong", "Trade payment", "Component purchase"), sigs: [G("p1", 6), G("p2", 10)],
      trail: [[0.3, "RO-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."], [2, "BM-4001", "Approved and released", ""]], approved: ["BM-4001", 42, ""] },
    { type: "tt", acct: "7012-4488-3302", amount: 47500, cur: "SGD", status: "approved", maker: "RO-1057", age: 38, level: 2, screen: OK, fields: f("Straits Cargo Pte Ltd", "DBS Singapore", "DBSSSGSG", "Singapore", "Services", "Freight charges"), sigs: [G("p1", 6), G("p2", 11, 61)],
      trail: [[0.3, "RO-1057", "Referred for review", "ASV flagged one or more signatures."], [2, "FR-3004", "Compliance review: signature cleared", "Borderline score; director confirmed by call-back on the registered number. Callback ref CB-55120. Now needs Level 2 approval."], [4, "BM-4001", "Approved and released", ""]],
      fraud: { decision: "cleared", by: "FR-3004", hAgo: 36, note: "Borderline score; director confirmed by call-back on the registered number.", callback: "CB-55120" }, approved: ["BM-4001", 34, ""] },
    { type: "tt", acct: "7011-6650-1908", amount: 120000, cur: "USD", status: "returned", maker: "RO-1042", age: 30, screen: { hit: true, reasons: ["Beneficiary name matches a watchlist entry (northgate metals)"] }, fields: f("Northgate Metals FZE", "Emirates NBD", "EBILAEAD", "United Arab Emirates", "Trade payment", "Metal ingots"), sigs: [G("p1", 4), G("p2", 8)], closeAgo: 28,
      trail: [[0.4, "RO-1042", "Referred for review", "Screening hit: Beneficiary name matches a watchlist entry (northgate metals)"], [2, "FR-3004", "Rejected as suspicious", "Beneficiary matches the watchlist; compliance declined to release."]],
      closeNote: "Compliance declined: the beneficiary matches the watchlist. Customer informed." },
    { type: "tt", acct: "7011-6650-1908", amount: 20000, cur: "USD", status: "approved", maker: "RO-1057", age: 20, level: 1, screen: OK, fields: f("Hokkaido Timber KK", "MUFG Bank", "BOTKJPJT", "Japan", "Trade payment", "Timber samples"), sigs: [G("p1", 4)],
      trail: [[0.3, "RO-1057", "Submitted for approval", "Level 1 authority required (Senior Operations Officer)."], [1, "SO-2011", "Approved and released", ""]], approved: ["SO-2011", 19, ""] },
    // approvers
    { type: "tt", acct: "7010-2201-7743", amount: 45000, cur: "SGD", status: "pending_approval", maker: "RO-1042", age: 2, level: 1, screen: OK, fields: f("Lion City Distribution", "UOB Singapore", "UOVBSGSG", "Singapore", "Trade payment", "Distribution fees"), sigs: [G("p1", 3), G("p3", 8)],
      trail: [[0.3, "RO-1042", "Submitted for approval", "Level 1 authority required (Senior Operations Officer)."]] },
    { type: "tt", acct: "7002-8891-4402", amount: 100000, cur: "USD", status: "pending_approval", maker: "RO-1057", age: 1.5, level: 2, screen: OK, fields: f("Pacific Parts Co. Ltd", "DBS Singapore", "DBSSSGSG", "Singapore", "Trade payment", "Import of spare parts"), sigs: [G("p1", 3), G("p2", 8)],
      trail: [[0.3, "RO-1057", "Submitted for approval", "Level 2 authority required (Branch Manager)."]] },
    { type: "tt", acct: "8005-9930-1178", amount: 600000, cur: "USD", status: "pending_approval", maker: "RO-1042", age: 1, level: 3, screen: OK, fields: f("Midland Grain Traders Inc", "JPMorgan Chase", "CHASUS33", "United States", "Trade payment", "Grain purchase, shipment 4"), sigs: [G("p2", 4), G("p4", 9)],
      trail: [[0.3, "RO-1042", "Submitted for approval", "Level 3 authority required (Head of Operations)."]] },
    // compliance and fraud queue
    { type: "tt", acct: "7012-4488-3302", amount: 90000, cur: "USD", status: "fraud_review", maker: "RO-1042", age: 3, screen: { hit: true, reasons: ["Beneficiary name matches a watchlist entry (volta shipping)"] }, fields: f("Volta Shipping Ltd", "Standard Chartered", "SCBLGB2L", "United Kingdom", "Services", "Vessel charter fee"), sigs: [G("p1", 5), G("p2", 9)],
      trail: [[0.4, "RO-1042", "Referred for review", "Screening hit: Beneficiary name matches a watchlist entry (volta shipping)"]] },
    { type: "tt", acct: "7002-8891-4402", amount: 90000, cur: "GBP", status: "fraud_review", maker: "RO-1057", age: 2, screen: OK, fields: f("Thames Freight Ltd", "Barclays", "BARCGB22", "United Kingdom", "Services", "Freight settlement"), sigs: [F("p1", 5), G("p2", 9)],
      trail: [[0.4, "RO-1057", "Referred for review", "ASV flagged one or more signatures."]] },
    { type: "tt", acct: "8005-9930-1178", amount: 60000, cur: "EUR", status: "on_hold", maker: "RO-1057", age: 9, screen: OK, fields: f("Bavaria Foods GmbH", "Commerzbank", "COBADEFF", "Germany", "Trade payment", "Ingredient supply"), sigs: [G("p1", 5), G("p3", 6, 52)],
      trail: [[0.4, "RO-1057", "Referred for review", "ASV flagged one or more signatures."], [3, "FR-3004", "Placed on hold for callback", "Director not reachable on the registered number. Retry tomorrow morning."]],
      fraud: { decision: "hold", by: "FR-3004", hAgo: 6, note: "Director not reachable on the registered number. Retry tomorrow morning." } },
    // maker queue
    { type: "tt", acct: "7010-2201-7743", amount: 30000, cur: "USD", status: "asv_pass", maker: "RO-1042", age: 0.9, screen: { hit: true, reasons: ["Beneficiary name matches a watchlist entry (ashgar trading)"] }, fields: f("Ashgar Trading LLC", "Mashreq Bank", "BOMLAEAD", "United Arab Emirates", "Trade payment", "Electronic components"), sigs: [G("p1", 4), G("p2", 8)] },
    { type: "tt", acct: "7011-6650-1908", amount: 5000000, cur: "JPY", status: "registered", maker: "RO-1042", age: 0.3, screen: OK, fields: f("Osaka Machine Works", "Mizuho Bank", "MHCBJPJT", "Japan", "Trade payment", "Machine tooling"), sigs: [G("p1", 3), G("p2", 7)] },
    { type: "tt", acct: "7002-8891-4402", amount: 52000, cur: "SGD", status: "asv_pass", maker: "RO-1057", age: 0.8, screen: OK, fields: f("Marina Bay Logistics", "DBS Singapore", "DBSSSGSG", "Singapore", "Services", "Warehouse fees"), sigs: [G("p2", 4), G("p3", 8)] },
    { type: "tt", acct: "7012-4488-3302", amount: 70000, cur: "USD", status: "reopened", maker: "RO-1042", age: 5, screen: OK, fields: f("Bangkok Textile Co", "Siam Commercial Bank", "SICOTHBK", "Thailand", "Trade payment", "Fabric order"), sigs: [G("p1", 6), G("p2", 10)],
      trail: [[0.3, "RO-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."], [2, "BM-4001", "Returned for correction", "Beneficiary bank name does not match the BIC. Confirm with the customer."]],
      returnNote: "Beneficiary bank name does not match the BIC. Confirm with the customer." },
    { type: "tt", acct: "7010-2201-7743", amount: 75000, cur: "USD", status: "asv_mandate", maker: "RO-1057", age: 0.6, screen: OK, fields: f("Hanoi Circuit Boards", "Vietcombank", "BFTVVNVX", "Other", "Trade payment", "Circuit boards"), sigs: [G("p1", 5)] },
  ]);
})();
