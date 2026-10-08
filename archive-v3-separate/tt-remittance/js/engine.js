/* ASV demo engine (runs fully in the browser).
   1) extractSignatures(): finds handwritten-looking ink blobs on a scanned document and crops them.
   2) compare(): scores similarity of two signature images, 0-100.
   This is a demonstration engine. In production the same two calls are served by the bank's
   validated signature-verification model; the interface does not change. */
(function () {
  function otsu(gray) {
    const h = new Array(256).fill(0);
    for (let i = 0; i < gray.length; i++) h[gray[i]]++;
    const total = gray.length; let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * h[i];
    let sB = 0, wB = 0, best = 0, thr = 128;
    for (let t = 0; t < 256; t++) {
      wB += h[t]; if (!wB) continue;
      const wF = total - wB; if (!wF) break;
      sB += t * h[t];
      const d = (sB / wB - (sum - sB) / wF);
      const v = wB * wF * d * d;
      if (v > best) { best = v; thr = t; }
    }
    return Math.min(thr, 190); // keep faint paper texture out of the ink mask
  }

  function toMask(canvas) {
    const w = canvas.width, h = canvas.height;
    const d = canvas.getContext("2d").getImageData(0, 0, w, h).data;
    const gray = new Uint8Array(w * h);
    for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
      gray[i] = (d[p] * 0.299 + d[p + 1] * 0.587 + d[p + 2] * 0.114) | 0;
      if (d[p + 3] < 128) gray[i] = 255; // transparent = paper
      else if (d[p] > 140 && d[p] > d[p + 1] + 55 && d[p] > d[p + 2] + 55) gray[i] = 255; // red stamp ink is not a signature
    }
    const thr = otsu(gray), ink = new Uint8Array(w * h);
    for (let i = 0; i < gray.length; i++) ink[i] = gray[i] < thr ? 1 : 0;
    return { ink, w, h };
  }

  function stripRulings(ink, w, h) {
    for (let y = 0; y < h; y++) {
      let run = 0;
      for (let x = 0; x <= w; x++) {
        if (x < w && ink[y * w + x]) run++;
        else { if (run >= w * 0.22) for (let k = x - run; k < x; k++) ink[y * w + k] = 0; run = 0; }
      }
    }
    for (let x = 0; x < w; x++) {
      let run = 0;
      for (let y = 0; y <= h; y++) {
        if (y < h && ink[y * w + x]) run++;
        else { if (run >= h * 0.22) for (let k = y - run; k < y; k++) ink[k * w + x] = 0; run = 0; }
      }
    }
  }

  function crop(src, b, sc, pad) {
    const x0 = Math.max(0, Math.floor(b.x0 / sc) - pad), y0 = Math.max(0, Math.floor(b.y0 / sc) - pad);
    const x1 = Math.min(src.width, Math.ceil((b.x1 + 1) / sc) + pad), y1 = Math.min(src.height, Math.ceil((b.y1 + 1) / sc) + pad);
    const c = document.createElement("canvas"); c.width = x1 - x0; c.height = y1 - y0;
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(src, x0, y0, c.width, c.height, 0, 0, c.width, c.height);
    return c;
  }

  function extractSignatures(src) {
    const sc = Math.min(1, 1000 / src.width);
    const W = Math.round(src.width * sc), H = Math.round(src.height * sc);
    const work = document.createElement("canvas"); work.width = W; work.height = H;
    const wx = work.getContext("2d"); wx.fillStyle = "#fff"; wx.fillRect(0, 0, W, H); wx.drawImage(src, 0, 0, W, H);
    const { ink } = toMask(work);
    stripRulings(ink, W, H);

    // coarse grid, bridge small horizontal gaps, label connected blobs
    const C = 5, gw = Math.ceil(W / C), gh = Math.ceil(H / C), cells = new Uint8Array(gw * gh);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ink[y * W + x]) cells[((y / C) | 0) * gw + ((x / C) | 0)]++;
    const act = cells.map((v) => (v >= 2 ? 1 : 0)), dil = new Uint8Array(gw * gh), R = 3;
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (act[y * gw + x])
      for (let k = -R; k <= R; k++) { const xx = x + k; if (xx >= 0 && xx < gw) dil[y * gw + xx] = 1; }
    const lab = new Int32Array(gw * gh).fill(-1), comps = [];
    for (let s = 0; s < gw * gh; s++) {
      if (!dil[s] || lab[s] >= 0) continue;
      const id = comps.length, q = [s]; lab[s] = id;
      const b = { x0: 1e9, y0: 1e9, x1: -1, y1: -1, ink: 0 };
      while (q.length) {
        const p = q.pop(), px = p % gw, py = (p / gw) | 0;
        if (act[p]) { b.x0 = Math.min(b.x0, px * C); b.y0 = Math.min(b.y0, py * C); b.x1 = Math.max(b.x1, px * C + C - 1); b.y1 = Math.max(b.y1, py * C + C - 1); b.ink += cells[p]; }
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = px + dx, ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
          const n = ny * gw + nx; if (dil[n] && lab[n] < 0) { lab[n] = id; q.push(n); }
        }
      }
      if (b.x1 >= 0) comps.push(b);
    }

    // signatures are taller than printed text lines; ignore tiny/very flat blobs and page frames
    const isCore = (b) => {
      const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1;
      return h >= 42 && w >= 40 && w / h < 9 && (w * h) / (W * H) < 0.4 && b.ink > 60;
    };
    let cand = comps.filter(isCore);
    // pull small nearby strokes (flourishes, dots, underlines) into the signature they belong to
    cand = cand.map((core) => {
      const m = Object.assign({}, core), PX = 25, PY = 25;
      comps.forEach((o) => {
        if (o === core || isCore(o)) return;
        if (o.x1 >= core.x0 - PX && o.x0 <= core.x1 + PX && o.y1 >= core.y0 - PY && o.y0 <= core.y1 + PY) {
          m.x0 = Math.min(m.x0, o.x0); m.y0 = Math.min(m.y0, o.y0); m.x1 = Math.max(m.x1, o.x1); m.y1 = Math.max(m.y1, o.y1); m.ink += o.ink;
        }
      });
      return m;
    });
    // merge blobs of one signature that were split (same column, small vertical gap)
    let merged = true;
    while (merged) {
      merged = false;
      outer: for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) {
        const a = cand[i], b = cand[j];
        const ov = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), gap = Math.max(a.y0, b.y0) - Math.min(a.y1, b.y1);
        if (ov > 0.3 * Math.min(a.x1 - a.x0, b.x1 - b.x0) && gap < 22) {
          cand[i] = { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1), ink: a.ink + b.ink };
          cand.splice(j, 1); merged = true; break outer;
        }
      }
    }
    cand.sort((a, b) => b.ink - a.ink);
    cand = cand.slice(0, 4);
    const maxInk = cand.length ? cand[0].ink : 1;
    const out = cand.map((b, i) => {
      const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1, density = b.ink * 25 / (w * h);
      const notes = []; let q = 100;
      if (h < 40) { q -= 25; notes.push("Signature is small — scan at a higher resolution"); }
      if (density < 0.015 * 25 / 25 && density < 0.04) { q -= 25; notes.push("Very faint strokes"); }
      if (b.x0 < 6 || b.y0 < 6 || b.x1 > W - 7 || b.y1 > H - 7) { q -= 30; notes.push("Signature touches the page edge — may be cut off"); }
      cand.forEach((o, k) => { if (k !== i && !(o.x1 < b.x0 || o.x0 > b.x1 || o.y1 < b.y0 || o.y0 > b.y1)) { q -= 35; notes.push("Overlaps other writing"); } });
      return { box: { x: b.x0 / sc, y: b.y0 / sc, w: w / sc, h: h / sc }, canvas: crop(src, b, sc, 10), quality: Math.max(5, q),
        grade: q >= 75 ? "Good" : q >= 50 ? "Fair" : "Poor", notes, selected: b.ink >= 0.35 * maxInk && i < 3 };
    });
    out.sort((a, b) => a.box.x - b.box.x);
    return { candidates: out, docW: src.width, docH: src.height };
  }

  // ---- comparison -------------------------------------------------------
  const GW = 96, GH = 48, TUNE = { blur: 3, exp: 1, ar: 0.25 };
  function normalised(canvas) {
    const { ink, w, h } = toMask(canvas);
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (ink[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return { grid: new Float32Array(GW * GH), ratio: 1, empty: true };
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, s = Math.min((GW - 8) / bw, (GH - 6) / bh);
    const ox = (GW - bw * s) / 2, oy = (GH - bh * s) / 2, g = new Float32Array(GW * GH), n = new Float32Array(GW * GH);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const tx = Math.min(GW - 1, Math.max(0, Math.floor(ox + (x - x0) * s))), ty = Math.min(GH - 1, Math.max(0, Math.floor(oy + (y - y0) * s)));
      n[ty * GW + tx]++; if (ink[y * w + x]) g[ty * GW + tx]++;
    }
    for (let i = 0; i < g.length; i++) g[i] = n[i] ? g[i] / n[i] : 0;
    let gg = g; for (let k = 0; k < TUNE.blur; k++) gg = blur(gg);
    return { grid: gg, ratio: bw / bh };
  }
  function blur(a) {
    const o = new Float32Array(a.length);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      let s = 0, c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < GW && yy < GH) { s += a[yy * GW + xx]; c++; } }
      o[y * GW + x] = s / c;
    }
    return o;
  }
  function compare(a, b) {
    const A = normalised(a), B = normalised(b);
    if (A.empty || B.empty) return 0;
    let ma = 0, mb = 0; const n = A.grid.length;
    for (let i = 0; i < n; i++) { ma += A.grid[i]; mb += B.grid[i]; }
    ma /= n; mb /= n;
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < n; i++) { const x = A.grid[i] - ma, y = B.grid[i] - mb; num += x * y; da += x * x; db += y * y; }
    const ncc = num / Math.sqrt(da * db || 1);
    const ar = Math.min(A.ratio, B.ratio) / Math.max(A.ratio, B.ratio);
    const s = Math.max(0, ncc) * (1 - TUNE.ar + TUNE.ar * ar);
    return Math.round(100 * Math.pow(Math.min(1, s), TUNE.exp));
  }

  // Join several detected pieces (box = {x,y,w,h} in source pixels) into one signature crop.
  function mergeCandidates(src, list) {
    const x0 = Math.min(...list.map((c) => c.box.x)), y0 = Math.min(...list.map((c) => c.box.y));
    const x1 = Math.max(...list.map((c) => c.box.x + c.box.w)), y1 = Math.max(...list.map((c) => c.box.y + c.box.h));
    const grade = list.some((c) => c.grade === "Poor") ? "Poor" : "Good";
    return { box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, canvas: crop(src, { x0, y0, x1, y1 }, 1, 10), quality: 80, grade, notes: ["Pieces merged by staff"], selected: true };
  }

  window.ASV = { extractSignatures, compare, mergeCandidates, TUNE };
})();
