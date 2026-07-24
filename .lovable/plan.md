# Neta Ken — 8-Fighter GLB Rebuild

## Roster (8 only, from your GLB uploads)

1. Narendra Modi
2. Rahul Gandhi
3. Dhruv Rathee
4. ACP Pradyuman
5. M. S. Dhoni
6. Virat Kohli
7. Salman Bhai
8. Putin

The previous 23-fighter procedural roster is removed.

## Character Select

Rebuilt to match `Character selection screen.jpg` from your zip — neon high-tech frame cards, P1 vs P2/AI slots, 2×4 grid on mobile / 4×2 on desktop. Tapping a card highlights it, plays the fighter's GLB `Idle`/preview animation live in a small 3D viewport, and shows stats (Power/Speed/Defense/Special) plus special-move name. Confirming transitions through a high-energy "VERSUS" screen into stage select.

## Arenas (5, from `Neta_ken_stages.zip`)

Each arena renders the reference image as a distant painted backdrop plus low-poly 3D foreground props tinted to match — Tekken-style 2.5D fight plane with detailed skybox.

1. **Japanese Temple** — `diego-rodrigues-cenario-japones-1.jpg`. Red torii gate, wooden temple, stone courtyard, lantern glow, falling sakura particles.
2. **Quixotic Temple** — `Aof3quixotictemple1bg.webp`. Ancient arches, floating stone pillars, glowing rune tiles, blue/purple mystic fog.
3. **Lost Cathedral** — `lost-cathedral.avif`. Ruined gothic nave, broken stained glass shafts of light, dust motes, cold stone floor.
4. **Hell Circle** — `game-battle-arena-background-with-hell-landscape-...jpg`. Suspended stone platform with hanging chains, orange ember particles, lava glow underlight.
5. **Neon Cage** — `mma-ring-boxing-background-octagon...avif`. Octagon cage ring under red neon spotlights, crowd silhouette backdrop, volumetric haze.

Stage-select screen (after character select, before VERSUS) shows all 5 as neon preview tiles.

## Mobile Inputs & GLB Animation

- **Virtual joystick** bottom-left (forward/back/jump/crouch; back-hold = block).
- **4 action buttons** bottom-right: LP, HP, LK, HK.
- `THREE.AnimationMixer` per fighter, driven by input state. Clip mapping (fuzzy name match on `gltf.animations`, fallback to `Idle`): `Idle`, `Walk`, `Jab`(LP), `Cross`(HP), `LowKick`(LK), `HighKick`(HK), `Special1`, `Special2`, `HitReact`, `Knockdown`, `Block`. 0.1s crossfade.
- **Combos & specials:**
  - `LP → HP → HK` within 500ms → 3-hit combo, extra damage, screen shake, hit-stop.
  - `↓ + HK` → `Special2` sweep kick.
  - Double-tap HP or swipe-forward + HP → `Special1` projectile/energy surge (costs full rage).
- **Skeletal hitboxes:** during a move's active frames, the attacking hand/foot bone's world position is AABB-tested against opponent torso bone → hit → damage + `HitReact` + sparks + brief hit-stop.

## HUD & Camera

- Dual health bars, round timer, super/rage gauge, combo counter, touch overlay.
- Dynamic 2.5D camera keeps both fighters framed, zooms in for specials/KO with slow-mo.
- Round flow: Character Select → Stage Select → VERSUS → Round Start → Combat → KO/Victory.

## Asset handling

GLB files are 15–17 MB each (~130 MB total) and stage images are large — all go to Lovable Assets (CDN). `.asset.json` pointers live under `src/assets/fighters/` and `src/assets/stages/`. `useGLTF` and stage backdrops load directly from CDN URLs. Nothing binary is committed to the repo.

## Files touched

- **New:** `src/game/components/3D/FighterGLB.jsx`, `src/game/components/3D/DynamicCamera.jsx`, `src/game/components/3D/stages/{JapaneseTemple,QuixoticTemple,LostCathedral,HellCircle,NeonCage}.jsx`, `src/game/components/UI/{StageSelect,VersusScreen,VirtualJoystick}.jsx`, `src/game/utils/{animationController,comboBuffer}.js`, `src/assets/fighters/*.glb.asset.json`, `src/assets/stages/*.asset.json`.
- **Rewritten:** `src/game/utils/roster.js` (8 entries + GLB URLs + clip hints + stats), `src/game/Game.tsx` (adds stage-select + VS steps, swaps FighterMesh for FighterGLB, dynamic camera), `src/game/components/UI/CharacterSelect.jsx` (neon 8-card grid with live GLB preview, styled after your reference), `src/game/components/UI/TouchControls.jsx` (joystick + 4 buttons).
- **Updated:** `src/game/utils/combatEngine.js` (skeletal-hitbox hook points, combo bonuses, hit-stop), `src/game/utils/input.js` (joystick vector + gesture events).
- **Removed:** `FighterMesh.jsx`, `bodyPresets.js`, procedural face/portrait code in `textureManager.js`.

## Technical notes

- GLB loading via `useGLTF` from `@react-three/drei` with `SkeletonUtils.clone` so P1/P2 can safely share one GLB.
- Clip resolution is case-insensitive substring match; missing clips fall back to `Idle`.
- Hitbox sampling uses `bone.getWorldPosition()` per frame during active windows — no physics engine.
- All 8 GLBs preload during character select with a progress bar so combat starts instantly.
- Stage backdrops are the reference image on a large curved plane; foreground props are simple boxes/cylinders + particles + tinted lights to sell depth.
- Everything stays client-side; Capacitor Android export path is unchanged.

Confirm and I'll build it.
