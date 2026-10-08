/* Verification rules, kept separate from the UI so the logic is easy to explain and review.
   Input : extracted signatures, reference signature per signatory, mandate and threshold.
   Output: per-signature scores, mandate check and one overall verdict. */
(function () {
  const VERDICT = {
    pass: { pill: "pass", title: "Likely match", text: "All signatures match the mandate. The instruction can continue through the bank's normal approval process." },
    review: { pill: "review", title: "Suspicious — manual review", text: "At least one signature is below the pass score or could not be compared reliably. Flag for further verification." },
    mandate: { pill: "fail", title: "Signing mandate not satisfied", text: "The signatures present do not meet the account's signing rule, even though the signatures that exist look genuine." },
  };

  function evaluate(o) {
    const { sigs, parties, refs, required, threshold } = o;
    const rows = sigs.map((s, i) => {
      const scores = {};
      parties.forEach((p) => { scores[p.id] = ASV.compare(s.canvas, refs[p.id]); });
      const ranked = parties.map((p) => ({ id: p.id, score: scores[p.id] })).sort((a, b) => b.score - a.score);
      const declared = s.declared && s.declared !== "auto" ? s.declared : null;
      const matched = declared ? { id: declared, score: scores[declared] } : ranked[0];
      const poor = s.grade === "Poor";
      const pass = matched.score >= threshold && !poor;
      const notes = [];
      if (poor) notes.push("Reliable comparison not possible: " + (s.notes[0] || "low capture quality").toLowerCase() + ".");
      if (declared && ranked[0].id !== declared && ranked[0].score >= threshold) {
        const p = parties.find((x) => x.id === ranked[0].id);
        notes.push("Closer to " + p.name + " than to the declared signatory.");
      }
      if (matched.score < threshold) notes.push("Below the pass score of " + threshold + ". A low score alone does not prove forgery — verify manually.");
      return { index: i, scores, matched, pass, poor, notes };
    });
    const passedParties = new Set(rows.filter((r) => r.pass).map((r) => r.matched.id));
    const distinct = passedParties.size;
    const duplicate = rows.filter((r) => r.pass).length > distinct;
    const mandateMet = distinct >= required;
    let verdict;
    if (!rows.length) verdict = "mandate";
    else if (rows.some((r) => !r.pass)) verdict = "review";
    else if (!mandateMet) verdict = "mandate";
    else verdict = "pass";
    const reasons = [];
    if (!rows.length) reasons.push("No signature was selected on the document.");
    if (duplicate) reasons.push("The same signatory appears more than once; only one signature counts.");
    reasons.push(distinct + " distinct authorised " + (distinct === 1 ? "signatory" : "signatories") + " verified; " + required + " required.");
    return { rows, distinct, required, mandateMet, duplicate, verdict, reasons, threshold };
  }

  window.ASVLogic = { evaluate, VERDICT };
})();
