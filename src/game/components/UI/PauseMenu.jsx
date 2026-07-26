// PauseMenu.jsx — translucent in-fight pause overlay.
import { Audio } from "../../utils/audioEngine";

export default function PauseMenu({ practice, dummy, onDummy, onResume, onRestart, onResetPositions, onCommandList, onCharacterSelect, onMenu }) {
  const act = (fn) => () => { Audio.uiClick(); fn(); };
  return (
    <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 text-white">
      <div className="w-full max-w-sm rounded-lg border-2 border-[#7ac0ff]/60 bg-[#0a0620]/95 p-4 shadow-[0_0_40px_#7ac0ff44] max-h-full overflow-auto">
        <div className="text-center font-black tracking-[0.4em] text-2xl text-[#ffe27a] mb-3">PAUSED</div>
        <div className="grid gap-2">
          <Btn label="RESUME" onClick={act(onResume)} accent />
          {practice
            ? <Btn label="RESET POSITIONS" onClick={act(onResetPositions)} />
            : <Btn label="RESTART MATCH" onClick={act(onRestart)} />}
          {practice && <Btn label="COMMAND LIST / TUTORIAL" onClick={act(onCommandList)} />}
          <Btn label="CHARACTER SELECTION" onClick={act(onCharacterSelect)} />
          <Btn label="MAIN MENU" onClick={act(onMenu)} />
        </div>

        {practice && (
          <div className="mt-4">
            <div className="text-[10px] tracking-[0.3em] text-white/50 mb-1">DUMMY SETTINGS</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[["stand", "STAND"], ["crouch", "CROUCH"], ["guard", "GUARD ALL"], ["cpu", "CPU FIGHT"]].map(([v, l]) => (
                <button key={v} onClick={() => { Audio.uiClick(); onDummy(v); }}
                  className={`py-2 rounded text-[11px] font-black border-2 ${
                    dummy === v ? "border-[#ffb060] bg-[#ff6a2a]/30 text-[#ffe27a]" : "border-white/20 bg-white/5 text-white/70"}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-white/40">Practice mode: health auto-refills.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Btn({ label, onClick, accent }) {
  return (
    <button onClick={onClick}
      className={`w-full py-2.5 rounded font-black tracking-widest text-xs sm:text-sm border-2 transition-all active:scale-[0.98] ${
        accent ? "border-[#ffb060] bg-[#ff6a2a]/25 hover:bg-[#ff6a2a]/45" : "border-white/25 bg-white/5 hover:bg-white/10"}`}>
      {label}
    </button>
  );
}
