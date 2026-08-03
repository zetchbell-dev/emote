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
 */
import { EMOTION_CONFIG } from "../config/emotionConfig";

const { COMPOSITE_THRESHOLD, COMPOSITE_BLEND_STRENGTH } = EMOTION_CONFIG;

export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/** Normalize {happy, sad, angry} to proportions summing to 1 (or all 0). */
export function normalizeBase({ happy = 0, sad = 0, angry = 0 }) {
  const total = happy + sad + angry;
  if (total <= 0) return { happy: 0, sad: 0, angry: 0 };
  return { happy: happy / total, sad: sad / total, angry: angry / total };
}

/** Two-force blend: overlap between a and b, amplified toward balance. */
function blend2(a, b) {
  const overlap = Math.min(a, b);
  const maxVal = Math.max(a, b);
  if (maxVal === 0) return 0;
  const balance = overlap / maxVal; // 1 = perfectly balanced, 0 = one-sided
  return overlap * (1 + balance * COMPOSITE_BLEND_STRENGTH);
}

/** Three-force blend, same idea across happy/sad/angry. */
function blend3(a, b, c) {
  const minVal = Math.min(a, b, c);
  const maxVal = Math.max(a, b, c);
  if (maxVal === 0) return 0;
  const balance = minVal / maxVal;
  return minVal * (1 + balance * COMPOSITE_BLEND_STRENGTH);
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
 * Compute every composite from the current base emotions.
 * `base` is the raw (unnormalized) { happy, sad, angry } field.
 * Returns { bittersweet, disgust, anxious, frustrated, sarcastic,
 *           conflicted, overwhelmed } — each 0..1.
 */
export function computeComposites(base) {
  const n = normalizeBase(base);

  const raw = {
    bittersweet: blend2(n.happy, n.sad),
    disgust: blend2(n.sad, n.angry),
    // "medium" partner weighted down vs. disgust's "strong" partner,
    // so disgust naturally outranks anxious/frustrated when both
    // base emotions are genuinely strong (not just moderate).
    anxious: blend2(n.sad, n.angry * 0.6),
    frustrated: blend2(n.angry, n.sad * 0.6),
    sarcastic: blend2(n.happy * 0.8, n.angry),
    conflicted: blend3(n.happy, n.sad, n.angry),
    overwhelmed: blend3(n.happy * 0.9, n.sad * 0.9, n.angry * 0.9),
  };

  const gated = {};
  for (const [key, value] of Object.entries(raw)) {
    gated[key] = passesGate(key, n) ? clamp01(value) : 0;
  }
  return gated;
}
