// Audio engine: WebAudio synthesized SFX + SpeechSynthesis announcer.
// Real Howler tracks can be swapped in later by replacing `play*` methods.

let ctx = null;
function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function beep({ freq = 220, dur = 0.08, type = "square", gain = 0.15 }) {
  const a = ac(); if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g); g.connect(a.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.stop(a.currentTime + dur + 0.02);
}

export const Audio = {
  hitLight() { beep({ freq: 320, dur: 0.06, type: "square" }); },
  hitHeavy() { beep({ freq: 140, dur: 0.14, type: "sawtooth", gain: 0.22 }); },
  block()    { beep({ freq: 900, dur: 0.05, type: "triangle", gain: 0.1 }); },
  jump()     { beep({ freq: 520, dur: 0.08, type: "sine" }); },
  special()  { beep({ freq: 80,  dur: 0.4, type: "sawtooth", gain: 0.25 });
               setTimeout(() => beep({ freq: 640, dur: 0.25, type: "square" }), 120); },
  ko()       { beep({ freq: 60,  dur: 0.6, type: "sawtooth", gain: 0.3 }); },
  say(text) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 0.6; u.volume = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  },
};
