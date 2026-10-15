/* Module: Corporate account opening and mandate updates. Opening an account, adding or removing a signatory, changing signing limits or the signing rule.
   Use case 2 of the four banking use cases. The people who sign this request are the company's existing authorised signatories, so ASV compares them with the
   specimens on file. A new signatory's specimen is captured on the signature card and only becomes a reference after approval, so it is not compared. */
(function () {
  const A = window.APP, norm = (s) => String(s || "").trim().toLowerCase();
  const maxDays = () => (window.Cfg ? Cfg.settings.module.resolutionMaxDays : 90);
  const ageDays = (iso) => Math.floor((Date.now() - new Date(iso + "T00:00:00").getTime()) / 864e5);
  const onFile = (acct, name) => acct && acct.parties.find((p) => norm(p.name) === norm(name));
  const EFFECT = { "Open a new account": "New account opened with the signature card on file.", "Add a signatory": "Signatory added to the mandate; the new specimen becomes a reference.", "Remove a signatory": "Signatory removed from the mandate.", "Change signing limits": "Signing limits changed on the mandate.", "Change signing rule": "Signing rule changed on the mandate." };

  A.TYPES.mandate = {
    label: "Account opening and mandate update",
    long: "Account opening or mandate update",
    form: "AOM-02",
    kind: "current",
    slaHours: 8,
    risk: "Unauthorised change to who controls company funds",
    accountLabel: "Company account",
    amountLabel: "Signing limit requested",
    defaultCurrency: "MYR",
    fields: [
      ["requestType", "Type of request", "select:Open a new account;Add a signatory;Remove a signatory;Change signing limits;Change signing rule"],
      ["resolutionDate", "Board resolution date", "date"],
      ["signatoryName", "Signatory affected, full name", "text"],
      ["signatoryId", "Signatory ID or passport number", "text"],
      ["kyb", "Company checks (KYB)", "checkbox", "full", "", "Company registration, directors and owners checked", "req"],
      ["kyc", "Identity checks (KYC)", "checkbox", "full", "", "Identity documents of the signatories sighted", "req"],
      ["resolution", "Board resolution", "checkbox", "full", "", "Signed board resolution is attached to the scan", "req"],
    ],
    module: "mnd", prefix: "MND", chop: true, minLevel: 2,
    // The change is legally binding, so the existing mandate is met in full whatever the limit requested.
    sigsFor: (f, account, myr, full) => full,
    levels: [{ n: 1, upTo: 100000, who: "Senior Operations Officer" }, { n: 2, upTo: 1000000, who: "Branch Manager" }, { n: 3, upTo: null, who: "Head of Operations" }],
    registerLabel: "Register request", review: "Compliance review", checksTitle: "Mandate request checks",
  };

  const kit = A.moduleKit("mandate", {
    intro: "A company asks the bank to open an account or change who may sign for it. This is the set-up that controls the company's money, so it is checked more strictly than a payment. A person at the bank registers the signed request and board resolution, ASV checks the signatures of the company's existing authorised signatories and looks for the company chop, and a second person approves at Level 2 or above.",
    line: "Signed request and board resolution in. ASV checks the existing signatories and the chop. Approval is always Level 2 or above. The mandate change is recorded for core banking.",
    input: ["The signed request, signature card and board resolution with the company chop (a scan)", "The type of request, the resolution date, the signatory affected and the signing limit", "The KYC and KYB checks, and the signing mandate and specimens already on file"],
    process: ["Register the case; the resolution date and the KYC and KYB confirmations are checked", "ASV compares the existing authorised signatories with their specimens and looks for the company chop", "A flag goes to review for a callback", "Approval is at Level 2 or above; never the person who registered or cleared it"],
    output: ["The mandate change is recorded and sent to core banking for update, with a reference", "Or rejected, or returned to the customer, with the reason", "A complete audit trail of every step"],
    makerTitle: "Corporate Banking Officer", sendText: "Signed request, signature card and board resolution.", registerText: "Enters the request, resolution date and signatory details.",
    mandateText: "Compares the existing authorised signatories with their specimens. The full signing requirement is needed.",
    reviewText: "Calls the signatory back to confirm the change. Clearing it sends the case to approval; or hold it, or confirm forgery.",
    approveText: "Always Level 2 or above. Level 3 when the signing limit is above MYR 1,000,000.", bankLane: "Core banking", bankSub: "Updates the mandate",
    releaseTitle: "Records the change", releaseText: "The mandate change is recorded and sent for the core banking update.",
    doneTitle: "Change recorded", doneOutput: "Mandate change recorded and sent to core banking for update, with a reference", expected: "mandate change recorded and sent to core banking for update.", done: "Mandate change recorded for core banking.", releaseNoun: "Records the mandate change for core banking and closes the case.",
    trackEnd: "Recorded", guideName: "an account opening or mandate update",
    guideSteps: [
      ["Receive", "The branch scans the signed request, signature card and board resolution. A Corporate Banking Officer registers it and ticks the KYC and KYB checks."],
      ["Check the paperwork", "The board resolution date must not be in the future or older than the limit in Settings. The signatory affected is checked against the mandate on file."],
      ["Extract and compare", "ASV compares the existing authorised signatories who signed with their specimens, and looks for the company chop. A new signatory is not compared: there is no specimen yet."],
      ["Review if flagged", "A signature below the pass score, or a scan with no chop, goes to an analyst who calls the company back."],
      ["Approve", "Approval is always Level 2 or above. The change is recorded for core banking; it does not rewrite the specimen register in this demonstration."],
    ],
    extra: { title: "What makes this use case different", items: ["The signatures checked are those of the existing authorised signatories, who authorise the change.", "A new signatory's specimen is captured on the card and becomes a reference only after approval.", "The change is legally binding, so it never goes below Level 2.", "The board resolution date and the KYC and KYB checks are part of registration."] },
    glance: { example: "A physical signature card, with the corporate stamp, to add a new director as a signatory.", keyInfo: ["Account details", "Resolution date", "Signatory details", "Signing limits"], steps: ["Complete the application form", "Authorised signatories sign and stamp", "Scan and extract the signatures", "ASV compares with the reference signatures", "If they match, the change is recorded"], why: ["Direct control of company funds and structure", "Regulatory compliance for KYC and KYB", "An irreversible legal set-up"] },
  });
  A.FLOWS.mandate = kit.flow; A.GUIDES.mandate = kit.guide;

  /* ---- extra checks for this module ---- */
  (window.UseCase = window.UseCase || {}).mandate = {
    accountRows: (a) => [["Mandate", a.mandate.text]],
    registerChecks(values, acct, cases, ctx) {
      const out = [], t = values.requestType;
      if (t === "Add a signatory") out.push({ tone: "info", text: "<b>New signatory.</b> Their specimen is captured on the card and becomes a reference after approval. ASV compares the existing signatories who sign this request." });
      else if (t === "Open a new account") out.push({ tone: "info", text: "<b>New account.</b> The company's existing authorised signatories sign the application. ASV compares them with the specimens on file." });
      if (values.signatoryName && acct) {
        const p = onFile(acct, values.signatoryName);
        if (t === "Add a signatory") out.push(p ? { tone: "err", text: "<b>" + UI.esc(p.name) + " is already an authorised signatory</b> on this account." } : { tone: "ok", text: "Not yet an authorised signatory on this account." });
        else if (t === "Remove a signatory") out.push(p ? { tone: "ok", text: UI.esc(p.name) + " is an authorised signatory on file (" + UI.esc(p.role) + ")." } : { tone: "warn", text: "<b>That name is not an authorised signatory on file.</b> Check the spelling against the specimen register." });
      }
      if (values.resolutionDate) {
        const d = ageDays(values.resolutionDate);
        out.push(d < 0 ? { tone: "err", text: "<b>The board resolution is dated in the future.</b>" } : d > maxDays() ? { tone: "err", text: "<b>The board resolution is " + d + " days old.</b> The limit is " + maxDays() + " days." } : { tone: "ok", text: "Board resolution is " + d + " day" + (d === 1 ? "" : "s") + " old (limit " + maxDays() + ")." });
      }
      if (ctx) out.push({ tone: "info", text: "Signatures needed: " + ctx.need + ". Approval is at Level " + Math.max(2, ctx.lvl) + " or above." });
      if (window.Cfg && Cfg.chopRequired("mandate")) out.push({ tone: "info", text: "The scan must carry the company chop. ASV looks for it and flags the case if it is missing." });
      return out;
    },
    validate(values, acct) {
      const e = [], t = values.requestType;
      if (values.resolutionDate) { const d = ageDays(values.resolutionDate); if (d < 0) e.push("The board resolution cannot be dated in the future."); else if (d > maxDays()) e.push("The board resolution is " + d + " days old. The limit is " + maxDays() + " days."); }
      if (!/^[A-Za-z0-9-]{6,20}$/.test(String(values.signatoryId || "").trim())) e.push("The signatory ID or passport number must be 6 to 20 letters, digits or hyphens.");
      const p = onFile(acct, values.signatoryName);
      if (t === "Add a signatory" && p) e.push(p.name + " is already an authorised signatory on this account.");
      if (t === "Remove a signatory" && !p) e.push("The signatory to remove is not an authorised signatory on file.");
      return e;
    },
    onRegister(c, values) { c.effect = EFFECT[values.requestType] || ""; c.resolutionAge = ageDays(values.resolutionDate); return [["Mandate request", values.requestType + ", resolution dated " + values.resolutionDate + ", " + values.signatoryName + "."]]; },
    rows: (c) => [["Type of request", c.fields.requestType || "-"], ["Board resolution", (c.fields.resolutionDate ? UI.date(c.fields.resolutionDate) : "-") + (c.resolutionAge != null ? " (" + c.resolutionAge + " days old at registration)" : "")], ["Signatory affected", (c.fields.signatoryName || "-") + ", " + (c.fields.signatoryId || "-")], ["Effect when approved", c.effect || "-"]],
    panels(c) {
      const st = c.asv && c.asv.stamp, tick = (v) => '<div class="st ' + (v === "Yes" ? "pass" : "fail") + '">' + (v === "Yes" ? "Confirmed" : "Not confirmed") + "</div>";
      return '<section class="panel"><header>Mandate request checks</header><div class="body small"><div class="muted">Company checks (KYB)</div>' + tick(c.fields.kyb) + '<div class="muted" style="margin-top:6px">Identity checks (KYC)</div>' + tick(c.fields.kyc) + '<div class="muted" style="margin-top:6px">Board resolution attached</div>' + tick(c.fields.resolution) +
        '<div class="st ' + (!st ? "info" : st.found ? "pass" : "fail") + '" style="margin-top:8px">' + (!st ? "Company chop not checked yet" : st.found ? "Company chop found" : "Company chop not found") + '</div><div class="hint">A new signatory is not compared: there is no specimen on file yet.</div></div></section>';
    },
    approvalChecks: (c) => [[c.resolutionAge == null || (c.resolutionAge >= 0 && c.resolutionAge <= maxDays()), "Board resolution was within " + maxDays() + " days at registration"], [c.fields.kyb === "Yes" && c.fields.kyc === "Yes" && c.fields.resolution === "Yes", "KYB, KYC and board resolution confirmed"], [!c.asv || !c.asv.stamp || c.asv.stamp.found, c.asv && c.asv.stamp && !c.asv.stamp.found ? "Company chop not found on the scan (check the original)" : "Company chop found on the scan"]],
  };
})();
