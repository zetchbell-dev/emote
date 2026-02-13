// src/components/EmotionTimeline.jsx

/**
 * Emotional Timeline Graph
 * Shows field intensity over time.
 * 
 * Presentational only. Accepts precomputed history data.
 */

export default function EmotionTimeline({ data = [] }) {
  const width = 600;
  const height = 180;
  const padding = 20;

  const maxTime =
    data.length > 0
      ? data[data.length - 1].time
      : 1;

  function scaleX(time) {
    return padding + (time / maxTime) * (width - padding * 2);
  }

  function scaleY(value) {
    return height - padding - value * (height - padding * 2);
  }

  function buildPath(key) {
    if (data.length === 0) return "";

    return data
      .map((point, i) => {
        const x = scaleX(point.time);
        const y = scaleY(point[key] || 0);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }

  return (
    <div style={{ padding: "20px" }}>
      <h4 style={{ color: "#aaa", fontSize: "12px" }}>
        Emotional Field Timeline
      </h4>

      <svg
        width={width}
        height={height}
        style={{
          background: "#111",
          borderRadius: "8px",
        }}
      >
        {/* Happy */}
        <path
          d={buildPath("happy")}
          stroke="#4CAF50"
          strokeWidth="2"
          fill="none"
        />

        {/* Sad */}
        <path
          d={buildPath("sad")}
          stroke="#2196F3"
          strokeWidth="2"
          fill="none"
        />

        {/* Angry */}
        <path
          d={buildPath("angry")}
          stroke="#F44336"
          strokeWidth="2"
          fill="none"
        />

        {/* Silent */}
        <path
          d={buildPath("silent")}
          stroke="#9E9E9E"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    </div>
  );
}
