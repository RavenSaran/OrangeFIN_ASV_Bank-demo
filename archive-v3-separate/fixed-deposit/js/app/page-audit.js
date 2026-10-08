/* Audit trail: every sign-in, sign-out and case action, with filters and export. Auditors and approvers only. */
Shell.init({ page: "audit.html", roles: ["auditor", "manager", "head"] }, function (user, view) {
  const A = APP, esc = UI.esc, f = { type: "", uid: "", q: "" };
  view.innerHTML = '<div class="pagehead"><div><div class="crumb">Governance</div><h1>Audit trail</h1></div><div class="actions"><button class="btn" id="exp">Export CSV</button></div></div>' +
    '<section class="panel"><header><div class="tools" style="flex:1;gap:10px;flex-wrap:wrap"><select id="type" style="width:170px" aria-label="Event type"><option value="">All events</option><option value="auth">Sign-in and access</option><option value="case">Case actions</option></select>' +
    '<select id="uid" style="width:230px" aria-label="User"><option value="">All users</option>' + A.USERS.map((u) => '<option value="' + u.id + '">' + esc(u.name) + " (" + u.id + ")</option>").join("") + '</select>' +
    '<input type="search" id="q" placeholder="Search case number or detail" style="width:250px" aria-label="Search"></div><span class="tools small muted" id="n"></span></header><div class="body flush tablewrap" id="t"></div></section>';
  let rows = [];
  function draw() {
    const q = f.q.toLowerCase();
    rows = DB.events().filter((e) => (!f.type || e.type === f.type) && (!f.uid || e.uid === f.uid) && (!q || (e.caseId + " " + e.detail + " " + e.action).toLowerCase().includes(q))).reverse();
    view.querySelector("#n").textContent = rows.length + " events";
    view.querySelector("#t").innerHTML = rows.length ? '<table class="grid"><thead><tr><th>Time</th><th>User</th><th>Role</th><th>Event</th><th>Case</th><th>Detail</th></tr></thead><tbody>' + rows.slice(0, 300).map((e) =>
      '<tr><td class="nowrap">' + UI.dt(e.ts) + "</td><td>" + esc(e.name) + '<span class="sub">' + esc(e.uid) + "</span></td><td>" + esc(A.ROLES[e.role] ? A.ROLES[e.role].title : e.role) + '</td><td><b>' + esc(e.action) + "</b></td><td>" + (e.caseId ? '<a href="case.html?id=' + esc(e.caseId) + '">' + esc(e.caseId) + "</a>" : "") + '</td><td class="muted">' + esc(e.detail) + "</td></tr>").join("") + "</tbody></table>" : '<div class="empty"><b>No events match</b>Change the filters.</div>';
  }
  ["type", "uid"].forEach((id) => view.querySelector("#" + id).addEventListener("change", (e) => { f[id] = e.target.value; draw(); }));
  view.querySelector("#q").addEventListener("input", (e) => { f.q = e.target.value; draw(); });
  view.querySelector("#exp").onclick = () => {
    const csv = UI.csv([["Time", "User ID", "User", "Role", "Event", "Case", "Detail"]].concat(rows.map((e) => [e.ts, e.uid, e.name, e.role, e.action, e.caseId, e.detail])));
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "asv-audit-trail.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    DB.log(user, "auth", "Exported audit trail", "", rows.length + " events"); UI.toast("Exported " + rows.length + " events.", "ok"); draw();
  };
  draw();
});
