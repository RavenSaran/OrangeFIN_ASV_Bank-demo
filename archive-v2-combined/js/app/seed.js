/* Starting data so every role finds realistic work waiting at first sign-in.
   Times are relative to now. Seeded cases draw their scans from the signature generator instead of stored images. */
(function () {
  const A = window.APP, R = window.Rules;
  const user = (id) => A.USERS.find((u) => u.id === id);
  const acct = (no) => A.ACCOUNTS.find((a) => a.no === no);
  const hash = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 9973; return h; };

  function build() {
    const now = Date.now(), cases = [], events = [];
    const at = (hoursAgo) => new Date(now - hoursAgo * 3600e3).toISOString();
    let seq = 0;

    function addCase(s) {
      const a = acct(s.acct), cfg = A.TYPES[s.type], fx = R.toMYR(s.amount, s.cur), maker = user(s.maker);
      const id = "ASV-" + String(new Date(now).getFullYear()).slice(2) + String(new Date(now).getMonth() + 1).padStart(2, "0") + "-" + String(++seq).padStart(4, "0");
      const created = at(s.age), required = R.requiredSigs(a, fx.myr);
      const c = { id, type: s.type, accountNo: a.no, customer: a.name, branch: maker.branch, fields: Object.assign({}, s.fields), amount: s.amount, currency: s.cur, myr: fx.myr, fxKnown: fx.known, fxRate: fx.rate,
        required, status: s.status, level: null, override: false, maker: maker.id, makerName: maker.name, createdAt: created, dueAt: R.dueAt(created, s.type),
        synth: { signers: s.sigs.map((g) => ({ party: g[0], kind: g[1], js: g[2] || 3 })) } };
      // signature results are derived from the sample intent so the case page can show scores and images
      const rows = s.sigs.map((g, i) => {
        const p = a.parties.find((x) => x.id === g[0]), h = hash(id + i), scores = {};
        a.parties.forEach((q) => { scores[q.id] = q.id === g[0] ? (g[1] === "genuine" ? 88 + (h % 11) : 18 + (h % 30)) : 14 + ((h + q.seed) % 36); });
        if (g[3] != null) scores[g[0]] = g[3];
        const sc = scores[g[0]];
        return { index: i, declared: g[0], matched: { id: g[0], score: sc }, scores, pass: sc >= 70, poor: false, grade: "Good", notes: sc < 70 ? ["Below the pass score of 70. A low score alone does not prove forgery."] : [],
          synth: g[1] === "genuine" ? { seed: p.seed, jitter: 0.12, jseed: g[2] || 3 } : { seed: p.seed + 500, jitter: 0.06, jseed: g[2] || 3 } };
      });
      if (s.status !== "registered") {
        const pass = rows.filter((r) => r.pass), distinct = new Set(pass.map((r) => r.matched.id)).size;
        const verdict = rows.some((r) => !r.pass) ? "review" : distinct < required ? "mandate" : "pass";
        c.asv = { ran: true, ts: at(s.age - 0.2), threshold: 70, verdict, required, distinct, mandateMet: distinct >= required, sigs: rows,
          reasons: [distinct + " distinct authorised " + (distinct === 1 ? "signatory" : "signatories") + " verified; " + required + " required."] };
      }
      cases.push(c);
      const ev = (h, uid, type, action, detail) => { const u = user(uid); events.push({ ts: at(h), uid, name: u.name, role: u.role, type, action, caseId: id, detail: detail || "" }); };
      ev(s.age, s.maker, "case", "Case registered", cfg.long + ", " + s.cur + " " + s.amount.toLocaleString("en-US") + ".");
      if (c.asv) ev(s.age - 0.2, s.maker, "case", "Signature verification run", rows.map((r) => r.matched.score).join(" / ") + " against pass score 70.");
      (s.trail || []).forEach((t) => ev(s.age - t[0], t[1], "case", t[2], t[3]));
      if (s.after) s.after(c);
      c.level = c.level || (["pending_approval", "approved", "rejected"].includes(s.status) && !c.fraudSuspected && !c.returnNote ? R.approvalLevel(c.myr, c.fxKnown, c.override) : null);
      return c;
    }
    const G = (p, js) => [p, "genuine", js || 3], F = (p, js) => [p, "forged", js || 3];
    const closeAt = (c, h) => { c.closedAt = at(h); };
    const approved = (c, uid, h, note) => { const u = user(uid); c.approval = { by: uid, name: u.name, ts: at(h), note: note || "" }; c.releaseRef = "TXN" + c.id.replace(/\D/g, "") + "R"; closeAt(c, h); };

    // completed work
    addCase({ type: "payment", acct: "8001-2345-6789", amount: 182000, cur: "MYR", status: "approved", maker: "OP-1042", age: 71, fields: { payee: "Mega Steel Trading", reference: "INV-2610-0091", purpose: "Steel supply, batch 14" }, sigs: [G("p1", 3), G("p2", 8)],
      trail: [[0.3, "OP-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."]], after: (c) => { c.level = 2; approved(c, "BM-4001", 69.5, ""); } });
    addCase({ type: "tt", acct: "8005-9930-1178", amount: 64000, cur: "USD", status: "rejected", maker: "OP-1057", age: 60, fields: { payee: "Coastal Packaging Ltd", bank: "OCBC Singapore, SG", purpose: "Packaging materials" }, sigs: [G("p1", 5), F("p2", 9)],
      trail: [[0.4, "OP-1057", "Referred to fraud review", "ASV flagged one or more signatures."], [3, "FR-3004", "Fraud review: forgery confirmed", "Second signature does not resemble the specimen for Farah Diyana; confirmed with the CFO by phone."]],
      after: (c) => { c.fraud = { decision: "forgery", by: "FR-3004", name: user("FR-3004").name, ts: at(57), note: "Second signature does not resemble the specimen; CFO confirmed she did not sign." }; c.fraudSuspected = true; closeAt(c, 57); } });
    addCase({ type: "fd", acct: "FD-5521-010442", amount: 250000, cur: "MYR", status: "approved", maker: "OP-1057", age: 52, fields: { instruction: "Early withdrawal", credit: "Savings 1100-22-3345" }, sigs: [G("p1", 4)],
      trail: [[0.3, "OP-1057", "Submitted for approval", "Level 2 authority required (Branch Manager)."]], after: (c) => { c.level = 2; approved(c, "BM-4001", 49, "Customer present at branch, ID sighted."); } });
    addCase({ type: "payment", acct: "8003-1120-5534", amount: 47500, cur: "SGD", status: "approved", maker: "OP-1042", age: 44, fields: { payee: "Straits Cargo Pte Ltd", reference: "INV-5521", purpose: "Freight charges" }, sigs: [G("p1", 6), [ "p2", "genuine", 11, 61 ]],
      trail: [[0.3, "OP-1042", "Referred to fraud review", "ASV flagged one or more signatures."], [2, "FR-3004", "Fraud review: signature cleared", "Borderline score, signatory confirmed by call-back on registered number. Callback ref CB-77310. Now needs Level 2 approval."], [2.3, "OP-1042", "Submitted for approval", ""]],
      after: (c) => { c.override = true; c.level = 2; c.fraud = { decision: "cleared", by: "FR-3004", name: user("FR-3004").name, ts: at(42), note: "Borderline score, signatory confirmed by call-back on registered number.", callback: "CB-77310" }; approved(c, "BM-4001", 40, "Reviewed callback record."); } });
    addCase({ type: "fd", acct: "FD-5521-009876", amount: 90000, cur: "MYR", status: "returned", maker: "OP-1057", age: 30, fields: { instruction: "Early withdrawal", credit: "Current 8800-14-2210" }, sigs: [G("p1", 7)],
      after: (c) => { c.closeNote = "Joint account needs both holders. Customer asked to resubmit with Lim Mei Ling's signature."; closeAt(c, 29); } });
    addCase({ type: "tt", acct: "7002-8891-4402", amount: 310000, cur: "EUR", status: "approved", maker: "OP-1042", age: 26, fields: { payee: "Rhein Maschinenbau GmbH", bank: "Deutsche Bank, DE", purpose: "Machinery deposit" }, sigs: [G("p2", 7), G("p3", 12)],
      trail: [[0.3, "OP-1042", "Submitted for approval", "Level 3 authority required (Head of Operations)."]], after: (c) => { c.level = 3; approved(c, "HO-5001", 22, "Confirmed against purchase contract."); } });
    addCase({ type: "payment", acct: "8004-7781-2290", amount: 30000, cur: "MYR", status: "approved", maker: "OP-1057", age: 20, fields: { payee: "Kemaman Hardware", reference: "INV-0845", purpose: "Site consumables" }, sigs: [G("p3", 4)],
      trail: [[0.3, "OP-1057", "Submitted for approval", "Level 1 authority required (Senior Operations Officer)."]], after: (c) => { c.level = 1; approved(c, "SO-2011", 19, ""); } });

    // in flight
    addCase({ type: "payment", acct: "8001-2345-6789", amount: 78000, cur: "MYR", status: "pending_approval", maker: "OP-1042", age: 2.5, fields: { payee: "Supplier X Trading", reference: "INV-2610-0118", purpose: "Supplier invoice settlement" }, sigs: [G("p1", 3), G("p2", 8)],
      trail: [[0.3, "OP-1042", "Submitted for approval", "Level 1 authority required (Senior Operations Officer)."]], after: (c) => { c.level = 1; } });
    addCase({ type: "payment", acct: "8004-7781-2290", amount: 85000, cur: "MYR", status: "pending_approval", maker: "OP-1057", age: 1.5, fields: { payee: "Ipoh Concrete Works", reference: "INV-7720", purpose: "Concrete supply" }, sigs: [G("p1", 5), G("p3", 9)],
      trail: [[0.3, "OP-1057", "Submitted for approval", "Level 1 authority required (Senior Operations Officer)."]], after: (c) => { c.level = 1; } });
    addCase({ type: "tt", acct: "7002-8891-4402", amount: 250000, cur: "USD", status: "pending_approval", maker: "OP-1042", age: 1, fields: { payee: "Pacific Parts Co. Ltd", bank: "DBS Singapore, SG", purpose: "Import of spare parts" }, sigs: [G("p1", 3), G("p2", 8)],
      trail: [[0.3, "OP-1042", "Submitted for approval", "Level 3 authority required (Head of Operations)."]], after: (c) => { c.level = 3; } });
    addCase({ type: "fd", acct: "FD-5522-001208", amount: 120000, cur: "MYR", status: "pending_approval", maker: "OP-1057", age: 3, fields: { instruction: "Rollover for 12 months", credit: "FD-5522-001208" }, sigs: [G("p1", 6)],
      trail: [[0.3, "OP-1057", "Submitted for approval", "Level 2 authority required (Branch Manager)."]], after: (c) => { c.level = 2; } });
    addCase({ type: "payment", acct: "8001-2345-6789", amount: 45000, cur: "MYR", status: "fraud_review", maker: "OP-1042", age: 6, fields: { payee: "Apex Contractors", reference: "INV-2610-0120", purpose: "Progress claim 4" }, sigs: [G("p1", 6), F("p2", 10)],
      trail: [[0.4, "OP-1042", "Referred to fraud review", "ASV flagged one or more signatures."]] });
    addCase({ type: "tt", acct: "8005-9930-1178", amount: 60000, cur: "SGD", status: "fraud_review", maker: "OP-1057", age: 2, fields: { payee: "Thames Freight Ltd", bank: "Barclays, GB", purpose: "Freight settlement" }, sigs: [F("p1", 5), G("p3", 9)],
      trail: [[0.4, "OP-1057", "Referred to fraud review", "ASV flagged one or more signatures."]] });
    addCase({ type: "fd", acct: "FD-5521-013055", amount: 40000, cur: "MYR", status: "on_hold", maker: "OP-1057", age: 9, fields: { instruction: "Early withdrawal", credit: "Savings 2200-31-4401" }, sigs: [[ "p1", "genuine", 5, 52 ]],
      trail: [[0.4, "OP-1057", "Referred to fraud review", "ASV flagged one or more signatures."], [3, "FR-3004", "Placed on hold for callback", "Customer not reachable on registered number. Retry tomorrow morning."]],
      after: (c) => { c.fraud = { decision: "hold", by: "FR-3004", name: user("FR-3004").name, ts: at(6), note: "Customer not reachable on registered number. Retry tomorrow morning." }; } });
    addCase({ type: "payment", acct: "8003-1120-5534", amount: 15000, cur: "MYR", status: "asv_flag", maker: "OP-1042", age: 1.2, fields: { payee: "Klang Valley Printing", reference: "INV-3302", purpose: "Printing services" }, sigs: [G("p1", 4), F("p2", 12)] });
    addCase({ type: "payment", acct: "8001-2345-6789", amount: 22000, cur: "MYR", status: "registered", maker: "OP-1042", age: 0.3, fields: { payee: "Nusantara Office Supplies", reference: "INV-4410", purpose: "Office supplies" }, sigs: [G("p1", 3), G("p3", 7)] });
    addCase({ type: "tt", acct: "7002-8891-4402", amount: 52000, cur: "EUR", status: "asv_pass", maker: "OP-1057", age: 0.8, fields: { payee: "Rhein Maschinenbau GmbH", bank: "Deutsche Bank, DE", purpose: "Spare parts" }, sigs: [G("p2", 4), G("p3", 8)] });
    addCase({ type: "payment", acct: "8004-7781-2290", amount: 120000, cur: "MYR", status: "reopened", maker: "OP-1042", age: 5, fields: { payee: "Ipoh Concrete Works", reference: "INV-7701", purpose: "Concrete supply" }, sigs: [G("p1", 6), G("p2", 10)],
      trail: [[0.3, "OP-1042", "Submitted for approval", "Level 2 authority required (Branch Manager)."], [2, "BM-4001", "Returned for correction", "Payee name on the form differs from the invoice. Please confirm with customer."]],
      after: (c) => { c.returnNote = "Payee name on the form differs from the invoice. Please confirm with customer."; } });
    addCase({ type: "fd", acct: "FD-5521-009876", amount: 100000, cur: "MYR", status: "asv_mandate", maker: "OP-1057", age: 0.6, fields: { instruction: "Early withdrawal", credit: "Current 8800-14-2210" }, sigs: [G("p2", 5)] });

    // sign-in activity earlier in the day
    [["OP-1042", 7.2], ["OP-1057", 6.9], ["SO-2011", 7.0], ["BM-4001", 6.5], ["FR-3004", 7.1], ["HO-5001", 5.0]].forEach(([uid, h]) => {
      const u = user(uid); events.push({ ts: at(h), uid, name: u.name, role: u.role, type: "auth", action: "Signed in", caseId: "", detail: "Branch " + u.branch });
    });
    events.sort((x, y) => new Date(x.ts) - new Date(y.ts)); events.forEach((e, i) => (e.n = i + 1));
    return { cases: cases.reverse(), events, seq };
  }
  window.Seed = { build };
})();
