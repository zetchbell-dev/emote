import { useEffect } from "react";
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

  // Warm the sentiment model as soon as the app mounts, instead of
  // paying the full load cost on the user's first submitted message
  // (see audit §1.2 — preloadModel existed but was never called).
  useEffect(() => {
    preloadModel();
  }, []);

  return (
    <>
      {/* FIXED SCENE — Fixed-ratio canvas (3061.77 × 2090) for exact Figma alignment */}
      <div className="scene-layer">
        <div className="scene-canvas">
          <div className="bg-layer" />
          <div className="avatar-wrapper">
            <Avatar emotion={emotion || "silent"} />
          </div>
        </div>
      </div>

      {/* SCROLL LAYER */}
      <div className="scroll-layer">
        <div className="ui-content">
          <EmotionTimeline data={timeline} />
          <MessageList messages={messages} />
          <EmotionInput onSubmit={submitText} />
          {import.meta.env.DEV && (
            <EmotionDebug emotion={emotion} field={emotionField} />
          )}
        </div>
      </div>
    </>
  );
}