import { useRef, useState, useEffect } from "react";
import { EYES, LIPS } from "./faceMap";
import { EMOTION_MAP } from "./emotionMap";
import { useEyeBehavior } from "./useEyeBehavior";
import { useLipBehavior } from "./useLipBehavior";
import "./Avatar.css";

export default function Avatar() {
  const eyeRef = useRef(null);
  const lipRef = useRef(null);

  const [emotion, setEmotion] = useState("happy");

  // 🔴 eye must be stateful for blink
  const [eye, setEye] = useState(EMOTION_MAP[emotion].eye);
  const [lip, setLip] = useState(EMOTION_MAP[emotion].lip);

  // 🔄 when emotion changes, update base eye/lip
  useEffect(() => {
    const map = EMOTION_MAP[emotion];
    setEye(map.eye);
    setLip(map.lip);
  }, [emotion]);

  useEyeBehavior({
    eyeRef,
    eye,
    setEye,   // 🔴 REQUIRED for blink
    emotion,
  });

  useLipBehavior({
    emotion,
    lipRef,
    setLip,
  });

  const eyeStyle = EYES[eye];
  const lipStyle = LIPS[lip];

  return (
    <div className="avatar">
      <img className="skin" src="/svg/skin.svg" />

      {/* EYES */}
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

      {/* LIPS */}
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
          alt=""
        />
      </div>

      <img className="body" src="/svg/body.svg" />

      {/* TEMP CONTROLS */}
      <div className="mood-controls">
        <button onClick={() => setEmotion("happy")}>Happy</button>
        <button onClick={() => setEmotion("angry")}>Angry</button>
        <button onClick={() => setEmotion("sad")}>Sad</button>
        <button onClick={() => setEmotion("silent")}>Silent</button>
      </div>
    </div>
  );
}
