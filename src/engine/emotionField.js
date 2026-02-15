// // src/engine/emotionField.js

// export function updateEmotionField(prev, ai, deltaMs = 1000) {
//   const next = { ...prev };

//   /* -----------------------------
//      Time-aware decay
//   ----------------------------- */
//   const decayFactor = Math.pow(0.85, deltaMs / 2000);

//   Object.keys(next).forEach((k) => {
//     next[k] *= decayFactor;
//   });

//   /* -----------------------------
//      Add emotion pressure
//   ----------------------------- */
//   const gain =
//   ai.emotion === "happy" ? ai.intensity * 0.7 : ai.intensity;

// next[ai.emotion] += gain;


//   /* -----------------------------
//      Silent emergence (soft)
//   ----------------------------- */
//   if (ai.emotion === "silent") {
//   next.silent += ai.intensity * 0.6;
// }


//   // If user is expressive, gently reduce silent
//   if (ai.emotion === "happy") {
//   next.silent *= 0.75;
// }


//   return clamp(next);
// }

// /* =============================
//    DOMINANT EMOTION LOGIC
//    🔴 THIS IS THE FIX
// ============================= */
// export function getDominantEmotion(field, current) {
//   const sorted = Object.entries(field).sort((a, b) => b[1] - a[1]);
//   const [top, second] = sorted;

//   /* ---------------------------------
//      ✅ ALLOW FIRST EXIT FROM SILENT
//   --------------------------------- */
//   if (current === "silent" && top[0] !== "silent") {
//     return top[0];
//   }

//   /* ---------------------------------
//      Inertia (after first change)
//   --------------------------------- */
//   if (top[1] - second[1] < 0.08) {
//     return current;
//   }

//   return top[0];
// }

// /* -----------------------------
//    Clamp field values
// ----------------------------- */
// function clamp(field) {
//   Object.keys(field).forEach((k) => {
//     field[k] = Math.max(0, Math.min(1, field[k]));
//   });
//   return field;
// }



// // src/engine/emotionField.js
// import { EMOTION_CONFIG } from "../config/emotionConfig";

// export function updateEmotionField(prev, ai, deltaMs = 1000) {
//   const next = { ...prev };

//   const decayFactor = Math.pow(
//     EMOTION_CONFIG.TIME_DECAY_FACTOR,
//     deltaMs / EMOTION_CONFIG.DECAY_INTERVAL_MS
//   );

//   Object.keys(next).forEach((k) => {
//     next[k] *= decayFactor;
//   });

//   const gain =
//     ai.intensity *
//     (EMOTION_CONFIG.GAIN_MULTIPLIER[ai.emotion] ?? 1);

//   next[ai.emotion] = Math.min(1, next[ai.emotion] + gain);

//   return next;
// }

// export function getDominantEmotion(field, current) {
//   const sorted = Object.entries(field).sort((a, b) => b[1] - a[1]);
//   const [top, second] = sorted;

//   const currentValue = field[current];
//   const topValue = top[1];

//   // allow exit from silent
//   if (current === "silent" && top[0] !== "silent") {
//     if (topValue > EMOTION_CONFIG.DOMINANCE_THRESHOLD) {
//       return top[0];
//     }
//   }

//   // hysteresis
//   if (top[0] !== current) {
//     if (topValue - currentValue < EMOTION_CONFIG.DOMINANCE_THRESHOLD) {
//       return current;
//     }
//   }

//   if (topValue - second[1] < EMOTION_CONFIG.HYSTERESIS_THRESHOLD) {
//     return current;
//   }

//   return top[0];
// }



// src/engine/emotionField.js

// import { EMOTION_CONFIG } from "../config/emotionConfig";
// import { resolveCompositeEmotion } from "./emotionComposite";

// /* =====================================================
//    UPDATE EMOTION FIELD
//    - Time-aware decay
//    - AI pressure injection
//    - Safe clamping
// ===================================================== */
// export function updateEmotionField(prev, ai, deltaMs = 1000) {
//   const next = { ...prev };

//   /* -----------------------------
//      Time-based exponential decay
//   ----------------------------- */
//   const decayFactor = Math.pow(
//     EMOTION_CONFIG.TIME_DECAY_FACTOR,
//     deltaMs / EMOTION_CONFIG.DECAY_INTERVAL_MS
//   );

//   Object.keys(next).forEach((k) => {
//     next[k] *= decayFactor;
//   });

//   /* -----------------------------
//      AI pressure injection
//   ----------------------------- */
//   const gain =
//     ai.intensity *
//     (EMOTION_CONFIG.GAIN_MULTIPLIER?.[ai.emotion] ?? 1);

//   if (ai.emotion in next) {
//     next[ai.emotion] += gain;
//   }

//   return clampBaseEmotions(next);
// }

// /* =====================================================
//    DOMINANT EMOTION LOGIC
//    - Composite priority
//    - Silent escape logic
//    - Dominance threshold
//    - Hysteresis protection
// ===================================================== */
// export function getDominantEmotion(field, current) {
//   // 1️⃣ Composite first (disgust etc.)
//   const composite = resolveCompositeEmotion(field);
//   if (composite) return composite;

//   const entries = Object.entries(field);

//   if (!entries.length) return current;

//   const sorted = entries.sort((a, b) => b[1] - a[1]);
//   const [top, second = [null, 0]] = sorted;

//   const currentValue = field[current] ?? 0;
//   const topValue = top[1];

//   /* -----------------------------
//      Controlled exit from silent
//   ----------------------------- */
//   if (current === "silent" && top[0] !== "silent") {
//     if (topValue > EMOTION_CONFIG.DOMINANCE_THRESHOLD) {
//       return top[0];
//     }
//   }

//   /* -----------------------------
//      Dominance threshold guard
//   ----------------------------- */
//   if (top[0] !== current) {
//     if (
//       topValue - currentValue <
//       EMOTION_CONFIG.DOMINANCE_THRESHOLD
//     ) {
//       return current;
//     }
//   }

//   /* -----------------------------
//      Hysteresis (anti flicker)
//   ----------------------------- */
//   if (
//     topValue - second[1] <
//     EMOTION_CONFIG.HYSTERESIS_THRESHOLD
//   ) {
//     return current;
//   }

//   return top[0];
// }

// /* =====================================================
//    Clamp only base emotions
//    (protects future composite expansions)
// ===================================================== */
// function clampBaseEmotions(field) {
//   const BASE_EMOTIONS = ["happy", "sad", "angry", "silent"];

//   BASE_EMOTIONS.forEach((k) => {
//     if (k in field) {
//       field[k] = Math.max(0, Math.min(1, field[k]));
//     }
//   });

//   return field;
// }


// src/engine/emotionField.js

// import { EMOTION_CONFIG } from "../config/emotionConfig";
// import { resolveCompositeEmotion } from "./emotionComposite";

// /* =====================================================
//    UPDATE FIELD
//    - Applies time-based decay
//    - Injects AI pressure safely
// ===================================================== */
// export function updateEmotionField(prev, ai, deltaMs = 1000) {
//   const next = { ...prev };

//   /* -----------------------------
//      1️⃣ Time-based exponential decay
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

//   // 🔒 Only inject valid base emotions
//   if (ai?.emotion && ai.emotion in next) {
//     next[ai.emotion] = Math.min(1, next[ai.emotion] + gain);
//   }

//   return next;
// }

// /* =====================================================
//    DOMINANT EMOTION LOGIC
//    Architecture: Composite → Base Dominance
// ===================================================== */
// export function getDominantEmotion(field, current) {
//   const {
//     happy = 0,
//     sad = 0,
//     angry = 0,
//   } = field;

//   /* -----------------------------
//      1️⃣ Total emotional energy
//   ----------------------------- */
//   const totalEnergy = happy + sad + angry;

//   /* -----------------------------
//      2️⃣ Silent is natural rest state
//   ----------------------------- */
//   if (totalEnergy < 0.15) {
//     return "silent";
//   }

//   /* -----------------------------
//      3️⃣ Composite resolution
//   ----------------------------- */
//   const composite = resolveCompositeEmotion(field);
  
//   // 🔒 If currently composite, require stronger reason to exit
//   if (current && composite === current) {
//     return current;
//   }

//   if (composite && current !== composite) {
//     return composite;
//   }


//   /* -----------------------------
//      4️⃣ Normalize energies
//   ----------------------------- */
//   const normalized = {
//     happy: happy / totalEnergy,
//     sad: sad / totalEnergy,
//     angry: angry / totalEnergy,
//   };

//   const sorted = Object.entries(normalized)
//     .sort((a, b) => b[1] - a[1]);

//   const [topEmotion, topValue] = sorted[0];
//   const [, secondValue = 0] = sorted[1] ?? [];

//   /* -----------------------------
//      5️⃣ Hysteresis protection
//   ----------------------------- */
//   if (current !== "silent" && current in normalized) {
//     const currentValue = normalized[current];

//     if (
//       topEmotion !== current &&
//       topValue - currentValue < EMOTION_CONFIG.DOMINANCE_THRESHOLD
//     ) {
//       return current;
//     }
//   }

//   if (
//     topValue - secondValue <
//     EMOTION_CONFIG.HYSTERESIS_THRESHOLD
//   ) {
//     return current;
//   }

//   return topEmotion;
// }

import { EMOTION_CONFIG } from "../config/emotionConfig";
import { resolveCompositeEmotion } from "./emotionComposite";

/* =====================================================
   UPDATE EMOTION FIELD
   - Applies exponential time-based decay
   - Injects AI emotional pressure safely
   - Only base emotions are stored
===================================================== */
export function updateEmotionField(prev, ai, deltaMs = 1000) {
  const next = { ...prev };

  /* -----------------------------
     1️⃣ Time-based decay
  ----------------------------- */
  const decayFactor = Math.pow(
    EMOTION_CONFIG.TIME_DECAY_FACTOR,
    deltaMs / EMOTION_CONFIG.DECAY_INTERVAL_MS
  );

  Object.keys(next).forEach((k) => {
    next[k] *= decayFactor;
  });

  /* -----------------------------
     2️⃣ Safe AI injection
  ----------------------------- */
  const gain =
    (ai?.intensity ?? 0) *
    (EMOTION_CONFIG.GAIN_MULTIPLIER?.[ai?.emotion] ?? 1);

  if (ai?.emotion && ai.emotion in next) {
    next[ai.emotion] = Math.min(1, next[ai.emotion] + gain);
  }

  return next;
}

/* =====================================================
   DOMINANT EMOTION LOGIC
   Architecture:
   1. Silent (low total energy)
   2. Composite (high mixed energy)
   3. Base dominance (normalized + hysteresis)
===================================================== */
export function getDominantEmotion(field, current) {
  const {
    happy = 0,
    sad = 0,
    angry = 0,
  } = field;

  /* -----------------------------
     1️⃣ Total energy
  ----------------------------- */
  const totalEnergy = happy + sad + angry;

/* -----------------------------
   1️⃣ Silent (low energy)
----------------------------- */
if (totalEnergy < 0.15) {
  return "silent";
}

/* -----------------------------
   2️⃣ Normalize BEFORE composite
----------------------------- */
const normalized = {
  happy: happy / totalEnergy,
  sad: sad / totalEnergy,
  angry: angry / totalEnergy,
};

/* -----------------------------
   3️⃣ Composite resolution
   (use normalized values)
----------------------------- */
const composite = resolveCompositeEmotion(normalized);

if (composite) {
  if (current === composite) {
    return current;
  }
  return composite;
}

  const sorted = Object.entries(normalized)
    .sort((a, b) => b[1] - a[1]);

  const [topEmotion, topValue] = sorted[0];
  const [, secondValue = 0] = sorted[1] ?? [];

  /* -----------------------------
     5️⃣ Hysteresis protection
  ----------------------------- */
  if (current in normalized) {
    const currentValue = normalized[current];

    // Prevent small dominance flips
    if (
      topEmotion !== current &&
      topValue - currentValue <
        EMOTION_CONFIG.DOMINANCE_THRESHOLD
    ) {
      return current;
    }
  }

  // Prevent micro-flicker between top two
  if (
    topValue - secondValue <
    EMOTION_CONFIG.HYSTERESIS_THRESHOLD
  ) {
    return current;
  }

  return topEmotion;
}
