/* Case table used by the dashboard and the case list. */
(function () {
  const esc = UI.esc;
  UI.caseTable = function (cases, opts) {
    opts = opts || {};
    if (!cases.length) return '<div class="empty"><b>' + esc(opts.emptyTitle || "Nothing here") + "</b>" + esc(opts.emptyText || "") + "</div>";
    const rows = cases.map((c) => {
      const owner = Rules.STATUS[c.status].owner;
      return '<tr class="click" tabindex="0" data-id="' + esc(c.id) + '"><td class="id">' + esc(c.id) + '</td><td>' + esc(UI.typeName(c.type)) + '<span class="sub">' + esc(c.customer) + "</span></td>" +
        '<td class="r nowrap">' + esc(UI.money(c.amount, c.currency)) + (c.currency !== "MYR" && c.myr != null ? '<span class="sub">MYR ' + Math.round(c.myr).toLocaleString("en-US") + "</span>" : c.myr == null ? '<span class="sub">No FX rate</span>' : "") + "</td>" +
        "<td>" + UI.level(c) + "</td><td>" + UI.status(c.status) + (owner && opts.owner ? '<span class="sub">With ' + esc(owner.toLowerCase()) + "</span>" : "") + "</td>" +
        "<td>" + UI.sla(c) + '</td><td class="nowrap muted">' + esc(opts.when === "ago" ? UI.ago(c.createdAt) : UI.dt(c.createdAt)) + "</td></tr>";
    }).join("");
    return '<div class="tablewrap"><table class="grid"><thead><tr><th>Case</th><th>Instruction</th><th class="r">Amount</th><th>Level</th><th>Status</th><th>Service time</th><th>Registered</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  };
  UI.bindRows = function (root) {
    const go = (tr) => { if (tr) location.href = "case.html?id=" + encodeURIComponent(tr.dataset.id); };
    root.addEventListener("click", (e) => go(e.target.closest("tr.click")));
    root.addEventListener("keydown", (e) => { if (e.key === "Enter") go(e.target.closest("tr.click")); });
  };
})();
