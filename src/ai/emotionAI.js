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
 * 2. NEGATIVE polarity is routed to `angry` or `sad` based on keyword
 *    nuance instead of always defaulting to `sad`.
 *
 * Phase 2 change (§1 AI performance):
 * The actual transformer forward pass (`model(text)`) now runs in a
 * Web Worker (./emotionWorker.js) instead of on the main thread — see
 * that file's header for why. Everything in this file that doesn't
 * need the model (greetings/silent short-circuits, keyword nuance,
 * targeted-attack detection) is synchronous, cheap, and stays here
 * unchanged; only the `{label, score}` lookup is delegated out.
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
    const { id, type, label, score, message } = event.data ?? {};
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);

    if (type === "error") {
      entry.reject(new Error(message));
    } else {
      entry.resolve({ type, label, score });
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
      "sentiment-analysis",
      "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
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

async function classify(text) {
  if (supportsWorker) {
    const result = await callWorker("classify", text);
    return { label: result.label, score: result.score };
  }
  const model = await getDirectModel();
  const result = await model(text);
  return { label: result[0].label, score: result[0].score };
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
// NOTE: `ugly` moved out of `sad` and into `angry` — "you are ugly"
// directed at someone is an insult, not a self-report of sadness.
const KEYWORDS = {
  angry: [
    "hate", "angry", "mad", "furious",
    "stupid", "idiot", "damn", "shit", "fuck", "ugly"
  ],
  sad: [
    "sad", "hurt", "lonely", "tired",
    "depressed", "cry", "miserable"
  ],
  happy: [
    "love", "great", "amazing", "awesome",
    "fantastic", "perfect", "beautiful"
  ],
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
 * Which emotion bucket does this text's keywords most suggest?
 * Checked angry → sad → happy, so an insult wins a tie over an
 * incidental sad-adjacent word.
 */
function detectNuance(text) {
  const lower = text.toLowerCase();
  for (const key of ["angry", "sad", "happy"]) {
    if (KEYWORDS[key].some((w) => lower.includes(w))) return key;
  }
  return null;
}

/* =====================================================
   MAIN INTERPRETER (MULTI-FORCE)
   Returns: { happy, sad, angry, confidence, source }
===================================================== */
export async function interpretEmotion(text) {
  if (!text?.trim()) {
    return { happy: 0, sad: 0, angry: 0, confidence: 1, source: "empty" };
  }

  const lower = text.toLowerCase().trim();

  if (GREETINGS.includes(lower)) {
    return { happy: 0.6, sad: 0, angry: 0, confidence: 0.9, source: "greeting-override" };
  }

  if (SILENT_WORDS.includes(lower)) {
    return { happy: 0, sad: 0, angry: 0, confidence: 0.8, source: "silent-short" };
  }

  try {
    const { label, score } = await classify(text);

    let happy = 0;
    let sad = 0;
    let angry = 0;

    // 1) Base polarity — NEGATIVE is routed by nuance instead of
    //    always defaulting to `sad`.
    if (label === "POSITIVE") {
      happy += score;
    } else if (label === "NEGATIVE") {
      const nuance = detectNuance(text);
      if (nuance === "angry") {
        angry += score;
      } else {
        sad += score; // unmatched negative text still defaults to sad
      }
    }

    // 2) Targeted personal attack amplification (family + insult).
    if (detectTargetedAttack(text)) {
      angry += Math.max(score, 0.8);
    }

    // 3) Keyword nuance layer — additive, lets multiple forces be
    //    active at once (e.g. text that's both sad and a little angry).
    for (const [emotion, words] of Object.entries(KEYWORDS)) {
      if (words.some((w) => lower.includes(w))) {
        if (emotion === "happy") happy += 0.4;
        if (emotion === "sad") sad += 0.4;
        if (emotion === "angry") angry += 0.4;
      }
    }

    return {
      happy: clamp01(happy),
      sad: clamp01(sad),
      angry: clamp01(angry),
      confidence: score,
      source: supportsWorker ? "hf-transformers-worker" : "hf-transformers",
    };
  } catch (err) {
    console.warn("⚠️ ML inference failed:", err);
    return { happy: 0, sad: 0.3, angry: 0, confidence: 0.4, source: "fallback" };
  }
}
