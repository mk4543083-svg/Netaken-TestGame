// Game.tsx — top-level state machine. Menu → Select P1 → Select CPU → Fight → Result.
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import GameModeSelect from "./components/UI/GameModeSelect";
import CharacterSelect from "./components/UI/CharacterSelect";
import ArcadeHUD from "./components/UI/ArcadeHUD";
import TouchControls from "./components/UI/TouchControls";
import ResultScreen from "./components/UI/ResultScreen";
import Stage from "./components/3D/Stage";
import FighterMesh from "./components/3D/FighterMesh";
import SpecialFX from "./components/3D/SpecialFX";
import DamageNumbers from "./components/3D/DamageNumbers";
import { createInputController } from "./utils/input";
import { makeFighter, stepFighter, ROUND_TIME } from "./utils/combatEngine";
import { makeCpuState, cpuTick } from "./utils/cpuAiEngine";
import { Audio } from "./utils/audioEngine";

type Screen = "menu" | "selectP1" | "selectP2" | "fight" | "result";

export default function Game() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [config, setConfig] = useState<any>({ mode: "arcade", difficulty: "medium" });
  const [p1Fighter, setP1Fighter] = useState<any>(null);
  const [p2Fighter, setP2Fighter] = useState<any>(null);
  const [rematchKey, setRematchKey] = useState(0);
  const [winnerMeta, setWinnerMeta] = useState<any>(null);

  if (screen === "menu") return (
    <GameModeSelect onStart={(cfg: any) => { setConfig(cfg); setScreen("selectP1"); }} />
  );
  if (screen === "selectP1") return (
    <CharacterSelect label="Player 1"
      onPick={(f: any) => { setP1Fighter(f); setScreen("selectP2"); }}
      onBack={() => setScreen("menu")} />
  );
  if (screen === "selectP2") return (
    <CharacterSelect label={config.mode === "training" ? "Dummy" : "CPU Opponent"}
      onPick={(f: any) => { setP2Fighter(f); setScreen("fight"); }}
      onBack={() => setScreen("selectP1")} />
  );
  if (screen === "fight") return (
    <FightScene key={rematchKey}
      config={config} p1Meta={p1Fighter} p2Meta={p2Fighter}
      onEnd={(winner: any) => { setWinnerMeta(winner); setScreen("result"); }} />
  );
  return (
    <ResultScreen winner={winnerMeta}
      onRematch={() => { setRematchKey((k) => k + 1); setScreen("fight"); }}
      onMenu={() => setScreen("menu")} />
  );
}

function FightScene({ config, p1Meta, p2Meta, onEnd }: any) {
  const inputRef = useRef<any>(null);
  const [uiTick, setUiTick] = useState(0);
  const stateRef = useRef<any>({
    p1: makeFighter(p1Meta, "p1"),
    p2: makeFighter(p2Meta, "p2"),
    cpu: makeCpuState(config.difficulty),
    p2Cpu: makeCpuState(config.difficulty),
    timer: ROUND_TIME,
    round: 1,
    wins: { p1: 0, p2: 0 },
    combo: { side: null as any, count: 0 },
    fx: [] as any[],
    dmg: [] as any[],
    dmgId: 0,
    fxId: 0,
    phase: "ready" as "ready" | "fight" | "roundEnd" | "matchEnd",
    phaseT: 0,
    slowMoT: 0,
  });

  // input controller
  useEffect(() => {
    inputRef.current = createInputController();
    Audio.say("Ready");
    setTimeout(() => Audio.say("Fight"), 1400);
    return () => inputRef.current?.dispose();
  }, []);

  // Fixed step game loop (~60Hz)
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const STEP = 1000 / 60;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = now - last; last = now;
      const scale = stateRef.current.slowMoT > 0 ? 0.25 : 1;
      acc += dt * scale;
      while (acc >= STEP) {
        acc -= STEP;
        tickGame(stateRef.current, inputRef.current, config, onEnd);
      }
      setUiTick((n) => (n + 1) % 100000);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [config, onEnd]);

  const s = stateRef.current;

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden select-none">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 2.4, 7.5], fov: 45 }}>
        <SceneShake state={s} />
        <Stage />
        <group position={[s.p1.x, s.p1.y, 0]} rotation={[0, s.p1.facing > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <FighterMesh fighter={p1Meta} state={s.p1} />
        </group>
        <group position={[s.p2.x, s.p2.y, 0]} rotation={[0, s.p2.facing > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <FighterMesh fighter={p2Meta} state={s.p2} />
        </group>
        {s.fx.map((fx: any) => (
          <SpecialFX key={fx.id} fx={fx.fx} from={fx.from} toward={fx.toward}
            onDone={() => { s.fx = s.fx.filter((x: any) => x.id !== fx.id); }} />
        ))}
        <DamageNumbers items={s.dmg} />
      </Canvas>

      <ArcadeHUD p1={s.p1} p2={s.p2} timer={s.timer} round={s.round} wins={s.wins} combo={s.combo} />
      <TouchControls input={inputRef.current || { touchDown() {}, touchUp() {} }} />

      {s.phase === "ready" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-6xl md:text-9xl font-black tracking-widest text-[#ffe27a]"
               style={{ textShadow: "4px 4px 0 #a1105a" }}>
            {s.phaseT < 60 ? "READY..." : "FIGHT!"}
          </div>
        </div>
      )}
    </div>
  );
}

// Camera shake driven by state.shake
function SceneShake({ state }: any) {
  const { camera } = useThree();
  const base = useMemo(() => camera.position.clone(), [camera]);
  useFrame(() => {
    const s = state.shake || 0;
    camera.position.set(base.x + (Math.random() - 0.5) * s, base.y + (Math.random() - 0.5) * s, base.z);
    if (state.shake > 0) state.shake *= 0.85;
    if (state.shake < 0.01) state.shake = 0;
    // aim between fighters
    const midX = (state.p1.x + state.p2.x) / 2;
    camera.lookAt(midX, 1.2, 0);
  });
  return null;
}

function tickGame(s: any, input: any, config: any, onEnd: (w: any) => void) {
  if (!input) return;

  // Phase transitions
  if (s.phase === "ready") {
    s.phaseT += 1;
    if (s.phaseT > 120) { s.phase = "fight"; s.phaseT = 0; }
    return;
  }
  if (s.phase === "roundEnd") {
    s.phaseT += 1;
    if (s.slowMoT > 0) s.slowMoT -= 1;
    if (s.phaseT > 120) {
      // decide match end or next round
      if (s.wins.p1 >= 2 || s.wins.p2 >= 2 || s.round >= 3) {
        const winnerMeta = s.wins.p1 > s.wins.p2 ? s.p1.meta : s.wins.p2 > s.wins.p1 ? s.p2.meta : null;
        onEnd(winnerMeta);
        s.phase = "matchEnd";
      } else {
        s.round += 1;
        s.p1 = makeFighter(s.p1.meta, "p1");
        s.p2 = makeFighter(s.p2.meta, "p2");
        s.timer = ROUND_TIME;
        s.phase = "ready";
        s.phaseT = 0;
        Audio.say("Round " + s.round);
      }
    }
    return;
  }
  if (s.phase !== "fight") return;

  // Timer
  s.timer -= 1 / 60;

  // Inputs
  const p1Input = input.snapshot();
  const p2Input = config.mode === "training"
    ? { left: false, right: false, up: false, down: false, block: true, LP: false, HP: false, LK: false, HK: false, SP: false }
    : cpuTick(s.cpu, s.p2, s.p1);

  const events: any[] = [];
  stepFighter(s.p1, p1Input, s.p2, 1, events);
  stepFighter(s.p2, p2Input, s.p1, 1, events);

  // Process events
  for (const ev of events) {
    if (ev.type === "hit") {
      s.dmg.push({ id: ++s.dmgId, x: ev.at.x, y: ev.at.y, dmg: ev.dmg, blocked: ev.blocked });
      s.combo = { side: ev.side === "p1" ? "p2" : "p1", count: ev.combo };
      s.shake = ev.blocked ? 0.05 : 0.15;
      ev.blocked ? Audio.block() : (ev.dmg > 8 ? Audio.hitHeavy() : Audio.hitLight());
      // trim old dmg numbers
      if (s.dmg.length > 20) s.dmg.splice(0, s.dmg.length - 20);
    } else if (ev.type === "special") {
      const who = ev.side === "p1" ? s.p1 : s.p2;
      const opp = ev.side === "p1" ? s.p2 : s.p1;
      s.fx.push({ id: ++s.fxId, fx: ev.fx, from: { x: who.x, y: who.y }, toward: opp.x });
      s.shake = 0.3;
      Audio.special();
    } else if (ev.type === "ko") {
      s.shake = 0.5;
      s.slowMoT = 90;
      Audio.ko();
      Audio.say("K.O.");
      if (ev.side === "p1") s.wins.p2 += 1; else s.wins.p1 += 1;
      s.phase = "roundEnd";
      s.phaseT = 0;
    }
  }

  // Timer expiry
  if (s.timer <= 0 && s.phase === "fight") {
    if (s.p1.hp > s.p2.hp) s.wins.p1 += 1;
    else if (s.p2.hp > s.p1.hp) s.wins.p2 += 1;
    s.phase = "roundEnd";
    s.phaseT = 0;
    Audio.say("Time up");
  }
}
