/* Register an instruction: pick the account, enter the details, attach the scan. Operations Officers only. */
Shell.init({ page: "new-case.html", roles: ["maker"] }, function (user, view) {
  const A = APP, R = Rules, esc = UI.esc, q = new URLSearchParams(location.search);
  const S = { type: A.TYPES[q.get("type")] ? q.get("type") : "payment", acct: null, doc: null, docName: "", values: {} };
  const opt = (v, l, sel) => '<option value="' + esc(v) + '"' + (sel ? " selected" : "") + ">" + esc(l) + "</option>";
  const acctsFor = () => A.ACCOUNTS.filter((a) => a.kind === A.TYPES[S.type].kind);

  view.innerHTML = '<div class="pagehead"><div><div class="crumb"><a href="cases.html">Cases</a> / New</div><h1>Register instruction</h1></div></div>' +
    '<div class="cols"><div id="left"></div><div id="right"></div></div>';
  const left = view.querySelector("#left"), right = view.querySelector("#right");

  function drawLeft() {
    const t = A.TYPES[S.type], accts = acctsFor();
    left.innerHTML =
      '<section class="panel"><div class="tabs" role="tablist">' + Object.keys(A.TYPES).map((k) => '<button type="button" role="tab" data-t="' + k + '" class="' + (k === S.type ? "on" : "") + '">' + esc(A.TYPES[k].label) + "</button>").join("") + "</div>" +
      '<div class="body"><div id="errs"></div><div class="fgrid">' +
      '<div class="full"><label class="f" for="acct">' + (t.kind === "fd" ? "Fixed deposit account" : "Debit account") + '</label><select id="acct">' + opt("", "Select an account") + accts.map((a) => opt(a.no, a.no + "  " + a.name, S.acct && S.acct.no === a.no)).join("") + "</select></div>" +
      '<div><label class="f" for="amount">' + (S.type === "fd" ? "Upliftment amount" : "Amount") + '</label><input id="amount" type="number" min="0" step="0.01" value="' + esc(S.values.amount || "") + '"></div>' +
      '<div><label class="f" for="currency">Currency</label><input id="currency" type="text" list="cur" maxlength="6" value="' + esc(S.values.currency || "MYR") + '" autocomplete="off"><datalist id="cur">' + Object.keys(A.FX).map((c) => '<option value="' + c + '">').join("") + '</datalist><div class="hint">Any currency code is accepted.</div></div>' +
      t.fields.map((f) => {
        const sel = f[2].startsWith("select:");
        return '<div class="' + (f[0] === "purpose" || f[0] === "instruction" ? "full" : "") + '"><label class="f" for="f_' + f[0] + '">' + esc(f[1]) + "</label>" +
          (sel ? '<select id="f_' + f[0] + '">' + f[2].slice(7).split(";").map((o) => opt(o, o, S.values[f[0]] === o)).join("") + "</select>" : '<input id="f_' + f[0] + '" type="text" value="' + esc(S.values[f[0]] || "") + '">') + "</div>";
      }).join("") + "</div></div></section>" +
      '<section class="panel"><header>Scanned instruction<span class="tools small muted" id="docname"></span></header><div class="body">' +
      '<div class="fgrid"><div><label class="f" for="file">Upload a scan</label><input id="file" type="file" accept="image/png,image/jpeg"><div class="hint">PNG or JPG. The signature does not need to be cropped.</div></div>' +
      '<div><label class="f" for="train">Or use a training scan</label><div style="display:flex;gap:8px"><select id="train"></select><button type="button" class="btn" id="gen">Generate</button></div><div class="hint">Made-up documents for practice. Choose an account first.</div></div></div>' +
      '<div class="docview" id="preview" style="margin-top:12px;display:none"></div></div></section>' +
      '<div class="actions"><button type="button" class="btn primary" id="go">Register case</button><a class="btn" href="cases.html">Cancel</a></div>';
    fillTrain(); showDoc();
  }

  function fillTrain() {
    const sel = left.querySelector("#train"), a = S.acct;
    if (!a) { sel.innerHTML = opt("", "Select an account first"); return; }
    const n = R.requiredSigs(a, R.toMYR(Number(S.values.amount) || 0, S.values.currency || "MYR").myr), last = a.parties[Math.max(0, n - 1)] ? n - 1 : 0;
    const o = [["genuine", "Genuine, all required signatories"]];
    o.push(["forged", n > 1 ? "Last required signature is forged" : "Signature is forged"]);
    if (n > 1) { o.push(["short", "Only one signature"]); o.push(["twice", "Same person signed twice"]); }
    sel.innerHTML = o.map((x) => opt(x[0], x[1])).join(""); sel._n = n; sel._last = last;
  }

  function drawRight() {
    const a = S.acct, amt = Number(S.values.amount) || 0, cur = String(S.values.currency || "MYR").toUpperCase(), fx = R.toMYR(amt, cur);
    if (!a) { right.innerHTML = '<section class="panel"><header>Account</header><div class="body muted">Select an account to see the signing mandate and the specimen signatures on file.</div></section>'; return; }
    const need = R.requiredSigs(a, fx.myr), lvl = R.approvalLevel(fx.myr, fx.known, false), due = R.dueAt(new Date().toISOString(), S.type);
    right.innerHTML = '<section class="panel"><header>Account</header><div class="body">' +
      (a.status !== "Active" ? '<div class="msg err" role="alert">This account is ' + esc(a.status.toLowerCase()) + ". New instructions cannot be registered until it is reactivated.</div>" : "") +
      '<div class="kv" style="grid-template-columns:1fr 1fr"><div><span>Customer</span><b>' + esc(a.name) + "</b></div><div><span>Status</span><b>" + esc(a.status) + "</b></div><div><span>Branch</span><b>" + esc(A.BRANCHES[a.branch]) + "</b></div><div><span>Specimens verified</span><b>" + UI.date(a.specimenDate) + "</b></div></div></div></section>" +
      '<section class="panel"><header>Signing mandate</header><div class="body"><b>' + esc(a.mandate.text) + '</b></div><div class="body flush">' + a.parties.map((p) => '<div class="party"><img src="' + UI.refSrc(p) + '" alt="Specimen signature of ' + esc(p.name) + '"><div><b>' + esc(p.name) + '</b><div class="muted small">' + esc(p.role) + "</div></div></div>").join("") + "</div></section>" +
      '<section class="panel"><header>Routing for this instruction</header><div class="body small"><div class="kv" style="grid-template-columns:1fr 1fr"><div><span>Signatures needed</span><b>' + need + " of " + a.parties.length + "</b></div><div><span>Approval authority</span><b>Level " + lvl + "</b></div></div>" +
      '<p style="margin:10px 0 0">' + (fx.known ? "MYR equivalent " + Math.round(fx.myr).toLocaleString("en-US") + (cur === "MYR" ? "" : " at " + fx.rate) + ". Approver: " + esc(R.levelWho(lvl)) + "." : '<span style="color:var(--amber)"><b>No exchange rate on file for ' + esc(cur || "this currency") + ".</b> The case goes to " + esc(R.levelWho(3)) + " (Level 3).</span>") + '</p><p class="muted" style="margin:6px 0 0">Service target: ' + UI.dt(due) + ".</p></div></section>";
  }

  function showDoc() {
    const p = left.querySelector("#preview"), n = left.querySelector("#docname");
    if (!S.doc) { p.style.display = "none"; n.textContent = "Nothing attached"; return; }
    p.style.display = ""; p.innerHTML = '<img alt="Scanned instruction" src="' + S.doc + '">'; n.textContent = S.docName;
  }

  function toJpeg(canvas) { const max = 1100, k = Math.min(1, max / canvas.width), c = document.createElement("canvas"); c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k); const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(canvas, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", 0.78); }

  function readValues() {
    ["amount", "currency"].forEach((id) => { const e = left.querySelector("#" + id); if (e) S.values[id] = e.value; });
    A.TYPES[S.type].fields.forEach((f) => { const e = left.querySelector("#f_" + f[0]); if (e) S.values[f[0]] = e.value; });
  }

  left.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-t]");
    if (tab) { readValues(); S.type = tab.dataset.t; S.acct = null; S.values = { amount: S.values.amount, currency: S.values.currency }; drawLeft(); drawRight(); return; }
    if (e.target.id === "gen") {
      readValues(); const a = S.acct; if (!a) return UI.toast("Select an account first.", "err");
      const sel = left.querySelector("#train"), kind = sel.value, n = sel._n, ps = a.parties;
      const g = (p, js) => ({ seed: p.seed, jitter: 0.12, jseed: js }), f = (p, js) => ({ seed: p.seed + 500, jitter: 0.06, jseed: js });
      let signers = ps.slice(0, n).map((p, i) => g(p, 3 + i * 5));
      if (kind === "forged") signers[signers.length - 1] = f(ps[n - 1], 9);
      if (kind === "short") signers = [g(ps[ps.length - 1], 4)];
      if (kind === "twice") signers = [g(ps[0], 3), g(ps[0], 9)];
      const t = A.TYPES[S.type], vals = { account: a.no, customer: a.name, amount: Number(S.values.amount || 0).toLocaleString("en-US"), currency: String(S.values.currency || "MYR").toUpperCase() };
      t.fields.forEach((fl) => (vals[fl[0]] = S.values[fl[0]] || ""));
      const fields = [{ id: "account", label: "Account no." }, { id: "customer", label: "Customer" }, { id: "amount", label: "Amount" }, { id: "currency", label: "Currency" }].concat(t.fields.map((fl) => ({ id: fl[0], label: fl[1] })));
      S.doc = toJpeg(SigSynth.renderDocument({ formTitle: t.long, formCode: t.form, fields }, vals, signers)); S.docName = "Training scan: " + sel.options[sel.selectedIndex].text; showDoc();
    }
    if (e.target.id === "go") submit();
  });
  left.addEventListener("change", (e) => {
    if (e.target.id === "acct") { readValues(); S.acct = A.ACCOUNTS.find((a) => a.no === e.target.value) || null; fillTrain(); drawRight(); }
    if (e.target.id === "file") {
      const file = e.target.files[0]; if (!file) return;
      const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext("2d").drawImage(img, 0, 0); S.doc = toJpeg(c); S.docName = file.name; URL.revokeObjectURL(img.src); showDoc(); };
      img.onerror = () => UI.toast("That file could not be read as an image.", "err"); img.src = URL.createObjectURL(file);
    }
  });
  left.addEventListener("input", (e) => { if (e.target.id === "amount" || e.target.id === "currency") { readValues(); drawRight(); } });

  function submit() {
    readValues(); const errs = [], a = S.acct, amt = Number(S.values.amount), cur = String(S.values.currency || "").trim().toUpperCase(), t = A.TYPES[S.type];
    if (!a) errs.push("Select an account."); else if (a.status !== "Active") errs.push("The account is " + a.status.toLowerCase() + ".");
    if (!(amt > 0)) errs.push("Enter an amount greater than zero.");
    if (!/^[A-Z]{2,6}$/.test(cur)) errs.push("Enter a currency code of 2 to 6 letters.");
    t.fields.forEach((f) => { if (!f[2].startsWith("select:") && !String(S.values[f[0]] || "").trim()) errs.push(f[1] + " is required."); });
    if (!S.doc) errs.push("Attach the scanned instruction.");
    const box = left.querySelector("#errs");
    if (errs.length) { box.innerHTML = '<div class="msg err" role="alert"><b>Fix before registering:</b><br>' + errs.map(esc).join("<br>") + "</div>"; window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const fx = R.toMYR(amt, cur), now = new Date().toISOString(), fields = {};
    t.fields.forEach((f) => (fields[f[0]] = String(S.values[f[0]] || "").trim()));
    const c = { id: DB.nextCaseNo(), type: S.type, accountNo: a.no, customer: a.name, branch: user.branch, fields, amount: amt, currency: cur, myr: fx.myr, fxKnown: fx.known, fxRate: fx.rate,
      required: R.requiredSigs(a, fx.myr), status: "registered", level: null, override: false, maker: user.id, makerName: user.name, createdAt: now, dueAt: R.dueAt(now, S.type), doc: S.doc };
    const r = DB.saveCase(c);
    if (!r.ok) { box.innerHTML = '<div class="msg err" role="alert">' + esc(r.error) + "</div>"; return; }
    DB.log(user, "case", "Case registered", c.id, t.long + ", " + UI.money(amt, cur) + ".");
    location.href = "case.html?id=" + encodeURIComponent(c.id) + "&new=1";
  }

  drawLeft(); drawRight();
});
