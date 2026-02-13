

// // src/ai/emotionAI.js

// const SIGNALS = {
//   happy: ["hi", "hello", "hey", "love", "great", "awesome"],
//   angry: ["stupid", "hate", "idiot", "shit", "damn"],
//   sad: ["sad", "tired", "lonely", "hurt"],
// };

// export async function interpretEmotion(text) {
//   const lower = text.toLowerCase();
//   const scores = {
//     happy: 0,
//     sad: 0,
//     angry: 0,
//     silent: 0,
//   };

//   Object.entries(SIGNALS).forEach(([emotion, words]) => {
//     words.forEach((word) => {
//       if (lower.includes(word)) {
//         scores[emotion] += 0.8;
//       }
//     });
//   });

//   const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
//   const [top] = sorted;

//   if (top[1] === 0) {
//     return {
//       emotion: "happy",
//       intensity: 0.4,
//       confidence: 0.6,
//     };
//   }

//   return {
//     emotion: top[0],
//     intensity: Math.min(1, top[1]),
//     confidence: 0.9,
//   };
// }



// // src/ai/emotionAI.js
// import { pipeline } from "@xenova/transformers";

// let classifier = null;

// /**
//  * Load model once (cached in browser)
//  */
// async function getModel() {
//   if (!classifier) {
//     console.log("🤖 Loading sentiment model...");
//     classifier = await pipeline(
//       "sentiment-analysis",
//       "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
//     );
//     console.log("✅ Model ready");
//   }
//   return classifier;
// }

// /**
//  * Interpret emotion using ML
//  * Returns standardized format:
//  * { emotion, intensity, confidence }
//  */
// export async function interpretEmotion(text) {
//   if (!text || !text.trim()) {
//     return {
//       emotion: "silent",
//       intensity: 0,
//       confidence: 1,
//     };
//   }

//   try {
//     const model = await getModel();
//     const result = await model(text);

//     const sentiment = result[0];
//     const label = sentiment.label; // POSITIVE or NEGATIVE
//     const score = sentiment.score; // 0–1 confidence

//     const lower = text.toLowerCase();

//     // Positive → Happy
//     if (label === "POSITIVE") {
//       return {
//         emotion: "happy",
//         intensity: score,
//         confidence: score,
//       };
//     }

//     // Negative → Decide Sad or Angry
//     const angerWords = [
//       "hate",
//       "stupid",
//       "idiot",
//       "angry",
//       "mad",
//       "damn",
//       "fuck",
//       "shit",
//     ];

//     const isAngry = angerWords.some((w) => lower.includes(w));

//     return {
//       emotion: isAngry ? "angry" : "sad",
//       intensity: score,
//       confidence: score,
//     };
//   } catch (err) {
//     console.warn("⚠️ ML failed, fallback to neutral:", err);

//     return {
//       emotion: "happy",
//       intensity: 0.4,
//       confidence: 0.5,
//     };
//   }
// }

// import { pipeline, env } from "@xenova/transformers";

// // Configure environment
// env.allowLocalModels = true;
// env.allowRemoteModels = false;
// env.useBrowserCache = true;

// let classifier = null;

// async function getModel() {
//   if (!classifier) {
//     console.log("🤖 Loading local model...");

//     classifier = await pipeline(
//       "sentiment-analysis",
//       "/models/distilbert-base-uncased-finetuned-sst-2-english"
//     );

//     console.log("✅ Model ready");
//   }
//   return classifier;
// }

// export async function interpretEmotion(text) {
//   if (!text || !text.trim()) {
//     return {
//       emotion: "silent",
//       intensity: 0,
//       confidence: 1,
//     };
//   }

//   try {
//     const model = await getModel();
//     const result = await model(text);

//     const { label, score } = result[0];
//     const lower = text.toLowerCase();

//     if (label === "POSITIVE") {
//       return {
//         emotion: "happy",
//         intensity: score,
//         confidence: score,
//       };
//     }

//     const angerWords = [
//       "hate",
//       "angry",
//       "mad",
//       "stupid",
//       "idiot",
//       "fuck",
//       "shit",
//     ];

//     const isAngry = angerWords.some((w) =>
//       lower.includes(w)
//     );

//     return {
//       emotion: isAngry ? "angry" : "sad",
//       intensity: score,
//       confidence: score,
//     };
//   } catch (err) {
//     console.warn("⚠️ ML failed:", err);

//     return {
//       emotion: "silent",
//       intensity: 0.3,
//       confidence: 0.4,
//     };
//   }
// }



// // src/ai/emotionAI.js
// import { pipeline } from "@huggingface/transformers";

// let classifier = null;
// let isLoading = false;

// /* ================================================
//    Load model once (cached in browser)
// ================================================ */
// async function getModel() {
//   if (classifier) return classifier;

//   if (isLoading) {
//     // wait if already loading
//     while (isLoading) {
//       await new Promise((r) => setTimeout(r, 100));
//     }
//     return classifier;
//   }

//   try {
//     isLoading = true;
//     console.log("🤖 Loading sentiment model...");

//     classifier = await pipeline(
//       "sentiment-analysis",
//       "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
//     );

//     console.log("✅ Model ready");
//     isLoading = false;

//     return classifier;
//   } catch (err) {
//     isLoading = false;
//     console.error("❌ Model failed to load:", err);
//     throw err;
//   }
// }

// /* ================================================
//    Keyword nuance detection
//    Helps split NEGATIVE into angry vs sad
// ================================================ */
// function detectNuance(text) {
//   const lower = text.toLowerCase();

//   const angryWords = [
//     "hate", "angry", "mad", "furious",
//     "stupid", "idiot", "damn", "shit", "fuck"
//   ];

//   const sadWords = [
//     "sad", "hurt", "lonely", "tired",
//     "depressed", "cry", "miserable"
//   ];

//   if (angryWords.some((w) => lower.includes(w))) {
//     return "angry";
//   }

//   if (sadWords.some((w) => lower.includes(w))) {
//     return "sad";
//   }

//   return null;
// }

// /* ================================================
//    Main emotion interpreter
//    Returns:
//    { emotion, intensity, confidence }
// ================================================ */
// export async function interpretEmotion(text) {
//   if (!text || !text.trim()) {
//     return {
//       emotion: "silent",
//       intensity: 0,
//       confidence: 1,
//     };
//   }

//   try {
//     const model = await getModel();
//     const result = await model(text);

//     const { label, score } = result[0];
//     const lower = text.toLowerCase();

//     /* -------------------------------
//        Positive → happy
//     ------------------------------- */
//     if (label === "POSITIVE") {
//       return {
//         emotion: "happy",
//         intensity: score,
//         confidence: score,
//       };
//     }

//     /* -------------------------------
//        Negative → angry or sad
//     ------------------------------- */
//     if (label === "NEGATIVE") {
//       const nuance = detectNuance(text);

//       if (nuance) {
//         return {
//           emotion: nuance,
//           intensity: score,
//           confidence: score,
//         };
//       }

//       // default negative
//       return {
//         emotion: "sad",
//         intensity: score,
//         confidence: score,
//       };
//     }

//     /* Fallback */
//     return {
//       emotion: "happy",
//       intensity: 0.4,
//       confidence: 0.5,
//     };

//   } catch (err) {
//     console.warn("⚠️ ML inference failed:", err);

//     // safe fallback
//     return {
//       emotion: "silent",
//       intensity: 0.3,
//       confidence: 0.4,
//     };
//   }
// }

// /* ================================================
//    Optional: preload model on app start
//    Call preloadModel() inside App.jsx useEffect
// ================================================ */
// export function preloadModel() {
//   getModel().catch(() => {});
// }



// src/ai/emotionAI.js
import { pipeline, env } from "@huggingface/transformers";

// Prevent "Unexpected token '<'" / index.html-as-JSON: disable browser cache.
// Cache lookups can return SPA fallback HTML when paths resolve to origin.
// See: xenova/transformers.js#366, SO 77614213
env.allowLocalModels = false;
env.useBrowserCache = false;

/*
  EMOTE – AI Perception Layer
  AI only classifies.
  Engine decides dominance.
*/

let classifier = null;
let isLoading = false;

/* ============================================
   Load Model (Singleton)
============================================ */
async function getModel() {
  if (classifier) return classifier;

  if (isLoading) {
    while (isLoading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return classifier;
  }

  try {
    isLoading = true;
    console.log("🤖 Loading sentiment model...");

    classifier = await pipeline(
      "sentiment-analysis",
      "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
    );

    console.log("✅ Model ready");
    isLoading = false;
    return classifier;

  } catch (err) {
    isLoading = false;
    console.error("❌ Model failed to load:", err);
    throw err;
  }
}

/* ============================================
   Keyword Nuance Detection
============================================ */
const KEYWORDS = {
  angry: [
    "hate", "angry", "mad", "furious",
    "stupid", "idiot", "damn", "shit", "fuck"
  ],
  sad: [
    "sad", "hurt", "lonely", "tired",
    "depressed", "cry", "miserable"
  ],
  happy: [
    "love", "great", "amazing", "awesome",
    "fantastic", "perfect"
  ],
};

function detectNuance(text) {
  const lower = text.toLowerCase();

  for (const [emotion, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) {
      return emotion;
    }
  }

  return null;
}

/* ============================================
   Main Interpreter
   Returns:
   { emotion, intensity, confidence }
============================================ */
export async function interpretEmotion(text) {
  if (!text?.trim()) {
    return {
      emotion: "silent",
      intensity: 0,
      confidence: 1,
      source: "empty",
    };
  }

  try {
    const model = await getModel();
    const result = await model(text);
    const { label, score } = result[0];

    let emotion = "happy";
    let intensity = score;
    let confidence = score;

    // POSITIVE → happy
    if (label === "POSITIVE") {
      emotion = "happy";
    }

    // NEGATIVE → nuance
    else if (label === "NEGATIVE") {
      const nuance = detectNuance(text);

      if (nuance === "angry") {
        emotion = "angry";
      } else {
        emotion = "sad";
      }
    }

    // very short input → silent
    if (text.trim().length <= 2) {
      emotion = "silent";
      intensity = 0.4;
      confidence = 0.8;
    }

    return {
      emotion,
      intensity,
      confidence,
      source: "hf-transformers",
    };

  } catch (err) {
    console.warn("⚠️ ML inference failed:", err);

    return {
      emotion: "silent",
      intensity: 0.3,
      confidence: 0.4,
      source: "fallback",
    };
  }
}

/* ============================================
   Optional Preload
============================================ */
export function preloadModel() {
  getModel().catch(() => {});
}
