// src/components/Avatar/useLipBehavior.js
import { useEffect, useRef } from "react";
import gsap from "gsap";

/* ===============================
   LIP ZOOM TARGET STATES
================================ */
const LIP_ZOOM = {
  happy:  { scale: 0.96, x: 0, y: 1 },
  sad:    { scale: 0.94, x: 0, y: 2 },
  angry:  { scale: 1.08, x: 0, y: -1 },
  silent: { scale: 0.9,  x: 0, y: 3 },
};

const getZoom = (emotion) =>
  LIP_ZOOM[emotion] ?? LIP_ZOOM.happy;

/* ===============================
   RELATIVE ZOOM TRANSITION
================================ */
function transitionLipZoom(el, fromEmotion, toEmotion) {
  const from = getZoom(fromEmotion);
  const to = getZoom(toEmotion);

  // start at previous emotion zoom
  gsap.set(el, {
    scale: from.scale,
    x: from.x,
    y: from.y,
  });

  gsap.to(el, {
    scale: to.scale,
    x: to.x,
    y: to.y,
    duration: toEmotion === "angry" ? 0.45 : 0.3,
    ease: "cubic-bezier(0.16, 1, 0.3, 1)",
  });
}

export function useLipBehavior({ emotion, lipRef, setLip }) {
  const prevEmotionRef = useRef(emotion);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const el = lipRef.current;
    if (!el) return;

    const from = prevEmotionRef.current;
    const to = emotion;
    if (from === to) return;

    /* ===============================
       HAPPY / SAD / SILENT → ANGRY
    ================================ */
    if (
      (from === "happy" || from === "sad" || from === "silent") &&
      to === "angry"
    ) {
      isAnimatingRef.current = true;

      setLip("angry");

      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "transform" });

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
          duration: 0.6, // slow angry entry
          ease: "cubic-bezier(0.12, 0.8, 0.2, 1)",
          onComplete: () => {
            transitionLipZoom(el, from, "angry");
            prevEmotionRef.current = to;
            isAnimatingRef.current = false;
          },
        }
      );
      return;
    }

    /* ===============================
       ANGRY → HAPPY / SAD / SILENT
       (GHOST FIX)
    ================================ */
    if (
      from === "angry" &&
      (to === "happy" || to === "sad" || to === "silent")
    ) {
      isAnimatingRef.current = true;

      gsap.to(el, {
        scaleY: 0.15,
        scaleX: 0.85,
        duration: 0.25,
        ease: "cubic-bezier(0.16, 1, 0.3, 1)",
        onComplete: () => {
          // 🔴 HARD RESET — kills after-image
          gsap.killTweensOf(el);
          gsap.set(el, {
            clearProps: "transform",
            scale: 1,
            x: 0,
            y: 0,
          });

          setLip(to);

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

    /* ===============================
       HAPPY ↔ SAD ↔ SILENT
    ================================ */
    gsap.killTweensOf(el);
    gsap.set(el, { clearProps: "transform" });

    setLip(to);

    requestAnimationFrame(() => {
      if (lipRef.current) {
        transitionLipZoom(lipRef.current, from, to);
      }
    });

    prevEmotionRef.current = to;
  }, [emotion]);
}
