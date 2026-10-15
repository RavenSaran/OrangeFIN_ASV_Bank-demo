/* OrangeFIN signature verification: the shared core. One company, one staff directory, six modules.
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
    { id: "LO-1042", name: "Siti Aminah Yusof", role: "maker", post: "Branch Operations Officer", branch: "KL01", modules: ["loi"] },
    { id: "LO-1057", name: "Raj Kumar Nair", role: "maker", post: "Branch Operations Officer", branch: "PJ02", modules: ["loi"] },
    { id: "AO-1042", name: "Wong Mei Ling", role: "maker", post: "Corporate Banking Officer", branch: "KL01", modules: ["mnd"] },
    { id: "AO-1057", name: "Ahmad Zaki Rahim", role: "maker", post: "Corporate Banking Officer", branch: "PJ02", modules: ["mnd"] },
    { id: "TF-1042", name: "Tan Chee Meng", role: "maker", post: "Trade Finance Officer", branch: "KL01", modules: ["tf"] },
    { id: "TF-1057", name: "Nurul Ain Hashim", role: "maker", post: "Trade Finance Officer", branch: "PJ02", modules: ["tf"] },
    { id: "FR-3004", name: "Farid Hakim", role: "fraud", post: "Fraud and Compliance Analyst", branch: "HO", modules: ["pay", "fd", "tt", "loi", "mnd", "tf"] },
    { id: "FR-3011", name: "Marcus Tan Wei Lun", role: "fraud", post: "Fraud and Compliance Analyst", branch: "HO", modules: ["pay", "fd", "tt", "loi", "mnd", "tf"] },
    { id: "SO-2011", name: "Priya Nair", role: "checker", post: "Senior Operations Officer", branch: "KL01", modules: ["pay", "fd", "tt", "loi", "mnd", "tf"] },
    { id: "BM-4001", name: "Hafiz Ismail", role: "manager", post: "Branch Manager", branch: "KL01", modules: ["pay", "fd", "tt", "loi", "mnd", "tf"] },
    { id: "HO-5001", name: "Catherine Wong", role: "head", post: "Head of Operations", branch: "HO", modules: ["pay", "fd", "tt", "loi", "mnd", "tf"] },
    { id: "IA-6002", name: "Ravi Chandran", role: "auditor", post: "Internal Auditor", branch: "HO", modules: ["pay", "fd", "tt", "loi", "mnd", "tf"] },
  ];
  const BRANCHES = { KL01: "Kuala Lumpur Main", PJ02: "Petaling Jaya", PG03: "Penang Georgetown", KCH04: "Kuching", HO: "Head Office" };

  // The six modules. "type" is the instruction type the module handles; accent is main, dark and soft colour.
  const MODULES = {
    pay: { key: "pay", type: "payment", name: "Corporate payment", short: "Payments", accent: ["#c44a05", "#a53d03", "#fbeadd"], desc: "Company payment instructions, checked against the company's signing mandate before the money is released." },
    fd: { key: "fd", type: "fd", name: "Fixed deposit", short: "Fixed deposits", accent: ["#0d6b63", "#0a5650", "#dcefec"], desc: "Counter requests to withdraw or renew a deposit, checked against the holders' signatures." },
    tt: { key: "tt", type: "tt", name: "TT and remittance", short: "Remittance", accent: ["#2a4d94", "#1f3b75", "#e1e9f6"], desc: "High-value over-the-counter and cross-border transfers, with the beneficiary, the daily limit and cash reporting checked alongside the signature." },
    loi: { key: "loi", type: "loi", name: "Branch transactions and LOI", nav: "Letters of instruction", short: "Letters", accent: ["#7a3e9d", "#62307f", "#f0e6f6"], desc: "Signed letters of instruction for changes and requests on a company account, with the company chop checked." },
    mnd: { key: "mnd", type: "mandate", name: "Account opening and mandate updates", nav: "Mandates and accounts", short: "Mandates", accent: ["#a8324a", "#8a283c", "#f8e4e8"], desc: "New accounts and changes to who may sign, checked against the existing signatories and the board resolution." },
    tf: { key: "tf", type: "trade", name: "Trade finance", short: "Trade", accent: ["#8f6a00", "#755600", "#f6efd6"], desc: "Letters of credit and guarantees, checked against every required signatory, the facility limit and the counterparty." },
  };

  const FX = { MYR: 1, USD: 4.45, SGD: 3.3, EUR: 4.85, GBP: 5.7, AUD: 2.9, JPY: 0.03, CNY: 0.62, THB: 0.13, IDR: 0.00028, INR: 0.053, HKD: 0.57, AED: 1.21, CHF: 5.05 };
  const SEED_LOGINS = [["PO-1042", 7.2], ["PO-1057", 6.9], ["CS-1042", 7.1], ["CS-1060", 6.8], ["RO-1042", 7.3], ["RO-1057", 6.7], ["LO-1042", 7.4], ["AO-1042", 7.2], ["TF-1042", 7.3], ["SO-2011", 7.0], ["BM-4001", 6.5], ["FR-3004", 7.1], ["FR-3011", 6.6], ["HO-5001", 5.0]];

  window.APP = {
    KEY: "orangefin_asv", PASSWORD: "Orange@2026", COMPANY: "OrangeFIN",
    POLICY: { passScore: 70, sessionMinutes: 15 }, ROLES, USERS, BRANCHES, MODULES, FX, SEED_LOGINS,
    TYPES: {}, FLOWS: {}, GUIDES: {}, SEEDS: [], ACCOUNTS: [], // filled by modules/*.js and accounts.js
  };
})();
