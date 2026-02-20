export default function EmotionTimeline({ data = [] }) {
  const width = 360;
  const height = 120;
  const padding = 8;

  const maxTime =
    data.length > 0
      ? data[data.length - 1].time
      : 1;

  function scaleX(time) {
    return padding + (time / maxTime) * (width - padding * 2);
  }
// Compute dynamic max value
const maxValue = Math.max(
  0.15, // prevents crazy amplification
  ...data.flatMap(point => [
    point.happy || 0,
    point.sad || 0,
    point.angry || 0,
    point.silent || 0
  ])
);

function scaleY(value) {
  return (
    height -
    padding -
    (value / maxValue) * (height - padding * 2)
  );
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
    <div className="timeline-container">
      <div className="timeline-heading">
        Emotion Timeline
      </div>

      <svg
        width={width}
        height={height}
        className="timeline-svg"
      >
        <path d={buildPath("happy")} stroke="#4CAF50" strokeWidth="1.5" fill="none" />
        <path d={buildPath("sad")} stroke="#2196F3" strokeWidth="1.5" fill="none" />
        <path d={buildPath("angry")} stroke="#F44336" strokeWidth="1.5" fill="none" />
        <path d={buildPath("silent")} stroke="#9E9E9E" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}