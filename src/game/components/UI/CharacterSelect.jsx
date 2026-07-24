// CharacterSelect.jsx — 8-fighter neon grid with live GLB preview and stats.
import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ROSTER } from "../../utils/roster";
import { SELECT_BG_URL } from "../../utils/stages";
import FighterGLB, { preloadFighter } from "../3D/FighterGLB";
import * as THREE from "three";

export default function CharacterSelect({ label, onPick, onBack }) {
  const [hover, setHover] = useState(ROSTER[0]);

  useEffect(() => {
    // Preload all 8 GLBs when the roster mounts.
    ROSTER.forEach((f) => { try { preloadFighter(f.glbUrl); } catch {} });
  }, []);

  const accent = label.toLowerCase().includes("1") ? "#7ac0ff" : "#ff8060";

  return (
    <div className="min-h-screen w-full text-white p-3 md:p-6 flex flex-col relative overflow-hidden"
         style={{ background: `url(${SELECT_BG_URL}) center/cover no-repeat, #050310` }}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/85 pointer-events-none" />
      <div className="relative flex items-center gap-3 mb-4">
        <button onClick={onBack} className="px-3 py-1 rounded border border-white/30 text-xs">◀ BACK</button>
        <div className="text-lg md:text-2xl font-black tracking-widest" style={{ color: accent, textShadow: "2px 2px 0 #000" }}>
          SELECT · {label.toUpperCase()}
        </div>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_360px] gap-4 flex-1 min-h-0">
        {/* Neon 8-card grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 content-start">
          {ROSTER.map((f) => {
            const selected = hover.id === f.id;
            return (
              <button key={f.id}
                onMouseEnter={() => setHover(f)}
                onFocus={() => setHover(f)}
                onClick={() => setHover(f)}
                onDoubleClick={() => onPick(f)}
                className="group relative aspect-[3/4] rounded-md overflow-hidden transition-all"
                style={{
                  border: `2px solid ${selected ? f.color : "rgba(255,255,255,0.15)"}`,
                  boxShadow: selected ? `0 0 22px ${f.color}aa, inset 0 0 22px ${f.color}44` : "none",
                }}>
                <div className="absolute inset-0" style={{
                  background: `linear-gradient(180deg, ${f.color}22 0%, #000000 90%)`,
                }} />
                <div className="absolute inset-x-0 top-1 text-center text-[10px] tracking-widest font-bold" style={{ color: f.color }}>
                  {f.tag}
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-5xl font-black opacity-70"
                     style={{ color: f.color, textShadow: `0 0 20px ${f.color}` }}>
                  {f.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-black/80 text-[10px] font-bold px-1 py-1 truncate text-center">
                  {f.name}
                </div>
                {selected && <div className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: f.color }} />}
              </button>
            );
          })}
        </div>

        {/* Live GLB preview + stats */}
        <div className="rounded-lg border-2 p-3 backdrop-blur"
             style={{ borderColor: `${hover.color}88`, background: "rgba(10,5,25,0.7)", boxShadow: `0 0 30px ${hover.color}55` }}>
          <div className="w-full aspect-[3/4] rounded overflow-hidden border-2 mb-2"
               style={{ borderColor: `${hover.color}66`, background: `radial-gradient(circle at 50% 30%, ${hover.color}33, #000)` }}>
            <Canvas key={hover.id} camera={{ position: [0, 1.4, 3.2], fov: 40 }} dpr={[1, 1.5]}>
              <ambientLight intensity={0.9} />
              <directionalLight position={[3, 5, 4]} intensity={1.1} />
              <Suspense fallback={null}>
                <group position={[0, -1.0, 0]}>
                  <FighterGLB fighter={hover} state={{ state: "idle" }} />
                </group>
              </Suspense>
            </Canvas>
          </div>

          <div className="text-lg font-black" style={{ color: hover.color }}>{hover.name}</div>
          <div className="text-xs tracking-wider mb-1 text-white/70">{hover.tag} · {hover.origin}</div>
          <StatRow label="Power"   v={hover.stats.power}   color={hover.color} />
          <StatRow label="Speed"   v={hover.stats.speed}   color={hover.color} />
          <StatRow label="Defense" v={hover.stats.defense} color={hover.color} />
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="text-[10px] text-white/60 uppercase tracking-widest">Special</div>
            <div className="text-sm font-bold" style={{ color: hover.color }}>{hover.specialName}</div>
            <div className="text-[11px] text-white/70 leading-snug">{hover.specialDesc}</div>
          </div>
          <button onClick={() => onPick(hover)}
            className="mt-3 w-full py-2 rounded font-black tracking-widest transition-all"
            style={{ background: hover.color, color: "#000", boxShadow: `0 0 20px ${hover.color}` }}>
            CHOOSE
          </button>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, v, color }) {
  return (
    <div className="flex items-center gap-2 text-[11px] mb-0.5">
      <div className="w-14 text-white/60">{label}</div>
      <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden">
        <div className="h-full" style={{ width: `${v * 10}%`, background: `linear-gradient(90deg, ${color}, #fff)` }} />
      </div>
      <div className="w-4 text-right">{v}</div>
    </div>
  );
}
