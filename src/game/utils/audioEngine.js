// audioEngine.js — WebAudio engine: buses (master/sfx/bgm), synthesized arcade SFX,
// a distorted-guitar rock step-sequencer BGM (Tekken-3 flavoured) and an announcer.
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

// ------------------------------------------------- distorted guitar bus
let guitarGain = null;
let distortion = null;

function makeDistortionCurve(amount = 50) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function ensureGuitarBus() {
  const a = ac(); if (!a) return;
  if (guitarGain) return;
  distortion = a.createWaveShaper();
  distortion.curve = makeDistortionCurve(60);
  distortion.oversample = "4x";

  const toneFilter = a.createBiquadFilter();
  toneFilter.type = "lowpass";
  toneFilter.frequency.value = 3200;
  toneFilter.Q.value = 0.7;

  guitarGain = a.createGain();
  guitarGain.gain.value = 1;

  distortion.connect(toneFilter);
  toneFilter.connect(guitarGain);
  guitarGain.connect(bgmGain);
}

function guitarNote({ freq, dur, gain = 0.22, delay = 0, palmMute = false }) {
  const a = ac(); if (!a) return;
  ensureGuitarBus();
  const t0 = a.currentTime + delay;
  const intervals = [1, 1.5, 2]; // root + fifth + octave = power chord
  intervals.forEach((mult, i) => {
    const o = a.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(freq * mult, t0);
    const g = a.createGain();
    const peak = gain * (i === 0 ? 1 : 0.5);
    const sustain = palmMute ? dur * 0.35 : dur;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + sustain);
    o.connect(g);
    g.connect(distortion);
    o.start(t0);
    o.stop(t0 + sustain + 0.03);
  });
}

// ---------------------------------------------------- crowd ambience loop
let crowdSrc = null;
function makeCrowdLoop() {
  const a = ac(); if (!a) return null;
  const len = a.sampleRate * 2;
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
  const src = a.createBufferSource();
  src.buffer = buf; src.loop = true;
  const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900; f.Q.value = 0.6;
  const g = a.createGain(); g.gain.value = 0.05;
  src.connect(f); f.connect(g); g.connect(bgmGain);
  src.start();
  return src;
}

// ------------------------------------------------------------------ BGM loops
const TRACKS = {
  menu: {
    bpm: 128,
    bass: [33, 33, 0, 33, 36, 36, 0, 36, 31, 31, 0, 31, 38, 38, 0, 0],
    lead: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    guitar: [33, 0, 33, 0, 36, 0, 36, 0, 31, 0, 31, 0, 38, 0, 38, 0],
    drums: "K.s.K.s.K.s.K.sS",
  },
  fight: {
    bpm: 156,
    bass: [33, 33, 33, 33, 36, 36, 36, 36, 31, 31, 31, 31, 34, 34, 38, 38],
    lead: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    guitar: [33, 33, 45, 33, 36, 36, 48, 36, 31, 31, 43, 31, 34, 34, 46, 38],
    drums: "KSsSKSsSKSsSKSsS",
  },
  fight2: {
    bpm: 168,
    bass: [28, 28, 28, 28, 33, 33, 33, 33, 30, 30, 30, 30, 35, 35, 40, 40],
    lead: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    guitar: [28, 40, 28, 40, 33, 45, 33, 45, 30, 42, 30, 42, 35, 47, 35, 47],
    drums: "KSsSKKsSKSsSKKsS",
  },
  victory: {
    bpm: 120,
    bass: [45, 0, 0, 0, 50, 0, 0, 0, 52, 0, 0, 0, 57, 0, 0, 0],
    lead: [81, 0, 84, 0, 88, 0, 0, 0, 86, 0, 84, 0, 81, 0, 0, 0],
    guitar: [45, 0, 45, 0, 50, 0, 50, 0, 52, 0, 52, 0, 57, 0, 57, 0],
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
    if (b) tone({ freq: midi(b), dur: stepDur * 1.7, type: "sawtooth", gain: 0.22, bus: bgmGain, delay: when });

    const gt = t.guitar && t.guitar[i];
    if (gt) {
      const palmMute = bgmState.name !== "victory";
      guitarNote({ freq: midi(gt), dur: stepDur * (palmMute ? 1.1 : 1.6), gain: 0.2, delay: when, palmMute });
    }

    const l = t.lead[i];
    if (l) {
      tone({ freq: midi(l), dur: stepDur * 1.4, type: "square", gain: 0.10, bus: bgmGain, delay: when });
      tone({ freq: midi(l - 12), dur: stepDur * 1.2, type: "triangle", gain: 0.06, bus: bgmGain, delay: when });
    }

    const d = t.drums[i];
    if (d === "K") tone({ freq: 130, slideTo: 42, dur: 0.14, type: "sine", gain: 0.55, bus: bgmGain, delay: when });
    if (d === "s") noise({ dur: 0.05, gain: 0.12, freq: 4500, delay: when });
    if (d === "S") noise({ dur: 0.1, gain: 0.22, freq: 2400, delay: when });

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
  bgmSelect() { startBgm("menu"); },
  bgmFight(round = 1) { startBgm(round % 2 === 0 ? "fight2" : "fight"); },
  bgmVictory() { startBgm("victory"); },
  bgmStop() { stopBgm(); },

  // ---- ambience
  crowdStart() { if (!crowdSrc) crowdSrc = makeCrowdLoop(); },
  crowdStop() { if (crowdSrc) { try { crowdSrc.stop(); } catch {} crowdSrc = null; } },

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

  roundBell() {
    tone({ freq: 660, dur: 0.5, type: "sine", gain: 0.3 });
    tone({ freq: 990, dur: 0.6, type: "sine", gain: 0.18, delay: 0.05 });
  },
  comboMilestone(count) {
    const base = 500 + Math.min(count, 10) * 60;
    tone({ freq: base, slideTo: base * 1.6, dur: 0.14, type: "square", gain: 0.2 });
  },
  winFanfare() {
    [130.8, 164.8, 196.0].forEach((f, i) => {
      tone({ freq: f, dur: 0.5, type: "sawtooth", gain: 0.22, delay: i * 0.02 });
    });
    [523, 659, 784, 1047].forEach((f, i) => {
      tone({ freq: f, dur: 0.3, type: "square", gain: 0.16, delay: 0.15 + i * 0.09 });
    });
    noise({ dur: 0.3, gain: 0.25, type: "lowpass", freq: 1200 });
  },

  // ---- combat
  whiff(heavy = false) {
    noise({ dur: heavy ? 0.16 : 0.1, gain: heavy ? 0.2 : 0.13, type: "bandpass", freq: heavy ? 900 : 1500, q: 1.2 });
  },
  hitLight() {
    noise({ dur: 0.05, gain: 0.3, type: "bandpass", freq: 2600, q: 1.4 });
    noise({ dur: 0.07, gain: 0.24, type: "bandpass", freq: 1200, q: 0.8 });
    tone({ freq: 260, slideTo: 110, dur: 0.09, type: "square", gain: 0.2 });
  },
  hitHeavy() {
    noise({ dur: 0.04, gain: 0.35, type: "bandpass", freq: 3200, q: 1.6 });
    noise({ dur: 0.18, gain: 0.4, type: "lowpass", freq: 800 });
    tone({ freq: 150, slideTo: 50, dur: 0.24, type: "sawtooth", gain: 0.32 });
    tone({ freq: 85, dur: 0.3, type: "sine", gain: 0.32, delay: 0.02 });
  },
  hitSpecial() {
    tone({ freq: 70, slideTo: 40, dur: 0.5, type: "sawtooth", gain: 0.35 });
    noise({ dur: 0.4, gain: 0.3, type: "lowpass", freq: 1200 });
    tone({ freq: 900, slideTo: 220, dur: 0.35, type: "square", gain: 0.2, delay: 0.05 });
  },
  bloodSplat(heavy = false) {
    noise({ dur: heavy ? 0.12 : 0.07, gain: heavy ? 0.22 : 0.14, type: "lowpass", freq: heavy ? 500 : 800 });
    tone({ freq: heavy ? 180 : 260, slideTo: 60, dur: heavy ? 0.15 : 0.09, type: "sine", gain: 0.1 });
  },
  block() {
    noise({ dur: 0.06, gain: 0.22, type: "bandpass", freq: 2600, q: 2 });
    tone({ freq: 420, dur: 0.07, type: "triangle", gain: 0.16 });
  },
  jump() { tone({ freq: 300, slideTo: 620, dur: 0.12, type: "sine", gain: 0.16 }); },
  step() { noise({ dur: 0.05, gain: 0.06, type: "lowpass", freq: 500 }); },
  footstep(heavy = false) {
    noise({ dur: heavy ? 0.09 : 0.05, gain: heavy ? 0.14 : 0.08, type: "lowpass", freq: heavy ? 300 : 450 });
  },
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
      u.rate = 0.85; u.pitch = 0.4; u.volume = Math.min(1, s.masterVol * s.sfxVol);
      const voices = window.speechSynthesis.getVoices();
      const deep = voices.find((v) => /male|david|daniel|george/i.test(v.name));
      if (deep) u.voice = deep;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  },
};
