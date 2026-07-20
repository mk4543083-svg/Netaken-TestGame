// Texture manager: procedural PS1-style face + portrait canvases keyed by fighter id.
// Real licensed portrait URLs can be added later via `portraitOverride`.

import * as THREE from "three";

const faceCache = new Map();
const portraitCache = new Map();

// Optional: drop a licensed image URL here per fighter id to override procedural portrait.
export const portraitOverride = {
  // modi: "/portraits/modi.jpg",
};

function drawFace(ctx, w, h, fighter) {
  const p = fighter.palette;
  // background transparent-ish
  ctx.fillStyle = p.skin;
  ctx.fillRect(0, 0, w, h);

  // cheeks / shading (PS1-flat)
  ctx.fillStyle = shade(p.skin, -0.12);
  ctx.fillRect(0, h * 0.55, w, h * 0.15);

  // hair band on top
  if (p.hair) {
    ctx.fillStyle = p.hair;
    ctx.fillRect(0, 0, w, h * 0.28);
    // sideburns
    ctx.fillRect(0, h * 0.28, w * 0.12, h * 0.25);
    ctx.fillRect(w * 0.88, h * 0.28, w * 0.12, h * 0.25);
  }

  // eyes
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(w * 0.20, h * 0.42, w * 0.20, h * 0.07);
  ctx.fillRect(w * 0.60, h * 0.42, w * 0.20, h * 0.07);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(w * 0.27, h * 0.44, w * 0.06, h * 0.05);
  ctx.fillRect(w * 0.67, h * 0.44, w * 0.06, h * 0.05);

  // brows
  ctx.fillStyle = p.hair || "#1a1a1a";
  ctx.fillRect(w * 0.18, h * 0.38, w * 0.24, h * 0.03);
  ctx.fillRect(w * 0.58, h * 0.38, w * 0.24, h * 0.03);

  // nose
  ctx.fillStyle = shade(p.skin, -0.18);
  ctx.fillRect(w * 0.46, h * 0.5, w * 0.08, h * 0.12);

  // mouth
  ctx.fillStyle = "#7a2a2a";
  ctx.fillRect(w * 0.36, h * 0.72, w * 0.28, h * 0.04);

  // beard/moustache
  if (fighter.palette.beard) {
    ctx.fillStyle = fighter.palette.beard;
    ctx.fillRect(w * 0.32, h * 0.68, w * 0.36, h * 0.04); // moustache
    ctx.fillRect(w * 0.20, h * 0.78, w * 0.60, h * 0.18); // beard
  }

  // per-character accessory tags (glasses, tikka, hood etc)
  if (["shah", "modi", "kejriwal", "dhruv"].includes(fighter.id)) {
    // glasses
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.18, h * 0.40, w * 0.24, h * 0.10);
    ctx.strokeRect(w * 0.58, h * 0.40, w * 0.24, h * 0.10);
  }
  if (fighter.id === "yogi") {
    // tilak
    ctx.fillStyle = "#c08040";
    ctx.fillRect(w * 0.48, h * 0.30, w * 0.04, h * 0.10);
  }
}

function drawPortrait(ctx, w, h, fighter) {
  // background gradient of accent
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, shade(fighter.palette.accent, 0.2));
  g.addColorStop(1, shade(fighter.palette.accent, -0.4));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // outfit block
  ctx.fillStyle = fighter.palette.outfit;
  ctx.fillRect(w * 0.15, h * 0.55, w * 0.70, h * 0.45);

  // face in center (reuse face draw scaled)
  const fw = w * 0.60, fh = h * 0.55;
  const fx = (w - fw) / 2, fy = h * 0.05;
  ctx.save();
  ctx.translate(fx, fy);
  // scale draw
  ctx.scale(fw / 256, fh / 256);
  drawFace(ctx, 256, 256, fighter);
  ctx.restore();

  // name banner
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, h - 34, w, 34);
  ctx.fillStyle = "#ffe27a";
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(fighter.name.toUpperCase(), w / 2, h - 12);
}

function shade(hex, amt) {
  const c = hex.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(c.slice(0, 2), 16) + Math.round(255 * amt)));
  const g = Math.max(0, Math.min(255, parseInt(c.slice(2, 4), 16) + Math.round(255 * amt)));
  const b = Math.max(0, Math.min(255, parseInt(c.slice(4, 6), 16) + Math.round(255 * amt)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function getFaceTexture(fighter) {
  if (faceCache.has(fighter.id)) return faceCache.get(fighter.id);
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  drawFace(ctx, size, size, fighter);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  faceCache.set(fighter.id, tex);
  return tex;
}

export function getPortraitDataURL(fighter) {
  if (portraitOverride[fighter.id]) return portraitOverride[fighter.id];
  if (portraitCache.has(fighter.id)) return portraitCache.get(fighter.id);
  const w = 240, h = 320;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  drawPortrait(ctx, w, h, fighter);
  const url = c.toDataURL("image/png");
  portraitCache.set(fighter.id, url);
  return url;
}

export function getThumbDataURL(fighter) {
  // Smaller portrait for grid.
  return getPortraitDataURL(fighter);
}
