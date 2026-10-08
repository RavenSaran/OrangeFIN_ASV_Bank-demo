/* Synthetic signatures and sample scanned documents, so the demo works without uploads.
   Everything is drawn on canvas and then goes through the same extraction/comparison
   pipeline as a user-uploaded scan. */
(function () {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Build the control points of a signature from a seed (the "identity").
  // Each seed gets a different number of humps, loop, crossbar and tail so people look distinct.
  function shape(seed) {
    const r = mulberry32(seed * 7919 + 13);
    const n = 4 + Math.floor(r() * 5), width = 220 + r() * 140, x0 = 30 + r() * 30, pts = [];
    let x = x0;
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? -1 : 1, amp = 14 + r() * 46;
      pts.push([x, 72 + dir * amp * (0.6 + r() * 0.8)]);
      x += (width / n) * (0.6 + r() * 0.8);
    }
    const hasLoop = r() < 0.7, hasBar = r() < 0.6, tail = r();
    return {
      pts,
      loop: hasLoop ? { x: x0 - 4 + r() * 12, y: 56 + r() * 36, rx: 8 + r() * 22, ry: 14 + r() * 30, rot: (r() - 0.5) * 1.2 } : null,
      bar: hasBar ? { x0: x0 - 10 + r() * 30, x1: x0 + width * (0.5 + r() * 0.5), y: 40 + r() * 70, slant: (r() - 0.5) * 50 } : null,
      tail: tail < 0.45 ? { kind: "under", y: 112 + r() * 14, x0: x0 + r() * 60, x1: x0 + width * (0.7 + r() * 0.4), bend: (r() - 0.5) * 40 }
        : tail < 0.8 ? { kind: "rise", dy: 30 + r() * 40 } : null,
    };
  }

  // jitter = natural variation between two genuine signings; jseed picks the variation.
  function drawSignature(ctx, seed, jitter, jseed, ox, oy, scale, color) {
    const s = shape(seed), jr = mulberry32((jseed || 1) * 104729 + seed);
    const j = (amp) => (jr() - 0.5) * 2 * jitter * amp;
    const rot = j(0.12), sc = 1 + j(0.14);
    ctx.save();
    ctx.translate(ox + 180 * scale, oy + 70 * scale);
    ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.translate(-180 * scale, -70 * scale);
    ctx.scale(scale, scale);
    ctx.strokeStyle = color || "#1b2f7a"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.lineWidth = 2.6;
    if (s.loop) { ctx.beginPath(); ctx.ellipse(s.loop.x + j(10), s.loop.y + j(10), s.loop.rx, s.loop.ry, s.loop.rot + j(0.4), 0.3, Math.PI * 2.2); ctx.stroke(); }
    const p = s.pts.map((q) => [q[0] + j(26), q[1] + j(26)]);
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
      ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my);
    }
    const last = p[p.length - 1];
    ctx.lineTo(last[0], last[1]);
    if (s.tail && s.tail.kind === "rise") ctx.quadraticCurveTo(last[0] + 18, last[1] - s.tail.dy * 0.2, last[0] + 34 + j(8), last[1] - s.tail.dy + j(8));
    ctx.stroke();
    ctx.lineWidth = 2;
    if (s.bar) { ctx.beginPath(); ctx.moveTo(s.bar.x0 + j(14), s.bar.y + j(8)); ctx.lineTo(s.bar.x1 + j(14), s.bar.y + s.bar.slant + j(8)); ctx.stroke(); }
    if (s.tail && s.tail.kind === "under") {
      const t = s.tail;
      ctx.beginPath(); ctx.moveTo(t.x0 + j(14), t.y + j(8));
      ctx.quadraticCurveTo((t.x0 + t.x1) / 2, t.y + t.bend + j(10), t.x1 + j(14), t.y + j(8)); ctx.stroke();
    }
    ctx.restore();
  }

  // The specimen signature held on the bank's record.
  function renderReference(seed) {
    const c = document.createElement("canvas"); c.width = 440; c.height = 220;
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 440, 220);
    x.fillStyle = "#1b2f7a"; drawSignature(x, seed, 0, 1, 40, 40, 1);
    return c;
  }

  // spec: {seed, jitter, jseed}
  function renderDocument(cfg, values, signers) {
    const W = 900, H = 640, c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.fillStyle = "#fbfaf6"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#14213d"; x.font = "700 22px Arial"; x.fillText(cfg.formTitle, 50, 62);
    x.fillStyle = "#6b7280"; x.font = "13px Arial"; x.fillText("OrangeFIN ASV Bank  |  Branch Operations Copy  |  Form " + cfg.formCode, 50, 86);
    x.fillStyle = "#d1d5db"; x.fillRect(50, 98, 800, 1.5);
    x.fillStyle = "#14213d"; x.font = "15px Arial";
    let y = 136;
    cfg.fields.slice(0, 8).forEach((f, i) => {
      const colx = i % 2 ? 470 : 50;
      if (i % 2 === 0 && i > 0) y += 38;
      x.fillStyle = "#6b7280"; x.font = "12px Arial"; x.fillText(f.label.toUpperCase(), colx, y);
      x.fillStyle = "#14213d"; x.font = "16px Arial"; x.fillText(String(values[f.id] || "-").slice(0, 34), colx, y + 18);
    });
    y += 66;
    x.fillStyle = "#4b5563"; x.font = "13px Arial";
    const decl = "I/We hereby authorise the Bank to act on the instruction above and confirm that the details are correct.";
    x.fillText(decl, 50, y); x.fillText("This instruction is subject to the Bank's terms and conditions and account mandate.", 50, y + 20);
    const n = Math.max(1, signers.length), slot = 800 / Math.max(2, n);
    signers.forEach((s, i) => {
      const sx = 50 + i * slot;
      if (s.seed != null) {
        x.fillStyle = "#1b2f7a";
        drawSignature(x, s.seed, s.jitter, s.jseed, sx + 10, 430, 1);
      }
      x.fillStyle = "#374151"; x.fillRect(sx + 4, 590, slot - 40, 1.2);
      x.fillStyle = "#6b7280"; x.font = "12px Arial";
      x.fillText("Authorised signatory " + (i + 1) + (n > 1 ? " of " + n : ""), sx + 4, 608);
    });
    return c;
  }

  window.SigSynth = { renderReference, renderDocument, drawSignature };
})();
