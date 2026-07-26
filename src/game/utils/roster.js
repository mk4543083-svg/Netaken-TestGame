// Roster: 8 GLB fighters. Each links to its uploaded model via .asset.json pointer.
// Clip name hints let the AnimationMixer pick real animation clip names from the GLB,
// falling back to Idle (or any) if the exact name is missing.

import modiGlb from "../../assets/fighters/modi.glb.asset.json";
import rahulGlb from "../../assets/fighters/rahul.glb.asset.json";
import dhruvGlb from "../../assets/fighters/dhruv.glb.asset.json";
import acpGlb from "../../assets/fighters/acp.glb.asset.json";
import dhoniGlb from "../../assets/fighters/dhoni.glb.asset.json";
import kohliGlb from "../../assets/fighters/kohli.glb.asset.json";
import salmanGlb from "../../assets/fighters/salman.glb.asset.json";
import putinGlb from "../../assets/fighters/putin.glb.asset.json";

// Default clip hints; fighter overrides can refine per-model.
// NOTE: "Walk" deliberately excludes run/sprint names so normal movement never
// falls back to a running animation — Run is its own logical clip for dashes.
const DEFAULT_CLIPS = {
  Idle:        ["idle", "stand", "breath", "rest", "tpose"],
  Walk:        ["walkforward", "walk_f", "walk", "step", "move"],
  WalkBack:    ["walkback", "walk_b", "backward", "retreat"],
  Run:         ["run", "sprint", "dash", "jog"],
  Sidestep:    ["sidestep", "side", "strafe", "dodge"],
  Jump:        ["jump", "leap", "hop"],
  Crouch:      ["crouch", "duck", "low_stance", "squat"],
  CrouchBlock: ["crouchblock", "crouchguard", "lowblock", "lowguard"],
  Jab:         ["jab", "punch1", "punch", "hook", "attack1", "hit1"],
  Cross:       ["cross", "punch2", "attack2", "heavy", "power"],
  LowKick:     ["lowkick", "kick_low", "kick1", "attack3", "kick"],
  HighKick:    ["highkick", "kick_high", "kick2", "roundhouse", "kick"],
  Special1:    ["special1", "ultimate", "super", "power", "combo"],
  Special2:    ["special2", "sweep", "spin", "finisher", "ultimate"],
  HitReact:    ["hitreact", "hit", "hurt", "react", "damage", "flinch"],
  Knockdown:   ["knockdown", "die", "death", "ko", "down", "defeat", "fall"],
  Victory:     ["victory", "win", "celebrate", "taunt", "cheer", "dance"],
  Block:       ["block", "guard", "defend"],
};


export const ROSTER = [
  { id: "modi", name: "Narendra Modi", tag: "PM 56\"", origin: "India",
    glbUrl: modiGlb.url, scale: 1.0, yOffset: 0, faceHue: 30,
    stats: { power: 8, speed: 6, defense: 8 },
    specialName: "Vande Bharat Charge",
    specialDesc: "Golden aura + spectral bullet train slam.",
    specialFx: "bulletTrain",
    clipHints: DEFAULT_CLIPS,
    color: "#e2a04a" },
  { id: "rahul", name: "Rahul Gandhi", tag: "Bharat Jodo", origin: "India",
    glbUrl: rahulGlb.url, scale: 1.0, yOffset: 0, faceHue: 200,
    stats: { power: 7, speed: 8, defense: 6 },
    specialName: "Bharat Jodo Punch Rush",
    specialDesc: "10-hit boxing combo, finishing globe uppercut.",
    specialFx: "punchRush",
    clipHints: DEFAULT_CLIPS,
    color: "#4a8aff" },
  { id: "dhruv", name: "Dhruv Rathee", tag: "Fact Check", origin: "India",
    glbUrl: dhruvGlb.url, scale: 1.0, yOffset: 0, faceHue: 220,
    stats: { power: 6, speed: 8, defense: 6 },
    specialName: "Fact-Check Debunk Beam",
    specialDesc: "Holographic tablet fires an analytical white beam.",
    specialFx: "beam",
    clipHints: DEFAULT_CLIPS,
    color: "#7ac0ff" },
  { id: "acp", name: "ACP Pradyuman", tag: "CID", origin: "India",
    glbUrl: acpGlb.url, scale: 1.0, yOffset: 0, faceHue: 30,
    stats: { power: 9, speed: 5, defense: 9 },
    specialName: "Daya, Darwaza Tod",
    specialDesc: "Summons a wooden door and slaps through it.",
    specialFx: "doorSlap",
    clipHints: DEFAULT_CLIPS,
    color: "#c48a4a" },
  { id: "dhoni", name: "M. S. Dhoni", tag: "Thala 7", origin: "India",
    glbUrl: dhoniGlb.url, scale: 1.0, yOffset: 0, faceHue: 45,
    stats: { power: 9, speed: 8, defense: 8 },
    specialName: "Thala For A Reason",
    specialDesc: "7-hit bat combo, ends with Helicopter Shot.",
    specialFx: "helicopter",
    clipHints: DEFAULT_CLIPS,
    color: "#ffd23a" },
  { id: "kohli", name: "Virat Kohli", tag: "King", origin: "India",
    glbUrl: kohliGlb.url, scale: 1.0, yOffset: 0, faceHue: 210,
    stats: { power: 8, speed: 9, defense: 7 },
    specialName: "Cover Drive Sonic Slam",
    specialDesc: "Sonic shout + light-speed cover drive.",
    specialFx: "sonicShout",
    clipHints: DEFAULT_CLIPS,
    color: "#3a5fd6" },
  { id: "salman", name: "Salman Bhai", tag: "Bhoi", origin: "India",
    glbUrl: salmanGlb.url, scale: 1.0, yOffset: 0, faceHue: 15,
    stats: { power: 10, speed: 6, defense: 8 },
    specialName: "Footpath Charge",
    specialDesc: "Phantom SUV rams across the arena.",
    specialFx: "suvCharge",
    clipHints: DEFAULT_CLIPS,
    color: "#8a4a2a" },
  { id: "putin", name: "Vladimir Putin", tag: "Judo", origin: "RUS",
    glbUrl: putinGlb.url, scale: 1.0, yOffset: 0, faceHue: 200,
    stats: { power: 9, speed: 7, defense: 8 },
    specialName: "Siberian Bear Takedown",
    specialDesc: "Spectral bear slam + icy shockwave.",
    specialFx: "bearSlam",
    clipHints: DEFAULT_CLIPS,
    color: "#6a6a8a" },
];

export const getFighter = (id) => ROSTER.find((f) => f.id === id) || ROSTER[0];
