// Keyboard + touch input aggregator. Produces a per-frame snapshot object.

const KEYMAP = {
  a: "left", d: "right", w: "up", s: "down",
  j: "LP", k: "HP", l: "LK", i: "HK", " ": "SP",
  shift: "block",
};

export function createInputController() {
  const held = new Set();
  const touch = new Set();

  const onDown = (e) => {
    const k = (e.key || "").toLowerCase();
    if (KEYMAP[k]) { held.add(KEYMAP[k]); e.preventDefault(); }
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
                  LP: false, HP: false, LK: false, HK: false, SP: false };
      for (const k of held) s[k] = true;
      for (const k of touch) s[k] = true;
      return s;
    },
    touchDown(name) { touch.add(name); },
    touchUp(name) { touch.delete(name); },
    dispose() {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    },
  };
}
