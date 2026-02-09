export function updateEmotionField(prev, ai, deltaMs = 1000) {
  const next = { ...prev };

  // ⏳ time-aware decay
  const decayFactor = Math.pow(0.85, deltaMs / 2000);

  Object.keys(next).forEach((k) => {
    next[k] *= decayFactor;
  });

  // 🔼 add pressure
  next[ai.emotion] += ai.intensity;

  // 🤫 silent emergence
  if (ai.intensity < 0.35) {
    next.silent += 0.15;
  }

  if (ai.emotion !== "silent") {
    next.silent *= 0.9;
  }

  return clamp(next);
}

export function getDominantEmotion(field, current) {
  const sorted = Object.entries(field).sort((a, b) => b[1] - a[1]);

  const [top, second] = sorted;

  // 🧘 inertia threshold
  if (top[1] - second[1] < 0.12) {
    return current;
  }

  return top[0];
}

function clamp(field) {
  Object.keys(field).forEach((k) => {
    field[k] = Math.max(0, Math.min(1, field[k]));
  });
  return field;
}
