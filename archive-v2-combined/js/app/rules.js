/* Workflow rules: statuses, who may do what, approval authority and four-eyes checks.
   Pure logic with no screen code, so every permission can be tested on its own. */
(function (root) {
  const A = root.APP;

  const STATUS = {
    registered: { label: "Registered", tone: "neutral", open: true, owner: "Operations Officer", hint: "Signature verification not yet run" },
    reopened: { label: "Returned for correction", tone: "wait", open: true, owner: "Operations Officer", hint: "Approver sent this back" },
    asv_pass: { label: "Verified, ready to submit", tone: "pass", open: true, owner: "Operations Officer", hint: "Signatures match the mandate" },
    asv_flag: { label: "Flagged by ASV", tone: "flag", open: true, owner: "Operations Officer", hint: "Refer to fraud review" },
    asv_mandate: { label: "Mandate not met", tone: "fail", open: true, owner: "Operations Officer", hint: "Signatures do not satisfy the signing rule" },
    fraud_review: { label: "With fraud review", tone: "flag", open: true, owner: "Fraud Review Analyst", hint: "Awaiting analyst decision" },
    on_hold: { label: "On hold, callback pending", tone: "wait", open: true, owner: "Fraud Review Analyst", hint: "Waiting for customer confirmation" },
    pending_approval: { label: "Awaiting approval", tone: "info", open: true, owner: "Approver", hint: "Approval authority required" },
    approved: { label: "Approved and released", tone: "pass", open: false, owner: null, hint: "Sent to core banking" },
    rejected: { label: "Rejected", tone: "fail", open: false, owner: null, hint: "" },
    returned: { label: "Returned to customer", tone: "neutral", open: false, owner: null, hint: "" },
  };

  const ASV_OPEN = ["registered", "reopened", "asv_pass", "asv_flag", "asv_mandate"];

  function toMYR(amount, cur) {
    const code = String(cur || "").trim().toUpperCase(), rate = A.FX[code];
    if (rate == null) return { myr: null, rate: null, known: false, code };
    return { myr: Math.round(Number(amount || 0) * rate * 100) / 100, rate, known: true, code };
  }

  // Unknown currency has no rate, so it goes to the highest authority. A fraud override needs at least Level 2.
  function approvalLevel(myr, known, override) {
    let lvl = 3;
    if (known) lvl = A.POLICY.levels.find((l) => myr <= l.upTo).n;
    return override ? Math.max(lvl, 2) : lvl;
  }
  function levelWho(n) { return A.POLICY.levels.find((l) => l.n === n).who; }

  // Number of distinct signatories the mandate needs for this amount.
  function requiredSigs(account, myr) {
    const m = account.mandate;
    if (m.rule === "all") return account.parties.length;
    if (m.tier && myr != null && myr <= m.tier.limit) return m.tier.n;
    return m.n;
  }

  function dueAt(createdAt, type) { return new Date(new Date(createdAt).getTime() + A.TYPES[type].slaHours * 3600e3).toISOString(); }

  const ok = () => ({ ok: true });
  const no = (reason) => ({ ok: false, reason });

  // can(user, case, action) -> {ok, reason}
  function can(user, c, action) {
    const role = user.role, st = c.status;
    switch (action) {
      case "run_asv":
        if (role !== "maker" || c.maker !== user.id) return no("Only the registering officer can run verification.");
        return ASV_OPEN.includes(st) ? ok() : no("Verification can no longer be run at this stage.");
      case "submit":
        if (role !== "maker" || c.maker !== user.id) return no("Only the registering officer can submit.");
        return st === "asv_pass" ? ok() : no("Only verified cases can be submitted for approval.");
      case "refer":
        if (role !== "maker" || c.maker !== user.id) return no("Only the registering officer can refer.");
        return st === "asv_flag" ? ok() : no("Only flagged cases are referred.");
      case "return_customer":
        if (role !== "maker" || c.maker !== user.id) return no("Only the registering officer can return to the customer.");
        return ["registered", "reopened", "asv_mandate"].includes(st) ? ok() : no("Not available at this stage.");
      case "fraud_clear": case "fraud_confirm": case "fraud_hold": {
        if (role !== "fraud") return no("Fraud review analysts only.");
        if (c.maker === user.id) return no("You registered this case and cannot review it.");
        const allowed = action === "fraud_hold" ? st === "fraud_review" : ["fraud_review", "on_hold"].includes(st);
        return allowed ? ok() : no("Not available at this stage.");
      }
      case "approve": case "reject": case "return_maker": {
        const lvl = A.ROLES[role].approveLevel;
        if (!lvl) return no("Your role has no approval authority.");
        if (st !== "pending_approval") return no("This case is not awaiting approval.");
        if (c.maker === user.id) return no("Four-eyes rule: you registered this case.");
        if (c.fraud && c.fraud.by === user.id) return no("Four-eyes rule: you cleared this case in fraud review.");
        if (lvl < c.level) return no("Requires Level " + c.level + " authority (" + levelWho(c.level) + ").");
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
    if (action === "fraud_clear" && !String(payload.callback || "").trim()) return { ok: false, error: "Enter the callback reference used to confirm with the customer." };
    const now = new Date().toISOString(), who = { by: user.id, name: user.name, ts: now };
    let label = "", detail = note;
    switch (action) {
      case "run_asv": {
        c.asv = payload.asv; c.status = { pass: "asv_pass", review: "asv_flag", mandate: "asv_mandate" }[c.asv.verdict];
        label = "Signature verification run";
        detail = c.asv.sigs.map((s) => (s.matched ? s.matched.score : s.score)).join(" / ") + " against pass score " + c.asv.threshold + ". " + STATUS[c.status].label + ".";
        break;
      }
      case "submit":
        c.level = approvalLevel(c.myr, c.fxKnown, c.override); c.status = "pending_approval"; c.submittedAt = now;
        label = "Submitted for approval"; detail = "Level " + c.level + " authority required (" + levelWho(c.level) + ")."; break;
      case "refer": c.status = "fraud_review"; label = "Referred to fraud review"; detail = "ASV flagged one or more signatures."; break;
      case "return_customer": c.status = "returned"; c.closedAt = now; c.closeNote = note; label = "Returned to customer"; break;
      case "fraud_clear":
        c.override = true; c.fraud = Object.assign({ decision: "cleared", note, callback: payload.callback.trim() }, who);
        c.level = approvalLevel(c.myr, c.fxKnown, true); c.status = "pending_approval";
        label = "Fraud review: signature cleared"; detail = note + " Callback ref " + c.fraud.callback + ". Now needs Level " + c.level + " approval."; break;
      case "fraud_confirm":
        c.fraud = Object.assign({ decision: "forgery", note }, who); c.fraudSuspected = true; c.status = "rejected"; c.closedAt = now;
        label = "Fraud review: forgery confirmed"; break;
      case "fraud_hold": c.fraud = Object.assign({ decision: "hold", note }, who); c.status = "on_hold"; label = "Placed on hold for callback"; break;
      case "approve":
        c.approval = Object.assign({ note }, who); c.status = "approved"; c.closedAt = now;
        c.releaseRef = "TXN" + c.id.replace(/\D/g, "") + "R"; label = "Approved and released"; detail = (note ? note + " " : "") + "Release reference " + c.releaseRef + "."; break;
      case "reject": c.approval = Object.assign({ note, rejected: true }, who); c.status = "rejected"; c.closedAt = now; label = "Rejected"; break;
      case "return_maker": c.returnNote = note; c.status = "reopened"; label = "Returned for correction"; break;
    }
    return { ok: true, event: { action: label, detail } };
  }

  function actionsFor(user, c) {
    const defs = [
      ["run_asv", "Run verification", "primary"], ["submit", "Submit for approval", "primary"], ["refer", "Refer to fraud review", "primary"],
      ["return_customer", "Return to customer", "secondary"], ["fraud_clear", "Clear signature", "primary"], ["fraud_hold", "Hold for callback", "secondary"],
      ["fraud_confirm", "Confirm forgery", "danger"], ["approve", "Approve and release", "approve"], ["return_maker", "Return for correction", "secondary"], ["reject", "Reject", "danger"],
    ];
    return defs.map(([key, label, kind]) => Object.assign({ key, label, kind, needsNote: !!NOTE_MIN[key] }, can(user, c, key)));
  }

  root.Rules = { STATUS, toMYR, approvalLevel, levelWho, requiredSigs, dueAt, can, perform, actionsFor, NOTE_MIN };
})(typeof window !== "undefined" ? window : globalThis);
