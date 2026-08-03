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

  /* -----------------------------------------------------------------
     AMBIENT MICRO-DRIFT — mount-only (Phase 2 fix)

     Previously this ran in an effect keyed on `[eye]`, which meant it
     was killed and restarted every single time `eye` changed — and
     `eye` changes on every blink (twice per cycle: to "blink" and
     back), every 2.8–5s depending on emotion, forever. Each restart
     snapped the eye back to x:0/y:0 before starting a fresh tween, so
     the "ambient drift" was actually being cut off and re-started
     from a hard reset several times a minute — visible as a small but
     continuous jitter — while also creating/destroying two infinite
     GSAP tweens on every blink for no behavioral benefit, since the
     drift itself has nothing to do with which eye asset is showing.

     The `eyeRef` element is a stable DOM node for the lifetime of the
     Avatar (only its `src`/style change on emotion swaps — see
     Avatar.jsx, no `key` on the eye <img>), so the drift tween can
     safely start once on mount and simply keep running underneath
     whichever eye is currently displayed.

     Also fixes invalid easing: `"cubic-bezier(0.16, 1, 0.3, 1)"` is
     CSS syntax, not a GSAP ease — GSAP's ease parser only understands
     its own named eases (or a CustomEase instance). Passing a raw
     cubic-bezier string doesn't error, it just silently falls back to
     GSAP's default ease, so this drift was never actually using the
     intended slow-settling curve. `"expo.out"` is the closest built-in
     GSAP equivalent to that curve (the same ease popularized as
     "easeOutExpo") without adding a CustomEase dependency.
  ----------------------------------------------------------------- */
  useEffect(() => {
    if (!eyeRef.current) return;

    gsap.set(eyeRef.current, { clearProps: "transform", x: 0, y: 0 });

    // Two independent tweens with different periods (2.8s / 2s) so the
    // combined motion doesn't look like a simple back-and-forth loop —
    // kept as separate tweens (not one timeline) specifically so their
    // periods stay independent of each other.
    const driftX = gsap.to(eyeRef.current, {
      x: "+=0.2",
      duration: 2.8,
      repeat: -1,
      yoyo: true,
      ease: "expo.out",
    });
    const driftY = gsap.to(eyeRef.current, {
      y: "+=0.6",
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "expo.out",
    });

    return () => {
      driftX.kill();
      driftY.kill();
    };
  }, [eyeRef]);
}
