// In-app sound effects using Web Audio API — no external files needed

const AudioCtx = window.AudioContext || window.webkitAudioContext
let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new AudioCtx()
  }
  return audioCtx
}

function playTone({ frequency, duration, type = 'sine', volume = 0.3, rampDown = true }) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    if (rampDown) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    }
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch (e) {
    // Silently fail if audio is blocked
  }
}

function playSequence(notes) {
  notes.forEach((note, i) => {
    setTimeout(() => playTone(note), i * 120)
  })
}

export const sounds = {
  // Success / Checkout complete — ascending cheerful chime
  checkout() {
    playSequence([
      { frequency: 523, duration: 0.15, volume: 0.25 },  // C5
      { frequency: 659, duration: 0.15, volume: 0.25 },  // E5
      { frequency: 784, duration: 0.25, volume: 0.3 },   // G5
    ])
  },

  // Add to cart — soft pop
  addToCart() {
    playTone({ frequency: 880, duration: 0.08, type: 'sine', volume: 0.2 })
    setTimeout(() => playTone({ frequency: 1100, duration: 0.06, type: 'sine', volume: 0.15 }), 60)
  },

  // Remove from cart — brief descending tone
  removeFromCart() {
    playTone({ frequency: 600, duration: 0.1, type: 'sine', volume: 0.15 })
    setTimeout(() => playTone({ frequency: 400, duration: 0.12, type: 'sine', volume: 0.12 }), 80)
  },

  // Login — welcoming ascending tone
  login() {
    playSequence([
      { frequency: 440, duration: 0.1, volume: 0.2 },   // A4
      { frequency: 554, duration: 0.1, volume: 0.2 },   // C#5
      { frequency: 659, duration: 0.15, volume: 0.25 }, // E5
      { frequency: 880, duration: 0.2, volume: 0.2 },   // A5
    ])
  },

  // Logout — gentle descending
  logout() {
    playSequence([
      { frequency: 659, duration: 0.12, volume: 0.2 },  // E5
      { frequency: 554, duration: 0.12, volume: 0.18 }, // C#5
      { frequency: 440, duration: 0.18, volume: 0.15 }, // A4
    ])
  },

  // Signup — bright success
  signup() {
    playSequence([
      { frequency: 523, duration: 0.1, volume: 0.2 },   // C5
      { frequency: 659, duration: 0.1, volume: 0.2 },   // E5
      { frequency: 784, duration: 0.1, volume: 0.2 },   // G5
      { frequency: 1047, duration: 0.2, volume: 0.25 }, // C6
    ])
  },

  // Error / warning — short buzz
  error() {
    playTone({ frequency: 200, duration: 0.15, type: 'sawtooth', volume: 0.15 })
    setTimeout(() => playTone({ frequency: 180, duration: 0.2, type: 'sawtooth', volume: 0.1 }), 100)
  },

  // Notification — gentle ping
  notification() {
    playTone({ frequency: 1000, duration: 0.1, volume: 0.15 })
    setTimeout(() => playTone({ frequency: 1200, duration: 0.08, volume: 0.1 }), 100)
  },

  // Button click — subtle tap
  click() {
    playTone({ frequency: 700, duration: 0.03, type: 'sine', volume: 0.08 })
  },

  // Wishlist — soft heart-beat like
  wishlist() {
    playTone({ frequency: 500, duration: 0.08, volume: 0.15 })
    setTimeout(() => playTone({ frequency: 600, duration: 0.1, volume: 0.12 }), 100)
  },

  // Search — quick sweep
  search() {
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } catch (e) { /* silent */ }
  },

  // Payment processing — thinking tone
  processing() {
    playSequence([
      { frequency: 600, duration: 0.08, volume: 0.1 },
      { frequency: 800, duration: 0.08, volume: 0.1 },
      { frequency: 600, duration: 0.08, volume: 0.1 },
    ])
  },

  // Order status update
  orderUpdate() {
    playSequence([
      { frequency: 800, duration: 0.1, volume: 0.15 },
      { frequency: 1000, duration: 0.15, volume: 0.15 },
      { frequency: 1200, duration: 0.1, volume: 0.12 },
    ])
  },
}
