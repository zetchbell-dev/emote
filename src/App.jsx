import Avatar from "./components/Avatar/Avatar";
import EmotionInput from "./components/EmotionInput";
import MessageList from "./components/MessageList";

import { useEmotionController } from "./controllers/useEmotionController";

export default function App() {
  const {
    emotion,     // NEW system emotion (may be null early)
    messages,
    submitText,
  } = useEmotionController();

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      {/* ✅ OLD SYSTEM STILL WORKS */}
      {/* Avatar always has a safe fallback */}
      <Avatar emotion={emotion || "silent"} />

      {/* ✅ NEW SYSTEM IS ADDITIVE */}
      <MessageList messages={messages} />
      <EmotionInput onSubmit={submitText} />
    </div>
  );
}
