// FighterGLB.jsx — loads a fighter's GLB, clones its skeleton for P1/P2 safety,
// binds THREE.AnimationMixer, and crossfades clips based on combat state.
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

// Case-insensitive substring match against the GLB's real clip names.
function pickClip(animations, hints, fallback) {
  for (const h of hints) {
    const found = animations.find((a) => a.name.toLowerCase().includes(h));
    if (found) return found;
  }
  return fallback || animations[0] || null;
}

// Map combat state -> logical clip name.
function stateToClip(state) {
  const s = state?.state || "idle";
  if (s === "ko") return "Knockdown";
  if (s === "hitstun") return "HitReact";
  if (s === "block") return "Block";
  if (s === "walk") return "Walk";
  if (s === "special") return "Special1";
  if (s === "attack") {
    const m = state?.attack?.move;
    if (m === "LP") return "Jab";
    if (m === "HP") return "Cross";
    if (m === "LK") return "LowKick";
    if (m === "HK") return "HighKick";
    if (m === "SP") return "Special1";
  }
  return "Idle";
}

export default function FighterGLB({ fighter, state }) {
  const gltf = useGLTF(fighter.glbUrl);
  // Deep-clone the scene + skeleton so P1 and P2 can render the same GLB independently.
  const scene = useMemo(() => skeletonClone(gltf.scene), [gltf.scene]);

  // Cast/receive shadows on all skinned meshes.
  useEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
  }, [scene]);

  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const actions = useMemo(() => {
    const hints = fighter.clipHints || {};
    const out = {};
    const anims = gltf.animations || [];
    if (!anims.length) return out;
    const idleClip = pickClip(anims, hints.Idle || ["idle"], anims[0]);
    const logical = ["Idle", "Walk", "Jab", "Cross", "LowKick", "HighKick",
                     "Special1", "Special2", "HitReact", "Knockdown", "Block"];
    for (const key of logical) {
      const clip = pickClip(anims, hints[key] || [key.toLowerCase()], idleClip);
      if (clip) {
        const action = mixer.clipAction(clip);
        // One-shot for attacks/reactions; loop for idle/walk/block.
        if (["Walk", "Idle", "Block"].includes(key)) {
          action.setLoop(THREE.LoopRepeat, Infinity);
        } else {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        }
        out[key] = action;
      }
    }
    return out;
  }, [gltf.animations, mixer, fighter.clipHints]);

  const currentRef = useRef("Idle");
  useEffect(() => {
    const first = actions["Idle"];
    if (first) first.reset().fadeIn(0).play();
  }, [actions]);

  useFrame((_, dt) => {
    mixer.update(dt);
    const desired = stateToClip(state);
    if (desired !== currentRef.current) {
      const prev = actions[currentRef.current];
      const next = actions[desired];
      if (next) {
        next.reset();
        next.enabled = true;
        next.setEffectiveTimeScale(1);
        next.setEffectiveWeight(1);
        next.fadeIn(0.1).play();
      }
      if (prev && prev !== next) prev.fadeOut(0.1);
      currentRef.current = desired;
    }
  });

  return <primitive object={scene} scale={fighter.scale || 1} position={[0, fighter.yOffset || 0, 0]} />;
}

// Preload helper — called during character-select so combat starts instantly.
export function preloadFighter(url) { useGLTF.preload(url); }
