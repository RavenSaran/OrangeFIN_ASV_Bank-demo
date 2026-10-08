/* Home: every module this person works in as a tile, their headline numbers, the next few things waiting for them,
   and recent activity. Each module has its own Dashboard and Work pages (page-module.js, page-work.js). */
Shell.init({ page: "dashboard.html" }, function (user, view) {
  const A = APP, R = Rules, esc = UI.esc, cases = UI.visible(user, DB.cases()), events = DB.events().filter((e) => e.type === "case");
  const open = (c) => R.STATUS[c.status].open, lvl = A.ROLES[user.role].approveLevel;
  const work = UI.workFor(user, cases), list = work.list.slice().sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  const rel = events.filter((e) => user.role !== "maker" || (DB.case(e.caseId) || {}).maker === user.id).slice(-6).reverse();
  const hr = new Date().getHours(), greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

  // One tile per module this person works in. The whole tile is the link.
  const tiles = user.modules.map((k) => {
    const m = A.MODULES[k], mc = cases.filter((c) => A.TYPES[c.type].module === k), q = UI.queue(user, mc).length, o = mc.filter(open).length, f = mc.filter((c) => ["asv_flag", "fraud_review", "on_hold"].includes(c.status)).length;
    return '<a class="tile" href="module.html?m=' + k + '" style="--m:' + m.accent[0] + '"><h3>' + esc(m.name) + "</h3><p>" + esc(m.desc) + '</p><div class="nums"><div><b class="' + (q ? "hot" : "") + '">' + q + "</b><span>Waiting for you</span></div><div><b>" + o + "</b><span>Open cases</span></div><div><b>" + f + "</b><span>Flagged or in review</span></div></div><span class=\"enter\">Open module</span></a>";
  }).join("");

  const levelsTable = (type) => A.TYPES[type].levels.map((l, i, a) => '<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0;' + (l.n <= lvl ? "" : "color:var(--faint)") + '"><span>Level ' + l.n + ", " + esc(l.who) + '</span><b class="nowrap">' + (l.upTo == null ? "Above " + (a[i - 1] ? a[i - 1].upTo.toLocaleString("en-US") : "0") : "Up to " + l.upTo.toLocaleString("en-US")) + "</b></div>").join("");
  const authority = lvl ? '<section class="panel"><header>Your approval authority</header><div class="body small">' + user.modules.map((k) => '<div style="margin:0 0 8px"><b>' + esc(A.MODULES[k].name) + "</b>" + levelsTable(A.MODULES[k].type) + "</div>").join("") +
    '<p class="hint" style="margin-top:6px">Amounts are MYR equivalent. You cannot approve a case you registered or cleared.</p></div></section>' : "";

  view.innerHTML = '<div class="pagehead"><div><div class="crumb">' + greet + ", " + esc(user.name.split(" ")[0]) + '</div><h1>Home</h1></div><div class="actions"><a class="btn" href="cases.html">All cases</a></div></div>' +
    '<h2 class="sect">Your modules</h2><div class="tiles">' + tiles + "</div>" +
    '<div class="strip">' + UI.kpis(user, cases).map((c) => '<div class="cell"><span>' + c[0] + "</span><b class=\"" + (c[2] || "") + '">' + c[1] + "</b></div>").join("") + "</div>" +
    '<div class="cols"><div><section class="panel"><header>' + work.title + '<span class="tools"><span class="small muted">' + list.length + " case" + (list.length === 1 ? "" : "s") + '</span><a class="btn" href="work.html">' + (work.audit ? "See what needs attention" : "See all my work") + '</a></span></header><div class="body flush" id="q"></div></section>' +
    '<section class="panel"><header>Recent activity</header><ul class="tl" style="margin:0">' + (rel.length ? rel.map((e) => '<li><time>' + esc(UI.ago(e.ts)) + '</time><div><b>' + esc(e.action) + '</b> <a href="case.html?id=' + esc(e.caseId) + '">' + esc(e.caseId) + "</a><p>" + esc(e.name) + (e.detail ? ". " + esc(e.detail) : "") + "</p></div></li>").join("") : '<li><div class="muted">No activity yet.</div></li>') + "</ul></section></div>" +
    "<div>" + authority + '<section class="panel"><header>Each module has its own pages</header><div class="body small muted">Open a module to see its dashboard, the work waiting for you in it, all of its cases, and how its process works.</div></section></div></div>';
  const q = view.querySelector("#q");
  q.innerHTML = UI.caseTable(list.slice(0, 6), { owner: work.audit, user, emptyTitle: "Nothing is waiting for you", emptyText: user.role === "maker" ? "Open your module and register an instruction to get started." : "New cases will appear here as they reach your stage." });
  UI.bindRows(q);
});
