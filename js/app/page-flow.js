/* Process overview for one module: who does what, what goes in, what comes out. Content comes from the module file (APP.FLOWS, APP.GUIDES). */
Shell.init({ page: "flow.html", module: "param", tab: "process" }, function (user, view, modKey) {
  const key = modKey || user.modules[0]; if (!modKey) Shell.setModule(key, "process");
  const A = APP, type = A.MODULES[key].type, F = A.FLOWS[type], G = A.GUIDES[type], esc = UI.esc, N = F.steps.length;
  const list = (a) => '<ul style="margin:0;padding-left:18px">' + a.map((x) => "<li>" + x + "</li>").join("") + "</ul>";
  const lane = (k) => F.lanes.findIndex((l) => l.key === k);

  const ipo = '<div class="ipo"><section class="panel"><header>Input <small>what comes in</small></header><div class="body">' + list(F.io.input) + '</div></section><div class="arrow">&rsaquo;</div>' +
    '<section class="panel"><header>Process <small>what the system and staff do</small></header><div class="body">' + list(F.io.process) + '</div></section><div class="arrow">&rsaquo;</div>' +
    '<section class="panel"><header>Output <small>what comes out</small></header><div class="body">' + list(F.io.output) + "</div></section></div>";

  const cols = "170px repeat(" + N + ", minmax(122px, 1fr))";
  const bands = F.lanes.map((l, i) => '<div class="band" style="grid-row:' + (i + 1) + '"></div>').join("");
  const labels = F.lanes.map((l, i) => '<div class="lane" style="grid-row:' + (i + 1) + ';grid-column:1">' + esc(l.label) + (l.sub ? "<small>" + esc(l.sub) + "</small>" : "") + "</div>").join("");
  const steps = F.steps.map((s, i) => '<div class="step ' + (s.lane === "asv" ? "asv " : "") + (s.optional ? "opt" : "") + '" style="grid-row:' + (lane(s.lane) + 1) + ";grid-column:" + (i + 2) + '"><span class="n">' + (i + 1) + "</span><b>" + esc(s.title) +
    (s.lane === "asv" ? '<span class="tag">ASV</span>' : "") + (s.optional ? '<span class="tag">only if flagged</span>' : "") + "</b>" + esc(s.text) + "</div>").join("");
  const swim = '<section class="panel"><header>Who does what, step by step<span class="tools small muted">Follow the numbers</span></header><div class="body"><p class="legend"><span><i class="a"></i>Done by ASV</span><span><i></i>Done by a person or system</span><span><i class="o"></i>Only when needed</span></p>' +
    '<div class="swim-wrap"><div class="swim" style="grid-template-columns:' + cols + '">' + bands + labels + steps + "</div></div></div></section>";

  const outs = '<section class="panel"><header>Possible outputs</header><div class="body flush tablewrap"><table class="grid"><thead><tr><th>Result</th><th>When it happens</th><th>Who decides</th><th>What comes out</th><th>Case status</th></tr></thead><tbody>' +
    F.outputs.map((o) => '<tr><td><span class="st ' + o.tone + '">' + esc(o.title) + "</span></td><td>" + esc(o.when) + "</td><td>" + esc(o.who) + "</td><td>" + esc(o.output) + "</td><td>" + esc(o.status) + "</td></tr>").join("") + "</tbody></table></div></section>";

  const bottom = '<div class="cols even"><div><section class="panel"><header>Who does what</header><div class="body flush"><table class="grid"><tbody>' + G.who.map((w) => "<tr><td><b>" + esc(w[0]) + "</b></td><td>" + esc(w[1]) + "</td></tr>").join("") + "</tbody></table></div></section>" +
    '<section class="panel"><header>Limits to keep in mind</header><div class="body">' + list(G.limits) + '</div></section></div><div><section class="panel"><header>' + esc(G.extra.title) + '</header><div class="body">' + list(G.extra.items) + "</div></section></div></div>";

  view.innerHTML = '<div class="pagehead"><div><div class="crumb">Reference</div><h1>Process overview: ' + esc(A.TYPES[type].label) + '</h1></div></div>' + (!modKey && user.modules.length > 1 ? '<p class="small muted" style="margin:0 0 8px">Other modules: ' + user.modules.filter((k) => k !== key).map((k) => '<a href="flow.html?m=' + k + '">' + esc(A.MODULES[k].name) + '</a>').join(', ') + '</p>' : '') + '<p class="muted" style="margin:-4px 0 14px;max-width:760px">' + esc(F.intro) + "</p>" + ipo + swim + outs + bottom;
});
