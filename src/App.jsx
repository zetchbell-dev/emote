import { useEffect, useState } from "react";
import { useEmotionController } from "./controllers/useEmotionController";
import { preloadModel } from "./ai/emotionAI";
import Avatar from "./components/Avatar/Avatar";
import EmotionTimeline from "./components/EmotionTimeline";
import MessageList from "./components/MessageList";
import EmotionInput from "./components/EmotionInput";
import EmotionDebug from "./components/EmotionDebug";

export default function App() {
  const {
    emotion,
    emotionField,
    messages,
    submitText,
    timeline,
  } = useEmotionController();

  // Toggle Emotion Debug panel (Press F2)
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Preload the AI model on startup
    preloadModel();

    // Toggle Debug Panel with F2
    const handleKeyDown = (event) => {
      if (event.key === "F2") {
        event.preventDefault();
        setShowDebug((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      {/* AMBIENT BACKDROP — sits behind the fixed-ratio scene canvas.
          Purely decorative: a blurred, viewport-covering continuation of
          the same artwork so the frame never cuts to flat black when the
          canvas's locked aspect ratio doesn't match the viewport's. Does
          not participate in any layout math the scene/avatar rely on. */}
      <div className="bg-bleed" aria-hidden="true" />

      {/* FIXED SCENE — Fixed-ratio canvas (3061.77 × 2090) for exact Figma alignment.
          Untouched: background + avatar positioning logic is unchanged. */}
      <div className="scene-layer">
        <div className="scene-canvas">
          <div className="bg-layer" />

          {/* Ground glow — a soft, low-opacity radial anchor beneath the
              avatar's feet so the lower frame reads as intentional rather
              than empty. Purely visual; does not affect avatar-wrapper's
              position/size. */}
          <div className="ground-glow" aria-hidden="true" />

          <div className="avatar-wrapper">
            <Avatar emotion={emotion || "silent"} />
          </div>
        </div>
      </div>

      {/*
        HUD LAYER — sized and positioned exactly like .scene-canvas
        (see .hud-layer in index.css), so every panel inside it
        anchors to the ART's corners via `position: absolute`, not
        the viewport's via `position: fixed`. This is what stops
        Timeline/Debug/Chat from drifting into the black gap below
        the canvas on screens whose ratio doesn't match the art's.
        The only element that ever scrolls internally is the
        message list inside .chat-dock.
      */}
      <div className="hud-layer">
        <EmotionTimeline data={timeline} />

        {/* Press F2 to Show / Hide Debug Panel */}
        {showDebug && (
          <EmotionDebug emotion={emotion} field={emotionField} />
        )}

        <div className="chat-dock">
          <MessageList messages={messages} />
          <EmotionInput onSubmit={submitText} />
        </div>
      </div>
    </>
  );
}
