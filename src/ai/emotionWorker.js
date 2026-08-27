// src/ai/emotionWorker.js
/**
 * EMOTE — AI Perception Layer (Web Worker)
 *
 * Runs Hugging Face Transformers.js in a dedicated worker so model
 * loading and inference never block the UI thread.
 *
 * BUGFIX (runtime crash — TypeError: Cannot read properties of
 * undefined (reading 'length') at emotionAI.js's `scores.length`):
 * this file was still running the Phase 1 binary sentiment model
 * (`Xenova/distilbert-base-uncased-finetuned-sst-2-english`,
 * single top-1 `{label, score}` result) and posting that back as
 * `{id, type: "result", label, score}`, while emotionAI.js's main
 * thread (Phase 2/3) was already reading `event.data.scores` — a
 * key this file never sent — from every worker response. That
 * `undefined` propagated: worker.onmessage → classify()'s
 * `result.scores` → interpretEmotion()'s `scores` → the crash.
 * Fixed by moving this file onto the same 28-label GoEmotions model
 * and `scores`-array message shape emotionAI.js's direct (non-worker)
 * fallback already used — the worker and direct paths were meant to
 * be behaviorally identical (see emotionAI.js's file header), they'd
 * just drifted out of sync.
 */

import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

const CACHE_NAME = "transformers-cache"; // literal cache name Transformers.js writes to internally

let classifier = null;
let loadingPromise = null;

/**
 * Loads the sentiment model.
 *
 * If `env.useBrowserCache` has persisted a corrupted response (e.g. an
 * HTML error page cached in place of a JSON model file — see
 * huggingface/transformers.js#1296), `pipeline()` throws a SyntaxError
 * when it tries to JSON.parse that cached body. That corruption survives
 * reloads and never self-heals on its own, so on that specific failure
 * we clear the named cache once and retry exactly once. Any other error
 * (real network failure, genuine 404, etc.) is not retried and propagates
 * normally.
 */
async function createPipeline() {
  const args = [
    "text-classification",
    "SamLowe/roberta-base-go_emotions-onnx",
    { dtype: "q8" },
  ];

  try {
    return await pipeline(...args);
  } catch (err) {
    // A corrupted-cache JSON.parse failure is always a SyntaxError,
    // regardless of the engine's exact message text (Chromium: "is not
    // valid JSON", Firefox: "JSON.parse: unexpected character...",
    // Safari: "JSON Parse error: Unexpected identifier..."). Checking
    // the error type instead of matching message text keeps recovery
    // working across browsers.
    const isJsonParseFailure =
      err instanceof SyntaxError || err?.name === "SyntaxError";

    if (!isJsonParseFailure) {
      throw err;
    }

    console.warn(
      "[EMOTE] Corrupted Transformers cache detected. Clearing cache and retrying..."
    );

    try {
      await caches.delete(CACHE_NAME);
    } catch (cacheErr) {
      console.warn("[EMOTE] Failed to clear cache:", cacheErr);
    }

    // Retry exactly once. If this also fails, let it propagate — we
    // don't want a silent infinite retry loop if something else is wrong.
    return await pipeline(...args);
  }
}

function getModel() {
  if (classifier) {
    return Promise.resolve(classifier);
  }

  if (!loadingPromise) {
    loadingPromise = createPipeline()
      .then((model) => {
        classifier = model;
        return model;
      })
      .catch((err) => {
        // Allow future attempts if loading failed.
        loadingPromise = null;
        throw err;
      });
  }

  return loadingPromise;
}

self.onmessage = async (event) => {
  const { id, type, text } = event.data ?? {};

  try {
    switch (type) {
      case "preload": {
        await getModel();
        self.postMessage({
          id,
          type: "ready",
        });
        break;
      }

      case "classify": {
        const model = await getModel();

        // top_k: null → every label's independent score (multi-label
        // GoEmotions), matching what emotionAI.js's direct-call
        // fallback already requests and what computeForces()/
        // computeEdge() expect to receive.
        const scores = await model(text, { top_k: null });

        // TEMPORARY DEBUG LOG (1): exact model output before postMessage.
        console.log("[emotionWorker.js] model output:", JSON.stringify(scores));

        const payload = { id, type: "result", scores };

        // TEMPORARY DEBUG LOG (2): exact object passed to postMessage().
        console.log("[emotionWorker.js] postMessage payload:", JSON.stringify(payload));

        self.postMessage(payload);
        break;
      }

      default:
        self.postMessage({
          id,
          type: "error",
          message: `Unknown worker message type: ${type}`,
        });
    }
  } catch (err) {
    self.postMessage({
      id,
      type: "error",
      message: String(err?.message ?? err),
    });
  }
};
