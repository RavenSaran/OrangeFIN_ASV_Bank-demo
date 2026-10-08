/* Page frame: top bar, navigation, the module bar and the session clock.
   Pages call Shell.init and receive the signed-in user. A page inside a module shows that module's own bar and accent colour. */
(function () {
  const A = window.APP, esc = UI.esc;
  const DEFAULT_ACCENT = ["#c44a05", "#a53d03", "#fbeadd"];

  function setAccent(a) { const s = document.documentElement.style; s.setProperty("--orange", a[0]); s.setProperty("--orange-dark", a[1]); s.setProperty("--orange-soft", a[2]); }

  function frame(user, page) {
    const mine = UI.queue(user, DB.cases()), perMod = {};
    mine.forEach((c) => { const k = A.TYPES[c.type].module; perMod[k] = (perMod[k] || 0) + 1; });
    const link = (href, label, extra) => '<a href="' + href + '" data-p="' + href.split("?")[0] + '">' + label + (extra || "") + "</a>";
    const badge = (n, hot) => (n ? '<span class="n' + (hot ? " hot" : "") + '" title="Waiting for you">' + n + "</span>" : "");
    const mods = user.modules.map((k) => { const m = A.MODULES[k]; return '<a href="module.html?m=' + k + '" data-mod="' + k + '"><span class="mod" style="--m:' + m.accent[0] + '">' + esc(m.name) + "</span>" + badge(perMod[k], true) + "</a>"; }).join("");
    const nav =
      "<h6>Work</h6>" + link("dashboard.html", "Home") + link("work.html", "My work", badge(mine.length, true)) + link("cases.html", "All cases") + (user.role === "maker" ? link("new-case.html", "Register instruction") : "") +
      "<h6>Modules</h6>" + mods +
      "<h6>Reference</h6>" + link("specimens.html", "Specimen register") + link("policy.html", "Policy and limits") +
      (["auditor", "manager", "head"].includes(user.role) ? "<h6>Governance</h6>" + link("audit.html", "Audit trail") + link("settings.html", "Settings") : "");
    document.body.innerHTML =
      '<header class="topbar"><a class="brand" href="dashboard.html"><i>O</i><span>OrangeFIN<small>Signature verification</small></span></a>' +
      '<form class="gsearch" id="gs" role="search"><input type="search" id="gq" placeholder="Case number, account or customer" aria-label="Search cases"></form>' +
      '<div class="top-r"><span class="muted">' + esc(A.BRANCHES[user.branch]) + " (" + user.branch + ')</span><div class="who"><b>' + esc(user.name) + "</b><span>" + esc(UI.post(user)) + " (" + user.id + ')</span></div>' +
      '<span class="sess" id="sess" title="Session ends after ' + A.POLICY.sessionMinutes + ' minutes of inactivity"></span><button id="out" type="button">Sign out</button></div></header>' +
      '<div id="modbar"></div><div class="frame"><nav class="side" aria-label="Main">' + nav + '<div class="foot">Demonstration system.<br>Sample data only.</div></nav><main class="main" id="view"></main></div>';
    document.querySelectorAll(".side a[data-p]").forEach((a) => { if (a.dataset.p === page) { a.classList.add("on"); a.setAttribute("aria-current", "page"); } });
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

  // Put the page inside a module: accent colour, module bar with its own tabs, and the module marked in the menu.
  // tab is one of: dashboard, work, cases, register, process (or null for a case file).
  function setModule(key, tab, user) {
    const bar = document.getElementById("modbar"), root = document.documentElement;
    document.querySelectorAll(".side a[data-mod]").forEach((a) => a.classList.toggle("here", a.dataset.mod === key));
    if (!key) { bar.innerHTML = ""; setAccent(DEFAULT_ACCENT); root.style.setProperty("--top", "46px"); return; }
    const m = A.MODULES[key]; setAccent(m.accent); root.style.setProperty("--top", "88px");
    const waiting = user ? UI.queue(user, DB.cases().filter((c) => A.TYPES[c.type].module === key)).length : 0;
    const tabs = [["dashboard", "Dashboard", "module.html?m=" + key], ["work", user && user.role === "auditor" ? "Needs attention" : "Work waiting for you", "work.html?m=" + key, waiting], ["cases", "All cases", "cases.html?m=" + key]]
      .concat(user && user.role === "maker" ? [["register", "Register", "new-case.html?m=" + key]] : []).concat([["process", "Process", "flow.html?m=" + key]]);
    bar.innerHTML = '<div class="modbar" style="--m:' + m.accent[0] + '"><b>' + esc(m.name) + '</b><span class="d">' + esc(A.TYPES[m.type].risk) + "</span><nav>" +
      tabs.map((t) => '<a href="' + t[2] + '"' + (t[0] === tab ? ' class="on" aria-current="page"' : "") + ">" + t[1] + (t[3] ? '<span class="n" style="background:var(--m)">' + t[3] + "</span>" : "") + "</a>").join("") + '</nav><a class="all" href="dashboard.html">All modules</a></div>';
  }

  window.Shell = {
    // opts: { page: "cases.html", roles: [...], module: "pay" | "param", tab: "cases" }. roles omitted means every signed-in role.
    init(opts, render) {
      DB.ensureSeeded();
      const user = Auth.require(); if (!user) return;
      const view = frame(user, opts.page);
      let key = opts.module === "param" ? new URLSearchParams(location.search).get("m") : opts.module || null;
      if (key && !A.MODULES[key]) key = null;
      if ((opts.roles && !opts.roles.includes(user.role)) || (key && !user.modules.includes(key))) {
        DB.log(user, "auth", "Access denied", "", opts.page + (key ? " (" + key + ")" : ""));
        setModule(null, null, user);
        view.innerHTML = '<div class="panel" style="max-width:560px"><header>No access</header><div class="body"><p>' + (key && !user.modules.includes(key) ? "You do not work in the " + esc(A.MODULES[key].name) + " module." : "Your role (" + esc(UI.post(user)) + ") does not include this page.") + '</p><a class="btn" href="dashboard.html">Back to home</a></div></div>';
        return;
      }
      setModule(key, opts.tab || null, user);
      // signature images are decoded once, then every page can draw them without waiting
      const go = () => render(user, view, key);
      if (window.Sig) Sig.ready().then(go); else go();
    },
    setModule(key, tab) { setModule(key, tab, Auth.current()); },
  };
})();
