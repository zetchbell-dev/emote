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
