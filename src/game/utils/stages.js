// Stage definitions — backdrop image URL + palette + prop style.
import jp from "../../assets/stages/japanese-temple.jpg.asset.json";
import qx from "../../assets/stages/quixotic-temple.webp.asset.json";
import lc from "../../assets/stages/lost-cathedral.avif.asset.json";
import hc from "../../assets/stages/hell-circle.jpg.asset.json";
import nc from "../../assets/stages/neon-cage.avif.asset.json";
import selBg from "../../assets/stages/select-bg.jpg.asset.json";

export const SELECT_BG_URL = selBg.url;

export const STAGES = [
  { id: "japanese", name: "Japanese Temple",  desc: "Torii gate · sakura · lantern glow", bg: jp.url,
    tint: "#e8b090", matColor: "#8a5040", ambient: "#ffd0a0", fog: "#c0603a", fogDensity: 0.028, theme: "temple" },
  { id: "quixotic", name: "Quixotic Temple",  desc: "Floating pillars · mystic runes",   bg: qx.url,
    tint: "#6a5aa8", matColor: "#3a2a6a", ambient: "#c0a0ff", fog: "#1a1a5a", fogDensity: 0.045, theme: "runes" },
  { id: "cathedral", name: "Lost Cathedral", desc: "Broken gothic nave · dust motes",    bg: lc.url,
    tint: "#a8b0c0", matColor: "#4a5060", ambient: "#a8b0c8", fog: "#1a2838", fogDensity: 0.035, theme: "cathedral" },
  { id: "hell", name: "Hell Circle",         desc: "Chained platform · embers",          bg: hc.url,
    tint: "#8a3020", matColor: "#3a0a08", ambient: "#ff8040", fog: "#601010", fogDensity: 0.055, theme: "hell" },
  { id: "cage", name: "Neon Cage",           desc: "Octagon · red neon · crowd",         bg: nc.url,
    tint: "#40202a", matColor: "#20101a", ambient: "#ff4060", fog: "#2a0818", fogDensity: 0.040, theme: "cage" },
];

export const getStage = (id) => STAGES.find((s) => s.id === id) || STAGES[0];
