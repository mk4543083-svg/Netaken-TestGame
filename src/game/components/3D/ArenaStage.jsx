// ArenaStage.jsx — renders any stage: painted photo backdrop + tinted 3D props + particles.
import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

export default function ArenaStage({ stage }) {
  const bgTex = useLoader(THREE.TextureLoader, stage.bg);
  useMemo(() => {
    if (bgTex) {
      bgTex.colorSpace = THREE.SRGBColorSpace;
      bgTex.wrapS = bgTex.wrapT = THREE.ClampToEdgeWrapping;
    }
  }, [bgTex]);

  return (
    <>
      {/* Curved backdrop plane behind fighters */}
      <mesh position={[0, 4, -9]}>
        <planeGeometry args={[36, 14]} />
        <meshBasicMaterial map={bgTex} toneMapped={false} />
      </mesh>

      {/* Floor blended with tint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 20]} />
        <meshLambertMaterial color={stage.tint} />
      </mesh>

      {/* Grounding contact shadow strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[14, 4]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>

      {/* Theme-specific foreground props + particles */}
      {stage.theme === "temple" && <TempleProps />}
      {stage.theme === "runes" && <RuneProps />}
      {stage.theme === "cathedral" && <CathedralProps />}
      {stage.theme === "hell" && <HellProps />}
      {stage.theme === "cage" && <CageProps />}

      {/* Lighting */}
      <ambientLight intensity={0.75} color={stage.ambient} />
      <directionalLight position={[6, 10, 6]} intensity={0.9} color={stage.ambient} castShadow />
      <hemisphereLight args={[stage.ambient, stage.fog, 0.4]} />
      <fog attach="fog" args={[stage.fog, 18, 40]} />
    </>
  );
}

function TempleProps() {
  return (
    <>
      {/* Torii pillars */}
      <mesh position={[-6, 3, -2]}><boxGeometry args={[0.5, 6, 0.5]} /><meshLambertMaterial color="#c81a1a" /></mesh>
      <mesh position={[6, 3, -2]}><boxGeometry args={[0.5, 6, 0.5]} /><meshLambertMaterial color="#c81a1a" /></mesh>
      <mesh position={[0, 6.2, -2]}><boxGeometry args={[13, 0.5, 0.6]} /><meshLambertMaterial color="#c81a1a" /></mesh>
      {/* Lanterns */}
      <mesh position={[-4, 3.5, -1.5]}><boxGeometry args={[0.6, 0.8, 0.6]} /><meshBasicMaterial color="#ffb060" /></mesh>
      <mesh position={[4, 3.5, -1.5]}><boxGeometry args={[0.6, 0.8, 0.6]} /><meshBasicMaterial color="#ffb060" /></mesh>
      <pointLight color="#ffb060" position={[-4, 3.5, -1.5]} intensity={1.4} distance={6} />
      <pointLight color="#ffb060" position={[4, 3.5, -1.5]} intensity={1.4} distance={6} />
      <Sakura />
    </>
  );
}

function Sakura() {
  const ref = useRef();
  const N = 40;
  const seeds = useMemo(() => Array.from({ length: N }, () => ({
    x: (Math.random() - 0.5) * 20, y: Math.random() * 8, z: (Math.random() - 0.5) * 6,
    s: 0.06 + Math.random() * 0.06, drift: Math.random() * 2,
  })), []);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => {
      c.position.y -= 0.4 * dt;
      c.position.x += Math.sin(c.position.y + seeds[i].drift) * 0.01;
      if (c.position.y < 0) c.position.y = 8;
    });
  });
  return (
    <group ref={ref}>
      {seeds.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]}>
          <boxGeometry args={[s.s, s.s, s.s]} />
          <meshBasicMaterial color="#ffb0d0" />
        </mesh>
      ))}
    </group>
  );
}

function RuneProps() {
  return (
    <>
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, 2.5, -1.5]}>
          <cylinderGeometry args={[0.4, 0.4, 5, 8]} />
          <meshLambertMaterial color="#4a3a6a" />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[2.5, 3.0, 32]} />
        <meshBasicMaterial color="#a080ff" transparent opacity={0.7} />
      </mesh>
      <pointLight color="#a080ff" position={[0, 3, 0]} intensity={2} distance={10} />
    </>
  );
}

function CathedralProps() {
  return (
    <>
      {[-6, -3, 3, 6].map((x) => (
        <mesh key={x} position={[x, 4, -3]}>
          <boxGeometry args={[0.6, 8, 0.6]} /><meshLambertMaterial color="#5a5a68" />
        </mesh>
      ))}
      <mesh position={[0, 7, -3]}>
        <boxGeometry args={[13, 0.3, 0.8]} /><meshLambertMaterial color="#4a4a58" />
      </mesh>
      {/* God rays via light cones */}
      <spotLight position={[-3, 8, 2]} angle={0.35} penumbra={0.7} intensity={2} color="#e0d0a0" />
      <spotLight position={[3, 8, 2]}  angle={0.35} penumbra={0.7} intensity={2} color="#e0d0a0" />
    </>
  );
}

function HellProps() {
  return (
    <>
      {[-4, 4].map((x) => (
        <mesh key={x} position={[x, 5, -2]}>
          <boxGeometry args={[0.15, 8, 0.15]} /><meshBasicMaterial color="#3a2a1a" />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[3.2, 3.6, 32]} />
        <meshBasicMaterial color="#ff4a20" transparent opacity={0.7} />
      </mesh>
      <pointLight color="#ff6020" position={[0, 0.5, 0]} intensity={3} distance={12} />
    </>
  );
}

function CageProps() {
  const bars = 12;
  return (
    <>
      {Array.from({ length: bars }).map((_, i) => {
        const a = (i / bars) * Math.PI * 2;
        const r = 8;
        return (
          <mesh key={i} position={[Math.cos(a) * r, 3, -Math.abs(Math.sin(a)) * 2 - 3]}>
            <boxGeometry args={[0.08, 6, 0.08]} /><meshBasicMaterial color="#c8c8d0" />
          </mesh>
        );
      })}
      <pointLight color="#ff2050" position={[0, 8, 0]} intensity={3} distance={20} />
      <pointLight color="#ff2050" position={[-6, 6, 4]} intensity={2} distance={12} />
      <pointLight color="#ff2050" position={[6, 6, 4]}  intensity={2} distance={12} />
    </>
  );
}
