// Keyboard + touch input aggregator with 200ms combo buffer.
// Emits: left/right/up/down/block, LP/HP/LK/HK/SP, jump, dashF/dashB, sideU/sideD.
// Double-tap forward/back -> dash tokens. Tap up/down -> sidestep tokens.

const KEYMAP = {
  a: "left", d: "right", w: "up", s: "down",
  j: "LP", k: "HP", l: "LK", i: "HK", " ": "SP",
  shift: "block", e: "jump", u: "jump",
};

const COMBO_WINDOW = 500;

export function createInputController() {
  const held = new Set();
  const touch = new Set();
  const buffer = []; // { name, t }
  let stickX = 0, stickY = 0;
  let lastHPTap = 0;
  let virtualSP = 0;
  let lastLeftTap = 0, lastRightTap = 0;
  let dashF = 0, dashB = 0;
  let sideU = 0, sideD = 0;
  let enabled = true;

  const pushEvent = (name) => {
    const now = performance.now();
    buffer.push({ name, t: now });
    while (buffer.length && now - buffer[0].t > COMBO_WINDOW) buffer.shift();
    detectCombos(name, now);
  };

  const detectCombos = (name, now) => {
    const seq = buffer.map((e) => e.name).slice(-6).join(",");
    if (seq.endsWith("LP,HP,HK")) { virtualSP = 3; buffer.length = 0; return; }
    if (name === "HP") {
      if (now - lastHPTap < 260) { virtualSP = 3; lastHPTap = 0; return; }
      lastHPTap = now;
    }
    if (name === "HP" && Math.abs(stickX) > 0.6) { virtualSP = 3; return; }
    if (name === "HK" && stickY > 0.55) { virtualSP = 3; return; }
  };

  const tapDirection = (dir) => {
    const now = performance.now();
    if (dir === "right") {
      if (now - lastRightTap < 220) { dashF = 1; lastRightTap = 0; return; }
      lastRightTap = now;
    } else if (dir === "left") {
      if (now - lastLeftTap < 220) { dashB = 1; lastLeftTap = 0; return; }
      lastLeftTap = now;
    } else if (dir === "up") { sideU = 1; }
    else if (dir === "down") { sideD = 1; }
  };

  const press = (name) => {
    if (["LP", "HP", "LK", "HK"].includes(name)) pushEvent(name);
    if (["left", "right", "up", "down"].includes(name)) tapDirection(name);
  };

  const onDown = (e) => {
    const k = (e.key || "").toLowerCase();
    if (!KEYMAP[k]) return;
    const name = KEYMAP[k];
    e.preventDefault();
    if (!held.has(name)) { held.add(name); press(name); }
  };
  const onUp = (e) => {
    const k = (e.key || "").toLowerCase();
    if (KEYMAP[k]) held.delete(KEYMAP[k]);
  };
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
  }

  const empty = () => ({
    left: false, right: false, up: false, down: false, block: false,
    LP: false, HP: false, LK: false, HK: false, SP: false,
    jump: false, dashF: false, dashB: false, sideU: false, sideD: false,
  });

  return {
    snapshot() {
      const s = empty();
      if (!enabled) return s;
      for (const k of held) s[k] = true;
      for (const k of touch) s[k] = true;
      if (virtualSP > 0) { s.SP = true; virtualSP -= 1; }
      if (dashF > 0) { s.dashF = true; dashF -= 1; }
      if (dashB > 0) { s.dashB = true; dashB -= 1; }
      if (sideU > 0) { s.sideU = true; sideU -= 1; }
      if (sideD > 0) { s.sideD = true; sideD -= 1; }
      return s;
    },
    // Freeze all inputs (pause / KO lock).
    setEnabled(v) {
      enabled = v;
      if (!v) { held.clear(); touch.clear(); dashF = dashB = sideU = sideD = virtualSP = 0; }
    },
    // Live pressed names, used by the practice-mode tutorial highlighter.
    active() {
      const out = [];
      for (const k of held) out.push(k);
      for (const k of touch) if (!out.includes(k)) out.push(k);
      return out;
    },
    setStickVector(nx, ny) {
      const dead = 0.2;
      const clamp = (v) => (Math.abs(v) < dead ? 0 : v);
      stickX = clamp(nx); stickY = clamp(ny);
    },
    tapDirection,
    touchDown(name) {
      if (!touch.has(name)) { touch.add(name); press(name); }
    },
    touchUp(name) { touch.delete(name); },
    dispose() {
      if (typeof window === "undefined") return;
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    },
  };
}
