/* Register an instruction: pick the account, enter the details, attach the scan. Makers only.
   Each use case supplies its own fields (data.js) and its own checks (usecase.js). */
Shell.init({ page: "new-case.html", roles: ["maker"], module: "param", tab: "register" }, function (user, view, modKey) {
  const A = APP, R = Rules, esc = UI.esc;
  const types = modKey ? [A.MODULES[modKey].type] : user.modules.map((k) => A.MODULES[k].type); // only the modules this person works in
  const S = { type: types[0], acct: null, doc: null, docName: "", values: {} };
  const UC = () => (window.UseCase || {})[S.type] || {}; // the extra checks of the module being registered in
  if (!modKey && types.length === 1) Shell.setModule(A.TYPES[S.type].module, "register");
  const opt = (v, l, sel) => '<option value="' + esc(v) + '"' + (sel ? " selected" : "") + ">" + esc(l) + "</option>";
  const acctsFor = () => A.ACCOUNTS.filter((a) => a.kind === A.TYPES[S.type].kind);
  const fieldsOf = () => A.TYPES[S.type].fields;

  view.innerHTML = '<div class="pagehead"><div><div class="crumb"><a href="cases.html">Cases</a> / New</div><h1>' + esc(A.TYPES[S.type].registerLabel || "Register instruction") + '</h1></div></div><div class="cols"><div id="left"></div><div id="right"></div></div>';
  const left = view.querySelector("#left"), right = view.querySelector("#right");

  function fieldHtml(f) {
    const id = "f_" + f[0], kind = f[2] || "text", v = S.values[f[0]] == null ? (f[4] || "") : S.values[f[0]], full = f[3] === "full" ? "full" : "";
    let ctl;
    if (kind.startsWith("select:")) ctl = '<select id="' + id + '">' + kind.slice(7).split(";").map((o) => opt(o, o, v === o)).join("") + "</select>";
    else if (kind === "checkbox") ctl = '<label style="display:flex;gap:8px;align-items:flex-start;font-weight:400;color:var(--text)"><input type="checkbox" id="' + id + '" ' + (v === "Yes" ? "checked" : "") + ' style="margin-top:3px"><span>' + esc(f[5] || "Confirmed") + "</span></label>";
    else if (kind === "date") ctl = '<input id="' + id + '" type="date" value="' + esc(v) + '">';
    else ctl = '<input id="' + id + '" type="text" value="' + esc(v) + '">';
    return '<div class="' + full + '">' + (kind === "checkbox" ? '<label class="f">' + esc(f[1]) + "</label>" : '<label class="f" for="' + id + '">' + esc(f[1]) + "</label>") + ctl + "</div>";
  }

  function drawLeft() {
    const t = A.TYPES[S.type], accts = acctsFor();
    left.innerHTML =
      '<section class="panel">' + (types.length > 1 ? '<div class="tabs" role="tablist">' + types.map((k) => '<button type="button" role="tab" data-t="' + k + '" class="' + (k === S.type ? "on" : "") + '">' + esc(A.TYPES[k].label) + "</button>").join("") + "</div>" : "<header>" + esc(t.long) + "</header>") +
      '<div class="body"><div id="errs"></div><div class="fgrid">' +
      '<div class="full"><label class="f" for="acct">' + esc(t.accountLabel || "Account") + '</label><select id="acct">' + opt("", "Select an account") + accts.map((a) => opt(a.no, a.no + "  " + a.name, S.acct && S.acct.no === a.no)).join("") + "</select></div>" +
      '<div><label class="f" for="amount">' + esc(t.amountLabel || "Amount") + '</label><input id="amount" type="number" min="0" step="0.01" value="' + esc(S.values.amount || "") + '"></div>' +
      '<div><label class="f" for="currency">Currency</label><input id="currency" type="text" list="cur" maxlength="6" value="' + esc(S.values.currency || t.defaultCurrency || "MYR") + '" autocomplete="off"><datalist id="cur">' + Object.keys(A.FX).map((c) => '<option value="' + c + '">').join("") + '</datalist><div class="hint">Any currency code is accepted.</div></div>' +
      fieldsOf().map(fieldHtml).join("") + "</div></div></section>" +
      '<section class="panel"><header>Scanned instruction<span class="tools small muted" id="docname"></span></header><div class="body">' +
      '<div class="fgrid"><div><label class="f" for="file">Upload a scan</label><input id="file" type="file" accept="image/png,image/jpeg"><div class="hint">PNG or JPG. The signature does not need to be cropped.</div></div>' +
      '<div><label class="f" for="train">Or use a training scan</label><div style="display:flex;gap:8px"><select id="train"></select><button type="button" class="btn" id="gen">Generate</button></div><div class="hint">Made-up documents for practice. Choose an account first.</div></div></div>' +
      '<div class="docview" id="preview" style="margin-top:12px;display:none"></div></div></section>' +
      '<div class="actions"><button type="button" class="btn primary" id="go">Register case</button><a class="btn" href="cases.html">Cancel</a></div>';
    fillTrain(); showDoc();
  }

  function fillTrain() {
    const sel = left.querySelector("#train"), a = S.acct, keep = sel.value; // keep the choice when the options are rebuilt
    if (!a) { sel.innerHTML = opt("", "Select an account first"); return; }
    const n = R.requiredSigs(a, R.toMYR(Number(S.values.amount) || 0, S.values.currency || "MYR").myr);
    const o = [["genuine", "Genuine, all required signatories"], ["forged", n > 1 ? "Last required signature is forged" : "Signature is forged"]];
    if (n > 1) { o.push(["short", "Only one signature"]); o.push(["twice", "Same person signed twice"]); }
    sel.innerHTML = o.map((x) => opt(x[0], x[1], x[0] === keep)).join(""); sel._n = n;
  }

  const afterPanel = () => '<section class="panel"><header>What happens after you register</header><div class="body"><ol class="afterlist">' + (A.FLOWS[S.type].after || []).map((x) => "<li>" + esc(x) + "</li>").join("") + "</ol></div></section>";
  function drawRight() {
    const a = S.acct, amt = Number(S.values.amount) || 0, cur = String(S.values.currency || "MYR").toUpperCase(), fx = R.toMYR(amt, cur);
    if (!a) { right.innerHTML = '<section class="panel"><header>Account</header><div class="body muted">Select an account to see the signing mandate and the specimen signatures on file.</div></section>' + afterPanel(); return; }
    const need = R.requiredSigs(a, fx.myr), lvl = R.approvalLevel(fx.myr, fx.known, false, S.type), due = R.dueAt(new Date().toISOString(), S.type), top = A.TYPES[S.type].levels.length;
    const checks = UC().registerChecks ? UC().registerChecks(S.values, a, DB.cases(), { fx, need, lvl }) : [];
    // what the thresholds in Settings mean for this instruction
    const skip = Cfg.asvNotRequired(S.type, fx.myr, fx.known), hv = !skip && Cfg.highValueReview({ type: S.type, myr: fx.myr }), two = Cfg.secondAnalyst({ type: S.type, myr: fx.myr }), yrs = Cfg.specimenYears(a), block = !fx.known && Cfg.settings.amount.unknownCurrency === "block", fromAmt = Cfg.settings.amount.asvFrom[A.TYPES[S.type].module];
    if (skip) checks.push({ tone: "info", text: "<b>ASV is not required</b> below MYR " + Math.round(fromAmt).toLocaleString("en-US") + ". The officer checks the signature by eye and the instruction can go straight to approval. You can still run verification if you want to." });
    if (hv) checks.push({ tone: "info", text: "A clean match at this amount is still reviewed by an analyst, who calls the signatory back, before approval." });
    if (two) checks.push({ tone: "info", text: "If this is flagged, two different analysts must clear it." });
    if (block) checks.push({ tone: "err", text: "<b>No exchange rate for " + esc(cur) + ".</b> This bank blocks registration in a currency with no rate. A Branch Manager can add the rate in Settings." });
    right.innerHTML = '<section class="panel"><header>Account</header><div class="body">' +
      (yrs ? '<div class="msg warn">The specimens on file were verified ' + yrs + ' years ago. Ask the customer to refresh their specimen cards.</div>' : "") +
      (a.status !== "Active" ? '<div class="msg err" role="alert">This account is ' + esc(a.status.toLowerCase()) + ". New instructions cannot be registered until it is reactivated.</div>" : "") +
      '<div class="kv" style="grid-template-columns:1fr 1fr"><div><span>Customer</span><b>' + esc(a.name) + "</b></div><div><span>Status</span><b>" + esc(a.status) + "</b></div><div><span>Branch</span><b>" + esc(A.BRANCHES[a.branch]) + "</b></div><div><span>Specimens verified</span><b>" + UI.date(a.specimenDate) + "</b></div>" +
      (UC().accountRows ? UC().accountRows(a).map((r) => "<div><span>" + esc(r[0]) + "</span><b>" + esc(r[1]) + "</b></div>").join("") : "") + "</div></div></section>" +
      '<section class="panel"><header>Signing mandate</header><div class="body"><b>' + esc(a.mandate.text) + '</b></div><div class="body flush">' + a.parties.map((p) => '<div class="party"><img src="' + UI.refSrc(p) + '" alt="Specimen signature of ' + esc(p.name) + '"><div><b>' + esc(p.name) + '</b><div class="muted small">' + esc(p.role) + "</div></div></div>").join("") + "</div></section>" +
      '<section class="panel"><header>Routing for this instruction</header><div class="body small"><div class="kv" style="grid-template-columns:1fr 1fr"><div><span>Signatures needed</span><b>' + need + " of " + a.parties.length + "</b></div><div><span>Approval authority</span><b>Level " + lvl + "</b></div></div>" +
      '<p style="margin:10px 0 0">' + (fx.known ? "MYR equivalent " + Math.round(fx.myr).toLocaleString("en-US") + (cur === "MYR" ? "" : " at " + fx.rate) + ". Approver: " + esc(R.levelWho(lvl, S.type)) + "." : '<span style="color:var(--amber)"><b>No exchange rate on file for ' + esc(cur || "this currency") + ".</b> The case goes to " + esc(R.levelWho(top, S.type)) + " (Level " + top + ").</span>") + '</p><p class="muted" style="margin:6px 0 0">Service target: ' + UI.dt(due) + ".</p></div></section>" +
      (checks.length ? '<section class="panel"><header>' + esc(A.TYPES[S.type].checksTitle || "Checks before registering") + '</header><div class="body small">' + checks.map((k) => '<div class="msg ' + (k.tone || "info") + '" style="margin-bottom:6px">' + k.text + "</div>").join("") + "</div></section>" : "") + afterPanel();
  }

  function showDoc() {
    const p = left.querySelector("#preview"), n = left.querySelector("#docname");
    if (!S.doc) { p.style.display = "none"; n.textContent = "Nothing attached"; return; }
    p.style.display = ""; p.innerHTML = '<img alt="Scanned instruction" src="' + S.doc + '">'; n.textContent = S.docName;
  }
  function toJpeg(canvas) { const k = Math.min(1, 1100 / canvas.width), c = document.createElement("canvas"); c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k); const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(canvas, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", 0.78); }

  function readValues() {
    ["amount", "currency"].forEach((id) => { const e = left.querySelector("#" + id); if (e) S.values[id] = e.value; });
    fieldsOf().forEach((f) => { const e = left.querySelector("#f_" + f[0]); if (e) S.values[f[0]] = e.type === "checkbox" ? (e.checked ? "Yes" : "No") : e.value; });
  }

  left.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-t]");
    if (tab) { readValues(); S.type = tab.dataset.t; S.acct = null; S.values = { amount: S.values.amount, currency: S.values.currency }; drawLeft(); drawRight(); return; }
    if (e.target.id === "gen") {
      readValues(); const a = S.acct; if (!a) return UI.toast("Select an account first.", "err");
      const sel = left.querySelector("#train"), kind = sel.value, n = sel._n, ps = a.parties;
      const g = (p, js) => (Sig.has(p) ? { src: Sig.genuine(p, js) } : { seed: p.seed, jitter: 0.12, jseed: js }), f = (p, js) => (Sig.has(p) ? { src: Sig.forged(p, js) } : { seed: p.seed + 500, jitter: 0.06, jseed: js });
      let signers = ps.slice(0, n).map((p, i) => g(p, 3 + i * 5));
      if (kind === "forged") signers[signers.length - 1] = f(ps[n - 1], 9);
      if (kind === "short") signers = [g(ps[ps.length - 1], 4)];
      if (kind === "twice") signers = [g(ps[0], 3), g(ps[0], 9)];
      const t = A.TYPES[S.type], vals = { account: a.no, customer: a.name, amount: Number(S.values.amount || 0).toLocaleString("en-US"), currency: String(S.values.currency || "MYR").toUpperCase() };
      fieldsOf().forEach((fl) => (vals[fl[0]] = S.values[fl[0]] || ""));
      const fields = [{ id: "account", label: "Account no." }, { id: "customer", label: "Customer" }, { id: "amount", label: "Amount" }, { id: "currency", label: "Currency" }].concat(fieldsOf().filter((fl) => fl[2] !== "checkbox").map((fl) => ({ id: fl[0], label: fl[1] })));
      S.doc = toJpeg(SigSynth.renderDocument({ formTitle: t.long, formCode: t.form, fields }, vals, signers)); S.docName = "Training scan: " + sel.options[sel.selectedIndex].text; showDoc();
    }
    if (e.target.id === "go") submit();
  });
  left.addEventListener("change", (e) => {
    if (e.target.id === "acct") { readValues(); S.acct = A.ACCOUNTS.find((a) => a.no === e.target.value) || null; fillTrain(); drawRight(); }
    else if (e.target.id === "file") {
      const file = e.target.files[0]; if (!file) return;
      const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext("2d").drawImage(img, 0, 0); S.doc = toJpeg(c); S.docName = file.name; URL.revokeObjectURL(img.src); showDoc(); };
      img.onerror = () => UI.toast("That file could not be read as an image.", "err"); img.src = URL.createObjectURL(file);
    } else if (e.target.id !== "amount" && e.target.id !== "currency") { readValues(); drawRight(); }
  });
  // The number of signatures a mandate needs can depend on the amount, so the practice-scan options follow it too.
  left.addEventListener("input", (e) => { if (["amount", "currency"].includes(e.target.id) || (e.target.id || "").startsWith("f_")) { readValues(); if (e.target.id === "amount" || e.target.id === "currency") fillTrain(); drawRight(); } });

  function submit() {
    readValues(); const errs = [], a = S.acct, amt = Number(S.values.amount), cur = String(S.values.currency || "").trim().toUpperCase(), t = A.TYPES[S.type];
    if (!a) errs.push("Select an account."); else if (a.status !== "Active") errs.push("The account is " + a.status.toLowerCase() + ".");
    if (!(amt > 0)) errs.push("Enter an amount greater than zero.");
    if (!/^[A-Z]{2,6}$/.test(cur)) errs.push("Enter a currency code of 2 to 6 letters.");
    if (/^[A-Z]{2,6}$/.test(cur) && !R.toMYR(1, cur).known && Cfg.settings.amount.unknownCurrency === "block") errs.push("There is no exchange rate for " + cur + ". Use another currency, or ask a Branch Manager to add the rate in Settings.");
    fieldsOf().forEach((f) => {
      const kind = f[2] || "text", v = String(S.values[f[0]] || "").trim();
      if (kind === "checkbox") { if (f[6] === "req" && v !== "Yes") errs.push(f[1] + " must be confirmed."); }
      else if (!kind.startsWith("select:") && f[6] !== "opt" && !v) errs.push(f[1] + " is required.");
    });
    if (UC().validate && a) errs.push.apply(errs, UC().validate(S.values, a, { amt, cur }));
    if (!S.doc) errs.push("Attach the scanned instruction.");
    const box = left.querySelector("#errs");
    if (errs.length) { box.innerHTML = '<div class="msg err" role="alert"><b>Fix before registering:</b><br>' + errs.map(esc).join("<br>") + "</div>"; window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const fx = R.toMYR(amt, cur), now = new Date().toISOString(), fields = {};
    fieldsOf().forEach((f) => (fields[f[0]] = String(S.values[f[0]] || "").trim()));
    const c = { id: DB.nextCaseNo(S.type), type: S.type, accountNo: a.no, customer: a.name, branch: user.branch, fields, amount: amt, currency: cur, myr: fx.myr, fxKnown: fx.known, fxRate: fx.rate,
      required: R.requiredSigs(a, fx.myr), status: "registered", level: null, override: false, maker: user.id, makerName: user.name, createdAt: now, dueAt: R.dueAt(now, S.type), doc: S.doc, asvSkip: Cfg.asvNotRequired(S.type, fx.myr, fx.known) };
    const extra = UC().onRegister ? UC().onRegister(c, S.values, a, DB.cases()) || [] : [];
    const r = DB.saveCase(c);
    if (!r.ok) { box.innerHTML = '<div class="msg err" role="alert">' + esc(r.error) + "</div>"; return; }
    DB.log(user, "case", "Case registered", c.id, t.long + ", " + UI.money(amt, cur) + ".");
    extra.forEach((x) => DB.log(user, "case", x[0], c.id, x[1]));
    location.href = "case.html?id=" + encodeURIComponent(c.id) + "&new=1";
  }

  drawLeft(); drawRight();
});
