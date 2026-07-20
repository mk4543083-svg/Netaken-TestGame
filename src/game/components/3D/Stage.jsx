// Stage.jsx — PS1-style arena: low-poly floor, gradient sky, flat lights.
import { useMemo } from "react";
import * as THREE from "three";

export default function Stage() {
  const skyTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 8; c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#2a1848");
    g.addColorStop(0.55, "#c04a5a");
    g.addColorStop(1, "#f0a860");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 256);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);

  const floorTex = useMemo(() => {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#3a2a2a";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        ctx.fillStyle = (i + j) % 2 ? "#4a3838" : "#2e2020";
        ctx.fillRect(i * 16, j * 16, 16, 16);
      }
    }
    // grid lines
    ctx.strokeStyle = "#6a4a3a";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath(); ctx.moveTo(i * 16, 0); ctx.lineTo(i * 16, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 16); ctx.lineTo(size, i * 16); ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 6);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    return t;
  }, []);

  return (
    <>
      {/* Sky dome */}
      <mesh scale={[50, 50, 50]}>
        <sphereGeometry args={[1, 24, 12]} />
        <meshBasicMaterial map={skyTex} side={THREE.BackSide} />
      </mesh>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 20]} />
        <meshLambertMaterial map={floorTex} />
      </mesh>

      {/* Back walls / pillars */}
      <mesh position={[-8, 2, -4]}>
        <boxGeometry args={[1.2, 4, 1.2]} />
        <meshLambertMaterial color="#1a0f2a" />
      </mesh>
      <mesh position={[8, 2, -4]}>
        <boxGeometry args={[1.2, 4, 1.2]} />
        <meshLambertMaterial color="#1a0f2a" />
      </mesh>
      <mesh position={[0, 0.02, -3]}>
        <planeGeometry args={[16, 6]} />
        <meshBasicMaterial color="#2a1030" transparent opacity={0.5} />
      </mesh>

      {/* Lights: bright ambient (PS1-flat) + one directional */}
      <ambientLight intensity={0.85} color="#ffe4c0" />
      <directionalLight position={[6, 10, 6]} intensity={0.7} color="#ffd4a0" />
      <hemisphereLight args={["#c8a0ff", "#4a2a1a", 0.4]} />
    </>
  );
}
