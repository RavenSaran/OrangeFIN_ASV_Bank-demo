/* Module: Fixed deposits. Everything specific to this module lives here: the instruction type and its form fields, the approval levels,
   the process flow and guide wording shown on the Process overview, and the extra checks (use-case hooks) at the bottom. */
(function () {
  window.APP.TYPES.fd = {
    label: "Fixed deposit upliftment",
    long: "Fixed deposit upliftment request",
    form: "FDU-07",
    kind: "fd",
    slaHours: 24,
    risk: "Fraudulent withdrawal",
    accountLabel: "Fixed deposit account",
    amountLabel: "Principal to uplift",
    defaultCurrency: "MYR",
    fields: [
      [
        "instruction",
        "Instruction",
        "select:Early withdrawal;Rollover for 12 months;Withdrawal at maturity",
        "full"
      ],
      [
        "credit",
        "Credit proceeds to account",
        "text"
      ],
      [
        "presented",
        "Presented by",
        "select:Account holder in person;Authorised representative"
      ],
      [
        "idSighted",
        "Identity check",
        "checkbox",
        "full",
        "No",
        "The holder's NRIC or passport was sighted and matches the account",
        "req"
      ]
    ],
    module: "fd",
    prefix: "FDU",
    levels: [
      {
        n: 1,
        upTo: 100000,
        who: "Senior Operations Officer"
      },
      {
        n: 2,
        upTo: null,
        who: "Branch Manager"
      }
    ],
    registerLabel: "Register upliftment",
    review: "Fraud review",
    checksTitle: "Upliftment checks"
  };
  window.APP.FLOWS.fd = {
    intro: "A customer comes to the counter to withdraw or roll over a fixed deposit. The officer checks identity and registers the request, ASV checks the holders' signatures against the account rule, and a second person approves the payout.",
    line: "Customer signs a request at the counter. Identity is sighted. ASV checks the holders' signatures. A second person approves. Payout credited or deposit renewed.",
    io: {
      input: [
        "The signed upliftment request (a scan)",
        "The deposit, the instruction (early withdrawal, rollover or at maturity) and the amount",
        "The holders' specimens and the account rule (both holders, or either)"
      ],
      process: [
        "Sight the holder's identity, then register",
        "The payout is worked out, including the interest reduction for early withdrawal",
        "ASV compares each signature with the named holder's specimen",
        "A flagged signature goes to fraud review; then a second person approves"
      ],
      output: [
        "Payout credited to the customer's account, or the deposit renewed for 12 months",
        "Or rejected, or returned to the customer, with the reason",
        "A complete audit trail of every step"
      ]
    },
    lanes: [
      {
        key: "customer",
        label: "Customer",
        sub: "At the counter"
      },
      {
        key: "maker",
        label: "Customer Service Officer",
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
        sub: "Pays out or renews"
      }
    ],
    steps: [
      {
        lane: "customer",
        title: "Asks and signs",
        text: "Asks to withdraw or roll over, and signs the request. Shows ID."
      },
      {
        lane: "maker",
        title: "Sights ID, registers",
        text: "Confirms identity and enters the request. The payout is worked out."
      },
      {
        lane: "asv",
        title: "Finds signatures",
        text: "Locates and crops each holder's signature on the request."
      },
      {
        lane: "asv",
        title: "Checks the account rule",
        text: "Compares each signature with a named holder; both holders or either, as the account requires."
      },
      {
        lane: "maker",
        title: "Submits or refers",
        text: "A match is submitted. A flag is referred to review. If a required holder is missing, it goes back to the customer."
      },
      {
        lane: "fraud",
        title: "Reviews the flag",
        text: "Calls the holder back. Clearing it sends the request straight to approval; or hold it, or confirm forgery.",
        optional: true
      },
      {
        lane: "approver",
        title: "Approves",
        text: "Senior Operations Officer up to MYR 100,000; Branch Manager above."
      },
      {
        lane: "bank",
        title: "Pays out or renews",
        text: "Payout credited, or the deposit renewed, with a reference."
      }
    ],
    outputs: [
      {
        tone: "pass",
        title: "Paid out or renewed",
        when: "Required holders' signatures match and the approver agrees",
        who: "Approver for the amount",
        output: "Payout credited to the customer's account, or the deposit renewed, with a reference",
        status: "Approved and released"
      },
      {
        tone: "pass",
        title: "Paid out after review",
        when: "A signature was flagged, then cleared after a callback to the holder",
        who: "Fraud analyst, then the Branch Manager",
        output: "Payout credited; the callback reference is on the record",
        status: "Approved and released"
      },
      {
        tone: "fail",
        title: "Rejected",
        when: "The analyst confirms a forgery, or the approver declines",
        who: "Fraud analyst or approver",
        output: "No money moves; a suspected forgery is recorded",
        status: "Rejected"
      },
      {
        tone: "neutral",
        title: "Returned to customer",
        when: "A joint account needs both holders and one did not sign",
        who: "Customer Service Officer",
        output: "Customer asked to return with the other holder",
        status: "Returned to customer"
      },
      {
        tone: "wait",
        title: "Sent back for correction",
        when: "The approver finds a detail that does not match, such as the credit account",
        who: "Approver",
        output: "Case returns to the officer to correct and verify again",
        status: "Returned for correction"
      }
    ],
    track: [
      "Counter request",
      "Signatures checked",
      "Fraud review",
      "Approval",
      "Paid out"
    ],
    nouns: {
      expected: "payout credited or deposit renewed, with a reference.",
      done: "Payout credited or deposit renewed.",
      release: "Credits the payout or renews the deposit, and closes the case."
    },
    after: [
      "Next screen: ASV finds each holder's signature on the request and compares it with the specimen.",
      "If the account rule is met you submit for approval. If a signature is flagged you refer it to fraud review.",
      "A second person approves. Output: the payout is credited, or the deposit is renewed."
    ]
  };
  window.APP.GUIDES.fd = {
    title: "How fixed deposit upliftment works",
    steps: [
      [
        "Serve the customer",
        "The Customer Service Officer sights the holder's identity, takes the signed request and registers it against the deposit."
      ],
      [
        "Check the amount",
        "The system works out the payout, including the interest reduction on early withdrawal, and blocks a request that would leave less than MYR 5,000 in the deposit."
      ],
      [
        "Extract",
        "ASV finds each handwritten signature on the request and crops it."
      ],
      [
        "Compare with the holders",
        "Each signature is compared with the specimen of a named holder. Joint accounts follow their own rule: both must sign, or either may sign."
      ],
      [
        "Approve",
        "A match goes to the Senior Operations Officer, or the Branch Manager for larger amounts. A flag goes to fraud review first."
      ]
    ],
    outcomes: [
      [
        "pass",
        "Likely match",
        "Every required holder's signature matches and the account rule is met. The request can be submitted for approval."
      ],
      [
        "flag",
        "Flagged",
        "A signature scored below the pass score. A fraud analyst reviews it and may clear it after calling the holder back."
      ],
      [
        "fail",
        "Mandate not met",
        "The signatures are genuine but the account rule is not met, for example one holder signed on a both-to-sign account. The request returns to the customer."
      ]
    ],
    who: [
      [
        "Customer Service Officer",
        "Sights ID, registers, verifies and submits."
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
        "Approves above MYR 100,000 and all fraud-cleared requests."
      ],
      [
        "Internal Auditor",
        "Reads cases and the audit trail."
      ]
    ],
    extra: {
      title: "What makes this use case different",
      items: [
        "The customer is at the counter, so identity is checked in person before registration.",
        "Early withdrawal pays only half of the interest earned so far. The system shows the payout before approval.",
        "A request presented by a representative needs the holder's signed authority letter. ASV does not replace that.",
        "Joint deposits follow the account rule: both holders, or either holder.",
        "Closed accounts and deposits that would be left below MYR 5,000 cannot be registered."
      ]
    },
    limits: [
      "The system is only as good as the specimen on file. Compare each signature with the holder the account rule requires.",
      "Genuine signatures vary with writing conditions, age and scan quality. A low score is a reason to look closer, not proof of forgery.",
      "Scans carry no pen pressure, speed or stroke order.",
      "A score never authorises a withdrawal. A second person always approves."
    ]
  };
})();

/* ---- extra checks for this module ---- */
/* Fixed deposit specifics: the payout calculation, identity and representative checks, and the minimum balance rule. */
(function () {
  const esc = UI.esc, A = APP, fdc = () => (window.Cfg ? Cfg.settings.module : { minLeft: 5000, interestKeptPct: 50 }); // minimum balance and interest kept come from Settings
  const money = (n, cur) => UI.money(Math.round(n * 100) / 100, cur);
  // Payout for uplifting `amount` of principal. Early withdrawal keeps half of the interest earned on that principal.
  function payout(acct, amount, instruction) {
    const P = acct.principal, I = acct.accrued, u = Math.min(Number(amount) || 0, P), share = P ? I * u / P : 0;
    const early = instruction === "Early withdrawal" || (instruction === "Withdrawal at maturity" && new Date(acct.maturity) > new Date());
    const rollover = instruction === "Rollover for 12 months", penalty = early ? share * (1 - fdc().interestKeptPct / 100) : 0;
    return { principal: u, interest: share, penalty, net: rollover ? 0 : u + share - penalty, left: P - u, early, rollover, notMatured: instruction === "Withdrawal at maturity" && early };
  }
  const acctOf = (c) => A.ACCOUNTS.find((a) => a.no === c.accountNo);

  (window.UseCase = window.UseCase || {}).fd = {
    accountRows: (a) => [["Principal", money(a.principal, a.currency)], ["Interest accrued", money(a.accrued, a.currency)], ["Matures", UI.date(a.maturity)], ["Rate", a.rate]],
    registerChecks(values, acct) {
      const out = [], amt = Number(values.amount) || 0;
      if (!acct) return out;
      if (amt > 0) {
        const p = payout(acct, amt, values.instruction || "Early withdrawal");
        if (p.rollover) out.push({ tone: "info", text: "Rollover: " + money(p.principal, acct.currency) + " renewed for 12 months. No cash is paid out." });
        else out.push({ tone: p.early ? "warn" : "ok", text: "<b>Net payout " + money(p.net, acct.currency) + ".</b> Principal " + money(p.principal, acct.currency) + ", interest " + money(p.interest, acct.currency) + (p.penalty ? ", less early withdrawal reduction " + money(p.penalty, acct.currency) : "") + ". Remaining in deposit " + money(p.left, acct.currency) + "." });
        if (p.notMatured) out.push({ tone: "warn", text: "This deposit matures on " + UI.date(acct.maturity) + ". Treated as an early withdrawal." });
      }
      if (values.presented === "Authorised representative") out.push({ tone: "warn", text: "<b>Representative.</b> Attach the holder's signed authority letter and check the representative's ID. ASV compares the holder's signature on the letter, not the representative's." });
      if (values.idSighted !== "Yes") out.push({ tone: "info", text: "Identity must be sighted and confirmed before the request can be registered." });
      return out;
    },
    validate(values, acct, ctx) {
      const e = [], amt = ctx.amt;
      if (ctx.cur !== acct.currency) e.push("This deposit is held in " + acct.currency + ". Enter the amount in " + acct.currency + ".");
      if (amt > acct.principal) e.push("The amount is more than the principal of " + money(acct.principal, acct.currency) + ".");
      else if (amt > 0 && acct.principal - amt > 0 && acct.principal - amt < fdc().minLeft) e.push("The deposit would be left with " + money(acct.principal - amt, acct.currency) + ". Uplift the full principal or leave at least " + money(fdc().minLeft, acct.currency) + ".");
      return e;
    },
    rows: (c) => [["Instruction", c.fields.instruction], ["Presented by", c.fields.presented], ["Identity sighted", c.fields.idSighted === "Yes" ? "Yes" : "No"], ["Net payout", payoutText(c)]],
    panels(c) {
      const a = acctOf(c), p = payout(a, c.amount, c.fields.instruction), cur = a.currency;
      return '<section class="panel"><header>Payout estimate</header><div class="body flush"><table class="grid"><tbody>' +
        "<tr><td>Principal uplifted</td><td class=\"r\">" + esc(money(p.principal, cur)) + "</td></tr><tr><td>Interest earned on it</td><td class=\"r\">" + esc(money(p.interest, cur)) + "</td></tr>" +
        (p.penalty ? '<tr><td>Early withdrawal reduction</td><td class="r">-' + esc(money(p.penalty, cur)) + "</td></tr>" : "") +
        "<tr><td><b>" + (p.rollover ? "Renewed for 12 months" : "Net payout") + '</b></td><td class="r"><b>' + esc(p.rollover ? money(p.principal, cur) : money(p.net, cur)) + "</b></td></tr>" +
        '<tr><td class="muted">Left in deposit</td><td class="r muted">' + esc(money(p.left, cur)) + "</td></tr></tbody></table></div></section>" +
        (c.fields.presented === "Authorised representative" ? '<div class="msg warn">Presented by an authorised representative. The holder\'s authority letter must be on file.</div>' : "");
    },
    approvalChecks: (c) => [[c.fields.idSighted === "Yes", "Holder's identity was sighted at the counter"], [c.fields.presented !== "Authorised representative", c.fields.presented === "Authorised representative" ? "Presented by a representative: confirm the authority letter" : "Holder presented in person"]],
  };
  function payoutText(c) { const a = acctOf(c), p = payout(a, c.amount, c.fields.instruction); return p.rollover ? "Rollover, no payout" : money(p.net, a.currency); }
})();
