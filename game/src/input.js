// Sambal Rush — keyboard and mouse. One file, one job: turn presses and
// clicks into game actions, and hand the held keys to the kitchen.

import { interact, pickIngredient, startShift } from "./kitchen.js";

export const keys = new Set();

export function bindInput(canvas, g, onFirstStart) {
  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === "Enter") {
      if (g.screen !== "play") startShift(g);
      onFirstStart();
      return;
    }
    if (g.screen !== "play") return;
    if (e.code === "KeyE" || e.code === "Space") interact(g);
    const n = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8"].indexOf(e.code);
    if (n >= 0) pickIngredient(g, n + 1);
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));

  // Click: start from a screen, or use the station the cook stands by.
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (canvas.width / r.width);
    const y = (e.clientY - r.top) * (canvas.height / r.height);
    if (g.screen !== "play") {
      startShift(g);
      onFirstStart();
      return;
    }
    // Clicking a pantry/fridge chip grabs that ingredient.
    const { STATIONS, INGREDIENTS } = window.__sambalConfig;
    for (const s of STATIONS) {
      if (s.id !== "pantry" && s.id !== "fridge") continue;
      const stock = Object.keys(INGREDIENTS).filter((k) => INGREDIENTS[k].from === s.id);
      stock.forEach((id, i) => {
        const cx = s.x + 12 + i * 65;
        if (x >= cx && x <= cx + 60 && y >= s.y + 56 && y <= s.y + 88) {
          pickIngredient(g, i + 1);
        }
      });
    }
    interact(g);
  });
}
