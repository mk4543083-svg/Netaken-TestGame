// GameModeSelect.jsx — arcade vs training, difficulty.
export default function GameModeSelect({ onStart }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0518] text-white p-6">
      <h1 className="font-black tracking-widest text-center leading-none"
          style={{ fontSize: "clamp(2.5rem,7vw,5rem)",
                   background: "linear-gradient(180deg,#ffe27a,#ff6a2a 55%,#a1105a)",
                   WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                   textShadow: "0 0 30px rgba(255,120,60,0.4)" }}>
        NETA-KEN
      </h1>
      <div className="text-[#ffa060] tracking-[0.6em] text-sm md:text-base mt-1">ABSOLUTE CINEMA</div>
      <div className="text-xs text-white/50 mt-1 mb-8">Retro 3D Political Parody Fighter</div>

      <div className="grid gap-3 w-full max-w-sm">
        <ModeBtn label="ARCADE — Easy"    onClick={() => onStart({ mode: "arcade", difficulty: "easy" })}   />
        <ModeBtn label="ARCADE — Medium"  onClick={() => onStart({ mode: "arcade", difficulty: "medium" })} accent />
        <ModeBtn label="ARCADE — Hard"    onClick={() => onStart({ mode: "arcade", difficulty: "hard" })}   />
        <ModeBtn label="TRAINING / PRACTICE" onClick={() => onStart({ mode: "training", difficulty: "easy" })} />
      </div>

      <div className="mt-10 text-[10px] text-white/40 max-w-md text-center leading-relaxed">
        Parody / satire only. All character depictions are stylized, non-photographic caricatures.
        Desktop: WASD move · J/K punches · L/I kicks · Space SP · Shift block · Mobile: on-screen pad.
      </div>
    </div>
  );
}
function ModeBtn({ label, onClick, accent }) {
  return (
    <button onClick={onClick}
      className={`w-full py-3 rounded-md border-2 font-bold tracking-wider transition-all
        ${accent ? "border-[#ffb060] bg-[#ff6a2a]/20 hover:bg-[#ff6a2a]/40"
                 : "border-white/30 hover:border-white/70 bg-white/5 hover:bg-white/10"}`}>
      {label}
    </button>
  );
}
