// src/components/Avatar/useEyeBehavior.js
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { EMOTION_MAP } from "./emotionMap";

/* -----------------------------------------------------------------
   BLINK SYSTEM — SINGLE IMAGE, INSTANT SRC SWAP. (Version 4, locked.)

   One <img>, and a blink is just src="..." swapping between the
   current emotion's eye artwork and the shared blink-eye.svg. No
   opacity, no crossfade, no scale, no clip-path, no mask, no filter,
   no width/height animation — the browser never resamples anything,
   so every frame is pixel-perfect the instant it's painted.

   SINGLE OWNER OF EYE STATE. Avatar.jsx never calls setEye — this
   hook owns `eye` end to end and only ever hands the current value
   back out.

   Emotion changes are only ever applied while the closed frame is
   fully covering the eye: a change queues `pendingEyeRef` and forces
   an immediate blink, so the src swap always happens behind
   blink-eye.svg. The user never sees an emotion swap on an open eye.

   ---------------------------------------------------------------
   v4.1 hotfix (this revision) — three review items, no architecture
   change:

   R1 (Must Have): every timer this hook creates — the outer blink
   scheduler AND the two inner per-blink timers — is now stored in a
   ref and cleared on unmount. An `isMountedRef` guard additionally
   short-circuits `setEye`/`scheduleBlink`/`triggerBlink` if a timer
   fires after unmount (which can still happen for the instant between
   a timer firing and its own cleanup running). This closes the leak
   where a blink in flight at unmount could keep rescheduling itself
   forever.

   R2 (Should Have): the reopen step now re-reads `pendingEyeRef` one
   more time immediately before reopening, instead of only trusting
   the value already committed at CLOSE_MS. If a second emotion change
   lands in the CLOSE_MS→TOTAL_MS window, it's no longer dropped for a
   full extra blink cycle.

   R3 (Nice to Have): the scheduled interval between blinks is now the
   per-emotion base interval times a small random factor (0.85–1.15),
   instead of a fixed value every time.

   None of this changes what's rendered, when a blink starts, how long
   it lasts, or what triggers one — it only changes lifecycle safety
   and which value wins a same-blink race.
----------------------------------------------------------------- */

// Ambient blink cadence per top-level emotion. Composite emotions
// resolve to one of these four via EMOTION_MAP before reaching here.
const BLINK_INTERVAL = {
  happy: 2800,
  angry: 3400,
  sad: 4200,
  silent: 5000,
};

// Subtle randomization applied to BLINK_INTERVAL so blinks don't land
// on a metronome. ±15% keeps each emotion's characteristic cadence
// recognizable while removing the mechanical feel of a fixed timer.
const JITTER_MIN = 0.85;
const JITTER_MAX = 1.15;
const jitteredInterval = (baseMs) =>
  baseMs * (JITTER_MIN + Math.random() * (JITTER_MAX - JITTER_MIN));

// Blink choreography, in ms, from the proven original implementation:
// eye closes instantly at t=0, the pending/target frame is applied at
// CLOSE_MS (while still closed, so the swap is invisible), and the eye
// reopens at TOTAL_MS. Unchanged by this hotfix.
const CLOSE_MS = 110;
const TOTAL_MS = 180;

export function useEyeBehavior({ eyeRef, emotion }) {
  const safeInitial = EMOTION_MAP[emotion] ?? EMOTION_MAP.silent;

  // Sole piece of state for which eye asset is showing. Avatar.jsx
  // only reads this back — it never sets it.
  const [eye, setEye] = useState(safeInitial.eye);

  const prevEyeRef = useRef(safeInitial.eye); // last non-blink eye shown
  const pendingEyeRef = useRef(null); // queued emotion change, applied at next blink
  const isBlinkingRef = useRef(false);

  // Every timer this hook creates lives in a ref so it can be cleared
  // on unmount. blinkTimeoutRef = outer scheduler; closeTimeoutRef /
  // reopenTimeoutRef = the two timers inside a single blink.
  const blinkTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const reopenTimeoutRef = useRef(null);

  // Guards every timer callback against firing after unmount.
  const isMountedRef = useRef(true);

  /* -----------------------------
     Track last non-blink eye
  ----------------------------- */
  useEffect(() => {
    if (eye !== "blink") {
      prevEyeRef.current = eye;
    }
  }, [eye]);

  /* -----------------------------
     Blink scheduler (single clock)
  ----------------------------- */
  const scheduleBlink = () => {
    if (!isMountedRef.current) return;

    clearTimeout(blinkTimeoutRef.current);
    blinkTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      triggerBlink();
    }, jitteredInterval(BLINK_INTERVAL[emotion] || 3000));
  };

  /* -----------------------------
     Core blink — instant swaps only
  ----------------------------- */
  const triggerBlink = () => {
    if (isBlinkingRef.current) return;
    if (!isMountedRef.current) return;

    isBlinkingRef.current = true;
    setEye("blink"); // instant swap to blink-eye.svg, no transition

    // Midway through the blink — eye is fully closed — commit any
    // queued emotion change into prevEyeRef. This is the only point
    // an emotion swap is allowed to happen, so it's always hidden
    // behind the closed frame.
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      if (pendingEyeRef.current) {
        prevEyeRef.current = pendingEyeRef.current;
        pendingEyeRef.current = null;
      }
    }, CLOSE_MS);

    // Reopen — instant swap back to the correct emotion eye. Re-checks
    // pendingEyeRef one more time here (not just at CLOSE_MS above) so
    // a second emotion change landing in the CLOSE_MS→TOTAL_MS window
    // is still picked up instead of being dropped until the next
    // blink cycle.
    clearTimeout(reopenTimeoutRef.current);
    reopenTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;

      const target = pendingEyeRef.current ?? prevEyeRef.current;
      pendingEyeRef.current = null;
      prevEyeRef.current = target;

      setEye(target);
      isBlinkingRef.current = false;
      scheduleBlink();
    }, TOTAL_MS);
  };

  /* -----------------------------------------------------------------
     Emotion change → force a blink and let it carry the swap.

     If a blink is already in flight, the pending value above will be
     picked up by that blink (at CLOSE_MS, or at TOTAL_MS if it arrives
     late — see R2 above). If not, triggerBlink() starts one
     immediately, so the change is still only ever applied with the
     eye closed — never on an open eye.
  ----------------------------------------------------------------- */
  useEffect(() => {
    const safeMap = EMOTION_MAP[emotion] ?? EMOTION_MAP.silent;
    if (safeMap.eye === prevEyeRef.current) return;

    pendingEyeRef.current = safeMap.eye;

    clearTimeout(blinkTimeoutRef.current);
    triggerBlink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion]);

  /* -----------------------------
     Start blink loop (once) + full teardown on unmount
  ----------------------------- */
  useEffect(() => {
    isMountedRef.current = true;
    scheduleBlink();

    return () => {
      isMountedRef.current = false;
      clearTimeout(blinkTimeoutRef.current);
      clearTimeout(closeTimeoutRef.current);
      clearTimeout(reopenTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -----------------------------------------------------------------
     AMBIENT MICRO-DRIFT — mount-only, unchanged from Version 4. x/y
     translation only — never scale.
  ----------------------------------------------------------------- */
  useEffect(() => {
    if (!eyeRef.current) return;

    gsap.set(eyeRef.current, { clearProps: "transform", x: 0, y: 0 });

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

  return { eye };
}
