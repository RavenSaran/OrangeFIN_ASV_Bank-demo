/* Telegraphic transfer and remittance: staff, remitting accounts, mandates, limits and wording.
   Front-end demonstration only: sign-in, screening and permissions are simulated in the browser. */
(function () {
  const ROLES = {
    maker: { title: "Remittance Officer", short: "Maker", approveLevel: 0, desc: "Registers transfer applications, runs signature verification and submits." },
    fraud: { title: "Compliance and Fraud Analyst", short: "Compliance review", approveLevel: 0, desc: "Reviews flagged signatures and screening hits, and clears or rejects them." },
    checker: { title: "Senior Remittance Officer", short: "Checker", approveLevel: 1, desc: "Approves transfers up to Level 1." },
    manager: { title: "Operations Manager", short: "Approver", approveLevel: 2, desc: "Approves transfers up to Level 2 and every cleared override." },
    head: { title: "Head of Treasury Operations", short: "Approver", approveLevel: 3, desc: "Approves transfers of any value." },
    auditor: { title: "Internal Auditor", short: "Audit", approveLevel: 0, desc: "Read-only access to cases and the audit trail." },
  };
  const USERS = [
    { id: "RO-1042", name: "Lim Jia Hui", role: "maker", branch: "KL01" },
    { id: "RO-1057", name: "Arjun Pillai", role: "maker", branch: "PJ02" },
    { id: "CF-3004", name: "Farid Hakim", role: "fraud", branch: "HO" },
    { id: "SR-2011", name: "Nadia Rosli", role: "checker", branch: "KL01" },
    { id: "OM-4001", name: "Hafiz Ismail", role: "manager", branch: "KL01" },
    { id: "HT-5001", name: "Catherine Wong", role: "head", branch: "HO" },
    { id: "IA-6002", name: "Ravi Chandran", role: "auditor", branch: "HO" },
  ];
  const BRANCHES = { KL01: "Kuala Lumpur Main", PJ02: "Petaling Jaya", PG03: "Penang Georgetown", KCH04: "Kuching", HO: "Head Office" };

  const ACCOUNTS = [
    { no: "7002-8891-4402", name: "Borneo Marine Supplies Sdn. Bhd.", kind: "current", status: "Active", branch: "KCH04", since: "2015-03-02", specimenDate: "2023-08-30",
      mandate: { rule: "any", n: 2, text: "Any 2 of 3 authorised signatories" },
      parties: [{ id: "p1", name: "Ahmad Faris Hassan", role: "Managing Director", seed: 81 }, { id: "p2", name: "Chong Siew Lan", role: "Finance Manager", seed: 94 }, { id: "p3", name: "Daniel Ong", role: "Operations Director", seed: 107 }] },
    { no: "8005-9930-1178", name: "Eastern Foods Bhd.", kind: "current", status: "Active", branch: "PG03", since: "2009-01-15", specimenDate: "2021-10-01",
      mandate: { rule: "any", n: 2, text: "Any 2 of 4 authorised signatories" },
      parties: [{ id: "p1", name: "Yeoh Beng Hwa", role: "Chairman", seed: 185 }, { id: "p2", name: "Farah Diyana", role: "CFO", seed: 198 }, { id: "p3", name: "Gurdeep Singh", role: "Director", seed: 211 }, { id: "p4", name: "Tay Li Ying", role: "Treasurer", seed: 224 }] },
    { no: "7010-2201-7743", name: "Straits Electronics Sdn. Bhd.", kind: "current", status: "Active", branch: "PJ02", since: "2017-04-10", specimenDate: "2024-06-03",
      mandate: { rule: "any", n: 2, text: "Any 2 of 3 authorised signatories" },
      parties: [{ id: "p1", name: "Goh Kian Seng", role: "Managing Director", seed: 350 }, { id: "p2", name: "Mariam Binti Jaafar", role: "Finance Director", seed: 363 }, { id: "p3", name: "Vikram Nair", role: "Procurement Director", seed: 376 }] },
    { no: "7011-6650-1908", name: "Pacific Timber Sdn. Bhd.", kind: "current", status: "Active", branch: "KCH04", since: "2019-09-17", specimenDate: "2023-01-25",
      mandate: { rule: "any", n: 2, tier: { limit: 100000, n: 1 }, text: "Any 1 signatory up to MYR 100,000; any 2 above" },
      parties: [{ id: "p1", name: "Lee Sing Hock", role: "Managing Director", seed: 389 }, { id: "p2", name: "Rosalind Jinggut", role: "Finance Manager", seed: 402 }] },
    { no: "7012-4488-3302", name: "Kinabalu Trading Sdn. Bhd.", kind: "current", status: "Active", branch: "KL01", since: "2021-02-08", specimenDate: "2022-11-14",
      mandate: { rule: "all", text: "Both authorised signatories together" },
      parties: [{ id: "p1", name: "Jasmine Wong", role: "Director", seed: 415 }, { id: "p2", name: "Mohd Hafizuddin", role: "Director", seed: 428 }] },
    { no: "7007-3351-0902", name: "Golden Palm Exports Sdn. Bhd.", kind: "current", status: "Dormant", branch: "KL01", since: "2016-07-19", specimenDate: "2019-04-22",
      mandate: { rule: "any", n: 2, text: "Any 2 of 2 authorised signatories" },
      parties: [{ id: "p1", name: "Hasnah Ibrahim", role: "Director", seed: 237 }, { id: "p2", name: "Lee Chun Wai", role: "Director", seed: 245 }] },
  ];

  const COUNTRIES = "Singapore;Indonesia;Thailand;Hong Kong;China;Japan;India;United Kingdom;Germany;United States;Australia;United Arab Emirates;Other";
  const TYPES = {
    tt: { label: "Telegraphic transfer", long: "Telegraphic transfer application", form: "TTA-03", kind: "current", slaHours: 3, risk: "Fraudulent fund transfer",
      accountLabel: "Debit account", amountLabel: "Transfer amount", defaultCurrency: "USD",
      fields: [["payee", "Beneficiary name", "text"], ["bank", "Beneficiary bank", "text"], ["bic", "BIC or SWIFT code", "text"], ["country", "Destination country", "select:" + COUNTRIES],
        ["purposeCode", "Purpose code", "select:Trade payment;Services;Capital transfer;Salary;Family support"], ["charges", "Charges", "select:SHA, shared;OUR, sender pays;BEN, beneficiary pays"], ["purpose", "Details of payment", "text", "full"]] },
  };
  const FX = { MYR: 1, USD: 4.45, SGD: 3.3, EUR: 4.85, GBP: 5.7, AUD: 2.9, JPY: 0.03, CNY: 0.62, THB: 0.13, IDR: 0.00028, INR: 0.053, HKD: 0.57, AED: 1.21, CHF: 5.05 };
  const POLICY = { passScore: 70, sessionMinutes: 15, levels: [{ n: 1, upTo: 200000, who: "Senior Remittance Officer" }, { n: 2, upTo: 2000000, who: "Operations Manager" }, { n: 3, upTo: Infinity, who: "Head of Treasury Operations" }] };

  const GUIDE = {
    title: "How telegraphic transfers are verified",
    steps: [
      ["Receive", "The branch scans the signed transfer application and a Remittance Officer registers it with the beneficiary, bank, BIC and country."],
      ["Check the details", "The BIC is validated and compared with the destination country. The beneficiary and country are screened against the watchlist."],
      ["Extract", "ASV finds each handwritten signature on the application and crops it."],
      ["Compare with the mandate", "Each signature is compared with the specimen of a named signatory. The remitter's mandate decides how many are needed."],
      ["Review and approve", "A screening hit or a flagged signature goes to compliance review first. Then the approver for the amount releases the transfer before the cut-off."],
    ],
    outcomes: [
      ["pass", "Likely match", "Every signature matches a signatory and the mandate is met. If screening is also clear, the transfer can be submitted for approval."],
      ["flag", "Flagged or screening hit", "A signature scored below the pass score, or the beneficiary matched the watchlist. Compliance reviews it before anything is released."],
      ["fail", "Mandate not met", "The signatures are genuine but too few, or one person signed twice. The application returns to the customer."],
    ],
    who: [["Remittance Officer", "Registers, verifies and submits."], ["Compliance and Fraud Analyst", "Reviews flagged signatures and screening hits; clears with a callback or confirms forgery."], ["Senior Remittance Officer", "Approves up to MYR 200,000."], ["Operations Manager", "Approves up to MYR 2,000,000 and all cleared overrides."], ["Head of Treasury Operations", "Approves any amount."], ["Internal Auditor", "Reads cases and the audit trail."]],
    extra: { title: "What makes this use case different", items: ["Cross-border: the beneficiary, bank, BIC, country and purpose are captured and checked.", "A screening hit stops the transfer even when every signature matches.", "The BIC must be valid and agree with the destination country.", "Transfers must be approved before the same-day cut-off of 15:30, or they take the next business day.", "Any currency is converted to MYR to choose the approval level."] },
    limits: ["The system is only as good as the specimen on file. Compare each signature with the signatory the mandate requires.", "Screening in this demonstration uses a short made-up watchlist. A live system uses the bank's sanctions and AML screening service.", "Genuine signatures vary with writing conditions, age and scan quality. A low score is a reason to look closer, not proof of forgery.", "A transfer that has left the bank is hard to recall. A second person always approves."],
  };
  window.APP = { KEY: "tt", PASSWORD: "Orange@2026", BRAND: { sub: "Remittance", register: "Register transfer", review: "Compliance review", checksTitle: "Transfer checks",
    headline: "Verify the signature and screen the beneficiary before money leaves the bank.", blurb: "Transfer applications are checked against the remitter's mandate and the beneficiary is screened, then released only after a second person approves.",
    spec: { seed: 81, title: "Specimen signature card", acct: "Acct 7002-8891-4402", caption: "Ahmad Faris Hassan, Managing Director. Verified 30 Aug 2023." } },
    LABELS: { fraud_review: "With compliance review" }, LABELS_ACTIONS: { refer: "Refer to compliance review", fraud_clear: "Clear and send for approval", fraud_hold: "Hold for callback", fraud_confirm: "Reject as suspicious" },
    ROLES, USERS, BRANCHES, ACCOUNTS, TYPES, FX, POLICY, GUIDE };
})();
