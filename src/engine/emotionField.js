 
// import { EMOTION_CONFIG } from "../config/emotionConfig";
// import { resolveCompositeEmotion } from "./emotionComposite";

// /* =====================================================
//    UPDATE EMOTION FIELD
//    - Applies exponential time-based decay
//    - Injects AI emotional pressure safely
//    - Only base emotions are stored
// ===================================================== */
// export function updateEmotionField(prev, ai, deltaMs = 1000) {
//   const next = { ...prev };

//   /* -----------------------------
//      1️⃣ Time-based decay
//   ----------------------------- */
//   const decayFactor = Math.pow(
//     EMOTION_CONFIG.TIME_DECAY_FACTOR,
//     deltaMs / EMOTION_CONFIG.DECAY_INTERVAL_MS
//   );

//   Object.keys(next).forEach((k) => {
//     next[k] *= decayFactor;
//   });

//   /* -----------------------------
//      2️⃣ Safe AI injection
//   ----------------------------- */
//   const gain =
//     (ai?.intensity ?? 0) *
//     (EMOTION_CONFIG.GAIN_MULTIPLIER?.[ai?.emotion] ?? 1);

//   if (ai?.emotion && ai.emotion in next) {
//     next[ai.emotion] = Math.min(1, next[ai.emotion] + gain);
//   }

//   return next;
// }

// /* =====================================================
//    DOMINANT EMOTION LOGIC
//    Architecture:
//    1. Silent (low total energy)
//    2. Composite (high mixed energy)
//    3. Base dominance (normalized + hysteresis)
// ===================================================== */
// export function getDominantEmotion(field, current) {
//   const {
//     happy = 0,
//     sad = 0,
//     angry = 0,
//   } = field;

//   /* -----------------------------
//      1️⃣ Total energy
//   ----------------------------- */
//   const totalEnergy = happy + sad + angry;

// /* -----------------------------
//    1️⃣ Silent (low energy)
// ----------------------------- */
// if (totalEnergy < 0.15) {
//   return "silent";
// }

// /* -----------------------------
//    2️⃣ Normalize BEFORE composite
// ----------------------------- */
// const normalized = {
//   happy: happy / totalEnergy,
//   sad: sad / totalEnergy,
//   angry: angry / totalEnergy,
// };

// /* -----------------------------
//    3️⃣ Composite resolution
//    (use normalized values)
// ----------------------------- */
// const composite = resolveCompositeEmotion(normalized);

// if (composite) {
//   if (current === composite) {
//     return current;
//   }
//   return composite;
// }

//   const sorted = Object.entries(normalized)
//     .sort((a, b) => b[1] - a[1]);

//   const [topEmotion, topValue] = sorted[0];
//   const [, secondValue = 0] = sorted[1] ?? [];

//   /* -----------------------------
//      5️⃣ Hysteresis protection
//   ----------------------------- */
//   if (current in normalized) {
//     const currentValue = normalized[current];

//     // Prevent small dominance flips
//     if (
//       topEmotion !== current &&
//       topValue - currentValue <
//         EMOTION_CONFIG.DOMINANCE_THRESHOLD
//     ) {
//       return current;
//     }
//   }

//   // Prevent micro-flicker between top two
//   if (
//     topValue - secondValue <
//     EMOTION_CONFIG.HYSTERESIS_THRESHOLD
//   ) {
//     return current;
//   }

//   return topEmotion;
// }


// import { EMOTION_CONFIG } from "../config/emotionConfig";

// /* =====================================================
//    UPDATE EMOTION FIELD (MODEL 3 - NO SILENT BASE)
// ===================================================== */
// export function updateEmotionField(prev, ai, deltaMs = 1000) {
//   const next = { ...prev };

//   /* -----------------------------
//      1️⃣ Decay BASE ONLY
//   ----------------------------- */
//   const decayFactor = Math.pow(
//     EMOTION_CONFIG.TIME_DECAY_FACTOR,
//     deltaMs / EMOTION_CONFIG.DECAY_INTERVAL_MS
//   );

//   const BASE = ["happy", "sad", "angry"];

//   BASE.forEach((k) => {
//     next[k] = clamp01(next[k] * decayFactor);
//   });

//   /* -----------------------------
//     2️⃣ Multi-force AI injection
//   ----------------------------- */
//   next.happy = clamp01(
//     next.happy + (ai?.happy ?? 0) *
//     (EMOTION_CONFIG.GAIN_MULTIPLIER?.happy ?? 1)
//   );

//   next.sad = clamp01(
//     next.sad + (ai?.sad ?? 0) *
//     (EMOTION_CONFIG.GAIN_MULTIPLIER?.sad ?? 1)
//   );

//   next.angry = clamp01(
//     next.angry + (ai?.angry ?? 0) *
//     (EMOTION_CONFIG.GAIN_MULTIPLIER?.angry ?? 1)
//   );


//   /* -----------------------------
//      3️⃣ Composite energies
//   ----------------------------- */
//   const COMPOSITE_BOOST = 1.08; // small dominance bias


//   next.bittersweet =
//   clamp01(composite(next.happy, next.sad) * COMPOSITE_BOOST);

// next.disgust =
//   clamp01(composite(next.sad, next.angry) * COMPOSITE_BOOST);

// next.sarcastic =
//   clamp01(composite(next.happy * 0.8, next.angry) * COMPOSITE_BOOST);

// next.conflicted =
//   clamp01(composite(
//     next.happy,
//     next.sad,
//     next.angry
//   ) * COMPOSITE_BOOST);

// next.overwhelmed =
//   clamp01(composite(
//     next.happy * 0.9,
//     next.sad * 0.9,
//     next.angry * 0.9
//   ) * COMPOSITE_BOOST);


//   // Without silent base:
//   // anxious, frustrated, tired no longer make sense
//   // unless you reintroduce silent tension.

//   return next;
// }

// /* =====================================================
//    DOMINANT EMOTION
// ===================================================== */
// export function getDominantEmotion(field, current) {

//   const {
//     happy = 0,
//     sad = 0,
//     angry = 0,
//   } = field;

//   const baseEnergy = happy + sad + angry;

//   /* -----------------------------
//      Rest state (silent)
//   ----------------------------- */
//   if (baseEnergy < 0.15) {
//     return "silent";
//   }

//   /* -----------------------------
//      Sort ALL energies
//   ----------------------------- */
//   const sorted = Object.entries(field)
//     .sort((a, b) => b[1] - a[1]);

//   const [topEmotion, topValue] = sorted[0];
//   const [, secondValue = 0] = sorted[1] ?? [];

//   const currentValue = field[current] ?? 0;

//   /* Dominance guard */
//   if (
//     topEmotion !== current &&
//     topValue - currentValue <
//       EMOTION_CONFIG.DOMINANCE_THRESHOLD
//   ) {
//     return current;
//   }

//   /* Hysteresis */
//   if (
//     topValue - secondValue <
//     EMOTION_CONFIG.HYSTERESIS_THRESHOLD
//   ) {
//     return current;
//   }

//   return topEmotion;
// }

// /* ===================================================== */

// function composite(...values) {
//   return Math.min(...values);
// }

// function clamp01(v) {
//   return Math.max(0, Math.min(1, v));
// }



import { EMOTION_CONFIG } from "../config/emotionConfig";

/* =====================================================
   UPDATE EMOTION FIELD
   - Base decay
   - Multi-force AI injection
   - Balance-weighted composite (Model 3 Proper)
===================================================== */
export function updateEmotionField(prev, ai, deltaMs = 1000) {
  const next = { ...prev };

  /* -----------------------------
     1️⃣ Decay BASE ONLY
  ----------------------------- */
  const decayFactor = Math.pow(
    EMOTION_CONFIG.TIME_DECAY_FACTOR,
    deltaMs / EMOTION_CONFIG.DECAY_INTERVAL_MS
  );

  const BASE = ["happy", "sad", "angry"];

  BASE.forEach((k) => {
    next[k] = clamp01((next[k] ?? 0) * decayFactor);
  });

  /* -----------------------------
     2️⃣ Multi-force AI injection
  ----------------------------- */
  next.happy = clamp01(
    next.happy + (ai?.happy ?? 0) *
    (EMOTION_CONFIG.GAIN_MULTIPLIER?.happy ?? 1)
  );

  next.sad = clamp01(
    next.sad + (ai?.sad ?? 0) *
    (EMOTION_CONFIG.GAIN_MULTIPLIER?.sad ?? 1)
  );

  next.angry = clamp01(
    next.angry + (ai?.angry ?? 0) *
    (EMOTION_CONFIG.GAIN_MULTIPLIER?.angry ?? 1)
  );

  /* -----------------------------
     3️⃣ Composite energies
     (Balance-weighted Model 3)
  ----------------------------- */

  next.bittersweet =
    clamp01(balanceComposite(next.happy, next.sad));

  next.disgust =
    clamp01(balanceComposite(next.sad, next.angry));

  next.sarcastic =
    clamp01(balanceComposite(next.happy * 0.8, next.angry));

  next.conflicted =
    clamp01(balanceComposite3(
      next.happy,
      next.sad,
      next.angry
    ));

  next.overwhelmed =
    clamp01(balanceComposite3(
      next.happy * 0.9,
      next.sad * 0.9,
      next.angry * 0.9
    ));

  return next;
}

/* =====================================================
   DOMINANT EMOTION
   - Silent if low base energy
   - Sort all energies
   - Apply dominance threshold + hysteresis
===================================================== */
export function getDominantEmotion(field, current) {

  const {
    happy = 0,
    sad = 0,
    angry = 0,
  } = field;

  const baseEnergy = happy + sad + angry;

  /* -----------------------------
     Silent = rest state
  ----------------------------- */
  if (baseEnergy < 0.15) {
    return "silent";
  }

  /* -----------------------------
     Sort ALL energies
  ----------------------------- */
  const sorted = Object.entries(field)
    .sort((a, b) => b[1] - a[1]);

  const [topEmotion, topValue] = sorted[0];
  const [, secondValue = 0] = sorted[1] ?? [];

  const currentValue = field[current] ?? 0;

  /* -----------------------------
     Dominance threshold
  ----------------------------- */
  if (
    topEmotion !== current &&
    topValue - currentValue <
      EMOTION_CONFIG.DOMINANCE_THRESHOLD
  ) {
    return current;
  }

  /* -----------------------------
     Hysteresis protection
  ----------------------------- */
  if (
    topValue - secondValue <
    EMOTION_CONFIG.HYSTERESIS_THRESHOLD
  ) {
    return current;
  }

  return topEmotion;
}

/* =====================================================
   Helpers
===================================================== */

function balanceComposite(a, b) {
  const overlap = Math.min(a, b);
  const maxVal = Math.max(a, b);
  if (maxVal === 0) return 0;

  const balance = overlap / maxVal;
  return overlap * (1 + balance);
}

function balanceComposite3(a, b, c) {
  const minVal = Math.min(a, b, c);
  const maxVal = Math.max(a, b, c);
  if (maxVal === 0) return 0;

  const balance = minVal / maxVal;
  return minVal * (1 + balance);
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
