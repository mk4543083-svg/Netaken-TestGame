// CPU AI Engine: produces a per-tick input frame based on distance / state.
// Difficulty tunes reaction delay + aggression.

const DIFF = {
  easy:   { react: 24, aggro: 0.35, blockChance: 0.15, specialChance: 0.4 },
  medium: { react: 12, aggro: 0.6,  blockChance: 0.35, specialChance: 0.7 },
  hard:   { react: 5,  aggro: 0.85, blockChance: 0.6,  specialChance: 1.0 },
};

export function makeCpuState(difficulty = "medium") {
  return {
    diff: DIFF[difficulty] || DIFF.medium,
    cool: 0,          // cooldown before next decision
    lastAction: null,
    lastInput: emptyInput(),
    holdT: 0,
  };
}

function emptyInput() {
  return { left: false, right: false, up: false, down: false, block: false,
           LP: false, HP: false, LK: false, HK: false, SP: false };
}

export function cpuTick(cpu, self, opp) {
  cpu.cool -= 1;
  cpu.holdT -= 1;
  if (cpu.holdT > 0) return cpu.lastInput;
  if (cpu.cool > 0) return { ...emptyInput(), left: cpu.lastInput.left, right: cpu.lastInput.right };

  const d = Math.abs(self.x - opp.x);
  const towards = opp.x > self.x ? "right" : "left";
  const away = towards === "right" ? "left" : "right";
  const input = emptyInput();
  const D = cpu.diff;

  // Special trigger
  if (self.rage >= 100 && d < 3.2 && Math.random() < D.specialChance) {
    input.SP = true;
    cpu.cool = D.react + 40;
    cpu.holdT = 3;
    cpu.lastInput = input;
    return input;
  }

  // Block if opponent attacking close
  if (opp.state === "attack" && d < 1.6 && Math.random() < D.blockChance) {
    input.block = true;
    cpu.cool = D.react;
    cpu.holdT = 8;
    cpu.lastInput = input;
    return input;
  }

  if (d > 3.5) {
    // Far: approach / rare jump-in
    input[towards] = true;
    if (Math.random() < 0.05) input.up = true;
    cpu.cool = D.react;
    cpu.holdT = 6;
  } else if (d > 1.8) {
    // Mid: poke or close
    if (Math.random() < D.aggro) input[towards] = true;
    if (Math.random() < 0.15) input.LK = true;
    cpu.cool = D.react + 4;
    cpu.holdT = 4;
  } else {
    // Close: combo
    const roll = Math.random();
    if (roll < 0.35) input.LP = true;
    else if (roll < 0.65) input.HP = true;
    else if (roll < 0.85) input.HK = true;
    else input.LK = true;
    cpu.cool = D.react + 10;
    cpu.holdT = 2;
  }

  cpu.lastInput = input;
  return input;
}
