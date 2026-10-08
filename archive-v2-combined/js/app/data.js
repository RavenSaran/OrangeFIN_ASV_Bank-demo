/* Reference data for the console: staff, roles, customer account master, FX and policy.
   Front-end demonstration only: there is no server, so sign-in and permissions are simulated in the browser. */
(function () {
  const PASSWORD = "Orange@2026"; // shared demo password

  const ROLES = {
    maker: { title: "Operations Officer", short: "Maker", approveLevel: 0, desc: "Registers instructions, runs signature verification and submits cases." },
    fraud: { title: "Fraud Review Analyst", short: "Fraud review", approveLevel: 0, desc: "Investigates cases the system flags and confirms or overrides the result." },
    checker: { title: "Senior Operations Officer", short: "Checker", approveLevel: 1, desc: "Approves cases up to Level 1 authority." },
    manager: { title: "Branch Manager", short: "Approver", approveLevel: 2, desc: "Approves cases up to Level 2 authority and all fraud-cleared overrides." },
    head: { title: "Head of Operations", short: "Approver", approveLevel: 3, desc: "Approves cases of any value." },
    auditor: { title: "Internal Auditor", short: "Audit", approveLevel: 0, desc: "Read-only access to cases and the audit trail." },
  };

  const USERS = [
    { id: "OP-1042", name: "Aisha Rahman", role: "maker", branch: "KL01" },
    { id: "OP-1057", name: "Daniel Lee Wei Jie", role: "maker", branch: "PJ02" },
    { id: "FR-3004", name: "Farid Hakim", role: "fraud", branch: "HO" },
    { id: "SO-2011", name: "Priya Nair", role: "checker", branch: "KL01" },
    { id: "BM-4001", name: "Hafiz Ismail", role: "manager", branch: "KL01" },
    { id: "HO-5001", name: "Catherine Wong", role: "head", branch: "HO" },
    { id: "IA-6002", name: "Ravi Chandran", role: "auditor", branch: "HO" },
  ];

  const BRANCHES = { KL01: "Kuala Lumpur Main", PJ02: "Petaling Jaya", PG03: "Penang Georgetown", KCH04: "Kuching", HO: "Head Office" };

  // Signing mandates. rule: "any" = any n of the listed signatories, "all" = every listed signatory.
  // tier: up to `limit` (MYR equivalent) fewer signatures are accepted.
  const ACCOUNTS = [
    { no: "8001-2345-6789", name: "ABC Sdn. Bhd.", kind: "current", status: "Active", branch: "KL01", since: "2018-06-12", specimenDate: "2024-02-19",
      mandate: { rule: "any", n: 2, text: "Any 2 of 3 authorised signatories" },
      parties: [{ id: "p1", name: "Tan Wei Ming", role: "Director", seed: 11 }, { id: "p2", name: "Siti Nurhaliza Aziz", role: "Finance Director", seed: 23 }, { id: "p3", name: "Rajesh Kumar", role: "General Manager", seed: 37 }] },
    { no: "7002-8891-4402", name: "Borneo Marine Supplies Sdn. Bhd.", kind: "current", status: "Active", branch: "KCH04", since: "2015-03-02", specimenDate: "2023-08-30",
      mandate: { rule: "any", n: 2, text: "Any 2 of 3 authorised signatories" },
      parties: [{ id: "p1", name: "Ahmad Faris Hassan", role: "Managing Director", seed: 81 }, { id: "p2", name: "Chong Siew Lan", role: "Finance Manager", seed: 94 }, { id: "p3", name: "Daniel Ong", role: "Operations Director", seed: 107 }] },
    { no: "8003-1120-5534", name: "Sunrise Logistics Sdn. Bhd.", kind: "current", status: "Active", branch: "PJ02", since: "2020-11-23", specimenDate: "2022-05-09",
      mandate: { rule: "all", text: "Both authorised signatories together" },
      parties: [{ id: "p1", name: "Lau Kok Seng", role: "Director", seed: 120 }, { id: "p2", name: "Nadia Binti Karim", role: "Director", seed: 133 }] },
    { no: "8004-7781-2290", name: "Mega Build Sdn. Bhd.", kind: "current", status: "Active", branch: "KL01", since: "2012-09-04", specimenDate: "2025-01-14",
      mandate: { rule: "any", n: 2, tier: { limit: 50000, n: 1 }, text: "Any 1 signatory up to MYR 50,000; any 2 above" },
      parties: [{ id: "p1", name: "Ong Boon Hock", role: "Managing Director", seed: 146 }, { id: "p2", name: "Shalini Menon", role: "Finance Controller", seed: 159 }, { id: "p3", name: "Kamal Arifin", role: "Project Director", seed: 172 }] },
    { no: "8005-9930-1178", name: "Eastern Foods Bhd.", kind: "current", status: "Active", branch: "PG03", since: "2009-01-15", specimenDate: "2021-10-01",
      mandate: { rule: "any", n: 2, text: "Any 2 of 4 authorised signatories" },
      parties: [{ id: "p1", name: "Yeoh Beng Hwa", role: "Chairman", seed: 185 }, { id: "p2", name: "Farah Diyana", role: "CFO", seed: 198 }, { id: "p3", name: "Gurdeep Singh", role: "Director", seed: 211 }, { id: "p4", name: "Tay Li Ying", role: "Treasurer", seed: 224 }] },
    { no: "7007-3351-0902", name: "Golden Palm Exports Sdn. Bhd.", kind: "current", status: "Dormant", branch: "KL01", since: "2016-07-19", specimenDate: "2019-04-22",
      mandate: { rule: "any", n: 2, text: "Any 2 of 2 authorised signatories" },
      parties: [{ id: "p1", name: "Hasnah Ibrahim", role: "Director", seed: 237 }, { id: "p2", name: "Lee Chun Wai", role: "Director", seed: 245 }] },

    { no: "FD-5521-009876", name: "Lim Chee Keong and Lim Mei Ling", kind: "fd", status: "Active", branch: "KL01", since: "2021-03-14", specimenDate: "2021-03-14", maturity: "2027-03-14", rate: "3.35% p.a.",
      mandate: { rule: "all", text: "Joint account, both holders must sign" },
      parties: [{ id: "p1", name: "Lim Chee Keong", role: "Primary holder", seed: 52 }, { id: "p2", name: "Lim Mei Ling", role: "Joint holder", seed: 68 }] },
    { no: "FD-5521-010442", name: "Wong Ah Seng", kind: "fd", status: "Active", branch: "PJ02", since: "2022-08-01", specimenDate: "2022-08-01", maturity: "2026-12-01", rate: "3.50% p.a.",
      mandate: { rule: "any", n: 1, text: "Sole holder" },
      parties: [{ id: "p1", name: "Wong Ah Seng", role: "Sole holder", seed: 250 }] },
    { no: "FD-5521-013055", name: "Nur Aisyah Binti Omar and Omar Bin Yusof", kind: "fd", status: "Active", branch: "PG03", since: "2023-02-20", specimenDate: "2023-02-20", maturity: "2027-02-20", rate: "3.40% p.a.",
      mandate: { rule: "any", n: 1, text: "Joint account, either holder may sign" },
      parties: [{ id: "p1", name: "Nur Aisyah Binti Omar", role: "Primary holder", seed: 263 }, { id: "p2", name: "Omar Bin Yusof", role: "Joint holder", seed: 276 }] },
    { no: "FD-5522-001208", name: "Chen Mei Fong", kind: "fd", status: "Active", branch: "KCH04", since: "2024-05-06", specimenDate: "2024-05-06", maturity: "2026-11-06", rate: "3.60% p.a.",
      mandate: { rule: "any", n: 1, text: "Sole holder" },
      parties: [{ id: "p1", name: "Chen Mei Fong", role: "Sole holder", seed: 289 }] },
  ];

  const TYPES = {
    payment: { label: "Corporate payment", long: "Corporate payment instruction", form: "CPI-01", kind: "current", slaHours: 4, risk: "Unauthorised company payment",
      fields: [["payee", "Payee or beneficiary", "text"], ["reference", "Invoice or payment reference", "text"], ["purpose", "Payment purpose", "text"]] },
    fd: { label: "Fixed deposit upliftment", long: "Fixed deposit upliftment request", form: "FDU-07", kind: "fd", slaHours: 24, risk: "Fraudulent withdrawal",
      fields: [["instruction", "Instruction", "select:Early withdrawal;Rollover for 12 months;Withdrawal at maturity"], ["credit", "Credit proceeds to account", "text"]] },
    tt: { label: "Telegraphic transfer", long: "Telegraphic transfer application", form: "TTA-03", kind: "current", slaHours: 3, risk: "Fraudulent fund transfer",
      fields: [["payee", "Beneficiary name", "text"], ["bank", "Beneficiary bank and country", "text"], ["purpose", "Purpose of transfer", "text"]] },
  };

  // Indicative rates to MYR. A currency that is not listed has no rate and is routed to the highest authority.
  const FX = { MYR: 1, USD: 4.45, SGD: 3.3, EUR: 4.85, GBP: 5.7, AUD: 2.9, JPY: 0.03, CNY: 0.62, THB: 0.13, IDR: 0.00028, INR: 0.053, HKD: 0.57, AED: 1.21, CHF: 5.05 };

  const POLICY = {
    passScore: 70,
    levels: [{ n: 1, upTo: 100000, who: "Senior Operations Officer" }, { n: 2, upTo: 1000000, who: "Branch Manager" }, { n: 3, upTo: Infinity, who: "Head of Operations" }],
    sessionMinutes: 15,
  };

  window.APP = { PASSWORD, ROLES, USERS, BRANCHES, ACCOUNTS, TYPES, FX, POLICY };
})();
