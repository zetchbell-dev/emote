import Avatar from "./components/Avatar/Avatar";
import EmotionInput from "./components/EmotionInput";
import MessageList from "./components/MessageList";
import EmotionTimeline from "./components/EmotionTimeline";
import EmotionDebug from "./components/EmotionDebug";
import { useEmotionController } from "./controllers/useEmotionController";

export default function App() {
  const {
    emotion,
    emotionField,
    messages,
    submitText,
    timeline,
  } = useEmotionController();

  return (
    <div className="app-container">

      {/* HERO SECTION */}
      <section className="hero">
        <div className="bg-layer" />
        <div className="avatar-wrapper">
          <Avatar emotion={emotion || "silent"} />
        </div>
      </section>

      {/* REVEAL SECTION */}
      <section className="reveal">
        <div className="content-wrapper">
          <EmotionTimeline data={timeline} />
          <MessageList messages={messages} />
          <EmotionInput onSubmit={submitText} />
        </div>
      </section>

      {import.meta.env.DEV && (
        <EmotionDebug emotion={emotion} field={emotionField} />
      )}

    </div>
  );
}

