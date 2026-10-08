/* Thresholds and settings. One place holds every value, its shipped default, and the rules for changing it.
   The shipped values are captured from the code at start-up, so nothing changes until someone changes a setting.
   Saved changes live in browser storage, are applied to the running system (levels, rates, mandates, limits) and are written to the audit trail.
   Only a Branch Manager or the Head of Operations may change them; the auditor can read them. */
(function () {
  const A = window.APP, R = window.Rules, KEY = A.KEY + "_settings", MODS = Object.keys(A.MODULES);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const fmt = (n) => Number(n).toLocaleString("en-US");
  const typeOf = (k) => A.MODULES[k].type;
  const perMod = (f) => MODS.reduce((o, k) => ((o[k] = f(k)), o), {});

  // ---- 1. the shipped defaults, taken from the code as it stands ----
  const DEFAULTS = {
    score: { pass: A.POLICY.passScore, passByModule: perMod(() => null), amountOn: false, amountFrom: 100000, amountPass: 80, signatory: {}, highRiskOn: true, highRiskBelow: 40, highRiskNeedsSecond: false, marginOn: false, marginPoints: 10 },
    amount: {
      levels: perMod((k) => A.TYPES[typeOf(k)].levels.slice(0, -1).map((l) => l.upTo)),
      asvFrom: perMod(() => 0), reviewFrom: perMod(() => null), secondFrom: perMod(() => null),
      overrideMinLevel: 2, unknownCurrency: "top", fx: clone(A.FX),
      mandates: A.ACCOUNTS.filter((a) => a.mandate.rule === "any").reduce((o, a) => ((o[a.no] = { n: a.mandate.n, tierLimit: a.mandate.tier ? a.mandate.tier.limit : null, tierN: a.mandate.tier ? a.mandate.tier.n : 1 }), o), {}),
    },
    quality: { goodMin: 75, fairMin: 50, small: 25, faint: 25, edge: 30, overlap: 35, minHeight: 42, smallBelow: 40, poorForcesReview: true },
    process: { sla: perMod((k) => A.TYPES[typeOf(k)].slaHours), noteMin: clone(R.NOTE_MIN), callbackRequired: true, sessionMinutes: A.POLICY.sessionMinutes, lockTries: 3, lockMinutes: 2, duplicateDays: 30, specimenWarnYears: 3 },
    module: { minLeft: 5000, interestKeptPct: 50, cutoff: "15:30", screeningRule: "contains", watchlist: ["northgate metals", "volta shipping", "ashgar trading"] },
  };
  const ORIG = { flows: clone(A.FLOWS), guides: clone(A.GUIDES), mandates: A.ACCOUNTS.map((a) => ({ no: a.no, mandate: clone(a.mandate) })) };

  function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && typeof s === "object" ? s : {}; } catch (e) { return {}; } }
  function merge(base, over) { // saved values replace defaults; objects merge key by key, arrays and values replace
    if (over === undefined) return clone(base);
    if (base && typeof base === "object" && !Array.isArray(base) && over && typeof over === "object" && !Array.isArray(over)) { const o = {}; Object.keys(Object.assign({}, base, over)).forEach((k) => (o[k] = merge(base[k], over[k]))); return o; }
    return clone(over);
  }

  // ---- 2. checks on a full set of settings; returns a list of plain-language problems ----
  function validate(S) {
    const e = [], int = (v) => Number.isInteger(v), num = (v) => typeof v === "number" && isFinite(v), between = (v, a, b) => num(v) && v >= a && v <= b;
    const sc = S.score, am = S.amount, q = S.quality, p = S.process, m = S.module;
    if (!int(sc.pass) || !between(sc.pass, 1, 99)) e.push("Pass score must be a whole number from 1 to 99.");
    MODS.forEach((k) => { const v = sc.passByModule[k]; if (v != null && (!int(v) || !between(v, 1, 99))) e.push(A.MODULES[k].name + ": the module pass score must be blank or a whole number from 1 to 99."); });
    if (sc.amountOn && (!between(sc.amountFrom, 0, 1e12) || !int(sc.amountPass) || !between(sc.amountPass, 1, 99))) e.push("Amount rule: enter an amount of 0 or more and a pass score from 1 to 99.");
    if (sc.highRiskOn && (!int(sc.highRiskBelow) || !between(sc.highRiskBelow, 1, 98))) e.push("High risk below: enter a whole number from 1 to 98.");
    if (sc.highRiskOn && num(sc.highRiskBelow)) { const lowest = Math.min.apply(null, [sc.pass].concat(MODS.map((k) => sc.passByModule[k]).filter((v) => v != null), sc.amountOn ? [sc.amountPass] : [], Object.keys(sc.signatory).map((k) => sc.signatory[k]))); if (sc.highRiskBelow >= lowest) e.push("High risk below (" + sc.highRiskBelow + ") must be lower than every pass score in use (the lowest is " + lowest + ").") }
    if (sc.marginOn && (!int(sc.marginPoints) || !between(sc.marginPoints, 1, 50))) e.push("Margin to the next signatory must be a whole number from 1 to 50.");
    Object.keys(sc.signatory).forEach((k) => { const [no, pid] = k.split("|"), a = A.ACCOUNTS.find((x) => x.no === no); if (!a || !a.parties.some((x) => x.id === pid)) e.push("Signatory override " + k + ": that account or signatory does not exist."); else if (!int(sc.signatory[k]) || !between(sc.signatory[k], 1, 99)) e.push("Signatory override for " + a.parties.find((x) => x.id === pid).name + " must be a whole number from 1 to 99."); });
    MODS.forEach((k) => {
      const lv = am.levels[k], name = A.MODULES[k].name, n = A.TYPES[typeOf(k)].levels.length - 1;
      if (!Array.isArray(lv) || lv.length !== n || lv.some((v) => !num(v) || v <= 0)) e.push(name + ": enter an amount above zero for each approval level."); else if (lv.some((v, i) => i && v <= lv[i - 1])) e.push(name + ": each approval level limit must be higher than the one before.");
      if (!between(am.asvFrom[k], 0, 1e12)) e.push(name + ": ASV is required from an amount of 0 or more (0 means always).");
      ["reviewFrom", "secondFrom"].forEach((f) => { if (am[f][k] != null && !(num(am[f][k]) && am[f][k] > 0)) e.push(name + ": " + (f === "reviewFrom" ? "analyst review of clean matches" : "second analyst") + " from must be blank or above zero."); });
      if (!int(p.sla[k]) || !between(p.sla[k], 1, 168)) e.push(name + ": service target must be a whole number of hours from 1 to 168.");
    });
    if (!int(am.overrideMinLevel) || !between(am.overrideMinLevel, 1, 3)) e.push("Minimum level after a flag is cleared must be 1, 2 or 3.");
    if (!["top", "block"].includes(am.unknownCurrency)) e.push("Choose what happens with a currency that has no rate.");
    Object.keys(am.fx).forEach((c) => { if (!/^[A-Z]{2,6}$/.test(c)) e.push("Currency code " + c + " must be 2 to 6 capital letters."); else if (!(num(am.fx[c]) && am.fx[c] > 0)) e.push("Exchange rate for " + c + " must be above zero."); });
    if (am.fx.MYR !== 1) e.push("The MYR rate is always 1.");
    Object.keys(am.mandates).forEach((no) => { const a = A.ACCOUNTS.find((x) => x.no === no), mm = am.mandates[no]; if (!a) return; const L = a.parties.length;
      if (!int(mm.n) || !between(mm.n, 1, L)) e.push(a.name + ": signatures needed must be from 1 to " + L + ".");
      else if (mm.tierLimit != null && (!(num(mm.tierLimit) && mm.tierLimit > 0) || !int(mm.tierN) || !between(mm.tierN, 1, mm.n - 1))) e.push(a.name + ": the amount-based rule needs a limit above zero and fewer signatures than the full rule."); });
    if (![q.goodMin, q.fairMin].every((v) => int(v) && between(v, 0, 100)) || q.goodMin <= q.fairMin) e.push("Quality: Good must start above Fair, both from 0 to 100.");
    ["small", "faint", "edge", "overlap"].forEach((f) => { if (!int(q[f]) || !between(q[f], 0, 100)) e.push("Quality penalty (" + f + ") must be from 0 to 100."); });
    if (!int(q.minHeight) || !between(q.minHeight, 20, 120)) e.push("Minimum signature height must be from 20 to 120 pixels."); if (!int(q.smallBelow) || !between(q.smallBelow, 10, 120)) e.push("Small signature limit must be from 10 to 120 pixels.");
    Object.keys(p.noteMin).forEach((k) => { if (!int(p.noteMin[k]) || !between(p.noteMin[k], 0, 200)) e.push("Minimum note length for " + k.replace(/_/g, " ") + " must be 0 to 200 characters."); });
    if (!int(p.sessionMinutes) || !between(p.sessionMinutes, 1, 120)) e.push("Idle sign-out must be 1 to 120 minutes."); if (!int(p.lockTries) || !between(p.lockTries, 1, 10)) e.push("Failed sign-in attempts must be 1 to 10."); if (!int(p.lockMinutes) || !between(p.lockMinutes, 1, 120)) e.push("Lock time must be 1 to 120 minutes.");
    if (!int(p.duplicateDays) || !between(p.duplicateDays, 1, 365)) e.push("Duplicate payment window must be 1 to 365 days."); if (!int(p.specimenWarnYears) || !between(p.specimenWarnYears, 0, 20)) e.push("Specimen age warning must be 0 to 20 years (0 is off).");
    if (!between(m.minLeft, 0, 1e12)) e.push("Fixed deposit minimum balance must be 0 or more."); if (!between(m.interestKeptPct, 0, 100)) e.push("Share of interest kept must be 0 to 100 percent.");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(m.cutoff)) e.push("Cut-off must be a time such as 15:30."); if (!["contains", "exact"].includes(m.screeningRule)) e.push("Choose a screening match rule.");
    if (!Array.isArray(m.watchlist) || m.watchlist.some((w) => !String(w).trim())) e.push("The watchlist cannot contain blank lines.");
    return e;
  }

  // ---- 3. put the settings to work on the running system ----
  function apply() {
    const S = Cfg.settings;
    A.POLICY.passScore = S.score.pass; A.POLICY.sessionMinutes = S.process.sessionMinutes;
    MODS.forEach((k) => { const ty = A.TYPES[typeOf(k)]; ty.levels.forEach((l, i) => { if (i < ty.levels.length - 1) l.upTo = S.amount.levels[k][i]; }); ty.slaHours = S.process.sla[k]; });
    Object.keys(A.FX).forEach((c) => delete A.FX[c]); Object.assign(A.FX, S.amount.fx);
    Object.assign(R.NOTE_MIN, S.process.noteMin);
    window.ASV_QUALITY = clone(S.quality);
    ORIG.mandates.forEach((o) => { // signing rules: put back the shipped rule, then apply any change
      const a = A.ACCOUNTS.find((x) => x.no === o.no), mm = S.amount.mandates[o.no]; a.mandate = clone(o.mandate); if (!mm) return;
      const d = DEFAULTS.amount.mandates[o.no]; if (mm.n === d.n && mm.tierLimit === d.tierLimit && mm.tierN === d.tierN) return;
      a.mandate.n = mm.n; if (mm.tierLimit != null) a.mandate.tier = { limit: mm.tierLimit, n: mm.tierN }; else delete a.mandate.tier;
      a.mandate.text = mm.tierLimit != null ? "Any " + mm.tierN + " signatory up to MYR " + fmt(mm.tierLimit) + "; any " + mm.n + " above" : mm.n === 1 && a.parties.length === 1 ? "Sole holder" : "Any " + mm.n + " of " + a.parties.length + " authorised signatories";
    });
    // wording on the Process pages follows the numbers it quotes
    const pairs = (k) => { const d = DEFAULTS.amount.levels[k], c = S.amount.levels[k], m = {}; d.forEach((v, i) => { if (v !== c[i]) m[fmt(v)] = fmt(c[i]); }); return m; };
    const swap = (obj, map) => { const keys = Object.keys(map); if (!keys.length) return obj; const re = new RegExp(keys.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g"); return JSON.parse(JSON.stringify(obj).replace(re, (t) => map[t])); };
    MODS.forEach((k) => {
      const t = typeOf(k), map = pairs(k);
      if (k === "fd") { if (S.module.minLeft !== DEFAULTS.module.minLeft) map[fmt(DEFAULTS.module.minLeft)] = fmt(S.module.minLeft); if (S.module.interestKeptPct !== 50) map["half of the interest"] = S.module.interestKeptPct + "% of the interest"; }
      if (k === "tt" && S.module.cutoff !== "15:30") map["15:30"] = S.module.cutoff;
      A.FLOWS[t] = swap(clone(ORIG.flows[t]), map); A.GUIDES[t] = swap(clone(ORIG.guides[t]), map);
    });
  }

  const get = (o, path) => path.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
  const flat = (o, pre, out) => { out = out || {}; Object.keys(o).forEach((k) => { const v = o[k], p = pre ? pre + "." + k : k; if (v && typeof v === "object" && !Array.isArray(v)) flat(v, p, out); else out[p] = v; }); return out; };
  const show = (v) => (v == null ? "blank" : Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "on" : "off") : String(v));
  const SECTIONS = { score: "Signature score", amount: "Amount rules", quality: "Capture quality", process: "Process and control", module: "Module settings" };

  const Cfg = {
    SECTIONS, defaults: DEFAULTS, settings: merge(DEFAULTS, load()), validate,
    get(path) { return get(Cfg.settings, path); },
    canEdit(user) { return !!user && ["manager", "head"].includes(user.role); },

    // The pass score that applies to one signature. Order of precedence: a named signatory, then the amount rule, then the module, then the bank-wide score.
    passFor(o) {
      const s = Cfg.settings.score; let p = s.pass;
      if (o.module && s.passByModule[o.module] != null) p = s.passByModule[o.module];
      if (s.amountOn && (o.myr == null || o.myr >= s.amountFrom)) p = s.amountPass;
      if (o.accountNo && o.partyId && s.signatory[o.accountNo + "|" + o.partyId] != null) p = s.signatory[o.accountNo + "|" + o.partyId];
      return p;
    },
    modOf(c) { return A.TYPES[c.type].module; },
    asvNotRequired(type, myr, known) { const f = Cfg.settings.amount.asvFrom[A.TYPES[type].module]; return f > 0 && !!known && myr < f; },
    highValueReview(c) { const f = Cfg.settings.amount.reviewFrom[Cfg.modOf(c)]; return f != null && (c.myr == null || c.myr >= f); },
    secondAnalyst(c) { const f = Cfg.settings.amount.secondFrom[Cfg.modOf(c)]; return (f != null && (c.myr == null || c.myr >= f)) || (!!c.highRisk && Cfg.settings.score.highRiskNeedsSecond); },
    specimenYears(a) { const y = (Date.now() - new Date(a.specimenDate)) / (365.25 * 86400e3), w = Cfg.settings.process.specimenWarnYears; return w > 0 && y > w ? Math.floor(y * 10) / 10 : null; },

    // Save a whole section. Needs a reason; every changed value goes to the audit trail with the old and new value.
    update(user, section, next, reason) {
      if (!Cfg.canEdit(user)) return { ok: false, errors: ["Only a Branch Manager or the Head of Operations can change settings."] };
      if (!SECTIONS[section]) return { ok: false, errors: ["Unknown section."] };
      if (String(reason || "").trim().length < 10) return { ok: false, errors: ["Write the reason for the change (at least 10 characters)."] };
      const draft = clone(Cfg.settings); draft[section] = clone(next); const errs = validate(draft);
      if (errs.length) return { ok: false, errors: errs };
      const before = flat(Cfg.settings[section]), after = flat(draft[section]), keys = Object.keys(Object.assign({}, before, after)).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
      if (!keys.length) return { ok: true, changes: 0 };
      try { const saved = load(); saved[section] = draft[section]; localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { return { ok: false, errors: ["Browser storage is full or blocked, so the change was not saved."] }; }
      Cfg.settings = draft; apply();
      keys.forEach((k) => DB.log(user, "config", "Setting changed", "", section + "." + k + ": " + show(before[k]) + " to " + show(after[k]) + ". Reason: " + String(reason).trim()));
      return { ok: true, changes: keys.length };
    },
    resetSection(user, section, reason) { return Cfg.update(user, section, DEFAULTS[section], reason); },
    resetAll() { try { localStorage.removeItem(KEY); } catch (e) {} Cfg.settings = clone(DEFAULTS); apply(); },
    history() { return DB.events().filter((e) => e.type === "config").reverse(); },
    apply,
  };
  window.Cfg = Cfg; apply();
})();
