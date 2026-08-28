// src/components/Avatar/useLipBehavior.js
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { EMOTION_MAP } from "./emotionMap";


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
    // Phase 2: was "cubic-bezier(0.16, 1, 0.3, 1)" — CSS syntax, not a
    // valid GSAP ease string. GSAP doesn't error on an unrecognized
    // ease, it just silently falls back to its default, so this zoom
    // was never actually using the intended slow-settling curve.
    // "expo.out" is the closest built-in GSAP match for that curve.
    ease: "expo.out",
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

  // Root-cause note (found + proven via an isolated Playwright harness
  // that drove this hook directly and inspected the live DOM node):
  //
  // The HAPPY/SAD/SILENT -> ANGRY branch used to call `setLip("angry")`
  // and *then* immediately animate the `el` captured at the top of the
  // effect. But the lip <img> is keyed by `lip` (see Avatar.jsx), so
  // React unmounts the outgoing element and mounts a brand-new one on
  // that state change instead of mutating it in place — `el` still
  // pointed at the OUTGOING node. Instrumenting the hook confirmed
  // this directly: by the time the tween's onComplete fired, the
  // animated `el` had `isConnected: false` and was a different node
  // from the live `lipRef.current` (`sameNode: false`). The real,
  // visible lip element never received any transform — it sat at the
  // CSS default for the *entire* open animation and the
  // emotional-weight zoom meant to follow it, indefinitely (nothing
  // later corrects it; only a *different* lip-category transition
  // happens to touch the element again). That's the confirmed cause
  // of angry lips losing their open animation/zoom, and — because it
  // left this branch's bookkeeping (prevEmotionRef/isAnimatingRef)
  // internally consistent even though the visual never happened — of
  // subsequent transitions inheriting an already-wrong visual
  // baseline.
  //
  // Fix: defer this branch's element work to requestAnimationFrame and
  // re-read lipRef.current there, exactly like the ANGRY -> X and
  // default branches below already do for their own post-setLip step.
  // That guarantees we always grab the freshly-mounted node.

  // Second, separate issue also confirmed by the harness: while
  // isAnimatingRef is true, an emotion change arriving mid-transition
  // used to hit a bare `return` with no record of what was requested.
  // Once the in-flight transition's onComplete eventually fired, it
  // committed prevEmotionRef to *its own* stale target, not to
  // whatever the latest real emotion was — so that change was lost
  // outright, and the lip could sit on a stale category until some
  // later, unrelated transition happened to touch it. pendingEmotionRef
  // queues the most recent emotion seen while busy; once the in-flight
  // transition finishes, it's drained so the lip always converges on
  // the latest requested emotion instead of silently dropping it.
  const pendingEmotionRef = useRef(null);

  useEffect(() => {
    if (isAnimatingRef.current) {
      pendingEmotionRef.current = emotion;
      return;
    }
    runTransition(emotion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion]);

  function drainPending() {
    if (pendingEmotionRef.current === null) return;
    const next = pendingEmotionRef.current;
    pendingEmotionRef.current = null;
    runTransition(next);
  }

  function runTransition(targetEmotion) {
    const el = lipRef.current;
    if (!el) return;

    const from = prevEmotionRef.current;
    const safeMap = EMOTION_MAP[targetEmotion] ?? EMOTION_MAP.silent;
    const to = safeMap.lip;

    if (from === to) {
      drainPending();
      return;
    }

    /* =============================================
       HAPPY / SAD / SILENT → ANGRY
       (SHAPE FIRST, ZOOM AFTER)
    ============================================= */
    if (
      (from === "happy" || from === "sad" || from === "silent") &&
      to === "angry"
    ) {
      isAnimatingRef.current = true;

      // 1️⃣ mount angry lip. This only *schedules* the swap (the <img>
      // is keyed by `lip`, so React replaces the node rather than
      // mutating it) — the actual new element isn't committed until
      // after this synchronous block finishes.
      setLip("angry");

      // 2️⃣ + 3️⃣ run the reset + shape-open animation on the
      // freshly-mounted angry element once React has actually
      // committed it, instead of the stale pre-swap `el`.
      requestAnimationFrame(() => {
        const newEl = lipRef.current;
        if (!newEl) {
          isAnimatingRef.current = false;
          drainPending();
          return;
        }

        resetLip(newEl);

        gsap.fromTo(
          newEl,
          {
            scaleY: 0.15,
            scaleX: 0.85,
            transformOrigin: "center center",
          },
          {
            scaleY: 1,
            scaleX: 1,
            duration: 0.6, // slow, heavy
            // Was an invalid cubic-bezier string (see note above) —
            // "power4.out" is the closest built-in match for the
            // original curve's fast-start, hard-decelerate shape.
            ease: "power4.out",
            onComplete: () => {
              // 4️⃣ emotional weight
              transitionLipZoom(newEl, from, "angry");

              prevEmotionRef.current = to;
              isAnimatingRef.current = false;
              drainPending();
            },
          }
        );
      });
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
        // Was an invalid cubic-bezier string (see note above) —
        // "power2.inOut" is the closest built-in match for the
        // original symmetric ease-in/ease-out shape.
        ease: "power2.inOut",
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
          drainPending();
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
    drainPending();
  }
}