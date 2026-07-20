// FighterMesh.jsx — procedural low-poly PS1-style humanoid.
// Reads body preset + face texture. Animates pose from `state`.
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getBodyPreset } from "../../utils/bodyPresets";
import { getFaceTexture } from "../../utils/textureManager";

export default function FighterMesh({ fighter, state }) {
  const preset = useMemo(() => getBodyPreset(fighter), [fighter]);
  const faceTex = useMemo(() => getFaceTexture(fighter), [fighter]);
  const group = useRef();
  const rArm = useRef(); const lArm = useRef();
  const rLeg = useRef(); const lLeg = useRef();
  const body = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const s = state?.state || "idle";
    // idle bob
    if (body.current) body.current.position.y = Math.sin(t * 3) * 0.03;
    // walk swing
    if (s === "walk") {
      const sw = Math.sin(t * 10);
      if (rArm.current) rArm.current.rotation.x = sw * 0.6;
      if (lArm.current) lArm.current.rotation.x = -sw * 0.6;
      if (rLeg.current) rLeg.current.rotation.x = -sw * 0.5;
      if (lLeg.current) lLeg.current.rotation.x = sw * 0.5;
    } else if (s === "attack" || s === "special") {
      const p = Math.min(1, (state.attack?.elapsed || 0) / 12);
      if (rArm.current) rArm.current.rotation.x = -1.6 * p;
      if (rArm.current) rArm.current.rotation.z = 0.4 * p;
    } else if (s === "hitstun") {
      if (body.current) body.current.rotation.z = 0.3;
      if (rArm.current) rArm.current.rotation.x = 0.8;
      if (lArm.current) lArm.current.rotation.x = 0.8;
    } else if (s === "block") {
      if (rArm.current) rArm.current.rotation.x = -1.2;
      if (lArm.current) lArm.current.rotation.x = -1.2;
    } else if (s === "ko") {
      if (body.current) body.current.rotation.z = Math.PI / 2;
    } else {
      if (rArm.current) rArm.current.rotation.x = 0.05 * Math.sin(t * 2);
      if (lArm.current) lArm.current.rotation.x = -0.05 * Math.sin(t * 2);
      if (rLeg.current) rLeg.current.rotation.x = 0;
      if (lLeg.current) lLeg.current.rotation.x = 0;
      if (body.current) body.current.rotation.z = 0;
    }
  });

  const skin = preset.palette.skin;
  const outfit = preset.palette.outfit;
  const accent = preset.palette.accent;

  // scaled dims
  const H = preset.height;
  const S = preset.shoulder;
  const CH = preset.chest;
  const W = preset.waist;
  const L = preset.limb;

  const headSize = 0.42 * H;
  const torsoH = 0.9 * H;
  const legH = 0.85 * H * L;
  const armH = 0.75 * H * L;

  return (
    <group ref={group}>
      <group ref={body}>
        {/* Head */}
        <mesh position={[0, legH + torsoH + headSize / 2 + 0.05, 0]} castShadow>
          <boxGeometry args={[headSize, headSize, headSize * 0.85]} />
          <meshLambertMaterial map={faceTex} color={"#ffffff"} />
        </mesh>

        {/* Neck accessory (muffler) */}
        {preset.neck === "muffler" && (
          <mesh position={[0, legH + torsoH + 0.04, 0]}>
            <boxGeometry args={[0.55 * S, 0.15, 0.55]} />
            <meshLambertMaterial color={accent} />
          </mesh>
        )}

        {/* Torso */}
        <mesh position={[0, legH + torsoH / 2, 0]} castShadow>
          <boxGeometry args={[0.7 * S, torsoH, 0.4 * CH]} />
          <meshLambertMaterial color={outfit} />
        </mesh>

        {/* Jacket / vest layer */}
        {(preset.jacket === "vest" || preset.jacket === "coat" || preset.jacket === "robe" || preset.jacket === "shawl" || preset.jacket === "gown" || preset.jacket === "wrap") && (
          <mesh position={[0, legH + torsoH / 2, 0.22 * CH]}>
            <boxGeometry args={[0.78 * S, torsoH * (preset.jacket === "gown" || preset.jacket === "robe" ? 1.2 : 0.95), 0.06]} />
            <meshLambertMaterial color={accent} />
          </mesh>
        )}

        {/* Tie */}
        {preset.tie && (
          <mesh position={[0, legH + torsoH * 0.6, 0.24 * CH]}>
            <boxGeometry args={[0.08, torsoH * 0.55, 0.03]} />
            <meshLambertMaterial color="#c81a1a" />
          </mesh>
        )}

        {/* Badge (Dhoni 7) */}
        {preset.badge && (
          <mesh position={[0.18, legH + torsoH * 0.65, 0.22 * CH]}>
            <boxGeometry args={[0.12, 0.16, 0.02]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        )}

        {/* Waist */}
        <mesh position={[0, legH - 0.05, 0]}>
          <boxGeometry args={[0.55 * W, 0.2, 0.35 * W]} />
          <meshLambertMaterial color={outfit} />
        </mesh>

        {/* Arms */}
        <group ref={rArm} position={[0.38 * S, legH + torsoH - 0.05, 0]}>
          <mesh position={[0, -armH / 2, 0]}>
            <boxGeometry args={[0.16 * L, armH, 0.16 * L]} />
            <meshLambertMaterial color={outfit} />
          </mesh>
          <mesh position={[0, -armH, 0]}>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
            <meshLambertMaterial color={skin} />
          </mesh>
        </group>
        <group ref={lArm} position={[-0.38 * S, legH + torsoH - 0.05, 0]}>
          <mesh position={[0, -armH / 2, 0]}>
            <boxGeometry args={[0.16 * L, armH, 0.16 * L]} />
            <meshLambertMaterial color={outfit} />
          </mesh>
          <mesh position={[0, -armH, 0]}>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
            <meshLambertMaterial color={skin} />
          </mesh>
        </group>

        {/* Legs */}
        <group ref={rLeg} position={[0.14, legH, 0]}>
          <mesh position={[0, -legH / 2, 0]}>
            <boxGeometry args={[0.22 * L, legH, 0.24 * L]} />
            <meshLambertMaterial color={"#1a1a2a"} />
          </mesh>
          <mesh position={[0, -legH, 0.05]}>
            <boxGeometry args={[0.24, 0.1, 0.35]} />
            <meshLambertMaterial color={"#0a0a0a"} />
          </mesh>
        </group>
        <group ref={lLeg} position={[-0.14, legH, 0]}>
          <mesh position={[0, -legH / 2, 0]}>
            <boxGeometry args={[0.22 * L, legH, 0.24 * L]} />
            <meshLambertMaterial color={"#1a1a2a"} />
          </mesh>
          <mesh position={[0, -legH, 0.05]}>
            <boxGeometry args={[0.24, 0.1, 0.35]} />
            <meshLambertMaterial color={"#0a0a0a"} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
