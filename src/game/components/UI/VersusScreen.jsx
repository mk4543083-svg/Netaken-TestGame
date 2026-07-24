// VersusScreen.jsx — high-energy transition between select and combat.
import { useEffect } from "react";

export default function VersusScreen({ p1, p2, stage, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-black">
      <img src={stage.bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#7ac0ff]/20 via-transparent to-[#ff8060]/20" />

      {/* Diagonal split */}
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="relative flex items-center justify-end pr-6 animate-slide-in-right" style={{ transform: "translateX(-2%)" }}>
          <FighterCard f={p1} accent="#7ac0ff" side="left" />
        </div>
        <div className="relative flex items-center justify-start pl-6 animate-slide-in-right">
          <FighterCard f={p2} accent="#ff8060" side="right" />
        </div>
      </div>

      {/* VS glyph */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-[24vw] md:text-[16vw] font-black leading-none animate-scale-in"
             style={{
               background: "linear-gradient(180deg,#ffe27a,#ff2050 60%,#a1105a)",
               WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
               textShadow: "0 0 40px rgba(255,60,120,0.6)",
             }}>
          VS
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-6 text-center text-white/70 text-xs tracking-[0.4em] animate-fade-in">
        {stage.name.toUpperCase()}
      </div>
    </div>
  );
}

function FighterCard({ f, accent, side }) {
  return (
    <div className="text-center">
      <div className="inline-block rounded-lg p-1" style={{ background: `linear-gradient(135deg, ${accent}, transparent)` }}>
        <div className="w-40 h-52 md:w-56 md:h-72 rounded-md bg-black/60 border-2 flex items-end justify-center overflow-hidden"
             style={{ borderColor: accent, boxShadow: `0 0 40px ${accent}88` }}>
          <div className="text-6xl font-black" style={{ color: accent }}>{f.name.split(" ").map(w => w[0]).join("").slice(0,2)}</div>
        </div>
      </div>
      <div className="mt-3 text-xl md:text-3xl font-black tracking-wider" style={{ color: accent, textShadow: "2px 2px 0 #000" }}>
        {f.name}
      </div>
      <div className="text-[10px] md:text-xs tracking-[0.3em] text-white/60">{f.tag}</div>
    </div>
  );
}
