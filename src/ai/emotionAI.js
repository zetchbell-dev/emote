/**
 * EMOTE — Emotion Sensor
 * Replace implementation later without touching engine or UI.
 */

export async function interpretEmotion(text) {
  const t = text.toLowerCase();

  if (t.length < 4) {
    return { emotion: "silent", intensity: 0.3, confidence: 0.75 };
  }

  if (t.includes("annoy") || t.includes("angry")) {
    return { emotion: "angry", intensity: 0.7, confidence: 0.8 };
  }

  if (
    t.includes("sad") ||
    t.includes("tired") ||
    t.includes("nothing")
  ) {
    return { emotion: "sad", intensity: 0.7, confidence: 0.85 };
  }

  return { emotion: "happy", intensity: 0.4, confidence: 0.6 };
}
