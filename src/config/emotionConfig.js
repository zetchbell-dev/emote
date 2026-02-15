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
  TIME_DECAY_FACTOR: 0.95,
  DECAY_INTERVAL_MS: 2000,

  GAIN_MULTIPLIER: {
    happy: 0.85,
    sad: 1.0,
    angry: 1.0,
  },

  DOMINANCE_THRESHOLD: 0.12,
  HYSTERESIS_THRESHOLD: 0.08,
  MIN_CONFIDENCE_TO_CHANGE: 0.7,
  EMOTION_LOCK_DURATION: 900,

  /* COMPOSITE THRESHOLDS */
  COMPOSITE_THRESHOLD: {
  // Strong sadness + strong anger
  disgust: { sad: 0.45, angry: 0.45 },

  // High sadness + medium anger
  anxious: { sad: 0.50, angry: 0.30 },

  // High anger + medium sadness
  frustrated: { angry: 0.50, sad: 0.30 },

  // Happiness + sadness tension
  bittersweet: { happy: 0.40, sad: 0.40 },

  // Light happy + rising anger
  sarcastic: { happy: 0.35, angry: 0.45 },

  // All elevated
  overwhelmed: { happy: 0.35, sad: 0.35, angry: 0.35 },

  conflicted: { happy: 0.30, sad: 0.30, angry: 0.30 },
},


  /* TIMELINE */
  TIMELINE_INTERVAL: 1000,
  TIMELINE_MAX_POINTS: 80,
};
