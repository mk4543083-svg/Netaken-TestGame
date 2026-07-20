// DamageNumbers.jsx — floating damage text in world space via Html.
import { Html } from "@react-three/drei";
import { useEffect, useState } from "react";

export default function DamageNumbers({ items }) {
  return (
    <>
      {items.map((it) => (
        <FloatingNum key={it.id} item={it} />
      ))}
    </>
  );
}

function FloatingNum({ item }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf;
    const tick = () => {
      setT((performance.now() - start) / 900);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  if (t >= 1) return null;
  return (
    <Html position={[item.x, item.y + t * 1.2, 0]} center transform={false} pointerEvents="none">
      <div style={{
        color: item.blocked ? "#a0d0ff" : "#ffe066",
        textShadow: "2px 2px 0 #000, -2px -2px 0 #000",
        fontFamily: "Impact, sans-serif",
        fontSize: item.blocked ? 20 : 32,
        opacity: 1 - t,
        transform: `scale(${1 + t * 0.4})`,
        userSelect: "none",
      }}>
        {item.blocked ? `BLOCK ${item.dmg}` : item.dmg}
      </div>
    </Html>
  );
}
