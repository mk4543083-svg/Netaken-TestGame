// ArcadeHUD.jsx — dual health bars, rage gauges, timer, round pips, combo counter.
export default function ArcadeHUD({ p1, p2, timer, round, wins, combo, infiniteTime, winsNeeded }) {
  return (
    <div className="absolute inset-x-0 top-0 p-2 md:p-4 pointer-events-none z-10">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 md:gap-4 items-center">
        <FighterBar side="left"  f={p1} wins={wins.p1} />
        <div className="flex flex-col items-center">
          <div className="text-3xl md:text-5xl font-black text-[#ffe27a] tabular-nums leading-none"
               style={{ textShadow: "2px 2px 0 #000" }}>
            {infiniteTime ? "\u221E" : Math.max(0, Math.ceil(timer))}
          </div>
          <div className="text-[10px] text-white/70 tracking-widest">ROUND {round}</div>
        </div>
        <FighterBar side="right" f={p2} wins={wins.p2} />
      </div>
      {combo.side && combo.count > 1 && (
        <div className={`absolute top-24 ${combo.side === "p1" ? "left-4" : "right-4"} text-4xl md:text-6xl font-black`}
             style={{ color: "#ffe27a", textShadow: "3px 3px 0 #a1105a" }}>
          {combo.count} HIT!
        </div>
      )}
    </div>
  );
}

function FighterBar({ side, f, wins }) {
  const flip = side === "right";
  const hpPct = (f.hp / f.maxHp) * 100;
  const ragePct = (f.rage / f.maxRage) * 100;
  return (
    <div className={`flex ${flip ? "flex-row-reverse" : ""} items-center gap-2 md:gap-3`}>
      <div className={`text-xs md:text-sm font-bold ${flip ? "text-right" : ""} truncate max-w-[40vw]`}>
        {f.meta.name}
      </div>
      <div className="flex-1 min-w-0">
        {/* HP */}
        <div className="h-3 md:h-4 bg-black/70 border-2 border-white/40 rounded-sm overflow-hidden">
          <div className={`h-full transition-all ${flip ? "ml-auto" : ""}`}
               style={{ width: `${hpPct}%`,
                        background: hpPct > 40 ? "linear-gradient(90deg,#ffe066,#ff4a2a)"
                                               : "linear-gradient(90deg,#ff4a2a,#8a0000)" }} />
        </div>
        {/* Rage */}
        <div className="mt-1 h-1.5 md:h-2 bg-black/70 border border-white/30 rounded-sm overflow-hidden">
          <div className={`h-full ${flip ? "ml-auto" : ""}`}
               style={{ width: `${ragePct}%`,
                        background: ragePct >= 100 ? "linear-gradient(90deg,#c04aff,#ff4aff)"
                                                   : "linear-gradient(90deg,#4080ff,#40c0ff)" }} />
        </div>
        {/* Round pips */}
        <div className={`flex gap-1 mt-1 ${flip ? "justify-end" : ""}`}>
          {[0, 1].map((i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full border border-white/60 ${i < wins ? "bg-[#ffe27a]" : "bg-transparent"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
