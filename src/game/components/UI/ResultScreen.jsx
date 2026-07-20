// ResultScreen.jsx — post-match K.O. summary.
export default function ResultScreen({ winner, onRematch, onMenu }) {
  return (
    <div className="absolute inset-0 z-30 bg-black/70 flex flex-col items-center justify-center text-white">
      <div className="text-6xl md:text-8xl font-black tracking-widest"
           style={{ color: "#ffe27a", textShadow: "4px 4px 0 #a1105a" }}>
        K.O.
      </div>
      <div className="mt-4 text-xl md:text-2xl font-bold">{winner ? `${winner.name} WINS!` : "DRAW"}</div>
      <div className="mt-8 flex gap-3">
        <button onClick={onRematch} className="px-6 py-3 rounded bg-[#ff6a2a] hover:bg-[#ff7a3a] font-black tracking-widest">
          REMATCH
        </button>
        <button onClick={onMenu} className="px-6 py-3 rounded border-2 border-white/40 hover:bg-white/10 font-black tracking-widest">
          MAIN MENU
        </button>
      </div>
    </div>
  );
}
