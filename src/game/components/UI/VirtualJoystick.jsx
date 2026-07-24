// VirtualJoystick.jsx — analog joystick (bottom-left) + 4 action buttons (bottom-right).
// Emits direction hints (left/right/up/down/block) via input.touchDown/touchUp,
// and reports raw vector to gesture buffer for swipe combos.
import { useEffect, useRef } from "react";

export default function VirtualJoystick({ input }) {
  const stickRef = useRef(null);
  const knobRef = useRef(null);
  const activeRef = useRef({ id: -1, cx: 0, cy: 0, held: new Set() });

  useEffect(() => {
    const stick = stickRef.current;
    if (!stick) return;
    const set = (name, on) => {
      const held = activeRef.current.held;
      if (on && !held.has(name)) { held.add(name); input.touchDown(name); }
      if (!on && held.has(name)) { held.delete(name); input.touchUp(name); }
    };
    const clearAll = () => {
      for (const n of Array.from(activeRef.current.held)) { activeRef.current.held.delete(n); input.touchUp(n); }
      if (knobRef.current) knobRef.current.style.transform = "translate(0,0)";
    };
    const onDown = (e) => {
      e.preventDefault();
      const rect = stick.getBoundingClientRect();
      activeRef.current.id = e.pointerId;
      activeRef.current.cx = rect.left + rect.width / 2;
      activeRef.current.cy = rect.top + rect.height / 2;
      stick.setPointerCapture(e.pointerId);
      handle(e);
    };
    const handle = (e) => {
      if (e.pointerId !== activeRef.current.id) return;
      const dx = e.clientX - activeRef.current.cx;
      const dy = e.clientY - activeRef.current.cy;
      const max = 46;
      const len = Math.hypot(dx, dy);
      const clamp = len > max ? max / len : 1;
      const kx = dx * clamp; const ky = dy * clamp;
      if (knobRef.current) knobRef.current.style.transform = `translate(${kx}px, ${ky}px)`;
      const nx = kx / max, ny = ky / max;
      // Directional thresholds; back-hold => block
      set("right", nx > 0.35);
      set("left",  nx < -0.35);
      set("up",    ny < -0.55);
      set("down",  ny > 0.55);
      set("block", nx < -0.6 && Math.abs(ny) < 0.5);
      input.setStickVector?.(nx, ny);
    };
    const onUp = (e) => {
      if (e.pointerId !== activeRef.current.id) return;
      activeRef.current.id = -1;
      clearAll();
      input.setStickVector?.(0, 0);
    };
    stick.addEventListener("pointerdown", onDown);
    stick.addEventListener("pointermove", handle);
    stick.addEventListener("pointerup", onUp);
    stick.addEventListener("pointercancel", onUp);
    stick.addEventListener("pointerleave", onUp);
    return () => {
      stick.removeEventListener("pointerdown", onDown);
      stick.removeEventListener("pointermove", handle);
      stick.removeEventListener("pointerup", onUp);
      stick.removeEventListener("pointercancel", onUp);
      stick.removeEventListener("pointerleave", onUp);
    };
  }, [input]);

  const btn = (name) => ({
    onPointerDown: (e) => { e.preventDefault(); input.touchDown(name); },
    onPointerUp:   (e) => { e.preventDefault(); input.touchUp(name); },
    onPointerCancel:(e)=> { input.touchUp(name); },
    onPointerLeave:(e) => { input.touchUp(name); },
  });

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex justify-between items-end p-3 pointer-events-none md:hidden">
      {/* Joystick */}
      <div ref={stickRef}
           className="relative w-32 h-32 rounded-full bg-white/10 border-2 border-[#7ac0ff]/60 backdrop-blur pointer-events-auto touch-none select-none"
           style={{ boxShadow: "0 0 24px #7ac0ff44 inset" }}>
        <div ref={knobRef}
             className="absolute left-1/2 top-1/2 w-14 h-14 -ml-7 -mt-7 rounded-full bg-[#7ac0ff]/50 border-2 border-white/70"
             style={{ transform: "translate(0,0)", boxShadow: "0 0 20px #7ac0ff" }} />
      </div>

      {/* 4 Action buttons in diamond layout */}
      <div className="relative w-40 h-40 pointer-events-auto">
        <ActionBtn label="HP" style={{ top: 0, left: "50%", marginLeft: "-1.75rem" }} color="#ff8060" {...btn("HP")} />
        <ActionBtn label="LP" style={{ left: 0, top: "50%", marginTop: "-1.75rem" }} color="#ffcc60" {...btn("LP")} />
        <ActionBtn label="HK" style={{ right: 0, top: "50%", marginTop: "-1.75rem" }} color="#c060ff" {...btn("HK")} />
        <ActionBtn label="LK" style={{ bottom: 0, left: "50%", marginLeft: "-1.75rem" }} color="#60ffcc" {...btn("LK")} />
      </div>
    </div>
  );
}

function ActionBtn({ label, style, color, ...rest }) {
  return (
    <button {...rest}
      style={{ ...style, borderColor: color, boxShadow: `0 0 16px ${color}88` }}
      className="absolute w-14 h-14 rounded-full border-2 bg-black/60 backdrop-blur font-black text-white text-sm active:scale-95 transition-transform touch-none select-none">
      {label}
    </button>
  );
}
