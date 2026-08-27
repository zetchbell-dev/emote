// src/engine/emotionField.js
/**
 * Emotion field state machine.
 *
 * - updateEmotionField(): applies time-based decay to the base
 *   emotions, injects the AI's new per-emotion forces, then derives
 *   composite emotions from the result.
 * - getDominantEmotion(): re-exported from ./dominance so existing
 *   `import { updateEmotionField, getDominantEmotion } from
 *   "./emotionField"` call sites don't need to change.
 *
 * Split out of one large file into emotionField.js (state transition),
 * composite.js (composite math), and dominance.js (selection) — see
 * audit §3.2. Each piece now has one job and can be read/tuned on
 * its own instead of scrolling through hundreds of lines of prior
 * commented-out iterations to find the version that's actually live.
 *
 * HIDDEN LATENT SIGNAL (perception/composite audit, Option B): the
 * one line below passing `ai?.edge` into `computeComposites` is the
 * single required touch to this file. `edge` is deliberately NOT
 * added to `next` (the returned/persisted field) or to `BASE_KEYS`:
 * it's a per-message perception signal consumed only as an input to
 * the composite formulas, not itself a base emotion or a composite —
 * adding it to the persisted field would make dominance.js's generic
 * `Object.entries(field)` candidate loop see it as a composite
 * candidate (it isn't one), which is exactly the kind of change to
 * Dominance the brief asked to avoid. Everything else in this file —
 * decay, base injection, BASE_KEYS — is untouched.
 *
 * LINGUISTIC CUE LAYER: `ai?.cues` (see engine/linguisticCues.js) is
 * forwarded the same way as `edge` and for the same reason — a
 * per-message perception signal, not a base emotion or composite, so
 * it's passed straight through to computeComposites and never added
 * to `next`/`BASE_KEYS` either.
 */
import { EMOTION_CONFIG } from "../config/emotionConfig";
import { computeComposites, clamp01 } from "./composite";

export { getDominantEmotion } from "./dominance";

const BASE_KEYS = ["happy", "sad", "angry"];

export function updateEmotionField(prev, ai, deltaMs = 1000) {
  const next = { ...prev };

  // 1) Time-based decay, base emotions only.
  const decayFactor = Math.pow(
    EMOTION_CONFIG.TIME_DECAY_FACTOR,
    deltaMs / EMOTION_CONFIG.DECAY_INTERVAL_MS
  );
  BASE_KEYS.forEach((k) => {
    next[k] = clamp01((next[k] ?? 0) * decayFactor);
  });

  // 2) Inject the AI's per-emotion forces for this message.
  BASE_KEYS.forEach((k) => {
    const gain = (ai?.[k] ?? 0) * (EMOTION_CONFIG.GAIN_MULTIPLIER?.[k] ?? 1);
    next[k] = clamp01(next[k] + gain);
  });

  // 3) Derive composites from the updated base emotions, plus this
  //    message's hidden latent `edge` signal and Layer-2 linguistic
  //    `cues` (0 / {} respectively for the passive decay tick, which
  //    passes no new text — see composite.js for what each does and
  //    emotionAI.js / engine/linguisticCues.js for what they're
  //    derived from).
  Object.assign(
    next,
    computeComposites(
      { happy: next.happy, sad: next.sad, angry: next.angry },
      ai?.edge ?? 0,
      ai?.cues ?? {}
    )
  );

  return next;
}
