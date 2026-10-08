/* Display helpers shared by every page. */
(function () {
  const A = window.APP, R = window.Rules, cache = {};
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p2 = (n) => String(n).padStart(2, "0");

  const UI = {
    esc,
    money(n, cur) { return (cur ? cur + " " : "") + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 }); },
    date(iso) { const d = new Date(iso); return p2(d.getDate()) + " " + MON[d.getMonth()] + " " + d.getFullYear(); },
    dt(iso) { const d = new Date(iso); return p2(d.getDate()) + " " + MON[d.getMonth()] + " " + d.getFullYear() + ", " + p2(d.getHours()) + ":" + p2(d.getMinutes()); },
    ago(iso) { const m = Math.round((Date.now() - new Date(iso)) / 60000); if (m < 1) return "just now"; if (m < 60) return m + " min ago"; const h = Math.round(m / 60); if (h < 48) return h + " h ago"; return Math.round(h / 24) + " d ago"; },
    status(st) { const s = R.STATUS[st]; return '<span class="st ' + s.tone + '">' + esc(s.label) + "</span>"; },
    level(c) { return c.level ? '<span class="lvl">L' + c.level + "</span>" : '<span class="faint">-</span>'; },
    typeName(t) { return A.TYPES[t].label; },
    // The module a case belongs to is decided by its instruction type.
    mod(type) { return A.MODULES[A.TYPES[type].module]; },
    modTag(type) { const m = UI.mod(type); return '<span class="mod" style="--m:' + m.accent[0] + '">' + esc(A.TYPES[type].label) + "</span>"; },
    post(user) { return user.post || A.ROLES[user.role].title; },
    // Only the modules this person works in. Used for every list, count and queue.
    visible(user, cases) { return cases.filter((c) => user.modules.includes(A.TYPES[c.type].module)); },
    // Time left against the service target. Closed cases show no clock.
    sla(c) {
      if (!R.STATUS[c.status].open) return '<span class="faint sla">Closed</span>';
      const left = Math.round((new Date(c.dueAt) - Date.now()) / 60000), a = Math.abs(left), t = a >= 120 ? Math.round(a / 60) + " h" : a + " min";
      if (left < 0) return '<span class="sla late">Overdue by ' + t + "</span>";
      return '<span class="sla ' + (left < 60 ? "soon" : "") + '">' + t + " left</span>";
    },
    // Work waiting for this person right now.
    queue(user, cases) {
      const R2 = A.ROLES[user.role];
      return UI.visible(user, cases).filter((c) => {
        if (user.role === "maker") return c.maker === user.id && ["registered", "reopened", "asv_pass", "asv_flag", "asv_mandate"].includes(c.status);
        if (user.role === "fraud") return ["fraud_review", "on_hold"].includes(c.status);
        if (R2.approveLevel) return c.status === "pending_approval" && R.can(user, c, "approve").ok;
        return false;
      });
    },
    docSrc(c) {
      if (c.doc) return c.doc;
      if (cache["d" + c.id]) return cache["d" + c.id];
      const t = A.TYPES[c.type], a = A.ACCOUNTS.find((x) => x.no === c.accountNo);
      const fields = [{ id: "account", label: "Account no." }, { id: "customer", label: "Customer" }, { id: "amount", label: "Amount" }, { id: "currency", label: "Currency" }].concat(t.fields.map((f) => ({ id: f[0], label: f[1] })));
      const vals = Object.assign({ account: c.accountNo, customer: c.customer, amount: Number(c.amount).toLocaleString("en-US"), currency: c.currency }, c.fields);
      const signers = (c.synth ? c.synth.signers : []).map((s) => {
        const p = a.parties.find((x) => x.id === s.party);
        if (Sig.has(p)) return { src: s.kind === "genuine" ? Sig.genuine(p, s.js) : Sig.forged(p, s.js) };
        return s.kind === "genuine" ? { seed: p.seed, jitter: 0.12, jseed: s.js } : { seed: p.seed + 500, jitter: 0.06, jseed: s.js };
      });
      return (cache["d" + c.id] = SigSynth.renderDocument({ formTitle: t.long, formCode: t.form, fields }, vals, signers).toDataURL("image/png"));
    },
    // Ink only: light paper becomes transparent so a signature sits cleanly on the specimen card.
    ink(canvas) {
      const c = document.createElement("canvas"); c.width = canvas.width; c.height = canvas.height; const x = c.getContext("2d"); x.drawImage(canvas, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
      for (let i = 0; i < p.length; i += 4) { const g = p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114, a = Math.max(0, Math.min(1, (225 - g) / 120)); if (p[i] > p[i + 2] + 50) { p[i + 3] = 0; continue; } p[i + 3] = Math.round(a * 255); p[i] = Math.min(p[i], 60); p[i + 1] = Math.min(p[i + 1], 70); p[i + 2] = Math.min(p[i + 2] + 10, 140); }
      x.putImageData(d, 0, 0);
      // trim to the ink, so a specimen is shown at a useful size
      let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) if (p[(y * c.width + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) return c.toDataURL("image/png");
      const pad = 8, t = document.createElement("canvas"); t.width = x1 - x0 + 1 + pad * 2; t.height = y1 - y0 + 1 + pad * 2; t.getContext("2d").drawImage(c, x0 - pad, y0 - pad, t.width, t.height, 0, 0, t.width, t.height);
      return t.toDataURL("image/png");
    },
    sigSrc(sig) {
      if (sig.img) return sig.img;
      const k = "s" + JSON.stringify(sig.synth); if (cache[k]) return cache[k];
      if (sig.synth.real) { const r = sig.synth.real, who = { sig: r.sig }; return (cache[k] = UI.ink(Sig.canvas(r.kind === "genuine" ? Sig.genuine(who, r.js) : Sig.forged(who, r.js)))); }
      const c = document.createElement("canvas"); c.width = 440; c.height = 220; const x = c.getContext("2d");
      x.fillStyle = "#1b2f7a"; SigSynth.drawSignature(x, sig.synth.seed, sig.synth.jitter, sig.synth.jseed, 40, 40, 1);
      return (cache[k] = c.toDataURL("image/png"));
    },
    // The specimen on file. idx picks one of the signatory's specimens (a signatory usually has three on the card).
    refSrc(party, idx) {
      const i = idx || 0, list = Sig.specimens(party);
      if (list.length) { const k = "r" + party.sig + i; return cache[k] || (cache[k] = UI.ink(Sig.canvas(list[i % list.length]))); }
      const k = "r" + party.seed; return cache[k] || (cache[k] = UI.ink(SigSynth.renderReference(party.seed)));
    },
    toast(msg, tone) {
      const t = document.createElement("div"); t.className = "toast " + (tone || ""); t.setAttribute("role", "status"); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 4200);
    },
    // Confirmation dialog. Resolves true or false.
    confirm(title, html, okLabel, danger) {
      return new Promise((res) => {
        const o = document.createElement("div"); o.className = "overlay";
        o.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><header>' + esc(title) + '</header><div class="body">' + html + '</div><footer><button class="btn" data-x="0">Cancel</button><button class="btn ' + (danger ? "danger" : "primary") + '" data-x="1">' + esc(okLabel || "Confirm") + "</button></footer></div>";
        o.addEventListener("click", (e) => { const b = e.target.closest("[data-x]"); if (b || e.target === o) { o.remove(); res(!!b && b.dataset.x === "1"); } });
        document.body.appendChild(o); o.querySelector('[data-x="1"]').focus();
      });
    },
    csv(rows) { return rows.map((r) => r.map((v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"').join(",")).join("\r\n"); },
  };
  window.UI = UI;
})();
