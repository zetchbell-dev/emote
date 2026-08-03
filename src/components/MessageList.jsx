import { useEffect, useState } from "react";

/**
 * A single cinematic message bubble. Owns its own "has this entered
 * yet" state so it can flip from the CSS's hidden default state to
 * `.show` one frame after mounting — see comment below for why that
 * frame matters.
 */
function CinemaMessage({ text, fontSize, stackOpacity }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // The CSS gives .cinema-message a default hidden state (opacity: 0,
    // translateY(30px)) and only animates toward the visible state when
    // .show is present. If we added the "show" class synchronously on
    // the very first render, React would never actually paint the
    // hidden state first — the element would appear already-shown,
    // with no starting point for the transition to animate from.
    //
    // Waiting one animation frame guarantees the browser has painted
    // the hidden state at least once before we flip the class, so the
    // opacity/transform transition has something to interpolate from.
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShow(true));
    });

    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <div
      className={`cinema-message${show ? " show" : ""}`}
      style={{
        fontSize: `${fontSize}px`,
        // Consumed by .cinema-message.show in index.css. Kept as a CSS
        // variable (rather than the old inline `opacity`) specifically
        // so it never fights with the .show class for control of the
        // opacity property — see MessageList.jsx history / issue #1.
        "--stack-opacity": stackOpacity,
      }}
    >
      {text}
    </div>
  );
}

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
        let stackOpacity = 1;
        if (total > maxVisible && distanceFromLast >= maxVisible) {
          stackOpacity = 0;
        } else {
          stackOpacity = 1 - distanceFromLast * 0.15;
        }

        return (
          <CinemaMessage
            // NOTE: still keyed by index here on purpose. Switching to a
            // stable id is issue #3 and touches how messages are created
            // upstream (useEmotionController) — out of scope for this
            // fix. Fixing #3 will also remove the one edge case this
            // leaves behind (see "Possible side effects" in the writeup).
            key={index}
            text={msg.text}
            fontSize={fontSize}
            stackOpacity={stackOpacity}
          />
        );
      })}
    </div>
  );
}
