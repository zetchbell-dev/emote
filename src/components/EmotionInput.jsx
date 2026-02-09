import { useState } from "react";

export default function EmotionInput({ onSubmit }) {
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim()) return;
    onSubmit(text);
    setText("");
  }

  return (
    <div className="input-box">
      <input
        placeholder="Write what you’re thinking…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button onClick={submit}>Send</button>
    </div>
  );
}
