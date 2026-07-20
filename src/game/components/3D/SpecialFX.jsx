// SpecialFX.jsx — themed particle/geometry burst per specialFx id.
// Each effect lives ~1.2s then removes itself via onDone callback.
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const LIFE = 1.2;

export default function SpecialFX({ fx, from, toward, onDone }) {
  const [t, setT] = useState(0);
  const dir = toward >= from.x ? 1 : -1;

  useFrame((_, dt) => {
    setT((v) => {
      const n = v + dt;
      if (n >= LIFE && onDone) onDone();
      return n;
    });
  });

  if (t >= LIFE) return null;
  const p = t / LIFE;

  switch (fx) {
    case "bulletTrain": return <BulletTrain from={from} dir={dir} p={p} />;
    case "bulldozer":   return <Bulldozer from={from} dir={dir} p={p} />;
    case "electricRing":return <ElectricRing from={from} p={p} />;
    case "beam":
    case "sonicShout":  return <Beam from={from} dir={dir} p={p} color="#e8f8ff" />;
    case "icbm":        return <ICBM from={from} dir={dir} p={p} />;
    case "wall":        return <Wall from={from} dir={dir} p={p} />;
    case "dragon":      return <Dragon from={from} dir={dir} p={p} color="#f0c020" />;
    case "chariot":     return <Chariot from={from} dir={dir} p={p} />;
    case "whirlwind":   return <Whirlwind from={from} p={p} color="#4a8aff" />;
    case "punchRush":   return <PunchRush from={from} dir={dir} p={p} />;
    case "helicopter":  return <Helicopter from={from} dir={dir} p={p} />;
    case "suvCharge":   return <SUV from={from} dir={dir} p={p} />;
    case "erasTour":    return <EraTour from={from} p={p} />;
    case "bassDrop":    return <BassDrop from={from} p={p} />;
    case "rainTrance":  return <Rain from={from} p={p} />;
    case "doorSlap":    return <DoorSlap from={from} dir={dir} p={p} />;
    case "gunSlinger":  return <Gun from={from} dir={dir} p={p} />;
    case "marchDash":   return <MarchDash from={from} dir={dir} p={p} />;
    case "bearSlam":    return <BearSlam from={from} dir={dir} p={p} />;
    case "drones":      return <Drones from={from} dir={dir} p={p} />;
    case "samurai":     return <Samurai from={from} dir={dir} p={p} />;
    case "checkmate":   return <Checkmate from={from} p={p} />;
    default:            return <Beam from={from} dir={dir} p={p} color="#ffee88" />;
  }
}

// --- helpers ---
function BulletTrain({ from, dir, p }) {
  const x = from.x + dir * (-4 + p * 12);
  return (
    <group position={[x, 1.1, 0.2]}>
      <mesh><boxGeometry args={[3.5, 0.9, 0.9]} /><meshBasicMaterial color="#f8d060" /></mesh>
      <mesh position={[dir * 1.8, 0, 0]}><coneGeometry args={[0.5, 1, 8]} /><meshBasicMaterial color="#ffefa0" /></mesh>
      <pointLight color="#ffe080" intensity={2} distance={4} />
    </group>
  );
}
function Bulldozer({ from, dir, p }) {
  const y = 5 - p * 5;
  return (
    <group position={[from.x + dir * 1.4, y, 0]}>
      <mesh><boxGeometry args={[2, 1.4, 1.4]} /><meshBasicMaterial color="#e8a020" /></mesh>
      <mesh position={[dir * 1.2, -0.3, 0]}><boxGeometry args={[0.4, 1.6, 1.6]} /><meshBasicMaterial color="#c07010" /></mesh>
      <pointLight color="#ffb020" intensity={3} distance={5} />
    </group>
  );
}
function ElectricRing({ from, p }) {
  const r = 0.4 + p * 3.5;
  return (
    <group position={[from.x, 0.05, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.1, 8, 24]} />
        <meshBasicMaterial color="#80f0ff" transparent opacity={1 - p} />
      </mesh>
      <pointLight color="#80f0ff" intensity={4 * (1 - p)} distance={6} />
    </group>
  );
}
function Beam({ from, dir, p, color }) {
  const len = 8 * Math.min(1, p * 2);
  return (
    <group position={[from.x + dir * (len / 2 + 0.5), 1.2, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25 * (1 - p), 0.25, len, 8]} />
        <meshBasicMaterial color={color} transparent opacity={1 - p * 0.5} />
      </mesh>
      <pointLight color={color} intensity={3} distance={6} />
    </group>
  );
}
function ICBM({ from, dir, p }) {
  if (p < 0.6) {
    const y = 8 - p * 12;
    return (
      <group position={[from.x + dir * 2, y, 0]}>
        <mesh><cylinderGeometry args={[0.2, 0.2, 1.2, 8]} /><meshBasicMaterial color="#e8e8e8" /></mesh>
        <mesh position={[0, -0.7, 0]}><coneGeometry args={[0.2, 0.4, 8]} /><meshBasicMaterial color="#c02020" /></mesh>
      </group>
    );
  }
  const r = (p - 0.6) * 10;
  return (
    <group position={[from.x + dir * 2, 0.5, 0]}>
      <mesh><sphereGeometry args={[r, 12, 8]} /><meshBasicMaterial color="#ff8020" transparent opacity={1 - (p - 0.6) * 2.5} /></mesh>
      <pointLight color="#ff6000" intensity={8} distance={10} />
    </group>
  );
}
function Wall({ from, dir, p }) {
  const h = 4 * p;
  return (
    <mesh position={[from.x + dir * 2.5, h / 2, 0]}>
      <boxGeometry args={[0.6, h, 2]} />
      <meshBasicMaterial color="#c8a020" />
    </mesh>
  );
}
function Dragon({ from, dir, p, color }) {
  const segs = 8;
  return (
    <group>
      {Array.from({ length: segs }).map((_, i) => {
        const off = i / segs;
        const x = from.x + dir * (off * 6 + p * 3);
        const y = 1 + Math.sin(off * 6 + p * 10) * 0.6;
        return (
          <mesh key={i} position={[x, y, 0]}>
            <sphereGeometry args={[0.35 - i * 0.02, 8, 6]} />
            <meshBasicMaterial color={color} transparent opacity={1 - p} />
          </mesh>
        );
      })}
    </group>
  );
}
function Chariot({ from, dir, p }) {
  return (
    <group position={[from.x + dir * (-3 + p * 8), 0.7, 0]}>
      <mesh><boxGeometry args={[1.6, 1, 1]} /><meshBasicMaterial color="#c8a020" /></mesh>
      <mesh position={[-0.7, -0.5, 0.55]}><torusGeometry args={[0.3, 0.08, 6, 12]} /><meshBasicMaterial color="#8a6a10" /></mesh>
      <mesh position={[0.7, -0.5, 0.55]}><torusGeometry args={[0.3, 0.08, 6, 12]} /><meshBasicMaterial color="#8a6a10" /></mesh>
    </group>
  );
}
function Whirlwind({ from, p, color }) {
  return (
    <group position={[from.x, 1.2, 0]} rotation={[0, p * 12, 0]}>
      <mesh><torusGeometry args={[0.8 + p, 0.15, 6, 16]} /><meshBasicMaterial color={color} transparent opacity={1 - p} /></mesh>
      <mesh position={[0, 0.6, 0]}><torusGeometry args={[0.5 + p * 0.6, 0.12, 6, 16]} /><meshBasicMaterial color={color} transparent opacity={1 - p} /></mesh>
    </group>
  );
}
function PunchRush({ from, dir, p }) {
  const fists = 6;
  return (
    <group>
      {Array.from({ length: fists }).map((_, i) => {
        const t = (p * 6 - i) % 1;
        if (t < 0 || t > 1) return null;
        return (
          <mesh key={i} position={[from.x + dir * (1 + t * 2), 1.3, 0]}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshBasicMaterial color="#ffe080" />
          </mesh>
        );
      })}
    </group>
  );
}
function Helicopter({ from, dir, p }) {
  return (
    <group position={[from.x + dir * 1.5, 1.4, 0]} rotation={[0, p * 20, 0]}>
      <mesh><boxGeometry args={[2, 0.15, 0.2]} /><meshBasicMaterial color="#f5c518" /></mesh>
      <pointLight color="#f5c518" intensity={2} distance={4} />
    </group>
  );
}
function SUV({ from, dir, p }) {
  return (
    <group position={[from.x + dir * (-4 + p * 10), 0.6, 0]}>
      <mesh><boxGeometry args={[2, 1, 1]} /><meshBasicMaterial color="#1a1a1a" /></mesh>
      <mesh position={[0, 0.6, 0]}><boxGeometry args={[1.2, 0.5, 0.9]} /><meshBasicMaterial color="#2a2a2a" /></mesh>
    </group>
  );
}
function EraTour({ from, p }) {
  const notes = 10;
  return (
    <group position={[from.x, 1.5, 0]}>
      {Array.from({ length: notes }).map((_, i) => {
        const a = (i / notes) * Math.PI * 2 + p * 4;
        const r = 1 + p * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r * 0.5, 0]}>
            <sphereGeometry args={[0.15, 6, 6]} />
            <meshBasicMaterial color="#f8c8f8" />
          </mesh>
        );
      })}
      <pointLight color="#ffe0f8" intensity={3} distance={6} />
    </group>
  );
}
function BassDrop({ from, p }) {
  return <ElectricRing from={from} p={p} />;
}
function Rain({ from, p }) {
  return (
    <group position={[from.x, 3 - p, 0]}>
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i} position={[(i - 10) * 0.3, -p * 3, 0]}>
          <sphereGeometry args={[0.06, 4, 4]} />
          <meshBasicMaterial color="#60a0ff" />
        </mesh>
      ))}
    </group>
  );
}
function DoorSlap({ from, dir, p }) {
  return (
    <group position={[from.x + dir * 2.5, 1.2, 0]}>
      <mesh><boxGeometry args={[0.15, 2.4, 1.2]} /><meshBasicMaterial color="#6a4a2a" /></mesh>
    </group>
  );
}
function Gun({ from, dir, p }) {
  const flash = p < 0.3 || (p > 0.4 && p < 0.5) || (p > 0.6 && p < 0.7);
  return (
    <group position={[from.x + dir * 0.8, 1.3, 0]}>
      {flash && <mesh><sphereGeometry args={[0.3, 8, 6]} /><meshBasicMaterial color="#fff0a0" /></mesh>}
    </group>
  );
}
function MarchDash({ from, dir, p }) {
  return (
    <group position={[from.x + dir * (p * 4), 0.6, 0]}>
      <mesh><boxGeometry args={[2, 1, 0.5]} /><meshBasicMaterial color="#e8d8b0" transparent opacity={0.6} /></mesh>
    </group>
  );
}
function BearSlam({ from, dir, p }) {
  return (
    <group position={[from.x + dir * 1.5, 1 - p * 0.6, 0]}>
      <mesh><boxGeometry args={[1.6, 1.4, 1]} /><meshBasicMaterial color="#4a2a1a" /></mesh>
    </group>
  );
}
function Drones({ from, dir, p }) {
  return (
    <group>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[from.x + dir * (1 + i * 0.6), 3 - p * 3, 0]}>
          <boxGeometry args={[0.3, 0.15, 0.3]} />
          <meshBasicMaterial color="#2a3a2a" />
        </mesh>
      ))}
    </group>
  );
}
function Samurai({ from, dir, p }) {
  return (
    <group position={[from.x + dir * (p * 6 - 1), 1.2, 0]}>
      <mesh><boxGeometry args={[0.1, 1.6, 0.1]} /><meshBasicMaterial color="#f0f0ff" /></mesh>
    </group>
  );
}
function Checkmate({ from, p }) {
  return (
    <group position={[from.x, 1.2, 0]}>
      <mesh><boxGeometry args={[2 * (1 - p), 2 * (1 - p), 2 * (1 - p)]} /><meshBasicMaterial color="#a0f0ff" wireframe /></mesh>
    </group>
  );
}
