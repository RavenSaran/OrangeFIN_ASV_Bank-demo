/* OrangeFIN signature verification: the shared core. One company, one staff directory, three modules.
   Module-specific content is in modules/*.js; the account master is in accounts.js; starting cases are in modules/seeds-*.js.
   Front-end demonstration only: sign-in and permissions are simulated in the browser. */
(function () {
  const ROLES = {
    maker: { title: "Operations Officer", short: "Maker", approveLevel: 0, desc: "Registers instructions, runs signature verification and submits." },
    fraud: { title: "Fraud and Compliance Analyst", short: "Review", approveLevel: 0, desc: "Reviews flagged signatures and screening hits, and clears or rejects them." },
    checker: { title: "Senior Operations Officer", short: "Approver L1", approveLevel: 1, desc: "Approves up to Level 1." },
    manager: { title: "Branch Manager", short: "Approver L2", approveLevel: 2, desc: "Approves up to Level 2 and every case cleared after a flag." },
    head: { title: "Head of Operations", short: "Approver L3", approveLevel: 3, desc: "Approves any amount." },
    auditor: { title: "Internal Auditor", short: "Audit", approveLevel: 0, desc: "Read-only access to cases and the audit trail." },
  };

  // One directory for the whole company. "modules" is what each person may work in; "post" is their job title in their own area.
  const USERS = [
    { id: "PO-1042", name: "Aisha Rahman", role: "maker", post: "Payments Operations Officer", branch: "KL01", modules: ["pay"] },
    { id: "PO-1057", name: "Daniel Lee Wei Jie", role: "maker", post: "Payments Operations Officer", branch: "PJ02", modules: ["pay"] },
    { id: "CS-1042", name: "Nurul Huda Zainal", role: "maker", post: "Customer Service Officer", branch: "KL01", modules: ["fd"] },
    { id: "CS-1060", name: "Kevin Tan Boon Huat", role: "maker", post: "Customer Service Officer", branch: "PJ02", modules: ["fd"] },
    { id: "RO-1042", name: "Lim Jia Hui", role: "maker", post: "Remittance Officer", branch: "KL01", modules: ["tt"] },
    { id: "RO-1057", name: "Arjun Pillai", role: "maker", post: "Remittance Officer", branch: "PJ02", modules: ["tt"] },
    { id: "FR-3004", name: "Farid Hakim", role: "fraud", post: "Fraud and Compliance Analyst", branch: "HO", modules: ["pay", "fd", "tt"] },
    { id: "FR-3011", name: "Marcus Tan Wei Lun", role: "fraud", post: "Fraud and Compliance Analyst", branch: "HO", modules: ["pay", "fd", "tt"] },
    { id: "SO-2011", name: "Priya Nair", role: "checker", post: "Senior Operations Officer", branch: "KL01", modules: ["pay", "fd", "tt"] },
    { id: "BM-4001", name: "Hafiz Ismail", role: "manager", post: "Branch Manager", branch: "KL01", modules: ["pay", "fd", "tt"] },
    { id: "HO-5001", name: "Catherine Wong", role: "head", post: "Head of Operations", branch: "HO", modules: ["pay", "fd", "tt"] },
    { id: "IA-6002", name: "Ravi Chandran", role: "auditor", post: "Internal Auditor", branch: "HO", modules: ["pay", "fd", "tt"] },
  ];
  const BRANCHES = { KL01: "Kuala Lumpur Main", PJ02: "Petaling Jaya", PG03: "Penang Georgetown", KCH04: "Kuching", HO: "Head Office" };

  // The three modules. "type" is the instruction type the module handles; accent is main, dark and soft colour.
  const MODULES = {
    pay: { key: "pay", type: "payment", name: "Corporate payment", short: "Payments", accent: ["#c44a05", "#a53d03", "#fbeadd"], desc: "Company payment instructions, checked against the company's signing mandate before the money is released." },
    fd: { key: "fd", type: "fd", name: "Fixed deposit", short: "Fixed deposits", accent: ["#0d6b63", "#0a5650", "#dcefec"], desc: "Counter requests to withdraw or renew a deposit, checked against the holders' signatures." },
    tt: { key: "tt", type: "tt", name: "TT and remittance", short: "Remittance", accent: ["#2a4d94", "#1f3b75", "#e1e9f6"], desc: "Cross-border transfer applications, with the beneficiary screened alongside the signature check." },
  };

  const FX = { MYR: 1, USD: 4.45, SGD: 3.3, EUR: 4.85, GBP: 5.7, AUD: 2.9, JPY: 0.03, CNY: 0.62, THB: 0.13, IDR: 0.00028, INR: 0.053, HKD: 0.57, AED: 1.21, CHF: 5.05 };
  const SEED_LOGINS = [["PO-1042", 7.2], ["PO-1057", 6.9], ["CS-1042", 7.1], ["CS-1060", 6.8], ["RO-1042", 7.3], ["RO-1057", 6.7], ["SO-2011", 7.0], ["BM-4001", 6.5], ["FR-3004", 7.1], ["FR-3011", 6.6], ["HO-5001", 5.0]];

  window.APP = {
    KEY: "orangefin_asv", PASSWORD: "Orange@2026", COMPANY: "OrangeFIN",
    POLICY: { passScore: 70, sessionMinutes: 15 }, ROLES, USERS, BRANCHES, MODULES, FX, SEED_LOGINS,
    TYPES: {}, FLOWS: {}, GUIDES: {}, SEEDS: [], ACCOUNTS: [], // filled by modules/*.js and accounts.js
  };
})();
