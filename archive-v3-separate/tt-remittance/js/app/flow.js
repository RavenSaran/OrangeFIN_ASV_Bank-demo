/* The telegraphic transfer process, written for the process overview page, the case progress bar and the help text. */
(function () {
  window.APP.FLOW = {
    intro: "A company asks the bank to send money abroad. A person at the bank registers the signed application, the beneficiary is screened, ASV checks every signature against the remitter's mandate, and a second person approves before the transfer is released.",
    line: "Signed transfer application in. Beneficiary screened and signatures checked by ASV. A second person approves. Transfer released with a reference and value date.",
    io: {
      input: ["The signed transfer application (a scan)", "Beneficiary name, bank, BIC, country, purpose, amount and currency", "The remitter's signing mandate and signature specimens on file"],
      process: ["Register; the BIC is validated and the beneficiary is screened against the watchlist", "ASV compares each signature with the specimen of a named signatory", "A flagged signature or a screening hit goes to compliance review", "The approver for the amount decides, before the 15:30 cut-off"],
      output: ["Transfer released with a reference and a value date", "Or rejected, or returned to the customer, with the reason", "A complete audit trail, including the screening result"],
    },
    lanes: [{ key: "customer", label: "Customer", sub: "The remitting company" }, { key: "maker", label: "Remittance Officer", sub: "Registers and submits" }, { key: "asv", label: "ASV system", sub: "Checks signatures" },
      { key: "fraud", label: "Compliance and Fraud Analyst", sub: "Only when flagged" }, { key: "approver", label: "Approver", sub: "By amount" }, { key: "bank", label: "Payment system", sub: "Sends the transfer" }],
    steps: [
      { lane: "customer", title: "Applies", text: "Signed transfer application with the beneficiary details." },
      { lane: "maker", title: "Registers and screens", text: "Enters it. The BIC is validated and the beneficiary is screened." },
      { lane: "asv", title: "Finds signatures", text: "Locates and crops each handwritten signature on the application." },
      { lane: "asv", title: "Checks the mandate", text: "Compares each signature with a named signatory and counts how many the rule needs." },
      { lane: "maker", title: "Submits or refers", text: "A match with clear screening is submitted. A flag or a screening hit is referred to review. If the mandate is not met, it goes back to the customer." },
      { lane: "fraud", title: "Reviews the flag or hit", text: "Calls back. Clearing it sends the case straight to approval; or hold it, or reject it.", optional: true },
      { lane: "approver", title: "Approves", text: "Level 1 up to MYR 200,000, Level 2 up to 2,000,000, Level 3 above." },
      { lane: "bank", title: "Releases", text: "Sent before the 15:30 cut-off, or next business day, with a reference." },
    ],
    outputs: [
      { tone: "pass", title: "Released", when: "Signatures match, screening is clear and the approver agrees", who: "Approver for the amount", output: "Transfer released with a reference and a value date", status: "Approved and released" },
      { tone: "pass", title: "Released after review", when: "A signature was flagged or the beneficiary hit the watchlist, then cleared", who: "Compliance analyst, then an Operations Manager or above", output: "Transfer released; the callback reference is on the record", status: "Approved and released" },
      { tone: "fail", title: "Rejected", when: "Forgery is confirmed, the beneficiary is not acceptable, or the approver declines", who: "Compliance analyst or approver", output: "Transfer stopped; the reason is recorded", status: "Rejected" },
      { tone: "neutral", title: "Returned to customer", when: "Too few signatures, or one person signed twice", who: "Remittance Officer", output: "Application returned to the company with the reason", status: "Returned to customer" },
      { tone: "wait", title: "Sent back for correction", when: "The approver finds a detail that does not match, such as the BIC and bank name", who: "Approver", output: "Case returns to the officer to correct and verify again", status: "Returned for correction" },
    ],
    track: ["Registered", "Screened and verified", "Compliance review", "Approval", "Released"],
    nouns: { expected: "transfer released with a reference and value date.", done: "Transfer released to the payment system.", release: "Releases the transfer to the payment system and closes the case." },
    after: ["Next screen: ASV finds the signatures on your scan and compares them with the mandate.", "If they match and screening is clear, you submit for approval. A flag or a screening hit goes to compliance review.", "A second person approves. Output: the transfer is released with a reference and a value date."],
  };
})();
