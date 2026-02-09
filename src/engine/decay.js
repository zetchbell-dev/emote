export function decayEmotionField(field) {
  const next = {};
  for (let k in field) {
    next[k] = field[k] * 0.96;
  }
  return next;
}
