// src/config/emotionConfig.js
/**
 * Central tuning knobs for the emotion engine.
 * Consumed by: engine/emotionField.js, engine/composite.js,
 * engine/dominance.js, engine/clampEmotion.js.
 */
export const EMOTION_CONFIG = {
  /* FIELD DYNAMICS */
  // CALIBRATION FIX (transition audit): was 0.95. At the old value, a
  // typical 6s reply gap only decayed a prior emotion by ~14%
  // (0.95^3 = 0.857) — far slower than a single message's injection
  // builds one up (often 0.85-1.0 in one turn). That mismatch is what
  // produced the "too sticky" / "happy doesn't feel dominant" reports:
  // traced concretely, one saturated angry (1.000) still out-scored a
  // genuinely strong happy reply 6s later (0.857 vs 0.850) — dominance.js
  // was correctly rejecting a near-tie, but the near-tie itself was an
  // artifact of decay lagging injection, not a real ambiguity in the
  // input. 0.75 was chosen by solving for a clean single-turn flip at
  // typical reply cadence: 0.75^2.5 ≈ 0.5 at 5s, 0.75^4 ≈ 0.32 at 8s —
  // comfortably clearing DOMINANCE_THRESHOLD/HYSTERESIS_THRESHOLD
  // against a fresh opposing injection in one hop, while still leaving
  // same-emotion continuations fully reinforced each turn by injection
  // (decay only matters when the *next* message doesn't re-top it up).
  // DOMINANCE_THRESHOLD/HYSTERESIS_THRESHOLD are unchanged: they were
  // correctly rejecting the false near-tie, not miscalibrated.
  TIME_DECAY_FACTOR: 0.75,
  DECAY_INTERVAL_MS: 2000,

  GAIN_MULTIPLIER: {
    happy: 0.85,
    sad: 1.0,
    angry: 1.0,
  },

  /* DOMINANCE SELECTION */
  DOMINANCE_THRESHOLD: 0.12,
  HYSTERESIS_THRESHOLD: 0.08,
  // A composite must beat the strongest base emotion by this factor
  // before it's allowed to become the displayed dominant emotion.
  // This is what stops composites from steamrolling a correct plain
  // happy/sad/angry reading (audit §2.1).
  DOMINANCE_MARGIN: 1.05,

  // DOMINANCE MARGIN AUDIT (real-replay + 33-fixture measurement, see
  // scripts/margin-analysis.mjs and scripts/analyze.mjs from the
  // debugging session).
  //
  // CORRECTION found only by actually running the numbers: DOMINANCE_
  // MARGIN values below 1.0 are inert and cannot fix a composite that's
  // losing. dominance.js's candidate pool always contains happy/sad/
  // angry at their true normalized values (untouched by margin), so a
  // composite can only ever top the sort by exceeding topBaseValue
  // outright — the margin only ever raises that bar (margin > 1), never
  // lowers it. A first attempt at this fix set per-composite margins
  // below 1.0 for bittersweet/sarcastic/conflicted; measuring before/
  // after proved that change had ZERO effect on the regression suite
  // (still 29/33, identical failures) — confirming empirically, not
  // just algebraically, that margin was never what was blocking them.
  // Reverted; recorded here so the same wrong turn isn't repeated.
  //
  // What the numbers actually show: in every fixture/replay case where a
  // composite "should" have won and didn't (bittersweet, conflicted,
  // sarcastic, frustrated), its raw value was already LESS than the top
  // base value — not narrowly gated out, just numerically smaller. That
  // ceiling comes from blend2/blend3's shape in composite.js (off-limits
  // per the brief without further evidence): break-even requires the
  // composite's weaker input to be >= ~76.6% of its stronger input
  // (solving r*(1+0.4r)=1 for COMPOSITE_BLEND_STRENGTH=0.4), independent
  // of DOMINANCE_MARGIN entirely. Measured real/fixture balance ratios
  // for these cases cluster 0.48-0.87 — mostly below that break-even
  // line. This is a composite-formula ceiling, not a dominance.js bug,
  // and is out of scope for this change (flagged as a follow-up).
  //
  // The ONE place DOMINANCE_MARGIN genuinely matters is when a
  // composite's ratio is already > 1 (already winning the sort outright)
  // — margin > 1 is what can still legitimately block it. That's a real,
  // measured problem for `anxious`: fixtures/frames whose ground truth
  // is frustrated or overwhelmed measured anxious at ratio 1.05-1.24
  // (i.e. already beating the base AND clearing the old 1.05 margin)
  // while genuine anxious fixtures measure 1.43-1.64 — cleanly
  // separable ranges. Raising anxious's margin above the false-positive
  // ceiling (1.243) is a real, validated fix.
  DOMINANCE_MARGIN_OVERRIDES: {
    anxious: 1.30,
  },

  MIN_CONFIDENCE_TO_CHANGE: 0.7,
  EMOTION_LOCK_DURATION: 900,

  /* COMPOSITE EMOTIONS */
  // How strongly overlap between base emotions gets amplified into a
  // composite value. 0 = raw overlap only, 1 = the original (too
  // aggressive — routinely saturated to 1.0, see audit) behavior.
  COMPOSITE_BLEND_STRENGTH: 0.4,

  // COMPOSITE BLEND STRENGTH AUDIT (regression-fixture measurement,
  // see the calibration session that produced this override map).
  //
  // blend2(a,b) = min(a,b) * (1 + (min/max)*S) can only out-rank
  // max(a,b) by dominance margin M when the balance ratio
  // r = min/max clears r*(1+rS) >= M, i.e. S >= (M/r - 1)/r. At the
  // shared S=0.4, that break-even sits at r ≈ 0.80 (blend3: similar,
  // slightly higher for 3-way). Four composites' *real, measured*
  // fixture ratios fall short of that line even though the input text
  // is genuinely a case of that composite emotion — not noise, not a
  // gating problem (their COMPOSITE_THRESHOLD gates already pass):
  //   bittersweet: r ≈ 0.48  (sadness/disappointment outweigh
  //     optimism in GAIN_MULTIPLIER-weighted space even for text a
  //     person would call bittersweet)
  //   conflicted:  r ≈ 0.68  (3-way blend3, close to the line)
  //   frustrated:  r ≈ 0.78  (very close; the composite already beats
  //     max(a,b) outright, it just doesn't clear the 1.05 margin)
  //   sarcastic:   r ≈ 0.63  (happy*0.9 discount plus a moderate
  //     angry/happy split keeps it well under the line)
  // Each override below is the minimum S (solved from the measured
  // r and that composite's own required margin) that clears its own
  // fixtures, plus a small (~3%) safety margin — not a round number
  // picked by trial and error. disgust/anxious/overwhelmed are NOT
  // overridden: their fixtures already clear the shared S=0.4 line
  // (measured r well above 0.80), so widening them further would only
  // add unjustified risk of collateral collisions (see composite.js's
  // ANXIOUS_FRUSTRATED energy gate for the one real collision this
  // change did surface, with frustrated's own override).
  COMPOSITE_BLEND_STRENGTH_OVERRIDES: {
    bittersweet: 2.7,
    conflicted: 0.9,
    frustrated: 0.5,
    sarcastic: 1.2,
  },

  // Minimum *normalized* share (proportion of total emotional energy,
  // not raw magnitude) each input needs before a composite is even
  // considered. This was already defined before the refactor but
  // never actually read by the engine — it's wired in now via
  // engine/composite.js.
  // PHASE3: every value below was recalibrated against
  // scripts/run-validation.mjs's actual computed normalized shares
  // (33-fixture suite spanning all 11 emotions), not guessed. Two
  // systematic effects showed up in that data and explain why several
  // numbers moved:
  //  1. GAIN_MULTIPLIER.happy (0.85) plus FORCE_MAP's happy-leaning
  //     weights topping out below 1.0 for common labels (gratitude
  //     0.8, optimism 0.8, admiration 0.7) means happy's realistic
  //     normalized share in genuinely-mixed text lands ~0.30–0.40,
  //     not ~0.45-0.50 — thresholds requiring 0.40+ on happy were
  //     rejecting real balanced input, not just noise.
  //  2. See composite.js's PHASE3 note: the anxious/frustrated
  //     discount factor change (0.6→0.9) narrows their natural
  //     operating range toward tighter sad/angry balance, so their
  //     gates were loosened on the *other* axis to compensate.
  COMPOSITE_THRESHOLD: {
    // Loosened from 0.45/0.45: with the FORCE_MAP disgust label split
    // (§ emotionAI.js PHASE3 note) and mixed real messages rarely
    // landing at a razor's-edge 50/50, 0.45 was rejecting genuinely
    // disgust-shaped input. 0.32 is the lowest share observed across
    // the suite's disgust fixtures, rounded down slightly for margin.
    disgust: { sad: 0.32, angry: 0.32 },
    // Loosened from 0.50/0.30 to match the narrower but real window
    // opened by the 0.9 discount factor (see composite.js) — anxious
    // now needs sad and angry close together, not sad alone dominant.
    anxious: { sad: 0.35, angry: 0.30 },
    frustrated: { angry: 0.35, sad: 0.30 },
    // Loosened from 0.40/0.40 per effect (1) above.
    bittersweet: { happy: 0.30, sad: 0.35 },
    // happy loosened from 0.35 per effect (1); angry loosened
    // slightly since the 0.8→0.9 formula change (composite.js) needs
    // angry a bit lower to leave room for happy's share in a genuine
    // 50/50 sarcastic split.
    sarcastic: { happy: 0.30, angry: 0.40 },
    // Loosened from 0.35/0.35/0.35 per effect (1) — happy is the
    // binding constraint in 3-way balance for the same GAIN_MULTIPLIER
    // reason.
    conflicted: { happy: 0.22, sad: 0.25, angry: 0.25 },
    // No happy requirement — see composite.js: overwhelmed's real
    // gates are the energy floor and happy cap below, not a share
    // minimum on sad/angry individually beyond "genuinely present".
    overwhelmed: { sad: 0.30, angry: 0.30 },
  },

  // PHASE2/3: minimum pre-normalization total energy (happy+sad+angry,
  // each already 0..1) required before `overwhelmed` can fire at all.
  // Calibrated against the suite: overwhelmed fixtures' raw energy
  // ranged ~1.30–1.47; disgust/frustrated fixtures (which should NOT
  // read as overwhelmed) topped out ~1.0. 1.1 sits between the two
  // observed clusters.
  OVERWHELMED_ENERGY_THRESHOLD: 1.1,

  // PHASE3 addition: overwhelmed additionally requires happy's
  // normalized share to stay below this cap. Without it, genuine
  // 3-way "conflicted" text (high energy across all three axes) was
  // winning as "overwhelmed" instead, since the energy gate alone
  // doesn't check for an offsetting positive component. Calibrated so
  // the suite's conflicted fixtures (happy share 0.25–0.31) clear the
  // cap while true overwhelmed fixtures (happy share 0, all suite
  // cases) stay well under it. Kept strictly below conflicted's
  // `happy: 0.22` gate above so the two composites' admission windows
  // don't overlap at the boundary.
  OVERWHELMED_HAPPY_CAP: 0.18,

  // HIDDEN-LATENT addition (perception/composite audit, Option B):
  // overwhelmed additionally requires the perception layer's `edge`
  // signal (disgust/fear flavor, see emotionAI.js's EDGE_MAP) to stay
  // at or below this cap — high-energy, low-happy text that's ALSO
  // strongly disgust/fear-flavored should read as disgust, not
  // overwhelmed. Calibrated against the fixture suite: overwhelmed
  // fixtures (diffuse sad+angry, no disgust/fear label activity) carry
  // edge ≈ 0; disgust fixtures carry edge ≈ 0.6–0.95. 0.35 sits well
  // clear of both clusters.
  OVERWHELMED_EDGE_CAP: 0.35,

  // HIDDEN-LATENT addition: disgust's value at edge=0 (as a fraction
  // of its old, edge-blind value) — see composite.js's inline comment
  // on the `disgust` formula for the full reasoning. 0.3 was chosen so
  // edge-less negative-affect text (frustration, diffuse overwhelm)
  // drops disgust below anxious/frustrated/overwhelmed's own values in
  // their respective regions, while true disgust-labeled text (edge
  // well above 0) keeps the large majority of its old strength.
  DISGUST_EDGE_FLOOR: 0.3,

  // HIDDEN-LATENT addition: edge value at which disgust reaches its
  // full (undiscounted) strength — below this it ramps linearly from
  // DISGUST_EDGE_FLOOR. Genuinely disgust-labeled text rarely produces
  // edge = 1.0 even at a strong model score (EDGE_MAP's own weights
  // and the noise floor keep it a bit under the raw label score), so
  // requiring edge = 1.0 for full strength was leaving true disgust
  // fixtures (edge ≈ 0.85–0.95 in the suite) a few points short of
  // clearing DOMINANCE_MARGIN over the competing base emotion. 0.7
  // is comfortably below that observed cluster.
  DISGUST_EDGE_REF: 0.7,

  // HIDDEN-LATENT addition: anxious/frustrated must NOT fire once
  // `edge` gets this high — high edge means the text is genuinely
  // disgust-flavored (see DISGUST_EDGE_FLOOR above), and disgust's own
  // 0.9-style balance can still occasionally land numerically below
  // anxious/frustrated's for a given (sad, angry) ratio even after the
  // edge-based discount (audit §2.1's peak-crowding is a property of
  // blend2's shape, not something the edge discount alone removes).
  // Gating anxious/frustrated out entirely above this line is what
  // actually guarantees disgust wins its own territory instead of
  // just usually winning it. 0.5 sits well clear of both the fixture
  // suite's anxious cluster (edge ≈ 0.3–0.4, real but moderate
  // fear/nervousness signal) and its disgust cluster (edge ≈ 0.6–0.95).
  ANXIOUS_FRUSTRATED_EDGE_CAP: 0.5,

  // HIDDEN-LATENT addition: anxious/frustrated must also require happy
  // share to stay low, same rationale as OVERWHELMED_HAPPY_CAP above —
  // without it, genuine three-way "conflicted" text (meaningful happy
  // AND sad AND angry) can still numerically out-blend `conflicted`'s
  // own three-way formula on a pure sad/angry technicality, the same
  // failure mode PHASE3 already fixed for `overwhelmed`. Calibrated
  // against the suite: conflicted fixtures carry happy share 0.30–0.35;
  // genuine anxious/frustrated fixtures carry ~0.
  ANXIOUS_FRUSTRATED_HAPPY_CAP: 0.2,

  /* LINGUISTIC CUE LAYER (Layer 2) */
  // Minimum Layer-2 cue confidence (engine/linguisticCues.js) required
  // for a composite to bypass its own COMPOSITE_THRESHOLD admission
  // gate this turn. This does NOT bypass dominance.js's
  // DOMINANCE_THRESHOLD/HYSTERESIS_THRESHOLD or any of composite.js's
  // internal formula-level gates (anxiousFrustratedGateOk, overwhelmed's
  // energy/happy/edge checks) — those are untouched. It only lets a
  // cue-only signal (e.g. a flat-affect 5-item enumeration, where every
  // individual clause's transformer share is too low to clear
  // COMPOSITE_THRESHOLD.overwhelmed) still be admitted as a candidate
  // for dominance instead of being zeroed out by passesGate(). 0.75
  // is deliberately high: only detectLinguisticCues()'s highest-
  // confidence tier (explicit sarcasm idiom, 5+ item enumeration,
  // strongly-corroborated cognitive-uncertainty phrasing) clears it —
  // its lower tiers (0.4–0.6) still need the transformer's own share
  // to independently clear the gate.
  CUE_STRONG_THRESHOLD: 0.75,

  /* TIMELINE */
  TIMELINE_INTERVAL: 1000,
  TIMELINE_MAX_POINTS: 80,
};
