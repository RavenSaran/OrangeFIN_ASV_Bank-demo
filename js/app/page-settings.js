/* Settings: the thresholds and rules, one section per page. A Branch Manager or the Head of Operations can change them;
   the auditor can read them. Every save needs a reason and is recorded in the audit trail (see settings.js). */
Shell.init({ page: "settings.html", roles: ["auditor", "manager", "head"] }, function (user, view) {
  const A = APP, esc = UI.esc, SPEC = window.SETTINGS_SPEC, money = (n) => Number(n).toLocaleString("en-US");
  const TABS = [["score", "Signature score"], ["amount", "Amount rules"], ["quality", "Capture quality"], ["process", "Process and control"], ["module", "Module settings"], ["history", "Change history"]];
  const edit = Cfg.canEdit(user), q = new URLSearchParams(location.search), MODS = Object.keys(A.MODULES);
  let sec = TABS.some((t) => t[0] === q.get("s")) ? q.get("s") : "score", notice = null;
  const getp = (o, p) => p.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
  const setp = (o, p, v) => { const ks = p.split("."), last = ks.pop(); ks.reduce((x, k) => x[k], o)[last] = v; };
  const show = (v, d) => (v == null ? "not set" : typeof v === "boolean" ? (v ? "on" : "off") : d.kind === "money" ? money(v) : d.kind === "select" ? ((d.options.find((o) => String(o[0]) === String(v)) || [0, v])[1]) : v + (d.unit && d.kind !== "money" ? " " + d.unit : ""));
  const dis = edit ? "" : " disabled";
  const changed = (s) => JSON.stringify(Cfg.settings[s]) !== JSON.stringify(Cfg.defaults[s]);

  function control(d, path, val, dflt, label) {
    const a = ' data-p="' + path + '" data-k="' + d.kind + '" data-label="' + esc(label) + '"' + (d.nullable ? " data-nullable=1" : "") + (d.number ? " data-num=1" : "") + dis + (JSON.stringify(val) !== JSON.stringify(dflt) ? ' class="chg"' : "");
    if (d.kind === "bool") return '<label class="tog"><input type="checkbox"' + a + (val ? " checked" : "") + "> " + (val ? "On" : "Off") + "</label>";
    if (d.kind === "select") return "<select" + a + ">" + d.options.map((o) => '<option value="' + o[0] + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>").join("") + "</select>";
    if (d.kind === "time") return '<input type="text" maxlength="5" placeholder="HH:MM"' + a + ' value="' + esc(val) + '">';
    return '<span class="unitwrap"><input type="number" step="1"' + (d.min != null ? ' min="' + d.min + '"' : "") + (d.max != null ? ' max="' + d.max + '"' : "") + (d.nullable ? ' placeholder="Not set"' : "") + a + ' value="' + (val == null ? "" : val) + '">' + (d.unit ? "<em>" + esc(d.unit) + "</em>" : "") + "</span>";
  }
  function item(d, s) {
    if (d.custom) return CUSTOM[d.custom](s);
    const cur = Cfg.settings[s], def = Cfg.defaults[s];
    let body;
    if (d.per) body = '<div class="permod">' + MODS.map((k) => '<div><label>' + esc(A.MODULES[k].short) + "</label>" + control(d, d.path + "." + k, getp(cur, d.path + "." + k), getp(def, d.path + "." + k), d.label + ", " + A.MODULES[k].name) + "</div>").join("") + "</div>" +
      '<div class="dflt">Default: ' + MODS.map((k) => esc(A.MODULES[k].short) + " " + esc(show(getp(def, d.path + "." + k), d))).join(", ") + "</div>";
    else body = control(d, d.path, getp(cur, d.path), getp(def, d.path), d.label) + '<div class="dflt">Default: ' + esc(show(getp(def, d.path), d)) + "</div>";
    return '<div class="setrow"><div class="sl"><b>' + esc(d.label) + "</b>" + (d.help ? "<span>" + esc(d.help) + "</span>" : "") + '</div><div class="sc">' + body + "</div></div>";
  }

  // blocks with their own layout
  const CUSTOM = {
    levels() {
      return MODS.map((k) => { const ty = A.TYPES[A.MODULES[k].type], lv = ty.levels, cur = Cfg.settings.amount.levels[k], def = Cfg.defaults.amount.levels[k];
        return '<div class="setrow"><div class="sl"><b><span class="mod" style="--m:' + A.MODULES[k].accent[0] + '">' + esc(A.MODULES[k].name) + '</span></b><span>Default: ' + def.map((v, i) => "Level " + (i + 1) + " up to " + money(v)).join(", ") + ", then Level " + lv.length + '.</span></div><div class="sc"><div class="lvls">' +
          lv.map((l, i) => i < lv.length - 1 ? "<div><label>Level " + l.n + ", " + esc(l.who) + ' up to</label><span class="unitwrap"><input type="number" min="1" step="1" data-p="levels.' + k + "." + i + '" data-k="money" data-label="' + esc(A.MODULES[k].name + " level " + l.n) + '" value="' + cur[i] + '"' + dis + (cur[i] !== def[i] ? ' class="chg"' : "") + "><em>MYR</em></span></div>" : "<div><label>Level " + l.n + ", " + esc(l.who) + '</label><span class="muted small">Above Level ' + (l.n - 1) + " limit</span></div>").join("") + "</div></div></div>"; }).join("");
    },
    mandates() {
      const cur = Cfg.settings.amount.mandates, def = Cfg.defaults.amount.mandates, rows = Object.keys(cur).map((no) => { const a = A.ACCOUNTS.find((x) => x.no === no), m = cur[no], d = def[no], inp = (f, k, nl) => '<input type="number" min="1" step="1"' + (nl ? ' placeholder="None"' : "") + ' data-p="mandates.' + no + "." + f + '" data-k="' + k + '"' + (nl ? " data-nullable=1" : "") + ' data-label="' + esc(a.name + ", " + f) + '" value="' + (m[f] == null ? "" : m[f]) + '"' + dis + (m[f] !== d[f] ? ' class="chg"' : "") + ">";
        return "<tr><td><b>" + esc(a.name) + '</b><span class="sub">' + esc(no) + ", " + a.parties.length + " signatories</span></td><td>" + esc(a.mandate.text) + "</td><td>" + inp("n", "int") + "</td><td>" + inp("tierLimit", "money", 1) + "</td><td>" + inp("tierN", "int") + "</td></tr>"; }).join("");
      return '<div class="body flush tablewrap"><table class="grid"><thead><tr><th>Account</th><th>Rule now</th><th>Signatures needed</th><th>Fewer needed up to (MYR)</th><th>Signatures up to that amount</th></tr></thead><tbody>' + rows + '</tbody></table><p class="hint" style="padding:8px 12px 0">To accept fewer signatures for small amounts, enter an amount and how many are then enough. Leave the amount blank for one rule at every amount.</p></div>';
    },
    fx() {
      const fx = Cfg.settings.amount.fx, def = Cfg.defaults.amount.fx;
      return '<div class="setrow"><div class="sl"><b>Exchange rates to MYR</b><span>Indicative rates used to find the approval level. A currency not listed here counts as having no rate.</span></div><div class="sc"><table class="grid fxt"><tbody>' +
        Object.keys(fx).sort().map((c) => "<tr data-fx=\"" + c + '"><td><b>' + c + '</b></td><td><input type="number" step="any" min="0" data-fxv value="' + fx[c] + '"' + (c === "MYR" || !edit ? " disabled" : "") + (fx[c] !== def[c] ? ' class="chg"' : "") + '></td><td>' + (c === "MYR" || !edit ? "" : '<button type="button" class="btn" data-rmfx>Remove</button>') + "</td></tr>").join("") +
        "</tbody></table>" + (edit ? '<div class="addrow"><input type="text" id="fxc" maxlength="6" placeholder="Code"><input type="number" id="fxr" step="any" min="0" placeholder="Rate to MYR"><span class="hint">Added when you save.</span></div>' : "") + "</div></div>";
    },
    signatory() {
      const sg = Cfg.settings.score.signatory, rows = Object.keys(sg).map((k) => { const [no, pid] = k.split("|"), a = A.ACCOUNTS.find((x) => x.no === no), p = a && a.parties.find((x) => x.id === pid);
        return "<tr data-sig=\"" + esc(k) + '"><td><b>' + esc(p ? p.name : pid) + '</b><span class="sub">' + esc(a ? a.name : no) + '</span></td><td><input type="number" min="1" max="99" step="1" data-sigv value="' + sg[k] + '"' + dis + '></td><td>' + (edit ? '<button type="button" class="btn" data-rmsig>Remove</button>' : "") + "</td></tr>"; }).join("");
      return '<div class="setrow"><div class="sl"><b>Pass score for one signatory</b><span>Use for a person whose signature varies a lot, or who needs a stricter check. Takes priority over every other pass score. Default: none.</span></div><div class="sc"><table class="grid fxt"><tbody id="sigbody">' + (rows || '<tr class="none"><td class="muted" colspan="3">None set</td></tr>') + "</tbody></table>" +
        (edit ? '<div class="addrow"><select id="sga">' + A.ACCOUNTS.map((a) => '<option value="' + a.no + '">' + esc(a.name) + "</option>").join("") + '</select><select id="sgp"></select><input type="number" id="sgs" min="1" max="99" placeholder="Score"><button type="button" class="btn" id="sgadd">Add</button></div>' : "") + "</div></div>";
    },
    noteMin() {
      const L = { return_customer: "Return to the customer", fraud_clear: "Clear a flag", fraud_confirm: "Confirm forgery or reject as suspicious", fraud_hold: "Hold for callback", reject: "Reject", return_maker: "Return for correction" }, cur = Cfg.settings.process.noteMin, def = Cfg.defaults.process.noteMin;
      return '<div class="setrow"><div class="sl"><b>Shortest note allowed</b><span>The decision cannot be recorded with a shorter note. 0 means no note is needed.</span></div><div class="sc"><div class="lvls">' + Object.keys(L).map((k) => "<div><label>" + L[k] + '</label><span class="unitwrap"><input type="number" min="0" max="200" step="1" data-p="noteMin.' + k + '" data-k="int" data-label="Note length, ' + L[k] + '" value="' + cur[k] + '"' + dis + (cur[k] !== def[k] ? ' class="chg"' : "") + "><em>characters</em></span></div>").join("") + '</div><div class="dflt">Default: ' + Object.keys(L).map((k) => L[k].toLowerCase() + " " + def[k]).join(", ") + "</div></div></div>";
    },
    watchlist() {
      return '<div class="setrow"><div class="sl"><b>Watchlist</b><span>One name per line, in lower case. A beneficiary that matches is held for compliance review. This is a short demonstration list; a live system uses the bank\'s screening service.</span></div><div class="sc"><textarea rows="5" data-wl' + dis + ">" + esc(Cfg.settings.module.watchlist.join("\n")) + '</textarea><div class="dflt">Default: ' + Cfg.defaults.module.watchlist.map(esc).join(", ") + "</div></div></div>";
    },
  };

  function drawSection() {
    const groups = SPEC[sec].map((g) => '<section class="panel"><header>' + esc(g.title) + '</header>' + (g.intro ? '<div class="body small muted" style="padding-bottom:0">' + esc(g.intro) + "</div>" : "") + '<div class="body setbody">' + g.items.map((d) => item(d, sec)).join("") + "</div></section>").join("");
    const foot = edit ? '<section class="panel"><header>Save these ' + esc(Cfg.SECTIONS[sec].toLowerCase()) + ' settings</header><div class="body"><label class="f" for="why">Reason for the change (required, kept in the audit trail)</label><textarea id="why" rows="2" placeholder="For example: agreed at the credit committee on 12 October"></textarea><div id="errs" style="margin-top:8px"></div>' +
      '<div class="actions" style="margin-top:10px"><button type="button" class="btn primary" id="save">Save changes</button><button type="button" class="btn danger" id="reset">Reset this section to the defaults</button></div><p class="hint">Changes apply to the next case registered or verified. Cases already recorded keep their result.</p></div></section>' : "";
    return '<form id="f" onsubmit="return false">' + groups + foot + "</form>";
  }

  function drawHistory() {
    const rows = Cfg.history().map((e) => { const m = /^([^:]+): (.*?) to (.*?)\. Reason: (.*)$/s.exec(e.detail) || [0, e.detail, "", "", ""], [sc, ...rest] = m[1].split("."), key = rest.join(".");
      return '<tr><td class="nowrap">' + UI.dt(e.ts) + "</td><td>" + esc(e.name) + '<span class="sub">' + esc(UI.post(A.USERS.find((u) => u.id === e.uid) || {})) + "</span></td><td><b>" + esc(Cfg.SECTIONS[sc] || sc) + '</b><span class="sub">' + esc(key) + "</span></td><td>" + esc(m[2]) + " to <b>" + esc(m[3]) + '</b></td><td class="muted">' + esc(m[4]) + "</td></tr>"; }).join("");
    return '<section class="panel"><header>Change history<span class="tools small muted">Newest first. Also in the Audit trail.</span></header><div class="body flush tablewrap">' + (rows ? '<table class="grid"><thead><tr><th>When</th><th>Who</th><th>Setting</th><th>Change</th><th>Reason</th></tr></thead><tbody>' + rows + "</tbody></table>" : '<div class="empty"><b>No settings have been changed</b>Everything is at its shipped value.</div>') + "</div></section>";
  }

  function render() {
    view.innerHTML = '<div class="pagehead"><div><div class="crumb">Governance</div><h1>Settings</h1></div></div>' +
      '<p class="muted" style="margin:-4px 0 12px;max-width:780px">The thresholds and rules the system follows. Each section is its own page. ' + (edit ? "You can change them. Every change needs a reason and is recorded." : "You can read them. Only a Branch Manager or the Head of Operations can change them.") + "</p>" +
      (notice ? '<div class="msg ' + notice.tone + '" role="status">' + esc(notice.text) + "</div>" : "") +
      '<div class="panel" style="margin-bottom:14px"><div class="tabs" role="tablist">' + TABS.map((t) => '<button role="tab" data-s="' + t[0] + '" class="' + (sec === t[0] ? "on" : "") + '">' + t[1] + (t[0] !== "history" && changed(t[0]) ? ' <span class="chgdot" title="Differs from the defaults">&#9679;</span>' : "") + "</button>").join("") + "</div></div>" + (sec === "history" ? drawHistory() : drawSection());
    bind(); notice = null;
  }

  function parse(el) {
    const k = el.dataset.k; if (k === "bool") return el.checked;
    const v = el.value.trim(); if (k === "select") return el.dataset.num ? Number(v) : v; if (k === "time" || k === "text") return v;
    if (v === "") return el.dataset.nullable ? null : NaN; const n = Number(v.replace(/,/g, "")); return isFinite(n) ? n : NaN;
  }
  function collect() {
    const next = JSON.parse(JSON.stringify(Cfg.settings[sec])), bad = [], f = view.querySelector("#f");
    f.querySelectorAll("[data-p]").forEach((el) => { const v = parse(el); if (typeof v === "number" && isNaN(v)) bad.push(el.dataset.label + ": enter a number."); setp(next, el.dataset.p, v); });
    if (sec === "amount") {
      next.fx = { MYR: 1 }; f.querySelectorAll("tr[data-fx]").forEach((r) => { if (r.dataset.fx !== "MYR") { const v = Number(r.querySelector("[data-fxv]").value); if (!isFinite(v) || !r.querySelector("[data-fxv]").value) bad.push("Exchange rate for " + r.dataset.fx + ": enter a number."); next.fx[r.dataset.fx] = v; } });
      const c = f.querySelector("#fxc").value.trim().toUpperCase(), r = f.querySelector("#fxr").value; if (c || r) { if (!c || !r) bad.push("To add a currency, enter both the code and the rate."); else next.fx[c] = Number(r); }
    }
    if (sec === "score") { next.signatory = {}; f.querySelectorAll("tr[data-sig]").forEach((r) => { next.signatory[r.dataset.sig] = Number(r.querySelector("[data-sigv]").value); }); }
    if (sec === "module") next.watchlist = f.querySelector("[data-wl]").value.split("\n").map((x) => x.trim().toLowerCase()).filter(Boolean); // blank lines are dropped; entries are matched in lower case
    return { next, bad };
  }

  function bind() {
    view.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", () => { sec = b.dataset.s; history.replaceState(null, "", "settings.html?s=" + sec); render(); }));
    const f = view.querySelector("#f"); if (!f || !edit) return;
    f.addEventListener("change", (e) => { if (e.target.dataset.k === "bool") e.target.parentNode.lastChild.textContent = e.target.checked ? " On" : " Off"; });
    f.addEventListener("click", (e) => { const r = e.target.closest("[data-rmfx],[data-rmsig]"); if (r) r.closest("tr").remove(); });
    const sga = f.querySelector("#sga"), sgp = f.querySelector("#sgp");
    if (sga) { const fill = () => { sgp.innerHTML = A.ACCOUNTS.find((a) => a.no === sga.value).parties.map((p) => '<option value="' + p.id + '">' + esc(p.name + ", " + p.role) + "</option>").join(""); }; sga.addEventListener("change", fill); fill();
      f.querySelector("#sgadd").addEventListener("click", () => { const sc = f.querySelector("#sgs").value; if (!sc) return; const a = A.ACCOUNTS.find((x) => x.no === sga.value), p = a.parties.find((x) => x.id === sgp.value), key = a.no + "|" + p.id, body = f.querySelector("#sigbody");
        const none = body.querySelector(".none"); if (none) none.remove(); body.querySelectorAll('tr[data-sig="' + key + '"]').forEach((r) => r.remove());
        body.insertAdjacentHTML("beforeend", '<tr data-sig="' + esc(key) + '"><td><b>' + esc(p.name) + '</b><span class="sub">' + esc(a.name) + '</span></td><td><input type="number" min="1" max="99" step="1" data-sigv value="' + esc(sc) + '"></td><td><button type="button" class="btn" data-rmsig>Remove</button></td></tr>'); f.querySelector("#sgs").value = ""; }); }
    const errs = f.querySelector("#errs"), fail = (list) => { errs.innerHTML = '<div class="msg err" role="alert"><b>Not saved.</b><ul style="margin:4px 0 0;padding-left:18px">' + list.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul></div>"; errs.scrollIntoView({ block: "nearest" }); };
    f.querySelector("#save").addEventListener("click", () => {
      const { next, bad } = collect(); if (bad.length) return fail(bad);
      const r = Cfg.update(user, sec, next, f.querySelector("#why").value); if (!r.ok) return fail(r.errors);
      notice = r.changes ? { tone: "ok", text: "Saved " + r.changes + " change" + (r.changes === 1 ? "" : "s") + ". They apply to the next case registered or verified, and are in the audit trail." } : { tone: "info", text: "Nothing was different, so nothing was saved." }; if (r.changes) UI.toast("Settings saved", "ok"); render();
    });
    f.querySelector("#reset").addEventListener("click", async () => {
      if (!(await UI.confirm("Reset " + Cfg.SECTIONS[sec].toLowerCase(), "<p style=\"margin:0\">Every setting in this section goes back to its shipped value. The reason you wrote is recorded.</p>", "Reset to defaults", true))) return;
      const r = Cfg.resetSection(user, sec, f.querySelector("#why").value); if (!r.ok) return fail(r.errors);
      notice = { tone: "ok", text: r.changes ? "Reset. " + r.changes + " setting" + (r.changes === 1 ? "" : "s") + " back to the default." : "This section was already at its defaults." }; render();
    });
  }
  render();
});
