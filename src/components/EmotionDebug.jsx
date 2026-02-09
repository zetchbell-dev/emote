export default function EmotionDebug({ field }) {
  return (
    <pre className="debug">
      {JSON.stringify(field, null, 2)}
    </pre>
  );
}
