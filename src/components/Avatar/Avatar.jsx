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

  // lip is still local, visual-only state (unchanged)
  const [lip, setLip] = useState(map.lip);

  // Eagerly warm the browser's image cache for every eye/lip SVG
  // variant on mount, instead of only fetching each one lazily the
  // first time its emotion is reached via a <img src> swap. All these
  // files are small SVGs, so preloading up front removes any
  // first-use network/decode stall.
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
    return () => {
      images.length = 0;
    };
  }, []);

  // 🔑 PROP → VISUAL SYNC (lip only — eye is owned end-to-end by
  // useEyeBehavior, which decides when the emotion→eye swap happens
  // relative to the blink cycle. Avatar.jsx never calls setEye.)
  useEffect(() => {
    const safeMap = EMOTION_MAP[emotion] ?? EMOTION_MAP.silent;
    setLip(safeMap.lip);
  }, [emotion]);

  const { eye } = useEyeBehavior({
    eyeRef,
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
