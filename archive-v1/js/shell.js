/* Shared header/footer injected on every page. Set <body data-page="payment"> to highlight the nav item. */
(function () {
  const ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17c3-8 5-9 6-5s2 4 4-1 3-3 5 0"/><path d="M3 21h18"/></svg>';
  const LINKS = [
    ["home", "index.html", "Overview"], ["payment", "payment.html", "Corporate Payment"], ["fd", "fixed-deposit.html", "Fixed Deposit"],
    ["tt", "remittance.html", "TT / Remittance"], ["audit", "audit.html", "Audit Log"], ["how", "how-it-works.html", "How ASV Works"],
  ];
  const page = document.body.dataset.page;
  const head = document.createElement("div");
  head.innerHTML =
    '<div class="topbar"><div class="wrap"><span>Automated Signature Verification &middot; <b>Interactive demo</b> &mdash; sample data only</span><span>Bank staff console</span></div></div>' +
    '<header class="header"><div class="wrap"><a class="logo" href="index.html"><span class="logo-mark">' + ICON + '</span><span>OrangeFIN ASV Bank<small>Signature verification</small></span></a>' +
    '<nav class="nav">' + LINKS.map((l) => '<a href="' + l[1] + '"' + (l[0] === page ? ' class="active"' : "") + ">" + l[2] + "</a>").join("") + "</nav>" +
    '<span class="pill demo">Demo mode</span></div></header>';
  document.body.prepend(...head.children);
  const foot = document.createElement("footer");
  foot.className = "footer";
  foot.innerHTML =
    '<div class="wrap"><div class="cols"><div><div class="logo" style="color:#fff"><span class="logo-mark">' + ICON + '</span>OrangeFIN ASV Bank</div>' +
    '<p style="margin-top:12px;max-width:380px">Automated Signature Verification that supports &mdash; never replaces &mdash; the bank\'s approval process.</p></div>' +
    '<div><h4>Use cases</h4><a href="payment.html">Corporate Payment Authorization</a><a href="fixed-deposit.html">Fixed Deposit Upliftment</a><a href="remittance.html">TT / Remittance</a></div>' +
    '<div><h4>Explore</h4><a href="how-it-works.html">How ASV works</a><a href="audit.html">Audit log</a><a href="index.html">Overview</a></div></div>' +
    '<div class="legal">Demonstration only. Scores are produced by a demo comparison engine on sample or uploaded images; outcomes in production depend on the bank\'s validated model thresholds and approval policy.</div></div>';
  document.body.append(foot);
  window.fmtMoney = (n, cur) => (cur || "") + " " + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
  window.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
})();
