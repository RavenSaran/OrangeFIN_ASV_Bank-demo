/* Module kit: builds the standard process flow, outcomes and guide that every ASV module shares (register, ASV on the scan, review if flagged,
   approval, release), from the few words that are specific to a module. A module file supplies its own type, form fields and checks. */
(function () {
  const A = window.APP;
  const fmt = (n) => Number(n).toLocaleString("en-US");
  const lvlText = (levels) => levels.map((l, i, a) => "Level " + l.n + (l.upTo == null ? " above MYR " + fmt(a[i - 1].upTo) : " up to MYR " + fmt(l.upTo))).join(", ");

  // o: wording for one module. Returns { flow, guide } ready to assign to APP.FLOWS[type] and APP.GUIDES[type].
  A.moduleKit = function (type, o) {
    const levels = A.TYPES[type].levels, rev = A.TYPES[type].review || "Review";
    const flow = {
      intro: o.intro, line: o.line,
      io: { input: o.input, process: o.process, output: o.output },
      lanes: [
        { key: "customer", label: "Customer", sub: o.customerSub || "The company" },
        { key: "maker", label: o.makerTitle, sub: "Registers and submits" },
        { key: "asv", label: "ASV system", sub: "Checks signatures" + (A.TYPES[type].chop ? " and the chop" : "") },
        { key: "fraud", label: "Fraud and Compliance Analyst", sub: "Only when flagged or escalated" },
        { key: "approver", label: "Approver", sub: o.approverSub || "By level" },
        { key: "bank", label: o.bankLane || "Core banking", sub: o.bankSub },
      ],
      steps: [
        { lane: "customer", title: o.sendTitle || "Sends the request", text: o.sendText },
        { lane: "maker", title: "Registers it", text: o.registerText },
        { lane: "asv", title: "Finds signatures", text: "Locates and crops each handwritten signature on the scan" + (A.TYPES[type].chop ? ", and looks for the company chop." : ".") },
        { lane: "asv", title: "Checks the mandate", text: o.mandateText },
        { lane: "maker", title: "Submits or refers", text: "A match is submitted. A flag is referred to review. If the mandate is not met, it goes back to the customer." },
        { lane: "fraud", title: "Reviews", text: o.reviewText, optional: true },
        { lane: "approver", title: "Approves", text: o.approveText || (lvlText(levels) + ".") },
        { lane: "bank", title: o.releaseTitle || "Releases", text: o.releaseText },
      ],
      outputs: [
        { tone: "pass", title: o.doneTitle || "Released", when: "Signatures match, the mandate is met and the approver agrees", who: "Approver for the level", output: o.doneOutput, status: "Approved and released" },
        { tone: "pass", title: "Released after review", when: o.afterReviewWhen || "A check flagged it, then an analyst cleared it after a callback", who: "Fraud analyst, then a Branch Manager or above", output: o.doneOutput + "; the callback reference is on the record", status: "Approved and released" },
        { tone: "fail", title: "Rejected", when: "The analyst confirms a forgery or a failed check, or the approver declines", who: "Fraud analyst or approver", output: "Nothing is released; a suspected forgery is recorded for follow-up", status: "Rejected" },
        { tone: "neutral", title: "Returned to customer", when: "Too few signatures, or one person signed twice", who: o.makerTitle, output: "The request is returned to the company with the reason", status: "Returned to customer" },
        { tone: "wait", title: "Sent back for correction", when: "The approver finds a detail that does not match", who: "Approver", output: "The case returns to the officer to correct and verify again", status: "Returned for correction" },
      ],
      track: ["Registered", "Signatures checked", rev, "Approval", o.trackEnd || "Released"],
      nouns: { expected: o.expected, done: o.done, release: o.releaseNoun },
      after: ["Next screen: ASV finds the signatures on your scan" + (A.TYPES[type].chop ? " and looks for the company chop" : "") + ".", "If they match, you submit the case for approval. If one is flagged, you refer it for review.", "A second person approves. Output: " + o.expected],
      glance: o.glance,
    };
    const guide = {
      title: "How " + o.guideName + " works",
      steps: o.guideSteps,
      outcomes: [
        ["pass", "Likely match", "Every signature matches a signatory, the signing rule is met" + (A.TYPES[type].chop ? " and the company chop is on the scan" : "") + ". It can be submitted for approval."],
        ["flag", "Flagged", "A signature scored below the pass score, could not be compared reliably" + (A.TYPES[type].chop ? ", or the company chop was not found" : "") + ". An analyst reviews it and may clear it after a callback."],
        ["fail", "Mandate not met", "The signatures are genuine but too few, or one person signed twice. The request returns to the customer."],
      ],
      who: [
        [o.makerTitle, "Registers, verifies and submits."],
        ["Fraud and Compliance Analyst", "Reviews flagged cases; clears with a callback or confirms forgery."],
        ["Senior Operations Officer", "Approves Level 1" + (A.TYPES[type].minLevel > 1 ? " (not used: this module starts at Level " + A.TYPES[type].minLevel + ")" : " up to MYR " + fmt(levels[0].upTo)) + "."],
        ["Branch Manager", "Approves Level 2 and every case cleared after a flag."],
        ["Head of Operations", "Approves any amount."],
        ["Internal Auditor", "Reads cases and the audit trail."],
      ],
      extra: o.extra,
      limits: [
        "The system is only as good as the specimen on file. Compare each signature with the signatory the mandate requires.",
        "Genuine signatures vary with writing conditions, age and scan quality. A low score is a reason to look closer, not proof of forgery.",
        "Scans carry no pen pressure, speed or stroke order." + (A.TYPES[type].chop ? " The chop check finds a stamp; it does not tell whether it is the right one." : ""),
        "A score never authorises a request. A second person always approves.",
      ],
    };
    return { flow, guide };
  };
})();
