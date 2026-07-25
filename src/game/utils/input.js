// Keyboard + touch input aggregator with combo/gesture buffer.
// Produces per-frame snapshot: movement, block, and 5 action buttons (LP/HP/LK/HK/SP).
// Detects on-screen combos and translates them into a virtual SP press:
//   - LP -> HP -> HK within 500ms (rapid touch sequence)
//   - Double-tap HP  (Special1 style)
//   - Swipe forward + HP (via stick vector)
//   - Down-held + HK (Special2 sweep)

const KEYMAP = {
  a: "left", d: "right", w: "up", s: "down",
  j: "LP", k: "HP", l: "LK", i: "HK", " ": "SP",
  shift: "block",
};

const COMBO_WINDOW = 500;

export function createInputController() {
  const held = new Set();
  const touch = new Set();
  const buffer = []; // { name, t }
  let stickX = 0, stickY = 0;
  let lastHPTap = 0;
  let virtualSP = 0;
  // Double-tap detection for dash / backdash (200ms window)
  let lastLeftTap = 0, lastRightTap = 0;
  let dashF = 0, dashB = 0; // frames to emit dash token

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
    // dir: "left" | "right" — used for f,f / b,b detection.
    const now = performance.now();
    if (dir === "right") {
      if (now - lastRightTap < 200) { dashF = 1; lastRightTap = 0; return; }
      lastRightTap = now;
    } else if (dir === "left") {
      if (now - lastLeftTap < 200) { dashB = 1; lastLeftTap = 0; return; }
      lastLeftTap = now;
    }
  };

  const onDown = (e) => {
    const k = (e.key || "").toLowerCase();
    if (KEYMAP[k]) {
      const name = KEYMAP[k];
      if (!held.has(name)) {
        held.add(name); e.preventDefault();
        if (["LP", "HP", "LK", "HK"].includes(name)) pushEvent(name);
        if (name === "left" || name === "right") tapDirection(name);
      }
    }
  };
  const onUp = (e) => {
    const k = (e.key || "").toLowerCase();
    if (KEYMAP[k]) held.delete(KEYMAP[k]);
  };
  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);

  return {
    snapshot() {
      const s = { left: false, right: false, up: false, down: false, block: false,
                  LP: false, HP: false, LK: false, HK: false, SP: false,
                  dashF: false, dashB: false };
      for (const k of held) s[k] = true;
      for (const k of touch) s[k] = true;
      if (virtualSP > 0) { s.SP = true; virtualSP -= 1; }
      if (dashF > 0) { s.dashF = true; dashF -= 1; }
      if (dashB > 0) { s.dashB = true; dashB -= 1; }
      return s;
    },
    setStickVector(nx, ny) {
      // 20% deadzone
      const dead = 0.2;
      const clamp = (v) => Math.abs(v) < dead ? 0 : v;
      stickX = clamp(nx); stickY = clamp(ny);
    },
    tapDirection,
    touchDown(name) {
      if (!touch.has(name)) {
        touch.add(name);
        if (["LP", "HP", "LK", "HK"].includes(name)) pushEvent(name);
        if (name === "left" || name === "right") tapDirection(name);
      }
    },
    touchUp(name) { touch.delete(name); },
    dispose() {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    },
  };
}
