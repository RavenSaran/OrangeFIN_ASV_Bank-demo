/* Verification rules, kept separate from the UI so the logic is easy to explain and review.
   Input : extracted signatures, reference signature per signatory, mandate, and the pass score
           (one number, or a function that gives the pass score for each signatory).
   Output: per-signature scores and bands, the mandate check, and one overall verdict.
   Bands for one signature: match (at or above its pass score), borderline (below it), high risk (far below it, if the band is on). */
(function () {
  const VERDICT = {
    pass: { pill: "pass", title: "Likely match", text: "All signatures match the mandate. The instruction can continue through the bank's normal approval process." },
    review: { pill: "review", title: "Suspicious, manual review", text: "At least one signature is below the pass score or could not be compared reliably. Flag for further verification." },
    mandate: { pill: "fail", title: "Signing mandate not satisfied", text: "The signatures present do not meet the account's signing rule, even though the signatures that exist look genuine." },
  };

  function evaluate(o) {
    const { sigs, parties, refs, required } = o, S = o.settings || {};
    const thrFor = typeof o.threshold === "function" ? o.threshold : () => o.threshold;
    const highBelow = S.highRiskOn ? S.highRiskBelow : null, margin = S.marginOn ? S.marginPoints : null, poorBlocks = S.poorForcesReview !== false;
    const rows = sigs.map((s, i) => {
      const scores = {};
      // a signatory can have several specimens on file; the closest one counts, and is remembered so the screen can show it
      const closest = {};
      parties.forEach((p) => {
        const list = Array.isArray(refs[p.id]) ? refs[p.id] : [refs[p.id]], all = list.map((r) => ASV.compare(s.canvas, r)), top = Math.max(...all);
        scores[p.id] = top; closest[p.id] = all.indexOf(top);
      });
      const ranked = parties.map((p) => ({ id: p.id, score: scores[p.id] })).sort((a, b) => b.score - a.score);
      const declared = s.declared && s.declared !== "auto" ? s.declared : null;
      const matched = declared ? { id: declared, score: scores[declared] } : ranked[0];
      const thr = thrFor(matched.id), poor = s.grade === "Poor", notes = [];
      const other = ranked.find((r) => r.id !== matched.id), nameOf = (id) => parties.find((x) => x.id === id).name;
      // a signature that matches someone else about as well as the signatory it is attributed to is ambiguous
      const ambiguous = margin != null && matched.score >= thr && !!other && other.score >= thr && matched.score - other.score <= margin;
      const band = matched.score >= thr ? "match" : highBelow != null && matched.score < highBelow ? "high" : "borderline";
      const pass = matched.score >= thr && !(poor && poorBlocks) && !ambiguous;
      if (poor) notes.push("Reliable comparison not possible: " + (s.notes[0] || "low capture quality").toLowerCase() + ".");
      if (declared && ranked[0].id !== declared && ranked[0].score >= thr) notes.push("Closer to " + nameOf(ranked[0].id) + " than to the declared signatory.");
      if (ambiguous) notes.push("Matches " + nameOf(other.id) + " almost as well (" + other.score + "). Confirm who signed.");
      if (band === "high") notes.push("High risk: far below the pass score of " + thr + ". This is likely a forgery, but only an analyst can confirm it.");
      else if (band === "borderline") notes.push("Below the pass score of " + thr + ". A low score alone does not prove forgery, so verify manually.");
      return { index: i, scores, matched, pass, poor, notes, thr, band, ambiguous, refIdx: closest[matched.id] };
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
    return { rows, distinct, required, mandateMet, duplicate, verdict, reasons, threshold: rows.length ? rows[0].thr : thrFor(null), highRisk: rows.some((r) => r.band === "high") };
  }

  window.ASVLogic = { evaluate, VERDICT };
})();
