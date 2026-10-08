/* Case history kept in the browser (localStorage) so the Audit page and Overview stats work in the demo. */
(function () {
  const KEY = "asv_cases_v1";
  const SEED = [
    { id: "ASV-240901", ts: "2026-09-29T09:12:00", useCase: "payment", entity: "Mega Build Sdn. Bhd.", amount: 182000, currency: "MYR", verdict: "pass", decision: "approved", scores: [93, 88], note: "", seed: true },
    { id: "ASV-240902", ts: "2026-09-29T10:41:00", useCase: "tt", entity: "Eastern Foods Bhd.", amount: 64000, currency: "USD", verdict: "review", decision: "rejected", scores: [91, 38], note: "Second signature does not match any mandate signatory.", seed: true },
    { id: "ASV-240903", ts: "2026-09-30T14:05:00", useCase: "fd", entity: "Wong Ah Seng", amount: 250000, currency: "MYR", verdict: "pass", decision: "approved", scores: [86], note: "", seed: true },
    { id: "ASV-240904", ts: "2026-10-01T11:22:00", useCase: "payment", entity: "Sunrise Logistics Sdn. Bhd.", amount: 47500, currency: "SGD", verdict: "review", decision: "recheck", scores: [74, 61], note: "Borderline score, calling signatory to confirm.", seed: true },
    { id: "ASV-240905", ts: "2026-10-02T16:48:00", useCase: "fd", entity: "Nur Aisyah Binti Omar", amount: 90000, currency: "MYR", verdict: "mandate", decision: "rejected", scores: [89], note: "Joint account, second holder did not sign.", seed: true },
    { id: "ASV-240906", ts: "2026-10-05T09:30:00", useCase: "tt", entity: "Golden Palm Exports", amount: 310000, currency: "EUR", verdict: "pass", decision: "approved", scores: [90, 84], note: "", seed: true },
  ];
  function read() { try { const r = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(r)) return r; } catch (e) {} return null; }
  function write(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  window.Store = {
    all() { let r = read(); if (!r) { r = SEED.slice(); write(r); } return r; },
    add(c) { const r = this.all(); r.unshift(c); write(r); return c; },
    nextId() { return "ASV-" + (240907 + this.all().filter((c) => !c.seed).length); },
    reset() { write(SEED.slice()); },
  };
})();
