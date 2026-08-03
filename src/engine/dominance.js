// src/engine/dominance.js
/**
 * Picks the single "dominant" emotion label that drives the avatar,
 * out of the base emotions (happy/sad/angry) and computed composites,
 * with stability guards so it doesn't flicker between calls.
 *
 * Constraint from the refactor brief: "composite emotions should
 * complement primary emotions instead of incorrectly overriding
 * them." Enforced here via DOMINANCE_MARGIN — a composite has to be
 * genuinely ahead of the strongest base emotion (not just technically
 * the largest number after saturating) before it's allowed to win.
 */
import { EMOTION_CONFIG } from "../config/emotionConfig";
import { normalizeBase } from "./composite";

const { DOMINANCE_THRESHOLD, HYSTERESIS_THRESHOLD, DOMINANCE_MARGIN } = EMOTION_CONFIG;

const BASE_KEYS = ["happy", "sad", "angry"];

export function getDominantEmotion(field, current) {
  const { happy = 0, sad = 0, angry = 0 } = field;
  const baseEnergy = happy + sad + angry;

  // Rest state — not enough emotional energy to say anything at all.
  if (baseEnergy < 0.15) {
    return "silent";
  }

  const normalizedBase = normalizeBase({ happy, sad, angry });
  const topBaseValue = Math.max(normalizedBase.happy, normalizedBase.sad, normalizedBase.angry);

  // Candidates: normalized base emotions, plus composites that clear
  // the dominance margin over the strongest base. Composites that
  // don't clear it are zeroed out here so they can't win the sort
  // below no matter how the earlier gating/blend math scored them.
  const candidates = { ...normalizedBase };
  for (const [key, value] of Object.entries(field)) {
    if (BASE_KEYS.includes(key)) continue;
    candidates[key] = value >= topBaseValue * DOMINANCE_MARGIN ? value : 0;
  }

  const sorted = Object.entries(candidates).sort((a, b) => b[1] - a[1]);
  const [topEmotion, topValue] = sorted[0];
  const [, secondValue = 0] = sorted[1] ?? [];

  const currentValue = candidates[current] ?? 0;

  // If the currently-displayed emotion isn't even a live candidate
  // anymore (e.g. a composite whose gate no longer passes this
  // round), don't let the near-tie hysteresis check below freeze the
  // display on a value that's now 0 — that's strictly worse than
  // picking whichever candidate is actually leading.
  if (currentValue === 0 && topEmotion !== current) {
    return topEmotion;
  }

  // Don't flip unless the new leader is meaningfully ahead of
  // whatever's currently showing.
  if (topEmotion !== current && topValue - currentValue < DOMINANCE_THRESHOLD) {
    return current;
  }

  // Don't flip on a near-tie between the top two candidates.
  if (topValue - secondValue < HYSTERESIS_THRESHOLD) {
    return current;
  }

  return topEmotion;
}
