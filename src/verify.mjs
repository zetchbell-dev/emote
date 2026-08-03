import { getDominantEmotion } from "./engine/dominance.js";
import { clampEmotion } from "./engine/clampEmotion.js";

// Reproduce §2.2: fresh session, first message reads angry
const field = { happy: 0, sad: 0, angry: 1.0, bittersweet: 0, disgust: 0, sarcastic: 0, conflicted: 0, overwhelmed: 0 };
const suggested = getDominantEmotion(field, "silent");
console.log("dominance suggests:", suggested);

const clamped = clampEmotion("silent", suggested, 1.0);
console.log("clampEmotion(silent -> " + suggested + ", conf=1.0) =>", clamped);

// Confirm confidence gating is inert: even a very low real confidence, controller always passes 1.0
const clampedLowConf = clampEmotion("silent", suggested, 0.3);
console.log("clampEmotion(silent -> " + suggested + ", conf=0.3) => [what controller SHOULD produce if it wired real confidence]", clampedLowConf);
