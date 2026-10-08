/* Module: Corporate payments. Everything specific to this module lives here: the instruction type and its form fields, the approval levels,
   the process flow and guide wording shown on the Process overview, and the extra checks (use-case hooks) at the bottom. */
(function () {
  window.APP.TYPES.payment = {
    label: "Corporate payment",
    long: "Corporate payment instruction",
    form: "CPI-01",
    kind: "current",
    slaHours: 4,
    risk: "Unauthorised company payment",
    accountLabel: "Debit account",
    amountLabel: "Payment amount",
    defaultCurrency: "MYR",
    fields: [
      [
        "payee",
        "Payee or beneficiary",
        "text"
      ],
      [
        "reference",
        "Invoice or payment reference",
        "text"
      ],
      [
        "purpose",
        "Payment purpose",
        "text",
        "full"
      ]
    ],
    module: "pay",
    prefix: "PAY",
    levels: [
      {
        n: 1,
        upTo: 100000,
        who: "Senior Operations Officer"
      },
      {
        n: 2,
        upTo: 1000000,
        who: "Branch Manager"
      },
      {
        n: 3,
        upTo: null,
        who: "Head of Operations"
      }
    ],
    registerLabel: "Register payment",
    review: "Fraud review",
    checksTitle: "Payment checks"
  };
  window.APP.FLOWS.payment = {
    intro: "A company asks the bank to pay a supplier. A person at the bank registers the signed instruction, ASV checks every signature against the company's signing mandate, and a second person approves before any money moves.",
    line: "Signed payment instruction in. ASV checks each signature against the company's mandate. A second person approves. Payment released with a reference.",
    io: {
      input: [
        "The signed payment instruction (a scan)",
        "The company's debit account, payee, invoice reference and amount",
        "The signing mandate and signature specimens already on file"
      ],
      process: [
        "Register the case; a duplicate payment check runs",
        "ASV finds each signature and compares it with the specimen of a named signatory",
        "A flagged signature goes to fraud review for a callback",
        "The approver for the amount decides; never the person who registered or cleared it"
      ],
      output: [
        "Payment released to core banking, with a reference",
        "Or rejected, or returned to the customer, with the reason",
        "A complete audit trail of every step"
      ]
    },
    lanes: [
      {
        key: "customer",
        label: "Customer",
        sub: "The company"
      },
      {
        key: "maker",
        label: "Payments Operations Officer",
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
        label: "Core banking",
        sub: "Releases the payment"
      }
    ],
    steps: [
      {
        lane: "customer",
        title: "Sends instruction",
        text: "Signed payment instruction with the invoice."
      },
      {
        lane: "maker",
        title: "Registers it",
        text: "Enters it on the debit account. A duplicate payment check runs."
      },
      {
        lane: "asv",
        title: "Finds signatures",
        text: "Locates and crops each handwritten signature on the scan."
      },
      {
        lane: "asv",
        title: "Checks the mandate",
        text: "Compares each signature with a named signatory and counts how many the rule needs."
      },
      {
        lane: "maker",
        title: "Submits or refers",
        text: "A match is submitted. A flag is referred to review. If the mandate is not met, it goes back to the customer."
      },
      {
        lane: "fraud",
        title: "Reviews the flag",
        text: "Calls the signatory back. Clearing it sends the case straight to approval; or hold it, or confirm forgery.",
        optional: true
      },
      {
        lane: "approver",
        title: "Approves",
        text: "Level 1 up to MYR 100,000, Level 2 up to 1,000,000, Level 3 above."
      },
      {
        lane: "bank",
        title: "Releases",
        text: "Payment released with a reference. The audit trail is updated."
      }
    ],
    outputs: [
      {
        tone: "pass",
        title: "Released",
        when: "Signatures match, the mandate is met and the approver agrees",
        who: "Approver for the amount",
        output: "Payment released to core banking with a reference number",
        status: "Approved and released"
      },
      {
        tone: "pass",
        title: "Released after review",
        when: "A signature was flagged, then cleared after a callback",
        who: "Fraud analyst, then a Branch Manager or above",
        output: "Payment released; the callback reference is on the record",
        status: "Approved and released"
      },
      {
        tone: "fail",
        title: "Rejected",
        when: "The analyst confirms a forgery, or the approver declines",
        who: "Fraud analyst or approver",
        output: "Payment stopped; a suspected forgery is recorded for follow-up",
        status: "Rejected"
      },
      {
        tone: "neutral",
        title: "Returned to customer",
        when: "Too few signatures, or one person signed twice",
        who: "Payments Operations Officer",
        output: "Instruction returned to the company with the reason",
        status: "Returned to customer"
      },
      {
        tone: "wait",
        title: "Sent back for correction",
        when: "The approver finds a detail that does not match, such as the payee name",
        who: "Approver",
        output: "Case returns to the officer to correct and verify again",
        status: "Returned for correction"
      }
    ],
    track: [
      "Registered",
      "Signatures checked",
      "Fraud review",
      "Approval",
      "Released"
    ],
    nouns: {
      expected: "payment released to core banking with a reference.",
      done: "Payment released to core banking.",
      release: "Releases the payment to core banking and closes the case."
    },
    after: [
      "Next screen: ASV finds the signatures on your scan and compares them with the mandate.",
      "If they match, you submit the case for approval. If one is flagged, you refer it to fraud review.",
      "A second person approves. Output: the payment is released with a reference."
    ]
  };
  window.APP.GUIDES.payment = {
    title: "How corporate payment authorisation works",
    steps: [
      [
        "Receive",
        "The branch scans the signed payment instruction and a Payments Operations Officer registers it against the company's debit account."
      ],
      [
        "Check the payment",
        "The system flags a possible duplicate (same payee and reference, or the same payee and amount) before the case is registered."
      ],
      [
        "Extract",
        "ASV finds each handwritten signature on the scan and crops it. The officer unticks anything that is not a signature."
      ],
      [
        "Compare with the mandate",
        "Each signature is compared with the specimen of a named signatory. The company's signing rule decides how many are needed, and it can change with the amount."
      ],
      [
        "Approve",
        "A match goes to the approver for the amount. A flag goes to fraud review first, and a cleared flag needs at least a Branch Manager."
      ]
    ],
    outcomes: [
      [
        "pass",
        "Likely match",
        "Every signature matches a signatory and the signing rule is met. The payment can be submitted for approval."
      ],
      [
        "flag",
        "Flagged",
        "A signature scored below the pass score or could not be compared reliably. A fraud analyst reviews it and may clear it after a callback."
      ],
      [
        "fail",
        "Mandate not met",
        "The signatures are genuine but too few, or one person signed twice. The instruction returns to the customer."
      ]
    ],
    who: [
      [
        "Payments Operations Officer",
        "Registers, verifies and submits."
      ],
      [
        "Fraud and Compliance Analyst",
        "Reviews flagged signatures; clears with a callback or confirms forgery."
      ],
      [
        "Senior Operations Officer",
        "Approves up to MYR 100,000."
      ],
      [
        "Branch Manager",
        "Approves up to MYR 1,000,000 and all fraud-cleared payments."
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
        "Company accounts have signing mandates such as any 2 of 3, both directors, or one signatory up to a limit.",
        "The same person signing twice does not count as two signatures.",
        "Amounts in any currency are converted to MYR to choose the approval level.",
        "A duplicate payment check runs before registration."
      ]
    },
    limits: [
      "The system is only as good as the specimen on file. Compare each signature with the signatory the mandate requires.",
      "Genuine signatures vary with writing conditions, age and scan quality. A low score is a reason to look closer, not proof of forgery.",
      "Scans carry no pen pressure, speed or stroke order.",
      "A score never authorises a payment. A second person always approves."
    ]
  };
})();

/* ---- extra checks for this module ---- */
/* Corporate payment specifics: the duplicate payment check and the payee history. */
(function () {
  const esc = UI.esc, A = APP;
  const norm = (s) => String(s || "").trim().toLowerCase();
  // A possible duplicate: same account and payee with the same reference, or the same payee and amount within 30 days.
  function duplicates(values, acct, cases) {
    const payee = norm(values.payee), ref = norm(values.reference), amt = Number(values.amount) || 0, cur = String(values.currency || "").toUpperCase();
    if (!acct || !payee) return [];
    return cases.filter((c) => c.accountNo === acct.no && norm(c.fields.payee) === payee && !["rejected", "returned"].includes(c.status) &&
      ((ref && norm(c.fields.reference) === ref) || (c.amount === amt && c.currency === cur && Date.now() - new Date(c.createdAt) < (window.Cfg ? Cfg.settings.process.duplicateDays : 30) * 864e5)));
  }
  const history = (c, cases) => cases.filter((x) => x.id !== c.id && x.accountNo === c.accountNo && norm(x.fields.payee) === norm(c.fields.payee) && x.status === "approved");

  (window.UseCase = window.UseCase || {}).payment = {
    accountRows: (a) => [["Mandate", a.mandate.rule === "all" ? "All signatories" : a.mandate.tier ? "Tiered by amount" : "Any " + a.mandate.n]],
    registerChecks(values, acct, cases) {
      const out = [], d = duplicates(values, acct, cases);
      if (d.length) out.push({ tone: "warn", text: "<b>Possible duplicate.</b> " + esc(d[0].id) + " has the same payee and " + (norm(d[0].fields.reference) === norm(values.reference) ? "payment reference" : "amount") + ". Confirm with the customer before registering." });
      else if (values.payee) out.push({ tone: "ok", text: "No duplicate payment found for this payee." });
      const paid = acct && values.payee ? cases.filter((c) => c.accountNo === acct.no && norm(c.fields.payee) === norm(values.payee) && c.status === "approved").length : 0;
      if (acct && values.payee) out.push({ tone: "info", text: paid ? "Payee paid " + paid + " time" + (paid > 1 ? "s" : "") + " before from this account." : "First payment to this payee from this account." });
      return out;
    },
    onRegister(c, values, acct, cases) {
      const d = duplicates(values, acct, cases);
      if (d.length) { c.dup = d[0].id; return [["Duplicate payment warning", "Possible duplicate of " + d[0].id + "."]]; }
      return [];
    },
    rows: (c) => [["Invoice or reference", c.fields.reference || "-"], ["Purpose", c.fields.purpose || "-"]],
    panels(c) {
      const h = history(c, DB.cases());
      return '<section class="panel"><header>Payment checks</header><div class="body small">' +
        (c.dup ? '<div class="msg warn">Possible duplicate of <a href="case.html?id=' + esc(c.dup) + '">' + esc(c.dup) + "</a>.</div>" : '<div class="st pass">No duplicate found at registration</div>') +
        '<div class="muted" style="margin-top:6px">' + (h.length ? "Paid to this payee before: " + h.length + ", latest " + UI.date(h[0].createdAt) + "." : "No earlier approved payments to this payee.") + "</div></div></section>";
    },
    approvalChecks: (c) => [[!c.dup, c.dup ? "Possible duplicate of " + esc(c.dup) + " (check before approving)" : "No duplicate payment found"]],
  };
})();
