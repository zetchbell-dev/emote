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

import { EMOTION_CONFIG } from "../config/emotionConfig";
import { resolveCompositeEmotion } from "./emotionComposite";

/* ==============================
   UPDATE FIELD
============================== */
export function updateEmotionField(prev, ai, deltaMs = 1000) {
  const next = { ...prev };

  const decayFactor = Math.pow(
    EMOTION_CONFIG.TIME_DECAY_FACTOR,
    deltaMs / EMOTION_CONFIG.DECAY_INTERVAL_MS
  );

  Object.keys(next).forEach((k) => {
    next[k] *= decayFactor;
  });

  const gain =
    ai.intensity *
    (EMOTION_CONFIG.GAIN_MULTIPLIER[ai.emotion] ?? 1);

  next[ai.emotion] = Math.min(1, next[ai.emotion] + gain);

  return next;
}

/* ==============================
   DOMINANT EMOTION LOGIC
   Architecture: Composite → Base Dominance
============================== */
export function getDominantEmotion(field, current) {
  // 1️⃣ Composite resolution FIRST (engine-derived only)
  const composite = resolveCompositeEmotion(field);
  if (composite) return composite;

  // 2️⃣ Base dominance fallback
  const entries = Object.entries(field);

  if (!entries.length) return current;

  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [top, second = [null, 0]] = sorted;

  const currentValue = field[current] ?? 0;
  const topValue = top[1];

  // Controlled exit from silent
  if (current === "silent" && top[0] !== "silent") {
    if (topValue > EMOTION_CONFIG.DOMINANCE_THRESHOLD) {
      return top[0];
    }
  }

  // Dominance threshold guard
  if (top[0] !== current) {
    if (
      topValue - currentValue <
      EMOTION_CONFIG.DOMINANCE_THRESHOLD
    ) {
      return current;
    }
  }

  // Hysteresis (anti-flicker)
  if (
    topValue - second[1] <
    EMOTION_CONFIG.HYSTERESIS_THRESHOLD
  ) {
    return current;
  }

  return top[0];
}
