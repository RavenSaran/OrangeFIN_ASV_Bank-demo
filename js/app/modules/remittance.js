/* Module: Remittance. Everything specific to this module lives here: the instruction type and its form fields, the approval levels,
   the process flow and guide wording shown on the Process overview, and the extra checks (use-case hooks) at the bottom. */
(function () {
  window.APP.TYPES.tt = {
    label: "Telegraphic transfer",
    long: "Telegraphic transfer application",
    form: "TTA-03",
    kind: "current",
    slaHours: 3,
    risk: "Fraudulent fund transfer",
    accountLabel: "Debit account",
    amountLabel: "Transfer amount",
    defaultCurrency: "USD",
    fields: [
      [
        "payee",
        "Beneficiary name",
        "text"
      ],
      [
        "bank",
        "Beneficiary bank",
        "text"
      ],
      [
        "bic",
        "BIC or SWIFT code",
        "text"
      ],
      [
        "country",
        "Destination country",
        "select:Singapore;Indonesia;Thailand;Hong Kong;China;Japan;India;United Kingdom;Germany;United States;Australia;United Arab Emirates;Myanmar;Iran;North Korea;Other"
      ],
      [
        "purposeCode",
        "Purpose code",
        "select:Trade payment;Services;Capital transfer;Salary;Family support"
      ],
      [
        "charges",
        "Charges",
        "select:SHA, shared;OUR, sender pays;BEN, beneficiary pays"
      ],
      [
        "cash",
        "Cash handed over at the counter (MYR), if any",
        "text",
        null,
        "",
        "",
        "opt"
      ],
      [
        "purpose",
        "Details of payment",
        "text",
        "full"
      ]
    ],
    module: "tt",
    prefix: "TTR",
    levels: [
      {
        n: 1,
        upTo: 200000,
        who: "Senior Operations Officer"
      },
      {
        n: 2,
        upTo: 2000000,
        who: "Branch Manager"
      },
      {
        n: 3,
        upTo: null,
        who: "Head of Operations"
      }
    ],
    registerLabel: "Register transfer",
    review: "Compliance review",
    checksTitle: "Transfer checks",
    actionLabels: {
      refer: "Refer to compliance review",
      fraud_clear: "Clear and send for approval",
      fraud_hold: "Hold for callback",
      fraud_confirm: "Reject as suspicious"
    }
  };
  window.APP.FLOWS.tt = {
    intro: "A company asks the bank to send money abroad. A person at the bank registers the signed application, the beneficiary is screened, ASV checks every signature against the remitter's mandate, and a second person approves before the transfer is released.",
    line: "Signed transfer application in. Beneficiary screened and signatures checked by ASV. A second person approves. Transfer released with a reference and value date.",
    io: {
      input: [
        "The signed transfer application (a scan)",
        "Beneficiary name, bank, BIC, country, purpose, amount and currency",
        "The remitter's signing mandate and signature specimens on file"
      ],
      process: [
        "Register; the BIC is validated and the beneficiary is screened against the watchlist",
        "ASV compares each signature with the specimen of a named signatory",
        "A flagged signature or a screening hit goes to compliance review",
        "The approver for the amount decides, before the 15:30 cut-off"
      ],
      output: [
        "Transfer released with a reference and a value date",
        "Or rejected, or returned to the customer, with the reason",
        "A complete audit trail, including the screening result"
      ]
    },
    lanes: [
      {
        key: "customer",
        label: "Customer",
        sub: "The remitting company"
      },
      {
        key: "maker",
        label: "Remittance Officer",
        sub: "Registers and submits"
      },
      {
        key: "asv",
        label: "ASV system",
        sub: "Checks signatures"
      },
      {
        key: "fraud",
        label: "Fraud and Compliance Analyst",
        sub: "Only when flagged"
      },
      {
        key: "approver",
        label: "Approver",
        sub: "By amount"
      },
      {
        key: "bank",
        label: "Payment system",
        sub: "Sends the transfer"
      }
    ],
    steps: [
      {
        lane: "customer",
        title: "Applies",
        text: "Signed transfer application with the beneficiary details."
      },
      {
        lane: "maker",
        title: "Registers and screens",
        text: "Enters it. The BIC is validated and the beneficiary is screened."
      },
      {
        lane: "asv",
        title: "Finds signatures",
        text: "Locates and crops each handwritten signature on the application."
      },
      {
        lane: "asv",
        title: "Checks the mandate",
        text: "Compares each signature with a named signatory and counts how many the rule needs."
      },
      {
        lane: "maker",
        title: "Submits or refers",
        text: "A match with clear screening is submitted. A flag or a screening hit is referred to review. If the mandate is not met, it goes back to the customer."
      },
      {
        lane: "fraud",
        title: "Reviews the flag or hit",
        text: "Calls back. Clearing it sends the case straight to approval; or hold it, or reject it.",
        optional: true
      },
      {
        lane: "approver",
        title: "Approves",
        text: "Level 1 up to MYR 200,000, Level 2 up to 2,000,000, Level 3 above."
      },
      {
        lane: "bank",
        title: "Releases",
        text: "Sent before the 15:30 cut-off, or next business day, with a reference."
      }
    ],
    outputs: [
      {
        tone: "pass",
        title: "Released",
        when: "Signatures match, screening is clear and the approver agrees",
        who: "Approver for the amount",
        output: "Transfer released with a reference and a value date",
        status: "Approved and released"
      },
      {
        tone: "pass",
        title: "Released after review",
        when: "A signature was flagged or the beneficiary hit the watchlist, then cleared",
        who: "Compliance analyst, then a Branch Manager or above",
        output: "Transfer released; the callback reference is on the record",
        status: "Approved and released"
      },
      {
        tone: "fail",
        title: "Rejected",
        when: "Forgery is confirmed, the beneficiary is not acceptable, or the approver declines",
        who: "Compliance analyst or approver",
        output: "Transfer stopped; the reason is recorded",
        status: "Rejected"
      },
      {
        tone: "neutral",
        title: "Returned to customer",
        when: "Too few signatures, or one person signed twice",
        who: "Remittance Officer",
        output: "Application returned to the company with the reason",
        status: "Returned to customer"
      },
      {
        tone: "wait",
        title: "Sent back for correction",
        when: "The approver finds a detail that does not match, such as the BIC and bank name",
        who: "Approver",
        output: "Case returns to the officer to correct and verify again",
        status: "Returned for correction"
      }
    ],
    track: [
      "Registered",
      "Screened and verified",
      "Compliance review",
      "Approval",
      "Released"
    ],
    nouns: {
      expected: "transfer released with a reference and value date.",
      done: "Transfer released to the payment system.",
      release: "Releases the transfer to the payment system and closes the case."
    },
    after: [
      "Next screen: ASV finds the signatures on your scan and compares them with the mandate.",
      "If they match and screening is clear, you submit for approval. A flag or a screening hit goes to compliance review.",
      "A second person approves. Output: the transfer is released with a reference and a value date."
    ]
  };
  window.APP.GUIDES.tt = {
    title: "How telegraphic transfers are verified",
    steps: [
      [
        "Receive",
        "The branch scans the signed transfer application and a Remittance Officer registers it with the beneficiary, bank, BIC and country."
      ],
      [
        "Check the details",
        "The BIC is validated and compared with the destination country. The beneficiary and country are screened against the watchlist."
      ],
      [
        "Extract",
        "ASV finds each handwritten signature on the application and crops it."
      ],
      [
        "Compare with the mandate",
        "Each signature is compared with the specimen of a named signatory. The remitter's mandate decides how many are needed."
      ],
      [
        "Review and approve",
        "A screening hit or a flagged signature goes to compliance review first. Then the approver for the amount releases the transfer before the cut-off."
      ]
    ],
    outcomes: [
      [
        "pass",
        "Likely match",
        "Every signature matches a signatory and the mandate is met. If screening is also clear, the transfer can be submitted for approval."
      ],
      [
        "flag",
        "Flagged or screening hit",
        "A signature scored below the pass score, or the beneficiary matched the watchlist. Compliance reviews it before anything is released."
      ],
      [
        "fail",
        "Mandate not met",
        "The signatures are genuine but too few, or one person signed twice. The application returns to the customer."
      ]
    ],
    who: [
      [
        "Remittance Officer",
        "Registers, verifies and submits."
      ],
      [
        "Fraud and Compliance Analyst",
        "Reviews flagged signatures and screening hits; clears with a callback or confirms forgery."
      ],
      [
        "Senior Operations Officer",
        "Approves up to MYR 200,000."
      ],
      [
        "Branch Manager",
        "Approves up to MYR 2,000,000 and all cleared overrides."
      ],
      [
        "Head of Operations",
        "Approves any amount."
      ],
      [
        "Internal Auditor",
        "Reads cases and the audit trail."
      ]
    ],
    extra: {
      title: "What makes this use case different",
      items: [
        "Cross-border: the beneficiary, bank, BIC, country and purpose are captured and checked.",
        "A screening hit stops the transfer even when every signature matches.",
        "The BIC must be valid and agree with the destination country.",
        "Transfers must be approved before the same-day cut-off of 15:30, or they take the next business day.",
        "Any currency is converted to MYR to choose the approval level."
      ]
    },
    limits: [
      "The system is only as good as the specimen on file. Compare each signature with the signatory the mandate requires.",
      "Screening in this demonstration uses a short made-up watchlist. A live system uses the bank's sanctions and AML screening service.",
      "Genuine signatures vary with writing conditions, age and scan quality. A low score is a reason to look closer, not proof of forgery.",
      "A transfer that has left the bank is hard to recall. A second person always approves."
    ]
  };
})();

/* ---- extra checks for this module ---- */
/* Remittance specifics: BIC validation, beneficiary screening, and the same-day cut-off. */
(function () {
  const esc = UI.esc, mcfg = () => (window.Cfg ? Cfg.settings.module : { cutoff: "15:30", screeningRule: "contains", watchlist: ["northgate metals", "volta shipping", "ashgar trading"] }); // cut-off, screening rule and watchlist come from Settings
  // Made-up watchlist for the demonstration. A live system calls the bank's screening service.
  const ISO = { Singapore: "SG", Indonesia: "ID", Thailand: "TH", "Hong Kong": "HK", China: "CN", Japan: "JP", India: "IN", "United Kingdom": "GB", Germany: "DE", "United States": "US", Australia: "AU", "United Arab Emirates": "AE" };
  const HIGH_RISK = ["Myanmar", "Iran", "North Korea"], fmt = (n) => Math.round(n).toLocaleString("en-US");
  // The day's transfers on this account, in MYR, not counting this case. Rejected and returned cases do not count.
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  function daily(acct, cases, myr, exceptId) {
    if (!acct) return null;
    const limit = mcfg().ttDailyLimit || 500000, today = cases.filter((c) => c.type === "tt" && c.accountNo === acct.no && c.id !== exceptId && sameDay(c.createdAt, Date.now()) && !["rejected", "returned"].includes(c.status)).reduce((n, c) => n + (c.myr || 0), 0);
    const total = today + (myr || 0);
    return { limit, before: today, total, exceeded: myr == null || total > limit };
  }
  const cashOf = (v) => Math.max(0, Number(String(v.cash || "").replace(/[^0-9.]/g, "")) || 0);
  const BIC = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  const bicOf = (v) => String(v || "").replace(/\s/g, "").toUpperCase();

  function screen(values) {
    const reasons = [], name = String(values.payee || "").toLowerCase();
    mcfg().watchlist.forEach((w) => { const lw = w.toLowerCase(), hit = mcfg().screeningRule === "exact" ? name.trim() === lw : name.includes(lw); if (hit) reasons.push("Beneficiary name matches a watchlist entry (" + w + ")"); });
    if (HIGH_RISK.includes(values.country)) reasons.push("Destination is a high-risk jurisdiction: enhanced AML/CFT due diligence applies");
    if (values.country === "Other") reasons.push("Destination is not in the standard list: enhanced due diligence applies");
    return { hit: reasons.length > 0, reasons, cleared: false, at: new Date().toISOString() };
  }
  function valueDate(from) {
    const d = new Date(from || Date.now()), cut = mcfg().cutoff.split(":").map(Number), late = d.getHours() * 60 + d.getMinutes() >= cut[0] * 60 + cut[1];
    if (late) d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return { iso: d.toISOString(), late };
  }
  const bicMatches = (f) => !ISO[f.country] || bicOf(f.bic).slice(4, 6) === ISO[f.country];

  (window.UseCase = window.UseCase || {}).tt = {
    registerChecks(values, acct, cases, ctx) {
      const out = [], b = bicOf(values.bic);
      if (b) out.push(BIC.test(b) ? (bicMatches(values) ? { tone: "ok", text: "BIC format is valid and agrees with " + esc(values.country) + "." } : { tone: "warn", text: "<b>BIC country " + esc(b.slice(4, 6)) + " does not match " + esc(values.country) + ".</b> Confirm the beneficiary bank with the customer." }) : { tone: "err", text: "BIC must be 8 or 11 letters and digits." });
      if (values.payee) { const s = screen(values); out.push(s.hit ? { tone: "warn", text: "<b>Screening hit.</b> " + s.reasons.map(esc).join(". ") + ". The case will need compliance review." } : { tone: "ok", text: "Beneficiary screening: no watchlist match." }); }
      const dl = acct ? daily(acct, cases, ctx && ctx.fx ? ctx.fx.myr : 0) : null;
      if (dl) out.push(dl.exceeded ? { tone: "warn", text: "<b>Daily limit exceeded.</b> Today's transfers on this account would reach MYR " + fmt(dl.total) + " against a limit of MYR " + fmt(dl.limit) + ". An analyst reviews it and approval is at Level 2 or above." } : { tone: "ok", text: "Daily limit: MYR " + fmt(dl.total) + " of " + fmt(dl.limit) + " used today with this transfer." });
      if (HIGH_RISK.includes(values.country)) out.push({ tone: "warn", text: "<b>High-risk destination.</b> Enhanced AML/CFT due diligence applies and the case goes to compliance review." });
      const cash = cashOf(values), cr = mcfg().cashReportFrom;
      if (cash > 0 && cr > 0 && cash >= cr) out.push({ tone: "info", text: "<b>Cash of MYR " + fmt(cash) + " is at or above the reporting threshold of " + fmt(cr) + ".</b> A cash transaction report applies." });
      const v = valueDate(); out.push({ tone: v.late ? "warn" : "info", text: v.late ? "After today's " + mcfg().cutoff + " cut-off. Value date " + UI.date(v.iso) + "." : "Same-day cut-off is " + mcfg().cutoff + ". Value date " + UI.date(v.iso) + "." });
      return out;
    },
    validate(values) { const e = BIC.test(bicOf(values.bic)) ? [] : ["The BIC must be 8 or 11 letters and digits."]; if (values.cash && !/^[0-9][0-9,]*(\.[0-9]+)?$/.test(String(values.cash).trim())) e.push("Cash handed over must be a number, or left blank."); return e; },
    onRegister(c, values, acct, cases) {
      c.fields.bic = bicOf(values.bic); c.screen = screen(values); c.valueDate = valueDate().iso;
      const rows = [["Compliance screening", c.screen.hit ? "Potential match: " + c.screen.reasons.join("; ") : "No match on the watchlist."]];
      const dl = daily(acct, cases, c.myr, c.id); c.dailyLimit = dl;
      if (dl && dl.exceeded) { c.minLevel = 2; c.mustReview = "the account's daily limit of MYR " + fmt(dl.limit) + " is exceeded (MYR " + fmt(dl.total) + " today with this transfer)."; rows.push(["Daily limit exceeded", "MYR " + fmt(dl.total) + " against MYR " + fmt(dl.limit) + ". Analyst review and Level 2 or above."]); }
      const cash = cashOf(values); if (cash > 0) { c.cash = cash; c.cashReport = mcfg().cashReportFrom > 0 && cash >= mcfg().cashReportFrom; if (c.cashReport) rows.push(["Cash transaction report", "Cash of MYR " + fmt(cash) + " is at or above the reporting threshold."]); }
      return rows;
    },
    rows: (c) => [["Beneficiary bank", (c.fields.bank || "-") + " (" + (c.fields.bic || "-") + ")"], ["Destination", c.fields.country || "-"], ["Purpose", c.fields.purposeCode || "-"], ["Charges", c.fields.charges || "-"], ["Value date", c.valueDate ? UI.date(c.valueDate) : "Same day"], ["Cash handed over", c.cash ? "MYR " + fmt(c.cash) + (c.cashReport ? " (cash transaction report)" : "") : "None"]],
    banner(c) {
      if (!c.screen || !c.screen.hit || c.screen.cleared || c.status !== "asv_pass") return "";
      return '<div class="msg warn" role="alert"><b>Screening hit.</b> The signatures match, but the beneficiary needs compliance review before this can be submitted. Use Refer to compliance review.</div>';
    },
    panels(c) {
      if (!c.screen) return "";
      const dl = c.dailyLimit, dlPanel = dl ? '<section class="panel"><header>Daily limit</header><div class="body small"><div class="st ' + (dl.exceeded ? "flag" : "pass") + '">' + (dl.exceeded ? "Daily limit exceeded" : "Within the daily limit") + '</div><div class="muted" style="margin-top:4px">MYR ' + fmt(dl.total) + " of " + fmt(dl.limit) + " today on this account, including this transfer." + (c.cashReport ? " A cash transaction report applies." : "") + "</div></div></section>" : "";
      const s = c.screen, tone = !s.hit ? "pass" : s.cleared ? "pass" : "flag";
      return dlPanel + '<section class="panel"><header>Beneficiary screening</header><div class="body small"><div class="st ' + tone + '">' + (!s.hit ? "Clear" : s.cleared ? "Hit cleared in review" : "Potential match") + "</div>" +
        (s.hit ? '<ul style="margin:8px 0 0;padding-left:18px">' + s.reasons.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul>" : '<div class="muted" style="margin-top:4px">No match on the watchlist at registration.</div>') +
        '<div class="hint">Screened ' + UI.dt(s.at) + ". Demonstration watchlist.</div></div></section>";
    },
    approvalChecks: (c) => [[!c.screen || !c.screen.hit || c.screen.cleared, !c.screen || !c.screen.hit ? "Beneficiary screening is clear" : c.screen.cleared ? "Screening hit cleared in compliance review" : "Screening hit not yet cleared"], [bicMatches(c.fields), "BIC agrees with the destination country"], [!c.dailyLimit || !c.dailyLimit.exceeded || c.level >= 2, !c.dailyLimit || !c.dailyLimit.exceeded ? "Within the account's daily limit" : "Daily limit exceeded: Level 2 or above required"]],
  };
})();
