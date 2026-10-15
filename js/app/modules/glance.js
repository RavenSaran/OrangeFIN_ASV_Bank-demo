/* The "at a glance" block on every Process page: an example, the key information, the five-step flow and why ASV is mandatory.
   The three newer modules carry their own in their module files; this adds the same block to the three earlier ones. */
(function () {
  const A = window.APP, set = (type, g) => { if (A.FLOWS[type]) A.FLOWS[type].glance = g; };
  set("payment", {
    example: "A company instruction to pay a supplier invoice, signed by two directors.",
    keyInfo: ["Debit account", "Payee and invoice reference", "Amount and currency", "Signing mandate"],
    steps: ["Complete the payment instruction", "Authorised signatories sign", "Scan and extract the signatures", "ASV compares with the reference signatures", "If they match, the payment proceeds"],
    why: ["A released payment is hard to recall", "The company's signing rule (for example any 2 of 3) must be met", "A duplicate payment is caught before release"],
  });
  set("fd", {
    example: "A fixed deposit upliftment form signed by both holders of a joint deposit.",
    keyInfo: ["Deposit and holders", "Amount to uplift", "Credit account", "Identity check"],
    steps: ["Complete the upliftment form", "The holders sign", "Scan and extract the signatures", "ASV compares with the reference signatures", "If they match, funds are released"],
    why: ["A large sum leaves the bank at the counter", "A joint deposit may need every holder to sign", "Minimum balance and interest rules apply to early withdrawal"],
  });
  set("tt", {
    example: "A remitter hands in the transfer form and cash at the counter, above the digital limit.",
    keyInfo: ["Remittance details", "Currency", "Destination country", "Daily limit exceeded"],
    steps: ["Complete the remittance form", "Authorised signatories sign", "Scan and extract the signatures", "ASV compares with the reference signatures", "If they match, the transfer is processed"],
    why: ["Enhanced AML/CFT checks for large sums", "High fraud risk in manual processes", "Joint verification of authority"],
  });
})();
