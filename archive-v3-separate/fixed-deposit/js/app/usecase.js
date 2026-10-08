/* Fixed deposit specifics: the payout calculation, identity and representative checks, and the minimum balance rule. */
(function () {
  const esc = UI.esc, A = APP, MIN_LEFT = 5000, EARLY_INTEREST_KEPT = 0.5;
  const money = (n, cur) => UI.money(Math.round(n * 100) / 100, cur);
  // Payout for uplifting `amount` of principal. Early withdrawal keeps half of the interest earned on that principal.
  function payout(acct, amount, instruction) {
    const P = acct.principal, I = acct.accrued, u = Math.min(Number(amount) || 0, P), share = P ? I * u / P : 0;
    const early = instruction === "Early withdrawal" || (instruction === "Withdrawal at maturity" && new Date(acct.maturity) > new Date());
    const rollover = instruction === "Rollover for 12 months", penalty = early ? share * (1 - EARLY_INTEREST_KEPT) : 0;
    return { principal: u, interest: share, penalty, net: rollover ? 0 : u + share - penalty, left: P - u, early, rollover, notMatured: instruction === "Withdrawal at maturity" && early };
  }
  const acctOf = (c) => A.ACCOUNTS.find((a) => a.no === c.accountNo);

  window.UseCase = {
    accountRows: (a) => [["Principal", money(a.principal, a.currency)], ["Interest accrued", money(a.accrued, a.currency)], ["Matures", UI.date(a.maturity)], ["Rate", a.rate]],
    registerChecks(values, acct) {
      const out = [], amt = Number(values.amount) || 0;
      if (!acct) return out;
      if (amt > 0) {
        const p = payout(acct, amt, values.instruction || "Early withdrawal");
        if (p.rollover) out.push({ tone: "info", text: "Rollover: " + money(p.principal, acct.currency) + " renewed for 12 months. No cash is paid out." });
        else out.push({ tone: p.early ? "warn" : "ok", text: "<b>Net payout " + money(p.net, acct.currency) + ".</b> Principal " + money(p.principal, acct.currency) + ", interest " + money(p.interest, acct.currency) + (p.penalty ? ", less early withdrawal reduction " + money(p.penalty, acct.currency) : "") + ". Remaining in deposit " + money(p.left, acct.currency) + "." });
        if (p.notMatured) out.push({ tone: "warn", text: "This deposit matures on " + UI.date(acct.maturity) + ". Treated as an early withdrawal." });
      }
      if (values.presented === "Authorised representative") out.push({ tone: "warn", text: "<b>Representative.</b> Attach the holder's signed authority letter and check the representative's ID. ASV compares the holder's signature on the letter, not the representative's." });
      if (values.idSighted !== "Yes") out.push({ tone: "info", text: "Identity must be sighted and confirmed before the request can be registered." });
      return out;
    },
    validate(values, acct, ctx) {
      const e = [], amt = ctx.amt;
      if (ctx.cur !== acct.currency) e.push("This deposit is held in " + acct.currency + ". Enter the amount in " + acct.currency + ".");
      if (amt > acct.principal) e.push("The amount is more than the principal of " + money(acct.principal, acct.currency) + ".");
      else if (amt > 0 && acct.principal - amt > 0 && acct.principal - amt < MIN_LEFT) e.push("The deposit would be left with " + money(acct.principal - amt, acct.currency) + ". Uplift the full principal or leave at least " + money(MIN_LEFT, acct.currency) + ".");
      return e;
    },
    rows: (c) => [["Instruction", c.fields.instruction], ["Presented by", c.fields.presented], ["Identity sighted", c.fields.idSighted === "Yes" ? "Yes" : "No"], ["Net payout", payoutText(c)]],
    panels(c) {
      const a = acctOf(c), p = payout(a, c.amount, c.fields.instruction), cur = a.currency;
      return '<section class="panel"><header>Payout estimate</header><div class="body flush"><table class="grid"><tbody>' +
        "<tr><td>Principal uplifted</td><td class=\"r\">" + esc(money(p.principal, cur)) + "</td></tr><tr><td>Interest earned on it</td><td class=\"r\">" + esc(money(p.interest, cur)) + "</td></tr>" +
        (p.penalty ? '<tr><td>Early withdrawal reduction</td><td class="r">-' + esc(money(p.penalty, cur)) + "</td></tr>" : "") +
        "<tr><td><b>" + (p.rollover ? "Renewed for 12 months" : "Net payout") + '</b></td><td class="r"><b>' + esc(p.rollover ? money(p.principal, cur) : money(p.net, cur)) + "</b></td></tr>" +
        '<tr><td class="muted">Left in deposit</td><td class="r muted">' + esc(money(p.left, cur)) + "</td></tr></tbody></table></div></section>" +
        (c.fields.presented === "Authorised representative" ? '<div class="msg warn">Presented by an authorised representative. The holder\'s authority letter must be on file.</div>' : "");
    },
    approvalChecks: (c) => [[c.fields.idSighted === "Yes", "Holder's identity was sighted at the counter"], [c.fields.presented !== "Authorised representative", c.fields.presented === "Authorised representative" ? "Presented by a representative: confirm the authority letter" : "Holder presented in person"]],
  };
  function payoutText(c) { const a = acctOf(c), p = payout(a, c.amount, c.fields.instruction); return p.rollover ? "Rollover, no payout" : money(p.net, a.currency); }
})();
