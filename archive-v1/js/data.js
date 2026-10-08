/* Use-case configuration: forms, signatories, signing mandates and demo scenarios.
   Change this file to change what each use-case page shows. */
(function () {
  const CORP = [
    { id: "p1", name: "Tan Wei Ming", role: "Director", seed: 11 },
    { id: "p2", name: "Siti Nurhaliza Aziz", role: "Finance Director", seed: 23 },
    { id: "p3", name: "Rajesh Kumar", role: "General Manager", seed: 37 },
  ];
  const CUST = [
    { id: "p1", name: "Lim Chee Keong", role: "Primary holder", seed: 52 },
    { id: "p2", name: "Lim Mei Ling", role: "Joint holder", seed: 68 },
  ];
  const G = (party) => ({ party, kind: "genuine" });
  const F = (party) => ({ party, kind: "forged" });

  const USE_CASES = {
    payment: {
      key: "payment", page: "payment.html", short: "Corporate Payment",
      title: "Corporate Payment Authorization",
      lead: "Confirm an authorised company signatory approved the payment instruction before the bank processes it.",
      risk: "Unauthorised company payment", formTitle: "Corporate Payment Instruction", formCode: "CPI-01",
      entity: "ABC Sdn. Bhd.", parties: CORP,
      mandate: { required: 2, text: "Any 2 of 3 authorised signatories must sign", rule: "any2of3" },
      fields: [
        { id: "account", label: "Company account no.", value: "8001-2345-6789" },
        { id: "payee", label: "Payee / beneficiary", value: "Supplier X Trading" },
        { id: "amount", label: "Amount", value: "50000", type: "amount" },
        { id: "currency", label: "Currency", value: "MYR", type: "currency" },
        { id: "reference", label: "Invoice / payment ref.", value: "INV-2026-00418" },
        { id: "purpose", label: "Payment purpose", value: "Supplier invoice settlement" },
      ],
      scenarios: [
        { id: "ok", label: "Genuine — 2 signatories", desc: "Director and Finance Director both sign.", signers: [G("p1"), G("p2")], tone: "pass" },
        { id: "forged", label: "Forged signature", desc: "One signature is a forgery of the Finance Director.", signers: [G("p1"), F("p2")], tone: "fail" },
        { id: "one", label: "Only 1 signature", desc: "Valid signature, but the mandate needs 2.", signers: [G("p3")], tone: "review" },
        { id: "dupe", label: "Same person signed twice", desc: "Two signatures from one signatory.", signers: [G("p1"), G("p1")], tone: "review" },
      ],
      steps: ["Receive instruction", "Extract signatures", "Reference and mandate", "Verify", "Decision"],
    },
    fd: {
      key: "fd", page: "fixed-deposit.html", short: "Fixed Deposit",
      title: "Fixed Deposit Upliftment",
      lead: "Verify the depositor's signature before a fixed deposit is withdrawn early, uplifted or rolled over.",
      risk: "Fraudulent withdrawal", formTitle: "Fixed Deposit Upliftment Request", formCode: "FDU-07",
      entity: "Lim Chee Keong (Joint account)", parties: CUST,
      mandate: { required: 2, text: "Joint account — both holders must sign (switchable below)", rule: "both", editable: true },
      fields: [
        { id: "account", label: "FD account no.", value: "FD-5521-009876" },
        { id: "holder", label: "Depositor", value: "Lim Chee Keong" },
        { id: "amount", label: "Upliftment amount", value: "100000", type: "amount" },
        { id: "currency", label: "Currency", value: "MYR", type: "currency" },
        { id: "instruction", label: "Instruction", value: "Early withdrawal (pre-mature)" },
        { id: "maturity", label: "Maturity date", value: "2027-03-14" },
      ],
      scenarios: [
        { id: "ok", label: "Genuine — both holders", desc: "Both joint holders sign the request.", signers: [G("p1"), G("p2")], tone: "pass" },
        { id: "forged", label: "Forged holder signature", desc: "The primary holder's signature is forged.", signers: [F("p1")], tone: "fail" },
        { id: "single", label: "Single genuine signature", desc: "Valid, but only one holder signed.", signers: [G("p1")], tone: "review" },
      ],
      steps: ["Receive request", "Extract signature", "Account holder reference", "Verify", "Decision"],
    },
    tt: {
      key: "tt", page: "remittance.html", short: "TT / Remittance",
      title: "Telegraphic Transfer / Remittance",
      lead: "Verify the authorised signature on a domestic or international transfer instruction before release.",
      risk: "Fraudulent fund transfer", formTitle: "Telegraphic Transfer Application", formCode: "TTA-03",
      entity: "Borneo Marine Supplies Sdn. Bhd.", parties: [
        { id: "p1", name: "Ahmad Faris Hassan", role: "Managing Director", seed: 81 },
        { id: "p2", name: "Chong Siew Lan", role: "Finance Manager", seed: 94 },
        { id: "p3", name: "Daniel Ong", role: "Operations Director", seed: 107 },
      ],
      mandate: { required: 2, text: "Any 2 of 3 authorised signatories must sign", rule: "any2of3" },
      fields: [
        { id: "account", label: "Debit account no.", value: "7002-8891-4402" },
        { id: "beneficiary", label: "Beneficiary", value: "Pacific Parts Co. Ltd" },
        { id: "bank", label: "Beneficiary bank / country", value: "DBS Singapore, SG" },
        { id: "amount", label: "Transfer amount", value: "100000", type: "amount" },
        { id: "currency", label: "Currency", value: "USD", type: "currency" },
        { id: "purpose", label: "Purpose of transfer", value: "Import of spare parts" },
      ],
      scenarios: [
        { id: "ok", label: "Genuine — 2 signatories", desc: "Managing Director and Finance Manager sign.", signers: [G("p1"), G("p2")], tone: "pass" },
        { id: "forged", label: "Forged signature", desc: "The Managing Director's signature is forged.", signers: [F("p1"), G("p2")], tone: "fail" },
        { id: "one", label: "Only 1 signature", desc: "A single valid signatory on a 2-signature mandate.", signers: [G("p2")], tone: "review" },
      ],
      steps: ["Receive instruction", "Extract signatures", "Reference and mandate", "Verify", "Decision"],
    },
  };

  window.USE_CASES = USE_CASES;
  window.THRESHOLD_DEFAULT = 70;
  window.CURRENCIES = ["MYR", "USD", "SGD", "EUR", "GBP", "AUD", "JPY", "CNY", "THB", "IDR", "INR", "HKD", "AED", "CHF"];
})();
