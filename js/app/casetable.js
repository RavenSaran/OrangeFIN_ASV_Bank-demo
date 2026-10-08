/* Shared list pieces: the case table, what to do next on a case, what counts as someone's work, and small bar charts. */
(function () {
  const esc = UI.esc;

  // What this person should do next on this case, in plain words.
  UI.nextAction = function (user, c) {
    const hit = !!(c.screen && c.screen.hit && !c.screen.cleared);
    if (user.role === "maker") return { registered: c.asvSkip && !c.asv ? "Submit for approval (ASV not required)" : "Run signature verification", reopened: "Correct it and verify again", asv_pass: hit ? "Refer for review: screening hit" : "Submit for approval", asv_flag: "Refer for review", asv_mandate: "Return to the customer" }[c.status] || "Nothing to do";
    if (user.role === "fraud") return { fraud_review: c.fraudFirst ? (c.fraudFirst.by === user.id ? "Waiting for a second analyst" : "Clear as second analyst") : c.reviewReason === "high_value" ? "Call back and confirm the match" : "Review and decide", on_hold: "Repeat the callback" }[c.status] || "Nothing to do";
    if (A_approveLevel(user)) return c.status === "pending_approval" ? "Approve, reject or return" : "Nothing to do";
    const owner = Rules.STATUS[c.status].owner;
    return owner ? "With " + owner.toLowerCase() : "Closed";
  };
  const A_approveLevel = (u) => APP.ROLES[u.role].approveLevel;

  // The list of work for a person. Auditors have no queue, so they get the open cases that are overdue or not a clean match.
  UI.workFor = function (user, cases) {
    const open = (c) => Rules.STATUS[c.status].open;
    if (user.role === "auditor") return { title: "Open cases needing attention", list: cases.filter((c) => open(c) && (new Date(c.dueAt) < Date.now() || (c.asv && c.asv.verdict !== "pass"))), audit: true };
    return { title: "Work waiting for you", list: UI.queue(user, cases), audit: false };
  };

  // Headline numbers for a person, in their role's terms. cases is already limited to what they may see (and to one module, if scoped).
  UI.kpis = function (user, cases) {
    const A = APP, R = Rules, lvl = A.ROLES[user.role].approveLevel, open = (c) => R.STATUS[c.status].open, queue = UI.queue(user, cases), mine = cases.filter((c) => c.maker === user.id);
    const days = (n) => (c) => Date.now() - new Date(c.closedAt || c.createdAt) < n * 86400e3, within = (c, h) => Date.now() - new Date(c.createdAt) < h * 3600e3;
    const late = (c) => open(c) && new Date(c.dueAt) < Date.now();
    if (user.role === "maker") return [["Waiting for you", queue.length, queue.length ? "hot" : ""], ["Registered today", mine.filter((c) => within(c, 24)).length], ["With review or approval", mine.filter((c) => ["pending_approval", "fraud_review", "on_hold"].includes(c.status)).length], ["Returned for correction", mine.filter((c) => c.status === "reopened").length]];
    if (user.role === "fraud") return [["In your queue", cases.filter((c) => c.status === "fraud_review").length, "hot"], ["On hold, callback pending", cases.filter((c) => c.status === "on_hold").length], ["Cleared by you, 7 days", cases.filter((c) => c.fraud && c.fraud.by === user.id && c.fraud.decision === "cleared" && days(7)(c)).length], ["Forgeries confirmed, 7 days", cases.filter((c) => c.fraudSuspected && days(7)(c)).length]];
    if (lvl) { const pend = cases.filter((c) => c.status === "pending_approval"); return [["Waiting for your approval", queue.length, queue.length ? "hot" : ""], ["Above your authority", pend.filter((c) => c.level > lvl).length], ["Approved by you, 7 days", cases.filter((c) => c.approval && c.approval.by === user.id && !c.approval.rejected && days(7)(c)).length], ["Overdue", pend.filter(late).length, pend.filter(late).length ? "hot" : ""]]; }
    return [["Open cases", cases.filter(open).length], ["Flagged by ASV, 7 days", cases.filter((c) => c.asv && c.asv.verdict === "review" && days(7)(c)).length], ["Cleared after a flag", cases.filter((c) => c.override).length], ["Rejected, 7 days", cases.filter((c) => c.status === "rejected" && days(7)(c)).length]];
  };

  UI.caseTable = function (cases, opts) {
    opts = opts || {};
    if (!cases.length) return '<div class="empty"><b>' + esc(opts.emptyTitle || "Nothing here") + "</b>" + esc(opts.emptyText || "") + "</div>";
    const rows = cases.map((c) => {
      const owner = Rules.STATUS[c.status].owner;
      return '<tr class="click" tabindex="0" data-id="' + esc(c.id) + '"><td class="id">' + esc(c.id) + "</td><td>" + UI.modTag(c.type) + '<span class="sub">' + esc(c.customer) + "</span></td>" +
        '<td class="r nowrap">' + esc(UI.money(c.amount, c.currency)) + (c.currency !== "MYR" && c.myr != null ? '<span class="sub">MYR ' + Math.round(c.myr).toLocaleString("en-US") + "</span>" : c.myr == null ? '<span class="sub">No FX rate</span>' : "") + "</td>" +
        "<td>" + UI.level(c) + "</td><td>" + UI.status(c.status) + (owner && opts.owner ? '<span class="sub">With ' + esc(owner.toLowerCase()) + "</span>" : "") + "</td>" +
        (opts.user ? '<td><b>' + esc(UI.nextAction(opts.user, c)) + "</b></td>" : "") +
        "<td>" + UI.sla(c) + '</td><td class="nowrap muted">' + esc(opts.when === "ago" ? UI.ago(c.createdAt) : UI.dt(c.createdAt)) + "</td></tr>";
    }).join("");
    return '<div class="tablewrap"><table class="grid"><thead><tr><th>Case</th><th>Instruction</th><th class="r">Amount</th><th>Level</th><th>Status</th>' + (opts.user ? "<th>What to do</th>" : "") + "<th>Service time</th><th>Registered</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
  };
  UI.bindRows = function (root) {
    const go = (tr) => { if (tr) location.href = "case.html?id=" + encodeURIComponent(tr.dataset.id); };
    root.addEventListener("click", (e) => go(e.target.closest("tr.click")));
    root.addEventListener("keydown", (e) => { if (e.key === "Enter") go(e.target.closest("tr.click")); });
  };

  // Horizontal bars with the number always shown. rows: [{ label, value, tone, sub, href }], tone is pass, flag, fail, info, wait or neutral.
  UI.bars = function (rows, opts) {
    opts = opts || {};
    const max = Math.max(1, opts.max || Math.max.apply(null, rows.map((r) => r.value)));
    return '<div class="bars">' + rows.map((r) => {
      const w = r.value ? Math.max(2, Math.round((r.value / max) * 100)) : 0;
      const label = r.href ? '<a href="' + r.href + '">' + esc(r.label) + "</a>" : esc(r.label);
      return '<div class="bar-row"><span class="bl">' + label + (r.sub ? '<small>' + esc(r.sub) + "</small>" : "") + '</span><span class="bt"><i class="' + (r.tone || "neutral") + '" style="width:' + w + '%"></i></span><b class="bv">' + (opts.fmt ? opts.fmt(r.value) : r.value) + "</b></div>";
    }).join("") + "</div>";
  };
})();
