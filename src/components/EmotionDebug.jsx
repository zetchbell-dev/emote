/**
 * Emotion Debug Panel (DEV only)
 * Read-only display of current emotion state.
 */

export default function EmotionDebug({ emotion, field }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: "8px",
        padding: "16px",
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#aaa",
        maxWidth: "300px",
        zIndex: 9999,
      }}
    >
      <div style={{ marginBottom: "12px", color: "#fff" }}>
        <strong>Emotion:</strong>{" "}
        <span style={{ color: "#4CAF50" }}>{emotion}</span>
      </div>
      <div>
        <strong>Field:</strong>
        <pre
          style={{
            margin: "8px 0 0 0",
            fontSize: "11px",
            color: "#888",
            overflow: "auto",
            maxHeight: "200px",
          }}
        >
          {JSON.stringify(field, null, 2)}
        </pre>
      </div>
    </div>
  );
}
