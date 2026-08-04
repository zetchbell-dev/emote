import { useEffect, useRef, useState } from "react";

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
        // `fontSize` is still the base px value computed by the
        // untouched progressive size-step logic below (newest
        // biggest, oldest smallest). It's passed through as a CSS
        // variable and multiplied by --hud-text-scale in the style
        // attribute (rather than hardcoded as `${fontSize}px`) so
        // message text resizes along with the rest of the HUD
        // instead of staying a fixed pixel size regardless of
        // window size.
        "--msg-base-size": fontSize,
        fontSize: `calc(var(--msg-base-size) * 1px * var(--hud-text-scale))`,
        // Kept as a CSS variable (rather than an inline `opacity`)
        // specifically so it never fights with the .show class for
        // control of the opacity property — see MessageList.jsx
        // history / issue #1.
        "--stack-opacity": stackOpacity,
      }}
    >
      {text}
    </div>
  );
}

export default function MessageList({ messages = [] }) {
  const maxVisible = 5;

  // Owns the scrollable region so newly-added messages are always
  // brought into view. This is the one piece of layout logic the new
  // architecture needed that the old fake-scroll page didn't: with a
  // real `overflow-y: auto` container, the browser does NOT auto-stick
  // to the bottom on its own when content is appended, so we do it
  // explicitly whenever the message count changes.
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    <div className="message-scroll" ref={scrollRef}>
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
