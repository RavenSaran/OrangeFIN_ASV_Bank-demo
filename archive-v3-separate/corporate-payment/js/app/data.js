/* Corporate payment authorisation: staff, accounts, signing mandates, limits and wording.
   Front-end demonstration only: sign-in and permissions are simulated in the browser. */
(function () {
  const ROLES = {
    maker: { title: "Payments Operations Officer", short: "Maker", approveLevel: 0, desc: "Registers payment instructions, runs signature verification and submits." },
    fraud: { title: "Fraud Review Analyst", short: "Fraud review", approveLevel: 0, desc: "Reviews flagged signatures and confirms or clears them after a callback." },
    checker: { title: "Senior Payments Officer", short: "Checker", approveLevel: 1, desc: "Approves payments up to Level 1." },
    manager: { title: "Branch Manager", short: "Approver", approveLevel: 2, desc: "Approves payments up to Level 2 and every fraud-cleared override." },
    head: { title: "Head of Payments Operations", short: "Approver", approveLevel: 3, desc: "Approves payments of any value." },
    auditor: { title: "Internal Auditor", short: "Audit", approveLevel: 0, desc: "Read-only access to cases and the audit trail." },
  };
  const USERS = [
    { id: "PO-1042", name: "Aisha Rahman", role: "maker", branch: "KL01" },
    { id: "PO-1057", name: "Daniel Lee Wei Jie", role: "maker", branch: "PJ02" },
    { id: "FR-3004", name: "Farid Hakim", role: "fraud", branch: "HO" },
    { id: "SP-2011", name: "Priya Nair", role: "checker", branch: "KL01" },
    { id: "BM-4001", name: "Hafiz Ismail", role: "manager", branch: "KL01" },
    { id: "HP-5001", name: "Catherine Wong", role: "head", branch: "HO" },
    { id: "IA-6002", name: "Ravi Chandran", role: "auditor", branch: "HO" },
  ];
  const BRANCHES = { KL01: "Kuala Lumpur Main", PJ02: "Petaling Jaya", PG03: "Penang Georgetown", KCH04: "Kuching", HO: "Head Office" };

  const ACCOUNTS = [
    { no: "8001-2345-6789", name: "ABC Sdn. Bhd.", kind: "current", status: "Active", branch: "KL01", since: "2018-06-12", specimenDate: "2024-02-19",
      mandate: { rule: "any", n: 2, text: "Any 2 of 3 authorised signatories" },
      parties: [{ id: "p1", name: "Tan Wei Ming", role: "Director", seed: 11 }, { id: "p2", name: "Siti Nurhaliza Aziz", role: "Finance Director", seed: 23 }, { id: "p3", name: "Rajesh Kumar", role: "General Manager", seed: 37 }] },
    { no: "8003-1120-5534", name: "Sunrise Logistics Sdn. Bhd.", kind: "current", status: "Active", branch: "PJ02", since: "2020-11-23", specimenDate: "2022-05-09",
      mandate: { rule: "all", text: "Both authorised signatories together" },
      parties: [{ id: "p1", name: "Lau Kok Seng", role: "Director", seed: 120 }, { id: "p2", name: "Nadia Binti Karim", role: "Director", seed: 133 }] },
    { no: "8004-7781-2290", name: "Mega Build Sdn. Bhd.", kind: "current", status: "Active", branch: "KL01", since: "2012-09-04", specimenDate: "2025-01-14",
      mandate: { rule: "any", n: 2, tier: { limit: 50000, n: 1 }, text: "Any 1 signatory up to MYR 50,000; any 2 above" },
      parties: [{ id: "p1", name: "Ong Boon Hock", role: "Managing Director", seed: 146 }, { id: "p2", name: "Shalini Menon", role: "Finance Controller", seed: 159 }, { id: "p3", name: "Kamal Arifin", role: "Project Director", seed: 172 }] },
    { no: "8005-9930-1178", name: "Eastern Foods Bhd.", kind: "current", status: "Active", branch: "PG03", since: "2009-01-15", specimenDate: "2021-10-01",
      mandate: { rule: "any", n: 2, text: "Any 2 of 4 authorised signatories" },
      parties: [{ id: "p1", name: "Yeoh Beng Hwa", role: "Chairman", seed: 185 }, { id: "p2", name: "Farah Diyana", role: "CFO", seed: 198 }, { id: "p3", name: "Gurdeep Singh", role: "Director", seed: 211 }, { id: "p4", name: "Tay Li Ying", role: "Treasurer", seed: 224 }] },
    { no: "7002-8891-4402", name: "Borneo Marine Supplies Sdn. Bhd.", kind: "current", status: "Active", branch: "KCH04", since: "2015-03-02", specimenDate: "2023-08-30",
      mandate: { rule: "any", n: 2, text: "Any 2 of 3 authorised signatories" },
      parties: [{ id: "p1", name: "Ahmad Faris Hassan", role: "Managing Director", seed: 81 }, { id: "p2", name: "Chong Siew Lan", role: "Finance Manager", seed: 94 }, { id: "p3", name: "Daniel Ong", role: "Operations Director", seed: 107 }] },
    { no: "7007-3351-0902", name: "Golden Palm Exports Sdn. Bhd.", kind: "current", status: "Dormant", branch: "KL01", since: "2016-07-19", specimenDate: "2019-04-22",
      mandate: { rule: "any", n: 2, text: "Any 2 of 2 authorised signatories" },
      parties: [{ id: "p1", name: "Hasnah Ibrahim", role: "Director", seed: 237 }, { id: "p2", name: "Lee Chun Wai", role: "Director", seed: 245 }] },
  ];

  const TYPES = {
    payment: { label: "Corporate payment", long: "Corporate payment instruction", form: "CPI-01", kind: "current", slaHours: 4, risk: "Unauthorised company payment",
      accountLabel: "Debit account", amountLabel: "Payment amount", defaultCurrency: "MYR",
      fields: [["payee", "Payee or beneficiary", "text"], ["reference", "Invoice or payment reference", "text"], ["purpose", "Payment purpose", "text", "full"]] },
  };
  const FX = { MYR: 1, USD: 4.45, SGD: 3.3, EUR: 4.85, GBP: 5.7, AUD: 2.9, JPY: 0.03, CNY: 0.62, THB: 0.13, IDR: 0.00028, INR: 0.053, HKD: 0.57, AED: 1.21, CHF: 5.05 };
  const POLICY = { passScore: 70, sessionMinutes: 15, levels: [{ n: 1, upTo: 100000, who: "Senior Payments Officer" }, { n: 2, upTo: 1000000, who: "Branch Manager" }, { n: 3, upTo: Infinity, who: "Head of Payments Operations" }] };

  const GUIDE = {
    title: "How corporate payment authorisation works",
    steps: [
      ["Receive", "The branch scans the signed payment instruction and a Payments Operations Officer registers it against the company's debit account."],
      ["Check the payment", "The system flags a possible duplicate (same payee and reference, or the same payee and amount) before the case is registered."],
      ["Extract", "ASV finds each handwritten signature on the scan and crops it. The officer unticks anything that is not a signature."],
      ["Compare with the mandate", "Each signature is compared with the specimen of a named signatory. The company's signing rule decides how many are needed, and it can change with the amount."],
      ["Approve", "A match goes to the approver for the amount. A flag goes to fraud review first, and a cleared flag needs at least a Branch Manager."],
    ],
    outcomes: [
      ["pass", "Likely match", "Every signature matches a signatory and the signing rule is met. The payment can be submitted for approval."],
      ["flag", "Flagged", "A signature scored below the pass score or could not be compared reliably. A fraud analyst reviews it and may clear it after a callback."],
      ["fail", "Mandate not met", "The signatures are genuine but too few, or one person signed twice. The instruction returns to the customer."],
    ],
    who: [["Payments Operations Officer", "Registers, verifies and submits."], ["Fraud Review Analyst", "Reviews flagged signatures; clears with a callback or confirms forgery."], ["Senior Payments Officer", "Approves up to MYR 100,000."], ["Branch Manager", "Approves up to MYR 1,000,000 and all fraud-cleared payments."], ["Head of Payments Operations", "Approves any amount."], ["Internal Auditor", "Reads cases and the audit trail."]],
    extra: { title: "What makes this use case different", items: ["Company accounts have signing mandates such as any 2 of 3, both directors, or one signatory up to a limit.", "The same person signing twice does not count as two signatures.", "Amounts in any currency are converted to MYR to choose the approval level.", "A duplicate payment check runs before registration."] },
    limits: ["The system is only as good as the specimen on file. Compare each signature with the signatory the mandate requires.", "Genuine signatures vary with writing conditions, age and scan quality. A low score is a reason to look closer, not proof of forgery.", "Scans carry no pen pressure, speed or stroke order.", "A score never authorises a payment. A second person always approves."],
  };
  window.APP = { KEY: "pay", PASSWORD: "Orange@2026", BRAND: { sub: "Corporate payments", register: "Register payment", review: "Fraud review", checksTitle: "Payment checks",
    headline: "Check every signature before a company payment is released.", blurb: "Payment instructions are compared with the signatories in the company's mandate, then released only after a second person approves.",
    spec: { seed: 11, title: "Specimen signature card", acct: "Acct 8001-2345-6789", caption: "Tan Wei Ming, Director. Verified 19 Feb 2024." } },
    ROLES, USERS, BRANCHES, ACCOUNTS, TYPES, FX, POLICY, GUIDE };
})();
