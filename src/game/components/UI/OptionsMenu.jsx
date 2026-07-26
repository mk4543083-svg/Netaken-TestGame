// OptionsMenu.jsx — audio sliders, mute, rounds, round timer, CPU difficulty.
import { useEffect, useState } from "react";
import { Settings, ROUND_OPTIONS, TIME_OPTIONS } from "../../utils/settings";
import { Audio } from "../../utils/audioEngine";

export default function OptionsMenu({ onBack, overlay = false }) {
  const [s, setS] = useState(Settings.get());
  useEffect(() => Settings.subscribe(setS), []);

  const patch = (p) => { Settings.set(p); Audio.refreshVolumes(); };

  return (
    <div className={overlay
      ? "absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 text-white"
      : "h-[100dvh] w-full bg-[#07030f] flex items-center justify-center p-3 text-white overflow-auto"}>
      <div className="w-full max-w-lg rounded-lg border-2 border-[#ffb060]/60 bg-[#0d0620]/95 p-4 shadow-[0_0_40px_#ff6a2a44] max-h-full overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="font-black tracking-widest text-[#ffe27a] text-lg">OPTIONS</div>
          <button onClick={() => { Audio.uiBack(); onBack(); }}
            className="px-3 py-1 rounded border border-white/30 text-xs font-bold">CLOSE</button>
        </div>

        <Section title="AUDIO">
          <Slider label="Master" value={s.masterVol} onChange={(v) => patch({ masterVol: v })} />
          <Slider label="SFX" value={s.sfxVol} onChange={(v) => patch({ sfxVol: v })} />
          <Slider label="BGM" value={s.bgmVol} onChange={(v) => patch({ bgmVol: v })} />
          <button onClick={() => { patch({ muted: !s.muted }); Audio.uiClick(); }}
            className={`mt-1 w-full py-2 rounded font-bold text-xs tracking-widest border-2 ${
              s.muted ? "border-[#ff4a5a] bg-[#ff4a5a]/20 text-[#ff8a95]" : "border-white/25 bg-white/5"}`}>
            {s.muted ? "MUTED — TAP TO UNMUTE" : "SOUND ON"}
          </button>
        </Section>

        <Section title="FIGHT ROUNDS">
          <Segmented options={ROUND_OPTIONS.map((r) => ({ value: r, label: `BEST OF ${r}` }))}
            value={s.rounds} onChange={(v) => { patch({ rounds: v }); Audio.uiClick(); }} />
        </Section>

        <Section title="ROUND TIMER">
          <Segmented options={TIME_OPTIONS.map((t) => ({ value: t, label: t === 0 ? "INFINITE" : `${t}s` }))}
            value={s.roundTime} onChange={(v) => { patch({ roundTime: v }); Audio.uiClick(); }} />
        </Section>

        <Section title="CPU DIFFICULTY">
          <Segmented options={[
            { value: "easy", label: "EASY" }, { value: "medium", label: "MEDIUM" }, { value: "hard", label: "HARD" }]}
            value={s.difficulty} onChange={(v) => { patch({ difficulty: v }); Audio.uiClick(); }} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] tracking-[0.3em] text-white/50 mb-1">{title}</div>
      <div className="grid gap-1.5">{children}</div>
    </div>
  );
}

function Slider({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-3 text-xs">
      <span className="w-14 text-white/70">{label}</span>
      <input type="range" min={0} max={100} value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="flex-1 accent-[#ff6a2a]" />
      <span className="w-10 text-right tabular-nums text-[#ffe27a]">{Math.round(value * 100)}%</span>
    </label>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${options.length},minmax(0,1fr))` }}>
      {options.map((o) => (
        <button key={String(o.value)} onClick={() => onChange(o.value)}
          className={`py-2 rounded text-[11px] font-black tracking-wider border-2 transition-all ${
            value === o.value ? "border-[#ffb060] bg-[#ff6a2a]/30 text-[#ffe27a]" : "border-white/20 bg-white/5 text-white/70"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
