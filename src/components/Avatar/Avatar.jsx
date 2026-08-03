import { useRef, useState, useEffect } from "react";
import { EYES, LIPS } from "./faceMap";
import { EMOTION_MAP } from "./emotionMap";
import { useEyeBehavior } from "./useEyeBehavior";
import { useLipBehavior } from "./useLipBehavior";
import "./Avatar.css";

export default function Avatar({ emotion = "silent" }) {
  const eyeRef = useRef(null);
  const lipRef = useRef(null);

  // Safe fallback: use silent if emotion not in map (prevents crash on composite emotions)
  const map = EMOTION_MAP[emotion] ?? EMOTION_MAP.silent;

  // visual-only state
  const [eye, setEye] = useState(map.eye);
  const [lip, setLip] = useState(map.lip);

  // Phase 2 (§5 rendering): eagerly warm the browser's image cache for
  // every eye/lip SVG variant on mount, instead of only fetching each
  // one lazily the first time its emotion is reached via a <img src>
  // swap. Without this, the *first* transition into any given emotion
  // (e.g. the first time "angry" is reached in a session) pays a
  // network+decode cost mid-animation, which can show as a brief flash
  // or pop. All these files are small SVGs, so preloading all of them
  // up front is cheap and removes that first-use stall entirely.
  useEffect(() => {
    const urls = [
      ...Object.keys(EYES).map((key) => `/svg/eyes/${key}-eye.svg`),
      ...Object.keys(LIPS).map((key) => `/svg/lips/${key}-lip.svg`),
    ];
    const images = urls.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
    // Nothing to clean up — letting the browser cache hold onto these
    // is the entire point. Keeping the array alive until unmount just
    // avoids the (harmless) chance of GC dropping an in-flight request.
    return () => {
      images.length = 0;
    };
  }, []);

  // 🔑 PROP → VISUAL SYNC
  useEffect(() => {
    const safeMap = EMOTION_MAP[emotion] ?? EMOTION_MAP.silent;
    setEye(safeMap.eye);
    setLip(safeMap.lip);
  }, [emotion]);

  useEyeBehavior({
    eyeRef,
    eye,
    setEye,
    emotion,
  });

  useLipBehavior({
    lipRef,
    lip,
    setLip,
    emotion,
  });

  const eyeStyle = EYES[eye];
  const lipStyle = LIPS[lip];

  return (
    <div className="avatar">
      <img className="skin" src="/svg/skin.svg" />

      <img
        ref={eyeRef}
        className="eyes"
        src={`/svg/eyes/${eye}-eye.svg`}
        style={{
          left: eyeStyle.x,
          top: eyeStyle.y,
          width: eyeStyle.w,
          height: eyeStyle.h,
        }}
      />

      <div
        className="avatar_lip_slot"
        style={{
          left: lipStyle.x,
          top: lipStyle.y,
          width: lipStyle.w,
          height: lipStyle.h,
        }}
      >
        <img
          key={lip}
          ref={lipRef}
          className="avatar_lips"
          src={`/svg/lips/${lip}-lip.svg`}
        />
      </div>

      <img className="body" src="/svg/body.svg" />
    </div>
  );
}
