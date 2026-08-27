import { computeForces, computeEdge } from "../src/ai/emotionAI.js";
import { updateEmotionField, getDominantEmotion } from "../src/engine/emotionField.js";
import { clampEmotion } from "../src/engine/clampEmotion.js";
import { FIXTURES } from "../src/fixtures.mjs";

let pass = 0;
const fails = [];

for (const fx of FIXTURES) {
  const forces = computeForces(fx.scores);
  const edge = computeEdge(fx.scores);
  const field = updateEmotionField({ happy: 0, sad: 0, angry: 0 }, { ...forces, edge }, 1000);
  const dominant = getDominantEmotion(field, "silent");
  const clamped = clampEmotion("silent", dominant, 1.0);

  const ok = clamped === fx.expect;
  if (ok) {
    pass++;
  } else {
    fails.push({ expect: fx.expect, got: clamped, text: fx.text, field, forces });
  }
}

console.log(`\n${pass} / ${FIXTURES.length} passed\n`);

if (fails.length) {
  console.log("FAILURES:");
  for (const f of fails) {
    console.log(`\n- expected "${f.expect}", got "${f.got}" — "${f.text}"`);
    console.log(
      "  forces:",
      `happy=${f.forces.happy.toFixed(3)} sad=${f.forces.sad.toFixed(3)} angry=${f.forces.angry.toFixed(3)}`
    );
    console.log(
      "  field:",
      Object.entries(f.field)
        .map(([k, v]) => `${k}=${v.toFixed(3)}`)
        .join(", ")
    );
  }
}
