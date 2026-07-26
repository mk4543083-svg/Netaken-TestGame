// MainMenu.jsx — arcade landing screen.
import { useEffect } from "react";
import { Audio } from "../../utils/audioEngine";

export default function MainMenu({ onStart, onPractice, onCharacterSelect, onOptions, onCredits }) {
  useEffect(() => { Audio.unlock(); Audio.bgmSelect(); }, []);

  const go = (fn) => () => { Audio.uiClick(); fn(); };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#07030f] text-white flex flex-col items-center justify-center px-4 py-4">
      {/* Scanline / grid backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-30"
           style={{ background: "radial-gradient(circle at 50% 20%, #ff6a2a33, transparent 60%), repeating-linear-gradient(0deg,#ffffff10 0px,#ffffff10 1px,transparent 1px,transparent 4px)" }} />

      <h1 className="relative font-black tracking-widest text-center leading-none"
          style={{ fontSize: "clamp(2rem,8vh,4.5rem)",
                   background: "linear-gradient(180deg,#ffe27a,#ff6a2a 55%,#a1105a)",
                   WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                   textShadow: "0 0 30px rgba(255,120,60,0.4)" }}>
        NETA-KEN
      </h1>
      <div className="relative text-[#ffa060] tracking-[0.5em] text-[10px] sm:text-sm mt-1">ABSOLUTE CINEMA</div>

      <div className="relative grid gap-2 w-full max-w-md mt-5">
        <MenuBtn label="START FIGHT" onClick={go(onStart)} accent />
        <MenuBtn label="PRACTICE MODE" onClick={go(onPractice)} />
        <MenuBtn label="CHARACTER SELECT" onClick={go(onCharacterSelect)} />
        <div className="grid grid-cols-2 gap-2">
          <MenuBtn label="OPTIONS" onClick={go(onOptions)} />
          <MenuBtn label="CREDITS" onClick={go(onCredits)} />
        </div>
      </div>

      <div className="relative mt-4 text-[9px] sm:text-[10px] text-white/40 max-w-lg text-center leading-relaxed">
        Parody / satire only. Stylized caricatures. Best played in landscape.
        <br />Keys: WASD move · J/K punch · L/I kick · E jump · Space special · Shift block
      </div>
    </div>
  );
}

function MenuBtn({ label, onClick, accent }) {
  return (
    <button onClick={onClick} onPointerEnter={() => Audio.uiMove()}
      className={`w-full py-2.5 rounded-md border-2 font-black tracking-widest text-sm sm:text-base transition-all active:scale-[0.98]
        ${accent ? "border-[#ffb060] bg-[#ff6a2a]/25 hover:bg-[#ff6a2a]/45 shadow-[0_0_24px_#ff6a2a55]"
                 : "border-white/25 hover:border-white/70 bg-white/5 hover:bg-white/10"}`}>
      {label}
    </button>
  );
}
