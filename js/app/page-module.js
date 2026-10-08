/* Module dashboard: the full picture of one module. Numbers and charts only. The list of work is on its own page (work.html),
   all cases are on cases.html, and the process is on flow.html. */
Shell.init({ page: "module.html", module: "param", tab: "dashboard" }, function (user, view, key) {
  if (!key) { location.replace("dashboard.html"); return; }
  const A = APP, R = Rules, esc = UI.esc, M = A.MODULES[key], TY = A.TYPES[M.type], money = (n) => Math.round(n).toLocaleString("en-US");
  const cases = UI.visible(user, DB.cases()).filter((c) => A.TYPES[c.type].module === key);
  const open = (c) => R.STATUS[c.status].open, lvl = A.ROLES[user.role].approveLevel, week = (c) => Date.now() - new Date(c.closedAt || c.createdAt) < 7 * 86400e3;
  const work = UI.workFor(user, cases), overdue = work.list.filter((c) => new Date(c.dueAt) < Date.now()).length;
  const events = DB.events().filter((e) => e.type === "case" && e.caseId.indexOf(TY.prefix + "-") === 0 && (user.role !== "maker" || (DB.case(e.caseId) || {}).maker === user.id)).slice(-7).reverse();
  const n = (f) => cases.filter(f).length, st = (...s) => (c) => s.includes(c.status);

  // 1. where every case in this module is right now
  const stages = UI.bars([
    { label: "With the officer", sub: "Registered, verified, flagged or returned", value: n(st("registered", "reopened", "asv_pass", "asv_flag", "asv_mandate")), tone: "neutral" },
    { label: "With " + (TY.review || "review").toLowerCase(), sub: "Flagged cases and callbacks", value: n(st("fraud_review", "on_hold")), tone: "flag" },
    { label: "Awaiting approval", sub: "Submitted or cleared", value: n(st("pending_approval")), tone: "info" },
    { label: "Approved and released", sub: "Last 7 days", value: n((c) => c.status === "approved" && week(c)), tone: "pass" },
    { label: "Rejected", sub: "Last 7 days", value: n((c) => c.status === "rejected" && week(c)), tone: "fail" },
    { label: "Returned to customer", sub: "Last 7 days", value: n((c) => c.status === "returned" && week(c)), tone: "neutral" },
  ]);

  // 2. approvals waiting at each level of this module
  const pend = cases.filter(st("pending_approval")), lv = TY.levels;
  const byLevel = UI.bars(lv.map((l, i) => ({ label: "Level " + l.n + ", " + l.who, sub: l.upTo == null ? "Above MYR " + money(lv[i - 1].upTo) : (i ? "MYR " + money(lv[i - 1].upTo) + " to " : "Up to MYR ") + money(l.upTo), value: pend.filter((c) => c.level === l.n).length, tone: lvl && l.n <= lvl ? "info" : "neutral" })));
  const pendMYR = pend.reduce((s, c) => s + (c.myr || 0), 0);

  // 3. signature verification results
  const asv = cases.filter((c) => c.asv && week(c)), by = (v) => asv.filter((c) => c.asv.verdict === v).length, scores = asv.flatMap((c) => c.asv.sigs.map((s) => s.matched.score));
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0, flagRate = asv.length ? Math.round((by("review") / asv.length) * 100) : 0;
  const high = asv.filter((c) => c.asv.highRisk).length;
  const results = UI.bars([{ label: "Likely match", value: by("pass"), tone: "pass" }, { label: "Flagged for review", value: by("review"), tone: "flag" }, { label: "Of which high risk", sub: "Far below the pass score", value: high, tone: "fail" }, { label: "Mandate not met", value: by("mandate"), tone: "fail" }]);

  // 4. service times of the open cases
  const live = cases.filter(open), left = (c) => (new Date(c.dueAt) - Date.now()) / 60000;
  const timing = UI.bars([{ label: "Overdue", value: live.filter((c) => left(c) < 0).length, tone: "fail" }, { label: "Due within 1 hour", value: live.filter((c) => left(c) >= 0 && left(c) < 60).length, tone: "flag" }, { label: "Due later", value: live.filter((c) => left(c) >= 60).length, tone: "pass" }]);

  const levelsList = lv.map((l, i) => '<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0;' + (l.n <= lvl ? "" : "color:var(--faint)") + '"><span>Level ' + l.n + ", " + esc(l.who) + '</span><b class="nowrap">' + (l.upTo == null ? "Above " + money(lv[i - 1].upTo) : "Up to " + money(l.upTo)) + "</b></div>").join("");
  const panel = (t, b, tools) => '<section class="panel"><header>' + t + (tools ? '<span class="tools small muted">' + tools + "</span>" : "") + '</header><div class="body">' + b + "</div></section>";

  view.innerHTML = '<div class="pagehead"><div><div class="crumb">' + esc(M.name) + '</div><h1>Dashboard</h1></div><div class="actions">' + (user.role === "maker" ? '<a class="btn primary" href="new-case.html?m=' + key + '">' + esc(TY.registerLabel) + "</a>" : "") + '<a class="btn" href="cases.html?m=' + key + '">All cases</a></div></div>' +
    '<div class="cta"><div><b>' + (work.list.length ? work.list.length + " case" + (work.list.length === 1 ? "" : "s") + (work.audit ? " need attention" : " waiting for you") + " in this module" : "Nothing is waiting for you in this module") + "</b><span>" +
      (work.list.length ? (overdue ? overdue + " overdue. " : "None overdue. ") + "Open the list to see what to do on each one." : "New cases will appear here as they reach your stage.") + '</span></div><a class="btn primary" href="work.html?m=' + key + '">' + (work.audit ? "See what needs attention" : "Open my work") + "</a></div>" +
    '<div class="strip">' + UI.kpis(user, cases).map((c) => '<div class="cell"><span>' + c[0] + "</span><b class=\"" + (c[2] || "") + '">' + c[1] + "</b></div>").join("") + "</div>" +
    '<div class="cols"><div>' + panel("Cases by stage", stages, cases.length + " cases") +
      panel("Awaiting approval, by level", byLevel + '<p class="kpi-note">MYR ' + money(pendMYR) + " waiting for approval in total." + (lvl ? " Levels you can approve are shown in blue." : "") + "</p>") +
      '<section class="panel"><header>Recent activity</header><ul class="tl" style="margin:0">' + (events.length ? events.map((e) => '<li><time>' + esc(UI.ago(e.ts)) + '</time><div><b>' + esc(e.action) + '</b> <a href="case.html?id=' + esc(e.caseId) + '">' + esc(e.caseId) + "</a><p>" + esc(e.name) + (e.detail ? ". " + esc(e.detail) : "") + "</p></div></li>").join("") : '<li><div class="muted">No activity yet.</div></li>') + "</ul></section></div>" +
    "<div>" + panel("Signature verification, last 7 days", results + '<p class="kpi-note">' + asv.length + " cases verified. Average match score " + avg + ". " + flagRate + "% were flagged. Pass score " + Cfg.passFor({ module: key }) + ".</p>") +
      panel("Service times, open cases", timing + '<p class="kpi-note">' + TY.label + " target: " + (TY.slaHours >= 24 ? TY.slaHours / 24 + " day" : TY.slaHours + " hours") + " from registration.</p>") +
      panel("This module in one line", esc(A.FLOWS[M.type].line) + '<div style="margin-top:8px"><a href="flow.html?m=' + key + '">See the full process</a></div>') +
      (lvl ? panel("Your approval authority", '<div class="small">' + levelsList + '</div><p class="hint" style="margin-top:6px">Amounts are MYR equivalent. A case cleared after a flag needs at least Level 2.</p>') : "") +
      panel("What is specific to this module", '<ul class="small" style="margin:0;padding-left:18px">' + A.GUIDES[M.type].extra.items.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>") + "</div></div>";
});
