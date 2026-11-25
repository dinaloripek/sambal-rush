// Sambal Rush — bootstrap and game loop. One file, one job: size the canvas,
// read ?shot= and ?seed=, and run the loop.

import { VIEW_W, VIEW_H } from "./config.js";
import * as CONFIG from "./config.js";
import { createGame, update } from "./kitchen.js";
import { draw } from "./render.js";
import { keys, bindInput } from "./input.js";
import { buildShotState } from "./shots.js";

// The click handler reads the station table from here (no import cycle).
window.__sambalConfig = CONFIG;

const canvas = document.getElementById("game");
const statusEl = document.getElementById("status");
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(location.search);
const seed = Number(params.get("seed") || "1") || 1;
const shot = params.get("shot");

let g;
let shotMode = false;
if (shot) {
  g = buildShotState(shot, seed);
  shotMode = true;
  // A shot never advances: the screenshot is the state, frozen in time.
} else {
  g = createGame(seed);
}

let started = false;
bindInput(canvas, g, () => { started = true; });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shotMode && g.screen === "play") update(g, dt, keys);
  draw(g);
  if (started || g.screen !== "start") {
    statusEl.textContent = `Score ${g.score}, ${g.hearts} hearts, ${Math.max(0, 150 - Math.floor(g.time))} seconds left.`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
