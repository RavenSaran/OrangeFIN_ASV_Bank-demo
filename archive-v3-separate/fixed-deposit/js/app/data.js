/* Fixed deposit upliftment: staff, deposit accounts, holders' mandates, limits and wording.
   Front-end demonstration only: sign-in and permissions are simulated in the browser. */
(function () {
  const ROLES = {
    maker: { title: "Customer Service Officer", short: "Maker", approveLevel: 0, desc: "Serves the customer at the counter, registers the request and runs signature verification." },
    fraud: { title: "Fraud Review Analyst", short: "Fraud review", approveLevel: 0, desc: "Reviews flagged signatures and confirms or clears them after a callback." },
    checker: { title: "Senior Customer Service Officer", short: "Checker", approveLevel: 1, desc: "Approves upliftments up to Level 1." },
    manager: { title: "Branch Manager", short: "Approver", approveLevel: 2, desc: "Approves larger upliftments and every fraud-cleared override." },
    auditor: { title: "Internal Auditor", short: "Audit", approveLevel: 0, desc: "Read-only access to cases and the audit trail." },
  };
  const USERS = [
    { id: "CS-1042", name: "Nurul Huda Zainal", role: "maker", branch: "KL01" },
    { id: "CS-1060", name: "Kevin Tan Boon Huat", role: "maker", branch: "PJ02" },
    { id: "FR-3004", name: "Farid Hakim", role: "fraud", branch: "HO" },
    { id: "SC-2011", name: "Priya Nair", role: "checker", branch: "KL01" },
    { id: "BM-4001", name: "Hafiz Ismail", role: "manager", branch: "KL01" },
    { id: "IA-6002", name: "Ravi Chandran", role: "auditor", branch: "HO" },
  ];
  const BRANCHES = { KL01: "Kuala Lumpur Main", PJ02: "Petaling Jaya", PG03: "Penang Georgetown", KCH04: "Kuching", HO: "Head Office" };

  const FD = (no, name, branch, since, parties, mandate, extra) => Object.assign({ no, name, kind: "fd", status: "Active", branch, since, specimenDate: since, currency: "MYR", mandate, parties }, extra);
  const ACCOUNTS = [
    FD("FD-5521-009876", "Lim Chee Keong and Lim Mei Ling", "KL01", "2021-03-14", [{ id: "p1", name: "Lim Chee Keong", role: "Primary holder", seed: 52 }, { id: "p2", name: "Lim Mei Ling", role: "Joint holder", seed: 68 }],
      { rule: "all", text: "Joint account, both holders must sign" }, { principal: 100000, accrued: 1840.55, maturity: "2027-03-14", rate: "3.35% p.a." }),
    FD("FD-5521-010442", "Wong Ah Seng", "PJ02", "2022-08-01", [{ id: "p1", name: "Wong Ah Seng", role: "Sole holder", seed: 250 }], { rule: "any", n: 1, text: "Sole holder" }, { principal: 250000, accrued: 5210.0, maturity: "2026-12-01", rate: "3.50% p.a." }),
    FD("FD-5521-013055", "Nur Aisyah Binti Omar and Omar Bin Yusof", "PG03", "2023-02-20", [{ id: "p1", name: "Nur Aisyah Binti Omar", role: "Primary holder", seed: 263 }, { id: "p2", name: "Omar Bin Yusof", role: "Joint holder", seed: 276 }],
      { rule: "any", n: 1, text: "Joint account, either holder may sign" }, { principal: 80000, accrued: 1330.2, maturity: "2027-02-20", rate: "3.40% p.a." }),
    FD("FD-5522-001208", "Chen Mei Fong", "KCH04", "2024-05-06", [{ id: "p1", name: "Chen Mei Fong", role: "Sole holder", seed: 289 }], { rule: "any", n: 1, text: "Sole holder" }, { principal: 30000, accrued: 410.3, maturity: "2026-11-06", rate: "2.10% p.a.", currency: "USD" }),
    FD("FD-5523-004411", "Tan Siew Mei", "KL01", "2024-11-02", [{ id: "p1", name: "Tan Siew Mei", role: "Sole holder", seed: 300 }], { rule: "any", n: 1, text: "Sole holder" }, { principal: 500000, accrued: 12040.0, maturity: "2027-05-02", rate: "3.55% p.a." }),
    FD("FD-5523-007788", "Ahmad Zulkifli Bin Hamid and Rohani Binti Ali", "PJ02", "2025-10-12", [{ id: "p1", name: "Ahmad Zulkifli Bin Hamid", role: "Primary holder", seed: 313 }, { id: "p2", name: "Rohani Binti Ali", role: "Joint holder", seed: 326 }],
      { rule: "all", text: "Joint account, both holders must sign" }, { principal: 150000, accrued: 2980.4, maturity: "2026-10-12", rate: "3.30% p.a." }),
    FD("FD-5520-000912", "Yusof Bin Hashim", "KL01", "2019-06-18", [{ id: "p1", name: "Yusof Bin Hashim", role: "Sole holder", seed: 339 }], { rule: "any", n: 1, text: "Sole holder" }, { principal: 0, accrued: 0, maturity: "2024-06-18", rate: "3.00% p.a.", status: "Closed" }),
  ];

  const TYPES = {
    fd: { label: "Fixed deposit upliftment", long: "Fixed deposit upliftment request", form: "FDU-07", kind: "fd", slaHours: 24, risk: "Fraudulent withdrawal",
      accountLabel: "Fixed deposit account", amountLabel: "Principal to uplift", defaultCurrency: "MYR",
      fields: [["instruction", "Instruction", "select:Early withdrawal;Rollover for 12 months;Withdrawal at maturity", "full"], ["credit", "Credit proceeds to account", "text"], ["presented", "Presented by", "select:Account holder in person;Authorised representative"],
        ["idSighted", "Identity check", "checkbox", "full", "No", "The holder's NRIC or passport was sighted and matches the account", "req"]] },
  };
  const FX = { MYR: 1, USD: 4.45, SGD: 3.3, EUR: 4.85, GBP: 5.7, AUD: 2.9, JPY: 0.03, CNY: 0.62, THB: 0.13, IDR: 0.00028, INR: 0.053, HKD: 0.57, AED: 1.21, CHF: 5.05 };
  const POLICY = { passScore: 70, sessionMinutes: 15, levels: [{ n: 1, upTo: 100000, who: "Senior Customer Service Officer" }, { n: 2, upTo: Infinity, who: "Branch Manager" }] };

  const GUIDE = {
    title: "How fixed deposit upliftment works",
    steps: [
      ["Serve the customer", "The Customer Service Officer sights the holder's identity, takes the signed request and registers it against the deposit."],
      ["Check the amount", "The system works out the payout, including the interest reduction on early withdrawal, and blocks a request that would leave less than MYR 5,000 in the deposit."],
      ["Extract", "ASV finds each handwritten signature on the request and crops it."],
      ["Compare with the holders", "Each signature is compared with the specimen of a named holder. Joint accounts follow their own rule: both must sign, or either may sign."],
      ["Approve", "A match goes to the Senior Customer Service Officer, or the Branch Manager for larger amounts. A flag goes to fraud review first."],
    ],
    outcomes: [
      ["pass", "Likely match", "Every required holder's signature matches and the account rule is met. The request can be submitted for approval."],
      ["flag", "Flagged", "A signature scored below the pass score. A fraud analyst reviews it and may clear it after calling the holder back."],
      ["fail", "Mandate not met", "The signatures are genuine but the account rule is not met, for example one holder signed on a both-to-sign account. The request returns to the customer."],
    ],
    who: [["Customer Service Officer", "Sights ID, registers, verifies and submits."], ["Fraud Review Analyst", "Reviews flagged signatures; clears with a callback or confirms forgery."], ["Senior Customer Service Officer", "Approves up to MYR 100,000."], ["Branch Manager", "Approves above MYR 100,000 and all fraud-cleared requests."], ["Internal Auditor", "Reads cases and the audit trail."]],
    extra: { title: "What makes this use case different", items: ["The customer is at the counter, so identity is checked in person before registration.", "Early withdrawal pays only half of the interest earned so far. The system shows the payout before approval.", "A request presented by a representative needs the holder's signed authority letter. ASV does not replace that.", "Joint deposits follow the account rule: both holders, or either holder.", "Closed accounts and deposits that would be left below MYR 5,000 cannot be registered."] },
    limits: ["The system is only as good as the specimen on file. Compare each signature with the holder the account rule requires.", "Genuine signatures vary with writing conditions, age and scan quality. A low score is a reason to look closer, not proof of forgery.", "Scans carry no pen pressure, speed or stroke order.", "A score never authorises a withdrawal. A second person always approves."],
  };
  window.APP = { KEY: "fd", PASSWORD: "Orange@2026", BRAND: { sub: "Fixed deposits", register: "Register upliftment", review: "Fraud review", checksTitle: "Upliftment checks",
    headline: "Confirm the depositor signed before a fixed deposit is uplifted.", blurb: "Upliftment and rollover requests are checked against the holders' specimens and the account rule, with identity checked at the counter and a second person approving the payout.",
    spec: { seed: 52, title: "Specimen signature card", acct: "FD-5521-009876", caption: "Lim Chee Keong, primary holder. Verified 14 Mar 2021." } },
    ROLES, USERS, BRANCHES, ACCOUNTS, TYPES, FX, POLICY, GUIDE };
})();
