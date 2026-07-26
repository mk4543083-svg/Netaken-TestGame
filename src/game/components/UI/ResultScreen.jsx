// ResultScreen.jsx — post-match overlay rendered over the cinematic winner camera.
import { Audio } from "../../utils/audioEngine";

export default function ResultScreen({ winner, onRematch, onCharacterSelect, onMenu }) {
  const act = (fn) => () => { Audio.uiClick(); fn(); };
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-6 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/50" />

      <div className="relative text-center animate-scale-in">
        <div className="text-5xl sm:text-7xl font-black tracking-widest"
             style={{ color: "#ffe27a", textShadow: "4px 4px 0 #a1105a" }}>
          K.O.
        </div>
        <div className="mt-1 text-lg sm:text-2xl font-black tracking-widest text-white"
             style={{ textShadow: "2px 2px 0 #000" }}>
          {winner ? `${winner.name.toUpperCase()} WINS!` : "DRAW"}
        </div>
      </div>

      <div className="relative mt-5 grid gap-2 w-full max-w-xs px-4 pointer-events-auto">
        <Btn label="REMATCH" onClick={act(onRematch)} accent />
        <Btn label="SELECT CHARACTER" onClick={act(onCharacterSelect)} />
        <Btn label="MAIN MENU" onClick={act(onMenu)} />
      </div>
    </div>
  );
}

function Btn({ label, onClick, accent }) {
  return (
    <button onClick={onClick}
      className={`w-full py-2.5 rounded font-black tracking-widest text-xs sm:text-sm border-2 transition-all active:scale-[0.98] ${
        accent ? "border-[#ffb060] bg-[#ff6a2a]/40 hover:bg-[#ff6a2a]/60 text-white shadow-[0_0_24px_#ff6a2a66]"
               : "border-white/40 bg-black/50 hover:bg-white/10 text-white"}`}>
      {label}
    </button>
  );
}
