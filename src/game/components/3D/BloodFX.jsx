// BloodFX.jsx — particle burst of blood droplets at a hit location.
// Spawned per non-blocked hit, auto-removes after LIFE seconds via onDone().
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const LIFE = 0.6;
const COUNT = 14;

export default function BloodFX({ x, y, z = 0, dir = 1, heavy = false, onDone }) {
  const groupRef = useRef();
  const tRef = useRef(0);
  const doneRef = useRef(false);

  const particles = useMemo(() => {
    const n = heavy ? COUNT + 8 : COUNT;
    return Array.from({ length: n }).map(() => ({
      vx: (Math.random() - 0.5) * 2.2 + dir * 0.8,
      vy: Math.random() * 2.6 + 0.8,
      vz: (Math.random() - 0.5) * 1.4,
      scale: 0.05 + Math.random() * (heavy ? 0.09 : 0.06),
      spin: Math.random() * 10,
    }));
  }, [heavy, dir]);

  useFrame((_, deltaRaw) => {
    const dt = Math.min(deltaRaw, 0.033);
    tRef.current += dt;
    const k = Math.max(0, 1 - tRef.current / LIFE);
    if (groupRef.current) {
      groupRef.current.children.forEach((mesh, i) => {
        const p = particles[i];
        if (!p) {
          if (mesh.material) mesh.material.opacity = 0.5 * k;
          return;
        }
        mesh.position.x += p.vx * dt;
        mesh.position.y += p.vy * dt;
        mesh.position.z += p.vz * dt;
        p.vy -= 9.8 * dt;
        mesh.rotation.x += p.spin * dt;
        mesh.rotation.z += p.spin * dt;
        if (mesh.material) mesh.material.opacity = k;
      });
    }
    if (tRef.current >= LIFE && !doneRef.current) {
      doneRef.current = true;
      onDone?.();
    }
  });

  return (
    <group ref={groupRef} position={[x, y, z]}>
      {particles.map((p, i) => (
        <mesh key={i} scale={p.scale}>
          <sphereGeometry args={[1, 5, 4]} />
          <meshBasicMaterial color="#a80f0f" transparent opacity={1} depthWrite={false} />
        </mesh>
      ))}
      {/* Central flash splat */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[heavy ? 0.4 : 0.25, 10]} />
        <meshBasicMaterial color="#8a0000" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}
