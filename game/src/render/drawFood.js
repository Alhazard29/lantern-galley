// Food, drawn by hand in code: each ingredient whole, chopped, cooked and burnt, and
// the bowl seen from above with whatever has been plated in it so far.

import { INGREDIENTS, nextStepOf, recipeMatching } from '../recipes.js';

function blob(ctx, x, y, rx, ry, fill, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function outline(ctx, colour, width = 1.5) {
  ctx.lineWidth = width;
  ctx.strokeStyle = colour;
  ctx.stroke();
}

// ---------------------------------------------------------------- noodles

function drawNoodleNest(ctx, radius, strand, shade) {
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.ellipse(Math.cos(i * 1.9) * radius * 0.16, Math.sin(i * 2.3) * radius * 0.16, radius * (0.95 - i * 0.07), radius * (0.55 + (i % 3) * 0.12), i * 0.62, 0, Math.PI * 2);
    ctx.lineWidth = radius * 0.2;
    ctx.strokeStyle = shade;
    ctx.stroke();
    ctx.lineWidth = radius * 0.12;
    ctx.strokeStyle = strand;
    ctx.stroke();
  }
}

function drawDryNoodles(ctx) {
  blob(ctx, 0, 0, 19, 15, '#d8c48a');
  drawNoodleNest(ctx, 15, '#efe1b3', '#b9a46a');
}

function drawBoiledNoodles(ctx) {
  drawNoodleNest(ctx, 19, '#f8dc86', '#c98f2c');
}

// ---------------------------------------------------------------- mushroom

function drawWholeMushroom(ctx) {
  ctx.beginPath();
  ctx.roundRect(-6, -3, 12, 17, 5);
  ctx.fillStyle = '#f1e2c6';
  ctx.fill();
  outline(ctx, '#b79c78');
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.bezierCurveTo(-18, -22, 18, -22, 18, 0);
  ctx.bezierCurveTo(10, 4, -10, 4, -18, 0);
  ctx.fillStyle = '#b4764a';
  ctx.fill();
  outline(ctx, '#7c4a2b');
  blob(ctx, -7, -9, 3, 2, '#d59a6c');
  blob(ctx, 5, -11, 2.5, 1.8, '#d59a6c');
}

function drawMushroomSlice(ctx, x, y, turn, cap, flesh) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.bezierCurveTo(-9, -11, 9, -11, 9, 0);
  ctx.lineTo(3.5, 0);
  ctx.lineTo(3.5, 8);
  ctx.lineTo(-3.5, 8);
  ctx.lineTo(-3.5, 0);
  ctx.closePath();
  ctx.fillStyle = flesh;
  ctx.fill();
  outline(ctx, cap, 2.2);
  ctx.restore();
}

function drawMushroomSlices(ctx, cap, flesh) {
  drawMushroomSlice(ctx, -10, -4, -0.5, cap, flesh);
  drawMushroomSlice(ctx, 9, -6, 0.6, cap, flesh);
  drawMushroomSlice(ctx, -3, 8, 0.15, cap, flesh);
  drawMushroomSlice(ctx, 12, 9, -0.9, cap, flesh);
}

// ---------------------------------------------------------------- greens

function drawGreensBunch(ctx) {
  for (const [x, turn] of [[-9, -0.45], [9, 0.45], [0, 0]]) {
    ctx.save();
    ctx.translate(x, -2);
    ctx.rotate(turn);
    blob(ctx, 0, -8, 8, 13, '#4f9f36');
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, -16);
    outline(ctx, '#9bd86b', 2);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.roundRect(-8, 3, 16, 14, 6);
  ctx.fillStyle = '#eef6d8';
  ctx.fill();
  outline(ctx, '#a9c98a');
}

function drawGreensRibbons(ctx) {
  const ribbons = [[-11, -7, 0.4], [4, -10, -0.3], [12, 0, 1.1], [-6, 4, -0.9], [5, 8, 0.2], [-13, 9, 1.4], [0, -1, 0.9]];
  ribbons.forEach(([x, y, turn], i) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turn);
    ctx.beginPath();
    ctx.roundRect(-8, -3, 16, 6, 3);
    ctx.fillStyle = i % 2 ? '#8fd45a' : '#4fa238';
    ctx.fill();
    outline(ctx, '#2f7426', 1);
    ctx.restore();
  });
}

// ---------------------------------------------------------------- egg

function drawWholeEgg(ctx) {
  blob(ctx, 0, 0, 12, 16, '#f6ead2');
  outline(ctx, '#c9b48e');
  blob(ctx, -4, -6, 3, 5, '#fffaf0', -0.4);
}

function drawFriedEgg(ctx) {
  ctx.beginPath();
  ctx.moveTo(-18, -2);
  ctx.bezierCurveTo(-20, -16, -2, -20, 6, -15);
  ctx.bezierCurveTo(20, -18, 22, -2, 17, 6);
  ctx.bezierCurveTo(18, 18, 0, 19, -6, 15);
  ctx.bezierCurveTo(-18, 18, -22, 6, -18, -2);
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  outline(ctx, '#e6d2a8');
  blob(ctx, 0, 0, 8.5, 8.5, '#f7a81c');
  outline(ctx, '#d98510', 1.2);
  blob(ctx, -3, -3, 2.6, 2, '#ffe08a');
}

// ---------------------------------------------------------------- prawn

function drawPrawn(ctx, shell, stripe, tail) {
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, 11, Math.PI * 0.25, Math.PI * 1.75);
  ctx.lineWidth = 11;
  ctx.strokeStyle = stripe;
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.strokeStyle = shell;
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.45 + i * 0.27);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7);
    ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15);
    outline(ctx, stripe, 1.6);
  }
  ctx.beginPath();
  ctx.moveTo(7, -9);
  ctx.lineTo(19, -15);
  ctx.lineTo(17, -4);
  ctx.closePath();
  ctx.fillStyle = tail;
  ctx.fill();
  blob(ctx, 8, 9, 1.8, 1.8, '#20262b');
}

// ---------------------------------------------------------------- chili

function drawWholeChili(ctx) {
  ctx.beginPath();
  ctx.moveTo(-15, 8);
  ctx.bezierCurveTo(-6, 12, 10, 4, 14, -8);
  ctx.bezierCurveTo(8, -6, -4, 0, -15, 8);
  ctx.fillStyle = '#e03426';
  ctx.fill();
  outline(ctx, '#9c1c14');
  ctx.beginPath();
  ctx.moveTo(13, -7);
  ctx.quadraticCurveTo(17, -13, 15, -17);
  outline(ctx, '#3f8a2c', 3.5);
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.quadraticCurveTo(2, 3, 9, -4);
  outline(ctx, '#ff8266', 1.5);
}

function drawChiliRings(ctx) {
  for (const [x, y, r] of [[-9, -6, 6], [5, -8, 5], [10, 4, 6], [-4, 6, 5.5], [-13, 6, 4]]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    outline(ctx, '#e03426', 3.4);
    blob(ctx, x - 1, y, 0.9, 0.9, '#ffe9a8');
    blob(ctx, x + 1.4, y + 1, 0.9, 0.9, '#ffe9a8');
  }
}

// ---------------------------------------------------------------- burnt

function drawBurnt(ctx) {
  blob(ctx, 0, 2, 16, 12, '#22201f');
  blob(ctx, -6, -2, 6, 5, '#3a3431');
  blob(ctx, 7, 4, 5, 4, '#3a3431');
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.bezierCurveTo(-10, -18, 2, -20, -4, -28);
  ctx.moveTo(6, -9);
  ctx.bezierCurveTo(0, -16, 12, -19, 6, -26);
  outline(ctx, 'rgba(200,200,200,0.55)', 2);
}

const DRAW_STAGE = {
  noodles: { raw: drawDryNoodles, ready: drawBoiledNoodles },
  mushroom: {
    raw: drawWholeMushroom,
    chopped: (ctx) => drawMushroomSlices(ctx, '#a7693f', '#f3e6cf'),
    ready: (ctx) => drawMushroomSlices(ctx, '#6f3f1f', '#d9a35f'),
  },
  greens: { raw: drawGreensBunch, ready: drawGreensRibbons },
  egg: { raw: drawWholeEgg, ready: drawFriedEgg },
  prawn: {
    raw: (ctx) => drawPrawn(ctx, '#9fb3c2', '#6f8596', '#8497a6'),
    ready: (ctx) => drawPrawn(ctx, '#ff8a63', '#ffe1d2', '#ff6a45'),
  },
  chili: { raw: drawWholeChili, ready: drawChiliRings },
};

/** 'raw', 'chopped' (cut but still to cook), 'ready' or 'burnt'. */
export function stageOf(item) {
  if (item.burnt) return 'burnt';
  if (item.stepsDone === 0) return 'raw';
  return nextStepOf(item) === null ? 'ready' : 'chopped';
}

/** Draws one ingredient in a given stage, centred on (x, y). */
export function drawIngredientStage(ctx, id, stage, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (stage === 'burnt') drawBurnt(ctx);
  else (DRAW_STAGE[id][stage] ?? DRAW_STAGE[id].raw)(ctx);
  ctx.restore();
}

export function drawIngredient(ctx, item, x, y, scale = 1) {
  drawIngredientStage(ctx, item.id, stageOf(item), x, y, scale);
}

/** An ingredient part-way through chopping: the cut pile grows as the whole one shrinks. */
export function drawHalfChopped(ctx, item, strokes, strokesNeeded, x, y, scale = 1) {
  const cut = strokes / strokesNeeded;
  const cutStage = INGREDIENTS[item.id].steps.length > 1 ? 'chopped' : 'ready';
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 40 * scale, y - 34 * scale, 80 * scale * cut, 68 * scale);
  ctx.clip();
  drawIngredientStage(ctx, item.id, cutStage, x, y, scale);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 40 * scale + 80 * scale * cut, y - 34 * scale, 80 * scale * (1 - cut), 68 * scale);
  ctx.clip();
  drawIngredientStage(ctx, item.id, 'raw', x + 6 * scale * cut, y, scale);
  ctx.restore();
}

// ---------------------------------------------------------------- the bowl

const TOPPING_SLOTS = [-2.5, -0.6, 1.35, 2.9];

function drawBowlDish(ctx, radius) {
  blob(ctx, 3, 5, radius * 1.02, radius * 1.02, 'rgba(0,0,0,0.28)');
  blob(ctx, 0, 0, radius, radius, '#1c6f78');
  outline(ctx, '#0f4a52', 2);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    blob(ctx, Math.cos(a) * radius * 0.9, Math.sin(a) * radius * 0.9, radius * 0.04, radius * 0.04, '#bfeee6');
  }
  blob(ctx, 0, 0, radius * 0.8, radius * 0.8, '#fbf3df');
  outline(ctx, '#d9c9a6', 1.5);
}

function drawBroth(ctx, radius) {
  blob(ctx, 0, 0, radius * 0.74, radius * 0.74, '#eab75a');
  outline(ctx, '#c98f2c', 1.5);
  blob(ctx, -radius * 0.42, radius * 0.3, radius * 0.07, radius * 0.07, '#f8dc86');
  blob(ctx, radius * 0.5, -radius * 0.18, radius * 0.05, radius * 0.05, '#f8dc86');
  blob(ctx, radius * 0.2, radius * 0.52, radius * 0.045, radius * 0.045, '#f8dc86');
}

function drawSesame(ctx, radius) {
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4;
    const d = radius * (0.15 + ((i * 37) % 50) / 100);
    blob(ctx, Math.cos(a) * d, Math.sin(a) * d, 1.8, 1, '#fffaf0', a);
  }
}

/** A bowl from above holding `contents` (ingredient ids). A finished recipe gets its garnish and a glow. */
export function drawBowl(ctx, contents, x, y, radius, { glow = 0 } = {}) {
  const complete = recipeMatching(contents) !== null;
  ctx.save();
  ctx.translate(x, y);
  if (complete && glow > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.22, 0, Math.PI * 2);
    ctx.lineWidth = radius * 0.16;
    ctx.strokeStyle = 'rgba(255, 214, 110, ' + (0.45 + 0.4 * glow) + ')';
    ctx.stroke();
  }
  drawBowlDish(ctx, radius);
  const hasNoodles = contents.includes('noodles');
  if (hasNoodles) {
    drawBroth(ctx, radius);
    drawIngredientStage(ctx, 'noodles', 'ready', 0, 0, radius / 30);
  }
  const toppings = contents.filter((id) => id !== 'noodles');
  const spread = hasNoodles ? radius * 0.4 : toppings.length === 1 ? 0 : radius * 0.36;
  const size = (radius / 44) * (hasNoodles ? 0.8 : 0.95);
  toppings.forEach((id, i) => {
    const a = TOPPING_SLOTS[i % TOPPING_SLOTS.length];
    drawIngredientStage(ctx, id, 'ready', Math.cos(a) * spread, Math.sin(a) * spread, size);
  });
  if (complete) drawSesame(ctx, radius);
  ctx.restore();
}
