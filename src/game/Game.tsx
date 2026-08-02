// Game.tsx — top-level state machine.
// Menu → (Options/Credits) → Select P1 → Select P2 → Select Stage → Versus → Fight → Result.
import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import MainMenu from "./components/UI/MainMenu";
import OptionsMenu from "./components/UI/OptionsMenu";
import CharacterSelect from "./components/UI/CharacterSelect";
import StageSelect from "./components/UI/StageSelect";
import VersusScreen from "./components/UI/VersusScreen";
import ArcadeHUD from "./components/UI/ArcadeHUD";
import TouchControls from "./components/UI/TouchControls";
import ResultScreen from "./components/UI/ResultScreen";
import PauseMenu from "./components/UI/PauseMenu";
import MoveList from "./components/UI/MoveList";
import LandscapeGate from "./components/UI/LandscapeGate";
import ArenaStage from "./components/3D/ArenaStage";
import FighterGLB from "./components/3D/FighterGLB";
import SpecialFX from "./components/3D/SpecialFX";
import DamageNumbers from "./components/3D/DamageNumbers";
import BloodFX from "./components/3D/BloodFX";
import { createInputController } from "./utils/input";
import { makeFighter, stepFighter } from "./utils/combatEngine";
import { makeCpuState, cpuTick } from "./utils/cpuAiEngine";
import { Audio } from "./utils/audioEngine";
import { Settings } from "./utils/settings";
import { STAGES } from "./utils/stages";

type Screen = "menu" | "options" | "credits" | "selectP1" | "selectP2" | "selectStage" | "versus" | "fight";

export default function Game() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [config, setConfig] = useState<any>({ mode: "arcade" });
  const [p1Fighter, setP1Fighter] = useState<any>(null);
  const [p2Fighter, setP2Fighter] = useState<any>(null);
  const [stage, setStage] = useState<any>(STAGES[0]);
  const [rematchKey, setRematchKey] = useState(0);

  useEffect(() => {
    const unlock = () => Audio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const body = (() => {
    if (screen === "menu") return (
      <MainMenu
        onStart={() => { setConfig({ mode: "arcade" }); setScreen("selectP1"); }}
        onPractice={() => { setConfig({ mode: "training" }); setScreen("selectP1"); }}
        onCharacterSelect={() => { setConfig({ mode: "arcade" }); setScreen("selectP1"); }}
        onOptions={() => setScreen("options")}
        onCredits={() => setScreen("credits")} />
    );
    if (screen === "options") return <OptionsMenu onBack={() => setScreen("menu")} />;
    if (screen === "credits") return <Credits onBack={() => setScreen("menu")} />;
    if (screen === "selectP1") return (
      <CharacterSelect label="Player 1"
        onPick={(f: any) => { setP1Fighter(f); setScreen("selectP2"); }}
        onBack={() => setScreen("menu")} />
    );
    if (screen === "selectP2") return (
      <CharacterSelect label={config.mode === "training" ? "Dummy" : "CPU Opponent"}
        onPick={(f: any) => { setP2Fighter(f); setScreen("selectStage"); }}
        onBack={() => setScreen("selectP1")} />
    );
    if (screen === "selectStage") return (
      <StageSelect p1={p1Fighter} p2={p2Fighter}
        onPick={(s: any) => { setStage(s); setScreen("versus"); }}
        onBack={() => setScreen("selectP2")} />
    );
    if (screen === "versus") return (
      <VersusScreen p1={p1Fighter} p2={p2Fighter} stage={stage} onDone={() => setScreen("fight")} />
    );
    return (
      <FightScene key={rematchKey}
        config={config} p1Meta={p1Fighter} p2Meta={p2Fighter} stage={stage}
        onRematch={() => { setRematchKey((k) => k + 1); setScreen("fight"); }}
        onCharacterSelect={() => { Audio.bgmSelect(); setScreen("selectP1"); }}
        onMenu={() => { Audio.bgmSelect(); setScreen("menu"); }} />
    );
  })();

  return <LandscapeGate>{body}</LandscapeGate>;
}

function Credits({ onBack }: any) {
  return (
    <div className="h-[100dvh] w-full bg-[#07030f] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-lg border-2 border-[#ffb060]/50 bg-[#0d0620]/90 p-4 text-center">
        <div className="font-black tracking-widest text-[#ffe27a] text-xl mb-2">CREDITS</div>
        <div className="text-xs text-white/70 leading-relaxed space-y-2">
          <p>NETA-KEN : ABSOLUTE CINEMA</p>
          <p>Engine · React Three Fiber + Three.js · custom 60Hz combat core</p>
          <p>Audio · fully synthesized WebAudio arcade score &amp; impact SFX</p>
          <p>Characters &amp; arenas · stylized parody caricatures, satire only</p>
        </div>
        <button onClick={() => { Audio.uiBack(); onBack(); }}
          className="mt-4 w-full py-2 rounded border-2 border-white/30 font-black tracking-widest text-xs">BACK</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ FIGHT ---- */

function FightScene({ config, p1Meta, p2Meta, stage, onRematch, onCharacterSelect, onMenu }: any) {
  const inputRef = useRef<any>(null);
  const [uiTick, setUiTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [moveListOpen, setMoveListOpen] = useState(false);
  const [dummy, setDummy] = useState("guard");
  const practice = config.mode === "training";
  const dummyRef = useRef(dummy);
  dummyRef.current = dummy;
  const pausedRef = useRef(false);
  pausedRef.current = paused || !!result;

  const settings = Settings.get();
  const roundTime = settings.roundTime || 0;

  const stateRef = useRef<any>(null);
  if (!stateRef.current) {
    stateRef.current = {
      p1: makeFighter(p1Meta, "p1"),
      p2: makeFighter(p2Meta, "p2"),
      cpu: makeCpuState(settings.difficulty),
      timer: roundTime || 999,
      infiniteTime: roundTime === 0,
      round: 1,
      wins: { p1: 0, p2: 0 },
      winsNeeded: practice ? 99 : Settings.winsNeeded(),
      combo: { side: null as any, count: 0 },
      fx: [] as any[],
      dmg: [] as any[],
      blood: [] as any[],
      bloodId: 0,
      dmgId: 0,
      fxId: 0,
      phase: "ready" as "ready" | "fight" | "roundEnd" | "victory",
      phaseT: 0,
      slowMoT: 0,
      shake: 0,
      winnerSide: null as any,
      practice,
      speed: { current: 1 },
    };
  }
  const s = stateRef.current;

  useEffect(() => {
    inputRef.current = createInputController();
    Audio.unlock();
    Audio.bgmFight(1);
    Audio.crowdStart();
    Audio.roundBell();
    Audio.say("Ready");
    const t = setTimeout(() => Audio.say("Fight"), 1500);
    return () => { clearTimeout(t); inputRef.current?.dispose(); Audio.bgmStop(); Audio.crowdStop(); };
  }, []);

  // Freeze inputs while paused / after KO.
  useEffect(() => { inputRef.current?.setEnabled(!(paused || !!result)); }, [paused, result]);

  const onMatchEnd = useCallback((winnerMeta: any) => {
    Audio.bgmVictory();
    Audio.winFanfare();
    const voice = setTimeout(() => Audio.say(config.mode === "training" ? "Winner" : "You Win"), 400);
    const show = setTimeout(() => setResult({ winner: winnerMeta }), 2500);
    return () => { clearTimeout(voice); clearTimeout(show); };
  }, [config.mode]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const STEP = 1000 / 60;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dtMs = Math.min(now - last, 100);
      last = now;
      if (pausedRef.current) { s.speed.current = 0; return; }
      const scale = s.slowMoT > 0 ? 0.3 : 1;
      s.speed.current = scale;
      acc += dtMs * scale;
      let steps = 0;
      while (acc >= STEP && steps < 5) {
        acc -= STEP;
        steps++;
        tickGame(s, inputRef.current, config, dummyRef.current, onMatchEnd);
      }
      setUiTick((n) => (n + 1) % 100000);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [config, onMatchEnd, s]);

  const world = useMemo(() => (
    <FightWorld sRef={stateRef} p1Meta={p1Meta} p2Meta={p2Meta} stage={stage} />
  ), [p1Meta, p2Meta, stage]);

  const resetPositions = () => {
    Object.assign(s.p1, makeFighter(p1Meta, "p1"));
    Object.assign(s.p2, makeFighter(p2Meta, "p2"));
    s.phase = "fight"; s.phaseT = 0; s.slowMoT = 0;
    setPaused(false);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden select-none">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 2.4, 7.5], fov: 45 }}
        gl={{ antialias: false, powerPreference: "high-performance", toneMappingExposure: 1.25 }}>
        {world}
      </Canvas>

      <ArcadeHUD p1={s.p1} p2={s.p2} timer={s.timer} infiniteTime={s.infiniteTime}
        round={s.round} wins={s.wins} combo={s.combo} winsNeeded={practice ? 2 : s.winsNeeded} />

      {!result && (
        <button onClick={() => { Audio.uiClick(); setPaused(true); }}
          className="absolute top-2 right-2 z-30 w-11 h-11 rounded-full border-2 border-white/50 bg-black/50 backdrop-blur text-white text-lg font-black flex items-center justify-center active:scale-95">
          ⏸
        </button>
      )}

      {!result && <TouchControls input={inputRef.current || { touchDown() {}, touchUp() {}, setStickVector() {} }} />}

      {practice && !result && (
        <MoveList open={moveListOpen} onToggle={setMoveListOpen}
          activeInputs={inputRef.current?.active?.() || []} />
      )}

      {s.phase === "ready" && !result && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-5xl sm:text-8xl font-black tracking-widest text-[#ffe27a]"
               style={{ textShadow: "4px 4px 0 #a1105a" }}>
            {s.phaseT < 60 ? "READY..." : "FIGHT!"}
          </div>
        </div>
      )}

      {paused && !result && (
        <PauseMenu practice={practice} dummy={dummy} onDummy={setDummy}
          onResume={() => setPaused(false)}
          onRestart={() => { resetPositions(); s.wins = { p1: 0, p2: 0 }; s.round = 1; s.timer = roundTime || 999; s.phase = "ready"; s.phaseT = 0; }}
          onResetPositions={resetPositions}
          onCommandList={() => { setMoveListOpen(true); setPaused(false); }}
          onCharacterSelect={onCharacterSelect}
          onMenu={onMenu} />
      )}

      {result && (
        <ResultScreen winner={result.winner}
          onRematch={onRematch}
          onCharacterSelect={onCharacterSelect}
          onMenu={onMenu} />
      )}
    </div>
  );
}

// Memoized 3D subtree — driven entirely by refs so HUD re-renders never touch it.
const FightWorld = memo(function FightWorld({ sRef, p1Meta, p2Meta, stage }: any) {
  const s = sRef.current;
  return (
    <>
      <FightCamera sRef={sRef} />
      <Suspense fallback={null}>
        <ArenaStage stage={stage} />
        <FighterRig f={s.p1} meta={p1Meta} speedRef={s.speed} />
        <FighterRig f={s.p2} meta={p2Meta} speedRef={s.speed} />
      </Suspense>
      <FxLayer sRef={sRef} />
    </>
  );
});

// Positions/rotations applied in useFrame (no React state in the frame loop).
function FighterRig({ f, meta, speedRef }: any) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, deltaRaw) => {
    const dt = Math.min(deltaRaw, 0.033);
    if (!g.current) return;
    g.current.position.set(f.x, f.y, f.z);
    // Smooth auto-facing toward the opponent on the Y axis.
    const target = f.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    let d = target - g.current.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    g.current.rotation.y += d * Math.min(1, dt * 14);
  });
  return (
    <group ref={g}>
      <FighterGLB fighter={meta} state={f} speedRef={speedRef} />
    </group>
  );
}

function FxLayer({ sRef }: any) {
  const [, force] = useState(0);
  useFrame(() => {
    const s = sRef.current;
    if (s.__fxDirty) { s.__fxDirty = false; force((n) => n + 1); }
  });
  const s = sRef.current;
  return (
    <>
      {s.fx.map((fx: any) => (
        <SpecialFX key={fx.id} fx={fx.fx} from={fx.from} toward={fx.toward}
          onDone={() => { s.fx = s.fx.filter((x: any) => x.id !== fx.id); s.__fxDirty = true; }} />
      ))}
      {s.blood.map((b: any) => (
        <BloodFX key={b.id} x={b.x} y={b.y} z={b.z} dir={b.dir} heavy={b.heavy}
          onDone={() => { s.blood = s.blood.filter((x: any) => x.id !== b.id); s.__fxDirty = true; }} />
      ))}
      <DamageNumbers items={s.dmg} />
    </>
  );
}

// Dynamic 2.5D camera: tracks midpoint, shakes on impact, orbits the winner on KO.
function FightCamera({ sRef }: any) {
  const { camera } = useThree();
  const base = useMemo(() => new THREE.Vector3(0, 2.4, 7.5), []);
  const look = useRef(new THREE.Vector3(0, 1.2, 0));
  const orbit = useRef(0);
  useFrame((_, deltaRaw) => {
    const s = sRef.current;
    const dt = Math.min(deltaRaw, 0.033);
    const shake = s.shake || 0;

    if (s.phase === "victory" && s.winnerSide) {
      // Cinematic orbit + close zoom on the winner.
      const w = s.winnerSide === "p1" ? s.p1 : s.p2;
      orbit.current += dt * 0.5;
      const r = 3.1;
      const tx = w.x + Math.sin(orbit.current) * r;
      const tz = w.z + Math.cos(orbit.current) * r + 0.6;
      camera.position.lerp(new THREE.Vector3(tx, 1.9, tz), Math.min(1, dt * 2.2));
      look.current.lerp(new THREE.Vector3(w.x, 1.15, w.z), Math.min(1, dt * 3));
      camera.lookAt(look.current);
      return;
    }

    orbit.current = 0;
    const midX = (s.p1.x + s.p2.x) / 2;
    const midZ = (s.p1.z + s.p2.z) / 2;
    const gap = Math.hypot(s.p1.x - s.p2.x, s.p1.z - s.p2.z);
    const zoom = Math.min(10, 6 + gap * 0.42);
    const want = new THREE.Vector3(
      base.x + midX * 0.55 + (Math.random() - 0.5) * shake,
      base.y + (Math.random() - 0.5) * shake,
      zoom + midZ * 0.3,
    );
    camera.position.lerp(want, Math.min(1, dt * 9));
    look.current.lerp(new THREE.Vector3(midX, 1.2, midZ * 0.4), Math.min(1, dt * 9));
    camera.lookAt(look.current);
    if (s.shake > 0) s.shake *= 0.85;
    if (s.shake < 0.01) s.shake = 0;
  });
  return null;
}

/* ------------------------------------------------------------------- TICK ---- */

const DUMMY_INPUT = {
  left: false, right: false, up: false, down: false, block: false,
  LP: false, HP: false, LK: false, HK: false, SP: false,
  jump: false, tapLeft: false, tapRight: false, sideU: false, sideD: false,
};

function tickGame(s: any, input: any, config: any, dummy: string, onMatchEnd: (w: any) => void) {
  if (!input) return;

  if (s.phase === "ready") {
    s.phaseT += 1;
    if (s.phaseT > 120) { s.phase = "fight"; s.phaseT = 0; }
    return;
  }
  if (s.phase === "victory") {
    if (s.slowMoT > 0) s.slowMoT -= 1;
    return;
  }
  if (s.phase === "roundEnd") {
    s.phaseT += 1;
    if (s.slowMoT > 0) s.slowMoT -= 1;
    if (s.phaseT > 130) {
      const matchOver = s.wins.p1 >= s.winsNeeded || s.wins.p2 >= s.winsNeeded;
      if (matchOver) {
        s.winnerSide = s.wins.p1 > s.wins.p2 ? "p1" : "p2";
        const w = s.winnerSide === "p1" ? s.p1 : s.p2;
        w.state = "victory";
        w.animKey++;
        s.phase = "victory";
        s.slowMoT = 0;
        onMatchEnd(w.meta);
      } else {
        s.round += 1;
        Object.assign(s.p1, makeFighter(s.p1.meta, "p1"));
        Object.assign(s.p2, makeFighter(s.p2.meta, "p2"));
        s.timer = s.infiniteTime ? 999 : Settings.get().roundTime;
        s.phase = "ready";
        s.phaseT = 0;
        Audio.bgmFight(s.round);
        Audio.roundBell();
        Audio.say("Round " + s.round);
      }
    }
    return;
  }
  if (s.phase !== "fight") return;

  if (!s.infiniteTime) s.timer -= 1 / 60;

  const p1Input = input.snapshot();
  let p2Input: any = DUMMY_INPUT;
  if (s.practice) {
    if (dummy === "cpu") p2Input = cpuTick(s.cpu, s.p2, s.p1);
    else if (dummy === "guard") p2Input = { ...DUMMY_INPUT, block: true };
    else if (dummy === "crouch") p2Input = { ...DUMMY_INPUT, down: true };
    else p2Input = DUMMY_INPUT;
  } else {
    p2Input = cpuTick(s.cpu, s.p2, s.p1);
  }

  const events: any[] = [];
  stepFighter(s.p1, p1Input, s.p2, 1, events);
  stepFighter(s.p2, p2Input, s.p1, 1, events);

  if (s.practice) { s.p1.hp = s.p1.maxHp; s.p2.hp = s.p2.maxHp; }

  for (const ev of events) {
    if (ev.type === "hit") {
      s.dmg.push({ id: ++s.dmgId, x: ev.at.x, y: ev.at.y, dmg: ev.dmg, blocked: ev.blocked });
      s.__fxDirty = true;
      s.combo = { side: ev.side === "p1" ? "p2" : "p1", count: ev.combo };
      s.shake = ev.blocked ? 0.05 : ev.special ? 0.36 : ev.heavy ? 0.22 : 0.13;
      if (!ev.blocked) {
        const attacker = ev.side === "p1" ? s.p2 : s.p1;
        s.blood.push({
          id: ++s.bloodId,
          x: ev.at.x, y: ev.at.y, z: ev.at.z || 0,
          dir: attacker.facing || 1, heavy: !!(ev.heavy || ev.special),
        });
        if (s.blood.length > 10) s.blood.splice(0, s.blood.length - 10);
      }
      if (ev.blocked) Audio.block();
      else if (ev.special) Audio.hitSpecial();
      else if (ev.heavy) Audio.hitHeavy();
      else Audio.hitLight();
      if (!ev.blocked) { Audio.hurt(ev.heavy); Audio.bloodSplat(ev.heavy); }
      if (!ev.blocked && ev.combo && ev.combo % 5 === 0) Audio.comboMilestone(ev.combo);
      if (s.dmg.length > 16) s.dmg.splice(0, s.dmg.length - 16);
    } else if (ev.type === "step") {
      Audio.footstep(ev.heavy);
    } else if (ev.type === "swing") {
      Audio.whiff(ev.heavy);
    } else if (ev.type === "kiai") {
      Audio.kiai(ev.heavy);
    } else if (ev.type === "jump") {
      Audio.jump();
    } else if (ev.type === "special") {
      const who = ev.side === "p1" ? s.p1 : s.p2;
      const opp = ev.side === "p1" ? s.p2 : s.p1;
      s.fx.push({ id: ++s.fxId, fx: ev.fx, from: { x: who.x, y: who.y }, toward: opp.x });
      s.__fxDirty = true;
      s.shake = 0.3;
      Audio.special();
    } else if (ev.type === "ko") {
      s.shake = 0.5;
      s.slowMoT = 90; // 1.5s of 0.3x bullet-time
      Audio.ko();
      Audio.say("K.O.");
      if (ev.side === "p1") s.wins.p2 += 1; else s.wins.p1 += 1;
      s.phase = "roundEnd";
      s.phaseT = 0;
    }
  }

  if (!s.infiniteTime && s.timer <= 0 && s.phase === "fight") {
    if (s.p1.hp > s.p2.hp) s.wins.p1 += 1;
    else if (s.p2.hp > s.p1.hp) s.wins.p2 += 1;
    s.phase = "roundEnd";
    s.phaseT = 0;
    Audio.say("Time up");
  }
}
