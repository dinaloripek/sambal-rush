// Sambal Rush — everything the eye sees. One file, one job: draw the kitchen,
// the orders, the cook and the screens. Nothing here changes game state.

import {
  VIEW_W, VIEW_H, SHIFT_SECONDS, WIN_SCORE, MAX_HEARTS,
  INGREDIENTS, CHOPPED, PREP_LABEL, RECIPES, RECIPE_ORDER, STATIONS, FLOOR, COLORS,
} from "./config.js";
import { nearestStation } from "./kitchen.js";

const ctx = () => document.getElementById("game").getContext("2d");

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function text(c, s, x, y, size, color, weight = "bold", align = "left") {
  c.fillStyle = color;
  c.font = `${weight} ${size}px system-ui, sans-serif`;
  c.textAlign = align;
  c.textBaseline = "alphabetic";
  c.fillText(s, x, y);
}

function chip(c, x, y, w, h, label, color, sub) {
  rr(c, x, y, w, h, 8);
  c.fillStyle = color;
  c.fill();
  c.strokeStyle = "rgba(43,26,18,0.35)";
  c.lineWidth = 1;
  c.stroke();
  text(c, label, x + w / 2, y + h / 2 + (sub ? 1 : 6), sub ? 15 : 17, COLORS.ink, "bold", "center");
  if (sub) text(c, sub, x + w / 2, y + h - 8, 11, COLORS.muted, "normal", "center");
}

export function itemLabel(id) {
  if (id.startsWith("dish:")) return RECIPES[id.slice(5)].name;
  if (PREP_LABEL[id]) return PREP_LABEL[id];
  return INGREDIENTS[id].label;
}

export function itemColor(id) {
  if (id.startsWith("dish:")) return RECIPES[id.slice(5)].color;
  if (id === "veg+") return INGREDIENTS.veg.color;
  if (id === "chili+") return INGREDIENTS.chili.color;
  return INGREDIENTS[id].color;
}

function drawStation(c, g, s) {
  const near = nearestStation(g) === s;
  rr(c, s.x, s.y, s.w, s.h, 12);
  c.fillStyle = near ? "#ffe9b8" : COLORS.cream;
  c.fill();
  c.lineWidth = near ? 4 : 2;
  c.strokeStyle = near ? COLORS.red : COLORS.ink;
  c.stroke();
  text(c, s.label, s.x + 14, s.y + 26, 17, COLORS.ink);
  text(c, s.sub, s.x + 14, s.y + 46, 12, COLORS.muted, "normal");

  // Ingredient chips on pantry / fridge, numbered for the keyboard.
  if (s.id === "pantry" || s.id === "fridge") {
    const stock = Object.keys(INGREDIENTS).filter((k) => INGREDIENTS[k].from === s.id);
    let x = s.x + 12;
    stock.forEach((id, i) => {
      const w = 60;
      rr(c, x, s.y + 56, w, 32, 7);
      c.fillStyle = INGREDIENTS[id].color;
      c.fill();
      c.strokeStyle = "rgba(43,26,18,0.4)";
      c.lineWidth = 1;
      c.stroke();
      text(c, `${i + 1} ${INGREDIENTS[id].label}`, x + w / 2, s.y + 77, 12, COLORS.ink, "bold", "center");
      x += w + 5;
    });
  }

  // Stove pots.
  if (s.id === "stove") {
    g.pots.forEach((pot, i) => {
      const px = s.x + 24 + i * 150;
      const py = s.y + 58;
      rr(c, px, py, 130, 74, 10);
      c.fillStyle = "#3a3a3a";
      c.fill();
      if (pot.done) {
        text(c, "🍲 " + RECIPES[pot.done].name, px + 65, py + 32, 14, "#fff", "bold", "center");
        text(c, "READY — press E", px + 65, py + 56, 12, "#ffd54f", "bold", "center");
      } else if (pot.cooking > 0) {
        text(c, RECIPES[pot.recipe].name, px + 65, py + 26, 12, "#fff", "bold", "center");
        c.fillStyle = "#ffd54f";
        c.fillRect(px + 10, py + 40, 110 * Math.min(1, pot.cooking), 10);
        text(c, "Cooking… " + Math.round(pot.cooking * 100) + "%", px + 65, py + 66, 12, "#ffd54f", "bold", "center");
      } else if (pot.items.length) {
        text(c, pot.items.map(itemLabel).join(" + "), px + 65, py + 32, 13, "#fff", "bold", "center");
        text(c, "add more, or wait", px + 65, py + 56, 12, "#bbb", "normal", "center");
      } else {
        text(c, "Pot " + (i + 1) + " — empty", px + 65, py + 40, 13, "#bbb", "normal", "center");
      }
    });
  }

  // Chopping board.
  if (s.id === "board") {
    const bx = s.x + 24;
    const by = s.y + 58;
    rr(c, bx, by, 292, 74, 10);
    c.fillStyle = "#8d6e63";
    c.fill();
    if (g.board.item) {
      c.fillStyle = "#ffd54f";
      c.fillRect(bx + 10, by + 48, 272 * Math.min(1, g.board.progress), 10);
      text(c, "Chopping " + INGREDIENTS[g.board.item].label + "…", bx + 146, by + 32, 14, "#fff", "bold", "center");
    } else {
      text(c, "Bring veg or chili — press E to chop", bx + 146, by + 42, 13, "#fff", "normal", "center");
    }
  }

  // Serve window.
  if (s.id === "plate") {
    const px = s.x + 24;
    const py = s.y + 58;
    rr(c, px, py, 292, 74, 10);
    c.fillStyle = "#2e7d32";
    c.fill();
    text(c, "🍽  SERVE HERE — press E", px + 146, py + 32, 15, "#fff", "bold", "center");
    text(c, "dish, or tea + ice for Es Teh", px + 146, py + 56, 12, "#dcedc8", "normal", "center");
  }
}

function drawOrders(c, g) {
  text(c, "ORDER BOARD", 48, 96, 15, COLORS.muted);
  if (!g.orders.length) {
    text(c, "No orders yet — the lunch rush is coming…", 48, 140, 20, COLORS.muted, "normal");
    return;
  }
  g.orders.forEach((o, i) => {
    const x = 48 + i * 300;
    const w = 284;
    const r = RECIPES[o.recipe];
    rr(c, x, 104, w, 58, 10);
    c.fillStyle = COLORS.cream;
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = o.left < 12 ? COLORS.red : COLORS.ink;
    c.stroke();
    rr(c, x, 104, w, 58, 10);
    c.save();
    c.clip();
    c.fillStyle = r.color;
    c.fillRect(x, 104, 10, 58);
    c.restore();
    text(c, `#${o.id}  ${r.name}`, x + 22, 130, 17, COLORS.ink);
    text(c, r.needs.map((n) => (PREP_LABEL[n] || INGREDIENTS[n].label)).join(" + "), x + 22, 152, 12, COLORS.muted, "normal");
    // Timer bar.
    c.fillStyle = o.left < 12 ? COLORS.red : COLORS.green;
    c.fillRect(x, 156, w * Math.max(0, o.left / o.total), 6);
    text(c, Math.ceil(o.left) + "s", x + w - 12, 130, 15, o.left < 12 ? COLORS.red : COLORS.muted, "bold", "right");
  });
}

function drawPlayer(c, g) {
  const p = g.player;
  // Shadow.
  c.fillStyle = "rgba(43,26,18,0.25)";
  c.beginPath();
  c.ellipse(p.x, p.y + 20, 22, 8, 0, 0, Math.PI * 2);
  c.fill();
  // Body + chef hat.
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(p.x, p.y, 20, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = COLORS.ink;
  c.lineWidth = 2;
  c.stroke();
  c.fillStyle = "#fff";
  rr(c, p.x - 14, p.y - 34, 28, 14, 7);
  c.fill();
  c.stroke();
  c.fillStyle = COLORS.ink;
  c.beginPath();
  c.arc(p.x - 7, p.y - 2, 2.5, 0, Math.PI * 2);
  c.arc(p.x + 7, p.y - 2, 2.5, 0, Math.PI * 2);
  c.fill();
  // Carry tray above the cook.
  g.carry.forEach((id, i) => {
    const cx = p.x - (g.carry.length - 1) * 18 + i * 36;
    rr(c, cx - 15, p.y - 66, 30, 22, 6);
    c.fillStyle = itemColor(id);
    c.fill();
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1;
    c.stroke();
    text(c, itemLabel(id).slice(0, 4), cx, p.y - 51, 9, COLORS.ink, "bold", "center");
  });
}

function drawHud(c, g) {
  c.fillStyle = COLORS.wall;
  c.fillRect(0, 0, VIEW_W, 64);
  text(c, "🍜 SAMBAL RUSH", 24, 40, 26, "#ffd54f");
  text(c, "a warung cooking game", 240, 40, 15, "#d7ccc8", "normal");
  text(c, `SCORE ${g.score} / ${WIN_SCORE}`, 560, 40, 20, "#fff", "bold", "center");
  // Hearts.
  for (let i = 0; i < MAX_HEARTS; i++) {
    text(c, i < g.hearts ? "❤" : "♡", 700 + i * 30, 40, 22, i < g.hearts ? COLORS.red : "#8d6e63", "bold", "center");
  }
  const left = Math.max(0, SHIFT_SECONDS - g.time);
  const mm = Math.floor(left / 60);
  const ss = String(Math.floor(left % 60)).padStart(2, "0");
  text(c, `⏱ ${mm}:${ss}`, 900, 40, 20, left < 30 ? "#ff8a80" : "#fff", "bold", "center");
  text(c, `served ${g.served}`, 1080, 40, 16, "#d7ccc8", "normal", "center");
  if (g.combo >= 2) text(c, `COMBO ×${g.combo}`, 1200, 40, 16, "#ffd54f", "bold", "right");
}

function drawPrompt(c, g) {
  const st = nearestStation(g);
  let line = "WASD / arrows to move · 1–8 grab ingredients · E use station · Enter start";
  if (st) {
    if (st.id === "pantry" || st.id === "fridge") line = `At ${st.label} — press 1–8 to grab: ` + Object.keys(INGREDIENTS).filter((k) => INGREDIENTS[k].from === st.id).map((k, i) => `${i + 1}=${INGREDIENTS[k].label}`).join("  ");
    else if (st.id === "stove") line = "At STOVE — E: add ingredient / take finished dish";
    else if (st.id === "board") line = "At CHOPPING BOARD — E: chop veg or chili (1s)";
    else if (st.id === "plate") line = "At SERVE — E: serve a finished dish, or tea + ice for Es Teh";
    else if (st.id === "bin") line = "At BIN — E: toss everything you carry";
  }
  text(c, line, VIEW_W / 2, VIEW_H - 14, 15, COLORS.muted, "normal", "center");
  if (g.messageT > 0) {
    c.fillStyle = "rgba(43,26,18,0.85)";
    const w = c.measureText(g.message).width + 36;
    rr(c, VIEW_W / 2 - w / 2, 170, w, 34, 17);
    c.fill();
    text(c, g.message, VIEW_W / 2, 193, 15, "#fff", "bold", "center");
  }
}

function overlay(c, title, lines, accent) {
  c.fillStyle = "rgba(29,19,12,0.72)";
  c.fillRect(0, 0, VIEW_W, VIEW_H);
  rr(c, 250, 150, 780, 470, 18);
  c.fillStyle = COLORS.paper;
  c.fill();
  c.lineWidth = 3;
  c.strokeStyle = accent;
  c.stroke();
  text(c, title, 640, 235, 46, accent, "bold", "center");
  let y = 295;
  for (const ln of lines) {
    text(c, ln, 640, y, 20, COLORS.ink, "normal", "center");
    y += 30;
  }
}

export function draw(g) {
  const c = ctx();
  // Wall + floor.
  c.fillStyle = COLORS.wall;
  c.fillRect(0, 0, VIEW_W, VIEW_H);
  c.fillStyle = COLORS.floor;
  c.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);
  c.strokeStyle = COLORS.floorLine;
  c.lineWidth = 1;
  for (let x = FLOOR.x; x <= FLOOR.x + FLOOR.w; x += 60) {
    c.beginPath(); c.moveTo(x, FLOOR.y); c.lineTo(x, FLOOR.y + FLOOR.h); c.stroke();
  }
  for (let y = FLOOR.y; y <= FLOOR.y + FLOOR.h; y += 60) {
    c.beginPath(); c.moveTo(FLOOR.x, y); c.lineTo(FLOOR.x + FLOOR.w, y); c.stroke();
  }
  // Top strip behind the order board.
  c.fillStyle = COLORS.paper;
  c.fillRect(0, 64, VIEW_W, 124);

  drawHud(c, g);
  drawOrders(c, g);
  for (const s of STATIONS) drawStation(c, g, s);
  drawPlayer(c, g);
  drawPrompt(c, g);

  if (g.screen === "start") {
    overlay(c, "🍜 SAMBAL RUSH", [
      "You run a warung kitchen. Orders land on the board —",
      "grab ingredients, chop, cook, and serve before the timer runs out.",
      "",
      "1–8 grab · E use a station · WASD / arrows move · Enter start",
      "Nasi Goreng: rice + egg + chopped chili",
      "Mie Goreng: noodles + chicken + chopped veg",
      "Sate Ayam: chicken + chopped chili  ·  Es Teh: tea + ice (no stove!)",
      "",
      "Score 50 in a 150-second shift to win. Three strikes and the shift ends.",
    ], COLORS.red);
    text(c, "Press Enter or click to start", 640, 580, 22, "#ffd54f", "bold", "center");
  } else if (g.screen === "win") {
    overlay(c, "SHIFT COMPLETE!", [
      g.winReason,
      `Served ${g.served} dishes · ${g.expired} orders walked out · best combo ×${g.combo}`,
      "",
      "Press Enter to run another shift.",
    ], COLORS.green);
  } else if (g.screen === "lose") {
    overlay(c, "SHIFT OVER", [
      g.winReason,
      `Score ${g.score} / ${WIN_SCORE} · served ${g.served} dishes`,
      "",
      "Press Enter to try again.",
    ], COLORS.red);
  }
}
