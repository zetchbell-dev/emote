// src/engine/linguisticCues.js
/**
 * Linguistic Cue Engine — Layer 2 of the hybrid emotion pipeline.
 *
 * WHY THIS EXISTS:
 * The transformer (GoEmotions) is a single-utterance lexical-semantic
 * classifier: it scores "what emotion word does this sound like,"
 * with no notion of pragmatics. Five composites are specifically
 * pragmatic/structural phenomena that lexical scoring structurally
 * cannot see:
 *   - sarcastic:   surface-positive wording used ironically
 *   - frustrated:  repeated failure over time ("again", "six hours")
 *   - anxious:     hedged, future-conditional worry ("what if...")
 *   - overwhelmed: enumeration/list length, independent of any one
 *                  clause's sentiment
 *   - disgust:     somatic idiom ("makes my skin crawl") rather than
 *                  the literal word "disgusting"
 * No amount of reweighting FORCE_MAP fixes a category of information
 * the model was never given. This module is a SECOND, INDEPENDENT
 * detector over the raw text; composite.js combines its output with
 * the transformer-derived value via noisy-OR (see combineEvidence()
 * below) rather than replacing anything.
 *
 * DESIGN PRINCIPLES:
 *  - Declarative rule table, not an if-else chain.
 *  - Where a pure-text pattern would be too trigger-happy alone
 *    (sarcasm, frustration), the rule requires *corroboration* from
 *    the transformer's own forces — a small nonzero angry/sad share,
 *    not a fixed keyword list doing all the work.
 *  - Where the whole point is that the transformer has nothing to
 *    corroborate with (overwhelmed's enumeration, anxious's hedged
 *    phrasing), the cue is allowed to stand on its own, capped at a
 *    moderate ceiling rather than an instant 1.0.
 *  - Patterns are general syntactic/lexical *families*, not a hand
 *    list of exact example sentences — this is what keeps the engine
 *    from overfitting to any one test suite.
 */

const PATTERNS = {
  intensifier: /\b(very|really|totally|absolutely|extremely|completely|utterly|so)\b/i,
  repetitionMarker: /\b(again|keep|kept|keeps|always|constantly|repeatedly|every time|nothing works|still not|over and over)\b/i,
  quantifiedDuration: /\b\d+\s*(seconds?|minutes?|hours?|days?|weeks?|months?|times?)\b/i,
  cognitiveUncertainty: /\b(what if|can'?t stop (thinking|worrying)|worr(y|ied|ying)|afraid|terrified|nervous|anxious|scared|dread(ing)?)\b/i,
  disgustSomatic: /\b(disgust\w*|revolt\w*|makes? my skin crawl|felt sick|sick to (my|the) stomach|gross|nauseat\w*|repuls\w*|stomach[- ]turning)\b/i,
  sarcasmMarker: /\b(oh (wow|great|wonderful|joy|fantastic)|yeah,? right|totally loved|just what i (needed|wanted)|couldn'?t be happier|another .* that could'?ve been)\b/i,
  positiveExclaim: /\b(wow|great|wonderful|brilliant|fantastic|amazing|lovely|delight\w*|joy\w*)\b/i,
};

/** Count list items via commas / "and" joins — a crude but effective enumeration-length proxy. */
function countListItems(text) {
  const commaSplit = text.split(",").filter((s) => s.trim().length > 0);
  if (commaSplit.length > 1) return commaSplit.length;
  const andSplit = text.split(/\band\b/i).filter((s) => s.trim().length > 0);
  return andSplit.length;
}

function has(re, text) {
  return re.test(text);
}

/**
 * combineEvidence — noisy-OR combination of two independent 0..1
 * confidences. Monotonic, bounded [0,1], treats each signal as
 * independent evidence rather than averaging (averaging would let a
 * strong cue get diluted by a weak/absent transformer score, which
 * is exactly the failure this module exists to fix).
 */
export function combineEvidence(a, b) {
  const x = Math.max(0, Math.min(1, a));
  const y = Math.max(0, Math.min(1, b));
  return 1 - (1 - x) * (1 - y);
}

/**
 * detectLinguisticCues — the declarative rule table.
 * `text` is the raw input. `forces` is the transformer's already-
 * computed { happy, sad, angry } (0..1 each) — used ONLY as a
 * corroboration signal where noted, never as the sole basis for a
 * cue. Returns { sarcastic, frustrated, anxious, overwhelmed, disgust },
 * each 0..1 — the cue-layer confidence, BEFORE combination with the
 * transformer-derived composite value.
 */
export function detectLinguisticCues(text, forces = {}) {
  const t = (text || "").toLowerCase();
  const angry = forces.angry ?? 0;
  const sad = forces.sad ?? 0;

  const cues = { sarcastic: 0, frustrated: 0, anxious: 0, overwhelmed: 0, disgust: 0 };
  if (!t.trim()) return cues;

  // --- sarcastic: surface positivity used ironically. Requires
  // EITHER an explicit sarcasm idiom (high precision on its own) OR
  // (exaggerated positive wording + intensifier) corroborated by a
  // nonzero angry share from the transformer — a sincere compliment
  // has no such corroboration and never fires this.
  if (has(PATTERNS.sarcasmMarker, t)) {
    cues.sarcastic = 0.9;
  } else if (has(PATTERNS.positiveExclaim, t) && has(PATTERNS.intensifier, t) && angry > 0.05) {
    cues.sarcastic = 0.6;
  } else if (has(PATTERNS.positiveExclaim, t) && angry > 0.15) {
    cues.sarcastic = 0.45;
  }

  // --- frustrated: repeated-effort / persistence markers,
  // corroborated by any nonzero angry OR sad share (repeated failure
  // reads as annoyance or as discouragement depending on phrasing —
  // either counts as "something negative is actually going on here").
  const hasPersistence = has(PATTERNS.repetitionMarker, t) || has(PATTERNS.quantifiedDuration, t);
  if (hasPersistence && (angry > 0.05 || sad > 0.05)) {
    cues.frustrated = 0.65;
  } else if (hasPersistence && (angry + sad) > 0) {
    cues.frustrated = 0.4;
  }

  // --- anxious: hedged, future-conditional worry. Strong enough as
  // a standalone pattern to not require corroboration (that's the
  // whole point — GoEmotions under-fires fear on this phrasing), but
  // capped below 1.0 so it never single-handedly saturates; gets a
  // bonus if the transformer independently found some sad share.
  if (has(PATTERNS.cognitiveUncertainty, t)) {
    cues.anxious = sad > 0.1 ? 0.75 : 0.55;
  }

  // --- overwhelmed: enumeration length. Deliberately independent of
  // sentiment corroboration — a flat, low-affect list of burdens is
  // exactly the case the transformer misses (see file header).
  const listItems = countListItems(t);
  if (listItems >= 5) {
    cues.overwhelmed = 0.8;
  } else if (listItems >= 4) {
    cues.overwhelmed = 0.55;
  }

  // --- disgust: somatic-idiom lexicon. Mostly standalone (idioms are
  // high-precision on their own); small bonus if the transformer's
  // sad/angry blend is also elevated.
  if (has(PATTERNS.disgustSomatic, t)) {
    cues.disgust = (angry + sad) > 0.3 ? 0.85 : 0.7;
  }

  return cues;
}
