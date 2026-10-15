/* Experience layer, part 2: the signature viewer (zoom, side by side, overlay) and sortable, exportable case tables. */
(function () {
  const esc = UI.esc;

  // ---- signature viewer --------------------------------------------------
  // A click on a signature opens it large. On a verification sheet the submitted signature and the specimen can be laid over each other.
  function openViewer(img) {
    const sheet = img.closest(".sheet"), pair = sheet ? [].slice.call(sheet.querySelectorAll(".card-sig img")) : [];
    const compare = pair.length === 2, title = sheet ? sheet.querySelector("h3").textContent : (img.alt || "Signature");
    const gg = sheet && sheet.querySelector(".gauge"), status = sheet && sheet.querySelector("header .st") ? sheet.querySelector("header .st").textContent : "", score = gg ? gg.dataset.score : "";
    const pass = gg ? gg.dataset.pass : "";
    const o = document.createElement("div"); o.className = "sigv-o"; const prev = document.activeElement;
    const st = { mode: compare ? "side" : "one", zoom: 1.5, op: 0.5 };
    o.innerHTML = '<div class="sigv" role="dialog" aria-modal="true" aria-label="Signature viewer"><header><span>' + esc(title) + (status ? ' <span class="muted" style="font-weight:400">' + esc(status) + "</span>" : "") + '</span><button class="btn" type="button" data-x>Close</button></header>' +
      '<div class="bar">' + (compare ? '<span class="seg" role="group" aria-label="View"><button type="button" data-m="side" aria-pressed="true">Side by side</button><button type="button" data-m="over" aria-pressed="false">Overlay</button></span>' : "") +
      '<label>Zoom <input type="range" min="1" max="4" step="0.25" value="1.5" data-z aria-label="Zoom"> <span data-zv>150%</span></label>' +
      (compare ? '<label data-opl hidden>Specimen strength <input type="range" min="0" max="1" step="0.05" value="0.5" data-o aria-label="Blend"></label><span class="legend" data-leg hidden><i style="background:#2a56c6"></i>Submitted<i style="background:#c0392b"></i>Specimen</span>' : "") + '<span class="muted">Scroll the stage to move around. Esc closes.</span></div>' +
      '<div class="stage" id="stg"></div><footer>' + (score ? "Score " + esc(score) + (pass ? ", " + esc(pass) : "") + ". " : "") + "A low score alone does not prove forgery.</footer></div>";
    document.body.appendChild(o);
    const stage = o.querySelector("#stg"), W = img.closest(".docview") ? 700 : 420;
    const draw = () => {
      const w = Math.round(W * st.zoom);
      if (st.mode === "one") stage.innerHTML = '<div class="pane"><img src="' + img.src + '" style="width:' + w + 'px" alt="' + esc(img.alt) + '"></div>';
      else if (st.mode === "side") stage.innerHTML = '<div class="pane"><h5>Submitted</h5><img src="' + pair[0].src + '" style="width:' + w + 'px" alt="Submitted signature"></div><div class="pane"><h5>Specimen on file</h5><img src="' + pair[1].src + '" style="width:' + w + 'px" alt="Specimen signature"></div>';
      else { const h = Math.round(w * 0.55), fit = "width:" + w + "px;height:" + h + "px;object-fit:contain"; stage.innerHTML = '<div class="pane"><div class="ov" style="width:' + w + "px;height:" + h + 'px"><img class="a" src="' + pair[0].src + '" style="' + fit + '" alt="Submitted signature"><img class="b" src="' + pair[1].src + '" style="' + fit + ";opacity:" + st.op + '" alt="Specimen signature"></div></div>'; }
      o.querySelector("[data-zv]").textContent = Math.round(st.zoom * 100) + "%";
      if (compare) { o.querySelector("[data-opl]").hidden = st.mode !== "over"; o.querySelector("[data-leg]").hidden = st.mode !== "over"; o.querySelectorAll("[data-m]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === st.mode))); }
    };
    const close = () => { o.remove(); if (prev && prev.focus) prev.focus(); };
    o.addEventListener("click", (e) => { if (e.target === o || e.target.closest("[data-x]")) close(); const m = e.target.closest("[data-m]"); if (m) { st.mode = m.dataset.m; draw(); } });
    o.addEventListener("input", (e) => { if (e.target.matches("[data-z]")) st.zoom = +e.target.value; if (e.target.matches("[data-o]")) st.op = +e.target.value; draw(); });
    o.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); close(); } });
    o.querySelector("[data-x]").focus(); draw();
  }
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".card-sig img, .cand img, .party img, .docview img");
    if (img && img.src && !img.closest(".sigv")) openViewer(img);
  });
  // make them look and behave clickable, and reachable by keyboard
  // the panel that holds a person's next action stays in view while they read a long case
  const pin = (root) => root.querySelectorAll(".panel > header").forEach((h) => {
    const p = h.parentElement, col = p.parentElement;
    if (/^Your next step/.test(h.textContent) && !p.classList.contains("stick") && col && col.parentElement && col.parentElement.classList.contains("cols")) { p.classList.add("stick"); col.classList.add("stretch"); }
  });
  const mark = (root) => {
    pin(root);
    root.querySelectorAll(".card-sig img, .cand img, .party img, .docview img").forEach((i) => { if (!i.classList.contains("zoomable")) { i.classList.add("zoomable"); i.tabIndex = 0; i.title = "Click to enlarge"; i.addEventListener("keydown", (e) => { if (e.key === "Enter") openViewer(i); }); } });
  };

  // ---- sortable, exportable tables ---------------------------------------
  const num = (t) => { const n = parseFloat(String(t).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? null : n; };
  function enhance(wrap, user) {
    const tbl = wrap.querySelector("table.grid"); if (!tbl || wrap.dataset.ux) return; wrap.dataset.ux = "1";
    const body = tbl.tBodies[0], rows = () => [].slice.call(body.rows);
    tbl.classList.add("sortable");
    const ths = [].slice.call(tbl.tHead.rows[0].cells);
    const bar = document.createElement("div"); bar.className = "tbar";
    bar.innerHTML = '<span>' + rows().length + " row" + (rows().length === 1 ? "" : "s") + '. Click a heading to sort.</span><span style="display:flex;gap:6px"><button type="button" class="btn" data-dens>' + (document.body.classList.contains("compact") ? "Comfortable rows" : "Compact rows") + '</button><button type="button" class="btn" data-csv>Export CSV</button></span>';
    wrap.insertBefore(bar, tbl);
    ths.forEach((th, i) => { th.dataset.sortable = "1"; th.tabIndex = 0; th.setAttribute("role", "columnheader"); });
    const sortBy = (i) => {
      const th = ths[i], dir = th.getAttribute("aria-sort") === "ascending" ? -1 : 1;
      ths.forEach((x) => x.removeAttribute("aria-sort")); th.setAttribute("aria-sort", dir === 1 ? "ascending" : "descending");
      const val = (tr) => { const c = tr.cells[i]; return c.dataset.s != null ? +c.dataset.s : c.textContent.trim(); };
      const sorted = rows().map((r, k) => ({ r, k, v: val(r) })).sort((a, b) => {
        const an = typeof a.v === "number" ? a.v : num(a.v), bn = typeof b.v === "number" ? b.v : num(b.v);
        const c = an != null && bn != null && !/[a-z]{3}/i.test(String(a.v)) ? an - bn : String(a.v).localeCompare(String(b.v), undefined, { numeric: true, sensitivity: "base" });
        return (c || a.k - b.k) * dir;
      });
      sorted.forEach((x) => body.appendChild(x.r));
    };
    tbl.tHead.addEventListener("click", (e) => { const th = e.target.closest("th"); if (th) sortBy(ths.indexOf(th)); });
    tbl.tHead.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { const th = e.target.closest("th"); if (th) { e.preventDefault(); sortBy(ths.indexOf(th)); } } });
    bar.addEventListener("click", (e) => {
      if (e.target.closest("[data-dens]")) { const c = document.body.classList.toggle("compact"); try { localStorage.setItem("orangefin_asv_ux_compact", c ? "1" : "0"); } catch (x) { /* ignore */ } e.target.textContent = c ? "Comfortable rows" : "Compact rows"; }
      if (e.target.closest("[data-csv]")) {
        const clean = (c) => c.textContent.replace(/\s+/g, " ").trim(), out = [ths.map(clean)].concat(rows().map((r) => [].map.call(r.cells, clean)));
        const blob = new Blob(["﻿" + UI.csv(out)], { type: "text/csv" }), a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "orangefin-cases-" + new Date().toISOString().slice(0, 10) + ".csv"; document.body.appendChild(a); a.click(); a.remove();
        DB.log(user, "auth", "Exported a case list", "", rows().length + " rows");
        UI.toast("Exported " + rows().length + " rows.", "ok");
      }
    });
  }
  const UXTables = window.UXTables = {
    watch(user) {
      try { if (localStorage.getItem("orangefin_asv_ux_compact") === "1") document.body.classList.add("compact"); } catch (e) { /* ignore */ }
      const view = document.getElementById("view"); if (!view) return;
      const run = () => { view.querySelectorAll(".tablewrap[data-ux-t]").forEach((w) => enhance(w, user)); mark(view); };
      run(); new MutationObserver(run).observe(view, { childList: true, subtree: true });
    },
  };
})();
