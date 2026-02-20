import { useState } from "react";

export default function EmotionInput({ onSubmit }) {
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim()) return;
    onSubmit(text);
    setText("");
  }

  return (
    <div className="input-container">
      <input
        className="emotion-input"
        placeholder="Unfiltered thoughts go here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button className="emotion-send" onClick={submit}>
        Send
      </button>
    </div>
  );
}