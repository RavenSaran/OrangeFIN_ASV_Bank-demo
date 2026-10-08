/* The fixed deposit upliftment process, written for the process overview page, the case progress bar and the help text. */
(function () {
  window.APP.FLOW = {
    intro: "A customer comes to the counter to withdraw or roll over a fixed deposit. The officer checks identity and registers the request, ASV checks the holders' signatures against the account rule, and a second person approves the payout.",
    line: "Customer signs a request at the counter. Identity is sighted. ASV checks the holders' signatures. A second person approves. Payout credited or deposit renewed.",
    io: {
      input: ["The signed upliftment request (a scan)", "The deposit, the instruction (early withdrawal, rollover or at maturity) and the amount", "The holders' specimens and the account rule (both holders, or either)"],
      process: ["Sight the holder's identity, then register", "The payout is worked out, including the interest reduction for early withdrawal", "ASV compares each signature with the named holder's specimen", "A flagged signature goes to fraud review; then a second person approves"],
      output: ["Payout credited to the customer's account, or the deposit renewed for 12 months", "Or rejected, or returned to the customer, with the reason", "A complete audit trail of every step"],
    },
    lanes: [{ key: "customer", label: "Customer", sub: "At the counter" }, { key: "maker", label: "Customer Service Officer", sub: "Registers and submits" }, { key: "asv", label: "ASV system", sub: "Checks signatures" },
      { key: "fraud", label: "Fraud Review Analyst", sub: "Only when flagged" }, { key: "approver", label: "Approver", sub: "By amount" }, { key: "bank", label: "Core banking", sub: "Pays out or renews" }],
    steps: [
      { lane: "customer", title: "Asks and signs", text: "Asks to withdraw or roll over, and signs the request. Shows ID." },
      { lane: "maker", title: "Sights ID, registers", text: "Confirms identity and enters the request. The payout is worked out." },
      { lane: "asv", title: "Finds signatures", text: "Locates and crops each holder's signature on the request." },
      { lane: "asv", title: "Checks the account rule", text: "Compares each signature with a named holder; both holders or either, as the account requires." },
      { lane: "maker", title: "Submits or refers", text: "A match is submitted. A flag is referred to review. If a required holder is missing, it goes back to the customer." },
      { lane: "fraud", title: "Reviews the flag", text: "Calls the holder back. Clearing it sends the request straight to approval; or hold it, or confirm forgery.", optional: true },
      { lane: "approver", title: "Approves", text: "Senior Customer Service Officer up to MYR 100,000; Branch Manager above." },
      { lane: "bank", title: "Pays out or renews", text: "Payout credited, or the deposit renewed, with a reference." },
    ],
    outputs: [
      { tone: "pass", title: "Paid out or renewed", when: "Required holders' signatures match and the approver agrees", who: "Approver for the amount", output: "Payout credited to the customer's account, or the deposit renewed, with a reference", status: "Approved and released" },
      { tone: "pass", title: "Paid out after review", when: "A signature was flagged, then cleared after a callback to the holder", who: "Fraud analyst, then the Branch Manager", output: "Payout credited; the callback reference is on the record", status: "Approved and released" },
      { tone: "fail", title: "Rejected", when: "The analyst confirms a forgery, or the approver declines", who: "Fraud analyst or approver", output: "No money moves; a suspected forgery is recorded", status: "Rejected" },
      { tone: "neutral", title: "Returned to customer", when: "A joint account needs both holders and one did not sign", who: "Customer Service Officer", output: "Customer asked to return with the other holder", status: "Returned to customer" },
      { tone: "wait", title: "Sent back for correction", when: "The approver finds a detail that does not match, such as the credit account", who: "Approver", output: "Case returns to the officer to correct and verify again", status: "Returned for correction" },
    ],
    track: ["Counter request", "Signatures checked", "Fraud review", "Approval", "Paid out"],
    nouns: { expected: "payout credited or deposit renewed, with a reference.", done: "Payout credited or deposit renewed.", release: "Credits the payout or renews the deposit, and closes the case." },
    after: ["Next screen: ASV finds each holder's signature on the request and compares it with the specimen.", "If the account rule is met you submit for approval. If a signature is flagged you refer it to fraud review.", "A second person approves. Output: the payout is credited, or the deposit is renewed."],
  };
})();
