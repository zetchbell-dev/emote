// src/components/Avatar/useEyeBehavior.js
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { EMOTION_MAP } from "./emotionMap";


export function useEyeBehavior({
  eyeRef,
  eye,
  setEye,
  emotion,
}) {
  const prevEyeRef = useRef(eye);
  const pendingEyeRef = useRef(null);
  const isBlinkingRef = useRef(false);
  const blinkTimeoutRef = useRef(null);

  /* -----------------------------
     Track last non-blink eye
  ----------------------------- */
  useEffect(() => {
    if (eye !== "blink") {
      prevEyeRef.current = eye;
    }
  }, [eye]);

  /* -----------------------------
     Blink interval by emotion
  ----------------------------- */
  const BLINK_INTERVAL = {
    happy: 2800,
    angry: 3400,
    sad: 4200,
    silent: 5000,
  };

  /* -----------------------------
     Blink scheduler (SINGLE CLOCK)
  ----------------------------- */
  const scheduleBlink = () => {
    clearTimeout(blinkTimeoutRef.current);

    blinkTimeoutRef.current = setTimeout(() => {
      triggerBlink();
    }, BLINK_INTERVAL[emotion] || 3000);
  };

  /* -----------------------------
     Core blink logic
  ----------------------------- */
  const triggerBlink = () => {
    if (isBlinkingRef.current) return;

    isBlinkingRef.current = true;
    setEye("blink");

    // midway through blink → apply pending eye
    setTimeout(() => {
      if (pendingEyeRef.current) {
        setEye(pendingEyeRef.current);
        pendingEyeRef.current = null;
      }
    }, 110);

    // reopen
    setTimeout(() => {
      setEye(prevEyeRef.current);
      isBlinkingRef.current = false;
      scheduleBlink(); // 🔒 restart cycle cleanly
    }, 180);
  };

  /* -----------------------------
     Emotion change handler
  ----------------------------- */
  useEffect(() => {
    if (emotion === prevEyeRef.current) return;

    const safeMap = EMOTION_MAP[emotion] ?? EMOTION_MAP.silent;
pendingEyeRef.current = safeMap.eye;


    // 🔴 reset timer so blink timing feels natural
    clearTimeout(blinkTimeoutRef.current);
    triggerBlink();
  }, [emotion]);

  /* -----------------------------
     Start blink loop (once)
  ----------------------------- */
  useEffect(() => {
    scheduleBlink();
    return () => clearTimeout(blinkTimeoutRef.current);
  }, []);

  /* -----------------------------
     🔴 GSAP RESET ON EYE CHANGE
     (THIS FIXES FREEZING)
  ----------------------------- */
  useEffect(() => {
    if (!eyeRef.current) return;

    // kill previous motion
    gsap.killTweensOf(eyeRef.current);
    gsap.set(eyeRef.current, {
      clearProps: "transform",
      x: 0,
      y: 0,
    });

    // horizontal micro drift
    gsap.to(eyeRef.current, {
      x: "+=0.2",
      duration: 2.8,
      repeat: -1,
      yoyo: true,
      ease: "cubic-bezier(0.16, 1, 0.3, 1)",
    });

    // vertical micro drift
    gsap.to(eyeRef.current, {
      y: "+=0.6",
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "cubic-bezier(0.16, 1, 0.3, 1)",
    });
  }, [eye]); // 🔒 REQUIRED
}
