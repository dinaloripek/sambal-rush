// Sambal Rush — screenshot presets. One file, one job: build the exact game
// state each screenshot shows, so the cover images are deterministic renders
// of the real game, never staged pictures.

import { createGame, startShift } from "./kitchen.js";

// A helper: put the cook somewhere useful and fill the carry by hand.
function place(g, x, y, carry) {
  g.player.x = x;
  g.player.y = y;
  g.carry = carry;
}

export function buildShotState(shot, seed) {
  const g = createGame(seed);
  if (shot === "start") {
    // Title screen over an empty kitchen.
    return g;
  }
  startShift(g);
  if (shot === "play") {
    // Mid-shift: three orders on the board, the cook carrying rice + egg,
    // a pot of Nasi Goreng halfway cooked, chili being chopped.
    g.time = 35;
    g.score = 20;
    g.served = 2;
    g.orders = [
      { id: 1, recipe: "nasi", left: 32, total: 45 },
      { id: 2, recipe: "mie", left: 18, total: 45 },
      { id: 3, recipe: "teh", left: 41, total: 45 },
    ];
    g.orderSeq = 3;
    g.pots[0] = { items: ["rice", "egg", "chili+"], cooking: 0.55, cookTotal: 3, recipe: "nasi", done: null };
    g.pots[1] = { items: [], cooking: 0, done: null };
    g.board = { item: "chili", progress: 0.6 };
    place(g, 640, 470, ["rice", "egg"]);
    g.message = "Nasi Goreng is cooking…";
    g.messageT = 99;
    return g;
  }
  if (shot === "rush") {
    // Late shift, service rush: four orders, one about to expire, one heart left.
    g.time = 132;
    g.score = 44;
    g.served = 5;
    g.combo = 3;
    g.hearts = 1;
    g.orders = [
      { id: 5, recipe: "sate", left: 7, total: 40 },
      { id: 6, recipe: "nasi", left: 22, total: 40 },
      { id: 7, recipe: "mie", left: 30, total: 40 },
      { id: 8, recipe: "teh", left: 38, total: 40 },
    ];
    g.orderSeq = 8;
    g.pots[0] = { items: [], cooking: 0, done: "sate" };
    g.pots[1] = { items: ["noodles", "chicken", "veg+"], cooking: 0.8, cookTotal: 3, recipe: "mie", done: null };
    g.board = { item: null, progress: 0 };
    place(g, 880, 470, ["dish:sate"]);
    g.message = "Sate Ayam is ready — serve it!";
    g.messageT = 99;
    return g;
  }
  if (shot === "win") {
    // Shift complete, target beaten.
    g.time = 150;
    g.score = 64;
    g.served = 7;
    g.combo = 4;
    g.screen = "win";
    g.winReason = "Target 50 beaten with 64 points.";
    place(g, 640, 470, []);
    return g;
  }
  return g;
}
