/* Case list with search and filters. */
Shell.init({ page: "cases.html" }, function (user, view) {
  const A = APP, R = Rules, esc = UI.esc, all = DB.cases(), params = new URLSearchParams(location.search);
  const mineQueue = new Set(UI.queue(user, all).map((c) => c.id));
  const opt = (v, l, sel) => '<option value="' + v + '"' + (sel ? " selected" : "") + ">" + esc(l) + "</option>";
  const statusOpts = [["open", "All open"], ["all", "All statuses"], ["queue", "Waiting for me"]].concat(Object.keys(R.STATUS).map((k) => [k, R.STATUS[k].label]));
  const f = { q: params.get("q") || "", type: "", status: params.get("status") || (user.role === "auditor" ? "all" : "open"), branch: "" };

  view.innerHTML = '<div class="pagehead"><div><div class="crumb">Work</div><h1>Cases</h1></div><div class="actions">' + (user.role === "maker" ? '<a class="btn primary" href="new-case.html">' + esc(A.BRAND.register) + "</a>" : "") + "</div></div>" +
    '<section class="panel"><header><div class="tools" style="flex:1;gap:10px;flex-wrap:wrap">' +
    '<input type="search" id="q" placeholder="Case number, customer or account" value="' + esc(f.q) + '" style="width:260px" aria-label="Search">' +
    (Object.keys(A.TYPES).length > 1 ? '<select id="type" style="width:190px" aria-label="Instruction type">' + opt("", "All instruction types") + Object.keys(A.TYPES).map((k) => opt(k, A.TYPES[k].label)).join("") + "</select>" : "") +
    '<select id="status" style="width:210px" aria-label="Status">' + statusOpts.map((s) => opt(s[0], s[1], s[0] === f.status)).join("") + "</select>" +
    '<select id="branch" style="width:190px" aria-label="Branch">' + opt("", "All branches") + Object.keys(A.BRANCHES).map((k) => opt(k, A.BRANCHES[k])).join("") + "</select></div>" +
    '<span class="tools small muted" id="count"></span></header><div class="body flush" id="list"></div></section>';

  const list = view.querySelector("#list");
  function draw() {
    const q = f.q.toLowerCase();
    const rows = all.filter((c) =>
      (!f.type || c.type === f.type) && (!f.branch || c.branch === f.branch) &&
      (f.status === "all" || (f.status === "open" ? R.STATUS[c.status].open : f.status === "queue" ? mineQueue.has(c.id) : c.status === f.status)) &&
      (!q || [c.id, c.customer, c.accountNo, c.fields.payee || ""].join(" ").toLowerCase().includes(q))
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    view.querySelector("#count").textContent = rows.length + " of " + all.length + " cases";
    list.innerHTML = UI.caseTable(rows, { owner: true, emptyTitle: "No cases match", emptyText: "Change the filters or clear the search." });
  }
  ["q", "type", "status", "branch"].filter((id) => view.querySelector("#" + id)).forEach((id) => view.querySelector("#" + id).addEventListener(id === "q" ? "input" : "change", (e) => { f[id] = e.target.value; draw(); }));
  UI.bindRows(list); draw();
});
