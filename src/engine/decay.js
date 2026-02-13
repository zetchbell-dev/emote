// // src/engine/decay.js

// export function decayEmotionField(field) {
//   const next = {};
//   for (let k in field) {
//     next[k] = field[k] * 0.96;
//   }
//   return next;
// }


import { EMOTION_CONFIG } from "../config/emotionConfig";

export function decayEmotionField(field) {
  const next = {};
  for (let k in field) {
    next[k] = field[k] * (1 - (1 - EMOTION_CONFIG.TIME_DECAY_FACTOR) * 0.5);
  }
  return next;
}