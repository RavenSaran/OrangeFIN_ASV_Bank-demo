/* Policy and limits: the rules the system enforces, written so a reviewer can check them. */
Shell.init({ page: "policy.html" }, function (user, view) {
  const A = APP, esc = UI.esc, P = A.POLICY, yes = '<span class="st pass">Yes</span>', no = '<span class="faint">No</span>';
  const panel = (t, b, flush, tools) => '<section class="panel"><header>' + t + (tools ? '<span class="tools small">' + tools + '</span>' : '') + '</header><div class="body' + (flush ? " flush" : "") + '">' + b + "</div></section>";
  const caps = [["Register an instruction", ["maker"]], ["Run signature verification", ["maker"]], ["Refer or return to the customer", ["maker"]], ["Clear or reject a flagged case", ["fraud"]], ["Approve, reject or return", ["checker", "manager", "head"]], ["View the audit trail", ["auditor", "manager", "head"]]];
  const money = (n) => Number(n).toLocaleString("en-US");
  const P_lock = () => Cfg.settings.process.lockTries + " failed sign-in attempts lock a staff ID for " + Cfg.settings.process.lockMinutes + " minutes.";
  const mods = Object.keys(A.MODULES), S = Cfg.settings;
  const per = (o, f) => mods.map((k) => esc(A.MODULES[k].short) + " " + f(o[k])).join(", ");
  const amt = (v) => (v == null ? "never" : v === 0 ? "always" : "MYR " + money(v));
  const thresholds = () => '<table class="grid"><tbody>' + [
    ["Pass score", S.score.pass + (mods.some((k) => S.score.passByModule[k] != null) ? ". By module: " + per(S.score.passByModule, (v) => (v == null ? "bank-wide" : v)) : "") + (S.score.amountOn ? ". " + S.score.amountPass + " from MYR " + money(S.score.amountFrom) : "")],
    ["High risk below", S.score.highRiskOn ? S.score.highRiskBelow : "off"], ["Look-alike check", S.score.marginOn ? "within " + S.score.marginPoints + " points" : "off"],
    ["ASV required from", per(S.amount.asvFrom, amt)], ["Analyst reviews clean matches from", per(S.amount.reviewFrom, amt)], ["Two analysts clear from", per(S.amount.secondFrom, amt)],
    ["Lowest level after a cleared flag", "Level " + S.amount.overrideMinLevel], ["Currency with no rate", S.amount.unknownCurrency === "block" ? "registration blocked" : "highest level"],
    ["Capture quality", "Good from " + S.quality.goodMin + ", Fair from " + S.quality.fairMin + (S.quality.poorForcesReview ? ", Poor forces review" : "")], ["Specimen age warning", S.process.specimenWarnYears ? S.process.specimenWarnYears + " years" : "off"],
  ].map((r) => "<tr><td>" + r[0] + "</td><td><b>" + r[1] + "</b></td></tr>").join("") + "</tbody></table>";

  // Each module sets its own limits, so each gets its own table.
  const authority = Object.keys(A.MODULES).map((k) => {
    const m = A.MODULES[k], lv = A.TYPES[m.type].levels;
    return '<div class="body flush" style="border-top:1px solid var(--line-soft)"><div style="padding:8px 12px 0"><span class="mod" style="--m:' + m.accent[0] + '"><b>' + esc(m.name) + '</b></span></div><table class="grid"><tbody>' +
      lv.map((l, i) => "<tr><td style=\"width:60px\"><b>L" + l.n + "</b></td><td>" + (l.upTo == null ? "Above " + money(lv[i - 1].upTo) : (i ? "Above " + money(lv[i - 1].upTo) + " to " : "Up to ") + (i ? money(l.upTo) : money(l.upTo))) + "</td><td>" + esc(l.who) + "</td></tr>").join("") + "</tbody></table></div>";
  }).join("");

  const staff = A.USERS.map((u) => "<tr><td><b>" + esc(u.id) + "</b></td><td>" + esc(u.name) + '<span class="sub">' + esc(UI.post(u)) + "</span></td><td>" + u.modules.map((k) => '<span class="mod" style="--m:' + A.MODULES[k].accent[0] + '">' + esc(A.MODULES[k].short) + "</span>").join(" &nbsp; ") + "</td></tr>").join("");

  view.innerHTML = '<div class="pagehead"><div><div class="crumb">Reference</div><h1>Policy and limits</h1></div></div><div class="cols even"><div>' +
    panel("Signature verification", '<div class="kv" style="grid-template-columns:1fr 1fr"><div><span>Pass score</span><b>' + P.passScore + ' and above</b></div><div><span>Below pass score</span><b>Flag for review</b></div></div><p class="small muted" style="margin:10px 0 0">The score is a similarity measure from 0 to 100. A score never authorises a payment. Overlapping, cut-off or faint signatures are flagged as not reliably comparable. In this demonstration the score comes from a demonstration engine, not a validated bank model.</p>') +
    panel("Thresholds in force", thresholds(), true, ["auditor", "manager", "head"].includes(user.role) ? '<a href="settings.html">Open Settings</a>' : "") +
    '<section class="panel"><header>Approval authority by module</header>' + authority + '<div class="body small muted" style="border-top:1px solid var(--line-soft)">Amounts are MYR equivalent. A currency with no exchange rate goes to the module\'s highest level. A case cleared after a flag needs at least Level 2.</div></section>' +
    panel("Four-eyes rules", '<ul style="margin:0;padding-left:18px"><li>The officer who registers a case cannot approve it.</li><li>The analyst who clears a flagged case cannot approve it.</li><li>An approver cannot approve above their authority level.</li><li>Rejections, returns and review decisions need a written note.</li><li>Clearing a flag needs a callback reference, and all required signatures must have been presented.</li><li>Every action is written to the audit trail with user, role and time.</li></ul>') +
    "</div><div>" +
    panel("Who works in which module", '<table class="grid"><thead><tr><th>ID</th><th>Name and position</th><th>Modules</th></tr></thead><tbody>' + staff + "</tbody></table>", true) +
    panel("Who can do what", '<table class="grid"><thead><tr><th>Action</th>' + Object.keys(A.ROLES).map((r) => "<th>" + esc(A.ROLES[r].short) + "</th>").join("") + "</tr></thead><tbody>" + caps.map((c) => '<tr><td style="min-width:190px">' + c[0] + "</td>" + Object.keys(A.ROLES).map((r) => '<td class="r">' + (c[1].includes(r) ? yes : no) + "</td>").join("") + "</tr>").join("") + "</tbody></table>", true) +
    panel("Service targets and session", '<div class="kv" style="grid-template-columns:1fr 1fr">' + Object.keys(A.TYPES).map((k) => "<div><span>" + esc(A.TYPES[k].label) + "</span><b>" + (A.TYPES[k].slaHours >= 24 ? A.TYPES[k].slaHours / 24 + " day" : A.TYPES[k].slaHours + " hours") + "</b></div>").join("") + "<div><span>Idle sign-out</span><b>" + P.sessionMinutes + ' minutes</b></div></div><p class="small muted" style="margin:10px 0 0">' + P_lock() + '</p>') +
    panel("Indicative exchange rates to MYR", '<div class="small" style="columns:3">' + Object.keys(A.FX).map((k) => k + " " + A.FX[k]).join("<br>") + "</div>") +
    panel("Demonstration data", '<p class="small muted" style="margin:0 0 8px">Cases and the audit trail are stored in this browser only. Resetting restores the starting data and removes cases you created.</p><button class="btn danger" id="reset">Reset demonstration data</button>') + "</div></div>";
  view.querySelector("#reset").onclick = async () => {
    if (!(await UI.confirm("Reset demonstration data", "<p style=\"margin:0\">This removes every case and audit event you created and restores the starting data. You will stay signed in.</p>", "Reset", true))) return;
    DB.reset(); DB.log(user, "auth", "Demo data reset", "", ""); UI.toast("Demonstration data restored.", "ok");
  };
});
