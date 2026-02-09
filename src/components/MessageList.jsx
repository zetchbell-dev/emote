export default function MessageList({ messages }) {
  return (
    <div className="messages">
      {messages.map((m, i) => (
        <div key={i} className="message">
          {m.text}
        </div>
      ))}
    </div>
  );
}
