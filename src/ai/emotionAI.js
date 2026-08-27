// src/ai/emotionAI.js
/**
 * EMOTE — AI Perception Layer
 *
 * Responsibility: turn raw text into a set of per-emotion "forces"
 * ({ happy, sad, angry }). It does NOT decide the avatar's dominant
 * emotion — that's the engine's job (see engine/emotionField.js and
 * engine/dominance.js). This file only perceives.
 *
 * Phase 1 correctness fixes (unchanged in Phase 2, see PHASE1 changelog):
 * 1. `env.useBrowserCache: true` — model loads once per session, not
 *    once per page load.
 *
 * Phase 2 change (§1 AI performance):
 * The actual transformer forward pass (`model(text)`) now runs in a
 * Web Worker (./emotionWorker.js) instead of on the main thread — see
 * that file's header for why. Everything in this file that doesn't
 * need the model (greetings/silent short-circuits, force weighting,
 * targeted-attack detection) is synchronous, cheap, and stays here
 * unchanged; only the label-scores lookup is delegated out.
 *
 * Perception-layer redesign (Phase 1 of the current design doc):
 * The model is now `SamLowe/roberta-base-go_emotions-onnx`, a 28-label
 * multi-label GoEmotions classifier — every call returns an independent
 * sigmoid score per label instead of one POSITIVE/NEGATIVE label+score.
 * `FORCE_MAP` replaces the old literal-keyword dictionary: it's a static
 * table of how strongly each of the 28 labels pushes `{happy, sad,
 * angry}`, and `computeForces()` sums each returned label's score times
 * its weight vector. This is what lets genuinely mixed-sentiment text
 * (e.g. "exhausted but hopeful") produce more than one nonzero force at
 * once — the old binary model was structurally incapable of that,
 * regardless of how many keywords were added to compensate for it.
 *
 * The exported API (`interpretEmotion`, `preloadModel`) and the shape
 * of `interpretEmotion`'s return value are IDENTICAL to before this
 * phase — nothing that imports this file needs to change.
 *
 * Environments without Worker support (SSR, and this project's own
 * Node-based test harness) fall back to running the pipeline directly
 * on the calling thread, same as the pre-Phase-2 code did — so
 * behavior is preserved everywhere, just off the main thread where
 * a main thread (browser) actually exists.
 */
import { pipeline, env } from "@huggingface/transformers";
import { detectLinguisticCues } from "../engine/linguisticCues";

/* =====================================================
   WORKER-BACKED MODEL RUNNER (with direct-call fallback)
===================================================== */
const supportsWorker =
  typeof Worker !== "undefined" && typeof window !== "undefined";

let worker = null;
let nextRequestId = 0;
const pending = new Map(); // id -> { resolve, reject }

function getWorker() {
  if (worker) return worker;

  worker = new Worker(new URL("./emotionWorker.js", import.meta.url), {
    type: "module",
  });

  worker.onmessage = (event) => {
    // TEMPORARY DEBUG LOG (3): full event.data received from the worker.
    console.log("[emotionAI.js] worker.onmessage event.data:", JSON.stringify(event.data));

    const { id, type, scores, message } = event.data ?? {};
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);

    if (type === "error") {
      entry.reject(new Error(message));
    } else {
      entry.resolve({ type, scores });
    }
  };

  worker.onerror = (event) => {
    // A worker-level failure (e.g. script failed to load) — reject
    // every request still in flight so callers fall back gracefully
    // instead of hanging forever.
    for (const [id, entry] of pending) {
      entry.reject(new Error(event.message || "emotion worker failed"));
      pending.delete(id);
    }
  };

  return worker;
}

function callWorker(type, text) {
  return new Promise((resolve, reject) => {
    const id = nextRequestId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, type, text });
  });
}

/* --- Direct (non-worker) fallback — same singleton pattern as before --- */
let directClassifier = null;
let directLoadingPromise = null;

function getDirectModel() {
  if (directClassifier) return Promise.resolve(directClassifier);
  if (!directLoadingPromise) {
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    directLoadingPromise = pipeline(
      "text-classification",
      "SamLowe/roberta-base-go_emotions-onnx",
      { dtype: "q8" }
    )
      .then((m) => {
        directClassifier = m;
        return m;
      })
      .catch((err) => {
        directLoadingPromise = null;
        throw err;
      });
  }
  return directLoadingPromise;
}

/**
 * Returns every label's independent score: [{ label, score }, ...] for
 * all 28 GoEmotions labels (not just the top one) — this model is
 * multi-label, so more than one label can legitimately be high at once.
 */
async function classify(text) {
  if (supportsWorker) {
    const result = await callWorker("classify", text);
    return result.scores;
  }
  const model = await getDirectModel();
  return await model(text, { top_k: null });
}

/**
 * Call once, early (e.g. on app mount), so the model is warm by the
 * time the user submits their first message instead of paying the
 * full load cost on that first submit. Runs in the worker when
 * available so even the initial ~260MB fetch/decompress can't block
 * the main thread or delay first paint.
 */
export function preloadModel() {
  if (supportsWorker) {
    callWorker("preload").catch(() => {});
  } else {
    getDirectModel().catch(() => {});
  }
}

/* =====================================================
   CONSTANTS
===================================================== */
/**
 * FORCE_MAP — replaces the old literal-keyword dictionary.
 *
 * One weight vector per GoEmotions label, describing how strongly a
 * fully-activated (score = 1.0) instance of that label should push
 * each of the three downstream axes. `computeForces()` sums
 * `score * weight` across every label the model returns, so multiple
 * labels contribute simultaneously — this is what lets genuinely mixed
 * text land on more than one axis at once instead of forcing a single
 * bucket choice.
 *
 * Labels that are genuinely ambivalent on the angry/sad axis (fear,
 * disgust, nervousness) are deliberately split across both rather than
 * assigned to one — see the Stage 1 design doc, §3.2 and §4, for the
 * reasoning (this is also how `disgust`'s signal reaches the existing
 * `blend2(sad, angry)` composite without wiring the model's raw
 * `disgust` label through the composite engine directly).
 *
 * Weights below are an informed starting point, not a final tuning —
 * Phase 4 (threshold/force calibration) is where these get adjusted
 * against real measured output, per the validation suite from Phase 2.
 */
export const FORCE_MAP = {
  // --- happy-leaning ---
  admiration: { happy: 0.7 },
  amusement: { happy: 0.9 },
  approval: { happy: 0.5 },
  caring: { happy: 0.6 },
  desire: { happy: 0.5 },
  excitement: { happy: 0.9 },
  gratitude: { happy: 0.8 },
  joy: { happy: 1.0 },
  love: { happy: 1.0 },
  optimism: { happy: 0.8 },
  pride: { happy: 0.8 },
  relief: { happy: 0.6 },

  // --- sad-leaning ---
  disappointment: { sad: 0.8 },
  embarrassment: { sad: 0.6, angry: 0.1 },
  grief: { sad: 1.0 },
  remorse: { sad: 0.8 },
  sadness: { sad: 1.0 },

  // --- angry-leaning ---
  anger: { angry: 1.0 },
  annoyance: { angry: 0.7 },
  disapproval: { angry: 0.6, sad: 0.2 },

  // --- deliberately split (ambivalent on the sad/angry axis) ---
  fear: { sad: 0.6, angry: 0.3 },
  nervousness: { sad: 0.5, angry: 0.2 },
  // PHASE3: rebalanced from {sad:0.4, angry:0.6}. Validation data
  // showed that split reliably produced a normalized sad/angry
  // *share* ratio of roughly 0.65 — below the ~0.80 ratio a 2-force
  // composite needs to ever out-rank its own top base emotion under
  // DOMINANCE_MARGIN (see composite.js's disgust/anxious/frustrated
  // notes) — so pure disgust-labeled text was always losing to a
  // plain "angry" reading despite disgust computing a nonzero value.
  // Closer to balanced without going fully 50/50 (disgust IS supposed
  // to lean angry per the design doc's discussion of the label).
  disgust: { sad: 0.45, angry: 0.55 },

  // --- weak/cognitive signals: small weight so they can nudge a blend
  //     without dominating one on their own ---
  confusion: { sad: 0.2, angry: 0.1 },
  curiosity: { happy: 0.2 },
  realization: { happy: 0.1, sad: 0.1 },
  surprise: { happy: 0.2, sad: 0.1 },

  // --- no valence contribution ---
  neutral: {},
};

// Sigmoid scores for irrelevant labels are rarely exactly zero; ignore
// anything below this so 28 small numbers don't sum into noise.
const FORCE_NOISE_FLOOR = 0.05;

/**
 * EDGE_MAP — the hidden latent signal (perception/composite audit,
 * Option B).
 *
 * FORCE_MAP folds `disgust`, `fear`, and `nervousness` into weighted
 * shares of {sad, angry} so the base mood still reads as roughly the
 * right blend of negative affect (audit §4: this is a known,
 * deliberate fidelity loss). But once that fold happens, `disgust`‑
 * flavored text ("that's revolting") and `fear`‑flavored text ("I'm
 * terrified") and plain annoyance/sadness with NEITHER flavor can all
 * land on the same (or a numerically indistinguishable) `(sad, angry)`
 * point — that's the exact algebraic identity the audit proves in
 * §2.1–2.2 for `disgust`/`anxious`/`frustrated`/`overwhelmed`.
 *
 * `edge` is a second, independent scalar computed from the SAME
 * classify() output, in the SAME pass, using the SAME
 * score-times-weight-above-noise-floor mechanism as `computeForces`
 * — it just answers a different question: not "how sad/angry is
 * this," but "how much of that negativity is specifically
 * disgust/fear‑flavored, as opposed to generic sadness or anger."
 * `disgust` gets the strongest weight (it's the most direct signal
 * of that flavor); `fear`/`nervousness` contribute more weakly, since
 * they're more ambivalent (audit's own framing of why they were
 * split across sad/angry in the first place).
 *
 * Deliberately a plain object literal, not folded into `FORCE_MAP`
 * itself: the brief asked not to modify `FORCE_MAP`, and there's no
 * need to — `edge` reads the same three labels' scores that
 * `FORCE_MAP` already reads, it just weights them into a different
 * output axis. See composite.js for how the four affected composites
 * consume this.
 */
const EDGE_MAP = {
  disgust: 1.0,
  fear: 0.6,
  nervousness: 0.5,
};

const GREETINGS = [
  "hi", "hello", "hey", "yo",
  "good morning", "good evening", "good afternoon"
];

const SILENT_WORDS = ["...", "hmm", "uh", "um", "idk"];

/* =====================================================
   HELPERS
===================================================== */
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function detectTargetedAttack(text) {
  const lower = text.toLowerCase();

  const familyTargets = ["mom", "mother", "dad", "father", "family"];
  const strongInsults = ["ugly", "stupid", "idiot", "worthless"];

  const targetsFamily = familyTargets.some((w) => lower.includes(w));
  const hasStrongInsult = strongInsults.some((w) => lower.includes(w));

  return targetsFamily && hasStrongInsult;
}

/**
 * Turns the model's per-label scores into `{happy, sad, angry}` forces
 * by summing `score * weight` across every label above the noise floor,
 * using FORCE_MAP for the weight vectors. This is the direct replacement
 * for the old keyword-additive layer, but driven by the model's learned
 * semantics instead of hand-maintained literal substrings.
 */
export function computeForces(scores) {
  let happy = 0;
  let sad = 0;
  let angry = 0;

  for (const { label, score } of scores) {
    if (score < FORCE_NOISE_FLOOR) continue;
    const weights = FORCE_MAP[label];
    if (!weights) continue; // unknown label — ignore rather than guess

    happy += score * (weights.happy ?? 0);
    sad += score * (weights.sad ?? 0);
    angry += score * (weights.angry ?? 0);
  }

  return { happy: clamp01(happy), sad: clamp01(sad), angry: clamp01(angry) };
}

/**
 * Computes the hidden latent `edge` signal — see EDGE_MAP above for
 * what it means and why it exists. Same shape as `computeForces`
 * (sum score*weight above the noise floor) but projecting onto a
 * single axis instead of three.
 */
export function computeEdge(scores) {
  let edge = 0;
  for (const { label, score } of scores) {
    if (score < FORCE_NOISE_FLOOR) continue;
    const weight = EDGE_MAP[label];
    if (!weight) continue;
    edge += score * weight;
  }
  return clamp01(edge);
}

/* =====================================================
   MAIN INTERPRETER (MULTI-FORCE)
   Returns: { happy, sad, angry, confidence, source, edge, cues }
   `edge` is the hidden latent signal (see EDGE_MAP above) and `cues`
   is the Layer-2 linguistic-cue confidence map (see
   engine/linguisticCues.js) — both additive to the existing contract.
   Nothing that destructures only {happy, sad, angry, confidence,
   source} needs to change; these are extra fields on the same
   object, not a shape change to the others.
===================================================== */
export async function interpretEmotion(text) {
  if (!text?.trim()) {
    return { happy: 0, sad: 0, angry: 0, confidence: 1, source: "empty", edge: 0, cues: {} };
  }

  const lower = text.toLowerCase().trim();

  if (GREETINGS.includes(lower)) {
    return { happy: 0.6, sad: 0, angry: 0, confidence: 0.9, source: "greeting-override", edge: 0, cues: {} };
  }

  if (SILENT_WORDS.includes(lower)) {
    return { happy: 0, sad: 0, angry: 0, confidence: 0.8, source: "silent-short", edge: 0, cues: {} };
  }

  try {
    const scores = await classify(text); // all 28 label scores, independent

    // TEMPORARY DEBUG LOG (4): what classify() returned, before .length.
    console.log("[emotionAI.js] classify() returned:", JSON.stringify(scores));

    // Defensive check: `scores` should always be a non-empty array of
    // {label, score} — but if a caller (worker or otherwise) is ever
    // out of sync with this contract, fail loudly into the existing
    // catch/fallback below instead of crashing on `scores.length`.
    if (!Array.isArray(scores) || scores.length === 0) {
      throw new Error(
        "classify() returned no scores array — worker/model response " +
          "shape doesn't match the expected {label, score}[] contract."
      );
    }

    // Confidence: the model's strongest single-label signal — same role
    // `score` played before (an overall "how sure was the model" scalar),
    // just derived from a score array instead of being handed one directly.
    const confidence = scores.length
      ? Math.max(...scores.map((s) => s.score))
      : 0;

    // 1) Base forces — weighted sum across every label above the noise
    //    floor (FORCE_MAP), so multiple forces can be active at once
    //    (e.g. text that's genuinely both sad and a little hopeful).
    let { happy, sad, angry } = computeForces(scores);

    // 1b) The hidden latent signal — computed the same pass, same
    //     scores, same mechanism as (1), just a different weighted
    //     projection. See EDGE_MAP for what this preserves and why.
    const edge = computeEdge(scores);

    // 2) Targeted personal attack amplification (family + insult) —
    //    unchanged business rule, now anchored to the model's overall
    //    confidence instead of a single label's score.
    if (detectTargetedAttack(text)) {
      angry = clamp01(angry + Math.max(confidence, 0.8));
    }

    // 3) Layer-2 linguistic cues — a second, independent read of the
    //    SAME raw text (see engine/linguisticCues.js for why: irony,
    //    repetition, hedged hypotheticals, enumeration, and somatic
    //    idiom are pragmatic/structural signals no amount of label
    //    reweighting can recover). `forces` is passed as
    //    corroboration only, per that module's own rules — this call
    //    does not replace or adjust happy/sad/angry/edge above.
    const cues = detectLinguisticCues(text, { happy, sad, angry });

    return {
      happy: clamp01(happy),
      sad: clamp01(sad),
      angry: clamp01(angry),
      confidence,
      source: supportsWorker ? "hf-transformers-worker" : "hf-transformers",
      edge,
      cues,
    };
  } catch (err) {
    console.warn("⚠️ ML inference failed:", err);
    return { happy: 0, sad: 0.3, angry: 0, confidence: 0.4, source: "fallback", edge: 0, cues: {} };
  }
}
