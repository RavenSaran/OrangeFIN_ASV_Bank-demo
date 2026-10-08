/* Browser storage for the console: cases, the audit trail and the signed-in session.
   Every write is guarded so a full browser quota is reported instead of silently losing a case. */
(function () {
  const K = { cases: "asv2_cases", events: "asv2_events", session: "asv2_session", seq: "asv2_seq" };
  const ls = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  function put(k, v, store) {
    try { (store || localStorage).setItem(k, JSON.stringify(v)); return { ok: true }; }
    catch (e) { return { ok: false, error: e && e.name === "QuotaExceededError" ? "Browser storage is full. Reset demo data from the Policy page, then try again." : "Could not save to browser storage." }; }
  }

  const DB = {
    ensureSeeded() { if (!ls(K.cases)) this.reset(); },
    reset() { const s = window.Seed.build(); put(K.cases, s.cases); put(K.events, s.events); put(K.seq, s.seq); },
    cases() { return ls(K.cases) || []; },
    case(id) { return this.cases().find((c) => c.id === id) || null; },
    saveCase(c) {
      const all = this.cases(), i = all.findIndex((x) => x.id === c.id);
      if (i >= 0) all[i] = c; else all.unshift(c);
      return put(K.cases, all);
    },
    events() { return ls(K.events) || []; },
    log(user, type, action, caseId, detail) {
      const ev = this.events();
      ev.push({ n: ev.length + 1, ts: new Date().toISOString(), uid: user ? user.id : "-", name: user ? user.name : "-", role: user ? user.role : "-", type, action, caseId: caseId || "", detail: detail || "" });
      return put(K.events, ev);
    },
    caseEvents(id) { return this.events().filter((e) => e.caseId === id); },
    nextCaseNo() {
      const d = new Date(), yymm = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0");
      const n = (ls(K.seq) || 0) + 1; put(K.seq, n);
      return "ASV-" + yymm + "-" + String(n).padStart(4, "0");
    },
    // Session lives in sessionStorage: closing the tab signs the user out.
    session() { try { return JSON.parse(sessionStorage.getItem(K.session)); } catch (e) { return null; } },
    setSession(s) { return put(K.session, s, sessionStorage); },
    clearSession() { try { sessionStorage.removeItem(K.session); } catch (e) {} },
  };
  window.DB = DB;
})();
