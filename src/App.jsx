import Avatar from "./components/Avatar/Avatar";
import EmotionInput from "./components/EmotionInput";
import MessageList from "./components/MessageList";
import EmotionTimeline from "./components/EmotionTimeline";
import EmotionDebug from "./components/EmotionDebug";
import { useEmotionController } from "./controllers/useEmotionController";

export default function App() {
  const {
    emotion,
    messages,
    emotionField,
    submitText,
    timeline,
  } = useEmotionController();

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      {/* ✅ AVATAR (deterministic render) */}
      <Avatar emotion={emotion || "silent"} />

      {/* ✅ TIMELINE (field visualization) */}
      <EmotionTimeline data={timeline} />

      {/* ✅ MESSAGE SYSTEM */}
      <MessageList messages={messages} />
      <EmotionInput onSubmit={submitText} />

      {/* ✅ DEBUG PANEL (DEV only) */}
      {import.meta.env.DEV && (
        <EmotionDebug emotion={emotion} field={emotionField} />
      )}
    </div>
  );
}
