// Combat engine: pure logic (no React). Consumed by Game.tsx tick loop.
// Tekken-3 flavoured: heavy low jumps, walk/dash separation, 3D sidestep on Z,
// hold-back blocking, 200ms input buffer, hit-cancels-attack, KO + victory states.

export const STAGE_BOUNDS = { min: -9.5, max: 9.5, zMin: -3.4, zMax: 3.4, floor: 0 };
export const ROUND_TIME = 60;

// Move definitions. `startup/active/recovery` are ticks (60Hz).
export const MOVES = {
  LP: { name: "LP", damage: 5,  reach: 1.15, startup: 3,  active: 3,  recovery: 8,  hitstun: 12, block: 4, rage: 4, heavy: false },
  HP: { name: "HP", damage: 10, reach: 1.35, startup: 8,  active: 4,  recovery: 16, hitstun: 18, block: 6, rage: 7, heavy: true },
  LK: { name: "LK", damage: 6,  reach: 1.25, startup: 4,  active: 4,  recovery: 10, hitstun: 14, block: 5, rage: 5, heavy: false },
  HK: { name: "HK", damage: 12, reach: 1.5,  startup: 10, active: 5,  recovery: 20, hitstun: 22, block: 7, rage: 8, heavy: true },
  SP: { name: "SP", damage: 30, reach: 2.5,  startup: 12, active: 20, recovery: 28, hitstun: 40, block: 15, rage: 0, heavy: true, special: true },
};

function maybeStep(f, events, heavy) {
  f.stepCd = (f.stepCd || 0) - 1;
  if (f.stepCd <= 0) {
    events.push({ type: "step", side: f.side, heavy });
    f.stepCd = heavy ? 10 : 14;
  }
}

export function makeFighter(fighterMeta, side) {
  return {
    id: fighterMeta.id,
    meta: fighterMeta,
    side, // "p1" or "p2"
    x: side === "p1" ? -2.2 : 2.2,
    y: 0,
    z: 0,
    vx: 0, vy: 0, vz: 0,
    facing: side === "p1" ? 1 : -1,
    hp: 100, maxHp: 100,
    rage: 0, maxRage: 100,
    // idle | walk | walkBack | dash | backdash | jump | crouch | block | crouchBlock
    // | attack | special | hitstun | ko | victory | sidestep
    state: "idle",
    attack: null,
    blocking: false,
    stateT: 0,
    combo: 0,
    onGround: true,
    stunT: 0,
    dashT: 0,
    dashDir: 0,
    sideT: 0,
    sideDir: 0,
    inputBuffer: null, // { move, framesLeft } — 200ms (12f) buffer
    animKey: 0,        // bumped whenever a fresh one-shot anim must restart
    stepCd: 0,         // footstep SFX cooldown
  };
}

// Heavy Tekken-3 physics. Jump: v0=0.30, g=0.030 → apex 1.5u, flight 20 frames.
const GRAV = -0.030;
const JUMP_V = 0.30;
const MOVE_SPEED = 0.045;      // forward walk  (2.7 u/s)
const BACK_SPEED = 0.035;      // back walk     (2.1 u/s)
const DASH_SPEED = 0.140;
const BACKDASH_SPEED = 0.115;
const SIDE_SPEED = 0.075;
const DASH_FRAMES = 18;
const BACKDASH_FRAMES = 22;
const SIDE_FRAMES = 16;
const PUSH_RADIUS = 0.85;      // body collision so fighters never overlap

export function stepFighter(f, input, opp, dt, events) {
  // KO / victory: inputs fully disabled.
  if (f.state === "ko" || f.state === "victory") {
    f.vx = 0; f.vz = 0;
    f.blocking = false;
    return applyPhysics(f, opp);
  }

  // Auto-face opponent every tick (Tekken auto-turn).
  f.facing = opp.x >= f.x ? 1 : -1;
  f.blocking = false;

  if (f.inputBuffer) {
    f.inputBuffer.framesLeft -= 1;
    if (f.inputBuffer.framesLeft <= 0) f.inputBuffer = null;
  }

  // ---- hitstun: locked, cannot act (attack already cancelled on hit) ----
  if (f.stunT > 0) {
    f.stunT -= 1;
    f.state = "hitstun";
    f.vx *= 0.86;
    f.vz = 0;
    if (f.stunT <= 0) { f.state = "idle"; f.combo = 0; f.vx = 0; }
    return applyPhysics(f, opp);
  }

  // ---- active attack: plays out fully, only buffered cancels queue up ----
  if (f.attack) {
    f.attack.elapsed += 1;
    const m = MOVES[f.attack.move];
    const total = m.startup + m.active + m.recovery;

    if (f.attack.elapsed === m.startup + 1 && !m.special) {
      events.push({ type: "swing", side: f.side, heavy: m.heavy });
    }
    if (f.attack.elapsed > m.startup && f.attack.elapsed <= m.startup + m.active && !f.attack.hit) {
      if (checkHit(f, opp, m)) {
        f.attack.hit = true;
        resolveHit(f, opp, m, events);
      }
    }
    // 200ms (12 frame) buffer window during recovery.
    if (f.attack.elapsed > m.startup + m.active) {
      const buffered = pickButton(input);
      if (buffered && buffered !== "SP" && !f.inputBuffer) f.inputBuffer = { move: buffered, framesLeft: 12 };
    }
    if (f.attack.elapsed >= total) {
      f.attack = null;
      f.state = "idle";
      if (f.inputBuffer) {
        startAttack(f, f.inputBuffer.move, events);
        f.inputBuffer = null;
      }
    }
    return applyPhysics(f, opp);
  }

  // ---- sidestep (Z axis) ----
  if (f.sideT > 0) {
    f.sideT -= 1;
    f.state = "sidestep";
    f.vx = 0;
    f.vz = f.sideDir * SIDE_SPEED;
    if (f.sideT <= 0) { f.state = "idle"; f.vz = 0; }
    return applyPhysics(f, opp);
  }

  // ---- dash / backdash ----
  if (f.dashT > 0) {
    f.dashT -= 1;
    f.vx = f.dashDir * (f.state === "backdash" ? BACKDASH_SPEED : DASH_SPEED);
    if (f.state === "backdash" && (BACKDASH_FRAMES - f.dashT) >= 6 && input.block) {
      f.dashT = 0; f.state = "block"; f.vx = 0; f.blocking = true;
      return applyPhysics(f, opp);
    }
    maybeStep(f, events, true);
    if (f.dashT <= 4) {
      const buffered = pickButton(input, f.rage >= 100);
      if (buffered && !f.inputBuffer) f.inputBuffer = { move: buffered, framesLeft: 8 };
    }
    if (f.dashT <= 0) {
      f.state = "idle"; f.vx = 0;
      if (f.inputBuffer) { startAttack(f, f.inputBuffer.move, events); f.inputBuffer = null; }
    }
    return applyPhysics(f, opp);
  }

  // ---- airborne: no new actions until landing ----
  if (!f.onGround) {
    f.state = "jump";
    return applyPhysics(f, opp);
  }

  // Dash tokens (double-tap f,f / b,b)
  const dashForwardInput = (f.facing === 1 && input.tapRight) || (f.facing === -1 && input.tapLeft);
  const dashBackInput = (f.facing === 1 && input.tapLeft) || (f.facing === -1 && input.tapRight);
  if (dashForwardInput) {
    f.dashT = DASH_FRAMES; f.dashDir = f.facing; f.state = "dash"; f.animKey++;
    return applyPhysics(f, opp);
  }
  if (dashBackInput) {
    f.dashT = BACKDASH_FRAMES; f.dashDir = -f.facing; f.state = "backdash"; f.animKey++;
    return applyPhysics(f, opp);
  }
  // Sidestep tokens (tap up / tap down)
  if (input.sideU || input.sideD) {
    f.sideT = SIDE_FRAMES; f.sideDir = input.sideU ? -1 : 1; f.state = "sidestep"; f.animKey++;
    return applyPhysics(f, opp);
  }

  // Jump (dedicated button — up/down are sidestep in Tekken)
  if (input.jump) {
    f.vy = JUMP_V; f.onGround = false; f.state = "jump"; f.animKey++;
    events.push({ type: "jump", side: f.side });
    return applyPhysics(f, opp);
  }

  // ---- attacks ----
  const btn = pickButton(input, f.rage >= 100);
  if (btn) {
    startAttack(f, btn, events);
    return applyPhysics(f, opp);
  }

  // ---- block / movement ----
  const holdingBack = (f.facing === 1 && input.left) || (f.facing === -1 && input.right);
  const holdingFwd = (f.facing === 1 && input.right) || (f.facing === -1 && input.left);

  if (input.block && !holdingBack) {
    f.state = input.down ? "crouchBlock" : "block";
    f.blocking = true;
    f.vx = 0;
    return applyPhysics(f, opp);
  }
  if (holdingBack) {
    // Tekken: holding back walks back AND guards.
    f.blocking = true;
    if (input.down) { f.state = "crouchBlock"; f.vx = 0; }
    else { f.state = "walkBack"; f.vx = -f.facing * BACK_SPEED; maybeStep(f, events, false); }
    return applyPhysics(f, opp);
  }
  if (holdingFwd) {
    f.state = "walk";
    f.vx = f.facing * MOVE_SPEED;
    maybeStep(f, events, false);
    return applyPhysics(f, opp);
  }
  if (input.down) { f.state = "crouch"; f.vx = 0; return applyPhysics(f, opp); }

  f.vx = 0;
  f.state = "idle";
  return applyPhysics(f, opp);
}

function pickButton(input, includeSP = false) {
  if (includeSP && input.SP) return "SP";
  if (input.HP) return "HP";
  if (input.HK) return "HK";
  if (input.LP) return "LP";
  if (input.LK) return "LK";
  return null;
}

function startAttack(f, move, events) {
  const m = MOVES[move];
  f.attack = { move, elapsed: 0, hit: false };
  f.state = m.special ? "special" : "attack";
  f.animKey++;
  f.vx = 0;
  if (m.special) {
    f.rage = 0;
    events.push({ type: "special", side: f.side, fx: f.meta.specialFx, at: { x: f.x, y: 1 } });
  }
  events.push({ type: "kiai", side: f.side, heavy: m.heavy });
}

function applyPhysics(f, opp) {
  f.x += f.vx;
  f.z += f.vz;
  if (!f.onGround) {
    f.y += f.vy;
    f.vy += GRAV;
    if (f.y <= 0) { f.y = 0; f.vy = 0; f.onGround = true; if (f.state === "jump") f.state = "idle"; }
  }
  // Body push-out so models never intersect (removes overlap glitching).
  if (opp && opp.state !== "ko") {
    const dx = f.x - opp.x;
    const dz = f.z - opp.z;
    const d = Math.hypot(dx, dz * 0.6);
    if (d < PUSH_RADIUS && d > 0.0001) {
      const push = (PUSH_RADIUS - d) * 0.5;
      f.x += (dx / d) * push;
      opp.x -= (dx / d) * push;
    } else if (d <= 0.0001) {
      f.x += 0.02;
    }
  }
  // Full-arena clamp (no mat, whole floor is walkable).
  if (f.x < STAGE_BOUNDS.min) f.x = STAGE_BOUNDS.min;
  if (f.x > STAGE_BOUNDS.max) f.x = STAGE_BOUNDS.max;
  if (f.z < STAGE_BOUNDS.zMin) f.z = STAGE_BOUNDS.zMin;
  if (f.z > STAGE_BOUNDS.zMax) f.z = STAGE_BOUNDS.zMax;
  if (f.y < 0) f.y = 0;
}

function checkHit(att, def, m) {
  const dx = Math.abs(att.x - def.x);
  const dz = Math.abs(att.z - def.z);
  const dy = Math.abs(att.y - def.y);
  return dx <= m.reach && dz <= 1.1 && dy <= 1.3 && def.state !== "ko";
}

function resolveHit(att, def, m, events) {
  const blocking = def.blocking && !m.special;
  const dmg = blocking ? Math.max(1, Math.round(m.damage * 0.15)) : m.damage;
  def.hp = Math.max(0, def.hp - dmg);
  def.rage = Math.min(100, def.rage + Math.round(m.rage * 0.6));
  att.rage = Math.min(100, att.rage + m.rage);

  if (!blocking) {
    // ABSOLUTE input cancel: whatever the victim was doing is dropped instantly.
    def.attack = null;
    def.inputBuffer = null;
    def.dashT = 0;
    def.sideT = 0;
    def.vz = 0;
  }
  def.stunT = blocking ? m.block : m.hitstun;
  def.vx = att.facing * (blocking ? 0.05 : 0.12);
  def.state = "hitstun";
  def.animKey++;
  def.combo = blocking ? 0 : def.combo + 1;

  events.push({
    type: "hit", side: def.side, dmg, blocked: blocking, heavy: m.heavy,
    special: !!m.special, at: { x: def.x, y: 1.4, z: def.z }, combo: def.combo,
  });

  if (def.hp <= 0) {
    def.state = "ko";
    def.attack = null;
    def.stunT = 0;
    events.push({ type: "ko", side: def.side });
  }
}
