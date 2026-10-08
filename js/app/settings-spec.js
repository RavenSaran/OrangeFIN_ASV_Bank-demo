/* What appears on the Settings page, in plain language. One entry per setting: its label, what it does, and how to enter it.
   kind: int, money (MYR), pct, bool, select, time. per: true means one value for each module. nullable: blank means "not set".
   custom: a block with its own layout, drawn by page-settings.js. The values and the rules for them live in settings.js. */
window.SETTINGS_SPEC = {
  score: [
    { title: "Pass score", intro: "Each signature gets a score from 0 to 100 against the specimen. At or above its pass score it matches. Below it, the case is flagged for review.", items: [
      { path: "pass", label: "Bank-wide pass score", help: "The score a signature needs to match. Used everywhere unless one of the rules below says otherwise.", kind: "int", unit: "out of 100", min: 1, max: 99 },
      { path: "passByModule", label: "Pass score for one module", help: "Set a different pass score for a module, for example stricter for payments. Leave blank to use the bank-wide score.", kind: "int", per: true, nullable: true, unit: "out of 100", min: 1, max: 99 },
      { path: "amountOn", label: "Stricter pass score for large amounts", help: "When on, instructions at or above the amount below must reach the pass score below.", kind: "bool" },
      { path: "amountFrom", label: "From this amount", help: "MYR equivalent. An instruction with no exchange rate is treated as large.", kind: "money", unit: "MYR", min: 0 },
      { path: "amountPass", label: "Pass score at this amount", help: "Replaces the module and bank-wide score for these instructions.", kind: "int", unit: "out of 100", min: 1, max: 99 },
      { custom: "signatory" } ] },
    { title: "High risk", intro: "A very low score is more than a doubtful match. This marks it as high risk, which means likely forgery. Only an analyst can confirm a forgery.", items: [
      { path: "highRiskOn", label: "Mark very low scores as high risk", help: "Shows the signature as high risk on the case, in red.", kind: "bool" },
      { path: "highRiskBelow", label: "High risk below", help: "A score under this is high risk. It must be lower than every pass score in use. Scores between this and the pass score are borderline.", kind: "int", unit: "out of 100", min: 1, max: 98 },
      { path: "highRiskNeedsSecond", label: "A high-risk case needs two analysts to clear", help: "Even a small amount then needs a first and a second analyst before it can go to approval.", kind: "bool" } ] },
    { title: "Look-alike check", intro: "Catches a signature that could belong to more than one authorised signatory.", items: [
      { path: "marginOn", label: "Flag a signature that matches another signatory almost as well", help: "When on, the case is flagged if two signatories both pass and their scores are close.", kind: "bool" },
      { path: "marginPoints", label: "Counts as close within", help: "The gap in points between the best match and the next best.", kind: "int", unit: "points", min: 1, max: 50 } ] },
  ],
  amount: [
    { title: "Approval levels", intro: "The amount in MYR (or its equivalent) above which a case needs the next level of approval. Each module has its own limits. The top level has no limit.", items: [{ custom: "levels" }] },
    { title: "When a flag has been cleared", intro: "A case that an analyst cleared after a flag is a higher risk than a clean match.", items: [
      { path: "overrideMinLevel", label: "Lowest level that can approve it", help: "A cleared case needs at least this level, even for a small amount. It never goes above the module's top level.", kind: "select", options: [["1", "Level 1"], ["2", "Level 2"], ["3", "Level 3"]], number: true } ] },
    { title: "Which amounts are verified, and how", intro: "ASV checks every instruction by default. These set where verification is skipped, and where extra human checks are added. Amounts are MYR equivalent. A module's setting applies only to that module.", items: [
      { path: "asvFrom", label: "ASV is required from", help: "Below this amount the officer checks the signature by eye and the case can go straight to approval. 0 means ASV is always required.", kind: "money", per: true, unit: "MYR", min: 0 },
      { path: "reviewFrom", label: "An analyst reviews clean matches from", help: "At or above this amount, even a likely match goes to an analyst, who calls the signatory back, before approval. Leave blank for never.", kind: "money", per: true, nullable: true, unit: "MYR", min: 0 },
      { path: "secondFrom", label: "Two analysts must clear from", help: "At or above this amount, a flagged case needs a first and a different second analyst. Leave blank for never.", kind: "money", per: true, nullable: true, unit: "MYR", min: 0 } ] },
    { title: "Signatures needed by amount", intro: "How many signatories must sign. Some accounts accept fewer signatures up to a limit. Accounts that need every signatory cannot be changed here.", items: [{ custom: "mandates" }] },
    { title: "Currency", intro: "Amounts are converted to MYR to choose the approval level.", items: [
      { path: "unknownCurrency", label: "A currency with no rate", help: "Send it to the module's highest level, or block registration until a rate is added.", kind: "select", options: [["top", "Send to the highest level"], ["block", "Block registration"]] },
      { custom: "fx" } ] },
  ],
  quality: [
    { title: "Grades", intro: "How well the signature could be read from the scan. A Poor capture cannot be compared reliably.", items: [
      { path: "goodMin", label: "Good starts at", help: "Quality points out of 100.", kind: "int", unit: "points", min: 1, max: 100 },
      { path: "fairMin", label: "Fair starts at", help: "Below this the capture is Poor.", kind: "int", unit: "points", min: 0, max: 99 },
      { path: "poorForcesReview", label: "A Poor capture forces a manual review", help: "When on, a Poor capture can never pass automatically, whatever its score.", kind: "bool" } ] },
    { title: "What takes points off", intro: "Each problem found on the scan reduces the quality score by this many points.", items: [
      { path: "small", label: "Signature is small", help: "The signature is shorter than the small-signature limit below.", kind: "int", unit: "points", min: 0, max: 100 },
      { path: "faint", label: "Very faint strokes", help: "The ink is too light to read well.", kind: "int", unit: "points", min: 0, max: 100 },
      { path: "edge", label: "Touches the page edge", help: "The signature may have been cut off.", kind: "int", unit: "points", min: 0, max: 100 },
      { path: "overlap", label: "Overlaps other writing", help: "A stamp, text or another signature touches it.", kind: "int", unit: "points", min: 0, max: 100 } ] },
    { title: "Size", intro: "Measured in pixels on the scan, after it is scaled to a standard width.", items: [
      { path: "minHeight", label: "Smallest height counted as a signature", help: "Marks shorter than this are treated as printed text, not a signature.", kind: "int", unit: "pixels", min: 20, max: 120 },
      { path: "smallBelow", label: "Treat as small below", help: "A signature shorter than this loses the small-signature points.", kind: "int", unit: "pixels", min: 10, max: 120 } ] },
  ],
  process: [
    { title: "Service targets", intro: "Hours from registration to completion. A new target applies to cases registered afterwards.", items: [
      { path: "sla", label: "Service target", help: "A case still open after this is shown as overdue.", kind: "int", per: true, unit: "hours", min: 1, max: 168 } ] },
    { title: "Notes and callbacks", intro: "What staff must record when they make a decision.", items: [
      { custom: "noteMin" },
      { path: "callbackRequired", label: "A callback reference is needed to clear a flag", help: "When on, the analyst must enter the reference of the call to the customer.", kind: "bool" } ] },
    { title: "Sign-in and sessions", intro: "", items: [
      { path: "sessionMinutes", label: "Idle sign-out", help: "A person is signed out after this long without activity.", kind: "int", unit: "minutes", min: 1, max: 120 },
      { path: "lockTries", label: "Failed sign-in attempts before a lock", help: "", kind: "int", unit: "attempts", min: 1, max: 10 },
      { path: "lockMinutes", label: "Lock time", help: "How long a staff ID stays locked.", kind: "int", unit: "minutes", min: 1, max: 120 } ] },
    { title: "Other checks", intro: "", items: [
      { path: "duplicateDays", label: "Duplicate payment window", help: "Corporate payment: the same payee and amount within this many days is flagged as a possible duplicate.", kind: "int", unit: "days", min: 1, max: 365 },
      { path: "specimenWarnYears", label: "Warn when specimens are older than", help: "Shown when registering. The customer should refresh their specimen cards. 0 turns the warning off.", kind: "int", unit: "years", min: 0, max: 20 } ] },
  ],
  module: [
    { title: "Fixed deposit", intro: "", items: [
      { path: "minLeft", label: "Minimum balance left in a deposit", help: "An upliftment cannot leave less than this, unless it takes the whole deposit.", kind: "money", unit: "deposit currency", min: 0 },
      { path: "interestKeptPct", label: "Interest kept on early withdrawal", help: "The share of the interest earned on the amount uplifted that the customer still receives.", kind: "pct", unit: "percent", min: 0, max: 100 } ] },
    { title: "TT and remittance", intro: "", items: [
      { path: "cutoff", label: "Same-day cut-off", help: "Instructions approved after this time take the next business day. Use 24-hour time, such as 15:30.", kind: "time" },
      { path: "screeningRule", label: "Watchlist match rule", help: "Contains: the beneficiary name includes a watchlist entry. Exact: the whole name must equal an entry.", kind: "select", options: [["contains", "Name contains an entry"], ["exact", "Name equals an entry"]] },
      { custom: "watchlist" } ] },
  ],
};
