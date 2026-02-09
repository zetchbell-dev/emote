export function clampEmotion(current, next, confidence) {
  if (confidence < 0.6) return current;

  if (current === "happy" && next === "angry") return "sad";
  if (current === "silent" && next === "angry") return "sad";

  return next;
}
