/* Corporate payment specifics: the duplicate payment check and the payee history. */
(function () {
  const esc = UI.esc, A = APP;
  const norm = (s) => String(s || "").trim().toLowerCase();
  // A possible duplicate: same account and payee with the same reference, or the same payee and amount within 30 days.
  function duplicates(values, acct, cases) {
    const payee = norm(values.payee), ref = norm(values.reference), amt = Number(values.amount) || 0, cur = String(values.currency || "").toUpperCase();
    if (!acct || !payee) return [];
    return cases.filter((c) => c.accountNo === acct.no && norm(c.fields.payee) === payee && !["rejected", "returned"].includes(c.status) &&
      ((ref && norm(c.fields.reference) === ref) || (c.amount === amt && c.currency === cur && Date.now() - new Date(c.createdAt) < 30 * 864e5)));
  }
  const history = (c, cases) => cases.filter((x) => x.id !== c.id && x.accountNo === c.accountNo && norm(x.fields.payee) === norm(c.fields.payee) && x.status === "approved");

  window.UseCase = {
    accountRows: (a) => [["Mandate", a.mandate.rule === "all" ? "All signatories" : a.mandate.tier ? "Tiered by amount" : "Any " + a.mandate.n]],
    registerChecks(values, acct, cases) {
      const out = [], d = duplicates(values, acct, cases);
      if (d.length) out.push({ tone: "warn", text: "<b>Possible duplicate.</b> " + esc(d[0].id) + " has the same payee and " + (norm(d[0].fields.reference) === norm(values.reference) ? "payment reference" : "amount") + ". Confirm with the customer before registering." });
      else if (values.payee) out.push({ tone: "ok", text: "No duplicate payment found for this payee." });
      const paid = acct && values.payee ? cases.filter((c) => c.accountNo === acct.no && norm(c.fields.payee) === norm(values.payee) && c.status === "approved").length : 0;
      if (acct && values.payee) out.push({ tone: "info", text: paid ? "Payee paid " + paid + " time" + (paid > 1 ? "s" : "") + " before from this account." : "First payment to this payee from this account." });
      return out;
    },
    onRegister(c, values, acct, cases) {
      const d = duplicates(values, acct, cases);
      if (d.length) { c.dup = d[0].id; return [["Duplicate payment warning", "Possible duplicate of " + d[0].id + "."]]; }
      return [];
    },
    rows: (c) => [["Invoice or reference", c.fields.reference || "-"], ["Purpose", c.fields.purpose || "-"]],
    panels(c) {
      const h = history(c, DB.cases());
      return '<section class="panel"><header>Payment checks</header><div class="body small">' +
        (c.dup ? '<div class="msg warn">Possible duplicate of <a href="case.html?id=' + esc(c.dup) + '">' + esc(c.dup) + "</a>.</div>" : '<div class="st pass">No duplicate found at registration</div>') +
        '<div class="muted" style="margin-top:6px">' + (h.length ? "Paid to this payee before: " + h.length + ", latest " + UI.date(h[0].createdAt) + "." : "No earlier approved payments to this payee.") + "</div></div></section>";
    },
    approvalChecks: (c) => [[!c.dup, c.dup ? "Possible duplicate of " + esc(c.dup) + " (check before approving)" : "No duplicate payment found"]],
  };
})();
