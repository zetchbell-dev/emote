/**
 * Emotion Debug Panel (DEV only)
 * Read-only display of current emotion state.
 *
 * Phase 2 (§6 code quality): removed a ~40-line commented-out earlier
 * draft of this same component that was left sitting above the live
 * version — dead weight with no behavioral purpose.
 */
export default function EmotionDebug({ emotion, field }) {
  return (
    <div className="debug">
      <div className="debug-title">
        Emotion: <span className="debug-emotion">{emotion}</span>
      </div>

      <div className="debug-field">
        {Object.entries(field).map(([key, value]) => (
          <div key={key} className="debug-row">
            <span className="debug-key">{key}</span>
            <span className="debug-value">
              {value.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
