  // src/engine/emotionComposite.js

  import { EMOTION_CONFIG } from "../config/emotionConfig";

  /**
   * Composite emotion resolver.
   * Pure physics. No AI logic.
   * 
   * Checks field thresholds in priority order.
   * Returns composite emotion if thresholds met, else null.
   */
  export function resolveCompositeEmotion(field) {
    const C = EMOTION_CONFIG.COMPOSITE_THRESHOLD;

    // Priority order: most complex → simplest

    /* ==============================
      CONFLICTED
      All three base emotions elevated
    ============================== */
    if (
      field.happy >= C.conflicted.happy &&
      field.sad >= C.conflicted.sad &&
      field.angry >= C.conflicted.angry
    ) {
      return "conflicted";
    }

    /* ==============================
      OVERWHELMED
      High levels across happy/sad/angry
    ============================== */
    if (
      field.happy >= C.overwhelmed.happy &&
      field.sad >= C.overwhelmed.sad &&
      field.angry >= C.overwhelmed.angry
    ) {
      return "overwhelmed";
    }

    /* ==============================
      DISGUST
      Strong anger + sustained sadness
    ============================== */
    if (
      field.sad >= C.disgust.sad &&
      field.angry >= C.disgust.angry
    ) {
      return "disgust";
    }

    /* ==============================
      BITTERSWEET
      Mixed happiness and sadness
    ============================== */
    if (
      field.happy >= C.bittersweet.happy &&
      field.sad >= C.bittersweet.sad
    ) {
      return "bittersweet";
    }

    /* ==============================
      SARCASTIC
      Light happiness + rising anger
    ============================== */
    if (
      field.happy >= C.sarcastic.happy &&
      field.angry >= C.sarcastic.angry
    ) {
      return "sarcastic";
    }

    /* ==============================
      ANXIOUS
      Sadness + silence
    ============================== */
    if (
      field.sad >= C.anxious.sad &&
      field.silent >= C.anxious.silent
    ) {
      return "anxious";
    }

    /* ==============================
      FRUSTRATED
      Anger + silence
    ============================== */
    if (
      field.angry >= C.frustrated.angry &&
      field.silent >= C.frustrated.silent
    ) {
      return "frustrated";
    }

    /* ==============================
      TIRED
      High silent + background sadness
      (Not in config, using legacy threshold)
    ============================== */
    if (field.silent > 0.6 && field.sad > 0.3) {
      return "tired";
    }

    return null;
  }
