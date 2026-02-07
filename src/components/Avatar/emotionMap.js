// src/components/Avatar/emotionMap.js

/**
 * Single source of truth:
 * emotion → which eye + which lip to use
 *
 * Avatar NEVER decides eye/lip directly.
 * Only emotion changes.
 */

export const EMOTION_MAP = {
  happy: {
    eye: "happy",
    lip: "happy",
  },

  sad: {
    eye: "sad",
    lip: "sad",
  },

  angry: {
    eye: "angry",
    lip: "angry",
  },

  silent: {
    eye: "silent",
    lip: "happy",
  },

  // future examples (NOT active yet)
  // tired: { eye: "silent", lip: "sad" },
  // sarcastic: { eye: "happy", lip: "angry" },
};
