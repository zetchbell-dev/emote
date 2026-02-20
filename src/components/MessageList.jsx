export default function MessageList({ messages = [] }) {
  const maxVisible = 5;

  return (
    <div className="cinema-messages">
      {messages.map((msg, index) => {
        const total = messages.length;
        const distanceFromLast = total - 1 - index;

        // Progressive size reduction
        const baseSize = 28; // newest
        const sizeStep = 3;  // decrease per level
        const minSize = 14;

        const fontSize = Math.max(
          minSize,
          baseSize - distanceFromLast * sizeStep
        );

        // Progressive opacity fade after 5
        let opacity = 1;
        if (total > maxVisible && distanceFromLast >= maxVisible) {
          opacity = 0;
        } else {
          opacity = 1 - distanceFromLast * 0.15;
        }

        return (
          <div
            key={index}
            className="cinema-message"
            style={{
              fontSize: `${fontSize}px`,
              opacity,
            }}
          >
            {msg.text}
          </div>
        );
      })}
    </div>
  );
}