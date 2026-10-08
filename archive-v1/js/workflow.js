/* Workflow page controller: 5 steps — receive, extract, reference + mandate, verify, decision.
   One controller drives all three use cases from the configuration in data.js. */
(function () {
  const cfg = USE_CASES[document.body.dataset.usecase];
  const root = document.getElementById("app");
  const S = { step: 0, maxStep: 0, values: {}, scenario: null, doc: null, ext: null, sel: [], declared: {}, refs: {}, threshold: THRESHOLD_DEFAULT,
    required: cfg.mandate.required, either: false, result: null, decision: null, note: "", done: null, uploadedRef: {} };
  cfg.fields.forEach((f) => (S.values[f.id] = f.value));
  cfg.parties.forEach((p) => (S.refs[p.id] = SigSynth.renderReference(p.seed)));
  const url = (c) => c.toDataURL("image/png");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (s, el) => (el || root).querySelector(s);
  const $$ = (s, el) => Array.from((el || root).querySelectorAll(s));
  const pname = (id) => cfg.parties.find((p) => p.id === id).name;

  // ---------- document handling ----------
  function buildScenario(id) {
    const sc = cfg.scenarios.find((x) => x.id === id);
    const signers = sc.signers.map((s, i) => {
      const p = cfg.parties.find((x) => x.id === s.party);
      return s.kind === "genuine" ? { seed: p.seed, jitter: 0.1, jseed: i * 5 + 3 } : { seed: p.seed + 500, jitter: 0.06, jseed: i * 5 + 9 };
    });
    return SigSynth.renderDocument(cfg, S.values, signers);
  }
  function setDoc(canvas, scenario) { S.doc = canvas; S.scenario = scenario; S.ext = null; S.result = null; S.maxStep = 0; S.sel = []; renderStepper(); }
  function showDoc() {
    const v = $("#docview");
    v.innerHTML = "";
    if (S.doc) { const c = document.createElement("canvas"); c.width = S.doc.width; c.height = S.doc.height; c.getContext("2d").drawImage(S.doc, 0, 0); v.appendChild(c); }
    else v.innerHTML = '<div class="empty">Pick a sample scenario or upload a scanned document</div>';
    $("#next").disabled = !S.doc;
  }
  function loadFile(file, cb) {
    const img = new Image();
    img.onload = () => { const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext("2d").drawImage(img, 0, 0); cb(c); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(file);
  }

  // ---------- chrome ----------
  function renderHead() {
    document.getElementById("head").innerHTML =
      '<div class="wrap"><div class="crumbs"><a href="index.html">Overview</a> / ' + esc(cfg.short) + "</div><h1>" + esc(cfg.title) + "</h1><p>" + esc(cfg.lead) + "</p>" +
      '<div class="tags"><span class="pill">Main risk: ' + esc(cfg.risk) + '</span><span class="pill">Account: ' + esc(cfg.entity) + '</span><span class="pill">Pass score: ' + "&ge; 70" + "</span></div></div>";
  }
  function renderStepper() {
    $("#stepper").innerHTML = "<h4>Verification steps</h4>" + cfg.steps.map((t, i) =>
      '<div class="step ' + (i === S.step ? "now" : i <= S.maxStep && i < S.step ? "done" : i < S.maxStep ? "done" : "") + '" data-s="' + i + '"><span class="n">' + (i < S.step ? "&#10003;" : i + 1) + "</span>" + esc(t) + "</div>").join("") +
      '<div class="mand"><span class="muted small">Signing mandate</span><b>' + esc(mandateText()) + "</b></div>";
    $$(".step.done", $("#stepper")).forEach((el) => el.addEventListener("click", () => go(+el.dataset.s)));
  }
  function mandateText() { return cfg.mandate.editable ? (S.either ? "Either holder may sign (1 required)" : "Both holders must sign (2 required)") : cfg.mandate.text; }

  async function go(n) {
    if (n === 1 && !S.ext) { busy("Locating and cropping handwritten signatures…"); await sleep(750); S.ext = ASV.extractSignatures(S.doc); S.sel = S.ext.candidates.map((c, i) => (c.selected ? i : -1)).filter((i) => i >= 0); S.declared = {};
      const sc = cfg.scenarios.find((x) => x.id === S.scenario); // sample documents name who is signing
      if (sc && sc.signers.length === S.sel.length) S.sel.forEach((ci, k) => (S.declared[ci] = sc.signers[k].party)); }
    if (n === 3 && !S.result) { busy("Comparing with verified reference signatures…"); await sleep(1100); runVerify(); }
    S.step = n; S.maxStep = Math.max(S.maxStep, n); render();
    window.scrollTo({ top: root.offsetTop - 90, behavior: "smooth" });
  }
  function busy(msg) { $("#main").innerHTML = '<div class="card busy"><span class="spin"></span><div style="margin-top:12px">' + msg + "</div></div>"; }
  function render() { renderStepper(); const f = [p0, p1, p2, p3, p4][S.step]; $("#main").innerHTML = f.html(); f.bind(); requestAnimationFrame(() => $$("[data-w]").forEach((e) => (e.style.width = e.dataset.w + "%"))); }

  function runVerify() {
    const sigs = S.sel.map((i) => Object.assign({}, S.ext.candidates[i], { declared: S.declared[i] }));
    const required = cfg.mandate.editable ? (S.either ? 1 : cfg.parties.length) : cfg.mandate.required;
    S.required = required;
    S.result = ASVLogic.evaluate({ sigs, parties: cfg.parties, refs: S.refs, required, threshold: S.threshold });
    S.result.sigs = sigs;
  }

  // ---------- step 1: receive ----------
  const p0 = {
    html() {
      const f = cfg.fields.map((x) => '<div class="' + (x.id === "purpose" || x.id === "instruction" ? "full" : "") + '"><label class="f">' + esc(x.label) + "</label>" +
        (x.type === "amount" ? '<input type="number" min="0" data-f="' + x.id + '" value="' + esc(S.values[x.id]) + '">' :
          x.type === "currency" ? '<input type="text" list="cur" maxlength="12" data-f="' + x.id + '" value="' + esc(S.values[x.id]) + '" placeholder="Any currency code">' :
            '<input type="text" data-f="' + x.id + '" value="' + esc(S.values[x.id]) + '">') + "</div>").join("");
      return '<div class="card"><div class="panel-title"><div><h3>1 &middot; Receive the signed instruction</h3><p class="muted">The branch scans the signed form. Load a sample scenario or upload your own scan; the signature does not need to be pre-cropped.</p></div></div>' +
        '<div class="two"><div><h4>Instruction details</h4><div class="fgrid">' + f + '</div><p class="muted small" style="margin-top:12px">Currency accepts any code (e.g. MYR, USD, IDR, or your own). Edits update a sample document live.</p>' +
        '<datalist id="cur">' + CURRENCIES.map((c) => '<option value="' + c + '">').join("") + "</datalist></div>" +
        '<div><h4>Signed document</h4><div class="scen">' + cfg.scenarios.map((s) => '<button data-sc="' + s.id + '" class="' + (S.scenario === s.id ? "on" : "") + '"><i class="dot ' + s.tone + '"></i><div><b>' + esc(s.label) + "</b><span>" + esc(s.desc) + "</span></div></button>").join("") + "</div>" +
        '<label class="drop" id="drop"><b>Upload a scanned document</b><br><span class="small">PNG or JPG &middot; drop here or click</span><input type="file" id="file" accept="image/*" hidden></label><div class="docview" id="docview"></div></div></div>' +
        '<div class="actions"><span></span><div class="right"><button class="btn btn-primary" id="next">Extract signatures &rarr;</button></div></div></div>';
    },
    bind() {
      showDoc();
      $$("[data-f]").forEach((i) => i.addEventListener("input", () => { S.values[i.dataset.f] = i.value; }));
      $$("[data-f]").forEach((i) => i.addEventListener("change", () => { if (S.scenario) { setDoc(buildScenario(S.scenario), S.scenario); showDoc(); } }));
      $$("[data-sc]").forEach((b) => b.addEventListener("click", () => { setDoc(buildScenario(b.dataset.sc), b.dataset.sc); $$("[data-sc]").forEach((x) => x.classList.toggle("on", x === b)); showDoc(); }));
      const drop = $("#drop"), file = $("#file");
      const take = (f) => f && loadFile(f, (c) => { setDoc(c, null); $$("[data-sc]").forEach((x) => x.classList.remove("on")); showDoc(); });
      file.addEventListener("change", () => take(file.files[0]));
      ["dragover", "dragenter"].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add("over"); }));
      ["dragleave", "drop"].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.remove("over"); }));
      drop.addEventListener("drop", (ev) => take(ev.dataTransfer.files[0]));
      $("#next").addEventListener("click", () => go(1));
    },
  };

  // ---------- step 2: extract ----------
  function overlay() {
    const c = document.createElement("canvas"), W = S.ext.docW, H = S.ext.docH; c.width = W; c.height = H;
    const x = c.getContext("2d"); x.drawImage(S.doc, 0, 0);
    const lw = Math.max(3, W / 260);
    S.ext.candidates.forEach((k, i) => {
      const on = S.sel.includes(i), b = k.box, pad = 6;
      x.lineWidth = lw; x.strokeStyle = on ? "#f58220" : "#9aa7bd"; x.setLineDash(on ? [] : [lw * 3, lw * 2]);
      x.strokeRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2);
      x.fillStyle = on ? "#f58220" : "#9aa7bd"; const r = lw * 5; x.fillRect(b.x - pad, b.y - pad - r * 1.5, r * 1.6, r * 1.5);
      x.fillStyle = "#fff"; x.font = "700 " + r + "px Arial"; x.fillText(String(i + 1), b.x - pad + r * 0.45, b.y - pad - r * 0.3);
    });
    c.style.cssText = "width:100%;height:auto;display:block;border-radius:6px";
    return c;
  }
  const p1 = {
    html() {
      const cs = S.ext.candidates;
      const list = cs.length ? cs.map((k, i) => '<div class="cand ' + (S.sel.includes(i) ? "on" : "") + '"><input type="checkbox" data-c="' + i + '" ' + (S.sel.includes(i) ? "checked" : "") + '><img src="' + url(k.canvas) + '" alt="Signature ' + (i + 1) + '">' +
        '<div><b>Signature ' + (i + 1) + '</b> <span class="pill ' + (k.grade === "Good" ? "pass" : k.grade === "Fair" ? "review" : "fail") + '">Capture: ' + k.grade + "</span>" +
        (k.notes.length ? '<div class="small muted">' + k.notes.map(esc).join(" &middot; ") + "</div>" : '<div class="small muted">Clear strokes, no overlap detected.</div>') + "</div></div>").join("")
        : '<div class="empty"><b>No clear signature detected.</b><br>Try a higher-resolution scan, or a scan without heavy shadows. Signatures that overlap printed text or stamps cannot be compared reliably.</div>';
      return '<div class="card"><div class="panel-title"><div><h3>2 &middot; Extract the handwritten signatures</h3><p class="muted">ASV finds handwriting on the page and crops it. Untick anything that is not a signature (for example a handwritten date).</p></div><span class="pill orange">' + cs.length + " found</span></div>" +
        '<div class="two" style="grid-template-columns:1.35fr 1fr"><div><div class="docview" id="ov"></div></div><div><h4>Detected signatures</h4>' + list + "</div></div>" +
        '<div class="actions"><button class="btn btn-outline" id="back">&larr; Back</button><div class="right"><button class="btn btn-outline" id="merge" ' + (S.sel.length > 1 ? "" : "disabled") + ' title="Use when one signature was split into pieces">Merge selected into one signature</button><button class="btn btn-primary" id="next" ' + (S.sel.length ? "" : "disabled") + '>Continue to reference &rarr;</button></div></div></div>';
    },
    bind() {
      const draw = () => { const v = $("#ov"); v.innerHTML = ""; v.appendChild(overlay()); };
      draw();
      $$("[data-c]").forEach((cb) => cb.addEventListener("change", () => {
        const i = +cb.dataset.c; S.sel = cb.checked ? S.sel.concat(i).sort() : S.sel.filter((x) => x !== i);
        S.result = null; cb.closest(".cand").classList.toggle("on", cb.checked); $("#next").disabled = !S.sel.length; $("#merge").disabled = S.sel.length < 2; draw();
      }));
      $("#back").addEventListener("click", () => go(0));
      $("#merge").addEventListener("click", () => {
        const cs = S.ext.candidates, picked = S.sel.map((i) => cs[i]), keep = cs.filter((_, i) => !S.sel.includes(i));
        const merged = ASV.mergeCandidates(S.doc, picked); keep.push(merged); keep.sort((x, y) => x.box.x - y.box.x);
        S.ext.candidates = keep; S.sel = [keep.indexOf(merged)];
        S.declared = {}; S.result = null; render();
      });
      $("#next").addEventListener("click", () => go(2));
    },
  };

  // ---------- step 3: reference + mandate ----------
  const p2 = {
    html() {
      const parties = cfg.parties.map((p) => '<div class="party"><img class="thumb" src="' + url(S.refs[p.id]) + '" alt="Specimen"><div class="who"><b>' + esc(p.name) + '</b><span class="muted small">' + esc(p.role) + " &middot; verified specimen on record</span>" +
        (S.uploadedRef[p.id] ? '<br><span class="pill pass">Uploaded specimen in use</span>' : "") + '</div><label class="btn btn-outline btn-sm">Replace specimen<input type="file" accept="image/*" hidden data-ref="' + p.id + '"></label></div>').join("");
      const decl = S.sel.map((i) => '<div class="party"><img class="thumb" src="' + url(S.ext.candidates[i].canvas) + '" alt=""><div class="who"><b>Signature ' + (i + 1) + '</b><span class="muted small">Who does the document say signed?</span></div>' +
        '<select data-d="' + i + '" style="width:210px"><option value="auto">Auto-detect signatory</option>' + cfg.parties.map((p) => '<option value="' + p.id + '"' + (S.declared[i] === p.id ? " selected" : "") + ">" + esc(p.name) + "</option>").join("") + "</select></div>").join("");
      const mand = cfg.mandate.editable ? '<label class="f">Account signing rule</label><select id="rule"><option value="both"' + (S.either ? "" : " selected") + '>Both holders must sign</option><option value="either"' + (S.either ? " selected" : "") + ">Either holder may sign</option></select>" : '<b style="font-size:1.05rem">' + esc(cfg.mandate.text) + "</b>";
      return '<div class="card"><div class="panel-title"><div><h3>3 &middot; Reference signatures and signing mandate</h3><p class="muted">Each signature is compared with the specimen of the specific authorised signatory in the account mandate, not any signature linked to the account.</p></div></div>' +
        '<div class="fgrid" style="align-items:start"><div><h4>Signing mandate</h4><div class="card" style="box-shadow:none;background:var(--orange-100);border-color:#f9d3ae">' + mand + '<div class="small muted" style="margin-top:6px">' + esc(cfg.entity) + "</div></div></div>" +
        '<div><h4>Pass score</h4><label class="f">Similarity out of 100</label><input type="number" id="thr" min="1" max="99" value="' + S.threshold + '"><p class="small muted" style="margin:6px 0 0">Scores at or above this value pass. Default 70; in production the bank sets it from model validation.</p></div></div>' +
        '<h4 style="margin-top:22px">Authorised signatories on record</h4>' + parties +
        '<h4 style="margin-top:22px">Signatures to verify</h4>' + decl +
        '<div class="actions"><button class="btn btn-outline" id="back">&larr; Back</button><div class="right"><button class="btn btn-primary" id="next">Run verification &rarr;</button></div></div></div>';
    },
    bind() {
      $$("[data-d]").forEach((s) => s.addEventListener("change", () => { S.declared[+s.dataset.d] = s.value; S.result = null; }));
      $$("[data-ref]").forEach((f) => f.addEventListener("change", () => loadFile(f.files[0], (c) => { S.refs[f.dataset.ref] = c; S.uploadedRef[f.dataset.ref] = true; S.result = null; render(); })));
      const rule = $("#rule"); if (rule) rule.addEventListener("change", () => { S.either = rule.value === "either"; S.result = null; renderStepper(); });
      $("#thr").addEventListener("change", (e) => { S.threshold = Math.min(99, Math.max(1, +e.target.value || 70)); S.result = null; });
      $("#back").addEventListener("click", () => go(1));
      $("#next").addEventListener("click", () => { S.threshold = Math.min(99, Math.max(1, +$("#thr").value || 70)); S.result = null; go(3); });
    },
  };

  // ---------- step 4: verify ----------
  const p3 = {
    html() {
      const R = S.result, V = ASVLogic.VERDICT[R.verdict], ico = R.verdict === "pass" ? "&#10003;" : R.verdict === "review" ? "!" : "&#10005;";
      const cards = R.rows.map((r, k) => {
        const sig = R.sigs[k], m = r.matched, ok = r.pass;
        const mini = cfg.parties.map((p) => '<div class="mini"><span>' + esc(p.name) + '</span><div class="m"><i style="width:' + r.scores[p.id] + '%"></i></div><b>' + r.scores[p.id] + "</b></div>").join("");
        return '<div class="card vcard"><div class="head"><h3 style="margin:0">Signature ' + (S.sel[k] + 1) + '</h3><span class="pill ' + (ok ? "pass" : "review") + '">' + (ok ? "Likely match" : r.poor ? "Cannot compare reliably" : "Suspicious — review") + "</span></div>" +
          '<div class="two"><div class="sig-card"><div class="sigbox"><small>Submitted</small><img src="' + url(sig.canvas) + '" alt=""></div><div class="sigbox"><small>Reference: ' + esc(pname(m.id)) + '</small><img src="' + url(S.refs[m.id]) + '" alt=""></div></div>' +
          '<div><div class="bigscore ' + (ok ? "pass" : "fail") + '">' + m.score + '<span class="muted small" style="font-weight:600"> / 100 vs ' + esc(pname(m.id)) + '</span></div><div class="meter"><i class="' + (ok ? "pass" : "fail") + '" data-w="' + m.score + '"></i><u style="left:' + R.threshold + '%"></u></div>' +
          '<div class="meter-l"><span>0</span><span>Pass score ' + R.threshold + '</span><span>100</span></div>' + (r.notes.length ? '<p class="small" style="margin:10px 0 0;color:var(--amber-600)">' + r.notes.map(esc).join(" ") + "</p>" : "") + "</div></div>" +
          '<details style="margin-top:12px"><summary class="small muted" style="cursor:pointer">Score against every signatory on the mandate</summary>' + mini + "</details></div>";
      }).join("");
      return '<div class="banner ' + V.pill + '"><span class="ico">' + ico + '</span><div><h3>' + V.title + "</h3><p>" + V.text + "</p></div></div>" +
        '<div style="height:18px"></div>' + cards +
        '<div class="card"><h3>Mandate check</h3><ul class="checks">' + R.reasons.map((t) => "<li><span>&bull;</span><span>" + esc(t) + "</span></li>").join("") +
        '<li><span>' + (R.mandateMet ? "&#10003;" : "&#10005;") + "</span><span><b>" + esc(mandateText()) + "</b> &mdash; " + (R.mandateMet ? "satisfied" : "not satisfied") + "</span></li></ul>" +
        '<p class="small muted" style="margin-top:12px">A score supports the reviewer; it does not authorise a transaction on its own. Genuine signatures vary with writing conditions, age and scan quality.</p>' +
        '<div class="actions"><button class="btn btn-outline" id="back">&larr; Adjust reference</button><div class="right"><button class="btn btn-primary" id="next">Staff decision &rarr;</button></div></div></div>';
    },
    bind() { $("#back").addEventListener("click", () => go(2)); $("#next").addEventListener("click", () => go(4)); },
  };

  // ---------- step 5: decision ----------
  const DEC = { approve: ["Approve & proceed", "Release to the bank's normal approval workflow", "approved"], recheck: ["Recheck manually", "Send for manual signature check or call-back", "recheck"], reject: ["Reject", "Decline the instruction and notify the customer", "rejected"] };
  const p4 = {
    html() {
      const R = S.result, V = ASVLogic.VERDICT[R.verdict];
      if (S.done) return '<div class="card" style="text-align:center;padding:44px"><div class="ico" style="margin:0 auto 14px;width:56px;height:56px;font-size:1.6rem;background:var(--green-600)">&#10003;</div><h2>Decision recorded</h2><p class="muted">Case <b>' + S.done.id + "</b> &mdash; " +
        esc(DEC[S.done.key][0]) + ". " + esc(DEC[S.done.key][1]) + '.</p><div style="display:flex;gap:10px;justify-content:center;margin-top:18px"><a class="btn btn-primary" href="' + cfg.page + '">Verify another document</a><a class="btn btn-outline" href="audit.html">View audit log</a></div></div>';
      const btns = Object.keys(DEC).map((k) => '<button class="dbtn ' + k + (S.decision === k ? " on" : "") + '" data-k="' + k + '"><b>' + DEC[k][0] + "</b><span>" + DEC[k][1] + "</span></button>").join("");
      return '<div class="card"><div class="panel-title"><div><h3>5 &middot; Staff decision</h3><p class="muted">ASV supports the reviewer. The decision and note below are written to the audit log.</p></div><span class="pill ' + V.pill + '">' + V.title + "</span></div>" +
        '<table class="t"><tr><td class="muted">Account</td><td><b>' + esc(cfg.entity) + '</b></td><td class="muted">Amount</td><td><b>' + esc(fmtMoney(S.values.amount, S.values.currency)) + "</b></td></tr><tr><td class=\"muted\">Reference</td><td>" + esc(S.values.reference || S.values.account || "-") +
        '</td><td class="muted">Scores</td><td><b>' + R.rows.map((r) => r.matched.score).join(" / ") + "</b></td></tr></table>" +
        '<div class="decide">' + btns + '</div><label class="f">Reviewer note ' + (R.verdict !== "pass" ? "(required to approve a flagged case)" : "(optional)") + '</label><textarea id="note" rows="3" placeholder="e.g. Called the Finance Director to confirm the signature.">' + esc(S.note) + "</textarea>" +
        '<div class="small" id="hint" style="color:var(--red-600);min-height:20px;margin-top:6px"></div><div class="actions"><button class="btn btn-outline" id="back">&larr; Back to result</button><div class="right"><button class="btn btn-dark" id="submit">Record decision</button></div></div></div>';
    },
    bind() {
      if (S.done) return;
      $$("[data-k]").forEach((b) => b.addEventListener("click", () => { S.decision = b.dataset.k; $$("[data-k]").forEach((x) => x.classList.toggle("on", x === b)); $("#hint").textContent = ""; }));
      $("#note").addEventListener("input", (e) => (S.note = e.target.value));
      $("#back").addEventListener("click", () => go(3));
      $("#submit").addEventListener("click", () => {
        const R = S.result;
        if (!S.decision) return ($("#hint").textContent = "Choose approve, recheck or reject.");
        if (S.decision === "approve" && R.verdict !== "pass" && S.note.trim().length < 5) return ($("#hint").textContent = "A short note is required to approve a flagged case.");
        const rec = Store.add({ id: Store.nextId(), ts: new Date().toISOString(), useCase: cfg.key, entity: cfg.entity, amount: +S.values.amount || 0, currency: (S.values.currency || "").toUpperCase(),
          verdict: R.verdict, decision: DEC[S.decision][2], scores: R.rows.map((r) => r.matched.score), note: S.note.trim() });
        S.done = { id: rec.id, key: S.decision }; render();
      });
    },
  };

  renderHead(); renderStepper(); p0.bind && render();
})();
