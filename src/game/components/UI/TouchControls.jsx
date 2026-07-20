// TouchControls.jsx — mobile virtual D-pad + 5 action buttons.
export default function TouchControls({ input }) {
  const bind = (name) => ({
    onPointerDown: (e) => { e.preventDefault(); input.touchDown(name); },
    onPointerUp:   (e) => { e.preventDefault(); input.touchUp(name); },
    onPointerLeave:(e) => { input.touchUp(name); },
    onPointerCancel:(e)=> { input.touchUp(name); },
  });
  const Pad = ({ name, label, cls = "" }) => (
    <button {...bind(name)} className={`select-none touch-none w-14 h-14 rounded-full border-2 border-white/40 bg-white/10 backdrop-blur active:bg-white/30 font-black text-white text-sm ${cls}`}>
      {label}
    </button>
  );
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex justify-between items-end p-3 md:hidden pointer-events-none">
      {/* D-Pad */}
      <div className="grid grid-cols-3 grid-rows-3 gap-1 pointer-events-auto">
        <div />
        <Pad name="up"    label="▲" />
        <div />
        <Pad name="left"  label="◀" />
        <Pad name="block" label="BLK" />
        <Pad name="right" label="▶" />
        <div />
        <Pad name="down"  label="▼" />
        <div />
      </div>
      {/* Actions */}
      <div className="grid grid-cols-3 gap-1 pointer-events-auto">
        <Pad name="LP" label="LP" />
        <Pad name="HP" label="HP" />
        <Pad name="SP" label="SP" cls="!bg-[#ff6a2a]/50 !border-[#ffb060]" />
        <Pad name="LK" label="LK" />
        <Pad name="HK" label="HK" />
        <div />
      </div>
    </div>
  );
}
