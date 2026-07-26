// audioEngine.js — WebAudio engine: buses (master/sfx/bgm), synthesized arcade SFX,
// a step-sequencer BGM (Tekken-3 flavoured loops) and a SpeechSynthesis announcer.
import { Settings } from "./settings";

let ctx = null;
let masterGain = null;
let sfxGain = null;
let bgmGain = null;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    sfxGain = ctx.createGain();
    bgmGain = ctx.createGain();
    sfxGain.connect(masterGain);
    bgmGain.connect(masterGain);
    masterGain.connect(ctx.destination);
    applyVolumes();
  }
  return ctx;
}

function applyVolumes() {
  if (!masterGain) return;
  const s = Settings.get();
  const m = s.muted ? 0 : s.masterVol;
  masterGain.gain.value = m;
  sfxGain.gain.value = s.sfxVol;
  bgmGain.gain.value = s.bgmVol * 0.55;
}
Settings.subscribe(applyVolumes);

// ---------------------------------------------------------------- primitives

function tone({ freq = 220, dur = 0.08, type = "square", gain = 0.2, bus, slideTo = null, delay = 0 }) {
  const a = ac(); if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(bus || sfxGain);
  o.start(t0); o.stop(t0 + dur + 0.03);
}

function noise({ dur = 0.12, gain = 0.3, type = "highpass", freq = 800, q = 1, delay = 0 }) {
  const a = ac(); if (!a) return;
  const t0 = a.currentTime + delay;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain(); g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(sfxGain);
  src.start(t0); src.stop(t0 + dur + 0.02);
}

// ------------------------------------------------------------------ BGM loops
// Simple lookahead scheduler. Each track is a list of 16th-note steps.
const TRACKS = {
  select: {
    bpm: 132,
    bass: [40, 0, 40, 43, 0, 45, 40, 0, 38, 0, 38, 41, 0, 43, 38, 0],
    lead: [76, 0, 79, 0, 81, 0, 79, 76, 74, 0, 76, 0, 79, 0, 0, 0],
    drums: "K.s.K.s.K.s.KKs.",
  },
  fight: {
    bpm: 152,
    bass: [33, 33, 45, 33, 36, 36, 48, 36, 31, 31, 43, 31, 34, 34, 46, 34],
    lead: [69, 0, 72, 74, 0, 72, 69, 0, 67, 0, 69, 71, 0, 69, 67, 0],
    drums: "K.sSK.s.K.sSKs.s",
  },
  fight2: {
    bpm: 160,
    bass: [28, 28, 40, 28, 33, 33, 45, 33, 30, 30, 42, 30, 35, 35, 47, 35],
    lead: [64, 67, 71, 74, 71, 67, 64, 0, 62, 65, 69, 72, 69, 65, 62, 0],
    drums: "K.sSKKsSK.sSKKsS",
  },
  victory: {
    bpm: 120,
    bass: [45, 0, 0, 0, 50, 0, 0, 0, 52, 0, 0, 0, 57, 0, 0, 0],
    lead: [81, 0, 84, 0, 88, 0, 0, 0, 86, 0, 84, 0, 81, 0, 0, 0],
    drums: "K...K...K..KK...",
  },
};

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

let bgmTimer = null;
let bgmState = null; // { name, step, nextTime }

function scheduleBgm() {
  const a = ac(); if (!a || !bgmState) return;
  const t = TRACKS[bgmState.name];
  const stepDur = 60 / t.bpm / 4;
  while (bgmState.nextTime < a.currentTime + 0.25) {
    const i = bgmState.step % 16;
    const when = Math.max(bgmState.nextTime, a.currentTime + 0.02) - a.currentTime;

    const b = t.bass[i];
    if (b) tone({ freq: midi(b), dur: stepDur * 1.7, type: "sawtooth", gain: 0.28, bus: bgmGain, delay: when });

    const l = t.lead[i];
    if (l) {
      tone({ freq: midi(l), dur: stepDur * 1.4, type: "square", gain: 0.10, bus: bgmGain, delay: when });
      tone({ freq: midi(l - 12), dur: stepDur * 1.2, type: "triangle", gain: 0.06, bus: bgmGain, delay: when });
    }

    const d = t.drums[i];
    if (d === "K") tone({ freq: 120, slideTo: 45, dur: 0.16, type: "sine", gain: 0.5, bus: bgmGain, delay: when });
    if (d === "s") noise({ dur: 0.06, gain: 0.10, freq: 3200, delay: when });
    if (d === "S") noise({ dur: 0.11, gain: 0.18, freq: 2200, delay: when });

    bgmState.step += 1;
    bgmState.nextTime += stepDur;
  }
}

function startBgm(name) {
  const a = ac(); if (!a || !TRACKS[name]) return;
  if (bgmState && bgmState.name === name) return;
  stopBgm();
  bgmState = { name, step: 0, nextTime: a.currentTime + 0.08 };
  scheduleBgm();
  bgmTimer = window.setInterval(scheduleBgm, 80);
}

function stopBgm() {
  if (bgmTimer) { window.clearInterval(bgmTimer); bgmTimer = null; }
  bgmState = null;
}

// ------------------------------------------------------------------ public API
export const Audio = {
  unlock() {
    const a = ac();
    if (a && a.state === "suspended") a.resume().catch(() => {});
    applyVolumes();
  },
  refreshVolumes: applyVolumes,

  // ---- music
  bgmSelect() { startBgm("select"); },
  bgmFight(round = 1) { startBgm(round % 2 === 0 ? "fight2" : "fight"); },
  bgmVictory() { startBgm("victory"); },
  bgmStop() { stopBgm(); },

  // ---- ui
  uiMove() { tone({ freq: 660, dur: 0.04, type: "square", gain: 0.12 }); },
  uiClick() {
    tone({ freq: 880, dur: 0.05, type: "square", gain: 0.2 });
    tone({ freq: 1320, dur: 0.06, type: "square", gain: 0.12, delay: 0.03 });
  },
  uiSelect() { // character locked-in — punchy arcade confirm
    tone({ freq: 520, dur: 0.08, type: "square", gain: 0.25 });
    tone({ freq: 780, dur: 0.1, type: "square", gain: 0.22, delay: 0.06 });
    tone({ freq: 1040, dur: 0.16, type: "square", gain: 0.2, delay: 0.13 });
    noise({ dur: 0.18, gain: 0.14, freq: 2600, delay: 0.0 });
  },
  uiBack() { tone({ freq: 400, slideTo: 200, dur: 0.1, type: "square", gain: 0.16 }); },

  // ---- combat
  whiff(heavy = false) {
    noise({ dur: heavy ? 0.16 : 0.1, gain: heavy ? 0.2 : 0.13, type: "bandpass", freq: heavy ? 900 : 1500, q: 1.2 });
  },
  hitLight() {
    noise({ dur: 0.07, gain: 0.28, type: "bandpass", freq: 1400, q: 0.8 });
    tone({ freq: 260, slideTo: 120, dur: 0.09, type: "square", gain: 0.22 });
  },
  hitHeavy() {
    noise({ dur: 0.16, gain: 0.4, type: "lowpass", freq: 900 });
    tone({ freq: 150, slideTo: 55, dur: 0.22, type: "sawtooth", gain: 0.32 });
    tone({ freq: 90, dur: 0.28, type: "sine", gain: 0.3, delay: 0.02 });
  },
  hitSpecial() {
    tone({ freq: 70, slideTo: 40, dur: 0.5, type: "sawtooth", gain: 0.35 });
    noise({ dur: 0.4, gain: 0.3, type: "lowpass", freq: 1200 });
    tone({ freq: 900, slideTo: 220, dur: 0.35, type: "square", gain: 0.2, delay: 0.05 });
  },
  block() {
    noise({ dur: 0.06, gain: 0.22, type: "bandpass", freq: 2600, q: 2 });
    tone({ freq: 420, dur: 0.07, type: "triangle", gain: 0.16 });
  },
  jump() { tone({ freq: 300, slideTo: 620, dur: 0.12, type: "sine", gain: 0.16 }); },
  step() { noise({ dur: 0.05, gain: 0.06, type: "lowpass", freq: 500 }); },
  special() {
    tone({ freq: 80, dur: 0.45, type: "sawtooth", gain: 0.3 });
    tone({ freq: 640, slideTo: 1600, dur: 0.3, type: "square", gain: 0.2, delay: 0.12 });
  },
  ko() {
    tone({ freq: 70, slideTo: 35, dur: 0.9, type: "sawtooth", gain: 0.4 });
    noise({ dur: 0.6, gain: 0.3, type: "lowpass", freq: 700 });
  },
  // vocal grunt / kiai — formant-ish blip so attacks feel voiced
  kiai(heavy = false) {
    const base = heavy ? 130 : 190;
    tone({ freq: base, slideTo: base * 0.7, dur: heavy ? 0.22 : 0.14, type: "sawtooth", gain: 0.14 });
    tone({ freq: base * 3.2, slideTo: base * 2.2, dur: heavy ? 0.2 : 0.12, type: "triangle", gain: 0.07, delay: 0.01 });
  },
  hurt(heavy = false) {
    const base = heavy ? 170 : 240;
    tone({ freq: base, slideTo: base * 0.55, dur: heavy ? 0.3 : 0.18, type: "sawtooth", gain: 0.13 });
  },

  say(text) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const s = Settings.get();
    if (s.muted || s.masterVol <= 0) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 0.6; u.volume = Math.min(1, s.masterVol * s.sfxVol);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  },
};
