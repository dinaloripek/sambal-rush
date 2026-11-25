// Sambal Rush — shared constants: canvas, kitchen layout, recipes, colours.
// One file, one job: every number the other files need lives here.

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const SHIFT_SECONDS = 150;
export const WIN_SCORE = 50;
export const MAX_HEARTS = 3;
export const MAX_CARRY = 3;
export const PLAYER_SPEED = 300;

// The floor the cook walks on (stations sit around it).
export const FLOOR = { x: 40, y: 300, w: 1200, h: 300 };

// Ingredients: id, label, colour, where it comes from, needs chopping?
export const INGREDIENTS = {
  rice:    { label: "Rice",    color: "#f5efe0", from: "pantry" },
  noodles: { label: "Noodles", color: "#f2c14e", from: "pantry" },
  egg:     { label: "Egg",     color: "#fff3b0", from: "fridge" },
  chicken: { label: "Chicken", color: "#e07856", from: "fridge" },
  veg:     { label: "Veg",     color: "#7bc96f", from: "fridge", chop: true },
  chili:   { label: "Chili",   color: "#d7263d", from: "fridge", chop: true },
  tea:     { label: "Tea",     color: "#b08954", from: "fridge" },
  ice:     { label: "Ice",     color: "#a8d8ea", from: "fridge" },
};

// A prepared ingredient is the chopped form of a raw one.
export const CHOPPED = { veg: "veg+", chili: "chili+" };
export const PREP_LABEL = { "veg+": "Chopped veg", "chili+": "Chopped chili" };

// Recipes: id, name, colour, the prepared items a pot needs, cook seconds (0 = no stove).
export const RECIPES = {
  nasi: { name: "Nasi Goreng", color: "#e8a33d", needs: ["rice", "egg", "chili+"], cook: 3, price: 10 },
  mie:  { name: "Mie Goreng",  color: "#f2c14e", needs: ["noodles", "chicken", "veg+"], cook: 3, price: 10 },
  sate: { name: "Sate Ayam",   color: "#e07856", needs: ["chicken", "chili+"], cook: 2, price: 10 },
  teh:  { name: "Es Teh",      color: "#b08954", needs: ["tea", "ice"], cook: 0, price: 10 },
};
export const RECIPE_ORDER = ["nasi", "mie", "sate", "teh"];

// Stations: id, label, rect, what the cook does there.
export const STATIONS = [
  { id: "pantry", label: "PANTRY", sub: "rice · noodles", x: 40,  y: 214, w: 300, h: 96 },
  { id: "fridge", label: "FRIDGE", sub: "egg · chicken · veg · chili · tea · ice", x: 820, y: 214, w: 420, h: 96 },
  { id: "stove",  label: "STOVE",  sub: "cook a full pot", x: 40,  y: 616, w: 340, h: 144 },
  { id: "board",  label: "CHOPPING BOARD", sub: "chop veg & chili", x: 470, y: 616, w: 340, h: 144 },
  { id: "plate",  label: "SERVE",  sub: "plate & serve orders", x: 900, y: 616, w: 340, h: 144 },
  { id: "bin",    label: "BIN",    sub: "toss what you carry", x: 580, y: 214, w: 120, h: 96 },
];

export const COLORS = {
  paper: "#f7ead7",
  floor: "#e8cfa8",
  floorLine: "#d9b98a",
  wall: "#2b1a12",
  ink: "#2b1a12",
  muted: "#7a5c42",
  red: "#d7263d",
  green: "#2e7d32",
  gold: "#e8a33d",
  cream: "#fff8ec",
};
