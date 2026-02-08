// src/components/Avatar/useLipBehavior.js
import { useEffect, useRef } from "react";
import gsap from "gsap";

/* ==================================================
   EMOTION WEIGHT (ZOOM FEEL)
   Purpose: emotional presence, not size gimmick
================================================== */
const LIP_ZOOM = {
  happy: {
    scale: 0.97,
    x: 0,
    y: 0.8,
  },

  sad: {
    scale: 0.945,
    x: 0,
    y: 2.2,
  },

  angry: {
    scale: 1.06,
    x: 0,
    y: -1.2,
  },

  silent: {
    scale: 0.92,
    x: 0,
    y: 3.2,
  },
};

const ZOOM_DURATION = {
  happy: 0.28,
  sad: 0.32,
  angry: 0.38,
  silent: 0.42,
};

const getZoom = (emotion) =>
  LIP_ZOOM[emotion] ?? LIP_ZOOM.happy;

/* ==================================================
   HARD RESET — MUST HAPPEN BEFORE EVERY SWAP
================================================== */
function resetLip(el) {
  gsap.killTweensOf(el);
  gsap.set(el, {
    clearProps: "transform",
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    x: 0,
    y: 0,
  });
}

/* ==================================================
   RELATIVE ZOOM TRANSITION
   New lip inherits old emotion → settles to new
================================================== */
function transitionLipZoom(el, fromEmotion, toEmotion) {
  const from = getZoom(fromEmotion);
  const to = getZoom(toEmotion);

  gsap.set(el, {
    scale: from.scale,
    x: from.x,
    y: from.y,
  });

  gsap.to(el, {
    scale: to.scale,
    x: to.x,
    y: to.y,
    duration: ZOOM_DURATION[toEmotion] ?? 0.3,
    ease: "cubic-bezier(0.16, 1, 0.3, 1)",
    onComplete: () => {
      // subtle organic settle (only for heavy emotions)
      if (toEmotion === "angry" || toEmotion === "silent") {
        gsap.to(el, {
          scale: "+=0.005",
          duration: 0.08,
          repeat: 1,
          yoyo: true,
          ease: "power1.out",
        });
      }
    },
  });
}

/* ==================================================
   MAIN HOOK
================================================== */
export function useLipBehavior({ emotion, lipRef, setLip }) {
  const prevEmotionRef = useRef(emotion);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const el = lipRef.current;
    if (!el) return;

    if (isAnimatingRef.current) return;

    const from = prevEmotionRef.current;
    const to = emotion;
    if (from === to) return;

    /* =============================================
       HAPPY / SAD / SILENT → ANGRY
       (SHAPE FIRST, ZOOM AFTER)
    ============================================= */
    if (
      (from === "happy" || from === "sad" || from === "silent") &&
      to === "angry"
    ) {
      isAnimatingRef.current = true;

      // 1️⃣ mount angry lip
      setLip("angry");

      // 2️⃣ full safety reset
      resetLip(el);

      // 3️⃣ angry open (shape only)
      gsap.fromTo(
        el,
        {
          scaleY: 0.15,
          scaleX: 0.85,
          transformOrigin: "center center",
        },
        {
          scaleY: 1,
          scaleX: 1,
          duration: 0.6, // slow, heavy
          ease: "cubic-bezier(0.12, 0.8, 0.2, 1)",
          onComplete: () => {
            // 4️⃣ emotional weight
            transitionLipZoom(el, from, "angry");

            prevEmotionRef.current = to;
            isAnimatingRef.current = false;
          },
        }
      );
      return;
    }

    /* =============================================
       ANGRY → HAPPY / SAD / SILENT
       (CLOSE → RESET → SWAP → ZOOM)
    ============================================= */
    if (
      from === "angry" &&
      (to === "happy" || to === "sad" || to === "silent")
    ) {
      isAnimatingRef.current = true;

      gsap.killTweensOf(el);

      // 1️⃣ close angry
      gsap.to(el, {
        scaleY: 0.15,
        scaleX: 0.85,
        duration: 0.22, // decisive release
        ease: "cubic-bezier(0.3, 0, 0.7, 1)",
        onComplete: () => {
          // 2️⃣ full reset (prevents invisible lips)
          resetLip(el);

          // 3️⃣ swap to new lip
          setLip(to);

          // 4️⃣ settle zoom on NEW svg
          requestAnimationFrame(() => {
            if (lipRef.current) {
              transitionLipZoom(lipRef.current, from, to);
            }
          });

          prevEmotionRef.current = to;
          isAnimatingRef.current = false;
        },
      });
      return;
    }

    /* =============================================
       HAPPY ↔ SAD ↔ SILENT
       (INSTANT, STABLE)
    ============================================= */
    resetLip(el);
    setLip(to);

    requestAnimationFrame(() => {
      if (lipRef.current) {
        transitionLipZoom(lipRef.current, from, to);
      }
    });

    prevEmotionRef.current = to;
  }, [emotion]);
}
