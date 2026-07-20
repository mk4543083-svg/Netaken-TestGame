// CharacterSelect.jsx — grid of parody fighters, dynamic preview card.
import { useState } from "react";
import { ROSTER } from "../../utils/roster";
import { getThumbDataURL, getPortraitDataURL } from "../../utils/textureManager";

export default function CharacterSelect({ label, onPick, onBack }) {
  const [hover, setHover] = useState(ROSTER[0]);
  return (
    <div className="min-h-screen w-full bg-[#0a0518] text-white p-3 md:p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={onBack} className="px-3 py-1 rounded border border-white/30 text-xs">◀ BACK</button>
        <div className="text-lg md:text-2xl font-black tracking-widest text-[#ffb060]">SELECT {label.toUpperCase()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 flex-1 min-h-0">
        {/* Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 content-start overflow-y-auto pr-1">
          {ROSTER.map((f) => (
            <button key={f.id}
              onMouseEnter={() => setHover(f)}
              onFocus={() => setHover(f)}
              onClick={() => onPick(f)}
              className="group relative aspect-[3/4] rounded overflow-hidden border-2 border-white/20 hover:border-[#ffb060] focus:border-[#ffb060] transition-all">
              <img src={getThumbDataURL(f)} alt={f.name} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[9px] md:text-[10px] px-1 py-0.5 truncate">
                {f.name}
              </div>
            </button>
          ))}
        </div>

        {/* Preview card */}
        <div className="rounded-lg border-2 border-[#ffb060]/50 bg-gradient-to-b from-[#1a0a2a] to-[#0a0518] p-3">
          <img src={getPortraitDataURL(hover)} alt={hover.name}
               className="w-full aspect-[3/4] object-cover rounded border-2 border-white/20 mb-2" />
          <div className="text-lg font-black">{hover.name}</div>
          <div className="text-xs text-[#ffb060] tracking-wider mb-1">{hover.tag} · {hover.origin}</div>
          <StatRow label="Power"   v={hover.stats.power}   />
          <StatRow label="Speed"   v={hover.stats.speed}   />
          <StatRow label="Defense" v={hover.stats.defense} />
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="text-[10px] text-white/60 uppercase tracking-widest">Special</div>
            <div className="text-sm font-bold text-[#ffe27a]">{hover.specialName}</div>
            <div className="text-[11px] text-white/70 leading-snug">{hover.specialDesc}</div>
          </div>
          <button onClick={() => onPick(hover)}
            className="mt-3 w-full py-2 rounded bg-[#ff6a2a] hover:bg-[#ff7a3a] font-black tracking-widest">
            CHOOSE
          </button>
        </div>
      </div>
    </div>
  );
}
function StatRow({ label, v }) {
  return (
    <div className="flex items-center gap-2 text-[11px] mb-0.5">
      <div className="w-14 text-white/60">{label}</div>
      <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#ffb060] to-[#ff4a2a]" style={{ width: `${v * 10}%` }} />
      </div>
      <div className="w-4 text-right">{v}</div>
    </div>
  );
}
