// src/engine/emotionComposite.js

import { EMOTION_CONFIG } from "../config/emotionConfig";

/**
 * Composite Emotion Resolver
 *
 * Uses ONLY base emotions:
 * happy, sad, angry
 *
 * Silent is NOT part of composite logic.
 * Silent is derived from low total energy.
 */

export function resolveCompositeEmotion(field) {
  const {
    happy = 0,
    sad = 0,
    angry = 0,
  } = field;

  const C = EMOTION_CONFIG.COMPOSITE_THRESHOLD;

  /* =====================================================
     PRIORITY ORDER (complex → simple)
  ===================================================== */

  /* ==============================
     1️⃣ CONFLICTED
     All three elevated
  ============================== */
  if (
    happy >= C.conflicted.happy &&
    sad >= C.conflicted.sad &&
    angry >= C.conflicted.angry
  ) {
    return "conflicted";
  }

  /* ==============================
     2️⃣ OVERWHELMED
     Strong intensity across spectrum
  ============================== */
  if (
    happy >= C.overwhelmed.happy &&
    sad >= C.overwhelmed.sad &&
    angry >= C.overwhelmed.angry
  ) {
    return "overwhelmed";
  }

  /* ==============================
     3️⃣ DISGUST
     High sadness + high anger
  ============================== */
  if (
    sad >= C.disgust.sad &&
    angry >= C.disgust.angry
  ) {
    return "disgust";
  }

  /* ==============================
     4️⃣ BITTERSWEET
     Happiness + sadness
  ============================== */
  if (
    happy >= C.bittersweet.happy &&
    sad >= C.bittersweet.sad
  ) {
    return "bittersweet";
  }

  /* ==============================
     5️⃣ SARCASTIC
     Light happiness + rising anger
  ============================== */
  if (
    happy >= C.sarcastic.happy &&
    angry >= C.sarcastic.angry
  ) {
    return "sarcastic";
  }

  /* ==============================
     6️⃣ ANXIOUS (redefined)
     High sadness + medium anger
  ============================== */
  if (
    sad >= 0.55 &&
    angry >= 0.30
  ) {
    return "anxious";
  }

  /* ==============================
     7️⃣ FRUSTRATED (redefined)
     High anger + medium sadness
  ============================== */
  if (
    angry >= 0.55 &&
    sad >= 0.30
  ) {
    return "frustrated";
  }

  /* ==============================
     No composite matched
  ============================== */
  return null;
}
