/* Module: Trade finance application forms. Letters of credit, guarantees and standby letters of credit.
   Use case 3 of the four banking use cases. The bank takes on credit exposure to a third party, so every required signatory must sign, the company chop must be
   on the form, the instrument must fit the facility limit, and a weak counterparty rating sends it to an analyst before approval. */
(function () {
  const A = window.APP, esc = UI.esc, fmt = (n) => Math.round(n).toLocaleString("en-US");
  const mcfg = () => (window.Cfg ? Cfg.settings.module : { screeningRule: "contains", watchlist: ["northgate metals", "volta shipping", "ashgar trading"] });
  const ageDays = (iso) => Math.floor((new Date(iso + "T00:00:00").getTime() - Date.now()) / 864e5);

  A.TYPES.trade = {
    label: "Trade finance",
    long: "Trade finance application",
    form: "TFA-04",
    kind: "current",
    accountOk: (a) => !!a.tradeFacility,
    slaHours: 6,
    risk: "Fraudulent or unauthorised credit commitment",
    accountLabel: "Applicant account",
    amountLabel: "Instrument amount",
    defaultCurrency: "USD",
    fields: [
      ["instrument", "Type of instrument", "select:Letter of credit (import);Bank guarantee;Standby letter of credit;Shipping guarantee"],
      ["payee", "Beneficiary name", "text"],
      ["country", "Beneficiary country", "select:Singapore;Indonesia;Thailand;Hong Kong;China;Japan;India;United Kingdom;Germany;United States;Australia;United Arab Emirates;Other"],
      ["expiry", "Expiry date", "date"],
      ["risk", "Counterparty risk rating", "select:Low;Medium;High"],
      ["purpose", "Goods or purpose", "text", "full"],
    ],
    module: "tf", prefix: "TFA", chop: true, minLevel: 2,
    // A credit commitment needs every signatory the account's rule requires, whatever the amount.
    sigsFor: (f, account, myr, full) => full,
    levels: [{ n: 1, upTo: 250000, who: "Senior Operations Officer" }, { n: 2, upTo: 2000000, who: "Branch Manager" }, { n: 3, upTo: null, who: "Head of Operations" }],
    registerLabel: "Register application", review: "Credit and compliance review", checksTitle: "Facility and risk checks",
  };

  const kit = A.moduleKit("trade", {
    intro: "A company applies for a letter of credit or a guarantee. The bank is promising to pay a third party, so the application is checked more strictly than a payment. A person at the bank registers the signed form, ASV checks every required signature and looks for the company chop, the instrument is checked against the company's facility and the counterparty's rating, and a second person approves at Level 2 or above.",
    line: "Signed application in. ASV checks every required signature and the chop. The facility and counterparty are checked. Approval is Level 2 or above.",
    input: ["The signed application with the company chop (a scan)", "The instrument, beneficiary, amount, expiry date and counterparty rating", "The signing mandate, specimens and trade facility already on file"],
    process: ["Register the case; the facility headroom and the beneficiary screening run", "ASV compares every required signatory with the specimens and looks for the company chop", "A flag, a facility excess or a High risk counterparty goes to an analyst", "Approval is at Level 2 or above; Level 3 when the facility is exceeded or the counterparty is High risk"],
    output: ["The instrument is released to trade operations to issue, with a reference", "Or rejected, or returned to the customer, with the reason", "A complete audit trail of every step"],
    makerTitle: "Trade Finance Officer", sendText: "Signed application with the company chop and the supporting trade documents.", registerText: "Enters the instrument and runs the facility and screening checks.",
    mandateText: "Compares every required signatory with the specimens. The full signing requirement is needed.",
    reviewText: "Calls the company back and reviews the credit and compliance flags. Clearing it sends the case to approval; or hold it, or reject.",
    approveText: "Always Level 2 or above. Level 3 when the facility is exceeded or the counterparty is High risk.", approverSub: "Level 2 or above", bankLane: "Trade operations", bankSub: "Issues the instrument",
    releaseTitle: "Issues it", releaseText: "The instrument is issued and the audit trail is updated.",
    doneTitle: "Issued", doneOutput: "Instrument issued by trade operations, with a reference", expected: "instrument issued by trade operations with a reference.", done: "Instrument issued by trade operations.", releaseNoun: "Releases the instrument to trade operations and closes the case.",
    afterReviewWhen: "A signature, the chop, the facility or the counterparty was flagged, then an analyst cleared it",
    trackEnd: "Issued", guideName: "a trade finance application",
    guideSteps: [
      ["Receive", "The branch scans the signed application. A Trade Finance Officer registers it against the applicant's account and enters the instrument and the beneficiary."],
      ["Check the facility", "The system shows the facility limit, what is already used and what is left. An instrument above the headroom needs Level 3 and an analyst review."],
      ["Check the counterparty", "A High risk rating, or a beneficiary on the watchlist, goes to an analyst. A Medium rating needs at least Level 2."],
      ["Extract and compare", "ASV compares every required signatory with the specimens and looks for the company chop."],
      ["Approve", "Approval is always Level 2 or above. The instrument is then issued by trade operations."],
    ],
    extra: { title: "What makes this use case different", items: ["Every signatory the mandate requires must sign: this prevents a single signatory committing the company.", "The instrument is checked against the company's facility limit.", "The counterparty's risk rating and the beneficiary screening can send it to an analyst.", "It never goes below Level 2."] },
    glance: { example: "A shipment letter of credit application with two authorised signatures and the company chop.", keyInfo: ["LC details", "Beneficiary", "Facility limits", "Counterparty risk"], steps: ["Complete the application form", "Authorised signatories sign and stamp", "Scan and extract the signatures", "ASV compares with the reference signatures", "If they match, the instrument is issued"], why: ["Significant credit exposure to third parties", "Legally binding financial guarantees", "Prevents multi-signatory fraud"] },
  });
  A.FLOWS.trade = kit.flow; A.GUIDES.trade = kit.guide;

  /* ---- extra checks for this module ---- */
  // Facility already used: what is on file plus every instrument issued since (approved cases). An application still being checked does not use the facility yet.
  function used(acct, cases, exceptId) {
    return acct.tradeFacility.used + cases.filter((c) => c.type === "trade" && c.accountNo === acct.no && c.id !== exceptId && c.status === "approved").reduce((n, c) => n + (c.myr || 0), 0);
  }
  function facility(acct, cases, myr, exceptId) {
    const limit = acct.tradeFacility.limit, u = used(acct, cases, exceptId), head = limit - u;
    return { limit, used: u, headroom: head, after: u + (myr || 0), exceeds: myr == null || myr > head };
  }
  function screen(values) {
    const reasons = [], name = String(values.payee || "").toLowerCase();
    mcfg().watchlist.forEach((w) => { const lw = w.toLowerCase(), hit = mcfg().screeningRule === "exact" ? name.trim() === lw : name.includes(lw); if (hit) reasons.push("Beneficiary name matches a watchlist entry (" + w + ")"); });
    if (values.country === "Other") reasons.push("Beneficiary country is not in the standard list: enhanced due diligence applies");
    return { hit: reasons.length > 0, reasons, cleared: false, at: new Date().toISOString() };
  }
  const flags = (values, f) => {
    const why = []; let min = 2;
    if (f && f.exceeds) { why.push("the instrument is above the remaining facility headroom (MYR " + fmt(Math.max(0, f.headroom)) + ")"); min = 3; }
    if (values.risk === "High") { why.push("the counterparty is rated High risk"); min = 3; }
    return { why, min };
  };

  (window.UseCase = window.UseCase || {}).trade = {
    accountRows: (a) => [["Mandate", a.mandate.text], ["Trade facility", a.tradeFacility ? "MYR " + fmt(a.tradeFacility.limit) : "None"]],
    registerChecks(values, acct, cases, ctx) {
      const out = []; if (!acct) return out;
      const f = facility(acct, cases, ctx && ctx.fx ? ctx.fx.myr : 0), pct = Math.round(f.after / f.limit * 100); // can go above 100: the facility would be over-used
      out.push({ tone: f.exceeds ? "warn" : "ok", text: "<b>Facility.</b> Limit MYR " + fmt(f.limit) + ", used MYR " + fmt(f.used) + ", headroom MYR " + fmt(Math.max(0, f.headroom)) + (ctx && ctx.fx && ctx.fx.myr != null ? ". With this instrument " + pct + "% would be used." : ".") + (f.exceeds ? " <b>The instrument is above the headroom: Level 3 and an analyst review.</b>" : "") });
      if (values.risk) out.push({ tone: values.risk === "High" ? "warn" : values.risk === "Medium" ? "info" : "ok", text: "Counterparty risk: <b>" + esc(values.risk) + "</b>. " + (values.risk === "High" ? "An analyst reviews it and approval is at Level 3." : values.risk === "Medium" ? "Approval is at Level 2 or above." : "No extra step.") });
      if (values.payee) { const s = screen(values); out.push(s.hit ? { tone: "warn", text: "<b>Screening hit.</b> " + s.reasons.map(esc).join(". ") + ". The case will need compliance review." } : { tone: "ok", text: "Beneficiary screening: no watchlist match." }); }
      if (window.Cfg && Cfg.chopRequired("trade")) out.push({ tone: "info", text: "The application must carry the company chop. ASV looks for it and flags the case if it is missing." });
      return out;
    },
    validate(values) {
      const e = []; if (values.expiry) { const d = ageDays(values.expiry); if (d <= 0) e.push("The expiry date must be in the future."); else if (d > 365 * 5) e.push("The expiry date is more than five years away. Check it."); }
      return e;
    },
    onRegister(c, values, acct, cases) {
      const f = facility(acct, cases, c.myr, c.id), fl = flags(values, f);
      c.facility = f; c.minLevel = fl.min; if (fl.why.length) c.mustReview = fl.why.join(" and ") + "."; c.screen = screen(values);
      return [["Facility check", "Limit MYR " + fmt(f.limit) + ", used MYR " + fmt(f.used) + ", headroom MYR " + fmt(Math.max(0, f.headroom)) + (f.exceeds ? ". Above the headroom." : ".")], ["Counterparty risk", values.risk + (values.risk === "High" ? ": analyst review and Level 3." : ".")], ["Compliance screening", c.screen.hit ? "Potential match: " + c.screen.reasons.join("; ") : "No match on the watchlist."]];
    },
    rows: (c) => [["Instrument", c.fields.instrument || "-"], ["Beneficiary", (c.fields.payee || "-") + ", " + (c.fields.country || "-")], ["Expiry date", c.fields.expiry ? UI.date(c.fields.expiry) : "-"], ["Counterparty risk", c.fields.risk || "-"], ["Goods or purpose", c.fields.purpose || "-"]],
    banner(c) {
      if (!c.screen || !c.screen.hit || c.screen.cleared || c.status !== "asv_pass") return "";
      return '<div class="msg warn" role="alert"><b>Screening hit.</b> The signatures match, but the beneficiary needs compliance review before this can be submitted. Use Refer for review.</div>';
    },
    panels(c) {
      const f = c.facility, s = c.screen, st = c.asv && c.asv.stamp; if (!f) return "";
      const real = Math.round((c.myr == null ? 100 : f.after) / f.limit * 100), pct = Math.min(100, real), tone = f.exceeds ? "flag" : "pass";
      return '<section class="panel"><header>Facility and risk checks</header><div class="body small"><div class="st ' + tone + '">' + (f.exceeds ? "Above the facility headroom" : "Within the facility") + '</div><div class="bar-row" style="grid-template-columns:1fr;margin:8px 0 2px"><span class="bt"><i class="' + (f.exceeds ? "flag" : "pass") + '" style="width:' + pct + '%"></i></span></div>' +
        '<div class="muted">Limit MYR ' + fmt(f.limit) + ", used " + fmt(f.used) + ", headroom " + fmt(Math.max(0, f.headroom)) + ". With this instrument " + real + "% of the limit would be used.</div>" +
        '<div style="margin-top:8px"><b>Counterparty risk:</b> ' + esc(c.fields.risk || "-") + "</div>" +
        '<div class="st ' + (!st ? "info" : st.found ? "pass" : "fail") + '" style="margin-top:8px">' + (!st ? "Company chop not checked yet" : st.found ? "Company chop found" : "Company chop not found") + "</div></div></section>" +
        (s ? '<section class="panel"><header>Beneficiary screening</header><div class="body small"><div class="st ' + (!s.hit || s.cleared ? "pass" : "flag") + '">' + (!s.hit ? "Clear" : s.cleared ? "Hit cleared in review" : "Potential match") + "</div>" + (s.hit ? '<ul style="margin:8px 0 0;padding-left:18px">' + s.reasons.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul>" : '<div class="muted" style="margin-top:4px">No match on the watchlist at registration.</div>') + '<div class="hint">Screened ' + UI.dt(s.at) + ". Demonstration watchlist.</div></div></section>" : "");
    },
    approvalChecks: (c) => [[!c.facility || !c.facility.exceeds || c.level >= 3, !c.facility || !c.facility.exceeds ? "Instrument fits the facility headroom" : "Above the facility headroom: Level 3 required"], [c.fields.risk !== "High" || c.level >= 3, "Counterparty risk " + (c.fields.risk || "-") + (c.fields.risk === "High" ? ": Level 3 required" : "")], [!c.screen || !c.screen.hit || c.screen.cleared, !c.screen || !c.screen.hit ? "Beneficiary screening is clear" : c.screen.cleared ? "Screening hit cleared in review" : "Screening hit not yet cleared"], [!c.asv || !c.asv.stamp || c.asv.stamp.found, c.asv && c.asv.stamp && !c.asv.stamp.found ? "Company chop not found on the scan (check the original)" : "Company chop found on the scan"]],
  };
})();
