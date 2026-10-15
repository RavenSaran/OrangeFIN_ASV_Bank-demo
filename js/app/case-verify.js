/* Signature verification on a case: the comparison sheets (results) and the extraction workbench (run). */
(function () {
  const A = APP, esc = UI.esc;
  const acct = (c) => A.ACCOUNTS.find((a) => a.no === c.accountNo);
  const party = (c, id) => acct(c).parties.find((p) => p.id === id);

  // One sheet per signature: submitted next to the specimen, then a 0-100 scale with the pass line.
  function sheets(c) {
    const asv = c.asv, a = acct(c);
    const head = '<div class="msg ' + ({ pass: "ok", review: "warn", mandate: "err" }[asv.verdict]) + '"><b>' + ({ pass: "Likely match.", review: "Flagged for review.", mandate: "Signing mandate not met." }[asv.verdict]) + "</b> " +
      ({ pass: "Every signature matches an authorised signatory and the mandate is satisfied.", review: (asv.stamp && asv.stamp.required && !asv.stamp.found && asv.sigs.every((x) => x.pass) ? "The signatures match, but the company chop (rubber stamp) was not found on the scan. A person must check the original." : "At least one signature scored below its pass score or could not be compared reliably. A low score does not prove forgery.") + (asv.highRisk ? " <b>High risk:</b> at least one signature is far below the pass score and is likely a forgery. Only an analyst can confirm it." : ""), mandate: "The signatures present do not satisfy the rule: " + esc(a.mandate.text) + "." }[asv.verdict]) + "</div>";
    const body = asv.sigs.map((s, i) => {
      const thr = s.thr || asv.threshold, hi = asv.highBelow || null, band = s.band || (s.pass ? "match" : "borderline"), p = party(c, s.matched.id), others = a.parties.filter((x) => x.id !== p.id).map((x) => esc(x.name.split(" ")[0]) + " <b>" + s.scores[x.id] + "</b>").join(" &nbsp; ");
      return '<section class="sheet"><header><h3>Signature ' + (i + 1) + (s.declared ? ", signed as " + esc(party(c, s.declared).name) : ", signatory not stated on the form") + '</h3><span class="st ' + (s.pass ? "pass" : band === "high" ? "fail" : "flag") + '">' + (s.pass ? "Likely match" : s.ambiguous ? "Ambiguous: matches another signatory" : s.poor ? "Cannot compare reliably" : band === "high" ? "High risk, likely forgery" : "Below pass score") + "</span></header>" +
        '<div class="cmp"><div class="card-sig"><div class="cap"><b>Submitted</b><span>Cropped from the scan</span></div><img alt="Submitted signature ' + (i + 1) + '" src="' + UI.sigSrc(s) + '"></div>' + gauge(s.matched.score, thr, hi, s.pass) +
        '<div class="card-sig"><div class="cap"><b>Specimen on file</b><span>' + esc(p.name) + ", " + esc(p.role) + (Sig.specimens(p).length > 1 ? ". Closest of " + Sig.specimens(p).length : "") + '</span></div><img alt="Specimen of ' + esc(p.name) + '" src="' + UI.refSrc(p, s.refIdx) + '"></div></div>' +
        '<div class="verdictline"><span>' + esc(s.notes[0] || "Within the range expected for the same signatory.") + '</span><span class="muted nowrap">Quality: ' + esc(s.grade) + "</span></div>" +
        (others ? '<div class="others"><span>Against the other signatories:</span><span>' + others + "</span></div>" : "") + "</section>";
    }).join("");
    const mand = '<section class="panel"><header>Mandate check</header><div class="body small">' + esc(a.mandate.text) + ". Required for this amount: <b>" + asv.required + "</b>. Verified distinct signatories: <b>" + asv.distinct + "</b>." +
      (asv.duplicate ? " The same person appears more than once and counts once." : "") + (asv.stamp && asv.stamp.required ? '<div class="st ' + (asv.stamp.found ? "pass" : "fail") + '" style="margin-top:8px">' + (asv.stamp.found ? "Company chop found on the scan" : "Company chop not found") + "</div>" + (asv.stamp.found ? '<div class="hint">ASV finds a stamp; it does not tell whether it is the right one. Check the original for high-value requests.</div>' : "") : "") + '<div class="hint">Run on ' + UI.dt(asv.ts) + ". Pass score " + asv.threshold + (asv.highBelow ? ", high risk below " + asv.highBelow : "") + ".</div></div></section>";
    return head + body + mand;
  }
  // A half-circle gauge: high risk, borderline and match zones, the pass line, and a needle that swings to the score.
  function gauge(score, thr, hi, pass) {
    const cx = 88, cy = 88, r = 70, pt = (v, rr) => { const t = Math.PI * (1 - v / 100); return [cx + rr * Math.cos(t), cy - rr * Math.sin(t)]; };
    const f = (n) => n.toFixed(1), arc = (a, b, col) => { const p0 = pt(a, r), p1 = pt(b, r); return '<path d="M' + f(p0[0]) + " " + f(p0[1]) + " A" + r + " " + r + " 0 0 1 " + f(p1[0]) + " " + f(p1[1]) + '" stroke="' + col + '" stroke-width="11" fill="none"/>'; };
    const t0 = pt(thr, r - 10), t1 = pt(thr, r + 10), tl = pt(thr, r + 20), z0 = pt(0, r), z1 = pt(100, r);
    const tone = pass ? "ok" : hi != null && score < hi ? "bad" : "mid";
    return '<div class="gauge" data-score="' + score + '" data-pass="Pass ' + thr + '"><svg viewBox="0 0 176 120" role="img" aria-label="Score ' + score + ' out of 100. Pass score ' + thr + '.">' +
      (hi != null ? arc(0, hi, "#e8a29d") + arc(hi, thr, "#efd08a") : arc(0, thr, "#efd08a")) + arc(thr, 100, "#8fd3bc") +
      '<line x1="' + f(t0[0]) + '" y1="' + f(t0[1]) + '" x2="' + f(t1[0]) + '" y2="' + f(t1[1]) + '" stroke="#0b1727" stroke-width="2.2"/>' +
      '<text class="lbl" x="' + f(tl[0]) + '" y="' + f(tl[1]) + '" text-anchor="middle">Pass ' + thr + '</text>' +
      '<text class="lbl" x="' + f(z0[0]) + '" y="' + f(cy + 14) + '" text-anchor="middle">0</text><text class="lbl" x="' + f(z1[0]) + '" y="' + f(cy + 14) + '" text-anchor="middle">100</text>' +
      '<g class="needle" data-at="' + score + '" style="transform:rotate(0deg)"><line x1="' + cx + '" y1="' + cy + '" x2="' + (cx - r + 16) + '" y2="' + cy + '" stroke="#0b1727" stroke-width="3" stroke-linecap="round"/></g><circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#0b1727"/><circle cx="' + cx + '" cy="' + cy + '" r="2.4" fill="#fff"/>' +
      '<text class="num ' + tone + '" x="' + cx + '" y="116" text-anchor="middle">' + score + "</text></svg><small>" + (pass ? "At or above the pass score" : hi != null && score < hi ? "In the high risk zone" : "Below the pass score") + "</small></div>";
  }
  function animate(root) { setTimeout(() => root.querySelectorAll(".needle[data-at]").forEach((n) => (n.style.transform = "rotate(" + (n.dataset.at * 1.8) + "deg)")), 80); }

  // Workbench: find signatures on the scan, let staff correct the selection, then run verification.
  function workbench(c, user, el, done) {
    const a = acct(c), W = { ext: null, sel: [], declared: {} };
    el.innerHTML = '<div class="panel"><header>Run signature verification</header><div class="body muted">Locating signatures on the scan...</div></div>';
    const img = new Image();
    img.onload = () => {
      const doc = document.createElement("canvas"); doc.width = img.naturalWidth; doc.height = img.naturalHeight; doc.getContext("2d").drawImage(img, 0, 0);
      W.doc = doc; W.ext = ASV.extractSignatures(doc); W.sel = W.ext.candidates.map((k, i) => (k.selected ? i : -1)).filter((i) => i >= 0); draw();
    };
    img.src = UI.docSrc(c);

    function overlay() {
      const o = document.createElement("canvas"), w = W.doc.width, h = W.doc.height; o.width = w; o.height = h; const x = o.getContext("2d"); x.drawImage(W.doc, 0, 0);
      const lw = Math.max(3, w / 260);
      W.ext.candidates.forEach((k, i) => {
        const on = W.sel.includes(i), b = k.box, pad = 6;
        x.lineWidth = lw; x.strokeStyle = on ? "#c44a05" : "#8a949b"; x.setLineDash(on ? [] : [lw * 3, lw * 2]); x.strokeRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2);
        x.fillStyle = on ? "#c44a05" : "#8a949b"; const r = lw * 5; x.fillRect(b.x - pad, b.y - pad - r * 1.5, r * 1.6, r * 1.5); x.fillStyle = "#fff"; x.font = "700 " + r + "px Arial"; x.fillText(String(i + 1), b.x - pad + r * 0.45, b.y - pad - r * 0.3);
      });
      return o;
    }
    function draw() {
      const cs = W.ext.candidates;
      const rows = cs.length ? cs.map((k, i) => '<div class="cand"><input type="checkbox" data-c="' + i + '" ' + (W.sel.includes(i) ? "checked" : "") + ' aria-label="Include signature ' + (i + 1) + '"><img alt="Detected signature ' + (i + 1) + '" src="' + k.canvas.toDataURL("image/png") + '">' +
        '<div><b>Signature ' + (i + 1) + '</b> <span class="st ' + (k.grade === "Good" ? "pass" : k.grade === "Fair" ? "flag" : "fail") + '">Capture ' + k.grade.toLowerCase() + '</span><div class="small muted">' + esc(k.notes.join(". ") || "Clear strokes, no overlap detected.") + "</div>" +
        '<label class="small muted" style="display:block;margin-top:4px">Signed as (from the printed name on the form)<select data-d="' + i + '"><option value="auto">Not stated, identify from the specimens</option>' + a.parties.map((p) => '<option value="' + p.id + '"' + (W.declared[i] === p.id ? " selected" : "") + ">" + esc(p.name) + "</option>").join("") + "</select></label></div></div>").join("")
        : '<div class="empty"><b>No clear signature found</b>Rescan at higher resolution without shadows. Signatures that overlap printed text cannot be compared reliably.</div>';
      el.innerHTML = '<section class="panel"><header>Run signature verification<span class="tools small muted">' + cs.length + " found on the scan</span></header><div class=\"body\"><div class=\"hint\" style=\"margin:0 0 10px\">Untick anything that is not a signature, such as a handwritten date or a stamp. If one signature was split into pieces, tick them and merge.</div>" +
        '<div class="docview" id="ov"></div></div><div class="body flush" style="border-top:1px solid var(--line)">' + rows + '</div><div class="body" style="border-top:1px solid var(--line);display:flex;gap:8px;justify-content:flex-end"><button class="btn" id="merge" ' + (W.sel.length > 1 ? "" : "disabled") + '>Merge selected into one signature</button><button class="btn primary" id="run" ' + (W.sel.length ? "" : "disabled") + ">Run verification</button></div></section>";
      el.querySelector("#ov").appendChild(overlay());
      el.querySelectorAll("[data-c]").forEach((cb) => cb.addEventListener("change", () => { const i = +cb.dataset.c; W.sel = cb.checked ? W.sel.concat(i).sort() : W.sel.filter((x) => x !== i); draw(); }));
      el.querySelectorAll("[data-d]").forEach((s) => s.addEventListener("change", () => (W.declared[+s.dataset.d] = s.value)));
      el.querySelector("#merge").onclick = () => {
        const picked = W.sel.map((i) => W.ext.candidates[i]), keep = W.ext.candidates.filter((_, i) => !W.sel.includes(i)), m = ASV.mergeCandidates(W.doc, picked);
        keep.push(m); keep.sort((x, y) => x.box.x - y.box.x); W.ext.candidates = keep; W.sel = [keep.indexOf(m)]; W.declared = {}; draw();
      };
      el.querySelector("#run").onclick = run;
    }
    function run() {
      const sigs = W.sel.map((i) => Object.assign({}, W.ext.candidates[i], { declared: W.declared[i] || "auto" }));
      const refs = {}; a.parties.forEach((p) => (refs[p.id] = Sig.has(p) ? Sig.refCanvases(p) : SigSynth.renderReference(p.seed)));
      const S = Cfg.settings, sc = S.score, mod = A.TYPES[c.type].module, chop = ASV.detectStamp(W.doc), needChop = Cfg.chopRequired(c.type);
      const r = ASVLogic.evaluate({ sigs, parties: a.parties, refs, required: c.required, threshold: (pid) => Cfg.passFor({ module: mod, myr: c.myr, accountNo: c.accountNo, partyId: pid }),
        stamp: needChop || chop.found ? { required: needChop, found: chop.found } : null, settings: { highRiskOn: sc.highRiskOn, highRiskBelow: sc.highRiskBelow, marginOn: sc.marginOn, marginPoints: sc.marginPoints, poorForcesReview: S.quality.poorForcesReview } });
      const asv = { ran: true, ts: new Date().toISOString(), threshold: r.threshold, highRisk: r.highRisk, highBelow: sc.highRiskOn ? sc.highRiskBelow : null, verdict: r.verdict, stamp: r.stamp ? Object.assign({ box: chop.box }, r.stamp) : null, required: r.required, distinct: r.distinct, mandateMet: r.mandateMet, duplicate: r.duplicate, reasons: r.reasons,
        sigs: r.rows.map((row, i) => ({ index: i, declared: sigs[i].declared === "auto" ? null : sigs[i].declared, matched: row.matched, scores: row.scores, pass: row.pass, poor: row.poor, thr: row.thr, band: row.band, ambiguous: row.ambiguous, refIdx: row.refIdx, grade: sigs[i].grade, notes: row.notes, img: UI.ink(sigs[i].canvas) })) };
      done(asv);
    }
  }
  window.CaseVerify = { sheets, animate, workbench };
})();
