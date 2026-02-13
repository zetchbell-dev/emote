// // src/config/emotionConfig.js

// export const EMOTION_CONFIG = {

//   DECAY_RATE: 0.96,
//   DECAY_INTERVAL_MS: 2000,
//   TIME_DECAY_FACTOR: 0.85,

//   DOMINANCE_THRESHOLD: 0.12,
//   HYSTERESIS_THRESHOLD: 0.08,

//   GAIN_MULTIPLIER: {
//     happy: 0.7,
//     sad: 1.0,
//     angry: 1.0,
//     silent: 0.6,
//   },

//   MIN_CONFIDENCE_TO_CHANGE: 0.7,

//   EMOTION_LOCK_DURATION: 900,
// };


// src/config/emotionConfig.js

export const EMOTION_CONFIG = {
  /* FIELD DYNAMICS */
  TIME_DECAY_FACTOR: 0.85,
  DECAY_INTERVAL_MS: 2000,

  GAIN_MULTIPLIER: {
    happy: 0.7,
    sad: 1.0,
    angry: 1.0,
    silent: 0.6,
  },

  DOMINANCE_THRESHOLD: 0.12,
  HYSTERESIS_THRESHOLD: 0.08,
  MIN_CONFIDENCE_TO_CHANGE: 0.7,
  EMOTION_LOCK_DURATION: 900,

  /* COMPOSITE THRESHOLDS */
  COMPOSITE_THRESHOLD: {
    disgust: { sad: 0.55, angry: 0.55 },
    anxious: { sad: 0.50, silent: 0.45 },
    frustrated: { angry: 0.50, silent: 0.45 },
    bittersweet: { happy: 0.50, sad: 0.50 },
    sarcastic: { happy: 0.45, angry: 0.50 },
    overwhelmed: { happy: 0.40, sad: 0.40, angry: 0.40 },
    conflicted: { happy: 0.35, sad: 0.35, angry: 0.35 },
  },

  /* TIMELINE */
  TIMELINE_INTERVAL: 1000,
  TIMELINE_MAX_POINTS: 80,
};
