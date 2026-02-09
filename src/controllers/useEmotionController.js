import { useEffect, useRef, useState } from "react";

import { interpretEmotion } from "../ai/emotionAI";
import {
  updateEmotionField,
  getDominantEmotion,
} from "../engine/emotionField";
import { clampEmotion } from "../engine/clampEmotion";
import { decayEmotionField } from "../engine/decay";

export function useEmotionController() {
  const [messages, setMessages] = useState([]);
  const [emotion, setEmotion] = useState("silent");

  const [emotionField, setEmotionField] = useState({
    happy: 0,
    sad: 0,
    angry: 0,
    silent: 0,
  });

  const lastUpdateRef = useRef(Date.now());
  const emotionLockRef = useRef(0);

  /* -----------------------------
     Passive emotional decay
  ----------------------------- */
  useEffect(() => {
    const id = setInterval(() => {
      setEmotionField((prev) => decayEmotionField(prev));
    }, 2000);

    return () => clearInterval(id);
  }, []);

  /* -----------------------------
     Submit text → AI → Engine
  ----------------------------- */
  async function submitText(text) {
    if (!text.trim()) return;

    const now = Date.now();
    const deltaMs = now - lastUpdateRef.current;
    lastUpdateRef.current = now;

    const ai = await interpretEmotion(text);

    setMessages((m) => [...m, { text }]);

    setEmotionField((prev) => {
      const updated = updateEmotionField(prev, ai, deltaMs);
      const suggested = getDominantEmotion(updated, emotion);

      setEmotion((current) => {
        // 🔒 Minimum emotion duration
        if (now < emotionLockRef.current) return current;

        const finalEmotion = clampEmotion(
          current,
          suggested,
          ai.confidence
        );

        emotionLockRef.current = now + 1200;
        return finalEmotion;
      });

      return updated;
    });
  }

  return {
    emotion,
    messages,
    emotionField,
    submitText,
  };
}
