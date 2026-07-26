// MoveList.jsx — collapsible practice-mode command list with live input highlighting.
import { useState } from "react";
import { Audio } from "../../utils/audioEngine";

const SECTIONS = [
  {
    title: "MOVEMENT",
    rows: [
      { keys: ["right"], input: "→ / Stick Fwd", name: "Walk Forward" },
      { keys: ["left"], input: "← / Stick Back", name: "Walk Back + Stand Block" },
      { keys: ["right"], input: "→ , →", name: "Dash Forward" },
      { keys: ["left"], input: "← , ←", name: "Backdash (evade)" },
      { keys: ["up"], input: "Tap ↑", name: "Sidestep Back (3D)" },
      { keys: ["down"], input: "Tap ↓", name: "Sidestep Front (3D)" },
      { keys: ["jump"], input: "JMP", name: "Short Heavy Jump" },
      { keys: ["block"], input: "BLK", name: "Stand Guard" },
      { keys: ["block", "down"], input: "BLK + ↓", name: "Crouch Guard" },
    ],
  },
  {
    title: "BASIC ATTACKS",
    rows: [
      { keys: ["LP"], input: "LP", name: "Left Jab · 5 dmg" },
      { keys: ["HP"], input: "HP", name: "Power Cross · 10 dmg" },
      { keys: ["LK"], input: "LK", name: "Low Kick · 6 dmg" },
      { keys: ["HK"], input: "HK", name: "High Kick · 12 dmg" },
    ],
  },
  {
    title: "COMBOS & SPECIALS",
    rows: [
      { keys: ["LP", "HP", "HK"], input: "LP → HP → HK", name: "3-Hit String → auto Special" },
      { keys: ["HP"], input: "HP , HP", name: "Double-tap Special trigger" },
      { keys: ["HP"], input: "→ + HP", name: "Quarter-circle Special" },
      { keys: ["HK"], input: "↓ + HK", name: "Low Sweep Special" },
      { keys: ["SP"], input: "SP (full Rage)", name: "Signature Super Move" },
    ],
  },
];

export default function MoveList({ activeInputs = [], open, onToggle }) {
  const [tab, setTab] = useState(0);
  const isActive = (keys) => keys.some((k) => activeInputs.includes(k));

  if (!open) {
    return (
      <button onClick={() => { Audio.uiClick(); onToggle(true); }}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 px-2 py-3 rounded-r-md bg-black/70 border-2 border-l-0 border-[#7ac0ff]/60 text-[10px] font-black tracking-widest text-[#7ac0ff]"
        style={{ writingMode: "vertical-rl" }}>
        MOVE LIST
      </button>
    );
  }

  return (
    <div className="absolute left-2 top-12 bottom-2 z-30 w-[min(70vw,300px)] rounded-md border-2 border-[#7ac0ff]/60 bg-black/80 backdrop-blur text-white flex flex-col">
      <div className="flex items-center justify-between px-2 py-1 border-b border-white/15">
        <div className="text-[11px] font-black tracking-widest text-[#7ac0ff]">MOVE LIST</div>
        <button onClick={() => { Audio.uiBack(); onToggle(false); }} className="text-xs px-2 py-0.5 rounded border border-white/30">✕</button>
      </div>
      <div className="flex gap-1 p-1">
        {SECTIONS.map((s, i) => (
          <button key={s.title} onClick={() => { Audio.uiMove(); setTab(i); }}
            className={`flex-1 py-1 rounded text-[9px] font-black tracking-wider border ${
              tab === i ? "border-[#ffb060] bg-[#ff6a2a]/30 text-[#ffe27a]" : "border-white/15 text-white/60"}`}>
            {s.title.split(" ")[0]}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto px-2 pb-2 space-y-1">
        {SECTIONS[tab].rows.map((r) => {
          const on = isActive(r.keys);
          return (
            <div key={r.input}
              className="rounded px-2 py-1 border transition-all"
              style={{
                borderColor: on ? "#ffe27a" : "rgba(255,255,255,0.12)",
                background: on ? "rgba(255,226,122,0.18)" : "rgba(255,255,255,0.03)",
                boxShadow: on ? "0 0 14px #ffe27a88" : "none",
              }}>
              <div className="text-[11px] font-black" style={{ color: on ? "#ffe27a" : "#ffffffcc" }}>{r.input}</div>
              <div className="text-[9px] text-white/60 leading-tight">{r.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
