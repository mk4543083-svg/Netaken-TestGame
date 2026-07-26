// settings.js — global game settings store (volumes, rounds, timer, difficulty).
// Plain observable object so both React UI and the non-React audio/game loop can read it.

const DEFAULTS = {
  masterVol: 0.8,
  sfxVol: 0.9,
  bgmVol: 0.5,
  muted: false,
  rounds: 3,        // best of 1 | 3 | 5
  roundTime: 60,    // 30 | 60 | 90 | 0 (infinite)
  difficulty: "medium",
};

const KEY = "netaken.settings.v1";

function load() {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

let state = load();
const listeners = new Set();

export const Settings = {
  get() { return state; },
  set(patch) {
    state = { ...state, ...patch };
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
    listeners.forEach((l) => l(state));
  },
  reset() { Settings.set({ ...DEFAULTS }); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  // Rounds needed to win a match (best-of N).
  winsNeeded() { return Math.ceil(state.rounds / 2); },
};

export const ROUND_OPTIONS = [1, 3, 5];
export const TIME_OPTIONS = [30, 60, 90, 0];
