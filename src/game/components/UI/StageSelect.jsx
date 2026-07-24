// StageSelect.jsx — pick one of 5 arenas after character select.
import { STAGES } from "../../utils/stages";

export default function StageSelect({ p1, p2, onPick, onBack }) {
  return (
    <div className="min-h-screen w-full bg-[#050310] text-white p-3 md:p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="px-3 py-1 rounded border border-white/30 text-xs">◀ BACK</button>
        <div className="text-lg md:text-2xl font-black tracking-widest text-[#ff4080]">SELECT STAGE</div>
        <div className="ml-auto text-xs md:text-sm text-white/60">
          <span className="text-[#7ac0ff]">{p1?.name}</span> vs <span className="text-[#ff8060]">{p2?.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 content-start">
        {STAGES.map((s) => (
          <button key={s.id} onClick={() => onPick(s)}
            className="group relative aspect-[16/9] rounded-lg overflow-hidden border-2 border-[#ff4080]/30 hover:border-[#ff4080] transition-all">
            <img src={s.bg} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3 text-left">
              <div className="text-lg md:text-xl font-black tracking-wider" style={{ color: s.tint, textShadow: "2px 2px 0 #000" }}>
                {s.name}
              </div>
              <div className="text-[11px] text-white/80">{s.desc}</div>
            </div>
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse" style={{ background: s.tint }} />
          </button>
        ))}
      </div>
    </div>
  );
}
