/* Work waiting for you: the full list, on its own page. With ?m=pay it is that module only; without it, every module this person works in. */
Shell.init({ page: "work.html", module: "param", tab: "work" }, function (user, view, key) {
  const A = APP, esc = UI.esc;
  let cases = UI.visible(user, DB.cases()); if (key) cases = cases.filter((c) => A.TYPES[c.type].module === key);
  const work = UI.workFor(user, cases), all = work.list.slice().sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  const left = (c) => (new Date(c.dueAt) - Date.now()) / 60000, FILTERS = [["all", "All", () => true], ["late", "Overdue", (c) => left(c) < 0], ["soon", "Due within 1 hour", (c) => left(c) >= 0 && left(c) < 60]];
  const title = work.audit ? "Needs attention" : "Work waiting for you";
  let f = "all";

  view.innerHTML = '<div class="pagehead"><div><div class="crumb">' + (key ? esc(A.MODULES[key].name) : "All your modules") + "</div><h1>" + title + '</h1></div><div class="actions">' + (user.role === "maker" ? '<a class="btn primary" href="new-case.html' + (key ? "?m=" + key : "") + '">Register instruction</a>' : "") + "</div></div>" +
    '<p class="muted" id="intro" style="margin:-4px 0 12px;max-width:760px"></p><section class="panel"><header><div class="seg" role="group" aria-label="Filter" id="seg"></div><span class="tools small muted" id="n"></span></header><div class="body flush" id="list"></div></section>';

  const intro = view.querySelector("#intro"), seg = view.querySelector("#seg"), list = view.querySelector("#list");
  const late = all.filter(FILTERS[1][2]).length;
  intro.textContent = all.length
    ? (work.audit ? "These open cases are overdue or did not come back as a clean match. " : all.length + " case" + (all.length === 1 ? " is" : "s are") + " waiting for you" + (key ? " in this module" : "") + ". ") + (late ? late + " overdue. " : "None overdue. ") + "The most urgent are first. Open a case to act on it."
    : (work.audit ? "No open case is overdue or flagged right now." : "Nothing is waiting for you right now. New cases appear here when they reach your stage.");

  function draw() {
    seg.innerHTML = FILTERS.map((x) => '<button type="button" data-f="' + x[0] + '" class="' + (x[0] === f ? "on" : "") + '" aria-pressed="' + (x[0] === f) + '">' + x[1] + "<b>" + all.filter(x[2]).length + "</b></button>").join("");
    const rows = all.filter(FILTERS.find((x) => x[0] === f)[2]);
    view.querySelector("#n").textContent = rows.length + " of " + all.length;
    list.innerHTML = UI.caseTable(rows, { owner: work.audit, user, emptyTitle: all.length ? "No case matches this filter" : "Nothing here", emptyText: all.length ? "Choose All to see every case." : user.role === "maker" ? "Register an instruction to get started." : "" });
  }
  seg.addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) { f = b.dataset.f; draw(); } });
  UI.bindRows(list); draw();
});
