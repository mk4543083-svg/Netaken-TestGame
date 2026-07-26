// FighterGLB.jsx — loads a fighter's GLB, clones its skeleton for P1/P2 safety,
// binds THREE.AnimationMixer, and crossfades clips based on combat state.
// One-shot clips (attacks / hits / KO / victory) are time-scaled to the exact
// move duration so the whole animation always plays out. Procedural fallbacks
// cover GLBs that lack HitReact / Knockdown / Victory clips.
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import { MOVES } from "../../utils/combatEngine";

const CROSSFADE = 0.09;

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
  if (s === "victory") return "Victory";
  if (s === "hitstun") return "HitReact";
  if (s === "block") return "Block";
  if (s === "crouchBlock") return "CrouchBlock";
  if (s === "crouch") return "Crouch";
  if (s === "jump") return "Jump";
  if (s === "sidestep") return "Sidestep";
  if (s === "dash") return "Run";
  if (s === "backdash" || s === "walkBack") return "WalkBack";
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

// Fallback order per logical clip: try progressively more generic siblings.
const FALLBACK_ORDER = {
  Idle: ["Idle"],
  Walk: ["Walk", "Run", "Idle"],
  WalkBack: ["WalkBack", "Walk", "Idle"],
  Run: ["Run", "Walk", "Idle"],
  Sidestep: ["Sidestep", "Walk", "Idle"],
  Jump: ["Jump", "Idle"],
  Crouch: ["Crouch", "Block", "Idle"],
  CrouchBlock: ["CrouchBlock", "Crouch", "Block", "Idle"],
  Jab: ["Jab", "Cross", "Idle"],
  Cross: ["Cross", "Jab", "Idle"],
  LowKick: ["LowKick", "HighKick", "Idle"],
  HighKick: ["HighKick", "LowKick", "Idle"],
  Special1: ["Special1", "Special2", "Cross", "Idle"],
  Special2: ["Special2", "Special1", "HighKick", "Idle"],
  Block: ["Block", "Idle"],
  HitReact: ["HitReact"],   // procedural if missing
  Knockdown: ["Knockdown"], // procedural if missing
  Victory: ["Victory"],     // procedural if missing
};

const LOOPING = ["Idle", "Walk", "WalkBack", "Run", "Block", "CrouchBlock", "Crouch", "Sidestep"];

// Logical clip -> duration in seconds we want it to occupy (null = natural).
function targetDuration(key, state) {
  if (key === "Jab" || key === "Cross" || key === "LowKick" || key === "HighKick" || key === "Special1") {
    const move = state?.attack?.move;
    const m = MOVES[move];
    if (m) return (m.startup + m.active + m.recovery) / 60;
  }
  if (key === "HitReact") return Math.max(0.2, (state?.stunT || 12) / 60);
  if (key === "Knockdown") return 1.4;
  return null;
}

export default function FighterGLB({ fighter, state, animScale = 1 }) {
  const gltf = useGLTF(fighter.glbUrl);
  const scene = useMemo(() => skeletonClone(gltf.scene), [gltf.scene]);
  const rootRef = useRef();

  useEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
        if (o.material) o.material.side = THREE.FrontSide;
      }
    });
  }, [scene]);

  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);

  const actions = useMemo(() => {
    const anims = gltf.animations || [];
    const hints = fighter.clipHints || {};
    const out = {};
    for (const key of Object.keys(FALLBACK_ORDER)) {
      let clip = null;
      let resolvedAs = null;
      for (const step of FALLBACK_ORDER[key]) {
        clip = pickClip(anims, hints[step] || [step.toLowerCase()]);
        if (clip) { resolvedAs = step; break; }
      }
      if (clip) {
        const action = mixer.clipAction(clip);
        if (LOOPING.includes(key)) {
          action.setLoop(THREE.LoopRepeat, Infinity);
        } else {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        }
        action.__natural = clip.duration;
        // A back-walk resolved from a forward Walk clip is played in reverse.
        action.__reverse = key === "WalkBack" && resolvedAs !== "WalkBack";
        out[key] = action;
      }
    }
    return out;
  }, [gltf.animations, mixer, fighter.clipHints]);

  const currentRef = useRef("");
  const keyRef = useRef(-1);
  const koProgress = useRef(0);
  const victoryT = useRef(0);
  const hitOffset = useRef({ x: 0, tilt: 0, t: 0 });

  useEffect(() => {
    const first = actions.Idle;
    if (first) first.reset().fadeIn(0).play();
    currentRef.current = first ? "Idle" : "";
    return () => { mixer.stopAllAction(); };
  }, [actions, mixer]);

  const playSafe = (target, restart) => {
    const next = actions[target];
    const prev = actions[currentRef.current];
    if (!next) return false;
    if (next === prev && !restart) return true;
    if (next === prev && restart) {
      next.reset().play();
      return true;
    }
    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.fadeIn(CROSSFADE).play();
    if (prev) prev.fadeOut(CROSSFADE);
    currentRef.current = target;
    return true;
  };

  useFrame((_, deltaRaw) => {
    const dt = Math.min(deltaRaw, 0.033) * animScale;
    mixer.update(dt);

    const desired = stateToClip(state);
    const animKey = state?.animKey ?? 0;
    const restart = animKey !== keyRef.current;

    // ---- KO ----
    if (state?.state === "ko") {
      if (!actions.Knockdown) {
        koProgress.current = Math.min(1, koProgress.current + dt / 0.35);
        if (rootRef.current) {
          rootRef.current.rotation.x = (-Math.PI / 2) * koProgress.current;
          rootRef.current.position.y = -0.55 * koProgress.current;
        }
        mixer.stopAllAction();
        currentRef.current = "";
        return;
      }
      if (desired !== currentRef.current || restart) {
        playSafe("Knockdown", restart);
        keyRef.current = animKey;
      }
      return;
    }
    if (koProgress.current !== 0) {
      koProgress.current = 0;
      if (rootRef.current) { rootRef.current.rotation.x = 0; rootRef.current.position.y = 0; }
    }

    // ---- Victory ----
    if (state?.state === "victory" && !actions.Victory) {
      victoryT.current += dt;
      if (rootRef.current) {
        rootRef.current.position.y = Math.abs(Math.sin(victoryT.current * 4)) * 0.14;
        rootRef.current.rotation.y = Math.sin(victoryT.current * 2) * 0.25;
      }
      if (currentRef.current !== "Idle") playSafe("Idle", true);
      return;
    }
    if (victoryT.current !== 0 && state?.state !== "victory") {
      victoryT.current = 0;
      if (rootRef.current) { rootRef.current.position.y = 0; rootRef.current.rotation.y = 0; }
    }

    // ---- Procedural HitReact ----
    if (state?.state === "hitstun" && !actions.HitReact) {
      if (restart) hitOffset.current = { x: -(state.facing || 1) * 0.3, tilt: 0.16, t: 0.14 };
    }
    if (hitOffset.current.t > 0) {
      hitOffset.current.t -= dt;
      const k = Math.max(0, hitOffset.current.t / 0.14);
      if (rootRef.current) {
        rootRef.current.position.x = hitOffset.current.x * k;
        rootRef.current.rotation.z = hitOffset.current.tilt * k;
      }
    } else if (rootRef.current && (rootRef.current.position.x !== 0 || rootRef.current.rotation.z !== 0)) {
      rootRef.current.position.x = 0;
      rootRef.current.rotation.z = 0;
    }

    if (desired !== currentRef.current || restart) {
      const played = playSafe(desired, restart);
      if (played) {
        const a = actions[desired];
        const want = targetDuration(desired, state);
        if (a) {
          if (want && a.__natural > 0) a.setDuration(want);
          else if (a.__natural > 0) a.setDuration(a.__natural);
          a.setEffectiveTimeScale(a.__reverse ? -1 : 1);
          if (a.__reverse) a.time = a.getClip().duration - 0.001;
        }
      }
      keyRef.current = animKey;
    }
  });

  return (
    <group ref={rootRef}>
      <primitive object={scene} scale={fighter.scale || 1} position={[0, fighter.yOffset || 0, 0]} />
    </group>
  );
}

export function preloadFighter(url) { useGLTF.preload(url); }
