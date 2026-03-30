let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3, rampDown = true) {
  const ctx = getAudioContext();
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
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// Success: pleasant ascending two-tone droplet
function playSuccess() {
  playTone(600, 0.12, 'sine', 0.25);
  setTimeout(() => playTone(900, 0.15, 'sine', 0.2), 100);
}

// Error: short low descending buzz
function playError() {
  playTone(300, 0.12, 'triangle', 0.3);
  setTimeout(() => playTone(200, 0.18, 'triangle', 0.25), 100);
}

// Warning: two-note alert
function playWarning() {
  playTone(500, 0.1, 'sine', 0.25);
  setTimeout(() => playTone(500, 0.1, 'sine', 0.25), 150);
}

// Info: single soft ping
function playInfo() {
  playTone(700, 0.2, 'sine', 0.2);
}

export function playNotificationSound(type) {
  try {
    switch (type) {
      case 'success': playSuccess(); break;
      case 'error': playError(); break;
      case 'warning': playWarning(); break;
      case 'info': playInfo(); break;
      default: playSuccess();
    }
  } catch (e) {
    // Audio not available — silently ignore
  }
}

export function vibrateDevice(type) {
  if (!navigator.vibrate) return;
  try {
    switch (type) {
      case 'success': navigator.vibrate(80); break;
      case 'error': navigator.vibrate([60, 40, 60]); break;
      case 'warning': navigator.vibrate([50, 30, 50]); break;
      case 'info': navigator.vibrate(50); break;
      default: navigator.vibrate(80);
    }
  } catch (e) {
    // Vibration not supported — silently ignore
  }
}
