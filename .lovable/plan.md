# NETA-KEN : ABSOLUTE CINEMA — Build Plan

This is a very large spec (23 characters, full 3D engine, AI, audio, mobile + APK export). I'll build a solid **playable MVP foundation** in this turn, then iterate. Trying to ship every character + special effect + audio track in one pass would produce broken code.

## Important upfront notes

1. **Real face photos of real people (politicians, celebrities) — I will NOT fetch or embed real photographs.** That's a likeness/rights problem and I have no licensed source. Instead each fighter gets a **stylized PS1-style procedural face texture** (canvas-generated: skin tone, hair, facial hair, glasses, headwear cues) keyed to the character. The `textureManager` is structured so you can later drop in your own licensed portrait URLs — just replace the `portraitUrl` field per fighter.
2. **Parody roster is kept** as names + stats + special-attack metadata. Visual identity is conveyed through body proportions, outfit colors, and headwear/accessory geometry (Modi jacket, Kejriwal muffler, Dhoni #7 jersey, Kim Mao suit, Trump red tie, etc.) — matching the "real body archetypes + outfits" requirement without photo likenesses.
3. **Audio**: Howler.js wired up with synthesized placeholder SFX (WebAudio-generated hits, announcer via SpeechSynthesis for "READY… FIGHT!… K.O.!"). Drop real mp3s into `/public/audio/` later.
4. **Capacitor export**: I'll add config + npm scripts, not run the Android build (needs Android Studio).

## Scope for this turn (MVP)

**In:**
- Full project structure exactly as specified (all listed files created).
- Menus: GameModeSelect → CharacterSelect (all 23 fighters, grid, preview card, stats, special-attack description) → Stage.
- 3D arena (Stage.jsx) with PS1-style flat lighting, low-poly floor, skybox gradient.
- FighterMesh.jsx: procedural low-poly body from `bodyPresets` (head, torso, arms, legs, outfit layers, headwear) with per-fighter proportions and outfit colors. Face texture generated procedurally per fighter.
- Combat engine: bounding-box hitboxes, LP/HP/LK/HK/SP moves, block, health, rage gauge, combo counter, KO with slow-mo freeze, floating damage numbers.
- CPU AI engine with Easy/Medium/Hard, spatial state machine (far/mid/close), special trigger at 100% rage.
- HUD: dual health bars, rage gauges, combo, round pips, timer, touch controls (D-pad + LP/HP/LK/HK/SP) on mobile, keyboard (WASD + J/K/L/I + Space for SP) on desktop.
- Special-attack FX system: particle/shockwave/beam primitives, each character's special dispatches a themed effect (bullet train, bulldozer silhouette, electric ring, ICBM, dragon, chariot, etc.) built from primitive geometry + particles + camera shake.
- Arcade mode (best of 3 rounds vs CPU) + Training mode (dummy blocks/stands).
- Capacitor config + build scripts for APK export.

**Deferred (call out to user, add in follow-ups):**
- Real portrait photos (needs licensed URLs from you).
- Real music tracks + voice lines (drop-in mp3s).
- Per-character animation rigs (MVP uses procedural pose tweens, not skeletal animation).
- Fine-tuned move frame data / balance pass.

## File layout

```text
src/
  routes/index.tsx                       game shell (mounts <Game/>)
  game/
    Game.tsx                             top-level state machine (menu/select/fight/result)
    components/
      UI/
        GameModeSelect.jsx
        CharacterSelect.jsx
        ArcadeHUD.jsx
        TouchControls.jsx
        ResultScreen.jsx
      3D/
        Stage.jsx
        FighterMesh.jsx
        SpecialFX.jsx
        DamageNumbers.jsx
    utils/
      bodyPresets.js                     23 fighters: height/width/waist/outfit/headwear/colors
      textureManager.js                  procedural face canvas + portrait URL slots
      combatEngine.js                    moves, hitboxes, damage, rage, combos, KO
      cpuAiEngine.js                     distance-based state machine + difficulty
      audioEngine.js                     Howler wrapper + announcer
      input.js                           keyboard + touch → unified input frame
      roster.js                          23 fighters metadata (stats, special name/desc, palette)
capacitor.config.ts                      Android export config
```

## Controls

- Desktop: `A/D` move, `W` jump, `S` crouch/block, `J` LP, `K` HP, `L` LK, `I` HK, `Space` SP.
- Mobile: on-screen D-pad left + 5 action buttons right (LP, HP, LK, HK, SP).

## Deliverable

A playable MVP you can walk end-to-end: pick mode → pick fighter → pick CPU → 3D fight with HUD, rage, specials, KO, result → rematch/menu. Everything is modular so adding real assets is drop-in.

I'll build this now.