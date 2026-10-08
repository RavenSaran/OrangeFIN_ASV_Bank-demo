/* Specimen register: accounts, signing mandates and the signatures on file. */
Shell.init({ page: "specimens.html" }, function (user, view) {
  const A = APP, esc = UI.esc, cases = DB.cases();
  let sel = new URLSearchParams(location.search).get("acct") || A.ACCOUNTS[0].no, q = "";
  view.innerHTML = '<div class="pagehead"><div><div class="crumb">Reference</div><h1>Specimen register</h1></div></div><div class="cols"><section class="panel"><header><input type="search" id="q" placeholder="Search account or customer" style="width:280px" aria-label="Search accounts"><span class="tools small muted" id="n"></span></header><div class="body flush tablewrap" id="list"></div></section><div id="detail"></div></div>';
  const list = view.querySelector("#list"), detail = view.querySelector("#detail");
  function draw() {
    const rows = A.ACCOUNTS.filter((a) => !q || (a.no + " " + a.name).toLowerCase().includes(q));
    view.querySelector("#n").textContent = rows.length + " accounts";
    list.innerHTML = '<table class="grid"><thead><tr><th>Account</th><th>Customer</th><th>Type</th><th>Branch</th><th>Status</th></tr></thead><tbody>' + rows.map((a) => '<tr class="click" tabindex="0" data-a="' + a.no + '" style="' + (a.no === sel ? "background:#fbeadd" : "") + '"><td class="id">' + esc(a.no) + "</td><td>" + esc(a.name) + '<span class="sub">' + esc(a.mandate.text) + "</span></td><td>" + (a.kind === "fd" ? "Fixed deposit" : "Current") + "</td><td>" + esc(A.BRANCHES[a.branch]) + '</td><td><span class="st ' + (a.status === "Active" ? "pass" : "flag") + '">' + esc(a.status) + "</span></td></tr>").join("") + "</tbody></table>";
    const a = A.ACCOUNTS.find((x) => x.no === sel), rel = cases.filter((c) => c.accountNo === sel).slice(0, 5);
    detail.innerHTML = '<section class="panel"><header>' + esc(a.name) + '</header><div class="body"><div class="kv" style="grid-template-columns:1fr 1fr"><div><span>Account</span><b>' + esc(a.no) + "</b></div><div><span>Opened</span><b>" + UI.date(a.since) + "</b></div><div><span>Specimens verified</span><b>" + UI.date(a.specimenDate) + "</b></div><div><span>Status</span><b>" + esc(a.status) + "</b></div></div>" +
      (a.status !== "Active" ? '<div class="msg warn" style="margin-top:10px">Dormant account. New instructions cannot be registered.</div>' : "") + "<p style=\"margin:10px 0 0\"><b>" + esc(a.mandate.text) + "</b></p></div><div class=\"body flush\">" +
      a.parties.map((p) => '<div class="party" style="grid-template-columns:150px 1fr"><img style="width:150px;height:62px" src="' + UI.refSrc(p) + '" alt="Specimen of ' + esc(p.name) + '"><div><b>' + esc(p.name) + '</b><div class="muted small">' + esc(p.role) + "</div></div></div>").join("") + "</div></section>" +
      '<section class="panel"><header>Recent cases</header><div class="body flush">' + (rel.length ? '<table class="grid"><tbody>' + rel.map((c) => '<tr class="click" data-id="' + esc(c.id) + '"><td class="id">' + esc(c.id) + "</td><td>" + UI.status(c.status) + '</td><td class="r">' + esc(UI.money(c.amount, c.currency)) + "</td></tr>").join("") + "</tbody></table>" : '<div class="empty">No cases for this account yet.</div>') + "</div></section>";
    UI.bindRows(detail);
  }
  list.addEventListener("click", (e) => { const tr = e.target.closest("tr[data-a]"); if (tr) { sel = tr.dataset.a; draw(); } });
  view.querySelector("#q").addEventListener("input", (e) => { q = e.target.value.toLowerCase(); draw(); });
  draw();
});
