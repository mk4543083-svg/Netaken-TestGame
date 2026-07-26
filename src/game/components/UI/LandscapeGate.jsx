// LandscapeGate.jsx — forces landscape orientation for the arcade experience.
import { useEffect, useState } from "react";

export default function LandscapeGate({ children }) {
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth * 1.05);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    const so = window.screen?.orientation;
    if (so?.lock) { try { so.lock("landscape").catch(() => {}); } catch { /* unsupported */ } }
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return (
    <>
      {children}
      {portrait && (
        <div className="fixed inset-0 z-[100] bg-[#07030f] text-white flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="text-5xl animate-pulse">📱↻</div>
          <div className="text-lg font-black tracking-widest text-[#ffe27a]">ROTATE YOUR DEVICE</div>
          <div className="text-xs text-white/60 tracking-widest">NETA-KEN PLAYS IN LANDSCAPE</div>
        </div>
      )}
    </>
  );
}
