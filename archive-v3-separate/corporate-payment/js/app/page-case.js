/* Case file: summary, signature verification, next step for the signed-in role, approval path and activity. */
Shell.init({ page: "cases.html" }, function (user, view) {
  const A = APP, R = Rules, esc = UI.esc, params = new URLSearchParams(location.search);
  let c = DB.case(params.get("id")), tab = "verify", notice = params.get("new") ? { tone: "ok", text: "Case registered. Run signature verification to continue." } : null;
  if (!c) { view.innerHTML = '<div class="panel" style="max-width:560px"><header>Case not found</header><div class="body"><p>No case matches that number. It may have been removed when demo data was reset.</p><a class="btn" href="cases.html">Back to cases</a></div></div>'; return; }
  const acct = () => A.ACCOUNTS.find((a) => a.no === c.accountNo);
  const canRun = () => R.can(user, c, "run_asv").ok;
  const LABEL = Object.assign({ run_asv: "Run verification", submit: "Submit for approval", refer: "Refer to fraud review", return_customer: "Return to customer", fraud_clear: "Clear signature", fraud_hold: "Hold for callback", fraud_confirm: "Confirm forgery", approve: "Approve and release", return_maker: "Return for correction", reject: "Reject" }, APP.LABELS_ACTIONS || {});

  function path() {
    const st = c.status, f = c.fraud, steps = [];
    steps.push(["done", "Registered", esc(c.makerName) + ", " + UI.dt(c.createdAt)]);
    steps.push([c.asv ? "done" : ["registered", "reopened"].includes(st) ? "now" : "", "Signature verification", c.asv ? ({ pass: "Likely match", review: "Flagged", mandate: "Mandate not met" }[c.asv.verdict]) + ", scores " + c.asv.sigs.map((s) => s.matched.score).join(" / ") : "Not run yet"]);
    if (f || ["asv_flag", "fraud_review", "on_hold"].includes(st) || (c.asv && c.asv.verdict === "review")) {
      const s = f ? (f.decision === "cleared" ? ["done", "Cleared by " + esc(f.name) + ", callback " + esc(f.callback)] : f.decision === "forgery" ? ["bad", "Forgery confirmed by " + esc(f.name)] : ["now", "On hold: " + esc(f.name)]) : st === "fraud_review" ? ["now", "With the fraud review analyst"] : ["", "Needed because ASV flagged the case"];
      steps.push([s[0], A.BRAND.review || "Fraud review", s[1]]);
    }
    if (!["returned"].includes(st) && !c.fraudSuspected && !(c.asv && c.asv.verdict === "mandate" && !c.level)) {
      const lv = c.level ? "Level " + c.level + ", " + R.levelWho(c.level) : "Authority set when submitted";
      const a = c.approval;
      steps.push([st === "approved" ? "done" : a && a.rejected ? "bad" : st === "pending_approval" ? "now" : "", "Approval", st === "approved" ? "Approved by " + esc(a.name) + ", " + UI.dt(a.ts) : a && a.rejected ? "Rejected by " + esc(a.name) : lv]);
    }
    if (st === "approved") steps.push(["done", "Released to core banking", "Reference " + esc(c.releaseRef)]);
    if (st === "returned") steps.push(["done", "Returned to customer", esc(c.closeNote || "")]);
    if (st === "rejected") steps.push(["bad", "Closed as rejected", c.fraudSuspected ? "Suspected forgery recorded" : ""]);
    return '<ol class="path">' + steps.map((s) => '<li class="' + s[0] + '"><b>' + s[1] + "</b><span>" + s[2] + "</span></li>").join("") + "</ol>";
  }

  function nextStep() {
    const acts = R.actionsFor(user, c).filter((x) => x.ok && x.key !== "run_asv"), meta = R.STATUS[c.status];
    let h = '<div class="body"><div>' + UI.status(c.status) + '</div><div class="small muted" style="margin:2px 0 10px">' + esc(meta.hint) + (meta.owner ? ". With: " + esc(meta.owner.toLowerCase()) : "") + "</div>";
    if (canRun() && !c.asv) h += '<button class="btn primary block" id="goverify">Go to signature verification</button>';
    if (c.returnNote && c.status === "reopened") h += '<div class="msg warn"><b>Returned by the approver:</b> ' + esc(c.returnNote) + "</div>";
    if (acts.length) {
      const needNote = acts.some((x) => x.needsNote);
      if (user.role === "approver" || A.ROLES[user.role].approveLevel) h += checklist();
      if (needNote) h += '<label class="f" for="note">Note for the record</label><textarea id="note" rows="3" placeholder="Required for rejection, return and fraud decisions"></textarea>';
      if (acts.some((x) => x.key === "fraud_clear")) h += '<label class="f" for="cb" style="margin-top:8px">Callback reference (needed to clear)</label><input id="cb" type="text" placeholder="e.g. CB-88231">';
      h += '<div id="aerr"></div><div style="margin-top:10px">' + acts.map((x) => '<button class="btn block ' + (x.kind === "primary" ? "primary" : x.kind) + '" data-a="' + x.key + '">' + LABEL[x.key] + "</button>").join("") + "</div>" + actionHelp(acts);
    } else {
      h += '<p class="small muted" style="margin:0">' + esc(reason()) + "</p>";
    }
    return h + "</div>";
  }
  function reason() {
    if (!meta().open) return "This case is closed. No further action is possible.";
    const first = ["approve", "submit", "fraud_clear", "return_customer"].map((k) => R.can(user, c, k)).find((x) => !x.ok && !/stage|Only|Fraud review analysts|Not available|not awaiting|Your role/.test(x.reason || ""));
    if (first) return first.reason;
    if (user.role === "auditor") return "Audit access is read-only.";
    if (user.role === "maker" && c.maker !== user.id) return "Registered by " + c.makerName + ". Only the registering officer can act on this case.";
    return "Nothing is waiting for you on this case. It is with " + (meta().owner || "no one").toLowerCase() + ".";
  }
  const meta = () => R.STATUS[c.status];
  function checklist() {
    if (c.status !== "pending_approval") return "";
    const lvl = A.ROLES[user.role].approveLevel, ok = (b) => (b ? "&#10003;" : "&#10005;");
    const items = [[c.asv && c.asv.sigs.length >= c.required, "Signatures presented for the mandate (" + (c.asv ? c.asv.sigs.length : 0) + " of " + c.required + " needed)"], [c.asv && (c.asv.verdict === "pass" || c.override), c.override ? "Flag cleared in " + (A.BRAND.review || "fraud review").toLowerCase() + " (callback " + esc(c.fraud.callback) + ")" : "Signatures match the mandate (" + c.asv.distinct + " of " + c.required + " needed)"],
      [lvl >= c.level, "Amount is within your Level " + lvl + " authority"], [c.maker !== user.id && !(c.fraud && c.fraud.by === user.id), "You did not register or clear this case"]].concat(window.UseCase && UseCase.approvalChecks ? UseCase.approvalChecks(c) : []);
    return '<div class="msg info" style="margin-top:10px"><b>Before you approve</b><ul style="margin:6px 0 0;padding:0;list-style:none">' + items.map((i) => "<li>" + ok(i[0]) + " " + i[1] + "</li>").join("") + "</ul></div>";
  }

  function mandatePanel() {
    const a = acct(), got = new Set(c.asv ? c.asv.sigs.filter((s) => s.pass).map((s) => s.matched.id) : []);
    return '<section class="panel"><header>Signing mandate</header><div class="body small"><b>' + esc(a.mandate.text) + "</b><br>Needed for this amount: " + c.required + "</div><div class=\"body flush\">" + a.parties.map((p) => '<div class="party"><img src="' + UI.refSrc(p) + '" alt="Specimen of ' + esc(p.name) + '"><div><b>' + esc(p.name) + '</b><div class="muted small">' + esc(p.role) + '</div>' + (c.asv ? '<div class="st ' + (got.has(p.id) ? "pass" : "") + ' small">' + (got.has(p.id) ? "Signature matched" : "No matching signature") + "</div>" : "") + "</div></div>").join("") + "</div></section>";
  }

  function summary() {
    const t = A.TYPES[c.type], f = c.fields, main = f.payee || f.instruction || "";
    const rows = [["Customer", c.customer], ["Account", c.accountNo], ["Amount", UI.money(c.amount, c.currency) + (c.currency !== "MYR" ? (c.myr != null ? " (MYR " + Math.round(c.myr).toLocaleString("en-US") + ")" : " (no exchange rate)") : "")], [c.type === "fd" ? "Instruction" : "Beneficiary", main],
      ["Branch", A.BRANCHES[c.branch]], ["Registered by", c.makerName + ", " + UI.dt(c.createdAt)], ["Approval authority", c.level ? "Level " + c.level + ", " + R.levelWho(c.level) : "Set when submitted"], ["Service time", UI.sla(c)]].concat(window.UseCase && UseCase.rows ? UseCase.rows(c) : []);
    return '<section class="panel"><div class="body"><div class="kv">' + rows.map((r) => "<div><span>" + r[0] + "</span><b>" + (r[0] === "Service time" ? r[1] : esc(r[1])) + "</b></div>").join("") + "</div></div></section>" + (window.UseCase && UseCase.banner ? UseCase.banner(c) : "");
  }

  function tabBody() {
    if (tab === "verify") {
      return (c.asv ? CaseVerify.sheets(c) + (canRun() ? '<div style="margin-bottom:14px"><button class="btn" id="rerun">Run verification again</button></div>' : "") : canRun() ? "" : '<div class="panel"><div class="empty"><b>Verification has not been run</b>The registering officer runs it from this tab.</div></div>') + '<div id="wb"></div>';
    }
    if (tab === "scan") return '<section class="panel"><header>' + esc(A.TYPES[c.type].long) + '</header><div class="body"><div class="kv" style="margin-bottom:12px">' + A.TYPES[c.type].fields.map((f) => "<div><span>" + esc(f[1]) + "</span><b>" + esc(c.fields[f[0]] || "") + "</b></div>").join("") + '</div><div class="docview"><img alt="Scanned instruction" src="' + UI.docSrc(c) + '"></div></div></section>';
    const ev = DB.caseEvents(c.id).slice().reverse();
    return '<section class="panel"><header>Activity</header><ul class="tl">' + ev.map((e) => "<li><time>" + UI.dt(e.ts) + "</time><div><b>" + esc(e.action) + "</b><p>" + esc(e.name) + " (" + esc(A.ROLES[e.role] ? A.ROLES[e.role].title : e.role) + ")" + (e.detail ? ". " + esc(e.detail) : "") + "</p></div></li>").join("") + "</ul></section>";
  }

  // Where this case is in the process, who is next, and what will come out.
  function track() {
    const F = A.FLOW, T = F.track, st = c.status, neg = st === "rejected" || st === "returned";
    let idx = { registered: 0, reopened: 0, asv_pass: 1, asv_flag: 1, asv_mandate: 1, fraud_review: 2, on_hold: 2, pending_approval: 3, approved: 4 }[st];
    if (st === "rejected") idx = c.fraud && c.fraud.decision === "forgery" ? 2 : c.approval && c.approval.rejected ? 3 : 1;
    if (st === "returned") idx = 1;
    const hitOpen = !!(c.screen && c.screen.hit && !c.screen.cleared), review = !!(c.fraud || (c.asv && c.asv.verdict === "review") || (c.screen && c.screen.hit) || ["asv_flag", "fraud_review", "on_hold"].includes(st)), skipReview = !!c.asv && !review;
    const cls = T.map((_, i) => (i === 2 && skipReview ? "skip" : i < idx ? "done" : i === idx ? (neg ? "bad" : st === "approved" ? "done" : "now") : ""));
    const lvl = c.level || R.approvalLevel(c.myr, c.fxKnown, c.override), who = R.levelWho(lvl), maker = A.ROLES.maker.title, rev = A.ROLES.fraud.title, rv = A.BRAND.review || "fraud review";
    const next = { registered: maker + " runs signature verification.", reopened: maker + " corrects the case and runs verification again.", asv_pass: hitOpen ? maker + " refers it to " + rv.toLowerCase() + ": the beneficiary screening has a hit." : maker + " submits it for approval by the " + who + ".",
      asv_flag: maker + " refers the flagged item to " + rv.toLowerCase() + ".", asv_mandate: maker + " returns it to the customer: the signing rule is not met.",
      fraud_review: rev + " calls the customer back, then clears it (it goes to approval), holds it or confirms forgery.", on_hold: rev + " repeats the callback, then clears it or confirms forgery.",
      pending_approval: "The " + who + " (Level " + lvl + ") approves, rejects or returns it." }[st];
    const out = st === "approved" ? F.nouns.done + " Reference " + c.releaseRef + "." : st === "rejected" ? (c.fraudSuspected ? "Rejected. Suspected forgery recorded." : "Rejected" + (c.approval && c.approval.note ? ": " + c.approval.note : ".")) :
      st === "returned" ? "Returned to the customer" + (c.closeNote ? ": " + c.closeNote : ".") : "If approved: " + F.nouns.expected;
    const mine = UI.queue(user, [c]).length ? ' <b style="color:var(--orange-dark)">Your turn.</b>' : "";
    return '<section class="track" aria-label="Where this case is"><ol>' + T.map((t, i) => '<li class="' + cls[i] + '">' + esc(t) + "</li>").join("") + "</ol>" +
      '<p class="say"><span><b>Now:</b> ' + esc(R.STATUS[st].label + (hitOpen && st === "asv_pass" ? ", screening hit" : "")) + mine + "</span>" + (next ? "<span><b>Next:</b> " + esc(next) + "</span>" : "") + "<span><b>Output:</b> " + esc(out) + "</span></p></section>";
  }
  function actionHelp(acts) {
    const F = A.FLOW, lvl = c.level || R.approvalLevel(c.myr, c.fxKnown, c.override), rv = A.BRAND.review || "fraud review";
    const H = { submit: "Sends it to the " + R.levelWho(lvl) + " for approval.", refer: "Sends it to " + rv.toLowerCase() + ".", return_customer: "Closes the case and returns it to the customer with your note.",
      fraud_clear: "Sends it for approval at Level 2 or above. Needs a callback reference.", fraud_hold: "Keeps it with you until the callback is done.", fraud_confirm: "Closes it as rejected and records a suspected forgery.",
      approve: F.nouns.release, reject: "Closes the case as rejected. Your note goes on the record.", return_maker: "Sends it back to the officer who registered it, to correct." };
    return acts.length ? '<ul class="actionhelp" style="margin-top:6px">' + acts.map((x) => "<li><b>" + esc(LABEL[x.key]) + ".</b> " + esc(H[x.key] || "") + "</li>").join("") + "</ul>" : "";
  }

  function render() {
    view.innerHTML = '<div class="pagehead"><div><div class="crumb"><a href="cases.html">Cases</a> / ' + esc(c.id) + "</div><h1>" + esc(A.TYPES[c.type].long) + ' <span class="faint" style="font-weight:400">' + esc(c.id) + '</span></h1></div><div class="actions"><a class="btn" href="cases.html">Back to cases</a></div></div>' +
      (notice ? '<div class="msg ' + notice.tone + '" role="status">' + esc(notice.text) + "</div>" : "") + track() + summary() +
      '<div class="cols"><div><div class="panel" style="margin-bottom:14px"><div class="tabs" role="tablist">' + [["verify", "Signature verification"], ["scan", "Instruction and scan"], ["log", "Activity"]].map((t) => '<button role="tab" data-tab="' + t[0] + '" class="' + (tab === t[0] ? "on" : "") + '">' + t[1] + "</button>").join("") + '</div></div><div id="tabbody">' + tabBody() + "</div></div>" +
      '<div><section class="panel"><header>Your next step</header>' + nextStep() + '</section>' + (window.UseCase && UseCase.panels ? UseCase.panels(c) : "") + '<section class="panel"><header>Progress</header><div class="body">' + path() + "</div></section>" + mandatePanel() + "</div></div>";
    bind();
  }

  function save(ev) {
    const r = DB.saveCase(c); if (!r.ok) { UI.toast(r.error, "err"); return false; }
    DB.log(user, "case", ev.action, c.id, ev.detail); return true;
  }
  function mountWorkbench() {
    const wb = view.querySelector("#wb"); if (!wb) return;
    CaseVerify.workbench(c, user, wb, (asv) => {
      const r = R.perform(c, user, "run_asv", { asv });
      if (!r.ok) return UI.toast(r.error, "err");
      if (save(r.event)) { notice = { tone: "ok", text: r.event.detail }; render(); }
    });
  }
  function bind() {
    view.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; render(); }));
    const gv = view.querySelector("#goverify"); if (gv) gv.onclick = () => { tab = "verify"; render(); view.querySelector("#tabbody").scrollIntoView({ behavior: "smooth" }); };
    const rr = view.querySelector("#rerun"); if (rr) rr.onclick = () => { rr.disabled = true; mountWorkbench(); };
    if (tab === "verify") { if (canRun() && !c.asv) mountWorkbench(); CaseVerify.animate(view); }
    view.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => act(b.dataset.a)));
  }

  async function act(key) {
    const noteEl = view.querySelector("#note"), cbEl = view.querySelector("#cb"), note = noteEl ? noteEl.value : "", callback = cbEl ? cbEl.value : "", err = view.querySelector("#aerr");
    const bad = (m) => { err.innerHTML = '<div class="msg err" role="alert">' + esc(m) + "</div>"; };
    const chk = R.can(user, c, key); if (!chk.ok) return bad(chk.reason);
    if (R.NOTE_MIN[key] && note.trim().length < R.NOTE_MIN[key]) return bad("Add a note of at least " + R.NOTE_MIN[key] + " characters.");
    if (key === "fraud_clear" && !callback.trim()) return bad("Enter the callback reference used to confirm with the customer.");
    const strong = { approve: ["Approve and release", "Release <b>" + esc(UI.money(c.amount, c.currency)) + "</b> for <b>" + esc(c.customer) + "</b> to core banking? This cannot be undone here.", "Approve and release"], reject: ["Reject this case", "The instruction will be closed as rejected.", "Reject"],
      fraud_confirm: ["Confirm forgery", "The case will be closed as rejected and recorded as a suspected forgery.", "Confirm forgery"], return_customer: ["Return to customer", "The instruction will be closed and returned to the customer.", "Return"] }[key];
    if (strong && !(await UI.confirm(strong[0], "<p style=\"margin:0\">" + strong[1] + "</p>", strong[2], key !== "approve"))) return;
    const r = R.perform(c, user, key, { note, callback }); if (!r.ok) return bad(r.error);
    if (save(r.event)) { notice = { tone: "ok", text: r.event.action + ". " + (key === "approve" ? "Reference " + c.releaseRef + "." : "") }; UI.toast(r.event.action, "ok"); render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }
  render();
});
