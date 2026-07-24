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
    tint: "#e8b090", ambient: "#ffd0a0", fog: "#402028", theme: "temple" },
  { id: "quixotic", name: "Quixotic Temple",  desc: "Floating pillars · mystic runes",   bg: qx.url,
    tint: "#a090ff", ambient: "#c0a0ff", fog: "#1a1030", theme: "runes" },
  { id: "cathedral", name: "Lost Cathedral", desc: "Broken gothic nave · dust motes",    bg: lc.url,
    tint: "#c0c8d8", ambient: "#a8b0c8", fog: "#101820", theme: "cathedral" },
  { id: "hell", name: "Hell Circle",         desc: "Chained platform · embers",          bg: hc.url,
    tint: "#ff6030", ambient: "#ff8040", fog: "#200808", theme: "hell" },
  { id: "cage", name: "Neon Cage",           desc: "Octagon · red neon · crowd",         bg: nc.url,
    tint: "#ff2040", ambient: "#ff4060", fog: "#180010", theme: "cage" },
];

export const getStage = (id) => STAGES.find((s) => s.id === id) || STAGES[0];
