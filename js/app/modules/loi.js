/* Module: Branch transactions and Letter of Instruction (LOI). A company hands in a signed letter for an ad-hoc change or inquiry on its account.
   Use case 1 of the four banking use cases. Everything specific to it lives here: the form, the rules by request type, the flow and the extra checks. */
(function () {
  const A = window.APP, MAJOR = ["Change of registered address", "Standing instruction or auto-debit", "Account closure"];
  const isMajor = (f) => MAJOR.includes(f.requestType);

  A.TYPES.loi = {
    label: "Letter of instruction",
    long: "Letter of instruction (LOI)",
    form: "LOI-01",
    kind: "current",
    slaHours: 4,
    risk: "Unauthorised change on a company account",
    accountLabel: "Company account",
    amountLabel: "Amount involved, if any",
    amountOptional: true,
    defaultCurrency: "MYR",
    fields: [
      ["requestType", "Type of request", "select:Change of registered address;Change of contact details;Standing instruction or auto-debit;Cheque book or statement request;Account closure;Payment by letter"],
      ["purpose", "Request purpose", "text", "full"],
      ["details", "Request details", "text", "full"],
    ],
    module: "loi", prefix: "LOI", chop: true, minLevelFor: (f) => (isMajor(f) ? 2 : 1),
    // A major change needs the account's full signing requirement. A routine request needs one signatory, unless the rule is "all".
    // A payment by letter follows the normal rule for its amount.
    sigsFor: (f, account, myr, full) => (f.requestType === "Payment by letter" ? null : isMajor(f) ? full : account.mandate.rule === "all" ? full : 1),
    levels: [{ n: 1, upTo: 100000, who: "Senior Operations Officer" }, { n: 2, upTo: 1000000, who: "Branch Manager" }, { n: 3, upTo: null, who: "Head of Operations" }],
    registerLabel: "Register letter", review: "Compliance review", checksTitle: "Letter checks",
  };

  const kit = A.moduleKit("loi", {
    intro: "A company writes to the bank to change something on its account or to ask for something. A person at the bank registers the signed letter, ASV checks every signature against the signing mandate and looks for the company chop, and a second person approves before the bank acts.",
    line: "Signed letter in. ASV checks each signature and the company chop. A second person approves. The bank then acts on the request.",
    input: ["The signed letter of instruction with the company chop (a scan)", "The company's account, the type of request, its purpose and details", "The signing mandate and signature specimens already on file"],
    process: ["Register the case and classify the request as routine or a major change", "ASV finds each signature, compares it with a named signatory and looks for the company chop", "A flag goes to review for a callback; a major change needs the full signing requirement", "The approver for the level decides; never the person who registered or cleared it"],
    output: ["The request is released to the branch to act on, with a reference", "Or rejected, or returned to the customer, with the reason", "A complete audit trail of every step"],
    makerTitle: "Branch Operations Officer", sendText: "Signed letter with the company chop, handed in at the branch.", registerText: "Enters the request on the account and classifies it.",
    mandateText: "Compares each signature with a named signatory. A major change needs the full requirement, for example any 2 of 3.",
    reviewText: "Calls the signatory back. Clearing it sends the case to approval; or hold it, or confirm forgery.",
    bankSub: "Acts on the request", bankLane: "Branch and core banking", releaseText: "The branch acts on the request and the audit trail is updated.",
    doneOutput: "The request is released to the branch to act on, with a reference", expected: "request released to the branch with a reference.", done: "Request released to the branch.", releaseNoun: "Releases the request to the branch and closes the case.",
    guideName: "a letter of instruction",
    guideSteps: [
      ["Receive", "The branch scans the signed letter. A Branch Operations Officer registers it against the company's account and chooses the type of request."],
      ["Classify", "A major change (address, standing instruction, account closure) needs the account's full signing requirement and at least Level 2. A routine request needs one signatory."],
      ["Extract and check", "ASV finds each signature, compares it with the specimen of a named signatory, and looks for the company chop."],
      ["Review if flagged", "A signature below the pass score, or a scan with no chop, goes to an analyst who calls the signatory back."],
      ["Approve", "A match goes to the approver for the level. A cleared flag needs at least a Branch Manager."],
    ],
    extra: { title: "What makes this use case different", items: ["Request types decide how many signatures are needed, not only the amount.", "The company chop is checked as well as the signatures.", "Joint signatures protect major changes, for example any 2 of 3.", "A payment by letter still follows the amount rules and the high-value fallback."] },
    glance: { example: "ABC Sdn Bhd sends a signed letter, stamped with its chop, to change its registered address.", keyInfo: ["Company account", "Request details", "Request purpose", "Multiple authorised signatories"], steps: ["Complete the request letter", "Authorised signatories sign and stamp", "Scan and extract the signatures", "ASV compares with the reference signatures", "If they match, the request proceeds"], why: ["Joint signatures (for example any 2 of 3) for major changes", "Verification of the company rubber stamp (chop)", "High-value risk fallback"] },
  });
  A.FLOWS.loi = kit.flow; A.GUIDES.loi = kit.guide;

  /* ---- extra checks for this module ---- */
  const esc = UI.esc;
  (window.UseCase = window.UseCase || {}).loi = {
    accountRows: (a) => [["Mandate", a.mandate.rule === "all" ? "All signatories" : a.mandate.tier ? "Tiered by amount" : "Any " + a.mandate.n]],
    registerChecks(values, acct, cases, ctx) {
      const out = [];
      if (values.requestType) {
        const need = ctx && ctx.need;
        out.push(isMajor(values) ? { tone: "info", text: "<b>Major change.</b> It needs the account's full signing requirement" + (need ? " (" + need + " signature" + (need > 1 ? "s" : "") + ")" : "") + " and at least Level 2." }
          : values.requestType === "Payment by letter" ? { tone: "info", text: "<b>Payment by letter.</b> The signatures needed and the approval level follow the amount." }
          : { tone: "ok", text: "<b>Routine request.</b> " + (need ? need + " signature" + (need > 1 ? "s are" : " is") : "One signature is") + " needed." });
      }
      if (window.Cfg && Cfg.chopRequired("loi")) out.push({ tone: "info", text: "The letter must carry the company chop (a red round rubber stamp). ASV looks for it and flags the case if it is missing." });
      return out;
    },
    validate: (values, a, ctx) => (values.requestType === "Payment by letter" && !(ctx.amt > 0) ? ["Enter the payment amount for a payment by letter."] : []),
    onRegister(c, values) { c.reqClass = isMajor(values) ? "major" : "routine"; return [["Request classified", values.requestType + (isMajor(values) ? ", major change" : ", routine")]]; },
    rows: (c) => [["Type of request", c.fields.requestType || "-"], ["Class", c.reqClass === "major" ? "Major change" : "Routine"], ["Request purpose", c.fields.purpose || "-"], ["Request details", c.fields.details || "-"]],
    panels(c) {
      const st = c.asv && c.asv.stamp;
      return '<section class="panel"><header>Letter checks</header><div class="body small"><div class="st ' + (c.reqClass === "major" ? "info" : "pass") + '">' + (c.reqClass === "major" ? "Major change" : "Routine request") + "</div>" +
        '<div class="muted" style="margin-top:6px">Signatures needed: ' + c.required + ". " + (c.reqClass === "major" ? "Approval at Level 2 or above." : "") + "</div>" +
        '<div class="st ' + (!st ? "info" : st.found ? "pass" : "fail") + '" style="margin-top:8px">' + (!st ? "Company chop not checked yet" : st.found ? "Company chop found" : "Company chop not found") + "</div></div></section>";
    },
    approvalChecks: (c) => [[!c.asv || !c.asv.stamp || c.asv.stamp.found, c.asv && c.asv.stamp && !c.asv.stamp.found ? "Company chop not found on the scan (check the original)" : "Company chop found on the scan"], [c.reqClass !== "major" || c.level >= 2, c.reqClass === "major" ? "Major change approved at Level 2 or above" : "Routine request"]],
  };
})();
