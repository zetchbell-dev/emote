// src/ai/emotionWorker.js
/**
 * EMOTE — AI Perception Layer (Web Worker)
 *
 * Runs Hugging Face Transformers.js in a dedicated worker so model
 * loading and inference never block the UI thread.
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
    "sentiment-analysis",
    "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
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

        const result = await model(text);

        const { label, score } = result[0];

        self.postMessage({
          id,
          type: "result",
          label,
          score,
        });
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
