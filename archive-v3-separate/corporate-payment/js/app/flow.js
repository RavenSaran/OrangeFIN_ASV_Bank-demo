/* The corporate payment process, written for the process overview page, the case progress bar and the help text. */
(function () {
  window.APP.FLOW = {
    intro: "A company asks the bank to pay a supplier. A person at the bank registers the signed instruction, ASV checks every signature against the company's signing mandate, and a second person approves before any money moves.",
    line: "Signed payment instruction in. ASV checks each signature against the company's mandate. A second person approves. Payment released with a reference.",
    io: {
      input: ["The signed payment instruction (a scan)", "The company's debit account, payee, invoice reference and amount", "The signing mandate and signature specimens already on file"],
      process: ["Register the case; a duplicate payment check runs", "ASV finds each signature and compares it with the specimen of a named signatory", "A flagged signature goes to fraud review for a callback", "The approver for the amount decides; never the person who registered or cleared it"],
      output: ["Payment released to core banking, with a reference", "Or rejected, or returned to the customer, with the reason", "A complete audit trail of every step"],
    },
    lanes: [{ key: "customer", label: "Customer", sub: "The company" }, { key: "maker", label: "Payments Operations Officer", sub: "Registers and submits" }, { key: "asv", label: "ASV system", sub: "Checks signatures" },
      { key: "fraud", label: "Fraud Review Analyst", sub: "Only when flagged" }, { key: "approver", label: "Approver", sub: "By amount" }, { key: "bank", label: "Core banking", sub: "Releases the payment" }],
    steps: [
      { lane: "customer", title: "Sends instruction", text: "Signed payment instruction with the invoice." },
      { lane: "maker", title: "Registers it", text: "Enters it on the debit account. A duplicate payment check runs." },
      { lane: "asv", title: "Finds signatures", text: "Locates and crops each handwritten signature on the scan." },
      { lane: "asv", title: "Checks the mandate", text: "Compares each signature with a named signatory and counts how many the rule needs." },
      { lane: "maker", title: "Submits or refers", text: "A match is submitted. A flag is referred to review. If the mandate is not met, it goes back to the customer." },
      { lane: "fraud", title: "Reviews the flag", text: "Calls the signatory back. Clearing it sends the case straight to approval; or hold it, or confirm forgery.", optional: true },
      { lane: "approver", title: "Approves", text: "Level 1 up to MYR 100,000, Level 2 up to 1,000,000, Level 3 above." },
      { lane: "bank", title: "Releases", text: "Payment released with a reference. The audit trail is updated." },
    ],
    outputs: [
      { tone: "pass", title: "Released", when: "Signatures match, the mandate is met and the approver agrees", who: "Approver for the amount", output: "Payment released to core banking with a reference number", status: "Approved and released" },
      { tone: "pass", title: "Released after review", when: "A signature was flagged, then cleared after a callback", who: "Fraud analyst, then a Branch Manager or above", output: "Payment released; the callback reference is on the record", status: "Approved and released" },
      { tone: "fail", title: "Rejected", when: "The analyst confirms a forgery, or the approver declines", who: "Fraud analyst or approver", output: "Payment stopped; a suspected forgery is recorded for follow-up", status: "Rejected" },
      { tone: "neutral", title: "Returned to customer", when: "Too few signatures, or one person signed twice", who: "Payments Operations Officer", output: "Instruction returned to the company with the reason", status: "Returned to customer" },
      { tone: "wait", title: "Sent back for correction", when: "The approver finds a detail that does not match, such as the payee name", who: "Approver", output: "Case returns to the officer to correct and verify again", status: "Returned for correction" },
    ],
    track: ["Registered", "Signatures checked", "Fraud review", "Approval", "Released"],
    nouns: { expected: "payment released to core banking with a reference.", done: "Payment released to core banking.", release: "Releases the payment to core banking and closes the case." },
    after: ["Next screen: ASV finds the signatures on your scan and compares them with the mandate.", "If they match, you submit the case for approval. If one is flagged, you refer it to fraud review.", "A second person approves. Output: the payment is released with a reference."],
  };
})();
