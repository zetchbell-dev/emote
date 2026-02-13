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
    lip: "silent",
  },

  disgust: {
    eye: "sad",
    lip: "angry",
  },

  sarcastic: {
    eye: "happy",
    lip: "angry",
  },

  tired: {
    eye: "silent",
    lip: "sad",
  },

  conflicted: {
  eye: "sad",
  lip: "happy",
},

overwhelmed: {
  eye: "sad",
  lip: "silent",
},

bittersweet: {
  eye: "sad",
  lip: "happy",
},

anxious: {
  eye: "angry",
  lip: "silent",
},

frustrated: {
  eye: "angry",
  lip: "sad",
},

  
};
