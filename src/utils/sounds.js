// ── Omix Store Sound Effects ───────────────────────────────────
// Web Audio API tone generator — no external audio files needed.
// For Android users: uses vibration when available alongside audio.
//
// To mute all sounds: localStorage.setItem('omix_sound_muted', 'true')
// Per-sound type muting: localStorage.setItem('omix_sound_muted_checkout', 'true')

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let _vibrateSupported = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  return audioCtx;
}

function isVibrationSupported() {
  if (_vibrateSupported !== null) return _vibrateSupported;
  _vibrateSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  return _vibrateSupported;
}

function isMuted(soundName) {
  try {
    if (localStorage.getItem('omix_sound_muted') === 'true') return true;
    if (soundName && localStorage.getItem(`omix_sound_muted_${soundName}`) === 'true') return true;
  } catch {
    /* localStorage unavailable */
  }
  return false;
}

function playTone({ frequency, duration, type = 'sine', volume = 0.3, rampDown = true }) {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    if (rampDown) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Silently fail if audio is blocked
  }
}

function playSequence(notes) {
  if (isMuted()) return;
  notes.forEach((note, i) => {
    setTimeout(() => playTone(note), i * 120);
  });
}

/**
 * Vibrate the device (Android-focused).
 * @param {number[]} pattern - Vibration pattern in ms (on, off, on, ...)
 */
function vibrate(pattern, soundName) {
  if (!isVibrationSupported()) return;
  if (isMuted(soundName)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* not supported */
  }
}

/**
 * Play sound + vibrate combo for Android haptic feedback.
 */
function playWithVibrate(soundFn, vibPattern, soundName) {
  soundFn();
  if (vibPattern) vibrate(vibPattern, soundName);
}

export const sounds = {
  // ── Existing sounds (enhanced with vibration) ────────────────

  // Success / Checkout complete — ascending cheerful chime
  checkout() {
    playWithVibrate(
      () => playSequence([
        { frequency: 523, duration: 0.15, volume: 0.25 },  // C5
        { frequency: 659, duration: 0.15, volume: 0.25 },  // E5
        { frequency: 784, duration: 0.25, volume: 0.3 },   // G5
      ]),
      [100, 50, 100],
      'checkout'
    );
  },

  // Add to cart — soft pop
  addToCart() {
    playWithVibrate(
      () => {
        playTone({ frequency: 880, duration: 0.08, type: 'sine', volume: 0.2 });
        setTimeout(() => playTone({ frequency: 1100, duration: 0.06, type: 'sine', volume: 0.15 }), 60);
      },
      [30],
      'addToCart'
    );
  },

  // Remove from cart — brief descending tone
  removeFromCart() {
    playWithVibrate(
      () => {
        playTone({ frequency: 600, duration: 0.1, type: 'sine', volume: 0.15 });
        setTimeout(() => playTone({ frequency: 400, duration: 0.12, type: 'sine', volume: 0.12 }), 80);
      },
      [50],
      'removeFromCart'
    );
  },

  // Login — welcoming ascending tone
  login() {
    playSequence([
      { frequency: 440, duration: 0.1, volume: 0.2 },   // A4
      { frequency: 554, duration: 0.1, volume: 0.2 },   // C#5
      { frequency: 659, duration: 0.15, volume: 0.25 }, // E5
      { frequency: 880, duration: 0.2, volume: 0.2 },   // A5
    ]);
    vibrate([80, 40, 80], 'login');
  },

  // Logout — gentle descending
  logout() {
    playSequence([
      { frequency: 659, duration: 0.12, volume: 0.2 },  // E5
      { frequency: 554, duration: 0.12, volume: 0.18 }, // C#5
      { frequency: 440, duration: 0.18, volume: 0.15 }, // A4
    ]);
    vibrate([60], 'logout');
  },

  // Signup — bright success
  signup() {
    playWithVibrate(
      () => playSequence([
        { frequency: 523, duration: 0.1, volume: 0.2 },   // C5
        { frequency: 659, duration: 0.1, volume: 0.2 },   // E5
        { frequency: 784, duration: 0.1, volume: 0.2 },   // G5
        { frequency: 1047, duration: 0.2, volume: 0.25 }, // C6
      ]),
      [80, 50, 80, 50, 120],
      'signup'
    );
  },

  // Error / warning — short buzz
  error() {
    playWithVibrate(
      () => {
        playTone({ frequency: 200, duration: 0.15, type: 'sawtooth', volume: 0.15 });
        setTimeout(() => playTone({ frequency: 180, duration: 0.2, type: 'sawtooth', volume: 0.1 }), 100);
      },
      [200, 100, 200],
      'error'
    );
  },

  // Notification — gentle ping
  notification() {
    playWithVibrate(
      () => {
        playTone({ frequency: 1000, duration: 0.1, volume: 0.15 });
        setTimeout(() => playTone({ frequency: 1200, duration: 0.08, volume: 0.1 }), 100);
      },
      [100, 50, 100],
      'notification'
    );
  },

  // Button click — subtle tap
  click() {
    playTone({ frequency: 700, duration: 0.03, type: 'sine', volume: 0.08 });
    vibrate([15], 'click');
  },

  // Wishlist — soft heart-beat like
  wishlist() {
    playWithVibrate(
      () => {
        playTone({ frequency: 500, duration: 0.08, volume: 0.15 });
        setTimeout(() => playTone({ frequency: 600, duration: 0.1, volume: 0.12 }), 100);
      },
      [60, 40, 80],
      'wishlist'
    );
  },

  // Search — quick sweep
  search() {
    try {
      if (isMuted('search')) return;
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) { /* silent */ }
    vibrate([20], 'search');
  },

  // Payment processing — thinking tone
  processing() {
    playSequence([
      { frequency: 600, duration: 0.08, volume: 0.1 },
      { frequency: 800, duration: 0.08, volume: 0.1 },
      { frequency: 600, duration: 0.08, volume: 0.1 },
    ]);
  },

  // Order status update
  orderUpdate() {
    playWithVibrate(
      () => playSequence([
        { frequency: 800, duration: 0.1, volume: 0.15 },
        { frequency: 1000, duration: 0.15, volume: 0.15 },
        { frequency: 1200, duration: 0.1, volume: 0.12 },
      ]),
      [100, 50, 150],
      'orderUpdate'
    );
  },

  // ── NEW SOUNDS ─────────────────────────────────────────────

  // Refund processed — gentle descending rain-like
  refund() {
    playWithVibrate(
      () => {
        playTone({ frequency: 800, duration: 0.15, volume: 0.2 });
        setTimeout(() => playTone({ frequency: 700, duration: 0.15, volume: 0.18 }), 100);
        setTimeout(() => playTone({ frequency: 600, duration: 0.2, volume: 0.15 }), 200);
        setTimeout(() => playTone({ frequency: 500, duration: 0.25, volume: 0.12 }), 300);
      },
      [100, 50, 100, 50, 150],
      'refund'
    );
  },

  // Coupon applied — sparkle chime
  coupon() {
    playWithVibrate(
      () => {
        playTone({ frequency: 660, duration: 0.08, volume: 0.15 });
        setTimeout(() => playTone({ frequency: 880, duration: 0.08, volume: 0.15 }), 80);
        setTimeout(() => playTone({ frequency: 1100, duration: 0.08, volume: 0.15 }), 160);
        setTimeout(() => playTone({ frequency: 1320, duration: 0.15, volume: 0.2 }), 240);
      },
      [40, 30, 40, 30, 60],
      'coupon'
    );
  },

  // New chat message — soft double pop
  chat() {
    playWithVibrate(
      () => {
        playTone({ frequency: 600, duration: 0.05, volume: 0.1 });
        setTimeout(() => playTone({ frequency: 750, duration: 0.05, volume: 0.08 }), 50);
      },
      [40, 30, 40],
      'chat'
    );
  },

  // Delivery arrived — cheerful doorbell
  delivery() {
    playWithVibrate(
      () => {
        playSequence([
          { frequency: 523, duration: 0.15, volume: 0.25 },  // C5
          { frequency: 659, duration: 0.15, volume: 0.25 },  // E5
          { frequency: 784, duration: 0.1, volume: 0.2 },    // G5
          { frequency: 1047, duration: 0.3, volume: 0.3 },   // C6
        ]);
      },
      [150, 80, 150, 80, 200],
      'delivery'
    );
  },

  // Rating submitted — short friendly tone
  rating() {
    playWithVibrate(
      () => {
        playTone({ frequency: 880, duration: 0.1, volume: 0.2 });
        setTimeout(() => playTone({ frequency: 1100, duration: 0.15, volume: 0.18 }), 80);
      },
      [60, 40, 80],
      'rating'
    );
  },

  // Achievement / milestone — victorious fanfare
  achievement() {
    playWithVibrate(
      () => playSequence([
        { frequency: 523, duration: 0.12, volume: 0.2 },   // C5
        { frequency: 659, duration: 0.12, volume: 0.2 },   // E5
        { frequency: 784, duration: 0.12, volume: 0.2 },   // G5
        { frequency: 1047, duration: 0.15, volume: 0.25 },  // C6
        { frequency: 1319, duration: 0.2, volume: 0.3 },    // E6
      ]),
      [80, 50, 80, 50, 100, 50, 150],
      'achievement'
    );
  },

  // Cancel action — descending rejection
  cancel() {
    playWithVibrate(
      () => {
        playTone({ frequency: 500, duration: 0.12, volume: 0.15 });
        setTimeout(() => playTone({ frequency: 400, duration: 0.12, volume: 0.12 }), 100);
        setTimeout(() => playTone({ frequency: 300, duration: 0.2, volume: 0.1 }), 200);
      },
      [100, 50, 150],
      'cancel'
    );
  },

  // Confirm action — solid affirmative
  confirm() {
    playWithVibrate(
      () => {
        playTone({ frequency: 400, duration: 0.08, volume: 0.15 });
        setTimeout(() => playTone({ frequency: 600, duration: 0.12, volume: 0.2 }), 80);
      },
      [40, 30, 80],
      'confirm'
    );
  },

  // Share action — quick whoosh
  share() {
    try {
      if (isMuted('share')) return;
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) { /* silent */ }
    vibrate([30], 'share');
  },

  // Low stock warning — alert tone for admins
  lowStock() {
    playWithVibrate(
      () => {
        playTone({ frequency: 440, duration: 0.1, type: 'square', volume: 0.08 });
        setTimeout(() => playTone({ frequency: 440, duration: 0.1, type: 'square', volume: 0.08 }), 200);
      },
      [150, 100, 150],
      'lowStock'
    );
  },

  // Screenshot captured — camera-like snap
  screenshot() {
    playTone({ frequency: 200, duration: 0.02, type: 'square', volume: 0.04 });
    setTimeout(() => playTone({ frequency: 300, duration: 0.02, type: 'square', volume: 0.03 }), 15);
    vibrate([25], 'screenshot');
  },

  // ── Utility ─────────────────────────────────────────────────

  /**
   * Check if sound is globally muted.
   */
  isMuted() {
    return isMuted();
  },

  /**
   * Toggle global mute on/off. Returns new state.
   */
  toggleMute() {
    const current = isMuted();
    const next = !current;
    try {
      localStorage.setItem('omix_sound_muted', next ? 'true' : 'false');
    } catch {
      /* ignore */
    }
    return next;
  },
};

export default sounds;
