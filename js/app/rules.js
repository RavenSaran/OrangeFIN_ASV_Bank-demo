/* Workflow rules: statuses, who may do what, approval authority and four-eyes checks.
   Pure logic with no screen code, so every permission can be tested on its own.
   Approval levels belong to the module (each type carries its own limits); module access belongs to the person. */
(function (root) {
  const A = root.APP;

  const STATUS = {
    registered: { label: "Registered", tone: "neutral", open: true, owner: "Operations Officer", hint: "Signature verification not yet run" },
    reopened: { label: "Returned for correction", tone: "wait", open: true, owner: "Operations Officer", hint: "Approver sent this back" },
    asv_pass: { label: "Verified, ready to submit", tone: "pass", open: true, owner: "Operations Officer", hint: "Signatures match the mandate" },
    asv_flag: { label: "Flagged by ASV", tone: "flag", open: true, owner: "Operations Officer", hint: "Refer for review" },
    asv_mandate: { label: "Mandate not met", tone: "fail", open: true, owner: "Operations Officer", hint: "Signatures do not satisfy the signing rule" },
    fraud_review: { label: "With review", tone: "flag", open: true, owner: "Fraud and Compliance Analyst", hint: "Awaiting analyst decision" },
    on_hold: { label: "On hold, callback pending", tone: "wait", open: true, owner: "Fraud and Compliance Analyst", hint: "Waiting for customer confirmation" },
    pending_approval: { label: "Awaiting approval", tone: "info", open: true, owner: "Approver", hint: "Approval authority required" },
    approved: { label: "Approved and released", tone: "pass", open: false, owner: null, hint: "Sent to core banking" },
    rejected: { label: "Rejected", tone: "fail", open: false, owner: null, hint: "" },
    returned: { label: "Returned to customer", tone: "neutral", open: false, owner: null, hint: "" },
  };

  const cfg = () => root.Cfg;                         // Settings, when loaded
  const setting = (path, dflt) => { const v = root.Cfg ? root.Cfg.get(path) : undefined; return v === undefined ? dflt : v; };
  const typeOf = (c) => A.TYPES[c.type];
  const moduleOf = (c) => A.MODULES[typeOf(c).module];
  const hit = (c) => !!(c.screen && c.screen.hit && !c.screen.cleared); // compliance screening hit not yet cleared
  const ASV_OPEN = ["registered", "reopened", "asv_pass", "asv_flag", "asv_mandate"];
  const reviewName = (c) => typeOf(c).review || "Fraud review";

  function toMYR(amount, cur) {
    const code = String(cur || "").trim().toUpperCase(), rate = A.FX[code];
    if (rate == null) return { myr: null, rate: null, known: false, code };
    return { myr: Math.round(Number(amount || 0) * rate * 100) / 100, rate, known: true, code };
  }

  // The module's own limits decide the level. An unknown currency has no rate, so it goes to the module's highest authority.
  // A case cleared after a flag needs at least Level 2 (or the top level if the module has fewer).
  function levelsOf(type) { return A.TYPES[type || Object.keys(A.TYPES)[0]].levels; }
  function approvalLevel(myr, known, override, type) {
    const levels = levelsOf(type), top = levels.length; let lvl = top;
    if (known) lvl = levels.find((l) => l.upTo == null || myr <= l.upTo).n;
    return override ? Math.min(top, Math.max(lvl, setting("amount.overrideMinLevel", 2))) : lvl;
  }
  function levelWho(n, type) { return levelsOf(type).find((l) => l.n === n).who; }

  // Number of distinct signatories the mandate needs for this amount.
  function requiredSigs(account, myr) {
    const m = account.mandate;
    if (m.rule === "all") return account.parties.length;
    if (m.tier && myr != null && myr <= m.tier.limit) return m.tier.n;
    return m.n;
  }

  function dueAt(createdAt, type) { return new Date(new Date(createdAt).getTime() + A.TYPES[type].slaHours * 3600e3).toISOString(); }
  const hasModule = (user, c) => (user.modules || []).includes(typeOf(c).module);

  const ok = () => ({ ok: true });
  const no = (reason) => ({ ok: false, reason });

  // can(user, case, action) -> {ok, reason}
  function can(user, c, action) {
    const role = user.role, st = c.status;
    if (!hasModule(user, c)) return no("You do not have access to the " + moduleOf(c).name + " module.");
    switch (action) {
      case "run_asv":
        if (role !== "maker" || c.maker !== user.id) return no("Only the registering officer can run verification.");
        return ASV_OPEN.includes(st) ? ok() : no("Verification can no longer be run at this stage.");
      case "submit":
        if (role !== "maker" || c.maker !== user.id) return no("Only the registering officer can submit.");
        if (hit(c)) return no("A screening hit must be cleared before submitting.");
        if (c.asvSkip && ["registered", "reopened"].includes(st)) return ok(); // ASV is not required for this amount
        return st === "asv_pass" ? ok() : no("Only verified cases can be submitted for approval.");
      case "refer":
        if (role !== "maker" || c.maker !== user.id) return no("Only the registering officer can refer.");
        return st === "asv_flag" || (st === "asv_pass" && hit(c)) ? ok() : no("Only flagged cases are referred.");
      case "return_customer":
        if (role !== "maker" || c.maker !== user.id) return no("Only the registering officer can return to the customer.");
        return ["registered", "reopened", "asv_mandate"].includes(st) ? ok() : no("Not available at this stage.");
      case "fraud_clear": case "fraud_confirm": case "fraud_hold": {
        if (role !== "fraud") return no("Fraud and compliance analysts only.");
        if (c.maker === user.id) return no("You registered this case and cannot review it.");
        const allowed = action === "fraud_hold" ? st === "fraud_review" : ["fraud_review", "on_hold"].includes(st);
        if (!allowed) return no("Not available at this stage.");
        if (action === "fraud_clear" && c.fraudFirst && c.fraudFirst.by === user.id) return no("A second analyst must clear this case. You cleared it first.");
        if (action === "fraud_clear" && c.asv && c.asv.sigs.length < c.required) return no("Only " + c.asv.sigs.length + " of " + c.required + " required signatures were presented. A flag cannot be cleared; hold the case or reject it.");
        return ok();
      }
      case "approve": case "reject": case "return_maker": {
        const lvl = A.ROLES[role].approveLevel;
        if (!lvl) return no("Your role has no approval authority.");
        if (st !== "pending_approval") return no("This case is not awaiting approval.");
        if (c.maker === user.id) return no("Four-eyes rule: you registered this case.");
        if (c.fraud && (c.fraud.by === user.id || (c.fraud.first && c.fraud.first.by === user.id))) return no("Four-eyes rule: you cleared this case in review.");
        if (lvl < c.level) return no("Requires Level " + c.level + " authority (" + levelWho(c.level, c.type) + ").");
        return ok();
      }
      default: return no("Unknown action.");
    }
  }

  const NOTE_MIN = { return_customer: 5, fraud_clear: 30, fraud_confirm: 15, fraud_hold: 10, reject: 10, return_maker: 10 };

  // perform(case, user, action, payload) mutates the case and returns {ok, error, event}.
  function perform(c, user, action, payload) {
    payload = payload || {};
    const chk = can(user, c, action);
    if (!chk.ok) return { ok: false, error: chk.reason };
    const note = String(payload.note || "").trim();
    if (NOTE_MIN[action] && note.length < NOTE_MIN[action]) return { ok: false, error: "A note of at least " + NOTE_MIN[action] + " characters is required." };
    if (action === "fraud_clear" && setting("process.callbackRequired", true) && !String(payload.callback || "").trim()) return { ok: false, error: "Enter the callback reference used to confirm with the customer." };
    const now = new Date().toISOString(), who = { by: user.id, name: user.name, ts: now };
    let label = "", detail = note;
    switch (action) {
      case "run_asv": {
        c.asv = payload.asv; c.status = { pass: "asv_pass", review: "asv_flag", mandate: "asv_mandate" }[c.asv.verdict];
        c.highRisk = !!c.asv.highRisk; delete c.reviewReason; delete c.fraudFirst;
        label = "Signature verification run";
        detail = c.asv.sigs.map((s) => (s.matched ? s.matched.score : s.score)).join(" / ") + " against pass score " + c.asv.threshold + ". " + STATUS[c.status].label + ".";
        break;
      }
      case "submit":
        if (c.asv && c.asv.verdict === "pass" && root.Cfg && root.Cfg.highValueReview(c) && !c.override) { // high value: an analyst confirms a clean match by callback before approval
          c.status = "fraud_review"; c.reviewReason = "high_value"; label = "Referred for high-value review"; detail = "Likely match, but this amount is reviewed by an analyst (callback to the signatory) before approval."; break;
        }
        c.level = approvalLevel(c.myr, c.fxKnown, c.override, c.type); c.status = "pending_approval"; c.submittedAt = now;
        label = "Submitted for approval"; detail = "Level " + c.level + " authority required (" + levelWho(c.level, c.type) + ")." + (c.asvSkip && !c.asv ? " ASV was not required for this amount." : ""); break;
      case "refer": c.status = "fraud_review"; label = "Referred for review"; detail = hit(c) ? "Screening hit: " + c.screen.reasons.join("; ") : "ASV flagged one or more signatures."; break;
      case "return_customer": c.status = "returned"; c.closedAt = now; c.closeNote = note; label = "Returned to customer"; break;
      case "fraud_clear": {
        const cb = String(payload.callback || "").trim();
        if (root.Cfg && root.Cfg.secondAnalyst(c) && !c.fraudFirst) { // two analysts must agree: this is the first
          c.fraudFirst = Object.assign({ note, callback: cb }, who); label = reviewName(c) + ": cleared by the first analyst"; detail = note + (cb ? " Callback ref " + cb + "." : "") + " A second analyst must also clear this case."; break;
        }
        if (c.reviewReason !== "high_value") c.override = true;
        if (c.screen) c.screen.cleared = true; c.fraud = Object.assign({ decision: "cleared", note, callback: cb }, who); if (c.fraudFirst) c.fraud.first = c.fraudFirst;
        c.level = approvalLevel(c.myr, c.fxKnown, c.override, c.type); c.status = "pending_approval";
        label = reviewName(c) + ": " + (c.reviewReason === "high_value" ? "match confirmed" : c.fraud.first ? "signature cleared by two analysts" : "signature cleared"); detail = note + (cb ? " Callback ref " + cb + "." : "") + " Now needs Level " + c.level + " approval."; break;
      }
      case "fraud_confirm":
        c.fraud = Object.assign({ decision: "forgery", note }, who); c.fraudSuspected = true; c.status = "rejected"; c.closedAt = now;
        label = reviewName(c) + ": forgery confirmed"; break;
      case "fraud_hold": c.fraud = Object.assign({ decision: "hold", note }, who); c.status = "on_hold"; label = "Placed on hold for callback"; break;
      case "approve":
        c.approval = Object.assign({ note }, who); c.status = "approved"; c.closedAt = now;
        c.releaseRef = "TXN" + c.id.replace(/[^A-Z0-9]/g, "") + "R"; label = "Approved and released"; detail = (note ? note + " " : "") + "Release reference " + c.releaseRef + "."; break;
      case "reject": c.approval = Object.assign({ note, rejected: true }, who); c.status = "rejected"; c.closedAt = now; label = "Rejected"; break;
      case "return_maker": c.returnNote = note; c.status = "reopened"; label = "Returned for correction"; break;
    }
    return { ok: true, event: { action: label, detail } };
  }

  // Button labels: a module may rename an action (for example remittance says "Reject as suspicious").
  const LABELS = { run_asv: "Run verification", submit: "Submit for approval", refer: "Refer for review", return_customer: "Return to customer", fraud_clear: "Clear signature",
    fraud_hold: "Hold for callback", fraud_confirm: "Confirm forgery", approve: "Approve and release", return_maker: "Return for correction", reject: "Reject" };
  const labelsFor = (type) => Object.assign({}, LABELS, (A.TYPES[type] || {}).actionLabels || {});

  function actionsFor(user, c) {
    const L = labelsFor(c.type), kinds = { run_asv: "primary", submit: "primary", refer: "primary", return_customer: "secondary", fraud_clear: "primary", fraud_hold: "secondary", fraud_confirm: "danger", approve: "approve", return_maker: "secondary", reject: "danger" };
    return Object.keys(LABELS).map((key) => Object.assign({ key, label: L[key], kind: kinds[key], needsNote: !!NOTE_MIN[key] }, can(user, c, key)));
  }

  root.Rules = { STATUS, toMYR, approvalLevel, levelWho, levelsOf, requiredSigs, dueAt, can, perform, actionsFor, labelsFor, hasModule, typeOf, moduleOf, NOTE_MIN };
})(typeof window !== "undefined" ? window : globalThis);
