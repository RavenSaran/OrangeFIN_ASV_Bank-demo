/* Remittance specifics: BIC validation, beneficiary screening, and the same-day cut-off. */
(function () {
  const esc = UI.esc, CUTOFF_H = 15, CUTOFF_M = 30;
  // Made-up watchlist for the demonstration. A live system calls the bank's screening service.
  const WATCH = ["northgate metals", "volta shipping", "ashgar trading"];
  const ISO = { Singapore: "SG", Indonesia: "ID", Thailand: "TH", "Hong Kong": "HK", China: "CN", Japan: "JP", India: "IN", "United Kingdom": "GB", Germany: "DE", "United States": "US", Australia: "AU", "United Arab Emirates": "AE" };
  const BIC = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  const bicOf = (v) => String(v || "").replace(/\s/g, "").toUpperCase();

  function screen(values) {
    const reasons = [], name = String(values.payee || "").toLowerCase();
    WATCH.forEach((w) => { if (name.includes(w)) reasons.push("Beneficiary name matches a watchlist entry (" + w + ")"); });
    if (values.country === "Other") reasons.push("Destination is not in the standard list: enhanced due diligence applies");
    return { hit: reasons.length > 0, reasons, cleared: false, at: new Date().toISOString() };
  }
  function valueDate(from) {
    const d = new Date(from || Date.now()), late = d.getHours() * 60 + d.getMinutes() >= CUTOFF_H * 60 + CUTOFF_M;
    if (late) d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return { iso: d.toISOString(), late };
  }
  const bicMatches = (f) => !ISO[f.country] || bicOf(f.bic).slice(4, 6) === ISO[f.country];

  window.UseCase = {
    registerChecks(values) {
      const out = [], b = bicOf(values.bic);
      if (b) out.push(BIC.test(b) ? (bicMatches(values) ? { tone: "ok", text: "BIC format is valid and agrees with " + esc(values.country) + "." } : { tone: "warn", text: "<b>BIC country " + esc(b.slice(4, 6)) + " does not match " + esc(values.country) + ".</b> Confirm the beneficiary bank with the customer." }) : { tone: "err", text: "BIC must be 8 or 11 letters and digits." });
      if (values.payee) { const s = screen(values); out.push(s.hit ? { tone: "warn", text: "<b>Screening hit.</b> " + s.reasons.map(esc).join(". ") + ". The case will need compliance review." } : { tone: "ok", text: "Beneficiary screening: no watchlist match." }); }
      const v = valueDate(); out.push({ tone: v.late ? "warn" : "info", text: v.late ? "After today's " + CUTOFF_H + ":" + CUTOFF_M + " cut-off. Value date " + UI.date(v.iso) + "." : "Same-day cut-off is " + CUTOFF_H + ":" + CUTOFF_M + ". Value date " + UI.date(v.iso) + "." });
      return out;
    },
    validate(values) { return BIC.test(bicOf(values.bic)) ? [] : ["The BIC must be 8 or 11 letters and digits."]; },
    onRegister(c, values) {
      c.fields.bic = bicOf(values.bic); c.screen = screen(values); c.valueDate = valueDate().iso;
      return [["Compliance screening", c.screen.hit ? "Potential match: " + c.screen.reasons.join("; ") : "No match on the watchlist."]];
    },
    rows: (c) => [["Beneficiary bank", (c.fields.bank || "-") + " (" + (c.fields.bic || "-") + ")"], ["Destination", c.fields.country || "-"], ["Purpose", c.fields.purposeCode || "-"], ["Charges", c.fields.charges || "-"], ["Value date", c.valueDate ? UI.date(c.valueDate) : "Same day"]],
    banner(c) {
      if (!c.screen || !c.screen.hit || c.screen.cleared || c.status !== "asv_pass") return "";
      return '<div class="msg warn" role="alert"><b>Screening hit.</b> The signatures match, but the beneficiary needs compliance review before this can be submitted. Use Refer to compliance review.</div>';
    },
    panels(c) {
      if (!c.screen) return "";
      const s = c.screen, tone = !s.hit ? "pass" : s.cleared ? "pass" : "flag";
      return '<section class="panel"><header>Beneficiary screening</header><div class="body small"><div class="st ' + tone + '">' + (!s.hit ? "Clear" : s.cleared ? "Hit cleared in review" : "Potential match") + "</div>" +
        (s.hit ? '<ul style="margin:8px 0 0;padding-left:18px">' + s.reasons.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul>" : '<div class="muted" style="margin-top:4px">No match on the watchlist at registration.</div>') +
        '<div class="hint">Screened ' + UI.dt(s.at) + ". Demonstration watchlist.</div></div></section>";
    },
    approvalChecks: (c) => [[!c.screen || !c.screen.hit || c.screen.cleared, !c.screen || !c.screen.hit ? "Beneficiary screening is clear" : c.screen.cleared ? "Screening hit cleared in compliance review" : "Screening hit not yet cleared"], [bicMatches(c.fields), "BIC agrees with the destination country"]],
  };
})();
