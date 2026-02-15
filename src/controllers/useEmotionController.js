
// // src/controllers/useEmotionController.js

// import { useEffect, useRef, useState } from "react";

// import { interpretEmotion } from "../ai/emotionAI";
// import {
//   updateEmotionField,
//   getDominantEmotion,
// } from "../engine/emotionField";
// import { clampEmotion } from "../engine/clampEmotion";
// import { decayEmotionField } from "../engine/decay";

// export function useEmotionController() {
//   const [messages, setMessages] = useState([]);
//   const [emotion, setEmotion] = useState("silent");

//   const [emotionField, setEmotionField] = useState({
//     happy: 0,
//     sad: 0,
//     angry: 0,
//     silent: 0,
//   });

//   const lastUpdateRef = useRef(Date.now());
//   const emotionLockRef = useRef(0);

//   /* -----------------------------
//      Passive decay
//   ----------------------------- */
//   useEffect(() => {
//     const id = setInterval(() => {
//       setEmotionField((prev) => decayEmotionField(prev));
//     }, 2000);

//     return () => clearInterval(id);
//   }, []);

//   /* -----------------------------
//      Text → AI → Engine
//   ----------------------------- */
//   async function submitText(text) {
//     if (!text.trim()) return;

//     const now = Date.now();
//     const deltaMs = now - lastUpdateRef.current;
//     lastUpdateRef.current = now;

//     const ai = await interpretEmotion(text);

//     setMessages((m) => [...m, { text }]);

//     setEmotionField((prev) => {
//       const updated = updateEmotionField(prev, ai, deltaMs);
//       const suggested = getDominantEmotion(updated, emotion);

//       setEmotion((current) => {
//         // Minimum duration lock
//         if (now < emotionLockRef.current) return current;

//         const finalEmotion = clampEmotion(
//           current,
//           suggested,
//           ai.confidence
//         );

//         emotionLockRef.current = now + 1200;
//         return finalEmotion;
//       });

//       return updated;
//     });
//   }

//   return {
//     emotion,
//     messages,
//     emotionField,
//     submitText,
//   };
// }

// import { useEffect, useRef, useState } from "react";

// import { interpretEmotion } from "../ai/emotionAI";
// import {
//   updateEmotionField,
//   getDominantEmotion,
// } from "../engine/emotionField";
// import { clampEmotion } from "../engine/clampEmotion";
// import { decayEmotionField } from "../engine/decay";

// export function useEmotionController() {
//   const [messages, setMessages] = useState([]);
//   const [emotion, setEmotion] = useState("silent");

//   const [emotionField, setEmotionField] = useState({
//     happy: 0,
//     sad: 0,
//     angry: 0,
//     silent: 0,
//   });

//   const lastUpdateRef = useRef(Date.now());
//   const emotionLockRef = useRef(0);

//   /* ============================
//      PASSIVE DECAY
//   ============================ */
//   useEffect(() => {
//     const id = setInterval(() => {
//       setEmotionField((prev) => decayEmotionField(prev));
//     }, 2000);

//     return () => clearInterval(id);
//   }, []);

//   /* ============================
//      TEXT → LOGIC TRACE
//   ============================ */
//   async function submitText(text) {
//     if (!text.trim()) return;

//     console.group("🧠 EMOTE LOGIC TRACE");
//     console.log("INPUT TEXT:", text);

//     const now = Date.now();
//     const deltaMs = now - lastUpdateRef.current;
//     lastUpdateRef.current = now;

//     const ai = await interpretEmotion(text);
//     console.log("AI OUTPUT:", ai);

//     setMessages((m) => [...m, { text }]);

//     setEmotionField((prev) => {
//       console.log("FIELD BEFORE:", prev);

//       const updated = updateEmotionField(prev, ai, deltaMs);
//       console.log("FIELD AFTER:", updated);

//       const suggested = getDominantEmotion(updated, emotion);
//       console.log("SUGGESTED EMOTION:", suggested);

//       setEmotion((current) => {
//         if (now < emotionLockRef.current) {
//           console.log("LOCK ACTIVE → EMOTION STAYS:", current);
//           console.groupEnd();
//           return current;
//         }

//         const finalEmotion = clampEmotion(
//           current,
//           suggested,
//           ai.confidence
//         );

//         console.log("EMOTION CHANGE:", current, "→", finalEmotion);

//         emotionLockRef.current = now + 1200;
//         console.groupEnd();

//         return finalEmotion;
//       });

//       return updated;
//     });
//   }

//   return {
//     emotion,
//     messages,
//     emotionField,
//     submitText,
//   };
// }

// src/controllers/useEmotionController.js

// import { useState, useRef } from "react";
// import { interpretEmotion } from "../ai/emotionAI";
// import { clampEmotion } from "../engine/clampEmotion";

// export function useEmotionController() {
//   const [emotion, setEmotion] = useState("silent");
//   const [messages, setMessages] = useState([]);

//   const emotionLockRef = useRef(0);

//   async function submitText(text) {
//     if (!text.trim()) return;

//     const ai = await interpretEmotion(text);

//     setMessages(prev => [...prev, { text }]);

//     const now = Date.now();

//     // Short lock (responsive)
//     if (now < emotionLockRef.current) return;

//     const finalEmotion = clampEmotion(
//       emotion,
//       ai.emotion,
//       ai.confidence
//     );

//     if (finalEmotion !== emotion) {
//       console.log("EMOTION CHANGE:", emotion, "→", finalEmotion);
//       setEmotion(finalEmotion);
//     }

//     // shorter lock = more responsive
//     emotionLockRef.current = now + 600;
//   }

//   return {
//     emotion,
//     messages,
//     submitText,
//   };
// }


// src/controllers/useEmotionController.js

// import { useEffect, useRef, useState } from "react";

// import { interpretEmotion } from "../ai/emotionAI";
// import {
//   updateEmotionField,
//   getDominantEmotion,
// } from "../engine/emotionField";
// import { clampEmotion } from "../engine/clampEmotion";
// import { decayEmotionField } from "../engine/decay";

// export function useEmotionController() {
//   const [emotion, setEmotion] = useState("silent");
//   const [messages, setMessages] = useState([]);

//   const [emotionField, setEmotionField] = useState({
//     happy: 0,
//     sad: 0,
//     angry: 0,
//     silent: 0,
//   });

//   const lastUpdateRef = useRef(Date.now());
//   const emotionLockRef = useRef(0);

//   /* =============================
//      PASSIVE DECAY (every 2s)
//   ============================= */
//   useEffect(() => {
//     const id = setInterval(() => {
//       setEmotionField((prev) => decayEmotionField(prev));
//     }, 2000);

//     return () => clearInterval(id);
//   }, []);

//   /* =============================
//      SUBMIT TEXT
//   ============================= */
//   async function submitText(text) {
//     if (!text.trim()) return;

//     const now = Date.now();
//     const deltaMs = now - lastUpdateRef.current;
//     lastUpdateRef.current = now;

//     const ai = await interpretEmotion(text);

//     setMessages((prev) => [...prev, { text }]);

//     setEmotionField((prevField) => {
//       const updated = updateEmotionField(prevField, ai, deltaMs);
//       const suggested = getDominantEmotion(updated, emotion);

//       // emotional lock (prevents twitch)
//       if (now > emotionLockRef.current) {
//         const finalEmotion = clampEmotion(
//           emotion,
//           suggested,
//           ai.confidence
//         );

//         if (finalEmotion !== emotion) {
//           setEmotion(finalEmotion);
//           emotionLockRef.current = now + 900; // slightly longer for stability
//         }
//       }

//       return updated;
//     });
//   }

//   return {
//     emotion,
//     messages,
//     emotionField, // keep for debug panel
//     submitText,
//   };
// }




// src/controllers/useEmotionController.js

// import { useEffect, useRef, useState } from "react";
// import { interpretEmotion } from "../ai/emotionAI";
// import { updateEmotionField, getDominantEmotion } from "../engine/emotionField";
// import { clampEmotion } from "../engine/clampEmotion";
// import { decayEmotionField } from "../engine/decay";
// import { EMOTION_CONFIG } from "../config/emotionConfig";

// export function useEmotionController() {
//   const [emotion, setEmotion] = useState("silent");
//   const [messages, setMessages] = useState([]);
//   const [emotionField, setEmotionField] = useState({
//     happy: 0,
//     sad: 0,
//     angry: 0,
//     silent: 0,
//   });

//   const lastUpdateRef = useRef(Date.now());
//   const emotionLockRef = useRef(0);

//   // passive decay
//   useEffect(() => {
//     const id = setInterval(() => {
//       setEmotionField((prev) => decayEmotionField(prev));
//     }, EMOTION_CONFIG.DECAY_INTERVAL_MS);

//     return () => clearInterval(id);
//   }, []);

//   // field → emotion sync
//   useEffect(() => {
//     const now = Date.now();
//     if (now < emotionLockRef.current) return;

//     const suggested = getDominantEmotion(emotionField, emotion);

//     if (suggested !== emotion) {
//       const finalEmotion = clampEmotion(emotion, suggested, 1.0);

//       if (finalEmotion !== emotion) {
//         setEmotion(finalEmotion);
//         emotionLockRef.current =
//           now + EMOTION_CONFIG.EMOTION_LOCK_DURATION;
//       }
//     }
//   }, [emotionField, emotion]);

//   async function submitText(text) {
//     if (!text.trim()) return;

//     const now = Date.now();
//     const deltaMs = now - lastUpdateRef.current;
//     lastUpdateRef.current = now;

//     const ai = await interpretEmotion(text);

//     setMessages((prev) => [...prev, { text }]);

//     setEmotionField((prev) =>
//       updateEmotionField(prev, ai, deltaMs)
//     );
//   }

//   return {
//     emotion,
//     messages,
//     emotionField,
//     submitText,
//   };
// }


// src/controllers/useEmotionController.js

// import { useEffect, useRef, useState } from "react";
// import { interpretEmotion } from "../ai/emotionAI";
// import {
//   updateEmotionField,
//   getDominantEmotion,
// } from "../engine/emotionField";
// import { clampEmotion } from "../engine/clampEmotion";
// import { decayEmotionField } from "../engine/decay";
// import { EMOTION_CONFIG } from "../config/emotionConfig";

// export function useEmotionController() {
//   const [emotion, setEmotion] = useState("silent");
//   const [messages, setMessages] = useState([]);

//   const [emotionField, setEmotionField] = useState({
//     happy: 0,
//     sad: 0,
//     angry: 0,
//     silent: 0,
//   });

//   const lastUpdateRef = useRef(Date.now());
//   const emotionLockRef = useRef(0);

//   /* ================================
//      PASSIVE DECAY
//   ================================= */
//   useEffect(() => {
//     const id = setInterval(() => {
//       setEmotionField((prev) => decayEmotionField(prev));
//     }, EMOTION_CONFIG.DECAY_INTERVAL_MS);

//     return () => clearInterval(id);
//   }, []);

//   /* ================================
//      FIELD → EMOTION SYNC (FIXED)
//      Runs independently. No loops.
//   ================================= */
//   useEffect(() => {
//     const id = setInterval(() => {
//       const now = Date.now();

//       if (now < emotionLockRef.current) return;

//       setEmotion((current) => {
//         const suggested = getDominantEmotion(
//           emotionField,
//           current
//         );

//         if (suggested === current) return current;

//         const validated = clampEmotion(
//           current,
//           suggested,
//           1.0
//         );

//         if (validated !== current) {
//           emotionLockRef.current =
//             now + EMOTION_CONFIG.EMOTION_LOCK_DURATION;
//           return validated;
//         }

//         return current;
//       });
//     }, 500); // check twice per second

//     return () => clearInterval(id);
//   }, [emotionField]);

//   /* ================================
//      SUBMIT TEXT
//   ================================= */
//   async function submitText(text) {
//     if (!text.trim()) return;

//     const now = Date.now();
//     const deltaMs = now - lastUpdateRef.current;
//     lastUpdateRef.current = now;

//     const ai = await interpretEmotion(text);

//     setMessages((prev) => [...prev, { text }]);

//     setEmotionField((prev) =>
//       updateEmotionField(prev, ai, deltaMs)
//     );
//   }

//   return {
//     emotion,
//     messages,
//     emotionField,
//     submitText,
//   };
// }



// import { useRef, useState } from "react";
// import { interpretEmotion } from "../ai/emotionAI";
// import {
//   updateEmotionField,
//   getDominantEmotion,
// } from "../engine/emotionField";
// import { clampEmotion } from "../engine/clampEmotion";
// import { EMOTION_CONFIG } from "../config/emotionConfig";

// export function useEmotionController() {
//   /* ==========================================
//      STATE
//   ========================================== */
//   const [emotion, setEmotion] = useState("silent");
//   const [messages, setMessages] = useState([]);

//   const [emotionField, setEmotionField] = useState({
//     happy: 0,
//     sad: 0,
//     angry: 0,
//     silent: 0,
//   });

//   /* ==========================================
//      INTERNAL REFS
//   ========================================== */
//   const lastUpdateRef = useRef(Date.now());
//   const emotionLockRef = useRef(0);

//   /* ==========================================
//      CORE UPDATE FUNCTION
//      (Single Source of Truth)
//   ========================================== */
//   function processFieldUpdate(prevField, ai, deltaMs) {
//     const updatedField = updateEmotionField(
//       prevField,
//       ai,
//       deltaMs
//     );

//     const now = Date.now();

//     // Respect emotion lock
//     if (now < emotionLockRef.current) {
//       return updatedField;
//     }

//     const suggested = getDominantEmotion(
//       updatedField,
//       emotion
//     );

//     if (suggested !== emotion) {
//       const validated = clampEmotion(
//         emotion,
//         suggested,
//         ai.confidence ?? 1
//       );

//       if (validated !== emotion) {
//         setEmotion(validated);
//         emotionLockRef.current =
//           now + EMOTION_CONFIG.EMOTION_LOCK_DURATION;
//       }
//     }

//     return updatedField;
//   }

//   /* ==========================================
//      SUBMIT TEXT
//   ========================================== */
//   async function submitText(text) {
//     if (!text.trim()) return;

//     const now = Date.now();
//     const deltaMs = now - lastUpdateRef.current;
//     lastUpdateRef.current = now;

//     const ai = await interpretEmotion(text);

//     // Control AI strength (deterministic influence)
//     const weightedAI = {
//       ...ai,
//       intensity:
//         ai.intensity *
//         EMOTION_CONFIG.AI_INFLUENCE,
//     };

//     setMessages((prev) => [...prev, { text }]);

//     setEmotionField((prevField) =>
//       processFieldUpdate(prevField, weightedAI, deltaMs)
//     );
//   }

//   /* ==========================================
//      OPTIONAL PASSIVE DECAY (Integrated)
//      Instead of separate decay file
//   ========================================== */
//   function passiveTick() {
//     const now = Date.now();
//     const deltaMs = now - lastUpdateRef.current;
//     lastUpdateRef.current = now;

//     const silentAI = {
//       emotion: "silent",
//       intensity: 0,
//       confidence: 1,
//     };

//     setEmotionField((prevField) =>
//       processFieldUpdate(prevField, silentAI, deltaMs)
//     );
//   }

//   return {
//     emotion,
//     messages,
//     emotionField,
//     submitText,
//     passiveTick, // optional manual decay trigger
//   };
// }


import { useEffect, useRef, useState } from "react";
import { interpretEmotion } from "../ai/emotionAI";
import {
  updateEmotionField,
  getDominantEmotion,
} from "../engine/emotionField";
import { clampEmotion } from "../engine/clampEmotion";
import { EMOTION_CONFIG } from "../config/emotionConfig";
import { useEmotionHistory } from "../hooks/useEmotionHistory";

export function useEmotionController() {
  const [emotion, setEmotion] = useState("silent");
  const [messages, setMessages] = useState([]);
  const [emotionField, setEmotionField] = useState({
    happy: 0,
    sad: 0,
    angry: 0,
  });

  const lastUpdateRef = useRef(Date.now());
  const emotionLockRef = useRef(0);

  /* ==========================================
   Passive Time Tick (drives decay only)
========================================== */
useEffect(() => {
  const id = setInterval(() => {
    const now = Date.now();
    const deltaMs = now - lastUpdateRef.current;
    lastUpdateRef.current = now;

    // No emotional injection
    const passiveAI = {
      emotion: null,
      intensity: 0,
      confidence: 1,
    };

    setEmotionField((prev) =>
      updateEmotionField(prev, passiveAI, deltaMs)
    );
  }, EMOTION_CONFIG.DECAY_INTERVAL_MS);

  return () => clearInterval(id);
}, []);

  
  /* Field → Emotion Sync */
  useEffect(() => {
    const now = Date.now();
    if (now < emotionLockRef.current) return;

    const suggested = getDominantEmotion(
      emotionField,
      emotion
    );

    if (suggested !== emotion) {
      const validated = clampEmotion(
        emotion,
        suggested,
        1.0
      );

      if (validated !== emotion) {
        setEmotion(validated);
        emotionLockRef.current =
          now + EMOTION_CONFIG.EMOTION_LOCK_DURATION;
      }
    }
  }, [emotionField]);

  /* Submit Text */
  async function submitText(text) {
    if (!text.trim()) return;

    const now = Date.now();
    const deltaMs = now - lastUpdateRef.current;
    lastUpdateRef.current = now;

    const ai = await interpretEmotion(text);

    setMessages((prev) => [...prev, { text }]);

    setEmotionField((prev) =>
      updateEmotionField(prev, ai, deltaMs)
    );
  }

  /* Timeline Hook (using your real hook) */
  const history = useEmotionHistory(
    emotionField,
    EMOTION_CONFIG.TIMELINE_INTERVAL,
    EMOTION_CONFIG.TIMELINE_MAX_POINTS
  );

  return {
    emotion,
    messages,
    emotionField,
    submitText,
    timeline: history,
  };
}
