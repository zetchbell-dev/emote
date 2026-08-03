// src/config/emotionConfig.js
/**
 * Central tuning knobs for the emotion engine.
 * Consumed by: engine/emotionField.js, engine/composite.js,
 * engine/dominance.js, engine/clampEmotion.js.
 */
export const EMOTION_CONFIG = {
  /* FIELD DYNAMICS */
  TIME_DECAY_FACTOR: 0.95,
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

  MIN_CONFIDENCE_TO_CHANGE: 0.7,
  EMOTION_LOCK_DURATION: 900,

  /* COMPOSITE EMOTIONS */
  // How strongly overlap between base emotions gets amplified into a
  // composite value. 0 = raw overlap only, 1 = the original (too
  // aggressive — routinely saturated to 1.0, see audit) behavior.
  COMPOSITE_BLEND_STRENGTH: 0.4,

  // Minimum *normalized* share (proportion of total emotional energy,
  // not raw magnitude) each input needs before a composite is even
  // considered. This was already defined before the refactor but
  // never actually read by the engine — it's wired in now via
  // engine/composite.js.
  COMPOSITE_THRESHOLD: {
    disgust: { sad: 0.45, angry: 0.45 },
    anxious: { sad: 0.50, angry: 0.30 },
    frustrated: { angry: 0.50, sad: 0.30 },
    bittersweet: { happy: 0.40, sad: 0.40 },
    sarcastic: { happy: 0.35, angry: 0.45 },
    overwhelmed: { happy: 0.35, sad: 0.35, angry: 0.35 },
    conflicted: { happy: 0.30, sad: 0.30, angry: 0.30 },
  },

  /* TIMELINE */
  TIMELINE_INTERVAL: 1000,
  TIMELINE_MAX_POINTS: 80,
};
