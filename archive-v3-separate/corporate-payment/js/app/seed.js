/* Starting data so every role finds realistic work waiting at first sign-in.
   The cases come from APP.SEEDS in seeds.js. Times are relative to now. Seeded cases draw their scans from the signature generator. */
(function () {
  const A = window.APP, R = window.Rules;
  const user = (id) => A.USERS.find((u) => u.id === id);
  const acct = (no) => A.ACCOUNTS.find((a) => a.no === no);
  const hash = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 9973; return h; };

  function build() {
    const now = Date.now(), cases = [], events = [];
    const at = (h) => new Date(now - h * 3600e3).toISOString();
    const yymm = String(new Date(now).getFullYear()).slice(2) + String(new Date(now).getMonth() + 1).padStart(2, "0");
    let seq = 0;

    (A.SEEDS || []).forEach((s) => {
      const a = acct(s.acct), cfg = A.TYPES[s.type], fx = R.toMYR(s.amount, s.cur), maker = user(s.maker);
      const id = "ASV-" + yymm + "-" + String(++seq).padStart(4, "0"), created = at(s.age), required = R.requiredSigs(a, fx.myr);
      const c = { id, type: s.type, accountNo: a.no, customer: a.name, branch: maker.branch, fields: Object.assign({}, s.fields), amount: s.amount, currency: s.cur, myr: fx.myr, fxKnown: fx.known, fxRate: fx.rate,
        required, status: s.status, level: s.level || null, override: !!s.override, maker: maker.id, makerName: maker.name, createdAt: created, dueAt: R.dueAt(created, s.type),
        synth: { signers: s.sigs.map((g) => ({ party: g[0], kind: g[1], js: g[2] || 3 })) } };
      if (s.screen) c.screen = Object.assign({ hit: false, reasons: [], cleared: false }, s.screen);
      const rows = s.sigs.map((g, i) => {
        const p = a.parties.find((x) => x.id === g[0]), h = hash(id + i), scores = {};
        a.parties.forEach((q) => { scores[q.id] = q.id === g[0] ? (g[1] === "genuine" ? 88 + (h % 11) : 18 + (h % 30)) : 14 + ((h + q.seed) % 36); });
        if (g[3] != null) scores[g[0]] = g[3];
        const sc = scores[g[0]];
        return { index: i, declared: g[0], matched: { id: g[0], score: sc }, scores, pass: sc >= 70, poor: false, grade: "Good", notes: sc < 70 ? ["Below the pass score of 70. A low score alone does not prove forgery."] : [],
          synth: g[1] === "genuine" ? { seed: p.seed, jitter: 0.12, jseed: g[2] || 3 } : { seed: p.seed + 500, jitter: 0.06, jseed: g[2] || 3 } };
      });
      if (s.status !== "registered") {
        const distinct = new Set(rows.filter((r) => r.pass).map((r) => r.matched.id)).size;
        const verdict = rows.some((r) => !r.pass) ? "review" : distinct < required ? "mandate" : "pass";
        c.asv = { ran: true, ts: at(s.age - 0.2), threshold: 70, verdict, required, distinct, mandateMet: distinct >= required, sigs: rows, reasons: [distinct + " distinct authorised " + (distinct === 1 ? "signatory" : "signatories") + " verified; " + required + " required."] };
      }
      const ev = (h, uid, type, action, detail) => { const u = user(uid); events.push({ ts: at(h), uid, name: u.name, role: u.role, type, action, caseId: id, detail: detail || "" }); };
      ev(s.age, s.maker, "case", "Case registered", cfg.long + ", " + s.cur + " " + s.amount.toLocaleString("en-US") + ".");
      if (c.asv) ev(s.age - 0.2, s.maker, "case", "Signature verification run", rows.map((r) => r.matched.score).join(" / ") + " against pass score 70.");
      if (c.screen) ev(s.age - 0.1, s.maker, "case", "Compliance screening", c.screen.hit ? "Potential match: " + c.screen.reasons.join("; ") : "No match on the watchlist.");
      (s.trail || []).forEach((t) => ev(s.age - t[0], t[1], "case", t[2], t[3]));
      if (s.fraud) { const u = user(s.fraud.by); c.fraud = Object.assign({}, s.fraud, { name: u.name, ts: at(s.fraud.hAgo) }); delete c.fraud.hAgo; if (s.fraud.decision === "forgery") c.fraudSuspected = true; if (s.fraud.decision === "cleared") c.override = true; }
      if (s.approved) { const u = user(s.approved[0]); c.approval = { by: u.id, name: u.name, ts: at(s.approved[1]), note: s.approved[2] || "" }; c.releaseRef = "TXN" + id.replace(/\D/g, "") + "R"; c.closedAt = at(s.approved[1]); }
      if (s.closeAgo != null) c.closedAt = at(s.closeAgo);
      if (s.closeNote) c.closeNote = s.closeNote;
      if (s.returnNote) c.returnNote = s.returnNote;
      if (!c.level && ["pending_approval", "approved"].includes(s.status)) c.level = R.approvalLevel(c.myr, c.fxKnown, c.override);
      cases.push(c);
    });

    (A.SEED_LOGINS || []).forEach(([uid, h]) => { const u = user(uid); events.push({ ts: at(h), uid, name: u.name, role: u.role, type: "auth", action: "Signed in", caseId: "", detail: "Branch " + u.branch }); });
    events.sort((x, y) => new Date(x.ts) - new Date(y.ts)); events.forEach((e, i) => (e.n = i + 1));
    return { cases: cases.reverse(), events, seq };
  }
  window.Seed = { build };
})();
