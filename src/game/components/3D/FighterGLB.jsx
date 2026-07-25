// FighterGLB.jsx — loads a fighter's GLB, clones its skeleton for P1/P2 safety,
// binds THREE.AnimationMixer, and crossfades clips based on combat state.
// Includes safe fallbacks: procedural hit-react and knockdown when GLB lacks clips.
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

const CROSSFADE = 0.08;

// Case-insensitive substring match against the GLB's real clip names.
// Returns null if none of the hints match (caller decides what to do).
function pickClip(animations, hints) {
  if (!animations || !animations.length) return null;
  for (const h of hints) {
    const found = animations.find((a) => a.name.toLowerCase().includes(h));
    if (found) return found;
  }
  return null;
}

function stateToClip(state) {
  const s = state?.state || "idle";
  if (s === "ko") return "Knockdown";
  if (s === "hitstun") return "HitReact";
  if (s === "block") return "Block";
  if (s === "walk" || s === "dash" || s === "backdash") return "Walk";
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

// Fallback order per logical clip: if the exact one is missing, try progressively
// more generic siblings before giving up (returning null => procedural fallback).
const FALLBACK_ORDER = {
  Idle: ["Idle"],
  Walk: ["Walk", "Idle"],
  Jab: ["Jab", "Cross", "Idle"],
  Cross: ["Cross", "Jab", "Idle"],
  LowKick: ["LowKick", "HighKick", "Idle"],
  HighKick: ["HighKick", "LowKick", "Idle"],
  Special1: ["Special1", "Special2", "Cross", "Idle"],
  Special2: ["Special2", "Special1", "HighKick", "Idle"],
  Block: ["Block", "Idle"],
  HitReact: ["HitReact"],   // no idle fallback — we use procedural if missing
  Knockdown: ["Knockdown"], // no idle fallback — we use procedural if missing
};

export default function FighterGLB({ fighter, state }) {
  const gltf = useGLTF(fighter.glbUrl);
  const scene = useMemo(() => skeletonClone(gltf.scene), [gltf.scene]);
  const rootRef = useRef();

  useEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material) o.material.side = THREE.FrontSide;
      }
    });
  }, [scene]);

  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);

  // Resolve each logical clip against the GLB's real animations.
  const actions = useMemo(() => {
    const anims = gltf.animations || [];
    const hints = fighter.clipHints || {};
    const out = {};
    const logical = Object.keys(FALLBACK_ORDER);
    for (const key of logical) {
      let clip = null;
      for (const step of FALLBACK_ORDER[key]) {
        clip = pickClip(anims, hints[step] || [step.toLowerCase()]);
        if (clip) break;
      }
      if (clip) {
        const action = mixer.clipAction(clip);
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
  const koProgress = useRef(0);
  const hitOffset = useRef({ x: 0, tilt: 0, t: 0 });

  useEffect(() => {
    const first = actions["Idle"];
    if (first) first.reset().fadeIn(0).play();
    return () => { mixer.stopAllAction(); };
  }, [actions, mixer]);

  // Safe animation player — crossfade with 0.08s blend.
  const playSafe = (target) => {
    const next = actions[target];
    const prev = actions[currentRef.current];
    if (next && next !== prev) {
      next.reset();
      next.enabled = true;
      next.setEffectiveTimeScale(1);
      next.setEffectiveWeight(1);
      next.fadeIn(CROSSFADE).play();
      if (prev) prev.fadeOut(CROSSFADE);
      currentRef.current = target;
      return true;
    }
    return !!next;
  };

  useFrame((_, deltaRaw) => {
    const dt = Math.min(deltaRaw, 0.033); // clamp to 30fps min tick
    mixer.update(dt);

    const desired = stateToClip(state);

    // ---- Procedural KO fallback ----
    if (state?.state === "ko") {
      if (!actions["Knockdown"]) {
        // Rotate 90deg back on X over ~0.35s, drop to floor.
        koProgress.current = Math.min(1, koProgress.current + dt / 0.35);
        if (rootRef.current) {
          rootRef.current.rotation.x = -Math.PI / 2 * koProgress.current;
          rootRef.current.position.y = -0.6 * koProgress.current;
        }
        mixer.stopAllAction();
        return;
      } else {
        if (desired !== currentRef.current) playSafe("Knockdown");
        return;
      }
    } else {
      // reset ko-transform if we left ko state (rematch)
      if (koProgress.current !== 0) {
        koProgress.current = 0;
        if (rootRef.current) {
          rootRef.current.rotation.x = 0;
          rootRef.current.position.y = 0;
        }
      }
    }

    // ---- Procedural HitReact fallback ----
    if (state?.state === "hitstun" && !actions["HitReact"]) {
      // Trigger a fresh procedural nudge each time hitstun starts.
      if (hitOffset.current.t <= 0) {
        hitOffset.current = { x: -(state.facing || 1) * 0.3, tilt: 0.15, t: 0.1 };
      }
    }
    if (hitOffset.current.t > 0) {
      hitOffset.current.t -= dt;
      const k = Math.max(0, hitOffset.current.t / 0.1);
      if (rootRef.current) {
        rootRef.current.position.x = hitOffset.current.x * k;
        rootRef.current.rotation.z = hitOffset.current.tilt * k;
      }
    } else if (rootRef.current) {
      rootRef.current.position.x = 0;
      rootRef.current.rotation.z = 0;
    }

    if (desired !== currentRef.current) playSafe(desired);
  });

  return (
    <group ref={rootRef}>
      <primitive object={scene} scale={fighter.scale || 1} position={[0, fighter.yOffset || 0, 0]} />
    </group>
  );
}

export function preloadFighter(url) { useGLTF.preload(url); }
