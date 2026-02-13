// // src/engine/clampEmotion.js
// import { EMOTION_CONFIG } from "../config/emotionConfig";

// export function clampEmotion(current, next, confidence) {
//   if (confidence < EMOTION_CONFIG.MIN_CONFIDENCE_TO_CHANGE)
//     return current;

//   if (current === "happy" && next === "angry") return "sad";
//   if (current === "silent" && next === "angry") return "sad";

//   return next;
// }

import { EMOTION_CONFIG } from "../config/emotionConfig";

export function clampEmotion(current, next, confidence) {
  if (confidence < EMOTION_CONFIG.MIN_CONFIDENCE_TO_CHANGE)
    return current;

  if (current === next) return current;

  if (current === "happy" && next === "angry")
    return "sad";

  if (current === "silent" && next === "angry")
    return "sad";

  return next;
}
