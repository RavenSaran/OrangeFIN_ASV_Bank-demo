/* Page frame: top bar, role-aware navigation, session clock. Pages call Shell.init and receive the signed-in user. */
(function () {
  const A = window.APP, esc = UI.esc;
  const NAV = [
    ["Work", [["dashboard.html", "Dashboard", null], ["cases.html", "Cases", "queue"], ["new-case.html", A.BRAND.register, null, ["maker"]]]],
    ["Reference", [["flow.html", "Process overview"], ["specimens.html", "Specimen register"], ["policy.html", "Policy and limits"]]],
    ["Governance", [["audit.html", "Audit trail", null, ["auditor", "manager", "head"]]]],
  ];

  const SECTIONS = [["pay", "corporate-payment", "Corporate payment"], ["fd", "fixed-deposit", "Fixed deposit"], ["tt", "tt-remittance", "TT and remittance"]];
  function frame(user, page) {
    const queue = UI.queue(user, DB.cases()).length;
    const nav = NAV.map(([g, items]) => {
      const vis = items.filter((i) => !i[3] || i[3].includes(user.role));
      if (!vis.length) return "";
      return "<h6>" + g + "</h6>" + vis.map((i) => '<a href="' + i[0] + '"' + (i[0] === page ? ' class="on" aria-current="page"' : "") + "><span>" + i[1] + "</span>" + (i[2] === "queue" && queue ? '<span class="n hot" title="Waiting for you">' + queue + "</span>" : "") + "</a>").join("");
    }).join("");
    document.body.innerHTML =
      '<header class="topbar"><a class="brand" href="dashboard.html"><i>O</i><span>OrangeFIN<small>' + esc(A.BRAND.sub) + '</small></span></a>' +
      '<form class="gsearch" id="gs" role="search"><input type="search" id="gq" placeholder="Case number, account or customer" aria-label="Search cases"></form>' +
      '<div class="top-r"><span class="muted">' + esc(A.BRANCHES[user.branch]) + " (" + user.branch + ')</span><div class="who"><b>' + esc(user.name) + "</b><span>" + esc(A.ROLES[user.role].title) + " (" + user.id + ')</span></div>' +
      '<span class="sess" id="sess" title="Session ends after ' + A.POLICY.sessionMinutes + ' minutes of inactivity"></span><button id="out" type="button">Sign out</button></div></header>' +
      '<div class="frame"><nav class="side" aria-label="Main">' + nav + '<h6>Use cases</h6><a href="../index.html"><span>All use cases</span></a>' + SECTIONS.map((s) => s[0] === A.KEY ? '<a class="here" aria-current="true"><span>' + s[2] + '</span><span class="n">Here</span></a>' : '<a href="../' + s[1] + '/dashboard.html"><span>' + s[2] + "</span></a>").join("") + '<div class="foot">Demonstration system.<br>Sample data only.</div></nav><main class="main" id="view"></main></div>';
    document.getElementById("out").onclick = () => Auth.logout();
    document.getElementById("gs").onsubmit = (e) => { e.preventDefault(); const q = document.getElementById("gq").value.trim(); location.href = "cases.html" + (q ? "?q=" + encodeURIComponent(q) : ""); };
    const sess = document.getElementById("sess");
    const tick = () => {
      const s = Auth.remaining(); if (s <= 0) return Auth.logout("timeout");
      sess.textContent = "Session " + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); sess.classList.toggle("warn", s < 60);
    };
    tick(); setInterval(tick, 1000);
    let last = 0; ["click", "keydown"].forEach((ev) => document.addEventListener(ev, () => { if (Date.now() - last > 5000) { last = Date.now(); Auth.touch(); } }));
    return document.getElementById("view");
  }

  window.Shell = {
    // opts: { page: "cases.html", roles: [...] } roles omitted means every signed-in role.
    init(opts, render) {
      DB.ensureSeeded();
      const user = Auth.require(); if (!user) return;
      const view = frame(user, opts.page);
      if (opts.roles && !opts.roles.includes(user.role)) {
        DB.log(user, "auth", "Access denied", "", opts.page);
        view.innerHTML = '<div class="panel" style="max-width:560px"><header>No access</header><div class="body"><p>Your role (' + esc(A.ROLES[user.role].title) + ') does not include this page.</p><a class="btn" href="dashboard.html">Back to dashboard</a></div></div>';
        return;
      }
      render(user, view);
    },
  };
})();
