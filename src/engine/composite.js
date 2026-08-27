// src/engine/composite.js
/**
 * Composite emotion math.
 *
 * WHY THIS FILE EXISTS (audit §2.1):
 * The old composite formula operated on raw, independent per-emotion
 * forces (happy/sad/angry), which are NOT a probability distribution —
 * the AI layer can and does return meaningful confidence on more than
 * one axis at once. Composing raw values directly meant two
 * independently-strong-but-unrelated signals could push a composite
 * (most visibly `bittersweet`) to 1.0 and steamroll a base emotion
 * that was actually the correct read (e.g. an insult scoring
 * happy: 0.80 / sad: 0.82 independently, from unrelated causes,
 * making `bittersweet` saturate even though nothing about the text
 * was genuinely bittersweet).
 *
 * Fix, in two parts:
 *  1. Composites are computed from the *normalized* base emotions —
 *     their share of total emotional energy, summing to 1 — instead
 *     of raw magnitudes. Two forces both being independently "high"
 *     no longer implies genuine ambivalence; they have to actually
 *     compete for a shared budget.
 *  2. A composite is only computed at all once its required inputs
 *     clear the tuned thresholds in EMOTION_CONFIG.COMPOSITE_THRESHOLD.
 *     That config already existed but was never read by the engine —
 *     it's wired in here.
 *
 * HIDDEN LATENT SIGNAL (perception/composite audit, Option B):
 * `disgust`, `anxious`, `frustrated`, and `overwhelmed` are all pure
 * functions of the same `(n.sad, n.angry)` pair (audit §1), and two of
 * them — `overwhelmed` and `disgust` — were *exactly* identical
 * whenever `overwhelmed`'s gate passed (audit §2.2, a proven algebraic
 * identity, not a tuning gap). No threshold or discount on
 * `(n.sad, n.angry)` alone can fix that, because a threshold is just
 * another function of the same two already-identical inputs.
 *
 * `computeComposites` now takes a third argument, `edge` — the
 * perception layer's independent signal for "how much of this
 * negativity is specifically disgust/fear‑flavored" (see
 * emotionAI.js's EDGE_MAP), which is exactly the information
 * `FORCE_MAP` discards when it folds `disgust`/`fear`/`nervousness`
 * into shares of sad/angry. `disgust` and `overwhelmed` now key off it
 * directly (§ their inline comments below) — that's what breaks the
 * exact identity: they're no longer the same function of the same
 * inputs, because one of them now has an input the other doesn't.
 * `blend2`/`blend3` and the gating architecture are unchanged, per the
 * brief; only the composites' formula bodies changed.
 */
import { EMOTION_CONFIG } from "../config/emotionConfig";
import { combineEvidence } from "./linguisticCues";

const {
  COMPOSITE_THRESHOLD,
  COMPOSITE_BLEND_STRENGTH,
  COMPOSITE_BLEND_STRENGTH_OVERRIDES = {},
  OVERWHELMED_ENERGY_THRESHOLD,
  OVERWHELMED_HAPPY_CAP,
  OVERWHELMED_EDGE_CAP,
  DISGUST_EDGE_FLOOR,
  DISGUST_EDGE_REF,
  ANXIOUS_FRUSTRATED_EDGE_CAP,
  ANXIOUS_FRUSTRATED_HAPPY_CAP,
  CUE_STRONG_THRESHOLD,
} = EMOTION_CONFIG;

/**
 * The five composites Layer 2 (engine/linguisticCues.js) has a rule
 * for. `bittersweet` and `conflicted` have no cue detector — they're
 * left as pure transformer composites, combined/gated exactly as
 * before.
 */
const CUE_SUPPORTED_COMPOSITES = [
  "sarcastic",
  "frustrated",
  "anxious",
  "overwhelmed",
  "disgust",
];

/** This composite's blend strength: its own override, or the shared default. */
function strengthFor(key) {
  return COMPOSITE_BLEND_STRENGTH_OVERRIDES[key] ?? COMPOSITE_BLEND_STRENGTH;
}

export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/** Normalize {happy, sad, angry} to proportions summing to 1 (or all 0). */
export function normalizeBase({ happy = 0, sad = 0, angry = 0 }) {
  const total = happy + sad + angry;
  if (total <= 0) return { happy: 0, sad: 0, angry: 0 };
  return { happy: happy / total, sad: sad / total, angry: angry / total };
}

/**
 * Two-force blend: overlap between a and b, amplified toward balance.
 * `strength` defaults to the shared COMPOSITE_BLEND_STRENGTH; callers
 * pass a composite-specific override (see COMPOSITE_BLEND_STRENGTH_OVERRIDES
 * / strengthFor above) where the measured fixture data shows the shared
 * value can't reach a genuinely-real reading of that composite. The
 * blend/gating *shape* is unchanged — only the amplification constant
 * varies per composite, same pattern as DOMINANCE_MARGIN_OVERRIDES in
 * dominance.js.
 */
function blend2(a, b, strength = COMPOSITE_BLEND_STRENGTH) {
  const overlap = Math.min(a, b);
  const maxVal = Math.max(a, b);
  if (maxVal === 0) return 0;
  const balance = overlap / maxVal; // 1 = perfectly balanced, 0 = one-sided
  return overlap * (1 + balance * strength);
}

/** Three-force blend, same idea across happy/sad/angry. */
function blend3(a, b, c, strength = COMPOSITE_BLEND_STRENGTH) {
  const minVal = Math.min(a, b, c);
  const maxVal = Math.max(a, b, c);
  if (maxVal === 0) return 0;
  const balance = minVal / maxVal;
  return minVal * (1 + balance * strength);
}

/** Does `normalized` clear every threshold configured for `key`? */
function passesGate(key, normalized) {
  const gate = COMPOSITE_THRESHOLD[key];
  if (!gate) return true; // no gate configured → don't block it
  return Object.entries(gate).every(
    ([emotion, minShare]) => (normalized[emotion] ?? 0) >= minShare
  );
}

/**
 * Is `key`'s admission gate satisfied? Normally this is just
 * `passesGate` (the normalized-share COMPOSITE_THRESHOLD check). A
 * strong, corroborated Layer-2 cue (>= CUE_STRONG_THRESHOLD) may
 * satisfy admission on its own instead — this is the bypass that
 * lets a flat-affect enumeration ("I have exams, assignments, ...")
 * register as `overwhelmed` even though no single clause scores
 * strongly negative on any one share. This bypass touches ONLY this
 * admission gate: it does not affect `raw[key]`'s own formula-level
 * gates above (anxiousFrustratedGateOk, overwhelmed's energy/happy/
 * edge checks — those already flow into `raw[key]` before this
 * function ever runs), and it has no reach into dominance.js's
 * DOMINANCE_THRESHOLD/HYSTERESIS_THRESHOLD, which run afterward on
 * whatever this function returns.
 */
function admitted(key, normalized, cueValue) {
  return passesGate(key, normalized) || cueValue >= CUE_STRONG_THRESHOLD;
}

/**
 * Compute every composite from the current base emotions.
 * `base` is the raw (unnormalized) { happy, sad, angry } field.
 * `edge` is the hidden latent signal from the perception layer
 * (0..1, defaults to 0 for callers that don't have it — e.g. the
 * passive decay tick, which has no new text to perceive an edge
 * from). `cues` is the Layer-2 linguistic-cue confidence map from
 * engine/linguisticCues.js — { sarcastic, frustrated, anxious,
 * overwhelmed, disgust }, each 0..1, defaults to {} for the same
 * reason `edge` defaults to 0. Each supported composite's transformer
 * value and cue value are combined via noisy-OR (combineEvidence);
 * see `admitted()` above for how a strong cue can also bypass that
 * composite's admission gate. Returns { bittersweet, disgust,
 * anxious, frustrated, sarcastic, conflicted, overwhelmed } — each
 * 0..1.
 */
export function computeComposites(base, edge = 0, cues = {}) {
  const n = normalizeBase(base);
  const e = clamp01(edge);

  // Pre-normalization total energy. Used only by `overwhelmed` below —
  // every other composite deliberately works off *shares*, not
  // magnitude, per the file-level comment. Overwhelm is the one
  // exception: it's specifically about absolute intensity ("a lot is
  // going on"), not which axis is winning, so it needs the magnitude
  // signal normalization throws away. See PHASE2 note below.
  const rawEnergy = (base.happy ?? 0) + (base.sad ?? 0) + (base.angry ?? 0);

  // Shared gate for anxious/frustrated (see their formulas below):
  // happy must stay low (conflicted's territory otherwise), edge must
  // stay low (disgust's territory otherwise), AND — new — raw energy
  // must stay under OVERWHELMED_ENERGY_THRESHOLD. Without that last
  // clause, frustrated's post-calibration strength (see
  // COMPOSITE_BLEND_STRENGTH_OVERRIDES) makes it numerically strong
  // enough to also win on a near-perfectly-balanced *high-energy*
  // sad/angry pair — exactly the input overwhelmed already owns.
  // Reusing OVERWHELMED_ENERGY_THRESHOLD (rather than a new constant)
  // is deliberate: it's the same, already-calibrated boundary
  // overwhelmed's own gate uses, so anxious/frustrated and overwhelmed
  // partition the same energy axis instead of each guessing their own
  // cutoff. Measured fixture energies confirm a clean gap: anxious/
  // frustrated ≈ 0.6–0.75, overwhelmed ≈ 1.75–1.85.
  const anxiousFrustratedGateOk =
    n.happy <= ANXIOUS_FRUSTRATED_HAPPY_CAP &&
    e <= ANXIOUS_FRUSTRATED_EDGE_CAP &&
    rawEnergy < OVERWHELMED_ENERGY_THRESHOLD;

  const raw = {
    bittersweet: blend2(n.happy, n.sad, strengthFor("bittersweet")),
    // HIDDEN-LATENT fix (audit §2.1–2.2): previously just
    // `blend2(n.sad, n.angry)` — identical, term for term, to
    // `overwhelmed`'s raw value whenever its gate passed, and the
    // dominant numerical winner across ~74% of the whole sad/angry
    // edge regardless of whether the text actually carried any
    // disgust/fear flavor. Scaling by `edge` ties disgust's strength
    // to the ONE signal that's actually supposed to distinguish it:
    // DISGUST_EDGE_FLOOR (0.3) is the value at edge=0 — sad/angry
    // balance alone still counts for something, since a strong,
    // perfectly-balanced sad+angry blend is mildly disgust-adjacent
    // even with zero measured disgust/fear label activity — scaling
    // linearly up to full strength at edge=1. True disgust-labeled
    // text (edge ~0.6–0.95 in the fixture suite) keeps ~80–95% of its
    // old value; edge-less text (fear-less frustration, diffuse
    // overwhelm — edge ~0 in the fixture suite) drops to 30%, which is
    // what opens real room for anxious/frustrated/overwhelmed/
    // conflicted to win their own regions instead of losing every tie
    // to disgust by construction.
    disgust:
      blend2(n.sad, n.angry) *
      (DISGUST_EDGE_FLOOR + (1 - DISGUST_EDGE_FLOOR) * clamp01(e / DISGUST_EDGE_REF)),
    // PHASE3 fix: discount raised 0.6 → 0.9. Proof (see validation
    // suite notes): with DOMINANCE_MARGIN=1.05 and
    // COMPOSITE_BLEND_STRENGTH=0.4, a 2-force blend2(a, b*k) can only
    // out-rank max(a,b) when the two normalized shares are within a
    // ~0.80 ratio of each other. At k=0.6, solving that inequality
    // for the "secondary share stays below the primary" case has NO
    // solution — meaning anxious/frustrated were mathematically
    // unreachable as the DISPLAYED dominant emotion, not just rare,
    // regardless of how strong the input signal was. k=0.9 opens a
    // narrow (~88.5%+ balance) but real winning window, while still
    // keeping disgust's undiscounted blend2(sad, angry) numerically
    // higher than either in their shared overlap region — so "disgust
    // naturally outranks anxious/frustrated when both are strong"
    // still holds, just with a smaller margin than before.
    // HIDDEN-LATENT additions to both formulas below (audit §2.1's
    // peak-crowding): the pre-existing 0.9 discount alone only ever
    // opened a ~2.9%-margin window against disgust, and said nothing
    // at all about happy or edge — so genuinely disgust-flavored text
    // (edge high) or genuinely three-way "conflicted" text (happy
    // meaningfully present) could still win the anxious/frustrated
    // label purely because its (sad, angry) ratio happened to land
    // near one of these formulas' peaks. Gating both out above
    // ANXIOUS_FRUSTRATED_EDGE_CAP hands that territory to disgust
    // (which is exactly where it belongs once edge is genuinely high);
    // gating both out above ANXIOUS_FRUSTRATED_HAPPY_CAP hands it to
    // conflicted for the same reason `overwhelmed` needed a happy cap.
    // A small edge-proportional boost (capped at the same edge cap) is
    // also applied: real anxious/frustrated fixtures still carry a
    // little fear/nervousness signal even when disgust doesn't win
    // (fixture suite: anxious ≈ 0.3–0.4), and that signal is exactly
    // what should tip a near-tie toward "anxious" over "frustrated"
    // (or vice versa) rather than the tie being settled by whichever
    // of the two blend2 balances happens to be marginally tighter.
    anxious: anxiousFrustratedGateOk
      ? blend2(n.sad, n.angry * 0.9, strengthFor("anxious")) * (1 + e)
      : 0,
    frustrated: anxiousFrustratedGateOk
      ? blend2(n.angry, n.sad * 0.9, strengthFor("frustrated"))
      : 0,
    // PHASE3: 0.8 → 0.9 for the same reachability reason — sarcasm's
    // surface-positivity discount was making it lose dominance to a
    // plain "angry" reading even in genuinely 50/50-balanced cases.
    sarcastic: blend2(n.happy * 0.9, n.angry, strengthFor("sarcastic")),
    conflicted: blend3(n.happy, n.sad, n.angry, strengthFor("conflicted")),
    // PHASE2 fix: the old formula was `blend3(happy*0.9, sad*0.9,
    // angry*0.9)` — a three-way *minimum*, which is mathematically
    // unreachable for pure negative-affect text ("everything feels
    // overwhelming" has ~zero happy, so blend3's min collapses to ~0
    // no matter how strong sad/angry are). That's not a threshold
    // problem, it's the wrong shape of formula: overwhelm doesn't
    // require positivity to be present at all.
    //
    // Overwhelm is instead modeled as high-intensity sad+angry — same
    // two-force mechanism as `disgust` — but additionally gated on
    // raw (pre-normalization) energy being high. That gate is what
    // keeps `overwhelmed` from just becoming a duplicate of `disgust`:
    // disgust only needs *balance* between sad/angry (any magnitude),
    // overwhelmed needs balance-or-not at genuinely high absolute
    // intensity. A mild, evenly-balanced sad+angry blend reads as
    // disgust; only once the total load is high does it escalate to
    // overwhelmed.
    // PHASE3 addition: also require happy share to be low. Validation
    // data showed genuine three-way "conflicted" text (high happy AND
    // high sad AND high angry, high total energy) was mis-winning as
    // "overwhelmed" instead, because the original PHASE2 fix only
    // checked total energy, not composition — it didn't distinguish
    // "no positivity, purely overloaded" from "positivity present but
    // outweighed," which conflicted already owns. Overwhelm is
    // specifically the *absence* of a positive counterweight.
    //
    // HIDDEN-LATENT addition: also require `edge` to stay under
    // OVERWHELMED_EDGE_CAP. This is the other half of the
    // overwhelmed/disgust fix above — without it, high-energy,
    // low-happy text that's ALSO genuinely disgust/fear-flavored
    // (edge high) would still pass every existing overwhelmed gate
    // and collide with disgust the same way as before, just at high
    // energy instead of any energy. Overwhelm is meant to be "diffuse
    // overload with no particular flavor," not "disgust, but a lot of
    // it" — that second case should read as disgust.
    overwhelmed:
      rawEnergy >= OVERWHELMED_ENERGY_THRESHOLD &&
      n.happy <= OVERWHELMED_HAPPY_CAP &&
      e <= OVERWHELMED_EDGE_CAP
        ? blend2(n.sad, n.angry)
        : 0,
  };

  // Combine each cue-supported composite's transformer-derived value
  // with Layer 2's independent text-based confidence via noisy-OR.
  // `raw[key]` is untouched for bittersweet/conflicted (no detector
  // exists for them). Noisy-OR (not averaging) is what lets a strong
  // cue stand on its own when `raw[key]` is 0 — e.g. overwhelmed's
  // own energy/happy/edge gate zeroing it out on genuinely flat-
  // affect text — instead of a strong cue getting diluted toward a
  // weak-or-absent transformer reading.
  const combined = { ...raw };
  for (const key of CUE_SUPPORTED_COMPOSITES) {
    combined[key] = combineEvidence(raw[key], cues[key] ?? 0);
  }

  const gated = {};
  for (const [key, value] of Object.entries(combined)) {
    const cueValue = CUE_SUPPORTED_COMPOSITES.includes(key) ? cues[key] ?? 0 : 0;
    gated[key] = admitted(key, n, cueValue) ? clamp01(value) : 0;
  }
  return gated;
}
