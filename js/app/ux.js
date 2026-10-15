/* Experience layer, part 1: the command palette (Ctrl+K), the notification bell, keyboard shortcuts, drag and drop for scans,
   the "next case" shortcut and the role guide. Mounted once by Shell.init after the page frame exists. Nothing here changes a case. */
(function () {
  const A = window.APP, esc = UI.esc;
  const key = (k) => "orangefin_asv_ux_" + k;
  const read = (k, d) => { try { const v = localStorage.getItem(key(k)); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(key(k), JSON.stringify(v)); } catch (e) { /* storage can be blocked */ } };
  const typing = (t) => t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);

  // The most urgent case waiting for this person (earliest due first).
  function worklist(user) { return UI.workFor(user, UI.visible(user, DB.cases())).list.slice().sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)); }
  const dueText = (c) => { const m = Math.round((new Date(c.dueAt) - Date.now()) / 60000); return m < 0 ? "Overdue by " + (-m >= 120 ? Math.round(-m / 60) + " h" : -m + " min") : m >= 120 ? Math.round(m / 60) + " h left" : m + " min left"; };

  // ---- command palette ---------------------------------------------------
  function buildItems(user) {
    const out = [], nav = [];
    document.querySelectorAll(".side a[href]").forEach((a) => { const c = a.cloneNode(true); c.querySelectorAll(".n").forEach((n) => n.remove()); nav.push({ g: "Go to", t: c.textContent.trim(), href: a.getAttribute("href") }); });
    const next = worklist(user)[0];
    if (next) out.push({ g: "Actions", t: "Start the next case", s: next.id + ", " + next.customer, e: dueText(next), href: "case.html?id=" + encodeURIComponent(next.id), always: true });
    if (user.role === "maker") out.push({ g: "Actions", t: "Register an instruction", s: "Start a new case", href: "new-case.html?m=" + user.modules[0], always: true });
    out.push({ g: "Actions", t: "Keyboard shortcuts", s: "Press ? anywhere", run: () => UX.help(), always: true });
    out.push({ g: "Actions", t: "Sign out", run: () => Auth.logout(), always: false });
    nav.forEach((n) => out.push(n));
    UI.visible(user, DB.cases()).forEach((c) => out.push({ g: "Cases", t: c.id, s: c.customer + ", " + UI.money(c.amount, c.currency), e: Rules.STATUS[c.status].label, href: "case.html?id=" + encodeURIComponent(c.id), hay: [c.id, c.customer, c.accountNo, c.payee || "", Rules.STATUS[c.status].label, (c.fields && (c.fields.beneficiary || c.fields.payee)) || ""].join(" ") }));
    A.ACCOUNTS.forEach((a) => out.push({ g: "Accounts", t: a.name, s: a.no, href: "specimens.html?acct=" + encodeURIComponent(a.no), hay: a.name + " " + a.no }));
    return out;
  }
  function openPalette(user) {
    if (document.querySelector(".cmdk-o")) return;
    const all = buildItems(user), prev = document.activeElement;
    const o = document.createElement("div"); o.className = "cmdk-o";
    o.innerHTML = '<div class="cmdk" role="dialog" aria-modal="true" aria-label="Search and jump"><input id="ck" type="text" placeholder="Search a case, customer, account or page" autocomplete="off" aria-controls="cl" aria-label="Search"><ul id="cl" role="listbox"></ul><div class="foot"><span><span class="kbd">↑</span> <span class="kbd">↓</span> move</span><span><span class="kbd">Enter</span> open</span><span><span class="kbd">Esc</span> close</span></div></div>';
    document.body.appendChild(o);
    const input = o.querySelector("#ck"), list = o.querySelector("#cl"); let shown = [], sel = 0;
    const render = () => {
      const q = input.value.trim().toLowerCase(), terms = q.split(/\s+/).filter(Boolean);
      let rows = !terms.length ? all.filter((i) => i.always).concat(all.filter((i) => i.g === "Go to").slice(0, 6)).concat(worklist(user).slice(0, 4).map((c) => ({ g: "Waiting for you", t: c.id, s: c.customer, e: dueText(c), href: "case.html?id=" + encodeURIComponent(c.id) })))
        : all.filter((i) => terms.every((w) => (i.hay || i.t + " " + (i.s || "")).toLowerCase().includes(w))).sort((a, b) => ((a.t.toLowerCase().startsWith(terms[0]) ? 0 : 1) - (b.t.toLowerCase().startsWith(terms[0]) ? 0 : 1))).slice(0, 12);
      shown = rows; sel = Math.min(sel, Math.max(0, rows.length - 1));
      let g = "", html = "";
      rows.forEach((r, i) => { if (r.g !== g) { g = r.g; html += '<li class="g" role="presentation">' + esc(g) + "</li>"; } html += '<li class="o" role="option" id="o' + i + '" data-i="' + i + '" aria-selected="' + (i === sel) + '"><span><b>' + esc(r.t) + "</b>" + (r.s ? " <small>" + esc(r.s) + "</small>" : "") + "</span>" + (r.e ? "<em>" + esc(r.e) + "</em>" : "") + "</li>"; });
      list.innerHTML = html || '<li class="none">Nothing matches "' + esc(input.value) + '". Try a case number, a customer name or an account number.</li>';
      input.setAttribute("aria-activedescendant", rows.length ? "o" + sel : "");
    };
    const close = () => { o.remove(); if (prev && prev.focus) prev.focus(); };
    const go = (r) => { if (!r) return; o.remove(); if (r.run) r.run(); else location.href = r.href; };
    input.addEventListener("input", () => { sel = 0; render(); });
    o.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); render(); list.querySelector('[aria-selected="true"]') && list.querySelector('[aria-selected="true"]').scrollIntoView({ block: "nearest" }); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); render(); list.querySelector('[aria-selected="true"]') && list.querySelector('[aria-selected="true"]').scrollIntoView({ block: "nearest" }); }
      else if (e.key === "Enter") { e.preventDefault(); go(shown[sel]); }
    });
    list.addEventListener("click", (e) => { const li = e.target.closest("li.o"); if (li) go(shown[+li.dataset.i]); });
    o.addEventListener("mousedown", (e) => { if (e.target === o) close(); });
    render(); input.focus();
  }

  // ---- notification bell -------------------------------------------------
  function mountBell(user) {
    const host = document.querySelector(".top-r"); if (!host || host.querySelector(".bellwrap")) return;
    const items = worklist(user).filter((c) => new Date(c.dueAt) - Date.now() < 3600e3), total = worklist(user).length;
    const w = document.createElement("div"); w.className = "bellwrap";
    w.innerHTML = '<button type="button" class="bell" aria-haspopup="true" aria-expanded="false" aria-label="Notifications: ' + items.length + ' overdue or due within an hour" title="Notifications">\u{1F514}' + (items.length ? '<span class="dot">' + items.length + "</span>" : "") + "</button>";
    host.insertBefore(w, host.querySelector(".sess"));
    const btn = w.querySelector("button"); let panel = null;
    const shut = () => { if (panel) { panel.remove(); panel = null; btn.setAttribute("aria-expanded", "false"); } };
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); if (panel) return shut();
      panel = document.createElement("div"); panel.className = "bellpanel";
      panel.innerHTML = "<header><span>Needs attention</span><span class=\"muted small\">" + total + " waiting in all</span></header>" +
        (items.length ? items.slice(0, 6).map((c) => '<a class="it" href="case.html?id=' + encodeURIComponent(c.id) + '"><b>' + esc(c.id) + " " + esc(UI.nextAction(user, c)) + "</b><span>" + esc(c.customer) + ", " + esc(UI.money(c.amount, c.currency)) + ' <span class="' + (new Date(c.dueAt) < Date.now() ? "late" : "") + '">' + esc(dueText(c)) + "</span></span></a>").join("")
          : '<div class="none">' + (total ? "Nothing is overdue or due within the hour." : "You are all caught up.") + "</div>") +
        '<footer><a href="work.html">Open ' + (user.role === "auditor" ? "what needs attention" : "my work") + "</a></footer>";
      w.appendChild(panel); btn.setAttribute("aria-expanded", "true");
    });
    document.addEventListener("click", (e) => { if (panel && !w.contains(e.target)) shut(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") shut(); });
  }

  // ---- role guide on Home ------------------------------------------------
  const GUIDE = {
    maker: { t: "How your day works", s: [["Register", "Fill in the instruction and attach the customer's scan. Drag a file onto the page, or use Generate to practise."], ["Run verification", "ASV finds the signatures on the scan and compares each with the specimens on file."], ["Submit or refer", "A likely match goes to approval. A flag goes to the analyst. Too few signatures go back to the customer."]], tip: "Press Ctrl K to jump to any case, or N to open the most urgent one." },
    fraud: { t: "How your review works", s: [["Open a flagged case", "Click a signature to zoom in or lay it over the specimen. A low score does not prove forgery."], ["Call the customer", "Record the callback reference. Large amounts need a second analyst."], ["Decide", "Clear it for approval, or confirm a forgery and reject it. You cannot approve what you cleared."]], tip: "Overdue cases are in the bell at the top right. Press N to open the most urgent one." },
    approver: { t: "How your approvals work", s: [["Open a pending case", "The mandate, the ASV scores and any analyst notes are on one page."], ["Check the signatures", "Click a signature to compare it with the specimen. Cases cleared after a flag need at least Level 2."], ["Approve, reject or return", "Rejecting or returning needs a written note. You cannot approve a case you registered or cleared."]], tip: "A case above your level cannot be approved by you. Escalate it to the next level." },
    auditor: { t: "How your audit works", s: [["See what needs attention", "Open cases that are overdue or were not a clean match."], ["Read the trail", "Every action is recorded with who, what and when. Filter by module or event."], ["Export", "Use Export CSV on any list or on the audit trail. You cannot change any case."]], tip: "Press Ctrl K to search any case or account." },
  };
  const UX = window.UX = {
    next: (user) => worklist(user)[0] || null, dueText,
    guide(user) {
      const g = GUIDE[user.role === "checker" || user.role === "manager" || user.role === "head" ? "approver" : user.role];
      if (!g || read("guide_" + user.id, false)) return "";
      return '<section class="guide" id="guide"><header><span>' + esc(g.t) + '</span><button class="btn" type="button" data-guide="hide">Got it, hide this</button></header><ol>' + g.s.map((s) => "<li><b>" + esc(s[0]) + "</b><span>" + esc(s[1]) + "</span></li>").join("") + '</ol><div class="tip"><b>Tip:</b> ' + esc(g.tip) + "</div></section>";
    },
    help() {
      if (document.querySelector(".cmdk-o")) return;
      const o = document.createElement("div"); o.className = "cmdk-o";
      const rows = [["Ctrl K or /", "Search cases, accounts and pages"], ["N", "Open the most urgent case waiting for you"], ["G then H", "Home"], ["G then W", "My work"], ["G then C", "All cases"], ["G then S", "Specimen register"], ["?", "This list"], ["Esc", "Close a window"]];
      o.innerHTML = '<div class="cmdk" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts"><div style="padding:14px 16px;font-weight:600;border-bottom:1px solid #c9cfcc">Keyboard shortcuts</div><div class="helpgrid" style="padding:14px 16px">' + rows.map((r) => '<span>' + r[0].split(/ (?=then|or)/).map((k) => '<span class="kbd">' + esc(k) + "</span>").join(" ") + "</span><span>" + esc(r[1]) + "</span>").join("") + "</div></div>";
      document.body.appendChild(o); const close = () => o.remove();
      o.addEventListener("mousedown", (e) => { if (e.target === o) close(); }); o.setAttribute("tabindex", "-1"); o.focus(); o.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    },
    mount(user) {
      if (document.body.dataset.ux) return; document.body.dataset.ux = "1";
      const skip = document.createElement("a"); skip.className = "skiplink"; skip.href = "#view"; skip.textContent = "Skip to content"; document.body.insertBefore(skip, document.body.firstChild);
      const view = document.getElementById("view"); if (view) view.setAttribute("tabindex", "-1");
      const gq = document.getElementById("gq");
      if (gq) { gq.placeholder = "Search cases, accounts, pages"; gq.addEventListener("focus", () => { gq.blur(); openPalette(user); }); const k = document.createElement("span"); k.className = "kbd"; k.textContent = "Ctrl K"; gq.parentNode.appendChild(k); }
      mountBell(user);
      let g = 0;
      document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); return openPalette(user); }
        if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey || document.querySelector(".cmdk-o, .overlay, .sigv-o")) return;
        const k = e.key.toLowerCase();
        if (k === "/") { e.preventDefault(); return openPalette(user); }
        if (e.key === "?") return UX.help();
        if (g && Date.now() - g < 1200) { g = 0; const to = { h: "dashboard.html", w: "work.html", c: "cases.html", s: "specimens.html" }[k]; if (to) location.href = to; return; }
        if (k === "g") { g = Date.now(); return; }
        if (k === "n") { const c = UX.next(user); if (c) location.href = "case.html?id=" + encodeURIComponent(c.id); }
      });
      document.addEventListener("click", (e) => { const b = e.target.closest("[data-guide=hide]"); if (b) { write("guide_" + user.id, true); const gd = document.getElementById("guide"); if (gd) gd.remove(); } });
      // drag a scan anywhere on the Register page, or paste a screenshot of one
      const setFile = (f) => { const inp = document.getElementById("file"); if (!inp || !f) return false; const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; inp.dispatchEvent(new Event("change", { bubbles: true })); UI.toast("Scan attached: " + (f.name || "pasted image"), "ok"); return true; };
      ["dragenter", "dragover"].forEach((ev) => document.addEventListener(ev, (e) => { if (document.getElementById("file") && e.dataTransfer && [].includes.call(e.dataTransfer.types || [], "Files")) { e.preventDefault(); document.body.classList.add("dropping"); } }));
      ["dragleave", "drop"].forEach((ev) => document.addEventListener(ev, (e) => { if (ev === "dragleave" && e.relatedTarget) return; document.body.classList.remove("dropping"); }));
      document.addEventListener("drop", (e) => { if (document.getElementById("file") && e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); const f = e.dataTransfer.files[0]; if (/^image\//.test(f.type)) setFile(f); else UI.toast("Attach a PNG or JPG scan.", "err"); } });
      document.addEventListener("paste", (e) => { const it = [].find.call((e.clipboardData && e.clipboardData.items) || [], (x) => /^image\//.test(x.type)); if (it && document.getElementById("file") && !typing(e.target)) { e.preventDefault(); setFile(it.getAsFile()); } });
      if (window.UXTables) UXTables.watch(user);
    },
  };
})();
