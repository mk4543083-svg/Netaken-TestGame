// Body archetype presets. All values are multipliers of a base unit (1 = ~1.8m tall).
// Used by FighterMesh.jsx to build a low-poly PS1-style body.

const ARCHETYPES = {
  gaunt:     { height: 1.05, shoulder: 0.85, chest: 0.80, waist: 0.75, limb: 1.00 },
  slim:      { height: 1.00, shoulder: 0.90, chest: 0.88, waist: 0.85, limb: 0.98 },
  lean:      { height: 1.02, shoulder: 0.95, chest: 0.92, waist: 0.88, limb: 1.00 },
  average:   { height: 1.00, shoulder: 1.00, chest: 1.00, waist: 1.00, limb: 1.00 },
  athletic:  { height: 1.02, shoulder: 1.08, chest: 1.08, waist: 0.95, limb: 1.02 },
  compact:   { height: 0.95, shoulder: 1.05, chest: 1.05, waist: 1.00, limb: 0.94 },
  broad:     { height: 1.05, shoulder: 1.15, chest: 1.15, waist: 1.05, limb: 1.02 },
  stocky:    { height: 0.98, shoulder: 1.10, chest: 1.12, waist: 1.05, limb: 0.96 },
  heavy:     { height: 1.00, shoulder: 1.15, chest: 1.20, waist: 1.25, limb: 0.98 },
  muscular:  { height: 1.05, shoulder: 1.20, chest: 1.18, waist: 1.02, limb: 1.05 },
};

// Accessory geometry hints consumed by FighterMesh: which extra parts to render.
const ACCESSORY = {
  modiJacket:      { jacket: "vest",   headwear: null },
  monkRobe:        { jacket: "robe",   headwear: null },
  shawl:           { jacket: "shawl",  headwear: null },
  saree:           { jacket: "wrap",   headwear: null },
  rolledSleeves:   { jacket: null,     headwear: null },
  muffler:         { jacket: null,     headwear: null, neck: "muffler" },
  jacket:          { jacket: "coat",   headwear: null },
  dhoti:           { jacket: "shawl",  headwear: null },
  vest:            { jacket: "vest",   headwear: null },
  suit:            { jacket: "coat",   headwear: null },
  jersey:          { jacket: null,     headwear: null },
  jersey7:         { jacket: null,     headwear: null, badge: "7" },
  leatherJacket:   { jacket: "coat",   headwear: null },
  hoodie:          { jacket: "coat",   headwear: "hood" },
  gown:            { jacket: "gown",   headwear: null },
  maoSuit:         { jacket: "coat",   headwear: null },
  redTie:          { jacket: "coat",   headwear: null, tie: true },
  tactical:        { jacket: "coat",   headwear: null },
  kimono:          { jacket: "robe",   headwear: null },
};

export function getBodyPreset(fighter) {
  const base = ARCHETYPES[fighter.build] || ARCHETYPES.average;
  const acc = ACCESSORY[fighter.accessory] || {};
  return { ...base, ...acc, palette: fighter.palette };
}
