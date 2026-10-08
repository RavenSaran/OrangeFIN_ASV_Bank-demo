/* Dashboard: what is waiting for this person, in their role's terms. */
Shell.init({ page: "dashboard.html" }, function (user, view) {
  const A = APP, R = Rules, esc = UI.esc, cases = DB.cases(), events = DB.events();
  const role = A.ROLES[user.role], lvl = role.approveLevel, open = (c) => R.STATUS[c.status].open;
  const queue = UI.queue(user, cases), within = (c, h) => Date.now() - new Date(c.createdAt) < h * 3600e3;
  const mine = cases.filter((c) => c.maker === user.id), late = (c) => open(c) && new Date(c.dueAt) < Date.now();
  const days = (n) => (c) => Date.now() - new Date(c.closedAt || c.createdAt) < n * 86400e3;

  let cells, title = "Work waiting for you";
  if (user.role === "maker") {
    cells = [["Waiting for you", queue.length, queue.length ? "hot" : ""], ["Registered today", mine.filter((c) => within(c, 24)).length], ["With approval", mine.filter((c) => ["pending_approval", "fraud_review", "on_hold"].includes(c.status)).length], ["Returned for correction", mine.filter((c) => c.status === "reopened").length]];
  } else if (user.role === "fraud") {
    cells = [["In your queue", cases.filter((c) => c.status === "fraud_review").length, "hot"], ["On hold, callback pending", cases.filter((c) => c.status === "on_hold").length], ["Cleared by you, 7 days", cases.filter((c) => c.fraud && c.fraud.by === user.id && c.fraud.decision === "cleared" && days(7)(c)).length], ["Forgeries confirmed, 7 days", cases.filter((c) => c.fraudSuspected && days(7)(c)).length]];
  } else if (lvl) {
    const pend = cases.filter((c) => c.status === "pending_approval");
    cells = [["Waiting for your approval", queue.length, queue.length ? "hot" : ""], ["Above your authority", pend.filter((c) => c.level > lvl).length], ["Approved by you, 7 days", cases.filter((c) => c.approval && c.approval.by === user.id && !c.approval.rejected && days(7)(c)).length], ["Overdue", pend.filter(late).length, pend.filter(late).length ? "hot" : ""]];
  } else {
    title = "Open cases needing attention";
    cells = [["Open cases", cases.filter(open).length], ["Flagged by ASV, 7 days", cases.filter((c) => c.asv && c.asv.verdict === "review" && days(7)(c)).length], ["Fraud-cleared overrides", cases.filter((c) => c.override).length], ["Rejected, 7 days", cases.filter((c) => c.status === "rejected" && days(7)(c)).length]];
  }
  let list = queue;
  if (user.role === "auditor") list = cases.filter((c) => open(c) && (late(c) || (c.asv && c.asv.verdict !== "pass")));
  list = list.slice().sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

  const asv = cases.filter((c) => c.asv && days(7)(c)), by = (v) => asv.filter((c) => c.asv.verdict === v).length;
  const scores = asv.flatMap((c) => c.asv.sigs.map((s) => s.matched.score)), avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const rel = events.filter((e) => e.type === "case" && (user.role === "maker" ? (cases.find((c) => c.id === e.caseId) || {}).maker === user.id : true)).slice(-8).reverse();
  const hr = new Date().getHours(), greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

  const auth = lvl ? '<div class="panel"><header>Your approval authority</header><div class="body small">' + A.POLICY.levels.map((l) => '<div style="display:flex;justify-content:space-between;padding:3px 0;' + (l.n <= lvl ? "" : "color:var(--faint)") + '"><span>Level ' + l.n + ", " + esc(l.who) + "</span><b>" + (l.upTo === Infinity ? "Any amount" : "Up to MYR " + l.upTo.toLocaleString("en-US")) + "</b></div>").join("") +
    '<p class="hint" style="margin-top:8px">You cannot approve a case you registered or cleared. Fraud-cleared overrides need at least Level 2.</p></div></div>' : "";

  view.innerHTML = '<div class="pagehead"><div><div class="crumb">' + greet + ", " + esc(user.name.split(" ")[0]) + '</div><h1>Dashboard</h1></div><div class="actions">' +
    (user.role === "maker" ? '<a class="btn primary" href="new-case.html">' + esc(A.BRAND.register) + "</a>" : "") + '<a class="btn" href="cases.html">All cases</a></div></div>' +
    '<div class="strip">' + cells.map((c) => '<div class="cell"><span>' + c[0] + "</span><b class=\"" + (c[2] || "") + '">' + c[1] + "</b></div>").join("") + "</div>" +
    '<div class="cols"><div><section class="panel"><header>' + title + '<span class="tools small muted">' + list.length + " case" + (list.length === 1 ? "" : "s") + '</span></header><div class="body flush" id="q"></div></section>' +
    '<section class="panel"><header>Recent activity</header><ul class="tl" style="margin:0">' + (rel.length ? rel.map((e) => '<li><time>' + esc(UI.ago(e.ts)) + '</time><div><b>' + esc(e.action) + '</b> <a href="case.html?id=' + esc(e.caseId) + '">' + esc(e.caseId) + "</a><p>" + esc(e.name) + (e.detail ? ". " + esc(e.detail) : "") + "</p></div></li>").join("") : '<li><div class="muted">No activity yet.</div></li>') + "</ul></section></div>" +
    '<div><section class="panel"><header>This process in one line</header><div class="body small">' + esc(A.FLOW.line) + '<div style="margin-top:8px"><a href="flow.html">See the full process overview</a></div></div></section>' + auth + '<section class="panel"><header>Signature verification, last 7 days</header><div class="body flush"><table class="grid"><tbody>' +
    '<tr><td>Cases verified</td><td class="r"><b>' + asv.length + "</b></td></tr><tr><td><span class=\"st pass\">Likely match</span></td><td class=\"r\">" + by("pass") + "</td></tr>" +
    '<tr><td><span class="st flag">Flagged for review</span></td><td class="r">' + by("review") + '</td></tr><tr><td><span class="st fail">Mandate not met</span></td><td class="r">' + by("mandate") + "</td></tr>" +
    '<tr><td>Average match score</td><td class="r">' + avg + "</td></tr></tbody></table></div></section>" +
    '<section class="panel"><header>Service times</header><div class="body small muted">' + Object.keys(A.TYPES).map((k) => esc(A.TYPES[k].label) + " " + (A.TYPES[k].slaHours >= 24 ? A.TYPES[k].slaHours / 24 + " day" : A.TYPES[k].slaHours + " hours")).join(", ") + ' from registration. Overdue cases are marked in red.</div></section></div></div>';
  const q = view.querySelector("#q");
  q.innerHTML = UI.caseTable(list.slice(0, 8), { owner: user.role === "auditor", emptyTitle: "Nothing is waiting for you", emptyText: user.role === "maker" ? "Register a new instruction to get started." : "New cases will appear here as they reach your stage." });
  UI.bindRows(q);
});
