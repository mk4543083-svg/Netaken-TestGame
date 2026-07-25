// Combat engine: pure logic (no React). Consumed by Game.tsx tick loop.
// Handles two fighters, movement, attacks, blocking, hitboxes (AABB),
// health, rage gauge, combo counter, KO, and floating damage events.

export const STAGE_BOUNDS = { min: -6, max: 6, floor: 0 };
export const ROUND_TIME = 60;

// Move definitions. `startup/active/recovery` are ticks (60Hz).
export const MOVES = {
  LP: { name: "LP", damage: 5,  reach: 1.1, startup: 3,  active: 3,  recovery: 8,  hitstun: 10, block: 4, rage: 4 },
  HP: { name: "HP", damage: 10, reach: 1.3, startup: 8,  active: 4,  recovery: 16, hitstun: 16, block: 6, rage: 7 },
  LK: { name: "LK", damage: 6,  reach: 1.2, startup: 4,  active: 4,  recovery: 10, hitstun: 12, block: 5, rage: 5 },
  HK: { name: "HK", damage: 12, reach: 1.4, startup: 10, active: 5,  recovery: 20, hitstun: 20, block: 7, rage: 8 },
  SP: { name: "SP", damage: 30, reach: 2.4, startup: 12, active: 20, recovery: 28, hitstun: 40, block: 15, rage: 0, special: true },
};

export function makeFighter(fighterMeta, side) {
  return {
    id: fighterMeta.id,
    meta: fighterMeta,
    side, // "p1" or "p2"
    x: side === "p1" ? -2.2 : 2.2,
    y: 0,
    vx: 0, vy: 0,
    facing: side === "p1" ? 1 : -1,
    hp: 100, maxHp: 100,
    rage: 0, maxRage: 100,
    state: "idle", // idle | walk | jump | crouch | block | attack | hitstun | ko | special
    attack: null, // { move, elapsed }
    stateT: 0,
    combo: 0,
    lastHitBy: 0,
    onGround: true,
    stunT: 0,
    slowMoT: 0,
  };
}

// Tekken-3 style heavy physics: strong gravity, short low-arc jumps.
// Jump apex clamped so total flight is ~26 frames and max height ~1.6 units.
const GRAV = -0.106;      // ~ -38 units/sec^2 at 60hz (0.0176 units per frame^2)
const MOVE_SPEED = 0.053; // ~3.2 units/sec forward walk
const BACK_SPEED = 0.035; // ~2.1 units/sec back walk
const DASH_SPEED = 0.142; // ~8.5 units/sec forward dash
const BACKDASH_SPEED = 0.117; // ~7.0 units/sec backdash
const JUMP_V = 0.34;      // apex clamped to ~1.6 units
const DASH_FRAMES = 18;
const BACKDASH_FRAMES = 22;

export function stepFighter(f, input, opp, dt, events) {
  // input = { left, right, up, down, block, LP, HP, LK, HK, SP }
  if (f.state === "ko") return;

  // face opponent
  f.facing = opp.x >= f.x ? 1 : -1;

  // hitstun countdown
  if (f.stunT > 0) {
    f.stunT -= 1;
    f.state = "hitstun";
    // apply pushback
    f.x += f.vx;
    f.vx *= 0.85;
    if (f.stunT <= 0) { f.state = "idle"; f.combo = 0; }
    return applyPhysics(f);
  }

  // active attack
  if (f.attack) {
    f.attack.elapsed += 1;
    const m = MOVES[f.attack.move];
    const total = m.startup + m.active + m.recovery;
    // active window: try to hit
    if (f.attack.elapsed > m.startup && f.attack.elapsed <= m.startup + m.active && !f.attack.hit) {
      if (checkHit(f, opp, m)) {
        f.attack.hit = true;
        resolveHit(f, opp, m, events);
      }
    }
    if (f.attack.elapsed >= total) {
      f.attack = null;
      f.state = "idle";
    }
    return applyPhysics(f);
  }

  // block
  if (input.block && f.onGround) { f.state = "block"; return applyPhysics(f); }

  // start attack (priority: SP > HP/HK > LP/LK)
  const btn = input.SP ? "SP" : input.HP ? "HP" : input.HK ? "HK" : input.LP ? "LP" : input.LK ? "LK" : null;
  if (btn) {
    if (btn === "SP" && f.rage < 100) {
      // not ready
    } else {
      f.attack = { move: btn, elapsed: 0, hit: false };
      f.state = btn === "SP" ? "special" : "attack";
      if (btn === "SP") {
        f.rage = 0;
        events.push({ type: "special", side: f.side, fx: f.meta.specialFx, at: { x: f.x, y: 1 } });
      }
      return applyPhysics(f);
    }
  }

  // movement
  if (f.onGround) {
    if (input.left)  f.vx = -MOVE_SPEED;
    else if (input.right) f.vx = MOVE_SPEED;
    else f.vx = 0;
    if (input.up) { f.vy = JUMP_V; f.onGround = false; }
    f.state = f.vx !== 0 ? "walk" : (input.down ? "crouch" : "idle");
  }

  applyPhysics(f);
}

function applyPhysics(f) {
  f.x += f.vx;
  if (!f.onGround) { f.y += f.vy; f.vy += GRAV; }
  if (f.y <= 0) { f.y = 0; f.vy = 0; f.onGround = true; }
  if (f.x < STAGE_BOUNDS.min) f.x = STAGE_BOUNDS.min;
  if (f.x > STAGE_BOUNDS.max) f.x = STAGE_BOUNDS.max;
}

function checkHit(att, def, m) {
  const dx = Math.abs(att.x - def.x);
  const dy = Math.abs((att.y + 1) - (def.y + 1));
  return dx <= m.reach && dy <= 1.2 && def.state !== "ko";
}

function resolveHit(att, def, m, events) {
  const blocking = def.state === "block" && !m.special;
  const dmg = blocking ? Math.max(1, Math.round(m.damage * 0.15)) : m.damage;
  def.hp = Math.max(0, def.hp - dmg);
  def.rage = Math.min(100, def.rage + Math.round(m.rage * 0.6));
  att.rage = Math.min(100, att.rage + m.rage);
  def.stunT = blocking ? m.block : m.hitstun;
  def.vx = att.facing * (blocking ? 0.08 : 0.18);
  def.state = "hitstun";
  def.combo = blocking ? 0 : def.combo + 1;
  events.push({ type: "hit", side: def.side, dmg, blocked: blocking, at: { x: def.x, y: 1.4 }, combo: def.combo });
  if (def.hp <= 0) {
    def.state = "ko";
    events.push({ type: "ko", side: def.side });
  }
}
