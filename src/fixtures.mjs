// Shared regression fixture set — reconstructed to match the project's
// own scripts/run-validation.mjs description ("33-fixture suite
// spanning all 11 emotions") since that file itself wasn't among the
// uploads. Same synthetic-score methodology already used by the
// project's committed scripts/verify-perception.mjs (labeled SYNTH
// there) — hand-authored label/score arrays standing in for real
// model output, since this sandbox has no network access to run the
// actual model. 3 fixtures per target label x 11 labels = 33.
//
// `named` scores are set explicitly; every other GoEmotions label
// defaults to a low background value, same convention as
// verify-perception.mjs's scoreSet().
export const ALL_LABELS = [
  "admiration","amusement","approval","caring","desire","excitement","gratitude",
  "joy","love","optimism","pride","relief","disappointment","embarrassment","grief",
  "remorse","sadness","anger","annoyance","disapproval","fear","nervousness",
  "disgust","confusion","curiosity","realization","surprise","neutral",
];

export function scoreSet(named, background = 0.02) {
  return ALL_LABELS.map((label) => ({ label, score: named[label] ?? background }));
}

export const FIXTURES = [
  // ---- happy (3) ----
  { expect: "happy", text: "This is the best day of my life!", scores: scoreSet({ joy: 0.85, excitement: 0.6, admiration: 0.2 }) },
  { expect: "happy", text: "Thank you so much, this means the world to me.", scores: scoreSet({ gratitude: 0.88, joy: 0.4 }) },
  { expect: "happy", text: "I'm really proud of how this turned out.", scores: scoreSet({ pride: 0.75, admiration: 0.3 }) },

  // ---- sad (3) ----
  { expect: "sad", text: "I feel so lonely and empty tonight.", scores: scoreSet({ sadness: 0.8, grief: 0.3 }) },
  { expect: "sad", text: "I really regret how I handled that.", scores: scoreSet({ remorse: 0.75, sadness: 0.4 }) },
  { expect: "sad", text: "I'm so disappointed this didn't work out.", scores: scoreSet({ disappointment: 0.8, sadness: 0.2 }) },

  // ---- angry (3) ----
  { expect: "angry", text: "You're an idiot and I hate this.", scores: scoreSet({ anger: 0.85, annoyance: 0.5 }) },
  { expect: "angry", text: "This is completely unacceptable behavior.", scores: scoreSet({ anger: 0.7, disapproval: 0.5 }) },
  { expect: "angry", text: "Stop wasting my time, this is infuriating.", scores: scoreSet({ anger: 0.75, annoyance: 0.4 }) },

  // ---- silent (3) ----
  { expect: "silent", text: "...", scores: scoreSet({}) },
  { expect: "silent", text: "hmm", scores: scoreSet({}) },
  { expect: "silent", text: "idk", scores: scoreSet({}) },

  // ---- bittersweet (3): happy + sad, balanced, no anger ----
  { expect: "bittersweet", text: "I'm exhausted but still hopeful.", scores: scoreSet({ sadness: 0.55, optimism: 0.5, disappointment: 0.2 }) },
  { expect: "bittersweet", text: "Graduation was joyful but I'll miss everyone so much.", scores: scoreSet({ joy: 0.5, sadness: 0.5 }) },
  { expect: "bittersweet", text: "Proud of him, but it hurts to see him go.", scores: scoreSet({ pride: 0.45, sadness: 0.5, admiration: 0.2 }) },

  // ---- conflicted (3): happy + sad + angry, three-way ----
  { expect: "conflicted", text: "Part of me is thrilled, part of me is furious, and part of me just wants to cry.", scores: scoreSet({ joy: 0.5, anger: 0.5, sadness: 0.5 }) },
  { expect: "conflicted", text: "I'm grateful for the offer but angry about the timing and honestly kind of sad too.", scores: scoreSet({ gratitude: 0.45, anger: 0.45, sadness: 0.45 }) },
  { expect: "conflicted", text: "Happy it's over, mad at how it went, and grieving what we lost.", scores: scoreSet({ joy: 0.4, anger: 0.4, grief: 0.4 }) },

  // ---- anxious (3): fear/nervousness-led, tuned into the sad/angry
  // near-balance zone (n.sad just under 0.5) where the math review's
  // §2.1 identifies anxious's (pre-fix) peak, with real fear/nervousness
  // signal present (feeds the new `edge` axis in the fixed pipeline) ----
  { expect: "anxious", text: "I can't stop worrying something bad is about to happen.", scores: scoreSet({ fear: 0.52, annoyance: 0.24 }) },
  { expect: "anxious", text: "I'm terrified about the results tomorrow, I can't focus on anything.", scores: scoreSet({ fear: 0.55, annoyance: 0.22, nervousness: 0.15 }) },
  { expect: "anxious", text: "My hands are shaking, I don't know what's going to happen next.", scores: scoreSet({ fear: 0.5, annoyance: 0.26 }) },

  // ---- frustrated (3): annoyance/sadness-led (no fear/disgust flavor —
  // low `edge`), tuned into the near-balance zone on the angry side ----
  { expect: "frustrated", text: "I've explained this three times and nothing is working.", scores: scoreSet({ annoyance: 0.45, sadness: 0.4 }) },
  { expect: "frustrated", text: "This keeps breaking no matter what I try, it's maddening.", scores: scoreSet({ annoyance: 0.48, sadness: 0.38 }) },
  { expect: "frustrated", text: "Every single attempt gets blocked by the same stupid issue.", scores: scoreSet({ annoyance: 0.46, disappointment: 0.35 }) },

  // ---- disgust (3): disgust-label-led (high `edge` in the fixed
  // pipeline); the disgust label's own FORCE_MAP split (0.45/0.55) is
  // already the near-balance ratio the review's §2.1/§2.2 analyzes ----
  { expect: "disgust", text: "That's absolutely revolting, I can't believe you'd do that.", scores: scoreSet({ disgust: 0.9 }) },
  { expect: "disgust", text: "This is disgusting, get it away from me.", scores: scoreSet({ disgust: 0.95 }) },
  { expect: "disgust", text: "I feel sick just looking at what they did.", scores: scoreSet({ disgust: 0.85 }) },

  // ---- sarcastic (3): surface positivity + hostility ----
  { expect: "sarcastic", text: "Oh wonderful, ANOTHER meeting that could've been an email.", scores: scoreSet({ annoyance: 0.6, amusement: 0.4, approval: 0.2 }) },
  { expect: "sarcastic", text: "Great, just great, exactly what I needed today.", scores: scoreSet({ annoyance: 0.55, amusement: 0.35 }) },
  { expect: "sarcastic", text: "Sure, love it when this happens, truly a delight.", scores: scoreSet({ annoyance: 0.5, amusement: 0.4, approval: 0.15 }) },

  // ---- overwhelmed (3): diffuse, HIGH raw energy (clears
  // OVERWHELMED_ENERGY_THRESHOLD=1.1), no disgust/fear flavor (low
  // `edge`) — this is the fixture group that exposed the exact
  // disgust===overwhelmed identity proven in the review's §2.2 ----
  { expect: "overwhelmed", text: "Everything feels overwhelming right now.", scores: scoreSet({ sadness: 0.9, anger: 0.85 }) },
  { expect: "overwhelmed", text: "There's too much happening at once and I can't keep up.", scores: scoreSet({ sadness: 0.85, anger: 0.9 }) },
  { expect: "overwhelmed", text: "I can't handle all of this piling up on me.", scores: scoreSet({ sadness: 0.95, anger: 0.9 }) },
];

console.error(`fixtures loaded: ${FIXTURES.length}`);
