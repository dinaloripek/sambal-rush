// Sambal Rush — the kitchen itself: state, orders, pots, chopping, serving.
// One file, one job: every rule of the game lives here; nothing here draws.

import {
  SHIFT_SECONDS, WIN_SCORE, MAX_HEARTS, MAX_CARRY, PLAYER_SPEED, FLOOR,
  INGREDIENTS, CHOPPED, RECIPES, RECIPE_ORDER, STATIONS,
} from "./config.js";
import { mulberry32, pickWeighted } from "./random.js";

export function createGame(seed) {
  const rng = mulberry32(seed);
  return {
    seed,
    rng,
    screen: "start", // start | play | win | lose
    time: 0,
    score: 0,
    hearts: MAX_HEARTS,
    combo: 0,
    player: { x: 640, y: 450, moving: false },
    carry: [], // raw ids, prepared ids ("veg+", "chili+") or "dish:<recipe>"
    orders: [], // { id, recipe, left, total }
    pots: [{ items: [], cooking: 0, done: null }, { items: [], cooking: 0, done: null }],
    board: { item: null, progress: 0 }, // chopping in progress
    nextOrderIn: 6,
    orderSeq: 0,
    message: "",
    messageT: 0,
    served: 0,
    expired: 0,
    winReason: "",
  };
}

export function startShift(g) {
  g.screen = "play";
  g.time = 0;
  g.score = 0;
  g.hearts = MAX_HEARTS;
  g.combo = 0;
  g.carry = [];
  g.orders = [];
  g.pots = [{ items: [], cooking: 0, done: null }, { items: [], cooking: 0, done: null }];
  g.board = { item: null, progress: 0 };
  g.nextOrderIn = 6;
  g.orderSeq = 0;
  g.served = 0;
  g.expired = 0;
  g.message = "Shift started — first order in 6s!";
  g.messageT = 3;
}

function say(g, text) {
  g.message = text;
  g.messageT = 2.5;
}

function recipeFor(items) {
  // The one recipe whose needs exactly equal these items (order-free).
  for (const id of RECIPE_ORDER) {
    const need = [...RECIPES[id].needs].sort().join(",");
    if ([...items].sort().join(",") === need) return id;
  }
  return null;
}

function canGrow(potItems, item) {
  // True when adding item keeps at least one recipe completable.
  const next = [...potItems, item];
  return RECIPE_ORDER.some((id) => {
    const need = [...RECIPES[id].needs];
    return next.every((it) => {
      const i = need.indexOf(it);
      if (i < 0) return false;
      need.splice(i, 1);
      return true;
    });
  });
}

export function spawnOrder(g) {
  const recipe = pickWeighted(g.rng, [["nasi", 3], ["mie", 3], ["sate", 2], ["teh", 2]]);
  const total = g.time > 100 ? 40 : 45;
  g.orders.push({ id: ++g.orderSeq, recipe, left: total, total });
}

export function nearestStation(g) {
  const p = g.player;
  let best = null;
  let bestD = 1e9;
  for (const s of STATIONS) {
    const cx = Math.max(s.x, Math.min(p.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(p.y, s.y + s.h));
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d < bestD) { bestD = d; best = s; }
  }
  return bestD <= 78 ? best : null;
}

function stationIngredients(id) {
  return Object.keys(INGREDIENTS).filter((k) => INGREDIENTS[k].from === id);
}

export function pickIngredient(g, n) {
  // Number keys 1..8 pick an ingredient, but only at the station that stocks it.
  const st = nearestStation(g);
  if (!st || (st.id !== "pantry" && st.id !== "fridge")) {
    say(g, "Stand by the pantry or fridge to grab ingredients.");
    return;
  }
  const stock = stationIngredients(st.id);
  const item = stock[n - 1];
  if (!item) return;
  if (g.carry.length >= MAX_CARRY) {
    say(g, "Hands full! Serve or bin something first.");
    return;
  }
  g.carry.push(item);
}

export function interact(g) {
  const st = nearestStation(g);
  if (!st) {
    say(g, "Walk up to a station first.");
    return;
  }
  if (st.id === "pantry" || st.id === "fridge") {
    say(g, "Press 1–8 to grab an ingredient here.");
    return;
  }
  if (st.id === "bin") {
    if (g.carry.length) { g.carry = []; say(g, "Tossed everything in the bin."); }
    else say(g, "Nothing to toss.");
    return;
  }
  if (st.id === "board") {
    if (g.board.item) { say(g, "Still chopping…"); return; }
    const i = g.carry.findIndex((it) => CHOPPED[it]);
    if (i < 0) { say(g, "Carry veg or chili to chop it here."); return; }
    g.board.item = g.carry.splice(i, 1)[0];
    g.board.progress = 0;
    return;
  }
  if (st.id === "stove") {
    // Take a finished dish first.
    const done = g.pots.find((p) => p.done);
    if (done) {
      if (g.carry.length >= MAX_CARRY) { say(g, "Hands full!"); return; }
      g.carry.push("dish:" + done.done);
      done.done = null;
      done.items = [];
      done.cooking = 0;
      return;
    }
    // Deposit carried items into a pot that can still become a recipe.
    const item = g.carry.find((it) => !it.startsWith("dish:"));
    if (!item) { say(g, "Carry ingredients to the stove."); return; }
    const pot = g.pots.find((p) => !p.done && p.cooking === 0 && canGrow(p.items, item));
    if (!pot) { say(g, "That doesn't fit either pot."); return; }
    g.carry.splice(g.carry.indexOf(item), 1);
    pot.items.push(item);
    const rid = recipeFor(pot.items);
    if (rid && RECIPES[rid].cook > 0) {
      pot.cooking = 0.0001; // cooking starts; progress 0..1
      pot.cookTotal = RECIPES[rid].cook;
      pot.recipe = rid;
    }
    return;
  }
  if (st.id === "plate") {
    serveAtPlate(g);
  }
}

function serveAtPlate(g) {
  // Es Teh assembles straight from tea + ice, no stove needed.
  const hasTea = g.carry.includes("tea");
  const hasIce = g.carry.includes("ice");
  if (hasTea && hasIce) {
    g.carry.splice(g.carry.indexOf("tea"), 1);
    g.carry.splice(g.carry.indexOf("ice"), 1);
    serveDish(g, "teh");
    return;
  }
  const i = g.carry.findIndex((it) => it.startsWith("dish:"));
  if (i < 0) {
    say(g, "Bring a finished dish — or tea + ice for Es Teh.");
    return;
  }
  const rid = g.carry.splice(i, 1)[0].slice(5);
  serveDish(g, rid);
}

function serveDish(g, rid) {
  const order = g.orders.find((o) => o.recipe === rid);
  if (!order) {
    say(g, RECIPES[rid].name + " is ready, but nobody ordered it!");
    return;
  }
  const tip = Math.min(5, Math.floor(order.left / 10));
  g.score += RECIPES[rid].price + tip;
  g.combo += 1;
  g.served += 1;
  g.orders.splice(g.orders.indexOf(order), 1);
  say(g, `Served ${RECIPES[rid].name}! +${RECIPES[rid].price + tip} pts` + (tip ? ` (tip +${tip})` : ""));
}

export function update(g, dt, keys) {
  if (g.screen !== "play") return;
  if (g.messageT > 0) g.messageT -= dt;

  // Move the cook.
  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("KeyW")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS")) dy += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    g.player.x += (dx / len) * PLAYER_SPEED * dt;
    g.player.y += (dy / len) * PLAYER_SPEED * dt;
    g.player.x = Math.max(FLOOR.x + 14, Math.min(FLOOR.x + FLOOR.w - 14, g.player.x));
    g.player.y = Math.max(FLOOR.y + 14, Math.min(FLOOR.y + FLOOR.h - 14, g.player.y));
    g.player.moving = true;
  } else {
    g.player.moving = false;
  }

  g.time += dt;

  // Orders arrive faster as the shift goes on.
  g.nextOrderIn -= dt;
  if (g.nextOrderIn <= 0 && g.orders.length < 4) {
    spawnOrder(g);
    g.nextOrderIn = Math.max(8, 13 - g.time / 25);
  }

  // Order timers.
  for (const o of [...g.orders]) {
    o.left -= dt;
    if (o.left <= 0) {
      g.orders.splice(g.orders.indexOf(o), 1);
      g.hearts -= 1;
      g.combo = 0;
      g.expired += 1;
      say(g, `Order expired! ${RECIPES[o.recipe].name} walked out.`);
      if (g.hearts <= 0) {
        g.screen = "lose";
        g.winReason = "Too many orders walked out.";
        return;
      }
    }
  }

  // Cooking.
  for (const p of g.pots) {
    if (p.cooking > 0 && p.recipe) {
      p.cooking += dt / p.cookTotal;
      if (p.cooking >= 1) {
        p.done = p.recipe;
        p.recipe = null;
        p.cooking = 0;
        say(g, RECIPES[p.done].name + " is ready — grab it!");
      }
    }
  }

  // Chopping.
  if (g.board.item) {
    g.board.progress += dt / 1;
    if (g.board.progress >= 1) {
      const done = CHOPPED[g.board.item];
      g.carry.push(done);
      g.board.item = null;
      g.board.progress = 0;
      say(g, "Chopped! " + done);
    }
  }

  // Shift end.
  if (g.time >= SHIFT_SECONDS) {
    if (g.score >= WIN_SCORE) {
      g.screen = "win";
      g.winReason = `Target ${WIN_SCORE} beaten with ${g.score} points.`;
    } else {
      g.screen = "lose";
      g.winReason = `Only ${g.score} of ${WIN_SCORE} points.`;
    }
  }
}

export function stationLabel(g) {
  const st = nearestStation(g);
  return st ? st.label : "";
}
